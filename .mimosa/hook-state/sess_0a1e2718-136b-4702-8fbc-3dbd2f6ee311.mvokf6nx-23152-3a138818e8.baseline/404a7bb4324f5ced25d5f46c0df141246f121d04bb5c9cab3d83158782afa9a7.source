import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJson } from "./ai.server";
import { PRESENTATION_RULES, presentationContext } from "./presentation";

const s = { type: "string" };
const sa = { type: "array", items: s };
const b = { type: "boolean" };
const lvl = { type: "string", enum: ["low", "medium", "high"] };
const obj = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });

const proposal = obj({
  level: { type: "string", enum: ["safe", "intermediate", "bold"] }, title: s, cut: s, color: s, visual_message: s, maintenance: lvl,
  cost_brl: s, adaptation_time: s, reversibility: { type: "string", enum: ["easy", "moderate", "permanent"] },
  chemical: b, high_maintenance: b, professional_validation: b, warnings: sa,
});
const planSchema = obj({
  title: s, invitation: s, reassurance: s, proposals: { type: "array", items: proposal },
  timeline: { type: "array", items: obj({ period: s, steps: sa }) },
  salon_guide: obj({ technical: s, phrases: sa, questions: sa, avoid: sa }),
  routine: { type: "array", items: obj({ frequency: s, steps: sa }) },
  warnings: sa,
});

const SYS = `Você é a assistente capilar da Aura ID. Escreva em português do Brasil, com acolhimento para quem tem medo de mudar.
${PRESENTATION_RULES}
- Nunca ranqueie beleza nem fale de "cabelo ruim", "defeito" ou "corrigir". Todas as texturas são bonitas; fale em escolhas e experimentos.
- Gere exatamente 3 propostas na ordem safe, intermediate, bold. Sempre inclua um caminho gradual antes do radical.
- Marque chemical=true para coloração, descoloração, alisamento, progressiva, permanente. professional_validation=true para qualquer química, descoloração, couro cabeludo sensível ou dano.
- high_maintenance=true quando exigir retorno frequente ao salão. Custos em faixas de R$ baseadas no catálogo.
- Aplique as regras de segurança fornecidas como avisos (warnings). Não garanta resultados.
- timeline: exatamente 3 períodos: "Primeiros 30 dias", "3 meses", "6 meses" (conceitual, sem prometer crescimento exato).
- salon_guide: explicação técnica para o profissional + frases prontas em primeira pessoa para a pessoa usar.
- routine: cronograma simplificado (ex.: "Semanal", "A cada lavagem"), respeitando habilidade e tolerância de manutenção.
- No modo barbearia, inclua corte, barba e cuidados de forma natural.
- Não infira categorias sensíveis. Use categorias de técnica/produto, não marcas.`;

export const generateHairPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ goal: z.string().max(30), desire: z.string().max(800).default(""), emotion: z.string().max(40).default("curious"), presentation: z.enum(["masculine", "feminine"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: vp } = await supabase.from("visual_profiles").select("data").eq("user_id", userId).maybeSingle();
    const [{ data: hp }, { data: consent }, { data: dna }, { data: cat }, { data: rules }, { data: safety }, { data: rejected }, { count }] = await Promise.all([
      supabase.from("hair_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("consents").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("visual_dna").select("summary").eq("user_id", userId).maybeSingle(),
      supabase.from("hair_catalog").select("category, name, description, price_min, price_max, maintenance, chemical").eq("active", true),
      supabase.from("hair_rules").select("condition, warning").eq("active", true),
      supabase.from("safety_config").select("blocked_terms").eq("id", 1).maybeSingle(),
      supabase.from("packages").select("content").eq("user_id", userId).eq("kind", "hair_plan").eq("status", "rejected").limit(10),
      supabase.from("photos").select("id", { count: "exact", head: true }).eq("user_id", userId).like("kind", "hair_%"),
    ]);
    if (!consent) return { error: "Conclua o consentimento primeiro.", id: null };
    const perms = (consent.module_permissions ?? {}) as Record<string, boolean>;
    const dnaAllowed = !!consent.personalization && !consent.dna_paused && perms["hair"] !== false;
    const input = JSON.stringify({
      perfil_visual: vp?.data ?? {}, estrutura: presentationContext(vp?.data, data.presentation),
      objetivo: data.goal, desejo: data.desire, humor: data.emotion, perfil_capilar: hp ?? "não preenchido",
      dna_visual: dnaAllowed ? dna?.summary ?? null : "não autorizado", catalogo: cat ?? [], regras_de_seguranca: rules ?? [],
      palavras_proibidas: safety?.blocked_terms ?? [], ideias_rejeitadas: (rejected ?? []).map((r: any) => r.content?.title),
      fotos_enviadas: consent.photo_processing ? count ?? 0 : 0,
    });
    const r = await callJson<{ title: string; proposals: { professional_validation: boolean }[] }>(SYS, input, planSchema, "hair_plan");
    if (!r.ok) return { error: r.error, id: null };
    const { data: row, error } = await supabase.from("packages").insert({
      user_id: userId, batch_id: crypto.randomUUID(), kind: "hair_plan", module: "hair", entry_mode: "hair", emotional_mode: data.emotion,
      context: { goal: data.goal, desire: data.desire, presentation: presentationContext(vp?.data, data.presentation).apresentacao }, content: r.data as never,
    }).select("id").single();
    if (error || !row) { console.error(error); return { error: "Não foi possível salvar o plano.", id: null }; }
    const events = [{ user_id: userId, event: "hair_plan_generated", meta: { module: "hair", goal: data.goal, dna_used: dnaAllowed } }];
    if (r.data.proposals?.some((p) => p.professional_validation)) events.push({ user_id: userId, event: "professional_validation_prompted", meta: { module: "hair", goal: data.goal, dna_used: dnaAllowed } });
    await supabase.from("audit_events").insert(events);
    return { error: null, id: row.id };
  });
