/**
 * Destino de retorno entre telas de entrada.
 *
 * Quando alguém clica em "Enviar meu briefing" numa micropágina pública, ou
 * quando a sessão expira no meio de uma tarefa, guardamos para onde a pessoa
 * queria ir. Depois do login/consentimento/onboarding ela volta para lá em vez
 * de cair sempre no Estúdio. Só aceitamos caminhos internos (começando com "/"
 * e nunca com "//"), para não virar redirecionamento aberto.
 */
const KEY = "aura.destino";

export function destinoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  // Barra invertida: o navegador normaliza "\" como "/" — "/\evil.com" viraria
  // "//evil.com" (redirecionamento externo). Rejeitamos qualquer ocorrência.
  if (valor.includes("\\")) return null;
  // Qualquer esquema embutido (data:, blob:, etc.) também está fora.
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(valor)) return null;
  return valor;
}

export function guardarDestino(destino: string) {
  const seguro = destinoSeguro(destino);
  if (!seguro) return;
  try {
    sessionStorage.setItem(KEY, seguro);
  } catch {
    // sem sessionStorage: o retorno simplesmente não é preservado
  }
}

export function lerDestino(): string | null {
  try {
    return destinoSeguro(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** Lê e limpa o destino (usar uma única vez, ao concluir a etapa de entrada). */
export function consumirDestino(): string | null {
  const destino = lerDestino();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ok
  }
  return destino;
}

export function limparDestino() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ok
  }
}

/**
 * Navega para um destino que pode conter query string (`/dashboard?batch=...`).
 * Usa navegação de página inteira para não depender do parsing de rota do
 * roteador e garantir que o destino seja respeitado em qualquer formato.
 */
export function irPara(destino: string) {
  if (typeof window === "undefined") return;
  window.location.assign(destino);
}
