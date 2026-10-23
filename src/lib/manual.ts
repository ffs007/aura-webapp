import { LEVEL_LABEL } from "./aura";
import { DISCLAIMER, SKILL_LABEL, type Kit, type MakeupLook, type Signature } from "./makeup";

export function lookToMarkdown(c: MakeupLook, note?: string | null) {
  return [
    `## ${c.title}`, `_Gerado por IA — um convite, não uma regra._`, ``, c.invitation, ``, `**Por que pode funcionar:** ${c.why_it_works}`, ``,
    ...c.variations.flatMap((v) => [
      `### ${LEVEL_LABEL[v.level]} — ${v.summary}`, `${v.time_minutes} min · habilidade ${SKILL_LABEL[v.skill] ?? v.skill} · ${v.cost_brl}`, ``,
      `**Produtos:**`, ...v.products.map((x) => `- [ ] ${x}`), ``, `**Ordem:**`, ...v.steps.map((x, i) => `${i + 1}. ${x}`), ``,
    ]),
    `**Se algo não sair como esperado:**`, ...c.adjustments.map((x) => `- ${x}`), ``, `**Como adaptar:** ${c.adaptation}`,
    ...(c.risks.length ? [``, `**Pontos de atenção:**`, ...c.risks.map((x) => `- ${x}`)] : []),
    ...(note ? [``, `**Minhas notas:** ${note}`] : []),
  ].join("\n");
}

export function signatureToMarkdown(s: Signature) {
  return [`## Assinatura: ${s.name}`, s.essence, ``, `**Acabamento:** ${s.finish}`, `**Cores:** ${s.colors.join(", ")}`, ``, `**Passos-assinatura:**`, ...s.signature_steps.map((x, i) => `${i + 1}. ${x}`), ``, `**Sempre:** ${s.always.join("; ")}`, `**Evito:** ${s.never.join("; ")}`, ``, s.notes].join("\n");
}

export function kitToMarkdown(k: Kit) {
  return [`## Kit: ${k.name}`, k.purpose, ``, ...k.items.map((i) => `- [ ] **${i.item}** (${i.price_brl}) — ${i.why}`), ``, `**Ordem de uso:**`, ...k.order.map((x, i) => `${i + 1}. ${x}`), ``, `**Total estimado:** ${k.total_brl}`].join("\n");
}

export function manualMarkdown(sig: Signature | null, kits: Kit[], looks: { content: MakeupLook; note: string | null }[]) {
  return [
    `# Meu manual de maquiagem — Aura ID`, `_${DISCLAIMER}_`, ``,
    sig ? signatureToMarkdown(sig) : "", ``,
    ...(kits.length ? [`# Kits de confiança`, ...kits.map(kitToMarkdown)] : []), ``,
    ...(looks.length ? [`# Looks salvos`, ...looks.map((l) => lookToMarkdown(l.content, l.note))] : []),
  ].join("\n\n");
}
