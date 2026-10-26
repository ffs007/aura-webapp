import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJson } from "./ai.server";
import { PRESENTATION_RULES, presentationContext } from "./presentation";

const str = { type: "string" };
const strArr = { type: "array", items: str };
const variation = {
  type: "object", additionalProperties: false,
  required: ["level", "summary", "clothing", "makeup", "hair", "beard", "accessories", "tattoo_visibility"],
  properties: { level: { type: "string", enum: ["safe", "intermediate", "bold"] }, summary: str, clothing: str, makeup: str, hair: str, beard: str, accessories: str, tattoo_visibility: str },
};
const pkg = {
  type: "object", additionalProperties: false,
  required: ["title", "invitation", "why_it_works", "variations", "cost", "cost_note", "maintenance", "reversibility", "adaptation_time", "risks", "professional_validation", "professional_validation_note", "steps", "event_checklist"],
  properties: {
    title: str, invitation: str, why_it_works: str, variations: { type: "array", items: variation },
    cost: { type: "string", enum: ["low", "medium", "high"] }, cost_note: str,
    maintenance: { type: "string", enum: ["low", "medium", "high"] },
    reversibility: { type: "string", enum: ["easy", "moderate", "permanent"] },
    adaptation_time: str, risks: strArr, professional_validation: { type: "boolean" },
    professional_validation_note: str, steps: strArr, event_checklist: strArr,
  },
};
const packagesSchema = { type: "object", additionalProperties: false, required: ["packages"], properties: { packages: { type: "array", items: pkg } } };

const PRINCIPLES = `Princípios inegociáveis:
- Nunca ranqueie beleza nem comente negativamente corpos, rostos, peso, idade ou pele. Nada de "favorece/desfavorece", "corrigir", "defeitos".
- Enquadre tudo como convites, hipóteses e experimentos que a pessoa pode testar ou ignorar.
- Respeite cultura, clima, profissão, dress code, orçamento, tolerância à manutenção, conforto com mudanças e estado emocional.
- Não infira categorias sensíveis de identidade (religião, etnia, identidade de gênero, saúde) a menos que tenham sido informadas.
- Escreva em português do Brasil (ou no idioma em que a pessoa escreveu o perfil).`;

const SYSTEM = `Você é a Aura ID, uma companhia calorosa e culturalmente sensível de imagem pessoal.
${PRINCIPLES}
${PRESENTATION_RULES}
- Categorias não solicitadas: "Não se aplica". Não preencha maquiagem com protetor solar; cuidado de pele não é maquiagem.
- Nunca sugira nada das referências rejeitadas, das cores/estilos rejeitados ou das correções feitas pela pessoa.
- Para tatuagens, procedimentos químicos no cabelo ou qualquer mudança permanente/invasiva: professional_validation = true, reversibility "permanent" ou "moderate" e riscos claros.
- Gere entre 3 e 5 pacotes integrados e coerentes. Cada um com exatamente 3 variações: safe, intermediate, bold (nessa ordem).
- Se tatuagem não for relevante, tattoo_visibility = "Não se aplica" (ou descreva a visibilidade de tatuagens existentes, se mencionadas).
- event_checklist fica vazio a menos que o modo seja event.
- Mantenha cada campo conciso (1 a 3 frases). Valores em R$ quando fizer sentido.`;

const MODULE_OF: Record<string, string> = { makeup: "makeup", hair: "hair", clothing: "clothing", tattoo: "tattoo", professional: "professional" };

export const generatePackages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    entryMode: z.string().max(40), emotionalMode: z.string().max(40), occasion: z.string().max(500).default(""),
    intensity: z.number().min(1).max(5), extra: z.string().max(1000).default(""), adaptFrom: z.string().max(4000).optional(),
    presentation: z.enum(["masculine", "feminine"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: consent }, { data: dna }, { count: photoCount }, { data: rejected }, { data: safety }, { data: prefs }, { data: corrections }] = await Promise.all([
      supabase.from("visual_profiles").select("data").eq("user_id", userId).maybeSingle(),
      supabase.from("consents").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("visual_dna").select("signals, summary").eq("user_id", userId).maybeSingle(),
      supabase.from("photos").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("packages").select("content").eq("user_id", userId).eq("status", "rejected").order("created_at", { ascending: false }).limit(5),
      supabase.from("safety_config").select("blocked_terms").eq("id", 1).maybeSingle(),
      supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("dna_corrections").select("field, original, correction").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ]);
    if (!consent) return { error: "Conclua a etapa de consentimento primeiro.", batchId: null };

    const perms = (consent.module_permissions ?? {}) as Record<string, boolean>;
    const mod = MODULE_OF[data.entryMode];
    const dnaAllowed = consent.personalization && !consent.dna_paused && (mod ? perms[mod] !== false : true);

    const userPrompt = JSON.stringify({
      perfil: profile?.data ?? {},
      estrutura: presentationContext(profile?.data, data.presentation),
      preferencias: prefs ? { cores_preferidas: prefs.colors_liked, cores_rejeitadas: prefs.colors_rejected, estilos_preferidos: prefs.styles_liked, estilos_rejeitados: prefs.styles_rejected, tolerancia_permanente_1a5: prefs.permanent_tolerance, valorizar: prefs.body_highlight, preservar: prefs.body_preserve } : {},
      modo: data.entryMode, estado_emocional: data.emotionalMode, ocasiao: data.occasion,
      intensidade_1a5: data.intensity, observacoes: data.extra,
      dna_visual: dnaAllowed ? { resumo: dna?.summary ?? null, sinais: dna?.signals ?? [] } : "não autorizado — não personalize a partir do histórico",
      correcoes_do_usuario_nunca_repetir: corrections ?? [],
      titulos_rejeitados: (rejected ?? []).map((r) => (r.content as { title?: string })?.title),
      fotos_de_referencia: consent.photo_processing ? photoCount ?? 0 : 0,
      adaptar_este_pacote: data.adaptFrom ?? null,
      palavras_proibidas: safety?.blocked_terms ?? [],
    });

    const r = await callJson<{ packages: unknown[] }>(SYSTEM, userPrompt, packagesSchema, "aura_packages");
    if (!r.ok) return { error: r.error, batchId: null };
    if (!r.data.packages?.length) return { error: "Nenhuma sugestão foi retornada. Tente novamente.", batchId: null };

    const batchId = crypto.randomUUID();
    const rows = r.data.packages.slice(0, 5).map((content) => ({
      user_id: userId, batch_id: batchId, entry_mode: data.entryMode, emotional_mode: data.emotionalMode,
      context: { occasion: data.occasion, intensity: data.intensity, extra: data.extra, presentation: presentationContext(profile?.data, data.presentation).apresentacao }, content: content as never,
    }));
    const { error } = await supabase.from("packages").insert(rows);
    if (error) { console.error(error); return { error: "Não foi possível salvar suas sugestões.", batchId: null }; }
    await supabase.from("audit_events").insert({ user_id: userId, event: "package_generated", meta: { count: rows.length, entry_mode: data.entryMode, dna_used: dnaAllowed } });
    return { error: null, batchId };
  });

const notes = { type: "object", additionalProperties: false, required: ["makeup", "hair", "clothing", "tattoo"], properties: { makeup: str, hair: str, clothing: str, tattoo: str } };
const dnaSchema = {
  type: "object", additionalProperties: false,
  required: ["headline", "explanation", "colors_liked", "colors_rejected", "styles_liked", "styles_rejected", "maintenance", "budget", "professional_goals", "social_goals", "emotional_comfort", "body_notes", "permanent_change", "works_in_life", "theory_only", "change_readiness", "practicality", "guardrails", "constraints", "module_notes"],
  properties: {
    headline: str, explanation: str, colors_liked: strArr, colors_rejected: strArr, styles_liked: strArr, styles_rejected: strArr,
    maintenance: str, budget: str, professional_goals: str, social_goals: str, emotional_comfort: str, body_notes: str,
    permanent_change: str, works_in_life: strArr, theory_only: strArr, change_readiness: str, practicality: str,
    guardrails: strArr, constraints: strArr, module_notes: notes,
  },
};

const DNA_SYSTEM = `Você sintetiza o "DNA Visual" de uma pessoa: um retrato vivo, editável e NÃO diagnóstico da sua identidade visual.
${PRINCIPLES}
- Identidade é fluida: use linguagem como "neste momento", "parece que", "tem funcionado".
- Use SOMENTE os dados fornecidos. Se algo não foi informado, escreva "Ainda não sabemos" (ou lista vazia).
- body_notes só com o que a pessoa escreveu sobre áreas a valorizar/preservar; nunca invente.
- As correções do usuário têm prioridade absoluta sobre qualquer inferência; nunca repita uma inferência corrigida.
- guardrails: limites que as recomendações devem respeitar. constraints: restrições práticas de estilo.
- explanation: 2 frases explicando de onde veio este resumo.`;

export const synthesizeDna = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: consent } = await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", userId).maybeSingle();
    if (!consent?.personalization || consent.dna_paused) return { error: "Ative a personalização e retire a pausa para gerar o DNA Visual." };
    const permissions = (consent.module_permissions ?? {}) as Record<string, boolean>;
    const [{ data: profile }, { data: prefs }, { data: dna }, { data: pk }, { data: fb }, { data: corr }] = await Promise.all([
      supabase.from("visual_profiles").select("data").eq("user_id", userId).maybeSingle(),
      supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("visual_dna").select("signals").eq("user_id", userId).maybeSingle(),
      supabase.from("packages").select("kind, entry_mode, status, beautiful_not_practical, note, content").eq("user_id", userId).neq("status", "new").order("created_at", { ascending: false }).limit(30),
      supabase.from("feedback").select("module, rating, comfort, reflection").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("dna_corrections").select("field, original, correction").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);
    const input = JSON.stringify({
      perfil: profile?.data ?? {}, preferencias: prefs ?? {}, sinais: (Array.isArray(dna?.signals) ? dna.signals : []).filter(s => { const module = (s as { module?: string } | null)?.module; return module !== 'tattoo' && (module === 'beard' ? permissions[module] === true : !module || permissions[module] !== false); }),
      pacotes_com_reacao: (pk ?? []).filter(p => p.kind !== 'tattoo_plan' && p.entry_mode !== 'tattoo' && (p.entry_mode === 'beard' ? permissions['beard'] === true : permissions[p.entry_mode] !== false)).map((p) => ({ modulo: p.entry_mode, status: p.status, bonito_mas_nao_pratico: p.beautiful_not_practical, nota: p.note, titulo: (p.content as { title?: string })?.title })),
      feedback: (fb ?? []).filter(f => f.module === 'beard' ? permissions['beard'] === true : !f.module || permissions[f.module] !== false).map(f => f.module === 'tattoo' ? { module: f.module, rating: f.rating, comfort: f.comfort } : f), correcoes: corr ?? [],
    });
    const r = await callJson<Record<string, unknown>>(DNA_SYSTEM, input, dnaSchema, "visual_dna");
    if (!r.ok) return { error: r.error };
    const now = new Date().toISOString();
    await supabase.from("visual_dna").upsert({ user_id: userId, summary: r.data as never, signals_since_review: 0, updated_at: now });
    await supabase.from("dna_versions").insert({ user_id: userId, summary: r.data as never, source: "synthesis" });
    await supabase.from("audit_events").insert({ user_id: userId, event: "version_created", meta: { source: "synthesis" } });
    return { error: null };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: refs } = await supabaseAdmin.from("generated_references").select("path").eq("user_id", userId);
    if (refs?.length) { const r = await supabaseAdmin.storage.from("user-photos").remove(refs.flatMap(r => r.path ? [r.path] : [])); if (r.error) return { error: "Não foi possível excluir as referências." }; }
    const { data: photos, error: photoError } = await supabaseAdmin.from("photos").select("path").eq("user_id", userId);
    if (photoError) return { error: "Não foi possível preparar a exclusão das fotos." };
    if (photos?.length) { const r = await supabaseAdmin.storage.from("user-photos").remove(photos.map(p => p.path)); if (r.error) return { error: "Não foi possível excluir as fotos. Tente novamente." }; }
    for (const t of ["generated_references", "image_access_state", "beard_profiles", "photos", "packages", "collections", "feedback", "visual_dna", "dna_versions", "dna_corrections", "preferences", "makeup_profiles", "makeup_signatures", "confidence_kits", "reminders", "journey_reports", "journey_reflections", "journey_steps", "journey_plans", "journey_goals", "tattoo_care_logs", "tattoo_projects", "tattoo_profiles", "visual_profiles", "consents", "audit_events"] as const) {
      const { error: removeError } = await supabaseAdmin.from(t).delete().eq("user_id", userId);
      if (removeError) return { error: "Não foi possível concluir a exclusão dos seus dados. Tente novamente." };
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    return { error: null };
  });

export const adminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { allowed: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: events }, { data: consents }, { count: users }, { count: packages }, { count: photos }, { count: versions }] = await Promise.all([
      supabaseAdmin.from("audit_events").select("event, created_at").order("created_at", { ascending: false }).limit(1000),
      supabaseAdmin.from("consents").select("photo_processing, personalization, reminders, dna_paused"),
      supabaseAdmin.from("visual_profiles").select("user_id", { count: "exact", head: true }),
      supabaseAdmin.from("packages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("photos").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("dna_versions").select("id", { count: "exact", head: true }),
    ]);
    const counts: Record<string, number> = {};
    (events ?? []).forEach((e) => (counts[e.event] = (counts[e.event] ?? 0) + 1));
    const c = consents ?? [];
    return {
      allowed: true as const, counts, recent: (events ?? []).slice(0, 30),
      consent: { total: c.length, photo: c.filter((x) => x.photo_processing).length, personalization: c.filter((x) => x.personalization).length, paused: c.filter((x) => x.dna_paused).length, reminders: c.filter((x) => x.reminders).length },
      totals: { pessoas: users ?? 0, sugestões: packages ?? 0, fotos: photos ?? 0, "versões do DNA": versions ?? 0 },
      aiConfigured: !!process.env["LOVABLE_API_KEY"],
    };
  });
