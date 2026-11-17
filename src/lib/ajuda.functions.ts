import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { callJson } from '@/lib/ai.server';

/**
 * Prompt 1 do ROI (PLANO-ROI-PROMPTS): assistente-guia conversacional.
 * O usuário digita o que quer em linguagem natural; a IA escolhe a rota
 * certa do app e escreve uma frase amigável explicando o caminho.
 */

const ROTAS: [string, string][] = [
  ['/studio', 'Ponto de partida geral: humor + o que explorar (maquiagem, cabelo, roupas, tatuagem, barba)'],
  ['/studio?pack=casamento-dia', 'Preparação para casamento/evento de dia'],
  ['/studio?pack=entrevista', 'Preparação para entrevista de emprego'],
  ['/studio?pack=festa-surpresa', 'Festa, aniversário, ocasião especial à noite'],
  ['/studio?pack=mudanca-de-fase', 'Nova fase da vida, recomeço, transformação geral'],
  ['/cabelo/gerar', 'Mudança de corte, cor ou finalização de cabelo'],
  ['/maquiagem/gerar', 'Criar look de maquiagem (do dia, noite, evento)'],
  ['/barba', 'Barba: desenho, comprimento, provar estilos, briefing pro barbeiro'],
  ['/tatuagem/perfil', 'Planejar tatuagem: intenção, conceitos, decisão'],
  ['/tatuagem/vitrine', 'Ver designs de tatuagem publicados por estúdios e testar no corpo'],
  ['/retrato', 'Editar uma foto própria: mudar maquiagem, cabelo, roupa na sua foto'],
  ['/modelo', 'Criar Meu Modelo: as duas fotos-base que fazem toda simulação sair com a sua cara'],
  ['/collections', 'Ver coleções salvas e looks guardados'],
  ['/guia', 'Guia rápido: os 5 passos para dominar o app'],
];

export type AjudaRota = { rota: string; explicacao: string };

export const interpretarAjuda = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ texto: z.string().min(3).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const rotas = ROTAS.map(([href, desc]) => `- ${href} — ${desc}`).join('\n');
    const sys = `Você é o assistente de navegação do Aura ID (app de identidade visual com IA, PT-BR). A usuária descreveu o que quer. Escolha a MELHOR rota da lista abaixo e escreva UMA frase amigável (máx 20 palavras) explicando por que ali é o lugar certo. Se nada encaixar bem, sugira /studio como ponto de partida. Rotas disponíveis:\n${rotas}\n\nResponda APENAS JSON: {"rota": "href_da_rota", "explicacao": "frase amigável"}. A explicação deve começar com um verbo de ação (ex.: "Vou te levar ao...").`;
    const schema = {
      type: 'object',
      additionalProperties: false,
      required: ['rota', 'explicacao'],
      properties: {
        rota: { type: 'string', enum: ROTAS.map(([href]) => href) },
        explicacao: { type: 'string' },
      },
    };
    const r = await callJson<AjudaRota>(sys, data.texto, schema, 'ajuda_guia');
    if (!r.ok) return { rota: '/studio', explicacao: 'Vou te levar ao Estúdio — lá você escolhe o que explorar.' };
    return r.data;
  });
