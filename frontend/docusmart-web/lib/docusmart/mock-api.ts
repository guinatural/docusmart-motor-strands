/**
 * Camada de "API" mockada. Tudo roda em memória, sem rede e sem persistência real.
 * As funções são assíncronas de propósito: quando o backend AWS (API Gateway) existir,
 * basta trocar o corpo destas funções por chamadas `fetch` mantendo as mesmas assinaturas.
 */
import { APOLICES, DOCUMENTOS, OPERACOES, SINISTROS } from './mock-data';
import { formatBRL } from './format';
import { ETAPA_OPERACAO, STATUS_SINISTRO, TIPO_SINISTRO } from './constants';
import type {
  Apolice,
  Documento,
  FormularioIntake,
  Operacao,
  Sinistro,
} from './types';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export interface SinistroDetalhe {
  sinistro: Sinistro;
  apolice: Apolice | null;
  documentos: Documento[];
  operacoes: Operacao[];
}

export async function listarSinistros(): Promise<Sinistro[]> {
  await delay();
  return [...SINISTROS].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function obterApolice(numero: string): Promise<Apolice | null> {
  await delay(120);
  return APOLICES.find((a) => a.numero_apolice === numero) ?? null;
}

export async function obterSinistro(
  numero: string,
): Promise<SinistroDetalhe | null> {
  await delay();
  const sinistro = SINISTROS.find((s) => s.numero_sinistro === numero);
  if (!sinistro) return null;
  return {
    sinistro,
    apolice: APOLICES.find((a) => a.numero_apolice === sinistro.numero_apolice) ?? null,
    documentos: DOCUMENTOS.filter((d) => d.numero_sinistro === numero),
    operacoes: OPERACOES.filter((o) => o.numero_sinistro === numero).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    ),
  };
}

export interface IntakeResultado {
  ok: boolean;
  numero_sinistro?: string;
  status?: Sinistro['status'];
  erro?: string;
}

/**
 * Gate 0 (intake): a apólice precisa existir. Gera o número de protocolo do sinistro.
 * Mock: não persiste — apenas devolve o protocolo para o cliente acompanhar.
 */
export async function criarSinistro(
  form: FormularioIntake,
): Promise<IntakeResultado> {
  await delay(600);

  const apolice = APOLICES.find((a) => a.numero_apolice === form.numero_apolice.trim());
  if (!apolice) {
    return {
      ok: false,
      erro: 'Apólice não encontrada. Verifique o número informado (ex.: AP-2024-5567).',
    };
  }
  if (!form.arquivos.length) {
    return { ok: false, erro: 'Anexe ao menos um documento do pacote de sinistro.' };
  }

  // protocolo fictício, derivado do número de sinistros existentes
  const proximo = 200 + SINISTROS.length + Math.floor(Math.random() * 90);
  const numero = `SIN-2026-00${proximo}`;

  return { ok: true, numero_sinistro: numero, status: 'EM_PROCESSAMENTO' };
}

// ── Agente SAC (mock) ────────────────────────────────────────────────────────
export interface RespostaAgente {
  resposta: string;
  fonte: string; // de qual fonte (regra/estrutura/auditoria/semântica) veio
}

const NUMERO_REGEX = /SIN-?\s?2026-?\s?0*\d{3,5}/i;

function normalizarNumero(bruto: string): string {
  const apenas = bruto.replace(/[^0-9]/g, '');
  const sufixo = apenas.slice(-5);
  return `SIN-2026-${sufixo.padStart(5, '0')}`;
}

/**
 * Responde perguntas em linguagem natural sobre os sinistros do seed.
 * Faz match por palavra-chave nas 4 fontes (estrutura, regra, auditoria, semântica).
 */
export async function perguntarAgente(pergunta: string): Promise<RespostaAgente> {
  await delay(700);
  const q = pergunta.toLowerCase();

  // identifica um sinistro citado na pergunta
  const match = pergunta.match(NUMERO_REGEX);
  const numero = match ? normalizarNumero(match[0]) : null;
  const sinistro = numero ? SINISTROS.find((s) => s.numero_sinistro === numero) : null;

  // intenção: resumo por tipo / período
  if (/(resum|colis|roub|furt).*(seman|m[eê]s|per[ií]odo)|resum/.test(q) && !sinistro) {
    const porTipo = SINISTROS.reduce<Record<string, number>>((acc, s) => {
      acc[s.tipo_sinistro] = (acc[s.tipo_sinistro] ?? 0) + 1;
      return acc;
    }, {});
    const linhas = Object.entries(porTipo)
      .map(([tipo, n]) => `${n} de ${TIPO_SINISTRO[tipo as keyof typeof TIPO_SINISTRO] ?? tipo}`)
      .join(', ');
    return {
      resposta: `Há ${SINISTROS.length} sinistros no período: ${linhas}. As colisões estão majoritariamente em análise ou aprovadas; o caso de roubo está pendente de documentação.`,
      fonte: 'Busca semântica (S3 Vectors)',
    };
  }

  if (!sinistro) {
    return {
      resposta:
        'Posso responder sobre valor de orçamento, documentos faltantes e operações de um sinistro. Cite o número, por exemplo: "Qual o valor do orçamento do SIN-2026-00123?".',
      fonte: '—',
    };
  }

  const dc = sinistro.dados_consolidados;

  // intenção: valor / orçamento
  if (/(valor|or[çc]amento|custo|quanto)/.test(q)) {
    if (!dc || dc.orcamentos.length === 0) {
      return {
        resposta: `O sinistro ${sinistro.numero_sinistro} ainda não tem orçamento consolidado.`,
        fonte: 'Consulta estruturada (DynamoDB · Sinistros)',
      };
    }
    const lista = dc.orcamentos
      .map((o) => `${o.oficina}: ${formatBRL(o.valor_total)}`)
      .join('; ');
    const ref =
      dc.orcamentos.length > 1
        ? ` Valor de referência (menor, conservador): ${formatBRL(dc.valor_referencia)}.`
        : '';
    return {
      resposta: `${sinistro.numero_sinistro} tem ${dc.orcamentos.length} orçamento(s) — ${lista}.${ref}`,
      fonte: 'Consulta estruturada (DynamoDB · Sinistros)',
    };
  }

  // intenção: documentos faltantes
  if (/(falt|pendente|document|obrigat)/.test(q)) {
    const faltantes = sinistro.documentos_faltantes;
    if (!faltantes.length) {
      return {
        resposta: `Nenhum documento faltando em ${sinistro.numero_sinistro}. ${
          sinistro.tipo_sinistro === 'colisao' && !(sinistro.contexto as { terceiros_envolvidos?: boolean }).terceiros_envolvidos
            ? 'BO não exigido (colisão sem terceiros).'
            : ''
        }`.trim(),
        fonte: 'Regra de negócio + DynamoDB · Documentos',
      };
    }
    return {
      resposta: `Em ${sinistro.numero_sinistro} faltam: ${faltantes.join(', ')}.`,
      fonte: 'Regra de negócio + DynamoDB · Documentos',
    };
  }

  // intenção: operações / auditoria
  if (/(opera|etapa|hist[óo]rico|auditoria|fizer|feita|aconteceu)/.test(q)) {
    const ops = OPERACOES.filter((o) => o.numero_sinistro === sinistro.numero_sinistro);
    const linha = ops
      .map((o) => ETAPA_OPERACAO[o.etapa])
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(' → ');
    return {
      resposta: `Operações de ${sinistro.numero_sinistro}: ${linha}. Total de ${ops.length} registros de auditoria.`,
      fonte: 'Auditoria (DynamoDB · Operacoes)',
    };
  }

  // intenção: status / decisão
  if (/(status|situa|decis|aprov|nega)/.test(q)) {
    const s = STATUS_SINISTRO[sinistro.status].label;
    const motivo = dc ? ` Motivo: ${dc.decisao.motivo}` : '';
    return {
      resposta: `${sinistro.numero_sinistro} está "${s}".${motivo}`,
      fonte: 'Consulta estruturada (DynamoDB · Sinistros)',
    };
  }

  // fallback com resumo do sinistro
  return {
    resposta: `${sinistro.numero_sinistro} — ${STATUS_SINISTRO[sinistro.status].label}. ${
      dc ? dc.decisao.motivo : 'Ainda em processamento.'
    }`,
    fonte: 'Consulta estruturada (DynamoDB · Sinistros)',
  };
}

export const PERGUNTAS_SUGERIDAS = [
  'Qual o valor do orçamento do SIN-2026-00123?',
  'Quais documentos estão faltando no SIN-2026-00130?',
  'Quais operações foram feitas no SIN-2026-00123?',
  'Resuma as colisões da semana',
];
