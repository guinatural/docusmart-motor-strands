/**
 * "Login" de demonstração — apenas client-side (localStorage). NÃO é segurança
 * real; serve para gatear a área do analista no protótipo (Cognito não liberado
 * no ambiente do hackathon).
 */
const KEY = 'docusmart_usuario';

export function entrar(nome: string): void {
  localStorage.setItem(KEY, nome || 'Analista');
}

export function sair(): void {
  localStorage.removeItem(KEY);
}

export function usuarioAtual(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}
