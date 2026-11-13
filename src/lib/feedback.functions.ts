import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { consumirLimite, erroDeLimite, identificadorDoCliente } from './limites.server';

/**
 * CANAL DE FEEDBACK (transversal — "crítica é ouro", pedido do Felipe).
 * Qualquer pessoa envia (anônimo permitido); só admin lê.
 *
 * Limites (S6): no máximo 3 envios por 10 minutos por conta/IP em memória e,
 * para quem está logado, no máximo 15 por 24 h contando as linhas já gravadas.
 * A proteção durável contra abuso em massa fica na borda (Cloudflare).
 */

const TIPOS = ['critica', 'sugestao', 'duvida', 'elogio'] as const;
const LIMITE_JANELA = { max: 3, janelaMs: 10 * 60 * 1000 };
const LIMITE_DIARIO = 15;

function clienteAnon() {
  const url = process.env['SUPABASE_URL'], chave = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !chave) throw new Error('Configuração indisponível agora.');
  return createClient<Database>(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const enviarFeedback = createServerFn({ method: 'POST' })
  .validator((d) => z.object({
    tipo: z.enum(TIPOS),
    texto: z.string().min(5).max(4000),
    contato: z.string().max(120).optional(),
    rota: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const db = clienteAnon();
    // Anexa a conta quando houver sessão — sem bloquear quem está deslogado.
    const token = getRequest()?.headers?.get('authorization');
    const { data: u } = token?.startsWith('Bearer ') ? await db.auth.getUser(token) : { data: { user: null } };
    const user_id = u.user?.id ?? null;

    // Freio de abuso: janela curta em memória (conta ou IP) e teto diário no banco.
    const limite = consumirLimite(
      `feedback:${user_id ?? identificadorDoCliente(getRequest())}`,
      LIMITE_JANELA.max,
      LIMITE_JANELA.janelaMs,
    );
    if (!limite.permitido) throw erroDeLimite(limite);
    if (user_id) {
      const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await db
        .from('feedback_aura')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .gte('created_at', desde);
      if ((count ?? 0) >= LIMITE_DIARIO) {
        throw new Error('Você já enviou bastante feedback hoje. Obrigado! Tente novamente amanhã.');
      }
    }

    const { error } = await db.from('feedback_aura').insert({
      tipo: data.tipo,
      texto: data.texto.trim(),
      contato: data.contato?.trim() || null,
      rota: data.rota?.slice(0, 120) ?? null,
      user_id,
    });
    if (error) throw new Error('Não foi possível enviar agora. Tente novamente.');
    return { ok: true };
  });

export type FeedbackAura = {
  id: string; tipo: string; texto: string; contato: string | null;
  rota: string | null; user_id: string | null; created_at: string;
};

export const listarFeedbackAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Acesso restrito a administradores.');
    const { data: rows, error } = await supabase.from('feedback_aura')
      .select('id,tipo,texto,contato,rota,user_id,created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error('Não foi possível carregar o feedback.');
    return (rows ?? []) as FeedbackAura[];
  });
