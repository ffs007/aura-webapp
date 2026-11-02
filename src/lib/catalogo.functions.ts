import { createServerFn } from '@tanstack/react-start';
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
