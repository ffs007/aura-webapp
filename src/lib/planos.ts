/**
 * Espelho NO WEBAPP da política de uso justo aplicada no gateway.
 *
 * A fonte da verdade é o `ai-gateway` (limites ajustáveis por env). Aqui ficam
 * apenas os valores padrão para exibir ao usuário ("X de N imagens no mês") e os
 * nomes dos planos. Se a política mudar no gateway, atualize aqui também.
 */

export type Plano = "pass" | "pro";

export interface LimitePlano {
  imagensMes: number;
  imagensDia: number;
  textoMes: number;
}

export const LIMITES_PLANO: Record<Plano, LimitePlano> = {
  pass: { imagensMes: 50, imagensDia: 12, textoMes: 400 },
  pro: { imagensMes: 150, imagensDia: 30, textoMes: 1200 },
};

export const NOME_PLANO: Record<Plano, string> = {
  pass: "Aura Pass",
  pro: "Plano Profissional",
};

export function ehPlano(valor: unknown): valor is Plano {
  return valor === "pass" || valor === "pro";
}

/** Resumo curto para o chip de cota. */
export function resumoUsoImagens(
  plano: Plano,
  uso: { imagensMes: number; imagensHoje: number },
): string {
  const limite = LIMITES_PLANO[plano];
  const mes = Math.max(0, Math.min(uso.imagensMes, limite.imagensMes));
  const hoje = Math.max(0, Math.min(uso.imagensHoje, limite.imagensDia));
  return `${NOME_PLANO[plano]} · ${mes}/${limite.imagensMes} imagens no mês · hoje ${hoje}/${limite.imagensDia}`;
}
