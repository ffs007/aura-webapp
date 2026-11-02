import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Aura Pass (assinatura Stripe). O status é lido de core.entitlements (RLS: próprio
 * usuário); o link de pagamento sai da Edge Function stripe-checkout, que valida o
 * token do usuário e o preço no Supabase — nenhuma chave do Stripe toca o navegador.
 */

const CHECKOUT_URL = 'https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/stripe-checkout';
const ENTITLEMENTS_URL = 'https://oyfqecigqrceijoxggqw.supabase.co/rest/v1/entitlements';

export const AURA_PASS_LABEL = 'Aura Pass';
export const AURA_PASS_PRECO = 'R$ 19,90/mês';
export const AURA_PRO_LABEL = 'Plano Profissional';
export const AURA_PRO_PRECO = 'R$ 49,90/mês';

export type PassStatus = { active: boolean; purchased_at: string | null; expires_at: string | null };

export const passStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { userId } }) => statusEntitlement(userId, 'pass'));

/** Status do Plano Profissional (sugestões de IA ilimitadas para quem é da área). */
export const proStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { userId } }) => statusEntitlement(userId, 'pro'));

async function statusEntitlement(userId: string, id: string): Promise<PassStatus> {
  const token = getRequest()?.headers?.get('authorization');
  const apikey = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!token?.startsWith('Bearer ') || !apikey) throw new Error('Entre na sua conta.');
  const filtros = new URLSearchParams({
    select: 'purchased_at,expires_at',
    entitlement_id: `eq.${id}`,
    is_active: 'eq.true',
    user_id: `eq.${userId}`,
    or: `(expires_at.is.null,expires_at.gt.${new Date().toISOString()})`,
  });
  const res = await fetch(`${ENTITLEMENTS_URL}?${filtros}`, {
    headers: { apikey, Authorization: token, 'Accept-Profile': 'core' },
  });
  if (!res.ok) throw new Error('Não foi possível verificar sua assinatura agora.');
  const rows = (await res.json()) as { purchased_at: string | null; expires_at: string | null }[];
  const row = rows[0];
  return { active: !!row, purchased_at: row?.purchased_at ?? null, expires_at: row?.expires_at ?? null } satisfies PassStatus;
}

async function chamarCheckout(appUrl: string, action?: 'portal', plano?: 'pass' | 'pro'): Promise<string> {
  const token = getRequest()?.headers?.get('authorization');
  if (!token?.startsWith('Bearer ')) throw new Error('Entre na sua conta.');
  const res = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ app_url: appUrl, ...(action ? { action } : {}), ...(plano && !action ? { plano } : {}) }),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error ?? 'Não foi possível iniciar o pagamento agora.');
  return body.url;
}

export const createCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ app_url: z.string().url(), plano: z.enum(['pass', 'pro']).optional() }).parse(d))
  .handler(async ({ data }) => chamarCheckout(data.app_url, undefined, data.plano));

export const portalUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ app_url: z.string().url() }).parse(d))
  .handler(async ({ data }) => chamarCheckout(data.app_url, 'portal'));
