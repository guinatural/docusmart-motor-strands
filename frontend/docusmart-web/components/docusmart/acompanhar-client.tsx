'use client';

import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import React from 'react';

import CopyButton from '@/components/docusmart/copy-button';
import OperacoesTimeline from '@/components/docusmart/operacoes-timeline';
import StatusBadge from '@/components/docusmart/status-badge';
import Button from '@/components/ui/button';
import InputWithLabel from '@/components/ui/input';
import { obterSinistro, type SinistroDetalhe } from '@/lib/docusmart/api';
import {
  sinistroEmProcessamento,
  TIPO_SINISTRO,
} from '@/lib/docusmart/constants';
import { formatData } from '@/lib/docusmart/format';

const POLL_MS = 5000;

export default function AcompanharClient() {
  const params = useSearchParams();
  const [numero, setNumero] = React.useState(params.get('n') ?? '');
  const [buscando, setBuscando] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<SinistroDetalhe | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const alvoRef = React.useRef<string>('');

  const buscar = React.useCallback(async (id: string, silencioso = false) => {
    const alvo = id.trim();
    if (!alvo) return;
    alvoRef.current = alvo;
    if (!silencioso) {
      setBuscando(true);
      setErro(null);
    }
    try {
      const r = await obterSinistro(alvo);
      setDetalhe(r);
    } catch (e) {
      if (!silencioso) {
        setDetalhe(null);
        setErro(e instanceof Error ? e.message : 'Falha na consulta.');
      }
    } finally {
      if (!silencioso) setBuscando(false);
    }
  }, []);

  React.useEffect(() => {
    const n = params.get('n');
    if (n) buscar(n);
  }, [params, buscar]);

  React.useEffect(() => {
    if (!detalhe) return;
    if (!sinistroEmProcessamento(detalhe.sinistro.status)) return;
    const t = setTimeout(() => buscar(alvoRef.current, true), POLL_MS);
    return () => clearTimeout(t);
  }, [detalhe, buscar]);

  const s = detalhe?.sinistro;
  const dc = s?.dados_consolidados;
  const form = s?.dados_formulario ?? {};
  const processando = s != null && sinistroEmProcessamento(s.status);
  const faltantes = s?.documentos_faltantes ?? dc?.validacoes?.documentos_faltantes ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        Acompanhar sinistro
      </h1>
      <p className="text-foreground/60 mt-1 text-sm">
        Informe o número de protocolo que você recebeu ao enviar os documentos.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(numero);
        }}
        className="mt-6 flex items-end gap-3"
      >
        <div className="flex-1">
          <InputWithLabel
            id="protocolo"
            label="Protocolo"
            placeholder="cole o número do protocolo"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={buscando} className="h-10 px-4">
          <MagnifyingGlassIcon className="mr-1.5 size-4" />
          {buscando ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      {erro && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      {detalhe && s && (
        <div className="bg-background inset-ring-foreground/10 mt-8 rounded-2xl p-6 shadow-sm inset-ring">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-foreground font-mono text-sm font-semibold break-all">
                  {s.sinistro_id ?? alvoRef.current}
                </p>
                <CopyButton value={s.sinistro_id ?? alvoRef.current} label="" />
              </div>
              <p className="text-foreground/60 mt-0.5 text-sm">
                {form.tipo_sinistro
                  ? TIPO_SINISTRO[form.tipo_sinistro as keyof typeof TIPO_SINISTRO] ?? form.tipo_sinistro
                  : 'Sinistro'}
                {form.data_sinistro && ` · ${formatData(form.data_sinistro)}`}
              </p>
            </div>
            <StatusBadge status={s.status} />
          </div>

          {processando && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              <ArrowPathIcon className="size-4 animate-spin" />
              Processando seus documentos… esta página atualiza sozinha.
            </div>
          )}

          {faltantes.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <strong>Documentos pendentes:</strong> {faltantes.join(', ')}. Reenvie
              para dar andamento.
            </div>
          )}

          {dc?.segurado?.nome && (
            <p className="text-foreground/70 mt-4 text-sm">
              <span className="text-foreground/50">Segurado:</span> {dc.segurado.nome}
            </p>
          )}

          {dc?.decisao?.motivo && !processando && (
            <p className="text-foreground/80 mt-3 text-sm">{dc.decisao.motivo}</p>
          )}

          <h2 className="text-foreground mt-6 mb-4 text-sm font-semibold">Andamento</h2>
          <OperacoesTimeline operacoes={detalhe.historico_operacoes} />
        </div>
      )}
    </div>
  );
}
