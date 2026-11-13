import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Outfit } from "./clothing";
import { planToMarkdown as hairPlanToMarkdown, type HairPlan } from "./hair";
import { lookToMarkdown } from "./manual";
import type { MakeupLook } from "./makeup";

export const ENTRY_MODES = [
  { id: "general", label: "Transformação geral", hint: "Uma evolução gentil e gradual" },
  { id: "event", label: "Modo evento", hint: "Prepare-se para uma ocasião" },
  { id: "quick", label: "Teste rápido", hint: "Experimente algo pequeno hoje" },
  { id: "professional", label: "Imagem profissional", hint: "Presença no trabalho" },
  { id: "makeup", label: "Maquiagem", hint: "Texturas, rituais, expressão" },
  { id: "hair", label: "Cabelo", hint: "Cortes, cor, finalização" },
  { id: "beard", label: "Barba", hint: "Desenho, comprimento e cuidados" },
  { id: "clothing", label: "Roupas e estilo", hint: "Silhuetas e paletas" },
  { id: "tattoo", label: "Planejamento de tatuagem", hint: "Posição e visibilidade" },
] as const;

export const MODULES = [
  { id: "makeup", label: "Maquiagem" },
  { id: "hair", label: "Cabelo" },
  { id: "beard", label: "Barba" },
  { id: "clothing", label: "Roupas e estilo" },
  { id: "tattoo", label: "Tatuagem" },
  { id: "journey", label: "Jornada e relatórios" },
  { id: "professional", label: "Imagem profissional" },
] as const;

export const EMOTIONAL_MODES = [
  { id: "gentle", label: "Com delicadeza", hint: "Quero conforto e passos pequenos" },
  { id: "curious", label: "Curiosidade", hint: "Me mostre possibilidades" },
  { id: "brave", label: "Coragem", hint: "Topo algo mais ousado" },
  { id: "tired", label: "Pouca energia", hint: "Que seja sem esforço" },
  { id: "celebrating", label: "Celebrando", hint: "Quero me sentir especial" },
] as const;

export const LEVEL_LABEL: Record<string, string> = { safe: "Segura", intermediate: "Intermediária", bold: "Ousada" };
export const LEVEL3: Record<string, string> = { low: "baixo", medium: "médio", high: "alto" };
export const REVERSIBILITY: Record<string, string> = { easy: "fácil", moderate: "moderada", permanent: "permanente" };
export const STATUS_LABEL: Record<string, string> = { new: "nova", saved: "salva", approved: "aprovada", rejected: "rejeitada" };

export const CONSENT_ITEMS = [
  { key: "photo_processing", title: "Processamento de fotos e referências", body: "Permite enviar fotos ou referências. Elas ficam privadas, só você vê, e podem ser excluídas a qualquer momento." },
  { key: "personalization", title: "Personalização entre módulos (DNA Visual)", body: "Permite que suas reações e feedback formem um DNA Visual editável, usado em maquiagem, cabelo, roupas e tatuagem. Você pode pausar, corrigir ou redefinir quando quiser." },
  { key: "reminders", title: "Lembretes no app", body: "Lembretes gentis dos passos do seu plano e de revisar seu DNA Visual. Nenhuma mensagem externa é enviada." },
] as const;

export type Variation = { level: "safe" | "intermediate" | "bold"; summary: string; clothing: string; makeup: string; hair: string; beard?: string; accessories: string; tattoo_visibility: string };

export type AuraPackage = {
  title: string; invitation: string; why_it_works: string; variations: Variation[];
  cost: "low" | "medium" | "high"; cost_note: string; maintenance: "low" | "medium" | "high";
  reversibility: "easy" | "moderate" | "permanent"; adaptation_time: string; risks: string[];
  professional_validation: boolean; professional_validation_note: string; steps: string[]; event_checklist: string[];
};

export type PackageRow = {
  id: string; batch_id: string; entry_mode: string; emotional_mode: string | null; content: AuraPackage;
  status: string; note: string | null; beautiful_not_practical: boolean; created_at: string; kind?: string;
};

export type DnaSummary = {
  headline: string; explanation: string; colors_liked: string[]; colors_rejected: string[]; styles_liked: string[]; styles_rejected: string[];
  maintenance: string; budget: string; professional_goals: string; social_goals: string; emotional_comfort: string; body_notes: string;
  permanent_change: string; works_in_life: string[]; theory_only: string[]; change_readiness: string; practicality: string;
  guardrails: string[]; constraints: string[]; module_notes: { makeup: string; hair: string; clothing: string; tattoo: string };
};

export const DNA_FIELDS: { key: keyof DnaSummary; label: string; list?: boolean }[] = [
  { key: "colors_liked", label: "Cores preferidas", list: true },
  { key: "colors_rejected", label: "Cores rejeitadas", list: true },
  { key: "styles_liked", label: "Estilos favoritos", list: true },
  { key: "styles_rejected", label: "Estilos rejeitados", list: true },
  { key: "maintenance", label: "Tolerância à manutenção" },
  { key: "budget", label: "Conforto com o orçamento" },
  { key: "professional_goals", label: "Objetivos de imagem profissional" },
  { key: "social_goals", label: "Objetivos de imagem social" },
  { key: "emotional_comfort", label: "Conforto emocional" },
  { key: "body_notes", label: "Áreas a valorizar ou preservar" },
  { key: "permanent_change", label: "Tolerância a mudanças permanentes" },
  { key: "works_in_life", label: "Funciona na vida real", list: true },
  { key: "theory_only", label: "Bonito na teoria, mas não uso", list: true },
  { key: "change_readiness", label: "Prontidão para mudança" },
  { key: "practicality", label: "Perfil de praticidade" },
  { key: "guardrails", label: "Limites para as recomendações", list: true },
  { key: "constraints", label: "Restrições pessoais de estilo", list: true },
];

export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR");
export const fmtDateTime = (d: string | Date) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export async function logEvent(event: string, meta: Record<string, Json> = {}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_events").insert({ user_id: data.user.id, event, meta });
}

/** Counts a new signal toward the "review your DNA" reminder. */
export async function bumpSignals(n = 1) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { data: row } = await supabase.from("visual_dna").select("signals_since_review").eq("user_id", data.user.id).maybeSingle();
  await supabase.from("visual_dna").upsert({ user_id: data.user.id, signals_since_review: (row?.signals_since_review ?? 0) + n, updated_at: new Date().toISOString() });
}

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const textOf = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const stringsOf = (v: unknown) => (Array.isArray(v) ? v.map(textOf).filter(Boolean) : []);
const NOT_APPLICABLE = /^não se aplica[.!]?$/i;
const fallbackMarkdown = `# Sugestão Aura ID\n\nNão foi possível formatar este conteúdo automaticamente. Abra a sugestão no app para ver todos os detalhes.`;

/** Fallback para qualquer conteúdo legado/desconhecido: título, resumo, passos e notas. */
function genericMarkdown(p: PackageRow) {
  const c = asRecord(p.content);
  const variations = Array.isArray(c["variations"]) ? c["variations"].map((v) => asRecord(v)) : [];
  const title = textOf(c["title"]) || "Sugestão Aura ID";
  const invitation = textOf(c["invitation"]) || textOf(c["summary"]);
  const why = textOf(c["why_it_works"]);
  const cost = textOf(c["cost"]), maintenance = textOf(c["maintenance"]), reversibility = textOf(c["reversibility"]);
  const adaptation = textOf(c["adaptation_time"]), costNote = textOf(c["cost_note"]);
  const steps = stringsOf(c["steps"]), checklist = stringsOf(c["event_checklist"]), risks = stringsOf(c["risks"]);
  const professional = textOf(c["professional_validation_note"]);
  return [
    `# ${title}`, `_Sugestão gerada por IA — um convite, não uma regra._`, ``,
    ...(invitation ? [invitation, ``] : []),
    ...(why ? [`**Por que pode funcionar:** ${why}`, ``] : []),
    ...variations.flatMap((v) => {
      const level = textOf(v["level"]), summary = textOf(v["summary"]);
      const fields = ([["Roupas", textOf(v["clothing"])], ["Maquiagem", textOf(v["makeup"])], ["Cabelo", textOf(v["hair"])], ["Barba", textOf(v["beard"])], ["Acessórios", textOf(v["accessories"])], ["Visibilidade de tatuagem", textOf(v["tattoo_visibility"])]] as const).filter(([, text]) => text && !NOT_APPLICABLE.test(text));
      return [`## ${LEVEL_LABEL[level] ?? level}${summary ? ` — ${summary}` : ""}`, ...fields.map(([label, text]) => `- ${label}: ${text}`), ``];
    }),
    ...(cost || maintenance || reversibility || adaptation ? [`**Custo:** ${LEVEL3[cost] || cost || "—"}${costNote ? ` (${costNote})` : ""} · **Manutenção:** ${LEVEL3[maintenance] || maintenance || "—"} · **Reversibilidade:** ${REVERSIBILITY[reversibility] || reversibility || "—"}${adaptation ? ` · **Adaptação:** ${adaptation}` : ""}`, ``] : []),
    ...(steps.length ? [`## Passo a passo`, ...steps.map((s, i) => `${i + 1}. ${s}`), ``] : []),
    ...(checklist.length ? [`## Checklist do evento`, ...checklist.map((s) => `- [ ] ${s}`), ``] : []),
    ...(risks.length ? [`## Pontos de atenção`, ...risks.map((s) => `- ${s}`), ``] : []),
    ...(professional ? [`**Validar com profissional:** ${professional}`, ``] : []),
    ...(p.note ? [`## Minhas notas`, p.note, ``] : []),
  ].join("\n");
}

/** Outfit (Roupas) não tem conversor próprio em clothing.ts — template com os campos reais. */
function outfitToMarkdown(o: Outfit, note?: string | null) {
  const versions = Array.isArray(o.versions) ? o.versions : [];
  const weather = Array.isArray(o.weather_variants) ? o.weather_variants : [];
  const colors = stringsOf(o.colors), textures = stringsOf(o.textures), accessories = stringsOf(o.accessories);
  return [
    `# ${textOf(o.title) || "Look"}`, `_Sugestão gerada por IA — um convite, não uma regra._`, ``,
    ...(textOf(o.invitation) ? [textOf(o.invitation), ``] : []),
    ...(textOf(o.why_it_works) ? [`**Por que pode funcionar:** ${textOf(o.why_it_works)}`, ``] : []),
    ...(textOf(o.occasion) || typeof o.formality === "number" ? [`**Ocasião:** ${textOf(o.occasion) || "—"} · **Formalidade:** ${typeof o.formality === "number" ? `${o.formality}/5` : "—"}`] : []),
    ...(colors.length || textures.length ? [`**Cores:** ${colors.join(", ") || "—"} · **Texturas:** ${textures.join(", ") || "—"}`] : []),
    ...(textOf(o.proportions) ? [`**Proporções:** ${textOf(o.proportions)}`] : []),
    ...(textOf(o.shoes) || textOf(o.bag) ? [`**Calçado:** ${textOf(o.shoes) || "—"} · **Bolsa:** ${textOf(o.bag) || "—"}`] : []),
    ...(accessories.length ? [`**Acessórios:** ${accessories.join(", ")}`] : []),
    ``,
    ...versions.flatMap((v) => [
      `## ${LEVEL_LABEL[v.level] ?? v.level}${textOf(v.summary) ? ` — ${textOf(v.summary)}` : ""}`,
      ...(Array.isArray(v.pieces) ? v.pieces : []).map((piece) => `- ${textOf(piece.piece)}${textOf(piece.role) ? ` (${textOf(piece.role)})` : ""}${piece.from_wardrobe ? " · do seu guarda-roupa" : ""}`), ``,
    ]),
    ...(weather.length ? [`## Variações de clima`, ...weather.map((w) => `- ${textOf(w.weather)}: ${textOf(w.change)}`), ``] : []),
    ...(textOf(o.comfort_note) ? [`**Conforto:** ${textOf(o.comfort_note)}`, ``] : []),
    ...(note ? [`## Minhas notas`, note, ``] : []),
  ].join("\n");
}

/** Guia de salão do cabelo + rotina/avisos que o conversor do módulo não inclui. */
function hairPlanToMarkdownWithNotes(p: HairPlan, note?: string | null) {
  const routine = Array.isArray(p.routine) ? p.routine : [];
  const warnings = stringsOf(p.warnings);
  return [
    hairPlanToMarkdown(p),
    ...(routine.length ? ["", "## Rotina em casa", ...routine.flatMap((r) => [`### ${textOf(r.frequency)}`, ...stringsOf(r.steps).map((s) => `- ${s}`)])] : []),
    ...(warnings.length ? ["", "## Pontos de atenção", ...warnings.map((w) => `- ${w}`)] : []),
    ...(note ? ["", "## Minhas notas", note] : []),
  ].join("\n");
}

/** Markdown por tipo de conteúdo; nunca lança: conversor do tipo → fallback genérico → aviso curto. */
export function packageToMarkdown(p: PackageRow) {
  const tryConvert = (fn: () => string) => {
    try { const md = fn(); if (md && md.trim()) return md; } catch { /* conversor do tipo falhou — usa o fallback */ }
    return null;
  };
  const byKind: Record<string, () => string> = {
    makeup_look: () => lookToMarkdown(p.content as unknown as MakeupLook, p.note),
    hair_plan: () => hairPlanToMarkdownWithNotes(p.content as unknown as HairPlan, p.note),
    outfit: () => outfitToMarkdown(p.content as unknown as Outfit, p.note),
  };
  const converter = p.kind ? byKind[p.kind] : undefined;
  return (converter && tryConvert(converter)) || tryConvert(() => genericMarkdown(p)) || fallbackMarkdown;
}

export function downloadText(filename: string, text: string, type = "text/markdown") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
