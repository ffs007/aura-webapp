import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { ehPlano, type Plano } from './planos';

/**
 * Contagem de uso das gerações de imagem do webapp (core.ai_runs via REST com
 * Accept-Profile: core — RLS devolve apenas as próprias execuções concluídas).
 * Usada pelo chip "X de N grátis" e, para assinantes, pelo resumo de uso justo
 * ("X de 50 imagens no mês").
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

const SUPABASE_URL = 'https://oyfqecigqrceijoxggqw.supabase.co';
const AI_RUNS_URL = `${SUPABASE_URL}/rest/v1/ai_runs`;
const ENTITLEMENTS_URL = `${SUPABASE_URL}/rest/v1/entitlements`;
const TAREFAS_IMAGEM = Object.keys(LIMITES);

export type UsoQuotaResposta = {
  /** Execuções gratuitas por tarefa (all-time), para o chip de grátis. */
  contagem: Record<string, number>;
  /** Plano ativo do usuário, quando houver. */
  plano: Plano | null;
  /** Imagens geradas no mês corrente (todas as tarefas de imagem). */
  imagensMes: number;
  /** Imagens geradas hoje. */
  imagensHoje: number;
};

function inicioDoMesUtc(): string {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString();
}

function inicioDoDiaUtc(): string {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())).toISOString();
}

export const usoQuota = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { userId } }): Promise<UsoQuotaResposta> => {
    const token = getRequest()?.headers?.get('authorization');
    const apikey = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!token?.startsWith('Bearer ') || !apikey) throw new Error('Entre na sua conta.');
    const headers = { apikey, Authorization: token, 'Accept-Profile': 'core' };
    const ids = TAREFAS_IMAGEM.join(',');

    const filtrosGratis = new URLSearchParams({
      select: 'task_id',
      user_id: `eq.${userId}`,
      status: 'eq.completed',
      task_id: `in.(${ids})`,
    });
    const filtrosMes = new URLSearchParams({
      select: 'task_id,created_at',
      user_id: `eq.${userId}`,
      status: 'eq.completed',
      task_id: `in.(${ids})`,
      created_at: `gte.${inicioDoMesUtc()}`,
      limit: '2000',
    });
    const filtrosPlano = new URLSearchParams({
      select: 'entitlement_id',
      user_id: `eq.${userId}`,
      is_active: 'eq.true',
      entitlement_id: 'in.(pass,pro)',
      or: `(expires_at.is.null,expires_at.gt.${new Date().toISOString()})`,
      limit: '5',
    });

    const [resGratis, resMes, resPlano] = await Promise.all([
      fetch(`${AI_RUNS_URL}?${filtrosGratis}`, { headers }),
      fetch(`${AI_RUNS_URL}?${filtrosMes}`, { headers }),
      fetch(`${ENTITLEMENTS_URL}?${filtrosPlano}`, { headers }),
    ]);
    if (!resGratis.ok || !resMes.ok) throw new Error('Não foi possível verificar seu uso agora.');

    const gratis = (await resGratis.json()) as { task_id: string }[];
    const mes = (await resMes.json()) as { task_id: string; created_at: string }[];
    const planos = resPlano.ok ? ((await resPlano.json()) as { entitlement_id?: string }[]) : [];

    const contagem: Record<string, number> = {};
    for (const r of gratis) contagem[r.task_id] = (contagem[r.task_id] ?? 0) + 1;

    const inicioDia = inicioDoDiaUtc();
    const imagensHoje = mes.filter((r) => r.created_at >= inicioDia).length;
    const encontrado = planos.find((p) => ehPlano(p.entitlement_id))?.entitlement_id;
    return {
      contagem,
      plano: ehPlano(encontrado) ? encontrado : null,
      imagensMes: mes.length,
      imagensHoje,
    };
  });
