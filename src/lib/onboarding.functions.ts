import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJson } from "./ai.server";

const s = { type: "string" };
const helpSchema = {
  type: "object", additionalProperties: false, required: ["answer", "example", "options"],
  properties: { answer: s, example: s, options: { type: "array", items: s } },
};

const SYS = `Você é a ajudante do formulário inicial da Aura ID, em português do Brasil.
- Responda em NO MÁXIMO 2 frases curtas, acolhedoras, sem termos técnicos.
- Sempre dê um exemplo prático em "example".
- Em "options", devolva de 1 a 3 respostas prontas, copiadas exatamente da lista de opções do campo quando houver; senão, respostas curtas que a pessoa possa usar.
- Nunca julgue corpo, peso ou aparência; nenhum formato é melhor. Não peça dados sensíveis.
- Lembre que é sempre possível pular e retomar depois.`;

function twoSentences(t: string) {
  const parts = t.match(/[^.!?]+[.!?]+/g) ?? [t];
  return parts.slice(0, 2).join(" ").trim();
}

export const onboardingHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    field: z.string().max(120), hint: z.string().max(300), options: z.array(z.string().max(60)).max(12),
    question: z.string().min(1).max(500), history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(600) })).max(10),
  }).parse(d))
  .handler(async ({ data }) => {
    const r = await callJson<{ answer: string; example: string; options: string[] }>(SYS, JSON.stringify(data), helpSchema, "onboarding_help");
    if (!r.ok) return { error: r.error, answer: null };
    return { error: null, answer: { answer: twoSentences(r.data.answer), example: r.data.example, options: r.data.options.slice(0, 3) } };
  });

export const generateAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ description: z.string().max(600) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "A IA ainda não está configurada.", path: null };
    const { supabase, userId } = context;
    const { data: consent } = await supabase.from("consents").select("photo_processing").eq("user_id", userId).maybeSingle();
    if (!consent?.photo_processing) return { error: "Ative o processamento de fotos em Configurações para guardar um avatar.", path: null };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-image-2.5-sunburst", size: "1024x1536", quality: "medium", stream: true, partial_images: 1,
        prompt: `Fotografia realista de corpo inteiro, estilo editorial de moda, luz natural suave, fundo de estúdio marfim liso, pose neutra e respeitosa, expressão serena. Pessoa adulta fictícia com estas características: ${data.description}. Representar o tom de pele e a textura natural do cabelo com fidelidade e respeito, sem retoques que afinem ou mudem o corpo. Roupa simples e básica (camiseta lisa e calça reta) no caimento dos tamanhos indicados. Sem texto, sem logotipos.`,
      }),
    });
    if (!res.ok || !res.body) {
      console.error("avatar gen", res.status, await res.text());
      return { error: res.status === 402 ? "Os créditos de IA acabaram neste workspace." : res.status === 429 ? "Muitas solicitações agora. Tente em instantes." : res.status === 403 ? "O acesso à IA de imagens foi bloqueado para este workspace." : "Não foi possível gerar o retrato agora.", path: null };
    }
    // Lê o stream SSE até o fim; guarda a imagem final (ou a última parcial).
    const reader = res.body.getReader(); const dec = new TextDecoder();
    let buf = "", b64: string | undefined, final: string | undefined, streamErr: string | undefined;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const ev = JSON.parse(raw) as { type?: string; b64_json?: string; data?: { b64_json?: string }[]; error?: { message?: string } };
          const img = ev.b64_json ?? ev.data?.[0]?.b64_json;
          if (ev.error) streamErr = ev.error.message ?? "erro";
          if (img) { b64 = img; if (!ev.type?.includes("partial")) final = img; }
        } catch { /* frame incompleto */ }
      }
    }
    b64 = final ?? b64;
    if (!b64) { console.error("avatar stream", streamErr); return { error: "A IA não devolveu uma imagem.", path: null }; }
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${userId}/avatar-${crypto.randomUUID()}.png`;
    const up = await supabase.storage.from("user-photos").upload(path, bytes, { contentType: "image/png" });
    if (up.error) return { error: "Não foi possível guardar o avatar.", path: null };
    await supabase.from("photos").insert({ user_id: userId, path, kind: "avatar" });
    return { error: null, path };
  });
