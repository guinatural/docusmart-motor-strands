import type {
  EtapaOperacao,
  StatusDoc,
  StatusSinistro,
  TipoSinistro,
} from './types';

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// ── Rótulos e cores de status ────────────────────────────────────────────────
export const STATUS_SINISTRO: Record<
  StatusSinistro,
  { label: string; tone: Tone }
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

export const ETAPA_OPERACAO: Record<EtapaOperacao, string> = {
  upload: 'Upload',
  classificacao: 'Classificação',
  extracao: 'Extração',
  validacao: 'Validação',
  decisao: 'Decisão',
};

// Classes Tailwind por "tone" de badge.
export const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-foreground/10 text-foreground/70',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  danger: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

/** Status de negócio do sinistro (do backend). Tolerante a valores novos. */
export function statusSinistroMeta(status?: string): {
  label: string;
  tone: Tone;
} {
  const s = (status ?? '').toUpperCase();
  if (s in STATUS_SINISTRO) {
    return STATUS_SINISTRO[s as StatusSinistro];
  }
  if (s === 'ERRO' || s === 'FALHA') {
    return { label: 'Falha no processamento', tone: 'danger' };
  }
  return { label: status || '—', tone: 'neutral' };
}

/** Sinistro ainda em processamento (o polling deve continuar). */
export function sinistroEmProcessamento(status?: string): boolean {
  const s = (status ?? '').toUpperCase();
  return s === '' || s === 'EM_PROCESSAMENTO' || s === 'ABERTO';
}
