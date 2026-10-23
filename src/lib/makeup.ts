export const MAKEUP_MODES = [
  { id: "5min", label: "Modo 5 minutos", hint: "O essencial, sem complicação" },
  { id: "30min", label: "Modo 30 minutos", hint: "Com calma e mais etapas" },
  { id: "interview", label: "Entrevista online", hint: "Presença leve na câmera" },
  { id: "pro_photo", label: "Foto profissional", hint: "Pensado para flash e luz de estúdio" },
  { id: "travel", label: "Viagem", hint: "Poucos itens multiuso" },
  { id: "hot", label: "Calor", hint: "Durabilidade e leveza" },
  { id: "night", label: "Evento à noite", hint: "Mais brilho e intensidade" },
  { id: "beginner", label: "Iniciante", hint: "Passos simples e seguros" },
  { id: "sensitive", label: "Pele sensível", hint: "Fórmulas gentis e poucas camadas" },
  { id: "phone", label: "Câmera do celular", hint: "Para selfies e vídeos" },
] as const;

export const LIGHTS = [
  ["natural", "Luz natural"], ["office", "Escritório"], ["night", "Noite / luz baixa"], ["screen", "Tela / vídeo"], ["flash", "Flash"],
] as const;

export const SKILL_LABEL = ["", "Nunca fiz", "Iniciante", "Intermediária", "Confiante", "Avançada"];

export type MakeupVariation = {
  level: "safe" | "intermediate" | "bold"; summary: string; products: string[]; steps: string[];
  time_minutes: number; skill: number; cost_brl: string;
};
export type MakeupLook = {
  title: string; invitation: string; why_it_works: string; variations: MakeupVariation[];
  cost: "low" | "medium" | "high"; cost_note: string; maintenance: "low" | "medium" | "high";
  reversibility: "easy" | "moderate" | "permanent"; adaptation_time: string; adaptation: string;
  adjustments: string[]; risks: string[]; professional_validation: boolean; professional_validation_note: string;
  steps: string[]; event_checklist: string[];
};
export type Signature = { name: string; essence: string; signature_steps: string[]; colors: string[]; finish: string; always: string[]; never: string[]; notes: string };
export type Kit = { name: string; purpose: string; items: { item: string; why: string; price_brl: string }[]; order: string[]; total_brl: string };

export const DISCLAIMER = "As recomendações de maquiagem e cuidados com a pele são informativas e não substituem orientação dermatológica.";
