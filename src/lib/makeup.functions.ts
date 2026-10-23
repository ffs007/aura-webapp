import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJson } from "./ai.server";
import { PRESENTATION_RULES, presentationContext } from "./presentation";

const s = { type: "string" };
const sa = { type: "array", items: s };
const obj = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });

const variation = obj({ level: { type: "string", enum: ["safe", "intermediate", "bold"] }, summary: s, products: sa, steps: sa, time_minutes: { type: "integer" }, skill: { type: "integer" }, cost_brl: s });
const look = obj({
  title: s, invitation: s, why_it_works: s, variations: { type: "array", items: variation },
  cost: { type: "string", enum: ["low", "medium", "high"] }, cost_note: s, maintenance: { type: "string", enum: ["low", "medium", "high"] },
  reversibility: { type: "string", enum: ["easy", "moderate", "permanent"] }, adaptation_time: s, adaptation: s,
  adjustments: sa, risks: sa, professional_validation: { type: "boolean" }, professional_validation_note: s, steps: sa, event_checklist: sa,
});
const looksSchema = obj({ looks: { type: "array", items: look } });
const sigSchema = obj({ name: s, essence: s, signature_steps: sa, colors: sa, finish: s, always: sa, never: sa, notes: s });
const kitSchema = obj({ name: s, purpose: s, items: { type: "array", items: obj({ item: s, why: s, price_brl: s }) }, order: sa, total_brl: s });

const BASE = `Você é a assistente de maquiagem da Aura ID.
${PRESENTATION_RULES}
- Entrar neste gerador é uma solicitação explícita de maquiagem, mesmo quando ela não é desejada nas combinações gerais.
- Linguagem inclusiva para todos os tons de pele, idades, gêneros, rotinas e níveis de habilidade.
- Maquiagem NUNCA é correção de defeitos. Fale em realçar, equilibrar, escolher, brincar. Proibido: "esconder", "disfarçar", "corrigir imperfeições", "defeitos", "afinar", "rejuvenescer".
- Nunca ranqueie beleza nem comente negativamente rostos ou pele.
- Respeite SEMPRE alergias e ingredientes a evitar; se houver dúvida, diga para testar numa pequena área e verificar o rótulo.
- Para pele sensível, alergias ou condições de pele: professional_validation = true com orientação de procurar dermatologista.
- Não infira categorias sensíveis. Escreva em português do Brasil. Preços em R$ usando o catálogo fornecido (faixas).
- Use categorias de produto (não marcas).`;

async function loadCtx(supabase: any, userId: string) {
  const [{ data: profile }, { data: mp }, { data: consent }, { data: dna }, { data: corr }, { data: cat }, { data: safety }] = await Promise.all([
    supabase.from("visual_profiles").select("data").eq("user_id", userId).maybeSingle(),
    supabase.from("makeup_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("consents").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("visual_dna").select("summary, signals").eq("user_id", userId).maybeSingle(),
    supabase.from("dna_corrections").select("field, correction").eq("user_id", userId).limit(30),
    supabase.from("product_catalog").select("category, name, price_min, price_max, finish, tags, sensitive_safe").eq("active", true),
    supabase.from("safety_config").select("blocked_terms").eq("id", 1).maybeSingle(),
  ]);
  const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
  const dnaAllowed = !!consent?.personalization && !consent?.dna_paused && perms["makeup"] !== false;
  return {
    consent, dnaAllowed,
    ctx: {
      perfil_geral: profile?.data ?? {}, perfil_maquiagem: mp ?? "não preenchido",
      estrutura: presentationContext(profile?.data),
      dna_visual: dnaAllowed ? { resumo: dna?.summary ?? null, sinais: (dna?.signals ?? []).slice?.(0, 20) } : "não autorizado",
      correcoes_do_usuario: corr ?? [], catalogo: cat ?? [], palavras_proibidas: safety?.blocked_terms ?? [],
    },
  };
}

export const generateMakeupLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    mode: z.string().max(30), occasion: z.string().max(300).default(""), intensity: z.number().min(1).max(5),
    light: z.string().max(30).default("natural"), extra: z.string().max(800).default(""), emotion: z.string().max(40).default("curious"),
    presentation: z.enum(["masculine", "feminine"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { consent, ctx, dnaAllowed } = await loadCtx(supabase, userId);
    if (!consent) return { error: "Conclua o consentimento primeiro.", batchId: null };
    const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("user_id", userId);
    const sys = `${BASE}
- Gere 3 looks completos e diferentes entre si. Cada um com exatamente 3 variações: safe, intermediate, bold (nessa ordem).
- products: checklist de categorias com faixa de preço (ex.: "Blush em creme — R$ 25–160"). steps: ordem de aplicação. skill de 1 a 5.
- adjustments: o que fazer se algo não sair como esperado (ex.: "se o blush ficou forte, esfume com a esponja limpa").
- adaptation: como adaptar para menos tempo/orçamento. event_checklist só para modo night ou pro_photo.
- Respeite o tempo disponível e o nível de habilidade do perfil.`;
    const input = JSON.stringify({ ...ctx, estrutura: { ...ctx.estrutura, apresentacao: data.presentation || ctx.estrutura.apresentacao }, modo: data.mode, ocasiao: data.occasion, intensidade_1a5: data.intensity, luz: data.light, humor: data.emotion, observacoes: data.extra, fotos_de_rosto: consent.photo_processing ? count ?? 0 : 0 });
    const r = await callJson<{ looks: unknown[] }>(sys, input, looksSchema, "makeup_looks");
    if (!r.ok) return { error: r.error, batchId: null };
    if (!r.data.looks?.length) return { error: "Nenhum look foi retornado. Tente novamente.", batchId: null };
    const batchId = crypto.randomUUID();
    const rows = r.data.looks.slice(0, 5).map((content) => ({
      user_id: userId, batch_id: batchId, kind: "makeup_look", module: "makeup", entry_mode: "makeup", emotional_mode: data.emotion,
      context: { mode: data.mode, occasion: data.occasion, light: data.light, intensity: data.intensity, presentation: data.presentation || ctx.estrutura.apresentacao }, content: content as never,
    }));
    const { error } = await supabase.from("packages").insert(rows);
    if (error) { console.error(error); return { error: "Não foi possível salvar os looks.", batchId: null }; }
    await supabase.from("audit_events").insert({ user_id: userId, event: "look_generated", meta: { module: "makeup", mode: data.mode, count: rows.length, dna_used: dnaAllowed } });
    return { error: null, batchId };
  });

export const generateSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ctx } = await loadCtx(supabase, userId);
    const [{ data: looks }, { data: fb }] = await Promise.all([
      supabase.from("packages").select("status, beautiful_not_practical, note, content").eq("user_id", userId).eq("kind", "makeup_look").neq("status", "new").limit(30),
      supabase.from("feedback").select("rating, comfort, reflection").eq("user_id", userId).eq("module", "makeup").limit(30),
    ]);
    const sys = `${BASE}
Crie a "assinatura pessoal de maquiagem": um retrato curto e fluido do jeito da pessoa se maquiar NESTE MOMENTO, não uma regra.
Baseie-se em looks aprovados/salvos, rejeitados, feedback e perfil. name: nome poético curto. never: inclua o que foi rejeitado.`;
    const input = JSON.stringify({ ...ctx, looks: (looks ?? []).map((l: any) => ({ status: l.status, nao_pratico: l.beautiful_not_practical, nota: l.note, titulo: l.content?.title })), feedback: fb ?? [] });
    const r = await callJson<Record<string, unknown>>(sys, input, sigSchema, "makeup_signature");
    if (!r.ok) return { error: r.error };
    await supabase.from("makeup_signatures").insert({ user_id: userId, summary: r.data as never });
    await supabase.from("audit_events").insert({ user_id: userId, event: "signature_generated", meta: { module: "makeup" } });
    return { error: null };
  });

export const generateKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ purpose: z.string().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { ctx } = await loadCtx(supabase, userId);
    const sys = `${BASE}
Monte um "kit de confiança": poucos itens (3 a 7) que cabem numa necessaire e dão segurança para o propósito pedido. Respeite orçamento e alergias. Itens multiuso são bem-vindos.`;
    const r = await callJson<{ name: string }>(sys, JSON.stringify({ ...ctx, proposito: data.purpose }), kitSchema, "confidence_kit");
    if (!r.ok) return { error: r.error };
    await supabase.from("confidence_kits").insert({ user_id: userId, name: r.data.name || data.purpose, content: r.data as never });
    await supabase.from("audit_events").insert({ user_id: userId, event: "kit_generated", meta: { module: "makeup" } });
    return { error: null };
  });
