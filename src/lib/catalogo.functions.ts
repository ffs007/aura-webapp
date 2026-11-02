import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Guarda-Roupa Real — Fatia B2 (PLANO-EXPANSAO): peças do catálogo parceiro
 * que combinam com o look gerado. Matching em JS sobre o catálogo ativo
* (pequeno por natureza no MVP); patrocinados (prioridade) vêm primeiro — Premissa 2.
 */

export type PecaCasada = {
  id: string; titulo: string; loja: string; preco: number; url: string;
  imagem_url: string | null; patrocinado: boolean;
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const buscarPecas = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ texto: z.string().min(3).max(1500) }).parse(d))
  .handler(async ({ data, context: { supabase } }) => {
    const { data: rows, error } = await supabase
      .from('products').select('id,titulo,categoria,cor,preco,url,imagem_url,tags,prioridade,partner_stores(nome)')
      .eq('ativo', true).limit(300);
    if (error) throw new Error('Não foi possível buscar o catálogo agora.');
    const alvo = norm(data.texto);
    const pontuar = (p: (typeof rows)[number]) => {
      let score = 0;
      if (alvo.includes(norm(p.categoria ?? '')) && p.categoria) score += 3;
      if (p.cor && alvo.includes(norm(p.cor))) score += 3;
      for (const t of p.tags ?? []) if (t && alvo.includes(norm(t))) score += 2;
      return score;
    };
    return (rows ?? [])
      .map((p) => ({
        id: p.id, titulo: p.titulo, loja: (p.partner_stores as { nome: string } | null)?.nome ?? 'Loja parceira',
        preco: Number(p.preco), url: p.url, imagem_url: p.imagem_url, patrocinado: (p.prioridade ?? 0) > 0,
        _s: pontuar(p), _p: p.prioridade ?? 0,
      }))
      .sort((a, b) => (b._p - a._p) || (b._s - a._s))
      .slice(0, 8)
      .map(({ _s, _p, ...resto }) => resto) as PecaCasada[];
  });

export type ProvaPeca = { image_url: string; peca: { titulo: string; loja: string; preco: number; url: string } };

/**
 * Fatia B3 — PROVADOR VIRTUAL: gera a cliente vestindo a peça REAL do catálogo
 * (modelo dedicado pessoa+peça no gateway; sem imagem da peça, edição Kontext com a descrição).
 * Premissa 2: a loja vê o produto dela no corpo da cliente — é o espaço que ela paga para ocupar.
 */
export const provarPeca = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ peca_id: z.string().uuid(), foto_path: z.string().min(5).max(300) }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    if (!data.foto_path.startsWith(`${userId}/`)) throw new Error('Use uma foto sua como base.');
    const { data: peca } = await supabase
      .from('products').select('id,titulo,descricao,categoria,cor,preco,url,imagem_url,partner_stores(nome)')
      .eq('id', data.peca_id).eq('ativo', true).maybeSingle();
    if (!peca) throw new Error('Peça não encontrada no catálogo.');
    const s = await supabase.storage.from('user-photos').createSignedUrl(data.foto_path, 600);
    const fotoUrl = s.data?.signedUrl;
    if (!fotoUrl) throw new Error('Não consegui acessar sua foto base. Gere o visual primeiro.');
    const loja = (peca.partner_stores as { nome: string } | null)?.nome ?? 'Loja parceira';
    const descricao = [peca.titulo, peca.descricao, peca.cor ? `cor ${peca.cor}` : null, peca.categoria].filter(Boolean).join('. ');
    const prompt = `Virtual try-on: the SAME person in the photo wearing exactly this real store garment: ${descricao}. Preserve identity, face, hair, pose, framing, background and lighting; realistic fabric drape and fit on the body; natural skin texture; no text or watermark.`;
    const token = getRequest()?.headers?.get('authorization');
    if (!token?.startsWith('Bearer ')) throw new Error('Entre na sua conta.');
    const res = await fetch('https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/ai-gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ media: 'image', task_id: 'webapp.tryon.render', app: 'webapp', input_refs: [fotoUrl], params: { prompt, ...(peca.imagem_url ? { peca_imagem: peca.imagem_url } : {}) } }),
    });
    const body = (await res.json().catch(() => ({}))) as { image_url?: string; error?: string };
    if (!res.ok || !body.image_url) {
      const msg = body.error ?? 'Não foi possível provar a peça agora.';
      throw new Error(/gratuitas|PAYWALL/i.test(msg) ? 'Suas provas grátis acabaram — o Aura Pass libera mais.' : msg);
    }
    return { image_url: body.image_url, peca: { titulo: peca.titulo, loja, preco: Number(peca.preco), url: peca.url } } satisfies ProvaPeca;
  });
