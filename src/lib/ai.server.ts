export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function callJson<T>(instructions: string, input: string, schema: object, name: string): Promise<AiResult<T>> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ok: false, error: "A IA ainda não está configurada." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input: [{ role: "user", content: input }],
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text();
    console.error("AI gateway error", res.status, body);
    const error =
      res.status === 429 ? "Muitas solicitações agora. Tente novamente em instantes." :
      res.status === 402 ? "Os créditos de IA acabaram neste workspace. Adicione créditos para continuar." :
      res.status === 403 ? "O acesso à IA foi bloqueado para este workspace." :
      `O serviço de IA não respondeu (${res.status}).`;
    return { ok: false, error };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") console.error("AI stream error", payload);
      } catch { /* ignore */ }
    }
  }
  try { return { ok: true, data: JSON.parse(text) as T }; } catch {
    console.error("AI parse failure", text.slice(0, 500));
    return { ok: false, error: "A resposta veio incompleta. Tente novamente." };
  }
}
