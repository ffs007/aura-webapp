import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Meu Modelo (modelo pessoal canônico: rosto + corpo) — consentimento PRÓPRIO
 * (module_permissions.personal_model, além de fotos/imagens IA) e geração via
 * gateway webapp.modelo.render (Kontext preservando a identidade). As imagens
 * ficam no cofre privado: {uid}/modelo-rosto.png e {uid}/modelo-corpo.png.
 */

const GATEWAY_URL = 'https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/ai-gateway';

export const modeloConsent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ value: z.boolean() }).parse(d))
  .handler(async ({ data: { value }, context: { supabase, userId } }) => {
    const { data: c } = await supabase.from('consents').select('photo_processing,module_permissions').eq('user_id', userId).maybeSingle();
    if (value && !c?.photo_processing) throw new Error('Ative primeiro a permissão geral de fotos em Configurações.');
    const perms = { ...((c?.module_permissions ?? {}) as Record<string, boolean>), personal_model: value };
    const { error } = await supabase.from('consents').update({ module_permissions: perms }).eq('user_id', userId);
    if (error) throw new Error(error.message);
    await supabase.from('audit_events').insert({ user_id: userId, event: value ? 'consent_granted' : 'consent_revoked', meta: { scope: 'personal_model', version: 'modelo-v1' } });
    return { ok: true };
  });

const PROMPTS: Record<'rosto' | 'corpo', string> = {
  rosto: 'Edit this exact photo into a neutral canonical studio portrait of the SAME person: front-facing headshot, relaxed neutral expression, even soft studio lighting, plain light gray background, shoulders up, no makeup changes, no jewelry. PRESERVE the exact face, identity, skin tone, hairline and features. No text, no watermark.',
  corpo: 'Edit this exact photo into a neutral canonical full-body studio image of the SAME person: standing straight, front-facing, arms relaxed at sides, plain light gray background, simple fitted light-gray top and bottoms, even soft lighting. PRESERVE the exact face, identity, body proportions and skin tone. No text, no watermark.',
};

export const gerarModelo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ seedUrl: z.string().url(), tipo: z.enum(['rosto', 'corpo']) }).parse(d))
  .handler(async ({ data }) => {
    const token = getRequest()?.headers?.get('authorization');
    if (!token?.startsWith('Bearer ')) return { ok: false as const, image_url: null, error: 'Entre na sua conta.' };
    try {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ media: 'image', task_id: 'webapp.modelo.render', app: 'webapp', input_refs: [data.seedUrl], params: { prompt: PROMPTS[data.tipo] } }),
      });
      const body = (await res.json().catch(() => ({}))) as { image_url?: string; error?: string };
      if (!res.ok || !body.image_url) {
        const msg = body.error ?? 'Não foi possível gerar o modelo agora.';
        return { ok: false as const, image_url: null, error: /gratuitas|PAYWALL/i.test(msg) ? 'Você já usou sua geração grátis do modelo. O Aura Pass libera mais.' : msg };
      }
      return { ok: true as const, image_url: body.image_url, error: null };
    } catch {
      return { ok: false as const, image_url: null, error: 'O serviço de imagem não respondeu. Tente novamente.' };
    }
  });
