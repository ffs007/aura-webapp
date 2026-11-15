/**
 * Cena em prosa para o prompt de imagem do caminho genérico.
 *
 * Correção 2026-11-15: a cena era montada com `JSON.stringify(...)` e ia crua
 * dentro do prompt. Medido: com esse formato o provedor (fal/flux) devolvia
 * **imagem preta 1024×768** para o pacote "visual" (roupas + maquiagem + cabelo
 * + acessórios). Convertendo a mesma cena para prosa, a imagem saiu normal —
 * por isso a cena nunca mais vai como JSON.
 */

const SEM_VALOR = /^(n[ãa]o se aplica|n\/a|na|-|—|)$/i;

function valorEmTexto(bruto: unknown): string {
  if (typeof bruto === "string") return bruto;
  if (typeof bruto === "number" && Number.isFinite(bruto)) return String(bruto);
  if (Array.isArray(bruto)) return bruto.map(valorEmTexto).filter(Boolean).join(", ");
  if (bruto && typeof bruto === "object") {
    return Object.values(bruto as Record<string, unknown>).map(valorEmTexto).filter(Boolean).join(", ");
  }
  return "";
}

/** `{ summary, clothing, makeup }` → "summary: …; clothing: …" (sem chaves, sem aspas, sem vazios). */
export function cenaEmProsa(valores: Record<string, unknown>, max = 1200): string {
  const partes: string[] = [];
  for (const [chave, bruto] of Object.entries(valores)) {
    const limpo = valorEmTexto(bruto).replace(/\s+/g, " ").trim();
    if (!limpo || SEM_VALOR.test(limpo)) continue;
    partes.push(`${chave}: ${limpo}`);
  }
  return partes.join("; ").slice(0, max);
}
