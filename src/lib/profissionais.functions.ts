import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
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
  .validator((d) => z.object({ professional_id: z.string().uuid(), package_id: z.string().uuid().optional(), modulo: z.string().max(40), titulo: z.string().min(1).max(120), texto: z.string().min(10).max(8000) }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { data: prof } = await supabase.from('professionals').select('id,ativo').eq('id', data.professional_id).eq('ativo', true).maybeSingle();
    if (!prof) throw new Error('Profissional não encontrado.');
    const { error } = await supabase.from('briefing_sends').insert({ user_id: userId, professional_id: data.professional_id, package_id: data.package_id ?? null, modulo: data.modulo, titulo: data.titulo, texto: data.texto });
    if (error) throw new Error('Não foi possível enviar agora. Tente novamente.');
    return { ok: true };
  });

export const meusBriefings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase } }) => {
    const { data, error } = await supabase
      .from('briefing_sends').select('id,titulo,texto,modulo,status,resposta,created_at,professional_id').order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    const ids = [...new Set((data ?? []).map((s) => s.professional_id))];
    const profs = ids.length ? await supabase.from('professionals').select('id,nome,nome_salao,whatsapp,instagram').in('id', ids) : { data: [] };
    const mapa = new Map(((profs.data ?? []) as { id: string; nome: string; nome_salao: string | null; whatsapp: string | null; instagram: string | null }[]).map((p) => [p.id, p]));
    return (data ?? []).map((s) => ({ ...s, profissional: mapa.get(s.professional_id) ?? null }));
  });

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
    return { ok: true };
  });
