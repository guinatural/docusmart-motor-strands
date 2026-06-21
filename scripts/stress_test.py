"""
Teste de carga (stress) do DocuSmart — só stdlib, sem dependências.

Dispara requisições concorrentes contra os endpoints de leitura e o /chat,
medindo latência (p50/p90/p99), status HTTP e throughput (RPS). Útil para ver
os widgets do CloudWatch reagirem (Lambda, API Gateway, DynamoDB, Bedrock).

⚠️  O /chat chama o Bedrock (custa por token) e pode sofrer throttle sob alta
    concorrência. Comece pequeno.

Exemplos:
  # 30s, 10 conexões, endpoints de leitura + chat (padrão)
  python3 scripts/stress_test.py

  # 1000 requisições, 25 conexões, só leitura (sem custo de Bedrock)
  python3 scripts/stress_test.py --requests 1000 --concurrency 25 --endpoints sinistros,detalhe

  # carga de chat por 60s
  python3 scripts/stress_test.py --duration 60 --concurrency 8 --endpoints chat
"""
import argparse
import json
import random
import statistics
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

BASE_DEFAULT = "https://8ntra04xyh.execute-api.us-east-1.amazonaws.com/prod"

PERGUNTAS = [
    "Resuma os sinistros mais recentes.",
    "Quais sinistros estão na fila de revisão?",
    "Quantos sinistros foram aprovados automaticamente?",
    "Qual o valor médio dos orçamentos?",
    "Explique por que um sinistro vai para análise humana.",
]


def _req(method, url, body=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            r.read()
            return r.status, (time.perf_counter() - t0) * 1000
    except urllib.error.HTTPError as e:
        return e.code, (time.perf_counter() - t0) * 1000
    except Exception:
        return 0, (time.perf_counter() - t0) * 1000  # 0 = falha de conexão/timeout


def coletar_ids(base):
    try:
        with urllib.request.urlopen(f"{base}/sinistros", timeout=15) as r:
            data = json.loads(r.read())
        itens = data.get("sinistros", data) if isinstance(data, dict) else data
        return [s.get("id") for s in itens if isinstance(s, dict) and s.get("id")]
    except Exception:
        return []


def fazer_chamada(base, endpoint, ids):
    if endpoint == "sinistros":
        return ("GET /sinistros", *_req("GET", f"{base}/sinistros"))
    if endpoint == "detalhe" and ids:
        return ("GET /sinistro/{id}", *_req("GET", f"{base}/sinistro/{random.choice(ids)}"))
    if endpoint == "chat":
        body = {"message": random.choice(PERGUNTAS), "session_id": f"stress-{random.randint(1, 9999)}"}
        return ("POST /chat", *_req("POST", f"{base}/chat", body))
    return ("GET /sinistros", *_req("GET", f"{base}/sinistros"))


def pct(valores, p):
    if not valores:
        return 0.0
    k = max(0, min(len(valores) - 1, int(round((p / 100) * (len(valores) - 1)))))
    return sorted(valores)[k]


def main():
    ap = argparse.ArgumentParser(description="Teste de carga do DocuSmart")
    ap.add_argument("--base", default=BASE_DEFAULT)
    ap.add_argument("--concurrency", type=int, default=10)
    ap.add_argument("--requests", type=int, help="total de requisições (alternativa a --duration)")
    ap.add_argument("--duration", type=int, default=30, help="segundos (ignorado se --requests for usado)")
    ap.add_argument("--endpoints", default="sinistros,detalhe,chat",
                    help="lista: sinistros,detalhe,chat")
    args = ap.parse_args()

    endpoints = [e.strip() for e in args.endpoints.split(",") if e.strip()]
    ids = coletar_ids(args.base) if "detalhe" in endpoints else []
    if "detalhe" in endpoints and not ids:
        print("aviso: nenhum sinistro existente — pulando 'detalhe'")
        endpoints = [e for e in endpoints if e != "detalhe"]

    modo = f"{args.requests} req" if args.requests else f"{args.duration}s"
    print(f"alvo: {args.base}")
    print(f"endpoints: {endpoints} | concorrência: {args.concurrency} | modo: {modo}")
    if "chat" in endpoints:
        print("⚠️  inclui /chat → consome Bedrock (custo + possível throttle)")
    print("-" * 60)

    lat = defaultdict(list)
    status = defaultdict(lambda: defaultdict(int))
    total = 0
    inicio = time.perf_counter()

    def worker(_):
        ep = random.choice(endpoints)
        return fazer_chamada(args.base, ep, ids)

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        if args.requests:
            futuros = [pool.submit(worker, i) for i in range(args.requests)]
            for f in as_completed(futuros):
                nome, code, ms = f.result()
                lat[nome].append(ms); status[nome][code] += 1; total += 1
        else:
            fim = inicio + args.duration
            em_voo = set()
            while time.perf_counter() < fim:
                while len(em_voo) < args.concurrency:
                    em_voo.add(pool.submit(worker, 0))
                done = {f for f in em_voo if f.done()}
                for f in done:
                    nome, code, ms = f.result()
                    lat[nome].append(ms); status[nome][code] += 1; total += 1
                em_voo -= done
                time.sleep(0.005)
            for f in as_completed(em_voo):
                nome, code, ms = f.result()
                lat[nome].append(ms); status[nome][code] += 1; total += 1

    dur = time.perf_counter() - inicio
    print(f"\n{total} requisições em {dur:.1f}s  →  {total / dur:.1f} req/s\n")
    print(f"{'endpoint':<22}{'n':>6}{'ok%':>7}{'p50':>8}{'p90':>8}{'p99':>8}{'max':>8}")
    print("-" * 67)
    for nome in sorted(lat):
        v = lat[nome]
        ok = sum(c for s, c in status[nome].items() if 200 <= s < 300)
        okpct = 100 * ok / len(v) if v else 0
        print(f"{nome:<22}{len(v):>6}{okpct:>6.1f}%{pct(v,50):>8.0f}{pct(v,90):>8.0f}"
              f"{pct(v,99):>8.0f}{max(v):>8.0f}")
    print("\nstatus HTTP por endpoint:")
    for nome in sorted(status):
        dist = ", ".join(f"{s if s else 'falha'}:{c}" for s, c in sorted(status[nome].items()))
        print(f"  {nome:<22} {dist}")
    print("\nlatências em ms. status 0 = timeout/conexão. 429 = throttle.")


if __name__ == "__main__":
    main()
