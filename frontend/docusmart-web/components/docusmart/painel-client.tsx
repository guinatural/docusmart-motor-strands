'use client';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import PipelineBadge from '@/components/docusmart/pipeline-badge';
import { APP_ROUTES } from '@/constants/app-routes';
import { statusPipelineMeta } from '@/lib/docusmart/constants';
import { formatDataHora } from '@/lib/docusmart/format';
import {
  confiancaPct,
  listarSinistrosApi,
  statusEfetivo,
  type DocumentoApi,
} from '@/lib/docusmart/api';
import { cn } from '@/lib/utils';

type Filtro = 'TODOS' | 'success' | 'andamento' | 'danger';

function idDe(s: DocumentoApi): string {
  return (s.sinistro_id ?? s.id ?? '') as string;
}

export default function PainelClient() {
  const [sinistros, setSinistros] = React.useState<DocumentoApi[] | null>(null);
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
  }, [carregar]);

  const kpis = React.useMemo(() => {
    const lista = sinistros ?? [];
    const tone = (s: DocumentoApi) => statusPipelineMeta(statusEfetivo(s)).tone;
    return {
      total: lista.length,
      processados: lista.filter((s) => tone(s) === 'success').length,
      andamento: lista.filter((s) => ['info', 'warning'].includes(tone(s)))
        .length,
      falhas: lista.filter((s) => tone(s) === 'danger').length,
    };
  }, [sinistros]);

  const visiveis = React.useMemo(() => {
    const lista = sinistros ?? [];
    if (filtro === 'TODOS') return lista;
    if (filtro === 'andamento')
      return lista.filter((s) =>
        ['info', 'warning'].includes(statusPipelineMeta(statusEfetivo(s)).tone),
      );
    return lista.filter(
      (s) => statusPipelineMeta(statusEfetivo(s)).tone === filtro,
    );
  }, [sinistros, filtro]);

  const cards = [
    { label: 'Sinistros', valor: kpis.total, icon: DocumentTextIcon, tone: 'text-sky-500' },
    { label: 'Em andamento', valor: kpis.andamento, icon: ArrowPathIcon, tone: 'text-blue-500' },
    { label: 'Processados', valor: kpis.processados, icon: CheckCircleIcon, tone: 'text-emerald-500' },
    { label: 'Falhas', valor: kpis.falhas, icon: ExclamationTriangleIcon, tone: 'text-red-500' },
  ];

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'andamento', label: 'Em andamento' },
    { key: 'success', label: 'Processados' },
    { key: 'danger', label: 'Falhas' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold">
            Painel de sinistros
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            Visão do analista — documentos processados pelo pipeline.
          </p>
        </div>
        <button
          onClick={carregar}
          className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowPathIcon className="size-4" /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-foreground/50 mr-1 text-sm font-medium">
          Filtrar:
        </span>
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

      {/* tabela */}
      <div className="bg-background inset-ring-foreground/10 mt-4 overflow-hidden rounded-xl shadow-sm inset-ring">
        {sinistros === null ? (
          <p className="text-foreground/50 p-6 text-sm">Carregando…</p>
        ) : erro ? (
          <p className="p-6 text-sm text-red-600">{erro}</p>
        ) : visiveis.length === 0 ? (
          <p className="text-foreground/50 p-6 text-sm">
            Nenhum sinistro encontrado.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-foreground/10 text-sm">
            <thead>
              <tr className="text-foreground/50 text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">Protocolo</th>
                <th className="px-4 py-3 font-medium">Segurado</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Tipo</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Processado</th>
                <th className="px-4 py-3 text-right font-medium">Conf.</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {visiveis.map((s) => {
                const id = idDe(s);
                const conf = confiancaPct(s.confianca);
                return (
                  <tr
                    key={id}
                    className="hover:bg-foreground/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={APP_ROUTES.PRIVATE.SINISTRO(id)}
                        className="font-mono text-xs font-medium text-sky-600 hover:text-sky-500"
                      >
                        {id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="text-foreground/80 px-4 py-3">
                      {(() => {
                        const e0 = s.campos_extraidos?.envolvidos?.[0];
                        const nome =
                          typeof e0 === 'string' ? e0 : e0?.nome;
                        return nome ?? s.dados_formulario?.numero_apolice ?? '—';
                      })()}
                    </td>
                    <td className="text-foreground/70 hidden px-4 py-3 sm:table-cell">
                      {s.tipo_documento ?? '—'}
                    </td>
                    <td className="text-foreground/70 hidden px-4 py-3 md:table-cell">
                      {formatDataHora(s.processado_em)}
                    </td>
                    <td className="text-foreground/80 px-4 py-3 text-right tabular-nums">
                      {conf != null ? `${conf}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PipelineBadge status={statusEfetivo(s)} />
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
