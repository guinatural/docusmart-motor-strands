/**
 * Modelo de dados do DocuSmart (espelha as 4 tabelas DynamoDB da especificação).
 * Tudo é fictício — projeto educacional de hackathon.
 */

// ── Enums ────────────────────────────────────────────────────────────────────
export type StatusSinistro =
  | 'ABERTO'
  | 'EM_PROCESSAMENTO'
  | 'PENDENTE_DOCUMENTACAO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'NEGADO'
  | 'ENCERRADO';

export type TipoSinistro = 'colisao' | 'roubo' | 'furto';

export type Cobertura = 'compreensiva' | 'colisao' | 'roubo_furto';

export type StatusDoc = 'processado' | 'revisao_pendente';

export type EtapaOperacao =
  | 'upload'
  | 'classificacao'
  | 'extracao'
  | 'validacao'
  | 'decisao';

// ── Apólices (gabarito, populada por seed) ───────────────────────────────────
export interface Apolice {
  numero_apolice: string;
  cpf_titular: string;
  nome_titular: string;
  veiculo: {
    placa: string;
    renavam: string;
    marca_modelo: string;
    ano: number;
  };
  vigencia: { inicio: string; fim: string };
  valor_segurado: number;
  cobertura: Cobertura;
  contato: string;
}

// ── Documentos (um item por arquivo) ─────────────────────────────────────────
export interface Documento {
  numero_sinistro: string;
  documento_id: string; // ex: DOC-01
  tipo_documento: string; // classe do Comprehend
  score_classificacao: number; // 0-1
  status_doc: StatusDoc;
  s3_key: string;
  campos_extraidos: Record<string, unknown>;
}

// ── Operações (log de auditoria) ─────────────────────────────────────────────
export interface Operacao {
  numero_sinistro: string;
  timestamp: string; // ISO → ordena no tempo
  documento_id?: string;
  etapa: EtapaOperacao;
  detalhe: string;
}

// ── Contrato consolidado (Sinistros.dados_consolidados) ──────────────────────
export interface Validacoes {
  documentos_completos: boolean;
  documentos_faltantes: string[];
  consistencia_cpf: boolean;
  consistencia_placa: boolean;
  data_dentro_vigencia: boolean;
  dentro_do_teto: boolean;
}

export interface DadosConsolidados {
  numero_sinistro: string;
  numero_apolice: string;
  status: StatusSinistro;
  segurado: { nome: string; cpf: string };
  veiculo: { placa: string; marca_modelo: string; ano: number };
  evento: {
    tipo_sinistro: TipoSinistro;
    data_sinistro: string;
    local: string;
    terceiros_envolvidos: boolean;
  };
  documentos: { documento_id: string; tipo: string; score: number }[];
  orcamentos: { oficina: string; valor_total: number }[];
  valor_referencia: number;
  validacoes: Validacoes;
  decisao: { status: StatusSinistro; motivo: string; automatica: boolean };
  timestamps: { recebido_em: string; processado_em: string | null };
}

// ── Sinistros (registro central) ─────────────────────────────────────────────
export interface Sinistro {
  numero_sinistro: string;
  numero_apolice: string;
  status: StatusSinistro;
  tipo_sinistro: TipoSinistro;
  data_sinistro: string;
  contexto: Record<string, unknown>; // dados do formulário de intake
  dados_consolidados: DadosConsolidados | null;
  valor_total_orcamentos: number | null;
  documentos_faltantes: string[];
  created_at: string;
  updated_at: string;
}

// ── Formulário de intake (página pública de upload) ──────────────────────────
export interface FormularioIntake {
  numero_apolice: string;
  tipo_sinistro: TipoSinistro;
  data_sinistro: string;
  local: string;
  terceiros_envolvidos: boolean;
  contato: string;
  arquivos: string[]; // nomes dos arquivos do pacote
}
