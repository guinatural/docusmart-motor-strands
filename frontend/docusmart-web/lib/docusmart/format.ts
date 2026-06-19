/** Helpers de formatação para a UI (pt-BR). */

export function formatBRL(valor: number | null | undefined): string {
  if (valor == null) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatData(iso: string | null | undefined): string {
  if (!iso) return '—';
  // aceita "2026-03-10" ou "2026-03-10T15:02:11"
  const [dataParte] = iso.split('T');
  const [ano, mes, dia] = dataParte.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [dataParte, horaParte] = iso.split('T');
  const dataFmt = formatData(dataParte);
  if (!horaParte) return dataFmt;
  return `${dataFmt} ${horaParte.slice(0, 5)}`;
}

export function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
