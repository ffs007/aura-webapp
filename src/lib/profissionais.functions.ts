import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Rede de Profissionais — Fatia A1 (PLANO-EXPANSAO): busca por raio a partir de
 * coordenadas (geocodificação de CEP feita no cliente via BrasilAPI), envio do
 * briefing gerado e cadastro do próprio profissional.
 */

export type Profissional = {
  id: string; nome: string; profissao: string; nome_salao: string | null;
  whatsapp: string | null; instagram: string | null; bio: string | null;
  verificado: boolean; distancia_km: number;
};

const PROFISSOES = ['cabeleireira', 'maquiadora', 'tatuadora', 'esteticista', 'barbeiro', 'manicure'] as const;

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const listarProfissionais = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ profissao: z.enum(PROFISSOES).optional(), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), raio_km: z.number().min(1).max(100) }).parse(d))
  .handler(async ({ data, context: { supabase } }) => {
    let q = supabase.from('professionals').select('id,nome,profissao,nome_salao,whatsapp,instagram,bio,verificado,lat,lng').eq('ativo', true);
    if (data.profissao) q = q.eq('profissao', data.profissao);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    const comDistancia = (rows ?? [])
      .map((r) => ({ ...r, distancia_km: Math.round(haversineKm({ lat: data.lat, lng: data.lng }, { lat: r.lat, lng: r.lng }) * 10) / 10 }))
      .filter((r) => r.distancia_km <= data.raio_km)
      .sort((a, b) => a.distancia_km - b.distancia_km)
      .slice(0, 20);
    return comDistancia satisfies Profissional[];
  });

export const enviarBriefing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ professional_id: z.string().uuid(), package_id: z.string().uuid().optional(), modulo: z.string().max(40), titulo: z.string().min(1).max(120), texto: z.string().min(10).max(8000), foto_url: z.string().url().max(2000).optional() }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { data: prof } = await supabase.from('professionals').select('id,ativo').eq('id', data.professional_id).eq('ativo', true).maybeSingle();
    if (!prof) throw new Error('Profissional não encontrado.');
    const { error } = await supabase.from('briefing_sends').insert({ user_id: userId, professional_id: data.professional_id, package_id: data.package_id ?? null, modulo: data.modulo, titulo: data.titulo, texto: data.texto, ...(data.foto_url ? { foto_url: data.foto_url } : {}) });
    if (error) throw new Error('Não foi possível enviar agora. Tente novamente.');
    return { ok: true };
  });

/** Sugestão visual do PROFISSIONAL: a IA aplica o texto dele sobre a foto da cliente. */
export const sugerirComIA = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ briefing_id: z.string().uuid(), texto: z.string().min(5).max(1000) }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { data: envio } = await supabase.from('briefing_sends').select('id,professional_id,foto_url').eq('id', data.briefing_id).maybeSingle();
    if (!envio) throw new Error('Briefing não encontrado.');
    const { data: prof } = await supabase.from('professionals').select('id').eq('id', envio.professional_id).eq('user_id', userId).maybeSingle();
    if (!prof) throw new Error('Este briefing não é seu.');
    if (!envio.foto_url) throw new Error('A cliente não anexou imagem a este briefing.');
    const prompt = `A professional beauty artist is proposing an adjustment on the CLIENT's photo. Apply EXACTLY the professional's suggestion: "${data.texto}". The result must look like the SAME person in the same photo: preserve identity, face, pose, framing, background and lighting; realistic salon-quality outcome; natural skin texture; conservative and achievable; no text or watermark.`;
    const token = getRequest()?.headers?.get('authorization');
    if (!token?.startsWith('Bearer ')) throw new Error('Entre na sua conta.');
    const res = await fetch('https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/ai-gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ media: 'image', task_id: 'webapp.pro.adjust', app: 'webapp', input_refs: [envio.foto_url], params: { prompt } }),
    });
    const body = (await res.json().catch(() => ({}))) as { image_url?: string; error?: string };
    if (!res.ok || !body.image_url) {
      const msg = body.error ?? 'A IA não conseguiu aplicar a sugestão agora.';
      throw new Error(/gratuitas|PAYWALL/i.test(msg) ? 'Seus créditos de sugestão grátis acabaram — o plano profissional libera mais.' : msg);
    }
    const { error } = await supabase.from('briefing_suggestions').insert({ briefing_id: data.briefing_id, professional_user_id: userId, texto: data.texto, image_url: body.image_url });
    if (error) throw new Error('Não foi possível salvar a sugestão.');
    return { ok: true, image_url: body.image_url };
  });

export const meusBriefings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase } }) => {
    const { data, error } = await supabase
      .from('briefing_sends').select('id,titulo,texto,modulo,status,resposta,created_at,professional_id,faz,orcamento_valor,orcamento_prazo').order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    const ids = [...new Set((data ?? []).map((s) => s.professional_id))];
    const profs = ids.length ? await supabase.from('professionals').select('id,nome,nome_salao,whatsapp,instagram').in('id', ids) : { data: [] };
    const mapa = new Map(((profs.data ?? []) as { id: string; nome: string; nome_salao: string | null; whatsapp: string | null; instagram: string | null }[]).map((p) => [p.id, p]));
    const meusIds = (data ?? []).map((s) => s.id);
    const sugestoes = meusIds.length
      ? await supabase.from('briefing_suggestions').select('briefing_id,texto,image_url,created_at').in('briefing_id', meusIds).order('created_at', { ascending: false })
      : { data: [] as { briefing_id: string; texto: string; image_url: string; created_at: string }[] };
    const porBriefing = new Map<string, { texto: string; image_url: string }[]>();
    for (const g of (sugestoes.data ?? []) as { briefing_id: string; texto: string; image_url: string; created_at: string }[]) {
      const lista = porBriefing.get(g.briefing_id) ?? [];
      lista.push({ texto: g.texto, image_url: g.image_url });
      porBriefing.set(g.briefing_id, lista);
    }
    return (data ?? []).map((s) => ({ ...s, profissional: mapa.get(s.professional_id) ?? null, sugestoes: porBriefing.get(s.id) ?? [] }));
  });

export type BriefingRecebido = {
  id: string; titulo: string; texto: string; modulo: string | null;
  created_at: string; status: string; faz: boolean | null; foto_url: string | null;
  orcamento_valor: number | null; orcamento_prazo: string | null; resposta: string | null;
  sugestoes: { texto: string; image_url: string }[];
};

/** Painel do profissional: briefings recebidos pelos perfis dele. */
export const briefingsRecebidos = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const { data: profs } = await supabase.from('professionals').select('id').eq('user_id', userId);
    const ids = (profs ?? []).map((p: { id: string }) => p.id);
    if (!ids.length) return [] as BriefingRecebido[];
    const { data, error } = await supabase
      .from('briefing_sends').select('id,titulo,texto,modulo,created_at,status,faz,foto_url,orcamento_valor,orcamento_prazo,resposta')
      .in('professional_id', ids).order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    const meusIds = (data ?? []).map((s) => s.id);
    const sugestoes = meusIds.length
      ? await supabase.from('briefing_suggestions').select('briefing_id,texto,image_url').in('briefing_id', meusIds).order('created_at', { ascending: false })
      : { data: [] as { briefing_id: string; texto: string; image_url: string }[] };
    const porBriefing = new Map<string, { texto: string; image_url: string }[]>();
    for (const g of (sugestoes.data ?? []) as { briefing_id: string; texto: string; image_url: string }[]) {
      const lista = porBriefing.get(g.briefing_id) ?? [];
      lista.push({ texto: g.texto, image_url: g.image_url });
      porBriefing.set(g.briefing_id, lista);
    }
    return (data ?? []).map((s) => ({ ...s, orcamento_valor: s.orcamento_valor === null ? null : Number(s.orcamento_valor), sugestoes: porBriefing.get(s.id) ?? [] })) as BriefingRecebido[];
  });

export const responderBriefing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    id: z.string().uuid(),
    faz: z.boolean(),
    valor: z.number().min(0).max(100000).optional(),
    prazo: z.string().max(80).optional(),
    resposta: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { data: envio } = await supabase.from('briefing_sends').select('id,professional_id').eq('id', data.id).maybeSingle();
    if (!envio) throw new Error('Briefing não encontrado.');
    const { data: prof } = await supabase.from('professionals').select('id').eq('id', envio.professional_id).eq('user_id', userId).maybeSingle();
    if (!prof) throw new Error('Este briefing não é seu.');
    if (data.faz && (data.valor === undefined || data.valor <= 0)) throw new Error('Para orçar, informe o valor.');
    const { error } = await supabase.from('briefing_sends').update({
      faz: data.faz,
      orcamento_valor: data.faz && data.valor !== undefined ? data.valor : null,
      orcamento_prazo: data.faz && data.prazo ? data.prazo : null,
      resposta: data.resposta ? data.resposta : null,
      status: data.faz ? 'orcado' : 'recusado',
    }).eq('id', data.id);
    if (error) throw new Error('Não foi possível salvar a resposta.');
    return { ok: true };
  });

/** Slug público da micropágina /p/{slug} — a-z0-9 e hífen, sem acentos. */
const gerarSlug = (nome: string) =>
  nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const salvarProfissional = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    nome: z.string().min(2).max(120), profissao: z.enum(PROFISSOES), nome_salao: z.string().max(120).optional(),
    cep: z.string().regex(/^\d{8}$/), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
    raio_atendimento_km: z.number().int().min(1).max(100).default(25), whatsapp: z.string().max(20).optional(), instagram: z.string().max(60).optional(), bio: z.string().max(600).optional(),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { error } = await supabase.from('professionals').upsert({
      user_id: userId,
      nome: data.nome,
      profissao: data.profissao,
      nome_salao: data.nome_salao ?? null,
      cep: data.cep,
      lat: data.lat,
      lng: data.lng,
      raio_atendimento_km: data.raio_atendimento_km,
      whatsapp: data.whatsapp ?? null,
      instagram: data.instagram ?? null,
      bio: data.bio ?? null,
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
    // Micropágina: garante slug único (duplicidade recebe sufixo -2, -3…).
    const { data: row } = await supabase.from('professionals').select('id,slug').eq('user_id', userId).maybeSingle();
    let slug = row?.slug ?? null;
    if (row && !slug) {
      const base = gerarSlug(data.nome) || 'profissional';
      for (let i = 0; i < 6 && !slug; i++) {
        const tentativa = i === 0 ? base : `${base}-${i + 1}`;
        const { error: errSlug } = await supabase.from('professionals').update({ slug: tentativa }).eq('id', row.id);
        if (!errSlug) slug = tentativa;
        else if (!/duplicate|unique/i.test(errSlug.message)) throw new Error('Não foi possível salvar o perfil.');
      }
    }
    return { ok: true, slug };
  });

export type PerfilProfissional = {
  nome: string; profissao: string; nome_salao: string | null;
  whatsapp: string | null; instagram: string | null; bio: string | null; verificado: boolean; slug: string;
};

/** Micropágina pública /p/{slug} — SEM login (RLS expõe apenas profissionais ativos). */
export const perfilProfissional = createServerFn({ method: 'POST' })
  .validator((d) => z.object({ slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/) }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'], chave = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !chave) throw new Error('Configuração indisponível agora.');
    const anon = createClient<Database>(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: p } = await anon.from('professionals')
      .select('nome,profissao,nome_salao,whatsapp,instagram,bio,verificado,slug')
      .eq('slug', data.slug).eq('ativo', true).maybeSingle();
    return (p ?? null) as PerfilProfissional | null;
  });
