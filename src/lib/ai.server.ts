export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Motor de IA do webapp — pós-migração (2026-10-27): todas as chamadas saem pelo
 * gateway próprio (Edge Function ai-gateway do projeto aura-id), com o token do
 * usuário logado lido da própria requisição. O Lovable AI deixa de ser dependência.
 */
import { getRequest } from "@tanstack/react-start/server";

const GATEWAY_URL = "https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/ai-gateway";

function authToken(): string | null {
  const header = getRequest()?.headers?.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7) || null;
}

function friendlyError(status: number, body: string): string {
  let message = body;
  try { message = String(JSON.parse(body).error ?? body); } catch { /* texto simples */ }
  if (status === 401) return "Entre na sua conta para usar a IA.";
  if (status === 402) {
    // Assinante no uso justo do mês: a mensagem do gateway já explica o limite.
    if (/limite de \d+ (an[áa]lises|imagens)/i.test(message)) return message;
    return "Você usou suas gerações gratuitas. O Aura Pass libera mais.";
  }
  if (status === 403 && /consent/i.test(body)) return "Ative as permissões de IA e fotos em Configurações.";
  if (status === 403) return message || "Acesso à IA bloqueado. Verifique as permissões em Configurações.";
  if (status === 429) {
    if (/aguarde/i.test(message)) return message;
    return "Muitas solicitações agora. Tente novamente em instantes.";
  }
  return message || "O serviço de IA não respondeu. Tente novamente.";
}

async function callGateway<T>(body: Record<string, unknown>): Promise<AiResult<T>> {
  const token = authToken();
  if (!token) return { ok: false, error: "Entre na sua conta para usar a IA." };
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: friendlyError(res.status, await res.text()) };
    const json = (await res.json()) as { data?: T; error?: string };
    if (json.error) return { ok: false, error: friendlyError(400, JSON.stringify(json)) };
    if (json.data === undefined) return { ok: false, error: "A resposta veio incompleta. Tente novamente." };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "O serviço de IA não respondeu. Tente novamente." };
  }
}

export async function callJson<T>(instructions: string, input: string, schema: object, name: string): Promise<AiResult<T>> {
  const params = {
    instructions: `${instructions}\nResponda EXCLUSIVAMENTE com um objeto JSON válido no formato do esquema "${name}": ${JSON.stringify(schema)}`,
    input,
  };
  return callGateway<T>({ task_id: "webapp.json", app: "webapp", params });
}

/** Verificação visual pós-geração: imageUrl DEVE ser URL assinada do storage (exigência do gateway). */
export async function visionCheck<T>(imageUrl: string, instructions: string, schema: object, name: string): Promise<AiResult<T>> {
  const params = { instructions: `${instructions}\nResponda no formato do esquema "${name}": ${JSON.stringify(schema)}` };
  return callGateway<T>({ task_id: "webapp.vision", app: "webapp", input_refs: [imageUrl], params });
}
