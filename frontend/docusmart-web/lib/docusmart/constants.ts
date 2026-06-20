import type {
  Cobertura,
  EtapaOperacao,
  StatusDoc,
  StatusSinistro,
  TipoSinistro,
} from './types';

/**
 * Parâmetros de negócio (no backend real viram variáveis de ambiente — nada hardcoded).
 * Replicados aqui só para a camada de apresentação exibir os gates.
 */
export const LIMIAR_CONFIANCA = 0.8;
export const TETO_AUTO_APROVACAO = 5000; // R$
export const DOCS_OBRIGATORIOS_BASE = [
  'formulario',
  'identidade',
  'crlv',
  'orcamento',
];
// BO (boletim de ocorrência) é obrigatório se: roubo, furto ou terceiros_envolvidos.

// ── Rótulos e cores de status ────────────────────────────────────────────────
export const STATUS_SINISTRO: Record<
  StatusSinistro,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  ABERTO: { label: 'Aberto', tone: 'neutral' },
  EM_PROCESSAMENTO: { label: 'Em processamento', tone: 'info' },
  PENDENTE_DOCUMENTACAO: { label: 'Pendente de documentação', tone: 'warning' },
  EM_ANALISE: { label: 'Em análise', tone: 'warning' },
  APROVADO: { label: 'Aprovado', tone: 'success' },
  NEGADO: { label: 'Negado', tone: 'danger' },
  ENCERRADO: { label: 'Encerrado', tone: 'neutral' },
};

export const STATUS_DOC: Record<StatusDoc, string> = {
  processado: 'Processado',
  revisao_pendente: 'Revisão pendente',
};

export const TIPO_SINISTRO: Record<TipoSinistro, string> = {
  colisao: 'Colisão',
  roubo: 'Roubo',
  furto: 'Furto',
};

export const COBERTURA: Record<Cobertura, string> = {
  compreensiva: 'Compreensiva',
  colisao: 'Colisão',
  roubo_furto: 'Roubo e furto',
};

export const ETAPA_OPERACAO: Record<EtapaOperacao, string> = {
  upload: 'Upload',
  classificacao: 'Classificação',
  extracao: 'Extração',
  validacao: 'Validação',
  decisao: 'Decisão',
};

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// Classes Tailwind por "tone" de badge.
export const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-foreground/10 text-foreground/70',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  danger: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

/** Status do pipeline (backend real). Tolerante a valores novos. */
export function statusPipelineMeta(status?: string): {
  label: string;
  tone: Tone;
} {
  switch ((status ?? '').toUpperCase()) {
    case 'AGUARDANDO_PROCESSAMENTO':
      return { label: 'Aguardando processamento', tone: 'info' };
    case 'PROCESSANDO':
    case 'EM_PROCESSAMENTO':
      return { label: 'Processando', tone: 'info' };
    case 'SUCESSO':
    case 'CONCLUIDO':
    case 'PROCESSADO':
      return { label: 'Processado', tone: 'success' };
    case 'ERRO':
    case 'FALHA':
      return { label: 'Falha no processamento', tone: 'danger' };
    default:
      return { label: status || '—', tone: 'neutral' };
  }
}

/** Status terminais — quando o polling pode parar. */
export function statusPipelineTerminal(status?: string): boolean {
  const s = (status ?? '').toUpperCase();
  return ['SUCESSO', 'CONCLUIDO', 'PROCESSADO', 'ERRO', 'FALHA'].includes(s);
}
