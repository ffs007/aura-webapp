/**
 * Telemetria de falhas de interpretação da IA (brief não aproveitável).
 *
 * Antes, uma validação reprovada virava apenas uma mensagem genérica na tela —
 * sem rastro para investigar. Agora o evento fica registrado em `audit_events`
 * (`brief_incompleto`) e no log do servidor, sem conteúdo pessoal: só módulo e
 * um resumo truncado da resposta.
 */
export async function registrarBriefIncompleto(
  supabase: unknown,
  userId: string,
  modulo: string,
  detalhe: unknown,
): Promise<void> {
  const resumo = (() => {
    try {
      return JSON.stringify(detalhe)?.slice(0, 800) ?? "";
    } catch {
      return String(detalhe).slice(0, 800);
    }
  })();
  console.warn(`[aura] brief_incompleto modulo=${modulo} detalhe=${resumo}`);
  try {
    const sb = supabase as {
      from: (tabela: string) => { insert: (valores: Record<string, unknown>) => PromiseLike<{ error?: unknown }> };
    };
    await sb.from("audit_events").insert({ user_id: userId, event: "brief_incompleto", meta: { modulo, detalhe: resumo } });
  } catch {
    /* telemetria é best-effort: nunca derruba a geração */
  }
}
