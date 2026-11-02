import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Fatia D1 (PLANO-EXPANSAO) — VITRINE DO ESTÚDIO DE TATUAGEM.
 * A tatuadora publica designs; a cliente vê e (em D2) testa no próprio corpo.
 * `destaque` = patrocínio, ordena primeiro (Premissa 2).
 */

export type DesignVitrine = {
  id: string; titulo: string; imagem_url: string; estilo: string | null;
  tamanho: string | null; local_sugerido: string | null; descricao: string | null;
  destaque: number; ativo: boolean; professional_id: string;
  estudio: string | null; slug: string | null; verificado: boolean;
};

export type MeuDesign = DesignVitrine & { created_at: string };

export const ESTILOS_VITRINE = ['fine line', 'minimalista', 'tradicional', 'neo tradicional', 'realista', 'blackwork', 'aquarela', 'lettering'] as const;

export const listarVitrine = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ estilo: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data, context: { supabase } }) => {
    let q = supabase.from('tattoo_designs')
      .select('id,titulo,imagem_url,estilo,tamanho,local_sugerido,descricao,destaque,ativo,professional_id,professionals(nome,slug,verificado)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60);
    if (data.estilo) q = q.eq('estilo', data.estilo);
    const { data: rows, error } = await q;
    if (error) throw new Error('Não foi possível carregar a vitrine agora.');
    return (rows ?? []).map((d) => {
      const prof = d.professionals as { nome: string; slug: string | null; verificado: boolean } | null;
      return {
        id: d.id, titulo: d.titulo, imagem_url: d.imagem_url, estilo: d.estilo, tamanho: d.tamanho,
        local_sugerido: d.local_sugerido, descricao: d.descricao, destaque: d.destaque, ativo: d.ativo,
        professional_id: d.professional_id, estudio: prof?.nome ?? null, slug: prof?.slug ?? null, verificado: prof?.verificado ?? false,
      };
    }) satisfies DesignVitrine[];
  });

export const meusDesigns = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const { data: profs } = await supabase.from('professionals').select('id').eq('user_id', userId);
    const ids = (profs ?? []).map((p: { id: string }) => p.id);
    if (!ids.length) return [] as MeuDesign[];
    const { data: rows, error } = await supabase.from('tattoo_designs')
      .select('id,titulo,imagem_url,estilo,tamanho,local_sugerido,descricao,destaque,ativo,professional_id,created_at')
      .in('professional_id', ids).order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error('Não foi possível carregar seus designs.');
    return (rows ?? []).map((d) => ({ ...d, estudio: null, slug: null, verificado: false })) as MeuDesign[];
  });

export const publicarDesign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    id: z.string().uuid().optional(),
    titulo: z.string().min(2).max(120),
    estilo: z.string().max(40).optional(),
    tamanho: z.string().max(40).optional(),
    local_sugerido: z.string().max(60).optional(),
    descricao: z.string().max(400).optional(),
    imagem_url: z.string().url().max(500),
    ativo: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    const { data: prof } = await supabase.from('professionals').select('id,profissao').eq('user_id', userId).maybeSingle();
    if (!prof) throw new Error('Cadastre seu perfil de profissional primeiro (aba "Sou profissional").');
    if (prof.profissao !== 'tatuadora') throw new Error('A vitrine é exclusiva de tatuadoras(os) — cadastre-se com a profissão certa.');
    const campos = {
      professional_id: prof.id, titulo: data.titulo.trim(), imagem_url: data.imagem_url,
      estilo: data.estilo?.trim() || null, tamanho: data.tamanho?.trim() || null,
      local_sugerido: data.local_sugerido?.trim() || null, descricao: data.descricao?.trim() || null, ativo: data.ativo,
    };
    const res = data.id
      ? await supabase.from('tattoo_designs').update(campos).eq('id', data.id)
      : await supabase.from('tattoo_designs').insert(campos);
    if (res.error) throw new Error(/row-level security/i.test(res.error.message) ? 'Só o próprio estúdio publica na vitrine.' : 'Não foi possível salvar o design.');
    return { ok: true };
  });

export const excluirDesign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: { supabase } }) => {
    const { error } = await supabase.from('tattoo_designs').delete().eq('id', data.id);
    if (error) throw new Error('Não foi possível excluir o design.');
    return { ok: true };
  });
