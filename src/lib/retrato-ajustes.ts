import { z } from "zod";

/**
 * Ajustes localizados do Aura Retrato — cada mudança amarrada a UM alvo.
 *
 * Correção 2026-11-15: o `safeParse` estrito (`alvo` ≤40, `mudanca` ≤200, no
 * máximo 6) reprovava pedidos válidos e a tela pedia para "descrever de forma
 * mais simples" sem que houvesse nada de errado no pedido. Agora o texto é
 * aparado e o excesso é cortado (ver `normalizarAjustesRetrato`).
 */
export const ajustesSchema = z.object({
  ajustes: z
    .array(z.object({ alvo: z.string().min(2).max(60), mudanca: z.string().min(2).max(300) }))
    .min(1)
    .max(6),
  duvidas: z.array(z.string().max(200)).max(3),
});

export type AjustesRetrato = z.infer<typeof ajustesSchema>;

function texto(bruto: unknown, max: number): string {
  if (typeof bruto !== "string") return "";
  return bruto.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Converte o JSON da IA em ajustes utilizáveis, cortando o excesso em vez de reprovar. */
export function normalizarAjustesRetrato(bruto: unknown): AjustesRetrato | null {
  if (!bruto || typeof bruto !== "object") return null;
  const d = bruto as Record<string, unknown>;
  const vistos = new Set<string>();
  const ajustes: { alvo: string; mudanca: string }[] = [];
  if (Array.isArray(d["ajustes"])) {
    for (const item of d["ajustes"]) {
      if (!item || typeof item !== "object") continue;
      const a = item as Record<string, unknown>;
      const alvo = texto(a["alvo"] ?? a["target"], 60);
      const mudanca = texto(a["mudanca"] ?? a["mudança"] ?? a["change"], 300);
      if (alvo.length < 2 || mudanca.length < 2) continue;
      const chave = `${alvo.toLowerCase()}|${mudanca.toLowerCase()}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      ajustes.push({ alvo, mudanca });
      if (ajustes.length >= 6) break;
    }
  }
  if (!ajustes.length) return null;
  const duvidas = (Array.isArray(d["duvidas"]) ? d["duvidas"] : []).map((x) => texto(x, 200)).filter(Boolean).slice(0, 3);
  return { ajustes, duvidas };
}
