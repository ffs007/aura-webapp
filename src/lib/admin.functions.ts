import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { interpretarCsvCatalogo } from '@/lib/catalogo-csv';

/**
 * Catálogo Parceiro — CRUD Admin (pós-Onda 1 do PLANO-EXPANSAO).
 * O próprio Felipe gerencia lojas e peças no app, sem entrar no Supabase.
 * Segurança: RLS já restringe escrita a `admin` (has_role); aqui apenas
 * damos erros amigáveis e mantemos as validações de campo.
 */

export type LojaAdmin = {
  id: string; nome: string; site_url: string | null; prioridade: number; ativo: boolean;
  produtos: ProdutoAdmin[];
};

export type ProdutoAdmin = {
  id: string; loja_id: string; titulo: string; descricao: string | null; categoria: string;
  cor: string | null; preco: number; url: string; imagem_url: string | null;
  tags: string[]; prioridade: number; ativo: boolean;
};

/** RLS devolve 42501 para não-admin; traduzimos para algo que a pessoa entenda. */
const traduzErro = (e: { message: string }, fallback: string) =>
  /row-level security/i.test(e.message) ? 'Acesso restrito: só administradores gerenciam o catálogo.' : fallback;

/** Verifica via RPC security definer (mesmo gate do adminStats). */
async function exigirAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (!data) throw new Error('Acesso restrito a administradores.');
}

export const souAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    return { admin: !!data };
  });

export const listarCatalogoAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    const { data: lojas, error } = await supabase
      .from('partner_stores').select('id,nome,site_url,prioridade,ativo,products(id,loja_id,titulo,descricao,categoria,cor,preco,url,imagem_url,tags,prioridade,ativo)')
      .order('nome');
    if (error) throw new Error(traduzErro(error, 'Não foi possível carregar o catálogo.'));
    return (lojas ?? []).map((l) => ({
      id: l.id, nome: l.nome, site_url: l.site_url, prioridade: l.prioridade, ativo: l.ativo,
      produtos: (l.products ?? []).map((p) => ({ ...p, preco: Number(p.preco) }))
        .sort((a, b) => (b.prioridade - a.prioridade) || a.titulo.localeCompare(b.titulo, 'pt-BR')),
    })) satisfies LojaAdmin[];
  });

export const salvarLoja = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(2).max(120),
    site_url: z.string().url().max(300).optional(),
    ativo: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    const campos = { nome: data.nome, site_url: data.site_url ?? null, ativo: data.ativo };
    const res = data.id
      ? await supabase.from('partner_stores').update(campos).eq('id', data.id)
      : await supabase.from('partner_stores').insert(campos);
    if (res.error) throw new Error(traduzErro(res.error, 'Não foi possível salvar a loja.'));
    return { ok: true };
  });

export const excluirLoja = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    const { error } = await supabase.from('partner_stores').delete().eq('id', data.id);
    if (error) throw new Error(traduzErro(error, 'Não foi possível excluir a loja.'));
    return { ok: true };
  });

export const salvarProduto = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    id: z.string().uuid().optional(),
    loja_id: z.string().uuid(),
    titulo: z.string().min(2).max(160),
    descricao: z.string().max(600).optional(),
    categoria: z.string().min(2).max(60),
    cor: z.string().max(40).optional(),
    preco: z.number().positive().max(1000000),
    url: z.string().url().max(500),
    imagem_url: z.string().url().max(500).optional(),
    tags: z.array(z.string().min(1).max(40)).max(12),
    prioridade: z.boolean(),
    ativo: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    const campos = {
      loja_id: data.loja_id, titulo: data.titulo, descricao: data.descricao ?? null,
      categoria: data.categoria.trim().toLowerCase(), cor: data.cor?.trim().toLowerCase() || null,
      preco: data.preco, url: data.url, imagem_url: data.imagem_url ?? null,
      tags: data.tags, prioridade: data.prioridade ? 1 : 0, ativo: data.ativo,
    };
    const res = data.id
      ? await supabase.from('products').update(campos).eq('id', data.id)
      : await supabase.from('products').insert(campos);
    if (res.error) throw new Error(traduzErro(res.error, 'Não foi possível salvar a peça.'));
    return { ok: true };
  });

export const excluirProduto = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    const { error } = await supabase.from('products').delete().eq('id', data.id);
    if (error) throw new Error(traduzErro(error, 'Não foi possível excluir a peça.'));
    return { ok: true };
  });

/**
 * Fatia B4 (v1) — IMPORTAÇÃO EM MASSA: CSV da loja (padrão Google Shopping ou
 * planilha simples) vira peças do catálogo. Pula URLs que já existem na loja.
 */
export const importarCatalogo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    loja_id: z.string().uuid().optional(),
    loja_nova: z.string().min(2).max(120).optional(),
    csv: z.string().min(10).max(2_000_000),
  }).parse(d))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await exigirAdmin(supabase, userId);
    if (!data.loja_id && !data.loja_nova) throw new Error('Escolha uma loja existente ou digite o nome da nova.');
    const r = interpretarCsvCatalogo(data.csv);
    if (!r.pecas.length) throw new Error(r.erros[0] ?? 'Nenhuma peça válida encontrada no CSV.');
    let loja_id = data.loja_id ?? null;
    if (!loja_id) {
      const { data: nova, error } = await supabase.from('partner_stores').insert({ nome: data.loja_nova! }).select('id').single();
      if (error) throw new Error(traduzErro(error, 'Não foi possível criar a loja.'));
      loja_id = (nova as { id: string }).id;
    }
    const { data: existentes, error: errExist } = await supabase.from('products').select('url').eq('loja_id', loja_id).limit(2000);
    if (errExist) throw new Error(traduzErro(errExist, 'Não foi possível conferir as peças existentes.'));
    const jaTem = new Set((existentes ?? []).map((p: { url: string }) => p.url));
    const novas = r.pecas.filter((p) => !jaTem.has(p.url));
    let criadas = 0;
    const falhas: string[] = [];
    for (let i = 0; i < novas.length; i += 100) {
      const lote = novas.slice(i, i + 100).map((p) => ({
        loja_id: loja_id as string, titulo: p.titulo, descricao: p.descricao, categoria: p.categoria,
        cor: p.cor, preco: p.preco, url: p.url, imagem_url: p.imagem_url, tags: p.tags, ativo: p.ativo,
      }));
      const { error } = await supabase.from('products').insert(lote);
      if (error) falhas.push(traduzErro(error, 'Um lote de peças falhou.'));
      else criadas += lote.length;
    }
    return { criadas, puladas: r.pecas.length - novas.length, linhas: r.total, erros: [...r.erros, ...falhas].slice(0, 5) };
  });
