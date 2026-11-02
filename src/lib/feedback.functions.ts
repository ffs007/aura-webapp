import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * CANAL DE FEEDBACK (transversal — "crítica é ouro", pedido do Felipe).
 * Qualquer pessoa envia (anônimo permitido); só admin lê.
 */

const TIPOS = ['critica', 'sugestao', 'duvida', 'elogio'] as const;

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
    let user_id: string | null = null;
    if (token?.startsWith('Bearer ')) {
      const { data: u } = await db.auth.getUser(token);
      user_id = u.user?.id ?? null;
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
