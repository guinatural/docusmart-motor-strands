/**
 * Tipos de domínio usados na camada de apresentação (rótulos/badges).
 * Os tipos da API (Sinistro, Documento, etc.) ficam em `api.ts`.
 */
export type StatusSinistro =
  | 'ABERTO'
  | 'EM_PROCESSAMENTO'
  | 'PENDENTE_DOCUMENTACAO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'NEGADO'
  | 'ENCERRADO';

export type TipoSinistro = 'colisao' | 'roubo' | 'furto';

export type StatusDoc = 'processado' | 'revisao_pendente';

export type EtapaOperacao =
  | 'upload'
  | 'classificacao'
  | 'extracao'
  | 'validacao'
  | 'decisao';
