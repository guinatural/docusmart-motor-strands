'use client';

import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import PainelGraficos from '@/components/docusmart/painel-graficos';
import StatusBadge from '@/components/docusmart/status-badge';
import { APP_ROUTES } from '@/constants/app-routes';
import { listarSinistrosApi, type SinistroApi } from '@/lib/docusmart/api';
import { TIPO_SINISTRO } from '@/lib/docusmart/constants';
import { formatBRL, formatData } from '@/lib/docusmart/format';
import { cn } from '@/lib/utils';

const REQUER_ATENCAO = ['EM_ANALISE', 'PENDENTE_DOCUMENTACAO', 'EM_PROCESSAMENTO'];

type Filtro = 'TODOS' | 'ATENCAO' | 'APROVADO' | 'EM_ANALISE' | 'PENDENTE_DOCUMENTACAO';

function idDe(s: SinistroApi): string {
  return (s.sinistro_id ?? s.id ?? '') as string;
}
function seguradoDe(s: SinistroApi): string {
  return s.dados_consolidados?.segurado?.nome ?? s.numero_apolice ?? '—';
}
function valorDe(s: SinistroApi): number | null {
  return (
    s.valor_total_orcamentos ??
    s.dados_consolidados?.valor_referencia ??
    null
  );
}

export default function PainelClient() {
  const router = useRouter();
  const [sinistros, setSinistros] = React.useState<SinistroApi[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [filtro, setFiltro] = React.useState<Filtro>('TODOS');

  const carregar = React.useCallback(async () => {
    setErro(null);
    try {
      setSinistros(await listarSinistrosApi());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar.');
      setSinistros([]);
    }
  }, []);

  React.useEffect(() => {
    carregar();
    const t = setInterval(carregar, 15000); // auto-refresh silencioso
    return () => clearInterval(t);
  }, [carregar]);

  const kpis = React.useMemo(() => {
    const lista = sinistros ?? [];
    return {
      total: lista.length,
      atencao: lista.filter(
        (s) => REQUER_ATENCAO.includes(s.status ?? '') || s.revisao_pendente,
      ).length,
      aprovados: lista.filter((s) => s.status === 'APROVADO').length,
      valor: lista.reduce((acc, s) => acc + (valorDe(s) ?? 0), 0),
    };
  }, [sinistros]);

  const visiveis = React.useMemo(() => {
    const lista = sinistros ?? [];
    if (filtro === 'TODOS') return lista;
    if (filtro === 'ATENCAO')
      return lista.filter(
        (s) => REQUER_ATENCAO.includes(s.status ?? '') || s.revisao_pendente,
      );
    return lista.filter((s) => s.status === filtro);
  }, [sinistros, filtro]);

  const cards = [
    { label: 'Sinistros', valor: kpis.total, icon: DocumentTextIcon, tone: 'text-sky-500' },
    { label: 'Fila de revisão', valor: kpis.atencao, icon: ExclamationTriangleIcon, tone: 'text-amber-500' },
    { label: 'Aprovados', valor: kpis.aprovados, icon: CheckCircleIcon, tone: 'text-emerald-500' },
    { label: 'Total em orçamentos', valor: formatBRL(kpis.valor), icon: ClockIcon, tone: 'text-blue-500' },
  ];

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'ATENCAO', label: 'Fila de revisão' },
    { key: 'APROVADO', label: 'Aprovados' },
    { key: 'EM_ANALISE', label: 'Em análise' },
    { key: 'PENDENTE_DOCUMENTACAO', label: 'Pendente de documentação' },
  ];

  return (
    <div>
      <div>
        <h1 className="text-foreground text-xl font-semibold">
          Painel de sinistros
        </h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Visão do analista — dados, status e fila de revisão.
        </p>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-background inset-ring-foreground/10 rounded-xl p-4 shadow-sm inset-ring"
          >
            <dt className="flex items-center gap-2">
              <c.icon className={cn('size-5', c.tone)} />
              <span className="text-foreground/60 text-sm">{c.label}</span>
            </dt>
            <dd className="text-foreground mt-2 text-2xl font-semibold">
              {c.valor}
            </dd>
          </div>
        ))}
      </dl>

      {sinistros && sinistros.length > 0 && (
        <>
          <h2 className="text-foreground/50 mt-10 text-xs font-semibold tracking-wide uppercase">
            Indicadores
          </h2>
          <div className="mt-3">
            <PainelGraficos sinistros={sinistros} />
          </div>
        </>
      )}

      <h2 className="text-foreground/50 mt-10 text-xs font-semibold tracking-wide uppercase">
        Sinistros
      </h2>
      <div className="bg-background inset-ring-foreground/10 mt-3 overflow-hidden rounded-xl shadow-sm inset-ring">
        {/* toolbar: filtros + contador */}
        <div className="border-foreground/10 flex flex-wrap items-center gap-2 border-b p-3">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                filtro === f.key
                  ? 'bg-sky-600 text-white'
                  : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10',
              )}
            >
              {f.label}
            </button>
          ))}
          {sinistros !== null && (
            <span className="text-foreground/40 ml-auto text-xs">
              {visiveis.length} de {sinistros.length}
            </span>
          )}
        </div>

        {sinistros === null ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="bg-foreground/10 h-4 w-20 animate-pulse rounded" />
                <div className="bg-foreground/10 h-4 flex-1 animate-pulse rounded" />
                <div className="bg-foreground/10 h-4 w-16 animate-pulse rounded" />
                <div className="bg-foreground/10 h-5 w-20 animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        ) : erro ? (
          <p className="p-6 text-sm text-red-600">{erro}</p>
        ) : visiveis.length === 0 ? (
          sinistros.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <DocumentTextIcon className="text-foreground/30 size-10" />
              <div>
                <p className="text-foreground font-medium">
                  Nenhum sinistro ainda
                </p>
                <p className="text-foreground/50 mt-1 text-sm">
                  Os sinistros enviados pelos clientes aparecem aqui.
                </p>
              </div>
              <Link
                href={APP_ROUTES.PUBLIC.HOME}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
              >
                Abrir página de envio
              </Link>
            </div>
          ) : (
            <p className="text-foreground/50 p-6 text-sm">
              Nenhum sinistro neste filtro.
            </p>
          )
        ) : (
          <table className="min-w-full divide-y divide-foreground/10 text-sm">
            <thead>
              <tr className="text-foreground/50 text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">Protocolo</th>
                <th className="px-4 py-3 font-medium">Segurado</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Tipo</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Data</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {visiveis.map((s) => {
                const id = idDe(s);
                const tipo = s.dados_formulario?.tipo_sinistro;
                return (
                  <tr
                    key={id}
                    onClick={() => router.push(APP_ROUTES.PRIVATE.SINISTRO(id))}
                    className="hover:bg-foreground/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-sky-600">
                        {id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="text-foreground/80 px-4 py-3">{seguradoDe(s)}</td>
                    <td className="text-foreground/70 hidden px-4 py-3 sm:table-cell">
                      {tipo ? TIPO_SINISTRO[tipo as keyof typeof TIPO_SINISTRO] ?? tipo : '—'}
                    </td>
                    <td className="text-foreground/70 hidden px-4 py-3 md:table-cell">
                      {formatData(s.dados_formulario?.data_sinistro)}
                    </td>
                    <td className="text-foreground/80 px-4 py-3 text-right tabular-nums">
                      {formatBRL(valorDe(s))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
