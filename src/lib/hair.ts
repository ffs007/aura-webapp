export const HAIR_GOALS = [
  { id: "cut", label: "Mudar o corte", hint: "Novo formato ou comprimento" },
  { id: "color", label: "Mudar a cor", hint: "Tom, mechas ou tonalização" },
  { id: "subtle", label: "Mudança sutil", hint: "Algo leve, quase imperceptível" },
  { id: "bold", label: "Transformação ousada", hint: "Quero mudar de verdade" },
  { id: "gradual", label: "Transformação gradual", hint: "Passo a passo, sem susto" },
  { id: "recovery", label: "Recuperar o cabelo", hint: "Danos, quebra, ressecamento" },
  { id: "natural", label: "Transição para o natural", hint: "Deixar a química crescer" },
  { id: "routine", label: "Rotina de finalização", hint: "Arrumar em casa com facilidade" },
  { id: "salon", label: "Guia de salão", hint: "Saber o que pedir ao profissional" },
  { id: "grooming", label: "Modo barbearia", hint: "Corte, barba e cuidados masculinos" },
] as const;

export const TEXTURES = ["Liso", "Ondulado", "Cacheado", "Crespo", "Não sei"];
export const LENGTHS = ["Raspado", "Curto", "Médio", "Longo", "Muito longo"];
export const LEVELS = ["Nenhum", "Leve", "Moderado", "Intenso"];
export const ALERT_KINDS = [
  { id: "hydration", label: "Hidratação", days: 7 },
  { id: "trim", label: "Aparar as pontas", days: 60 },
  { id: "treatment", label: "Tratamento (nutrição/reconstrução)", days: 21 },
  { id: "color", label: "Manutenção de cor/raiz", days: 45 },
] as const;

export type HairProposal = {
  level: "safe" | "intermediate" | "bold";
  title: string; cut: string; color: string; visual_message: string; maintenance: "low" | "medium" | "high";
  cost_brl: string; adaptation_time: string; reversibility: "easy" | "moderate" | "permanent";
  chemical: boolean; high_maintenance: boolean; professional_validation: boolean; warnings: string[];
};
export type HairPlan = {
  title: string; invitation: string; reassurance: string; proposals: HairProposal[];
  timeline: { period: string; steps: string[] }[];
  salon_guide: { technical: string; phrases: string[]; questions: string[]; avoid: string[] };
  routine: { frequency: string; steps: string[] }[];
  warnings: string[];
};

export const LEVEL_LABEL = { safe: "Segura", intermediate: "Intermediária", bold: "Ousada" } as const;
export const MAINT_LABEL = { low: "Baixa", medium: "Média", high: "Alta" } as const;
export const REV_LABEL = { easy: "Fácil de reverter", moderate: "Reversão moderada", permanent: "Difícil de reverter" } as const;

export const HAIR_DISCLAIMER = "Procedimentos químicos, descoloração, sensibilidade do couro cabeludo e danos no cabelo exigem validação profissional. Nenhum resultado é garantido.";

export function planToMarkdown(p: HairPlan) {
  return [
    `# ${p.title} — Guia de salão (Aura ID)`, `_Gerado por IA. ${HAIR_DISCLAIMER}_`, "",
    "## Explicação técnica", p.salon_guide.technical, "",
    "## O que dizer ao profissional", ...p.salon_guide.phrases.map((x) => `- "${x}"`), "",
    "## Perguntas para fazer", ...p.salon_guide.questions.map((x) => `- ${x}`), "",
    "## Evitar", ...p.salon_guide.avoid.map((x) => `- ${x}`), "",
    "## Propostas", ...p.proposals.flatMap((x) => [`### ${LEVEL_LABEL[x.level]}: ${x.title}`, `Corte: ${x.cut}`, `Cor: ${x.color}`, `Custo: ${x.cost_brl} · Manutenção: ${MAINT_LABEL[x.maintenance]} · ${REV_LABEL[x.reversibility]}`, ""]),
    "## Linha do tempo", ...p.timeline.flatMap((t) => [`### ${t.period}`, ...t.steps.map((s) => `- ${s}`)]),
  ].join("\n");
}
