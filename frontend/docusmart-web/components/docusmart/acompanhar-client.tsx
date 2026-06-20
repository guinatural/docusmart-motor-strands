'use client';

import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import React from 'react';

import OperacoesTimeline from '@/components/docusmart/operacoes-timeline';
import PipelineBadge from '@/components/docusmart/pipeline-badge';
import Button from '@/components/ui/button';
import InputWithLabel from '@/components/ui/input';
import { statusPipelineTerminal } from '@/lib/docusmart/constants';
import { formatDataHora } from '@/lib/docusmart/format';
import {
  obterDocumento,
  parseConfianca,
  type DocumentoResposta,
} from '@/lib/docusmart/api';

const POLL_MS = 5000;

export default function AcompanharClient() {
  const params = useSearchParams();
  const [numero, setNumero] = React.useState(params.get('n') ?? '');
  const [buscando, setBuscando] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<DocumentoResposta | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const alvoRef = React.useRef<string>('');

  const buscar = React.useCallback(
    async (id: string, silencioso = false) => {
      const alvo = id.trim();
      if (!alvo) return;
      alvoRef.current = alvo;
      if (!silencioso) {
        setBuscando(true);
        setErro(null);
      }
      try {
        const r = await obterDocumento(alvo);
        setDetalhe(r);
      } catch (e) {
        if (!silencioso) {
          setDetalhe(null);
          setErro(e instanceof Error ? e.message : 'Falha na consulta.');
        }
      } finally {
        if (!silencioso) setBuscando(false);
      }
    },
    [],
  );

  // auto-busca quando chega com ?n= na URL (vindo do upload)
  React.useEffect(() => {
    const n = params.get('n');
    if (n) buscar(n);
  }, [params, buscar]);

  // polling enquanto o pipeline não terminou
  React.useEffect(() => {
    if (!detalhe) return;
    if (statusPipelineTerminal(detalhe.documento.status_pipeline)) return;
    const t = setTimeout(() => buscar(alvoRef.current, true), POLL_MS);
    return () => clearTimeout(t);
  }, [detalhe, buscar]);

  const doc = detalhe?.documento;
  const processando =
    doc != null && !statusPipelineTerminal(doc.status_pipeline);
  const confianca = parseConfianca(doc?.confianca);
  const segurado = doc?.campos_extraidos?.envolvidos?.[0]?.nome;

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

      {detalhe && doc && (
        <div className="bg-background inset-ring-foreground/10 mt-8 rounded-2xl p-6 shadow-sm inset-ring">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-foreground font-mono text-sm font-semibold break-all">
                {doc.sinistro_id ?? doc.id ?? alvoRef.current}
              </p>
              {doc.tipo_documento && (
                <p className="text-foreground/60 mt-0.5 text-sm">
                  {doc.tipo_documento}
                  {confianca != null && ` · ${(confianca * 100).toFixed(0)}% confiança`}
                </p>
              )}
            </div>
            <PipelineBadge status={doc.status_pipeline} />
          </div>

          {processando && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              <ArrowPathIcon className="size-4 animate-spin" />
              Processando seus documentos… esta página atualiza sozinha.
            </div>
          )}

          {segurado && (
            <p className="text-foreground/70 mt-4 text-sm">
              <span className="text-foreground/50">Segurado:</span> {segurado}
            </p>
          )}

          {doc.resumo && (
            <p className="text-foreground/80 mt-3 text-sm">{doc.resumo}</p>
          )}

          {doc.processado_em && (
            <p className="text-foreground/40 mt-3 text-xs">
              Processado em {formatDataHora(doc.processado_em)}
            </p>
          )}

          <h2 className="text-foreground mt-6 mb-4 text-sm font-semibold">
            Andamento
          </h2>
          <OperacoesTimeline operacoes={detalhe.historico_operacoes} />
        </div>
      )}
    </div>
  );
}
