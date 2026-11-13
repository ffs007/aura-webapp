import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
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
  .validator((d) => z.object({
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

/**
 * Exclusão definitiva da conta (LGPD): apaga primeiro os objetos do Storage
 * (fotos privadas em `user-photos` e designs da vitrine em `studio-media`),
 * depois todas as linhas com dados da pessoa nas tabelas do app e, só no fim,
 * o login no Supabase Auth. Se qualquer etapa crítica falhar, o login NÃO é
 * apagado: a pessoa continua conseguindo entrar e tentar de novo, sem deixar
 * dados inacessíveis para trás. Assinatura mantida ({ error }) para a UI.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /** Etapas que falharam — qualquer uma delas impede apagar o login. */
    const falhas: string[] = [];
    function anotarFalha(etapa: string, erro: unknown) {
      console.error(`[deleteAccount] falhou: ${etapa}`, erro);
      falhas.push(etapa);
    }

    const BUCKET_FOTOS = "user-photos";
    const BUCKET_ESTUDIO = "studio-media";
    const PAGINA_LISTAGEM = 100;
    const LOTE_REMOCAO = 100;

    /** Lista (recursivo, paginado) os arquivos de uma pasta do Storage. */
    async function listarArquivos(bucket: string, pasta: string, profundidade = 0): Promise<string[]> {
      const arquivos: string[] = [];
      let offset = 0;
      for (;;) {
        const { data, error } = await supabaseAdmin.storage.from(bucket).list(pasta, {
          limit: PAGINA_LISTAGEM,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;
        const itens = data ?? [];
        for (const item of itens) {
          const caminho = `${pasta}/${item.name}`;
          // Pastas vêm sem id/metadata; descemos um nível (com limite de segurança).
          if (!item.id && profundidade < 4) arquivos.push(...(await listarArquivos(bucket, caminho, profundidade + 1)));
          else arquivos.push(caminho);
        }
        if (itens.length < PAGINA_LISTAGEM) break;
        offset += PAGINA_LISTAGEM;
      }
      return arquivos;
    }

    async function removerArquivos(bucket: string, caminhos: string[]) {
      for (let i = 0; i < caminhos.length; i += LOTE_REMOCAO) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(caminhos.slice(i, i + LOTE_REMOCAO));
        if (error) throw error;
      }
    }

    /** Extrai o caminho dentro do bucket a partir de uma URL pública/assinada. */
    function caminhoDoBucket(url: string | null | undefined, bucket: string): string | null {
      if (!url) return null;
      const marcador = `/${bucket}/`;
      const inicio = url.indexOf(marcador);
      if (inicio < 0) return null;
      const caminho = (url.slice(inicio + marcador.length).split("?")[0] ?? "").trim();
      if (!caminho) return null;
      try { return decodeURIComponent(caminho); } catch { return caminho; }
    }

    const caminhos = new Map<string, Set<string>>([
      [BUCKET_FOTOS, new Set<string>()],
      [BUCKET_ESTUDIO, new Set<string>()],
    ]);
    function guardarCaminho(bucket: string, caminho: string | null | undefined) {
      if (caminho) caminhos.get(bucket)?.add(caminho);
    }

    // ---- 1) Storage: a pasta da pessoa é sempre {userId}/ ------------------
    for (const bucket of [BUCKET_FOTOS, BUCKET_ESTUDIO]) {
      try {
        for (const arquivo of await listarArquivos(bucket, userId)) guardarCaminho(bucket, arquivo);
      } catch (e) { anotarFalha(`listar objetos de ${bucket}`, e); }
    }

    // Caminhos conhecidos no banco (reforço caso algo escape da listagem).
    const fotos = await supabaseAdmin.from("photos").select("path").eq("user_id", userId);
    if (fotos.error) anotarFalha("ler caminhos das fotos", fotos.error);
    else (fotos.data ?? []).forEach((f) => guardarCaminho(BUCKET_FOTOS, f.path));

    const referencias = await supabaseAdmin.from("generated_references").select("path").eq("user_id", userId);
    if (referencias.error) anotarFalha("ler caminhos das referências", referencias.error);
    else (referencias.data ?? []).forEach((r) => guardarCaminho(BUCKET_FOTOS, r.path));

    // estetica_registro não tem user_id: o vínculo é a jornada estética.
    let jornadas: string[] = [];
    const jornadasEstetica = await supabaseAdmin.from("estetica_jornada").select("id").eq("user_id", userId);
    if (jornadasEstetica.error) anotarFalha("ler jornadas estéticas", jornadasEstetica.error);
    else jornadas = (jornadasEstetica.data ?? []).map((j) => j.id);
    if (jornadas.length) {
      const registros = await supabaseAdmin.from("estetica_registro").select("foto_path").in("jornada_id", jornadas);
      if (registros.error) anotarFalha("ler fotos da jornada estética", registros.error);
      else (registros.data ?? []).forEach((r) => guardarCaminho(BUCKET_FOTOS, r.foto_path));
    }

    // tattoo_designs pertence ao perfil profissional (também sem user_id).
    let perfisProfissionais: string[] = [];
    const profissionais = await supabaseAdmin.from("professionals").select("id").eq("user_id", userId);
    if (profissionais.error) anotarFalha("ler perfil profissional", profissionais.error);
    else perfisProfissionais = (profissionais.data ?? []).map((p) => p.id);
    if (perfisProfissionais.length) {
      const designs = await supabaseAdmin.from("tattoo_designs").select("imagem_url").in("professional_id", perfisProfissionais);
      if (designs.error) anotarFalha("ler designs da vitrine", designs.error);
      else (designs.data ?? []).forEach((d) => guardarCaminho(BUCKET_ESTUDIO, caminhoDoBucket(d.imagem_url, BUCKET_ESTUDIO)));
    }

    for (const bucket of [BUCKET_FOTOS, BUCKET_ESTUDIO]) {
      const arquivos = [...(caminhos.get(bucket) ?? [])];
      if (!arquivos.length) continue;
      try { await removerArquivos(bucket, arquivos); } catch (e) { anotarFalha(`remover objetos de ${bucket}`, e); }
    }

    // ---- 2) Filhas sem user_id (apagar antes das tabelas-mãe) -------------
    if (jornadas.length) {
      const { error } = await supabaseAdmin.from("estetica_registro").delete().in("jornada_id", jornadas);
      if (error) anotarFalha("apagar registros da jornada estética", error);
    }
    if (perfisProfissionais.length) {
      const { error } = await supabaseAdmin.from("tattoo_designs").delete().in("professional_id", perfisProfissionais);
      if (error) anotarFalha("apagar designs da vitrine", error);
    }
    const sugestoes = await supabaseAdmin.from("briefing_suggestions").delete().eq("professional_user_id", userId);
    if (sugestoes.error) anotarFalha("apagar sugestões de IA enviadas", sugestoes.error);
    if (perfisProfissionais.length) {
      // Briefings que outras pessoas enviaram para este perfil profissional.
      const recebidos = await supabaseAdmin.from("briefing_sends").delete().in("professional_id", perfisProfissionais);
      if (recebidos.error) anotarFalha("apagar briefings recebidos", recebidos.error);
    }

    // ---- 3) Todas as tabelas com user_id ----------------------------------
    const tabelas = [
      "generated_references",
      "image_access_state",
      "photos",
      "collections",
      "feedback",
      "visual_dna",
      "dna_versions",
      "dna_corrections",
      "preferences",
      "makeup_profiles",
      "makeup_signatures",
      "confidence_kits",
      "hair_profiles",
      "hair_alerts",
      "style_profiles",
      "wardrobe_items",
      "style_analyses",
      "beard_profiles",
      "tattoo_care_logs",
      "tattoo_projects",
      "tattoo_profiles",
      "journey_reports",
      "journey_reflections",
      "journey_steps",
      "journey_plans",
      "journey_goals",
      "reminders",
      "audit_events",
      "feedback_aura",
      "user_roles",
      "briefing_sends",
      "estetica_jornada",
      "professionals",
      "packages",
      "consents",
      "visual_profiles",
    ] as const;
    for (const tabela of tabelas) {
      const { error } = await supabaseAdmin.from(tabela).delete().eq("user_id", userId);
      if (error) anotarFalha(`apagar ${tabela}`, error);
    }

    if (falhas.length) {
      return { error: "Não foi possível concluir a exclusão de todos os seus dados. Nada do seu login foi apagado; tente novamente." };
    }

    // ---- 4) Só agora o login, quando todos os dados foram apagados --------
    // As tabelas do schema `core` que o app usa (ai_runs/uso, entitlements dos
    // planos, profiles, consents, photos…) têm user_id REFERENCES auth.users
    // ON DELETE CASCADE, então caem junto com esta exclusão do login.
    const { error: erroAuth } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (erroAuth) {
      console.error("[deleteAccount] falha ao apagar login", erroAuth);
      return { error: "Seus dados foram apagados, mas não conseguimos encerrar seu login agora. Tente novamente em alguns minutos." };
    }
    return { error: null };
  });

/**
 * Tabelas consultadas na exportação da pessoa (LGPD art. 18, portabilidade).
 * Só texto/JSON — fotos e arquivos do Storage ficam fora (aviso no retorno).
 */
const TABELAS_EXPORTACAO = [
  "consents",
  "visual_profiles",
  "visual_dna",
  "dna_versions",
  "packages",
  "collections",
  "feedback",
  "reminders",
  "journey_goals",
  "journey_plans",
  "journey_steps",
  "journey_reflections",
  "journey_reports",
  "tattoo_profiles",
  "tattoo_projects",
  "tattoo_care_logs",
  "makeup_profiles",
  "hair_profiles",
  "wardrobe_items",
  "style_analyses",
  "beard_profiles",
  "professionals",
  "briefing_sends",
] as const;

/** Tabelas com um único registro por pessoa: saem como objeto no JSON. */
const TABELAS_UM_REGISTRO: ReadonlySet<string> = new Set([
  "consents",
  "visual_profiles",
  "visual_dna",
  "tattoo_profiles",
  "makeup_profiles",
  "hair_profiles",
  "beard_profiles",
  "professionals",
]);

/**
 * Exporta os dados da pessoa em texto/JSON (sem imagens). Usa o cliente
 * autenticado (RLS: só as próprias linhas) e falha em PT-BR se algo faltar —
 * exportação parcial silenciosa seria pior do que pedir para tentar de novo.
 */
export const exportarMeusDados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const dados: Record<string, Json> = {};
    const falhas: string[] = [];

    for (const tabela of TABELAS_EXPORTACAO) {
      const { data, error } = await supabase.from(tabela).select("*").eq("user_id", userId);
      if (error) {
        console.error(`[exportarMeusDados] falhou: ${tabela}`, error);
        falhas.push(tabela);
        continue;
      }
      const registros = (data ?? []) as unknown as Json[];
      dados[tabela] = TABELAS_UM_REGISTRO.has(tabela) ? (registros[0] ?? null) : registros;
    }

    if (falhas.length) {
      throw new Error("Não foi possível exportar todos os seus dados agora. Tente novamente em alguns instantes.");
    }

    return {
      aviso: "Exportação em texto/JSON. Fotos, imagens geradas e arquivos do Storage não estão incluídos.",
      exportado_em: new Date().toISOString(),
      user_id: userId,
      dados,
    };
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
