'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import CopyButton from '@/components/docusmart/copy-button';
import OperacoesTimeline from '@/components/docusmart/operacoes-timeline';
import StatusBadge from '@/components/docusmart/status-badge';
import Button from '@/components/ui/button';
import { APP_ROUTES } from '@/constants/app-routes';
import {
  STATUS_DOC,
  TIPO_SINISTRO,
  sinistroEmProcessamento,
} from '@/lib/docusmart/constants';
import { formatBRL, formatCpf, formatData } from '@/lib/docusmart/format';
import {
  confiancaPct,
  decidirSinistroApi,
  obterSinistro,
  type SinistroDetalhe as Detalhe,
  type Validacoes,
} from '@/lib/docusmart/api';
import { notifyError, notifySuccess } from '@/lib/ui/notifications';
import { cn } from '@/lib/utils';

const POLL_MS = 5000;

const GATES: { key: keyof Validacoes; label: string }[] = [
  { key: 'documentos_completos', label: 'Documentos obrigatórios completos' },
  { key: 'consistencia_cpf', label: 'CPF consistente com a apólice' },
  { key: 'consistencia_placa', label: 'Placa consistente com a apólice' },
  { key: 'data_dentro_vigencia', label: 'Data dentro da vigência' },
  { key: 'dentro_do_teto', label: 'Valor dentro do teto de auto-aprovação' },
];

const PODE_REVISAR = ['EM_ANALISE', 'PENDENTE_DOCUMENTACAO'];

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
      <dd className="text-foreground mt-0.5 text-sm font-medium break-words">{valor}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-background inset-ring-foreground/10 rounded-xl p-5 shadow-sm inset-ring">
      <h2 className="text-foreground mb-4 text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default function SinistroDetalhe({ id }: { id: string }) {
  const [detalhe, setDetalhe] = React.useState<Detalhe | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(true);
  const [acaoEmAndamento, setAcao] = React.useState(false);
  const [confirmar, setConfirmar] = React.useState<string | null>(null);
  const [obs, setObs] = React.useState('');

  const buscar = React.useCallback(
    async (silencioso = false) => {
      try {
        const r = await obterSinistro(id);
        setDetalhe(r);
        setErro(null);
      } catch (e) {
        if (!silencioso) setErro(e instanceof Error ? e.message : 'Falha na consulta.');
      } finally {
        if (!silencioso) setCarregando(false);
      }
    },
    [id],
  );

  React.useEffect(() => {
    buscar();
  }, [buscar]);

  React.useEffect(() => {
    if (!detalhe) return;
    if (!sinistroEmProcessamento(detalhe.sinistro.status)) return;
    const t = setTimeout(() => buscar(true), POLL_MS);
    return () => clearTimeout(t);
  }, [detalhe, buscar]);

  async function confirmarDecisao() {
    if (!confirmar) return;
    setAcao(true);
    try {
      await decidirSinistroApi(id, confirmar, obs.trim() || undefined);
      notifySuccess(
        `Sinistro marcado como ${confirmar.replace(/_/g, ' ').toLowerCase()}.`,
      );
      setConfirmar(null);
      setObs('');
      await buscar(true);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Falha ao atualizar.');
    } finally {
      setAcao(false);
    }
  }

  const s = detalhe?.sinistro;
  const dc = s?.dados_consolidados;
  const form = s?.dados_formulario ?? {};
  const processando = s != null && sinistroEmProcessamento(s.status);
  const podeRevisar = !!s && PODE_REVISAR.includes(s.status ?? '');

  return (
    <div>
      <Link
        href={APP_ROUTES.PRIVATE.PAINEL}
        className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-4" /> Voltar ao painel
      </Link>

      {carregando ? (
        <div className="mt-6 space-y-4">
          <div className="bg-foreground/10 h-7 w-72 max-w-full animate-pulse rounded" />
          <div className="bg-foreground/10 h-16 w-full animate-pulse rounded-xl" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="bg-foreground/10 h-48 animate-pulse rounded-xl lg:col-span-2" />
            <div className="bg-foreground/10 h-48 animate-pulse rounded-xl" />
          </div>
        </div>
      ) : erro ? (
        <p className="mt-6 text-sm text-red-600">{erro}</p>
      ) : !s ? (
        <p className="text-foreground/50 mt-6 text-sm">Sinistro não encontrado.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h1 className="text-foreground font-mono text-lg font-semibold break-all">
                  {s.sinistro_id ?? id}
                </h1>
                <CopyButton value={s.sinistro_id ?? id} label="" />
              </div>
              <p className="text-foreground/60 mt-1 text-sm">
                {form.tipo_sinistro
                  ? TIPO_SINISTRO[form.tipo_sinistro as keyof typeof TIPO_SINISTRO] ?? form.tipo_sinistro
                  : 'Sinistro'}
                {form.data_sinistro && ` · ${formatData(form.data_sinistro)}`}
                {s.numero_apolice && ` · Apólice ${s.numero_apolice}`}
              </p>
            </div>
            <StatusBadge status={s.status} className="mt-1" />
          </div>

          {processando ? (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
              <ArrowPathIcon className="size-4 animate-spin" />
              Pipeline em execução — atualizando automaticamente.
            </div>
          ) : (
            dc?.decisao && (
              <div
                className={cn(
                  'mt-6 rounded-xl p-4 text-sm',
                  dc.decisao.automatica
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
                )}
              >
                <p className="font-semibold">
                  Decisão: {(dc.decisao.status ?? s.status ?? '').replace(/_/g, ' ')}{' '}
                  <span className="font-normal opacity-70">
                    ({dc.decisao.automatica ? 'automática' : 'requer analista'})
                  </span>
                </p>
                {dc.decisao.motivo && <p className="mt-1 opacity-90">{dc.decisao.motivo}</p>}
              </div>
            )
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Secao titulo="Segurado, veículo e evento">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Campo rotulo="Segurado" valor={dc?.segurado?.nome ?? '—'} />
                  <Campo rotulo="CPF" valor={dc?.segurado?.cpf ? formatCpf(dc.segurado.cpf) : '—'} />
                  <Campo rotulo="Contato" valor={form.contato ?? '—'} />
                  <Campo rotulo="Veículo" valor={dc?.veiculo?.marca_modelo ?? '—'} />
                  <Campo rotulo="Placa" valor={dc?.veiculo?.placa ?? '—'} />
                  <Campo rotulo="Local" valor={form.local ?? '—'} />
                  <Campo
                    rotulo="Terceiros"
                    valor={form.terceiros_envolvidos ? 'Sim' : 'Não'}
                  />
                </dl>
              </Secao>

              <Secao titulo={`Documentos (${detalhe.documentos.length})`}>
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
                      {detalhe.documentos.map((d) => {
                        const conf = confiancaPct(d.confianca);
                        return (
                          <tr key={d.documento_id ?? d.id}>
                            <td className="text-foreground/70 px-5 py-2.5 font-mono">
                              {d.documento_id ?? '—'}
                            </td>
                            <td className="text-foreground/80 px-5 py-2.5">
                              {d.tipo_documento || '—'}
                            </td>
                            <td className="px-5 py-2.5">
                              {conf != null ? (
                                <div className="flex items-center gap-2">
                                  <div className="bg-foreground/10 h-1.5 w-16 overflow-hidden rounded-full">
                                    <div
                                      className={cn(
                                        'h-full rounded-full',
                                        conf < 80
                                          ? 'bg-red-500'
                                          : conf < 90
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500',
                                      )}
                                      style={{ width: `${conf}%` }}
                                    />
                                  </div>
                                  <span className="text-foreground/70 text-xs tabular-nums">
                                    {conf}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-foreground/40">—</span>
                              )}
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
                                {STATUS_DOC[d.status_doc as keyof typeof STATUS_DOC] ??
                                  d.status_doc ??
                                  '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Secao>

              {dc && dc.orcamentos && dc.orcamentos.length > 0 && (
                <Secao titulo="Orçamentos">
                  <ul className="divide-y divide-foreground/5">
                    {dc.orcamentos.map((o, i) => (
                      <li key={i} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-foreground/80">{o.oficina ?? 'Oficina'}</span>
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

            <div className="space-y-5">
              {dc?.validacoes && (
                <Secao titulo="Validações (gates)">
                  <ul className="space-y-2.5">
                    {GATES.map((g) => (
                      <Gate key={g.key} ok={!!dc.validacoes?.[g.key]} label={g.label} />
                    ))}
                  </ul>
                  {dc.validacoes.documentos_faltantes &&
                    dc.validacoes.documentos_faltantes.length > 0 && (
                      <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                        Faltantes: {dc.validacoes.documentos_faltantes.join(', ')}
                      </p>
                    )}
                </Secao>
              )}

              {podeRevisar && (
                <Secao titulo="Revisão do analista">
                  <p className="text-foreground/60 mb-3 text-sm">
                    Este sinistro está na fila de revisão. Tome a decisão final:
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setConfirmar('APROVADO')}
                      disabled={acaoEmAndamento}
                      className="flex-1"
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="error"
                      onClick={() => setConfirmar('NEGADO')}
                      disabled={acaoEmAndamento}
                      className="flex-1"
                    >
                      Negar
                    </Button>
                  </div>
                </Secao>
              )}

              <Secao titulo="Auditoria (operações)">
                <OperacoesTimeline operacoes={detalhe.historico_operacoes} />
              </Secao>
            </div>
          </div>
        </>
      )}

      {/* Modal de confirmação da decisão */}
      <Dialog
        open={confirmar !== null}
        onClose={() => !acaoEmAndamento && setConfirmar(null)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-900/50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-background w-full max-w-md rounded-2xl p-6 shadow-xl">
            <DialogTitle className="text-foreground text-lg font-semibold">
              {confirmar === 'APROVADO' ? 'Aprovar sinistro?' : 'Negar sinistro?'}
            </DialogTitle>
            <p className="text-foreground/60 mt-1 text-sm">
              Esta decisão fica registrada na auditoria. Você pode adicionar uma
              observação (opcional).
            </p>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Observação do analista…"
              className="bg-background text-foreground outline-foreground/20 focus:outline-sky-600 mt-4 w-full rounded-md px-3 py-2 text-sm outline -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmar(null)}
                disabled={acaoEmAndamento}
              >
                Cancelar
              </Button>
              <Button
                variant={confirmar === 'NEGADO' ? 'error' : 'primary'}
                onClick={confirmarDecisao}
                disabled={acaoEmAndamento}
              >
                {acaoEmAndamento
                  ? 'Salvando…'
                  : confirmar === 'APROVADO'
                    ? 'Confirmar aprovação'
                    : 'Confirmar negação'}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
