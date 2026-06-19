'use client';

import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import StatusBadge from '@/components/docusmart/status-badge';
import { APP_ROUTES } from '@/constants/app-routes';
import { STATUS_SINISTRO, TIPO_SINISTRO } from '@/lib/docusmart/constants';
import { formatBRL, formatData } from '@/lib/docusmart/format';
import { listarSinistros } from '@/lib/docusmart/mock-api';
import type { Sinistro, StatusSinistro } from '@/lib/docusmart/types';
import { cn } from '@/lib/utils';

const REQUER_ATENCAO: StatusSinistro[] = [
  'PENDENTE_DOCUMENTACAO',
  'EM_ANALISE',
  'EM_PROCESSAMENTO',
];

type Filtro = 'TODOS' | 'ATENCAO' | StatusSinistro;

export default function PainelClient() {
  const [sinistros, setSinistros] = React.useState<Sinistro[] | null>(null);
  const [filtro, setFiltro] = React.useState<Filtro>('TODOS');

  React.useEffect(() => {
    listarSinistros().then(setSinistros);
  }, []);

  const kpis = React.useMemo(() => {
    const lista = sinistros ?? [];
    return {
      total: lista.length,
      atencao: lista.filter((s) => REQUER_ATENCAO.includes(s.status)).length,
      aprovados: lista.filter((s) => s.status === 'APROVADO').length,
      valor: lista.reduce((acc, s) => acc + (s.valor_total_orcamentos ?? 0), 0),
    };
  }, [sinistros]);

  const visiveis = React.useMemo(() => {
    const lista = sinistros ?? [];
    if (filtro === 'TODOS') return lista;
    if (filtro === 'ATENCAO')
      return lista.filter((s) => REQUER_ATENCAO.includes(s.status));
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
    { key: 'APROVADO', label: STATUS_SINISTRO.APROVADO.label },
    { key: 'EM_ANALISE', label: STATUS_SINISTRO.EM_ANALISE.label },
    { key: 'PENDENTE_DOCUMENTACAO', label: STATUS_SINISTRO.PENDENTE_DOCUMENTACAO.label },
  ];

  return (
    <div>
      <h1 className="text-foreground text-xl font-semibold">Painel de sinistros</h1>
      <p className="text-foreground/60 mt-1 text-sm">
        Visão do analista — dados, status e fila de revisão.
      </p>

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
        ) : visiveis.length === 0 ? (
          <p className="text-foreground/50 p-6 text-sm">
            Nenhum sinistro neste filtro.
          </p>
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
              {visiveis.map((s) => (
                <tr
                  key={s.numero_sinistro}
                  className="hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={APP_ROUTES.PRIVATE.SINISTRO(s.numero_sinistro)}
                      className="font-mono font-medium text-sky-600 hover:text-sky-500"
                    >
                      {s.numero_sinistro}
                    </Link>
                  </td>
                  <td className="text-foreground/80 px-4 py-3">
                    {s.dados_consolidados?.segurado.nome ?? '—'}
                  </td>
                  <td className="text-foreground/70 hidden px-4 py-3 sm:table-cell">
                    {TIPO_SINISTRO[s.tipo_sinistro]}
                  </td>
                  <td className="text-foreground/70 hidden px-4 py-3 md:table-cell">
                    {formatData(s.data_sinistro)}
                  </td>
                  <td className="text-foreground/80 px-4 py-3 text-right tabular-nums">
                    {formatBRL(s.valor_total_orcamentos)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
