import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJson } from "./ai.server";
import { PRESENTATION_RULES, presentationContext } from "./presentation";

const s = { type: "string" };
const sa = { type: "array", items: s };
const int = { type: "integer" };
const obj = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });

const piece = obj({ piece: s, from_wardrobe: { type: "boolean" }, role: s });
const outfit = obj({
  title: s, invitation: s, why_it_works: s, occasion: s, formality: int, colors: sa, textures: sa, proportions: s, shoes: s, bag: s, accessories: sa,
  versions: { type: "array", items: obj({ level: { type: "string", enum: ["safe", "intermediate", "bold"] }, summary: s, pieces: { type: "array", items: piece } }) },
  weather_variants: { type: "array", items: obj({ weather: s, change: s }) }, comfort_note: s,
});
const outfitsSchema = obj({ outfits: { type: "array", items: outfit } });
const gapsSchema = obj({
  summary: s,
  gaps: { type: "array", items: obj({ piece: s, why: s, combinations_unlocked: int, priority: { type: "string", enum: ["high", "medium", "low"] }, price_brl: s }) },
  capsule: obj({ name: s, pieces: sa, outfits_possible: int, note: s }),
});
const checkSchema = obj({ verdict: { type: "string", enum: ["buy", "wait", "skip"] }, summary: s, combinations_with_wardrobe: int, similar_owned: sa, questions: sa, cost_per_use: s, alternatives: sa });
const missionsSchema = obj({ missions: { type: "array", items: obj({ title: s, description: s, pieces: sa, reflection: s }) } });

const BASE = `Você é a consultora de estilo da Aura ID. Português do Brasil, linguagem inclusiva e sem julgamento.
${PRESENTATION_RULES}
- Nunca envergonhe corpo, idade, gênero, cultura, profissão ou orçamento. Silhuetas são opções de comunicação e conforto, nunca "correção".
- Priorize SEMPRE peças do guarda-roupa existente; marque from_wardrobe=true só para peças que estão na lista.
- Compras são último recurso e devem ser conscientes. Preços em faixas de R$, sem marcas.
- Respeite cores rejeitadas, peças evitadas, clima, dress code, orçamento e conforto. Não infira categorias sensíveis.`;

async function loadCtx(supabase: any, userId: string) {
  const { data: vp } = await supabase.from("visual_profiles").select("data").eq("user_id", userId).maybeSingle();
  const [{ data: sp }, { data: prefs }, { data: items }, { data: consent }, { data: dna }, { data: rules }, { data: safety }] = await Promise.all([
    supabase.from("style_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("preferences").select("colors_liked, colors_rejected, styles_liked, styles_rejected, body_highlight, body_preserve").eq("user_id", userId).maybeSingle(),
    supabase.from("wardrobe_items").select("category, name, color, fabric, formality, season, times_used").eq("user_id", userId).limit(300),
    supabase.from("consents").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("visual_dna").select("summary").eq("user_id", userId).maybeSingle(),
    supabase.from("dress_code_rules").select("occasion, rule").eq("active", true),
    supabase.from("safety_config").select("blocked_terms").eq("id", 1).maybeSingle(),
  ]);
  const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
  const dnaAllowed = !!consent?.personalization && !consent?.dna_paused && perms["clothing"] !== false;
  return { consent, dnaAllowed, ctx: {
    perfil_visual: vp?.data ?? {}, estrutura: presentationContext(vp?.data),
    perfil_de_estilo: sp ?? "não preenchido", preferencias: prefs ?? {}, guarda_roupa: items ?? [],
    dna_visual: dnaAllowed ? dna?.summary ?? null : "não autorizado", regras_de_dress_code: rules ?? [], palavras_proibidas: safety?.blocked_terms ?? [],
  } };
}

export const generateOutfits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ occasion: z.string().max(60), weather: z.string().max(30), extra: z.string().max(600).default(""), emotion: z.string().max(40).default("curious"), presentation: z.enum(["masculine", "feminine"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { consent, ctx, dnaAllowed } = await loadCtx(supabase, userId);
    if (!consent) return { error: "Conclua o consentimento primeiro." };
    const { data: rejected } = await supabase.from("packages").select("content").eq("user_id", userId).eq("kind", "outfit").eq("status", "failed").limit(10);
    const sys = `${BASE}
- Gere 3 looks completos e diferentes para a ocasião. Cada um com exatamente 3 versões na ordem safe, intermediate, bold.
- Inclua roupas, calçado, acessórios escolhidos, cores, texturas, proporções, formalidade (1 a 5) e variantes de clima (calor, frio, chuva). bag="Não se aplica" quando bolsa não foi explicitamente desejada.
- why_it_works: explique de forma concreta por que funciona para a pessoa e o contexto.`;
    const input = JSON.stringify({ ...ctx, estrutura: { ...ctx.estrutura, apresentacao: data.presentation || ctx.estrutura.apresentacao }, ocasiao: data.occasion, clima: data.weather, humor: data.emotion, observacoes: data.extra, looks_que_nao_funcionaram: (rejected ?? []).map((r: any) => r.content?.title) });
    const r = await callJson<{ outfits: unknown[] }>(sys, input, outfitsSchema, "outfits");
    if (!r.ok) return { error: r.error };
    if (!r.data.outfits?.length) return { error: "Nenhum look foi retornado. Tente novamente." };
    const batchId = crypto.randomUUID();
    const { error } = await supabase.from("packages").insert(r.data.outfits.slice(0, 5).map((content) => ({
      user_id: userId, batch_id: batchId, kind: "outfit", module: "clothing", entry_mode: "clothing", emotional_mode: data.emotion,
      context: { occasion: data.occasion, weather: data.weather, presentation: data.presentation || ctx.estrutura.apresentacao }, content: content as never,
    })));
    if (error) { console.error(error); return { error: "Não foi possível salvar os looks." }; }
    await supabase.from("audit_events").insert({ user_id: userId, event: "outfit_generated", meta: { module: "clothing", occasion: data.occasion, dna_used: dnaAllowed } });
    return { error: null };
  });

export const analyzeWardrobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ctx } = await loadCtx(supabase, userId);
    const sys = `${BASE}
- Analise o guarda-roupa: liste de 3 a 6 peças-chave que faltam, explicando quantas combinações novas cada uma desbloqueia com o que já existe.
- Monte um guarda-roupa cápsula usando o máximo possível de peças existentes (nomeie-as como estão na lista).`;
    const r = await callJson<Record<string, unknown>>(sys, JSON.stringify(ctx), gapsSchema, "wardrobe_gaps");
    if (!r.ok) return { error: r.error };
    await supabase.from("style_analyses").insert({ user_id: userId, kind: "gaps", content: r.data as never });
    return { error: null };
  });

export const checkPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ item: z.string().min(2).max(200), price: z.string().max(40).default(""), reason: z.string().max(400).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { ctx } = await loadCtx(supabase, userId);
    const sys = `${BASE}
- Faça uma análise de compra consciente, sem culpa. Verifique peças parecidas que a pessoa já tem, quantas combinações a peça faz com o guarda-roupa, custo por uso estimado e perguntas de reflexão (ex.: "eu compraria se não estivesse em promoção?").
- alternatives: formas de testar a ideia com o que já existe.`;
    const r = await callJson<Record<string, unknown>>(sys, JSON.stringify({ ...ctx, peca_desejada: data.item, preco: data.price, motivo: data.reason }), checkSchema, "purchase_check");
    if (!r.ok) return { error: r.error };
    await supabase.from("style_analyses").insert({ user_id: userId, kind: "purchase", input: data, content: r.data as never });
    await supabase.from("audit_events").insert({ user_id: userId, event: "purchase_checklist_completed", meta: { module: "clothing", verdict: String((r.data as { verdict?: string }).verdict) } });
    return { error: null };
  });

export const generateMissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ctx } = await loadCtx(supabase, userId);
    const sys = `${BASE}
- Crie 4 "missões de estilo" curtas e divertidas para a semana usando só peças existentes (ex.: usar uma peça esquecida de um jeito novo). Priorize peças com poucos usos.`;
    const r = await callJson<Record<string, unknown>>(sys, JSON.stringify(ctx), missionsSchema, "style_missions");
    if (!r.ok) return { error: r.error };
    await supabase.from("style_analyses").insert({ user_id: userId, kind: "missions", content: r.data as never });
    return { error: null };
  });

export const setOutfitStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "testing", "failed", "later", "implemented"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pkg, error } = await supabase.from("packages").update({ status: data.status }).eq("id", data.id).select("content").single();
    if (error || !pkg) return { error: "Não foi possível atualizar." };
    const event = data.status === "implemented" ? "outfit_marked_used" : "outfit_saved";
    await supabase.from("audit_events").insert({ user_id: userId, event, meta: { module: "clothing", status: data.status } });
    const { data: consent } = await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", userId).maybeSingle();
    const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
    if (consent?.personalization && !consent.dna_paused && perms["clothing"] !== false) {
      const { data: dna } = await supabase.from("visual_dna").select("signals, signals_since_review").eq("user_id", userId).maybeSingle();
      const c = pkg.content as { title?: string; colors?: string[] };
      const signal = { module: "clothing", reaction: data.status, title: c.title ?? "", colors: c.colors ?? [], at: new Date().toISOString() };
      const signals = [signal, ...((dna?.signals as unknown[]) ?? [])].slice(0, 200);
      await supabase.from("visual_dna").upsert({ user_id: userId, signals: signals as never, signals_since_review: (dna?.signals_since_review ?? 0) + 1, updated_at: new Date().toISOString() });
    }
    return { error: null };
  });
