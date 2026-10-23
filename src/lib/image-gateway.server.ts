import { createClient } from "@supabase/supabase-js";
export async function referenceRequest(request: Request) {
  const token = request.headers.get("authorization");
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token?.startsWith("Bearer ") || !url || !key) return new Response("Entre na sua conta.", { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: token }, fetch: (input, init) => { const h = new Headers(init?.headers); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } } });
  const { data: auth, error } = await db.auth.getUser(token.slice(7));
  if (error || !auth.user) return new Response("Entre na sua conta.", { status: 401 });
  const userId = auth.user.id;
  const input = await request.json() as { id?: string; stream?: boolean };
  const [{ data: row }, { data: consent }, { data: access }] = await Promise.all([
    db.from("generated_references").select("*").eq("id", input.id ?? "").eq("user_id", userId).maybeSingle(),
    db.from("consents").select("photo_processing,image_generation").eq("user_id", userId).maybeSingle(),
    db.from("image_access_state").select("denied,message").eq("user_id", userId).maybeSingle(),
  ]);
  if (access?.denied) return new Response(access.message ?? "Acesso à IA de imagens bloqueado. É necessário restaurar o acesso antes de uma nova solicitação.", { status: 403 });
  if (!consent?.photo_processing || !consent.image_generation) return new Response("Permissão para imagens desativada.", { status: 403 });
  if (!row || !["ready", "generating"].includes(row.status)) return new Response("Solicitação não encontrada ou encerrada.", { status: 404 });
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("A IA não está configurada.", { status: 500 });
  await db.from("generated_references").update({ status: "generating" }).eq("id", row.id);
  const stream = input.stream !== false;
  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", { method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" }, body: JSON.stringify({ model: "openai/gpt-image-2.5-sunburst", prompt: row.prompt, size: "1024x1536", quality: "medium", ...(stream ? { stream: true, partial_images: 1 } : {}) }) });
  const headers = new Headers({ "Content-Type": upstream.headers.get("Content-Type") ?? "application/json", "Cache-Control": "no-store" });
  upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith("x-lovable-aig-")) headers.set(k, v); });
  if (upstream.status === 403 || upstream.status === 402) {
    const text = await upstream.text();
    let message = text;
    try { const body = JSON.parse(text); message = String(body.message ?? body.error?.message ?? text); } catch { /* Plain safe gateway message. */ }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("image_access_state").upsert({ user_id: userId, denied: true, message, updated_at: new Date().toISOString() });
    return new Response(JSON.stringify({ error: { message } }), { status: upstream.status, headers });
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}