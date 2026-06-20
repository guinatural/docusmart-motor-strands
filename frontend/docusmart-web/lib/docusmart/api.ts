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
  return res.json();
}

// ── Consulta de documento (GET /sinistro/{id}) ───────────────────────────────
// id = UUID do sinistro/documento (não o protocolo SIN-xxxx).
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

export interface DocumentoApi {
  id?: string;
  sinistro_id?: string;
  tipo_documento?: string;
  confianca?: number | string;
  status_pipeline?: string;
  resumo?: string;
  processado_em?: string;
  data_processamento_pipeline?: string;
  s3_origem?: { bucket?: string; key?: string };
  dados_formulario?: DadosFormularioApi;
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
    // pode vir como objeto {nome,cpf,funcao} ou string ("1 veículo")
    envolvidos?: (Envolvido | string)[];
    [campo: string]: unknown;
  };
  [campo: string]: unknown;
}

export interface OperacaoApi {
  id?: string;
  sinistro_id?: string;
  etapa?: string;
  status?: string;
  detalhe?: string;
  detalhes?: string;
  ts?: string;
  timestamp?: string;
  [campo: string]: unknown;
}

export interface DocumentoResposta {
  documento: DocumentoApi;
  historico_operacoes: OperacaoApi[];
}

export async function obterDocumento(id: string): Promise<DocumentoResposta> {
  const res = await fetch(`${API_BASE}/sinistro/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    throw new Error('Sinistro não encontrado.');
  }
  if (!res.ok) {
    throw new Error(`Falha ao consultar o sinistro (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return {
    documento: data?.documento ?? {},
    historico_operacoes: data?.historico_operacoes ?? [],
  };
}

/** Lista de sinistros para o painel do analista (GET /sinistros). */
export async function listarSinistrosApi(): Promise<DocumentoApi[]> {
  const res = await fetch(`${API_BASE}/sinistros`);
  if (!res.ok) {
    throw new Error(`Falha ao carregar a lista (HTTP ${res.status}).`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data?.sinistros ?? [];
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
