import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Contagem de uso das gerações de imagem do webapp (core.ai_runs via REST com
 * Accept-Profile: core — RLS devolve apenas as próprias execuções concluídas).
 * Usada pelo chip "X de N grátis" nas telas de geração.
 */

export const LIMITES: Record<string, number> = {
  'webapp.reference.render': 5,
  'webapp.ink.render': 5,
  'webapp.retrato.edit': 2,
  'webapp.modelo.render': 2,
  'webapp.tryon.render': 2,
  'webapp.ink.tryon': 2,
  // Medição + simulação de estética: até aqui a tela não tinha contador nenhum.
  'webapp.estetica.sim': 2,
};

const AI_RUNS_URL = 'https://oyfqecigqrceijoxggqw.supabase.co/rest/v1/ai_runs';

export const usoQuota = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { userId } }) => {
    const token = getRequest()?.headers?.get('authorization');
    const apikey = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!token?.startsWith('Bearer ') || !apikey) throw new Error('Entre na sua conta.');
    const ids = Object.keys(LIMITES).join(',');
    const filtros = new URLSearchParams({
      select: 'task_id',
      user_id: `eq.${userId}`,
      status: 'eq.completed',
      'task_id': `in.(${ids})`,
    });
    const res = await fetch(`${AI_RUNS_URL}?${filtros}`, {
      headers: { apikey, Authorization: token, 'Accept-Profile': 'core' },
    });
    if (!res.ok) throw new Error('Não foi possível verificar seu uso agora.');
    const rows = (await res.json()) as { task_id: string }[];
    const contagem: Record<string, number> = {};
    for (const r of rows) contagem[r.task_id] = (contagem[r.task_id] ?? 0) + 1;
    return contagem;
  });
