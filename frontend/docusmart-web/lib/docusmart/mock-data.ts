import type {
  Apolice,
  Documento,
  Operacao,
  Sinistro,
} from './types';

/**
 * Dataset de seed (seção 6 da especificação). Dados 100% fictícios.
 * As apólices são o "gabarito"; os 5 sinistros são a matriz de teste do QA,
 * cada um exercitando um gate diferente da regra de negócio.
 */

// ── 6.1 Apólices (gabarito) ──────────────────────────────────────────────────
export const APOLICES: Apolice[] = [
  {
    numero_apolice: 'AP-2024-5567',
    cpf_titular: '12345678900',
    nome_titular: 'Mariana Costa Lima',
    veiculo: { placa: 'RDX1A23', renavam: '00123456789', marca_modelo: 'Honda Civic EXL', ano: 2022 },
    vigencia: { inicio: '2025-08-01', fim: '2026-07-31' },
    valor_segurado: 95000.0,
    cobertura: 'compreensiva',
    contato: 'mariana.lima@email.com',
  },
  {
    numero_apolice: 'AP-2023-3310',
    cpf_titular: '98765432100',
    nome_titular: 'João Henrique Pereira',
    veiculo: { placa: 'MIX7888', renavam: '00987654321', marca_modelo: 'Volkswagen Golf', ano: 2020 },
    vigencia: { inicio: '2025-04-15', fim: '2026-04-14' },
    valor_segurado: 78000.0,
    cobertura: 'compreensiva',
    contato: 'joao.pereira@email.com',
  },
  {
    numero_apolice: 'AP-2025-1180',
    cpf_titular: '45678912300',
    nome_titular: 'Carla Souza Andrade',
    veiculo: { placa: 'QWE2C45', renavam: '00456789123', marca_modelo: 'Toyota Corolla XEI', ano: 2023 },
    vigencia: { inicio: '2025-11-01', fim: '2026-10-31' },
    valor_segurado: 110000.0,
    cobertura: 'compreensiva',
    contato: 'carla.andrade@email.com',
  },
  {
    numero_apolice: 'AP-2024-7702',
    cpf_titular: '32165498700',
    nome_titular: 'Roberto Alves Nunes',
    veiculo: { placa: 'RST3067', renavam: '00321654987', marca_modelo: 'Fiat Argo Drive', ano: 2021 },
    vigencia: { inicio: '2025-06-10', fim: '2026-06-09' },
    valor_segurado: 42000.0,
    cobertura: 'roubo_furto',
    contato: 'roberto.nunes@email.com',
  },
  {
    numero_apolice: 'AP-2025-2245',
    cpf_titular: '78912345600',
    nome_titular: 'Patrícia Gomes Ribeiro',
    veiculo: { placa: 'UVW4889', renavam: '00789123456', marca_modelo: 'Hyundai HB20 Vision', ano: 2022 },
    vigencia: { inicio: '2026-01-15', fim: '2027-01-14' },
    valor_segurado: 65000.0,
    cobertura: 'compreensiva',
    contato: 'patricia.ribeiro@email.com',
  },
  {
    numero_apolice: 'AP-2023-9981',
    cpf_titular: '65498732100',
    nome_titular: 'Fernando Lima Castro',
    veiculo: { placa: 'XYZ5F27', renavam: '00654987321', marca_modelo: 'Chevrolet Onix LT', ano: 2019 },
    vigencia: { inicio: '2025-03-20', fim: '2026-03-19' },
    valor_segurado: 56000.0,
    cobertura: 'colisao',
    contato: 'fernando.castro@email.com',
  },
];

// ── 4.3 Documentos (um item por arquivo) ─────────────────────────────────────
export const DOCUMENTOS: Documento[] = [
  // CASO 1 — SIN-2026-00123 (caminho feliz)
  {
    numero_sinistro: 'SIN-2026-00123',
    documento_id: 'DOC-01',
    tipo_documento: 'documento_identidade',
    score_classificacao: 0.96,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00123/cnh.jpg',
    campos_extraidos: { nome: 'Mariana Costa Lima', cpf: '12345678900' },
  },
  {
    numero_sinistro: 'SIN-2026-00123',
    documento_id: 'DOC-02',
    tipo_documento: 'crlv',
    score_classificacao: 0.93,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00123/crlv.pdf',
    campos_extraidos: { placa: 'RDX1A23', renavam: '00123456789', marca_modelo: 'Honda Civic EXL' },
  },
  {
    numero_sinistro: 'SIN-2026-00123',
    documento_id: 'DOC-03',
    tipo_documento: 'orcamento_nota_fiscal',
    score_classificacao: 0.91,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00123/orcamento_bomjesus.pdf',
    campos_extraidos: {
      oficina: 'Oficina Mecânica Bom Jesus',
      itens: [
        { descricao: 'Para-choque dianteiro', valor: 1800.0 },
        { descricao: 'Capô', valor: 1500.0 },
        { descricao: 'Mão de obra', valor: 900.0 },
      ],
      valor_total: 4200.0,
    },
  },

  // CASO 2 — SIN-2026-00130 (faltam documentos obrigatórios)
  {
    numero_sinistro: 'SIN-2026-00130',
    documento_id: 'DOC-01',
    tipo_documento: 'documento_identidade',
    score_classificacao: 0.94,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00130/cnh.jpg',
    campos_extraidos: { nome: 'Roberto Alves Nunes', cpf: '32165498700' },
  },

  // CASO 3 — SIN-2026-00141 (data fora da vigência)
  {
    numero_sinistro: 'SIN-2026-00141',
    documento_id: 'DOC-01',
    tipo_documento: 'documento_identidade',
    score_classificacao: 0.95,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00141/cnh.jpg',
    campos_extraidos: { nome: 'João Henrique Pereira', cpf: '98765432100' },
  },
  {
    numero_sinistro: 'SIN-2026-00141',
    documento_id: 'DOC-02',
    tipo_documento: 'crlv',
    score_classificacao: 0.92,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00141/crlv.pdf',
    campos_extraidos: { placa: 'MIX7888', renavam: '00987654321' },
  },
  {
    numero_sinistro: 'SIN-2026-00141',
    documento_id: 'DOC-03',
    tipo_documento: 'orcamento_nota_fiscal',
    score_classificacao: 0.9,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00141/orcamento.pdf',
    campos_extraidos: { oficina: 'Auto Center Pereira', valor_total: 3100.0 },
  },

  // CASO 4 — SIN-2026-00155 (valor acima do teto, com terceiros)
  {
    numero_sinistro: 'SIN-2026-00155',
    documento_id: 'DOC-01',
    tipo_documento: 'documento_identidade',
    score_classificacao: 0.97,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00155/cnh.jpg',
    campos_extraidos: { nome: 'Carla Souza Andrade', cpf: '45678912300' },
  },
  {
    numero_sinistro: 'SIN-2026-00155',
    documento_id: 'DOC-02',
    tipo_documento: 'crlv',
    score_classificacao: 0.95,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00155/crlv.pdf',
    campos_extraidos: { placa: 'QWE2C45', renavam: '00456789123' },
  },
  {
    numero_sinistro: 'SIN-2026-00155',
    documento_id: 'DOC-03',
    tipo_documento: 'boletim_ocorrencia',
    score_classificacao: 0.88,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00155/bo.pdf',
    campos_extraidos: { orgao: 'Polícia Civil - SP', terceiros_envolvidos: true },
  },
  {
    numero_sinistro: 'SIN-2026-00155',
    documento_id: 'DOC-04',
    tipo_documento: 'orcamento_nota_fiscal',
    score_classificacao: 0.9,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00155/orcamento_a.pdf',
    campos_extraidos: { oficina: 'Oficina Central', valor_total: 8500.0 },
  },
  {
    numero_sinistro: 'SIN-2026-00155',
    documento_id: 'DOC-05',
    tipo_documento: 'orcamento_nota_fiscal',
    score_classificacao: 0.89,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00155/orcamento_b.pdf',
    campos_extraidos: { oficina: 'Premium Car Service', valor_total: 9000.0 },
  },

  // CASO 5 — SIN-2026-00162 (baixa confiança na extração)
  {
    numero_sinistro: 'SIN-2026-00162',
    documento_id: 'DOC-01',
    tipo_documento: 'documento_identidade',
    score_classificacao: 0.94,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00162/cnh.jpg',
    campos_extraidos: { nome: 'Patrícia Gomes Ribeiro', cpf: '78912345600' },
  },
  {
    numero_sinistro: 'SIN-2026-00162',
    documento_id: 'DOC-02',
    tipo_documento: 'crlv',
    score_classificacao: 0.91,
    status_doc: 'processado',
    s3_key: 'raw/SIN-2026-00162/crlv.pdf',
    campos_extraidos: { placa: 'UVW4889', renavam: '00789123456' },
  },
  {
    numero_sinistro: 'SIN-2026-00162',
    documento_id: 'DOC-03',
    tipo_documento: 'laudo',
    score_classificacao: 0.62,
    status_doc: 'revisao_pendente',
    s3_key: 'raw/SIN-2026-00162/laudo.jpg',
    campos_extraidos: { observacao: 'Documento escaneado torto — baixa confiança na classificação' },
  },
];

// ── 4.4 Operações (log de auditoria) ─────────────────────────────────────────
export const OPERACOES: Operacao[] = [
  // CASO 1 — timeline completa (seção 7 do guia)
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:02:11', etapa: 'upload', detalhe: 'Pacote recebido (3 arquivos)' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:03:05', documento_id: 'DOC-01', etapa: 'classificacao', detalhe: 'documento_identidade (0.96)' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:03:40', documento_id: 'DOC-01', etapa: 'extracao', detalhe: '4 campos' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:04:12', documento_id: 'DOC-02', etapa: 'classificacao', detalhe: 'crlv (0.93)' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:04:50', documento_id: 'DOC-02', etapa: 'extracao', detalhe: '4 campos' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:05:30', documento_id: 'DOC-03', etapa: 'classificacao', detalhe: 'orcamento_nota_fiscal (0.91)' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:06:05', documento_id: 'DOC-03', etapa: 'extracao', detalhe: 'valor total R$ 4.200,00' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:06:40', etapa: 'validacao', detalhe: 'Documentação completa; consistente' },
  { numero_sinistro: 'SIN-2026-00123', timestamp: '2026-03-10T15:06:48', etapa: 'decisao', detalhe: 'Aprovado automático (abaixo do teto)' },

  // CASO 2
  { numero_sinistro: 'SIN-2026-00130', timestamp: '2026-02-18T09:12:00', etapa: 'upload', detalhe: 'Pacote recebido (1 arquivo)' },
  { numero_sinistro: 'SIN-2026-00130', timestamp: '2026-02-18T09:13:10', documento_id: 'DOC-01', etapa: 'classificacao', detalhe: 'documento_identidade (0.94)' },
  { numero_sinistro: 'SIN-2026-00130', timestamp: '2026-02-18T09:13:45', documento_id: 'DOC-01', etapa: 'extracao', detalhe: '2 campos' },
  { numero_sinistro: 'SIN-2026-00130', timestamp: '2026-02-18T09:14:20', etapa: 'validacao', detalhe: 'Faltam CRLV e boletim de ocorrência (roubo exige BO)' },
  { numero_sinistro: 'SIN-2026-00130', timestamp: '2026-02-18T09:14:25', etapa: 'decisao', detalhe: 'Pendente de documentação' },

  // CASO 3
  { numero_sinistro: 'SIN-2026-00141', timestamp: '2026-05-02T18:40:00', etapa: 'upload', detalhe: 'Pacote recebido (3 arquivos)' },
  { numero_sinistro: 'SIN-2026-00141', timestamp: '2026-05-02T18:41:30', documento_id: 'DOC-03', etapa: 'extracao', detalhe: 'valor total R$ 3.100,00' },
  { numero_sinistro: 'SIN-2026-00141', timestamp: '2026-05-02T18:42:10', etapa: 'validacao', detalhe: 'Data do sinistro fora da vigência da apólice' },
  { numero_sinistro: 'SIN-2026-00141', timestamp: '2026-05-02T18:42:15', etapa: 'decisao', detalhe: 'Encaminhado para análise especial (decisão humana)' },

  // CASO 4
  { numero_sinistro: 'SIN-2026-00155', timestamp: '2026-04-22T11:05:00', etapa: 'upload', detalhe: 'Pacote recebido (5 arquivos)' },
  { numero_sinistro: 'SIN-2026-00155', timestamp: '2026-04-22T11:07:20', etapa: 'extracao', detalhe: '2 orçamentos: R$ 8.500,00 e R$ 9.000,00' },
  { numero_sinistro: 'SIN-2026-00155', timestamp: '2026-04-22T11:08:00', etapa: 'validacao', detalhe: 'Consistente; valor de referência R$ 8.500,00 acima do teto' },
  { numero_sinistro: 'SIN-2026-00155', timestamp: '2026-04-22T11:08:05', etapa: 'decisao', detalhe: 'Em análise — fila do analista (valor acima do teto)' },

  // CASO 5
  { numero_sinistro: 'SIN-2026-00162', timestamp: '2026-03-30T14:20:00', etapa: 'upload', detalhe: 'Pacote recebido (3 arquivos)' },
  { numero_sinistro: 'SIN-2026-00162', timestamp: '2026-03-30T14:21:30', documento_id: 'DOC-03', etapa: 'classificacao', detalhe: 'laudo (0.62) — abaixo do limiar de confiança' },
  { numero_sinistro: 'SIN-2026-00162', timestamp: '2026-03-30T14:21:35', documento_id: 'DOC-03', etapa: 'validacao', detalhe: 'Documento marcado para revisão humana' },
];

// ── 4.2 Sinistros (registro central) ─────────────────────────────────────────
export const SINISTROS: Sinistro[] = [
  // CASO 1 — APROVADO automático
  {
    numero_sinistro: 'SIN-2026-00123',
    numero_apolice: 'AP-2024-5567',
    status: 'APROVADO',
    tipo_sinistro: 'colisao',
    data_sinistro: '2026-03-10',
    contexto: { local: 'Av. Hist. Rubens de Mendonça, Cuiabá-MT', terceiros_envolvidos: false },
    valor_total_orcamentos: 4200.0,
    documentos_faltantes: [],
    created_at: '2026-03-10T15:02:11',
    updated_at: '2026-03-10T15:06:48',
    dados_consolidados: {
      numero_sinistro: 'SIN-2026-00123',
      numero_apolice: 'AP-2024-5567',
      status: 'APROVADO',
      segurado: { nome: 'Mariana Costa Lima', cpf: '12345678900' },
      veiculo: { placa: 'RDX1A23', marca_modelo: 'Honda Civic EXL', ano: 2022 },
      evento: { tipo_sinistro: 'colisao', data_sinistro: '2026-03-10T14:30:00', local: 'Av. Hist. Rubens de Mendonça, Cuiabá-MT', terceiros_envolvidos: false },
      documentos: [
        { documento_id: 'DOC-01', tipo: 'documento_identidade', score: 0.96 },
        { documento_id: 'DOC-02', tipo: 'crlv', score: 0.93 },
        { documento_id: 'DOC-03', tipo: 'orcamento_nota_fiscal', score: 0.91 },
      ],
      orcamentos: [{ oficina: 'Oficina Mecânica Bom Jesus', valor_total: 4200.0 }],
      valor_referencia: 4200.0,
      validacoes: { documentos_completos: true, documentos_faltantes: [], consistencia_cpf: true, consistencia_placa: true, data_dentro_vigencia: true, dentro_do_teto: true },
      decisao: { status: 'APROVADO', motivo: 'Documentação completa, dados consistentes, valor abaixo do teto.', automatica: true },
      timestamps: { recebido_em: '2026-03-10T15:02:11', processado_em: '2026-03-10T15:06:48' },
    },
  },

  // CASO 2 — PENDENTE_DOCUMENTACAO
  {
    numero_sinistro: 'SIN-2026-00130',
    numero_apolice: 'AP-2024-7702',
    status: 'PENDENTE_DOCUMENTACAO',
    tipo_sinistro: 'roubo',
    data_sinistro: '2026-02-18',
    contexto: { local: 'Rua das Acácias, 220 - Campinas-SP', terceiros_envolvidos: false },
    valor_total_orcamentos: null,
    documentos_faltantes: ['crlv', 'boletim_ocorrencia'],
    created_at: '2026-02-18T09:12:00',
    updated_at: '2026-02-18T09:14:25',
    dados_consolidados: {
      numero_sinistro: 'SIN-2026-00130',
      numero_apolice: 'AP-2024-7702',
      status: 'PENDENTE_DOCUMENTACAO',
      segurado: { nome: 'Roberto Alves Nunes', cpf: '32165498700' },
      veiculo: { placa: 'RST3067', marca_modelo: 'Fiat Argo Drive', ano: 2021 },
      evento: { tipo_sinistro: 'roubo', data_sinistro: '2026-02-18T03:00:00', local: 'Rua das Acácias, 220 - Campinas-SP', terceiros_envolvidos: false },
      documentos: [{ documento_id: 'DOC-01', tipo: 'documento_identidade', score: 0.94 }],
      orcamentos: [],
      valor_referencia: 0,
      validacoes: { documentos_completos: false, documentos_faltantes: ['crlv', 'boletim_ocorrencia'], consistencia_cpf: true, consistencia_placa: false, data_dentro_vigencia: true, dentro_do_teto: false },
      decisao: { status: 'PENDENTE_DOCUMENTACAO', motivo: 'Documentos obrigatórios ausentes: CRLV e boletim de ocorrência (roubo exige BO).', automatica: true },
      timestamps: { recebido_em: '2026-02-18T09:12:00', processado_em: '2026-02-18T09:14:25' },
    },
  },

  // CASO 3 — análise especial (data fora da vigência) → EM_ANALISE
  {
    numero_sinistro: 'SIN-2026-00141',
    numero_apolice: 'AP-2023-3310',
    status: 'EM_ANALISE',
    tipo_sinistro: 'colisao',
    data_sinistro: '2026-05-02',
    contexto: { local: 'Rod. Anhanguera, km 90 - SP', terceiros_envolvidos: false },
    valor_total_orcamentos: 3100.0,
    documentos_faltantes: [],
    created_at: '2026-05-02T18:40:00',
    updated_at: '2026-05-02T18:42:15',
    dados_consolidados: {
      numero_sinistro: 'SIN-2026-00141',
      numero_apolice: 'AP-2023-3310',
      status: 'EM_ANALISE',
      segurado: { nome: 'João Henrique Pereira', cpf: '98765432100' },
      veiculo: { placa: 'MIX7888', marca_modelo: 'Volkswagen Golf', ano: 2020 },
      evento: { tipo_sinistro: 'colisao', data_sinistro: '2026-05-02T08:15:00', local: 'Rod. Anhanguera, km 90 - SP', terceiros_envolvidos: false },
      documentos: [
        { documento_id: 'DOC-01', tipo: 'documento_identidade', score: 0.95 },
        { documento_id: 'DOC-02', tipo: 'crlv', score: 0.92 },
        { documento_id: 'DOC-03', tipo: 'orcamento_nota_fiscal', score: 0.9 },
      ],
      orcamentos: [{ oficina: 'Auto Center Pereira', valor_total: 3100.0 }],
      valor_referencia: 3100.0,
      validacoes: { documentos_completos: true, documentos_faltantes: [], consistencia_cpf: true, consistencia_placa: true, data_dentro_vigencia: false, dentro_do_teto: true },
      decisao: { status: 'EM_ANALISE', motivo: 'Inconsistência grave: data do sinistro (02/05/2026) fora da vigência da apólice (encerra em 14/04/2026) — análise especial, decisão humana.', automatica: false },
      timestamps: { recebido_em: '2026-05-02T18:40:00', processado_em: '2026-05-02T18:42:15' },
    },
  },

  // CASO 4 — EM_ANALISE (valor acima do teto)
  {
    numero_sinistro: 'SIN-2026-00155',
    numero_apolice: 'AP-2025-1180',
    status: 'EM_ANALISE',
    tipo_sinistro: 'colisao',
    data_sinistro: '2026-04-22',
    contexto: { local: 'Av. Brasil, 1500 - Rio de Janeiro-RJ', terceiros_envolvidos: true },
    valor_total_orcamentos: 8500.0,
    documentos_faltantes: [],
    created_at: '2026-04-22T11:05:00',
    updated_at: '2026-04-22T11:08:05',
    dados_consolidados: {
      numero_sinistro: 'SIN-2026-00155',
      numero_apolice: 'AP-2025-1180',
      status: 'EM_ANALISE',
      segurado: { nome: 'Carla Souza Andrade', cpf: '45678912300' },
      veiculo: { placa: 'QWE2C45', marca_modelo: 'Toyota Corolla XEI', ano: 2023 },
      evento: { tipo_sinistro: 'colisao', data_sinistro: '2026-04-22T19:40:00', local: 'Av. Brasil, 1500 - Rio de Janeiro-RJ', terceiros_envolvidos: true },
      documentos: [
        { documento_id: 'DOC-01', tipo: 'documento_identidade', score: 0.97 },
        { documento_id: 'DOC-02', tipo: 'crlv', score: 0.95 },
        { documento_id: 'DOC-03', tipo: 'boletim_ocorrencia', score: 0.88 },
        { documento_id: 'DOC-04', tipo: 'orcamento_nota_fiscal', score: 0.9 },
        { documento_id: 'DOC-05', tipo: 'orcamento_nota_fiscal', score: 0.89 },
      ],
      orcamentos: [
        { oficina: 'Oficina Central', valor_total: 8500.0 },
        { oficina: 'Premium Car Service', valor_total: 9000.0 },
      ],
      valor_referencia: 8500.0, // menor valor (conservador)
      validacoes: { documentos_completos: true, documentos_faltantes: [], consistencia_cpf: true, consistencia_placa: true, data_dentro_vigencia: true, dentro_do_teto: false },
      decisao: { status: 'EM_ANALISE', motivo: 'Tudo consistente; valor de referência (R$ 8.500,00) acima do teto de auto-aprovação (R$ 5.000,00) — encaminhado à fila do analista.', automatica: false },
      timestamps: { recebido_em: '2026-04-22T11:05:00', processado_em: '2026-04-22T11:08:05' },
    },
  },

  // CASO 5 — revisão humana (baixa confiança) — retido antes da agregação
  {
    numero_sinistro: 'SIN-2026-00162',
    numero_apolice: 'AP-2025-2245',
    status: 'EM_PROCESSAMENTO',
    tipo_sinistro: 'colisao',
    data_sinistro: '2026-03-30',
    contexto: { local: 'Av. das Nações, 77 - Brasília-DF', terceiros_envolvidos: false },
    valor_total_orcamentos: null,
    documentos_faltantes: [],
    created_at: '2026-03-30T14:20:00',
    updated_at: '2026-03-30T14:21:35',
    dados_consolidados: null, // ainda não consolidado: doc de baixa confiança aguarda revisão
  },
];
