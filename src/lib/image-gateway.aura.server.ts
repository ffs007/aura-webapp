import { createClient } from "@supabase/supabase-js";

/**
 * Geração de imagens do webapp — pós-migração (2026-10-27): sai pelo gateway próprio
 * (fal.ai FLUX) em vez do Lovable AI. Mantém as mesmas guardas do fluxo original:
 * usuário autenticado, consentimentos de foto/IA e estado de bloqueio de acesso.
 */
const GATEWAY_URL = "https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/ai-gateway";

const sseCompleted = (url: string) =>
  new Response(
    `event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", url })}\n\n`,
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } },
  );

const TASKS_PERMITIDAS = new Set(["webapp.reference.render", "webapp.ink.render"]);
const PREFIXO_STORAGE = "https://oyfqecigqrceijoxggqw.supabase.co/storage/v1/object/sign/";

export async function referenceRequest(request: Request) {
  const token = request.headers.get("authorization");
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token?.startsWith("Bearer ") || !url || !key) return new Response("Entre na sua conta.", { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: token } } });
  const { data: auth, error } = await db.auth.getUser(token.slice(7));
  if (error || !auth.user) return new Response("Entre na sua conta.", { status: 401 });
  const userId = auth.user.id;
  const input = await request.json() as { id?: string; task_id?: string; input_refs?: unknown };
  const taskId = typeof input.task_id === "string" && TASKS_PERMITIDAS.has(input.task_id) ? input.task_id : "webapp.reference.render";
  const inputRefs = Array.isArray(input.input_refs)
    ? input.input_refs.filter((r): r is string => typeof r === "string" && r.startsWith(PREFIXO_STORAGE)).slice(0, 3)
    : [];
  const [{ data: row }, { data: consent }, { data: access }] = await Promise.all([
    db.from("generated_references").select("*").eq("id", input.id ?? "").eq("user_id", userId).maybeSingle(),
    db.from("consents").select("photo_processing,image_generation").eq("user_id", userId).maybeSingle(),
    db.from("image_access_state").select("denied,message").eq("user_id", userId).maybeSingle(),
  ]);
  if (access?.denied) return new Response(access.message ?? "Acesso à IA de imagens bloqueado.", { status: 403 });
  if (!consent?.photo_processing || !consent.image_generation) return new Response("Permissão para imagens desativada.", { status: 403 });
  if (!row || !["ready", "generating"].includes(row.status)) return new Response("Solicitação não encontrada ou encerrada.", { status: 404 });
  await db.from("generated_references").update({ status: "generating" }).eq("id", row.id);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.slice(7)}` },
    body: JSON.stringify({ media: "image", task_id: taskId, app: "webapp", ...(inputRefs.length ? { input_refs: inputRefs } : {}), params: { prompt: row.prompt } }),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    let friendly = "Não foi possível gerar a imagem.";
    try { friendly = String(JSON.parse(message).error ?? friendly); } catch { /* texto simples */ }
    await db.from("generated_references").update({ status: "failed", error: friendly, updated_at: new Date().toISOString() }).eq("id", row.id);
    return new Response(friendly, { status: res.status === 402 || res.status === 403 ? res.status : 502 });
  }
  const body = await res.json() as { image_url?: string };
  if (!body.image_url) {
    await db.from("generated_references").update({ status: "failed", error: "Provedor sem imagem.", updated_at: new Date().toISOString() }).eq("id", row.id);
    return new Response("O provedor não devolveu imagem.", { status: 502 });
  }
  return sseCompleted(body.image_url);
}
