/**
 * Janela deslizante de limite de uso — lógica pura, sem servidor.
 *
 * Usada para conter abuso em ações de escrita baratas (feedback, briefing) antes
 * de escalar para uma regra de rate limit na borda (Cloudflare/Vercel).
 */

export type ResultadoLimite =
  | { permitido: true; restantes: number }
  | { permitido: false; retryAfterMs: number };

/**
 * Avalia se uma nova ocorrência cabe na janela.
 *
 * @param ocorrencias timestamps (ms) das ocorrências já registradas
 * @param agora timestamp (ms) da tentativa atual
 * @param max máximo de ocorrências permitidas dentro da janela
 * @param janelaMs tamanho da janela em ms
 */
export function avaliarJanela(
  ocorrencias: readonly number[],
  agora: number,
  max: number,
  janelaMs: number,
): ResultadoLimite {
  if (!Number.isFinite(max) || max <= 0) {
    return { permitido: false, retryAfterMs: janelaMs };
  }
  const inicio = agora - janelaMs;
  const dentro = ocorrencias
    .filter((t) => Number.isFinite(t) && t > inicio && t <= agora)
    .sort((a, b) => a - b);
  if (dentro.length < max) return { permitido: true, restantes: max - dentro.length };
  // Para liberar uma nova, a ocorrência mais antiga da janela precisa expirar.
  const maisAntiga = dentro[dentro.length - max] ?? agora;
  return { permitido: false, retryAfterMs: Math.max(1_000, maisAntiga + janelaMs - agora) };
}

/** Mensagem única para o usuário quando o limite é atingido. */
export function mensagemDeLimite(retryAfterMs: number): string {
  const minutos = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `Recebemos muitos envios seus em pouco tempo. Tente novamente em ${minutos} min.`;
}
