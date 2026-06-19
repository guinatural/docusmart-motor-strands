import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import StatusBadge from '@/components/docusmart/status-badge';
import Timeline from '@/components/docusmart/timeline';
import { APP_ROUTES } from '@/constants/app-routes';
import {
  COBERTURA,
  STATUS_DOC,
  TIPO_SINISTRO,
} from '@/lib/docusmart/constants';
import {
  formatBRL,
  formatCpf,
  formatData,
} from '@/lib/docusmart/format';
import type { SinistroDetalhe } from '@/lib/docusmart/mock-api';
import type { Validacoes } from '@/lib/docusmart/types';
import { cn } from '@/lib/utils';

function Gate({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircleIcon className="size-5 shrink-0 text-emerald-500" />
      ) : (
        <XCircleIcon className="size-5 shrink-0 text-red-500" />
      )}
      <span className={cn('text-foreground/80', !ok && 'text-red-600 dark:text-red-400')}>
        {label}
      </span>
    </li>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-foreground/50 text-xs">{rotulo}</dt>
      <dd className="text-foreground mt-0.5 text-sm font-medium">{valor}</dd>
    </div>
  );
}

function Secao({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'bg-background inset-ring-foreground/10 rounded-xl p-5 shadow-sm inset-ring',
        className,
      )}
    >
      <h2 className="text-foreground mb-4 text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

const GATE_LABELS: { key: keyof Validacoes; label: string }[] = [
  { key: 'documentos_completos', label: 'Documentos obrigatórios completos' },
  { key: 'consistencia_cpf', label: 'CPF consistente com a apólice' },
  { key: 'consistencia_placa', label: 'Placa consistente com a apólice' },
  { key: 'data_dentro_vigencia', label: 'Data dentro da vigência' },
  { key: 'dentro_do_teto', label: 'Valor dentro do teto de auto-aprovação' },
];

export default function SinistroDetalheView({
  detalhe,
}: {
  detalhe: SinistroDetalhe;
}) {
  const { sinistro, apolice, documentos, operacoes } = detalhe;
  const dc = sinistro.dados_consolidados;

  return (
    <div>
      <Link
        href={APP_ROUTES.PRIVATE.PAINEL}
        className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-4" /> Voltar ao painel
      </Link>

      {/* cabeçalho */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground font-mono text-2xl font-semibold">
            {sinistro.numero_sinistro}
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            {TIPO_SINISTRO[sinistro.tipo_sinistro]} ·{' '}
            {formatData(sinistro.data_sinistro)} · Apólice{' '}
            {sinistro.numero_apolice}
          </p>
        </div>
        <StatusBadge status={sinistro.status} className="mt-1" />
      </div>

      {/* decisão */}
      {dc ? (
        <div
          className={cn(
            'mt-6 rounded-xl p-4 text-sm',
            dc.decisao.automatica
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
          )}
        >
          <p className="font-semibold">
            Decisão: {dc.decisao.status.replace(/_/g, ' ')}{' '}
            <span className="font-normal opacity-70">
              ({dc.decisao.automatica ? 'automática' : 'requer analista'})
            </span>
          </p>
          <p className="mt-1 opacity-90">{dc.decisao.motivo}</p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold">Em processamento</p>
          <p className="mt-1 opacity-90">
            Há documento com baixa confiança aguardando revisão humana antes de
            consolidar o sinistro.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* coluna principal */}
        <div className="space-y-5 lg:col-span-2">
          {/* dados do segurado e veículo */}
          <Secao titulo="Segurado, veículo e evento">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Campo
                rotulo="Segurado"
                valor={apolice?.nome_titular ?? dc?.segurado.nome ?? '—'}
              />
              <Campo
                rotulo="CPF"
                valor={apolice ? formatCpf(apolice.cpf_titular) : '—'}
              />
              <Campo rotulo="Contato" valor={apolice?.contato ?? '—'} />
              <Campo
                rotulo="Veículo"
                valor={apolice?.veiculo.marca_modelo ?? dc?.veiculo.marca_modelo ?? '—'}
              />
              <Campo
                rotulo="Placa"
                valor={apolice?.veiculo.placa ?? dc?.veiculo.placa ?? '—'}
              />
              <Campo
                rotulo="Cobertura"
                valor={apolice ? COBERTURA[apolice.cobertura] : '—'}
              />
              <Campo
                rotulo="Local"
                valor={String(
                  (sinistro.contexto as { local?: string }).local ?? '—',
                )}
              />
              <Campo
                rotulo="Terceiros"
                valor={
                  (sinistro.contexto as { terceiros_envolvidos?: boolean })
                    .terceiros_envolvidos
                    ? 'Sim'
                    : 'Não'
                }
              />
              {apolice && (
                <Campo
                  rotulo="Vigência"
                  valor={`${formatData(apolice.vigencia.inicio)} – ${formatData(
                    apolice.vigencia.fim,
                  )}`}
                />
              )}
            </dl>
          </Secao>

          {/* documentos */}
          <Secao titulo={`Documentos (${documentos.length})`}>
            <div className="-mx-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-foreground/50 text-left text-xs uppercase">
                    <th className="px-5 py-2 font-medium">Doc</th>
                    <th className="px-5 py-2 font-medium">Tipo</th>
                    <th className="px-5 py-2 font-medium">Confiança</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {documentos.map((d) => (
                    <tr key={d.documento_id}>
                      <td className="text-foreground/70 px-5 py-2.5 font-mono">
                        {d.documento_id}
                      </td>
                      <td className="text-foreground/80 px-5 py-2.5">
                        {d.tipo_documento}
                      </td>
                      <td className="px-5 py-2.5 tabular-nums">
                        <span
                          className={cn(
                            d.score_classificacao < 0.8
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-foreground/70',
                          )}
                        >
                          {(d.score_classificacao * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            d.status_doc === 'revisao_pendente'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-foreground/60',
                          )}
                        >
                          {STATUS_DOC[d.status_doc]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Secao>

          {/* orçamentos */}
          {dc && dc.orcamentos.length > 0 && (
            <Secao titulo="Orçamentos">
              <ul className="divide-y divide-foreground/5">
                {dc.orcamentos.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-foreground/80">{o.oficina}</span>
                    <span className="text-foreground tabular-nums font-medium">
                      {formatBRL(o.valor_total)}
                    </span>
                  </li>
                ))}
              </ul>
              {dc.orcamentos.length > 1 && (
                <p className="text-foreground/50 mt-3 text-xs">
                  Valor de referência (menor, conservador):{' '}
                  <span className="text-foreground font-medium">
                    {formatBRL(dc.valor_referencia)}
                  </span>
                </p>
              )}
            </Secao>
          )}
        </div>

        {/* coluna lateral */}
        <div className="space-y-5">
          {dc && (
            <Secao titulo="Validações (gates)">
              <ul className="space-y-2.5">
                {GATE_LABELS.map((g) => (
                  <Gate key={g.key} ok={dc.validacoes[g.key] as boolean} label={g.label} />
                ))}
              </ul>
              {dc.validacoes.documentos_faltantes.length > 0 && (
                <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  Faltantes: {dc.validacoes.documentos_faltantes.join(', ')}
                </p>
              )}
            </Secao>
          )}

          <Secao titulo="Auditoria (operações)">
            <Timeline operacoes={operacoes} />
          </Secao>
        </div>
      </div>
    </div>
  );
}
