import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
  { id: "curious", label: "Curiosa(o)", hint: "Me mostre possibilidades" },
  { id: "brave", label: "Corajosa(o)", hint: "Estou aberta(o) a algo mais ousado" },
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

export function packageToMarkdown(p: PackageRow) {
  const c = p.content;
  return [
    `# ${c.title}`, `_Sugestão gerada por IA — um convite, não uma regra._`, ``, c.invitation, ``,
    `**Por que pode funcionar:** ${c.why_it_works}`, ``,
    ...c.variations.flatMap((v) => [
      `## ${LEVEL_LABEL[v.level] ?? v.level} — ${v.summary}`,
      ...([["Roupas", v.clothing], ["Maquiagem", v.makeup], ["Cabelo", v.hair], ["Barba", v.beard], ["Acessórios", v.accessories], ["Visibilidade de tatuagem", v.tattoo_visibility]] as const).filter(([, text]) => text && !/^não se aplica[.!]?$/i.test(text.trim())).map(([label, text]) => `- ${label}: ${text}`), ``,
    ]),
    `**Custo:** ${LEVEL3[c.cost]} (${c.cost_note}) · **Manutenção:** ${LEVEL3[c.maintenance]} · **Reversibilidade:** ${REVERSIBILITY[c.reversibility]} · **Adaptação:** ${c.adaptation_time}`, ``,
    `## Passo a passo`, ...c.steps.map((s, i) => `${i + 1}. ${s}`),
    ...(c.event_checklist.length ? [``, `## Checklist do evento`, ...c.event_checklist.map((s) => `- [ ] ${s}`)] : []),
    ...(c.risks.length ? [``, `## Pontos de atenção`, ...c.risks.map((s) => `- ${s}`)] : []),
    ...(p.note ? [``, `## Minhas notas`, p.note] : []),
  ].join("\n");
}

export function downloadText(filename: string, text: string, type = "text/markdown") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
