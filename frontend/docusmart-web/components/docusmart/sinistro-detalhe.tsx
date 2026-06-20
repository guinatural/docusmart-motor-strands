'use client';

import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import OperacoesTimeline from '@/components/docusmart/operacoes-timeline';
import PipelineBadge from '@/components/docusmart/pipeline-badge';
import { APP_ROUTES } from '@/constants/app-routes';
import { statusPipelineTerminal } from '@/lib/docusmart/constants';
import { formatData, formatDataHora } from '@/lib/docusmart/format';
import {
  confiancaPct,
  obterDocumento,
  type DocumentoResposta,
} from '@/lib/docusmart/api';

const POLL_MS = 5000;

const CAMPOS: { chave: string; rotulo: string }[] = [
  { chave: 'marca_modelo', rotulo: 'Veículo' },
  { chave: 'placa_veiculo', rotulo: 'Placa' },
  { chave: 'ano', rotulo: 'Ano' },
  { chave: 'cor', rotulo: 'Cor' },
  { chave: 'renavam', rotulo: 'RENAVAM' },
  { chave: 'chassi', rotulo: 'Chassi' },
  { chave: 'local', rotulo: 'Local' },
  { chave: 'valor_prejuizo', rotulo: 'Valor do prejuízo' },
];

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-foreground/50 text-xs">{rotulo}</dt>
      <dd className="text-foreground mt-0.5 text-sm font-medium break-words">
        {valor}
      </dd>
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-background inset-ring-foreground/10 rounded-xl p-5 shadow-sm inset-ring">
      <h2 className="text-foreground mb-4 text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default function SinistroDetalhe({ id }: { id: string }) {
  const [detalhe, setDetalhe] = React.useState<DocumentoResposta | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(true);

  const buscar = React.useCallback(
    async (silencioso = false) => {
      try {
        const r = await obterDocumento(id);
        setDetalhe(r);
        setErro(null);
      } catch (e) {
        if (!silencioso)
          setErro(e instanceof Error ? e.message : 'Falha na consulta.');
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
    if (statusPipelineTerminal(detalhe.documento.status_pipeline)) return;
    const t = setTimeout(() => buscar(true), POLL_MS);
    return () => clearTimeout(t);
  }, [detalhe, buscar]);

  const doc = detalhe?.documento;
  const campos = doc?.campos_extraidos ?? {};
  const envolvidos = campos.envolvidos ?? [];
  const temCampos = CAMPOS.some(
    (c) => campos[c.chave] != null && campos[c.chave] !== '',
  );
  const confianca = confiancaPct(doc?.confianca);
  const processando =
    doc != null && !statusPipelineTerminal(doc.status_pipeline);

  return (
    <div>
      <Link
        href={APP_ROUTES.PRIVATE.PAINEL}
        className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-4" /> Voltar ao painel
      </Link>

      {carregando ? (
        <p className="text-foreground/50 mt-6 text-sm">Carregando…</p>
      ) : erro ? (
        <p className="mt-6 text-sm text-red-600">{erro}</p>
      ) : !doc ? (
        <p className="text-foreground/50 mt-6 text-sm">
          Sinistro não encontrado.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-foreground font-mono text-lg font-semibold break-all">
                {doc.sinistro_id ?? doc.id ?? id}
              </h1>
              <p className="text-foreground/60 mt-1 text-sm">
                {doc.tipo_documento ?? 'Documento'}
                {confianca != null && ` · ${confianca}% confiança`}
              </p>
            </div>
            <PipelineBadge status={doc.status_pipeline} className="mt-1" />
          </div>

          {processando && (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
              <ArrowPathIcon className="size-4 animate-spin" />
              Pipeline em execução — atualizando automaticamente.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {doc.resumo && (
                <Secao titulo="Resumo">
                  <p className="text-foreground/80 text-sm">{doc.resumo}</p>
                </Secao>
              )}

              {temCampos && (
                <Secao titulo="Dados extraídos">
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {CAMPOS.map((c) => {
                      const v = campos[c.chave];
                      if (v == null || v === '') return null;
                      return (
                        <Campo
                          key={c.chave}
                          rotulo={c.rotulo}
                          valor={String(v)}
                        />
                      );
                    })}
                  </dl>
                </Secao>
              )}

              {envolvidos.length > 0 && (
                <Secao titulo="Envolvidos">
                  <ul className="divide-y divide-foreground/5">
                    {envolvidos.map((bruto, i) => {
                      const e =
                        typeof bruto === 'string' ? { nome: bruto } : bruto;
                      return (
                        <li
                          key={i}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-foreground/80">
                            {e.nome ?? '—'}
                            {e.cpf && (
                              <span className="text-foreground/40">
                                {' '}
                                · {e.cpf}
                              </span>
                            )}
                          </span>
                          {e.funcao && (
                            <span className="text-foreground/50 text-xs">
                              {e.funcao}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Secao>
              )}

              {doc.dados_formulario && (
                <Secao titulo="Dados do aviso (formulário do cliente)">
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {doc.dados_formulario.numero_apolice && (
                      <Campo
                        rotulo="Apólice"
                        valor={doc.dados_formulario.numero_apolice}
                      />
                    )}
                    {doc.dados_formulario.tipo_sinistro && (
                      <Campo
                        rotulo="Tipo"
                        valor={doc.dados_formulario.tipo_sinistro}
                      />
                    )}
                    {doc.dados_formulario.data_sinistro && (
                      <Campo
                        rotulo="Data"
                        valor={formatData(doc.dados_formulario.data_sinistro)}
                      />
                    )}
                    {doc.dados_formulario.local && (
                      <Campo rotulo="Local" valor={doc.dados_formulario.local} />
                    )}
                    {doc.dados_formulario.contato && (
                      <Campo
                        rotulo="Contato"
                        valor={doc.dados_formulario.contato}
                      />
                    )}
                    <Campo
                      rotulo="Terceiros"
                      valor={doc.dados_formulario.terceiros_envolvidos ? 'Sim' : 'Não'}
                    />
                  </dl>
                </Secao>
              )}
            </div>

            <div className="space-y-5">
              <Secao titulo="Processamento">
                <dl className="space-y-3">
                  {confianca != null && (
                    <Campo rotulo="Confiança" valor={`${confianca}%`} />
                  )}
                  {doc.processado_em && (
                    <Campo
                      rotulo="Processado em"
                      valor={formatDataHora(doc.processado_em)}
                    />
                  )}
                  {doc.s3_origem?.key && (
                    <Campo
                      rotulo="Arquivo (S3)"
                      valor={
                        <span className="font-mono text-xs">
                          {doc.s3_origem.key}
                        </span>
                      }
                    />
                  )}
                </dl>
              </Secao>

              <Secao titulo="Auditoria (operações)">
                <OperacoesTimeline operacoes={detalhe.historico_operacoes} />
              </Secao>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
