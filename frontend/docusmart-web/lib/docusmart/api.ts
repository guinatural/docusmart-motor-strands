/**
 * Client da API real (AWS API Gateway).
 *
 * Endpoints: POST /upload, POST /sinistro, GET /sinistro/{id}, GET /sinistros,
 * POST /chat. A base URL vem de NEXT_PUBLIC_API_BASE_URL; se não definida, usa
 * o endpoint atual como fallback.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://8ntra04xyh.execute-api.us-east-1.amazonaws.com/prod';

const EXT_CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

function contentTypeDe(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  return EXT_CONTENT_TYPE[ext] ?? 'application/octet-stream';
}

interface UploadUrlResposta {
  upload_url: string;
  key: string;
}

/** Passo 1: pede a presigned URL ao backend. */
export async function solicitarUploadUrl(
  filename: string,
  contentType: string,
): Promise<UploadUrlResposta> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content_type: contentType }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao solicitar URL de upload (HTTP ${res.status}).`);
  }
  return res.json();
}

/** Passo 2: envia o arquivo direto pro S3 usando a presigned URL. */
export async function enviarArquivoParaS3(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Falha ao enviar "${file.name}" ao S3 (HTTP ${res.status}).`);
  }
}

/** Combina os 2 passos. Retorna a key do objeto no S3. */
export async function uploadArquivo(file: File): Promise<string> {
  const contentType = contentTypeDe(file);
  const { upload_url, key } = await solicitarUploadUrl(file.name, contentType);
  await enviarArquivoParaS3(upload_url, file, contentType);
  return key;
}

/** Sobe todos os arquivos do pacote em paralelo e devolve as keys. */
export async function uploadPacote(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadArquivo));
}

// ── Intake (POST /sinistro) ──────────────────────────────────────────────────
export interface DadosFormulario {
  numero_apolice: string;
  tipo_sinistro: string;
  data_sinistro: string;
  local: string;
  terceiros_envolvidos: boolean;
  contato: string;
}

export interface IntakeResposta {
  sinistro_id: string;
  status: string;
}

/** Cria o sinistro e dispara o pipeline. Retorna o sinistro_id (protocolo). */
export async function criarSinistroApi(
  dadosFormulario: DadosFormulario,
  keys: string[],
): Promise<IntakeResposta> {
  const res = await fetch(`${API_BASE}/sinistro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados_formulario: dadosFormulario, keys }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao registrar o sinistro (HTTP ${res.status}).`);
  }
  const data = await res.json();
  // O intake retorna objeto único {sinistro_id,status} para 1 arquivo,
  // ou {sinistros:[...]} para vários. Normalizamos para o primeiro protocolo.
  if (Array.isArray(data?.sinistros) && data.sinistros.length > 0) {
    return data.sinistros[0];
  }
  return data;
}

// ── Modelo de dados (GET /sinistro/{id} e GET /sinistros) ────────────────────
export interface Envolvido {
  nome?: string;
  cpf?: string;
  funcao?: string;
}

export interface DadosFormularioApi {
  numero_apolice?: string;
  tipo_sinistro?: string;
  data_sinistro?: string;
  local?: string;
  terceiros_envolvidos?: boolean;
  contato?: string;
}

export interface LabelDetectado {
  label?: string;
  confianca?: number | string;
}

/** Um documento processado do pacote (item DOCUMENTO). */
export interface DocumentoApi {
  id?: string;
  sinistro_id?: string;
  documento_id?: string;
  tipo_documento?: string;
  confianca?: number | string;
  status_doc?: string;
  resumo?: string;
  processado_em?: string;
  s3_origem?: { bucket?: string; key?: string };
  url_visualizacao?: string;
  labels_detectados?: LabelDetectado[];
  campos_extraidos?: {
    marca_modelo?: string;
    placa_veiculo?: string;
    chassi?: string;
    renavam?: string;
    ano?: string;
    cor?: string;
    local?: string;
    valor_prejuizo?: string;
    envolvidos?: (Envolvido | string)[];
    [campo: string]: unknown;
  };
  [campo: string]: unknown;
}

export interface Validacoes {
  documentos_completos?: boolean;
  documentos_faltantes?: string[];
  consistencia_cpf?: boolean;
  consistencia_placa?: boolean;
  data_dentro_vigencia?: boolean;
  dentro_do_teto?: boolean;
}

export interface Decisao {
  status?: string;
  motivo?: string;
  automatica?: boolean;
}

export interface DadosConsolidados {
  numero_apolice?: string;
  segurado?: { nome?: string; cpf?: string };
  veiculo?: { placa?: string; marca_modelo?: string; ano?: number | string };
  evento?: {
    tipo_sinistro?: string;
    data_sinistro?: string;
    local?: string;
    terceiros_envolvidos?: boolean;
  };
  documentos?: { documento_id?: string; tipo?: string; score?: number }[];
  orcamentos?: { oficina?: string; valor_total?: number }[];
  valor_referencia?: number;
  validacoes?: Validacoes;
  decisao?: Decisao;
  timestamps?: { recebido_em?: string; processado_em?: string };
}

/** O registro central (item SINISTRO). */
export interface SinistroApi {
  id?: string;
  sinistro_id?: string;
  numero_apolice?: string;
  status?: string;
  dados_formulario?: DadosFormularioApi;
  dados_consolidados?: DadosConsolidados | null;
  total_documentos?: number;
  valor_total_orcamentos?: number | null;
  documentos_faltantes?: string[];
  revisao_pendente?: boolean;
  observacao_analista?: string;
  revisado_em?: string;
  created_at?: string;
  updated_at?: string;
  [campo: string]: unknown;
}

export interface OperacaoApi {
  id?: string;
  sinistro_id?: string;
  documento_id?: string;
  etapa?: string;
  status?: string;
  detalhe?: string;
  detalhes?: string;
  ts?: string;
  timestamp?: string;
  [campo: string]: unknown;
}

export interface SinistroDetalhe {
  sinistro: SinistroApi;
  documentos: DocumentoApi[];
  historico_operacoes: OperacaoApi[];
}

/** GET /sinistro/{id} → sinistro + documentos[] + auditoria. */
export async function obterSinistro(id: string): Promise<SinistroDetalhe> {
  const res = await fetch(`${API_BASE}/sinistro/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    throw new Error('Sinistro não encontrado.');
  }
  if (!res.ok) {
    throw new Error(`Falha ao consultar o sinistro (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return {
    sinistro: data?.sinistro ?? {},
    documentos: data?.documentos ?? [],
    historico_operacoes: data?.historico_operacoes ?? [],
  };
}

/** GET /sinistros → lista (1 por sinistro) para o painel. */
export async function listarSinistrosApi(): Promise<SinistroApi[]> {
  const res = await fetch(`${API_BASE}/sinistros`);
  if (!res.ok) {
    throw new Error(`Falha ao carregar a lista (HTTP ${res.status}).`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data?.sinistros ?? [];
}

/** PUT /sinistro/{id} → decisão manual do analista (verificação manual). */
export async function decidirSinistroApi(
  id: string,
  status: string,
  observacao?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/sinistro/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, observacao }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao atualizar o sinistro (HTTP ${res.status}).`);
  }
}

/**
 * Normaliza a confiança para 0–100 (inteiro). O backend manda em vários
 * formatos: "0.93", "0.935", "95", "93,5%", "", "0", null. Trata todos.
 */
export function confiancaPct(v: number | string | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace('%', '').replace(',', '.');
  if (!s) return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n; // fração vs já-percentual
  return Math.round(pct);
}

// ── Agente SAC (POST /chat) ──────────────────────────────────────────────────
export interface RespostaAgente {
  resposta: string;
}

/** Gera um id de sessão para manter o contexto da conversa. */
export function novaSessaoChat(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Envia a pergunta ao agente SAC.
 * Contrato: body { message, session_id } → resposta em data.response.
 */
export async function perguntarAgenteApi(
  message: string,
  sessionId: string,
): Promise<RespostaAgente> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao consultar o assistente (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as {
    response?: string;
  } | null;

  const texto = data?.response;
  return {
    resposta:
      typeof texto === 'string' && texto.trim()
        ? texto
        : 'Não consegui interpretar a resposta do assistente.',
  };
}
