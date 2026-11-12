/**
 * Packs de começo rápido ("comece por aqui").
 *
 * Cada pack é um atalho para uma situação real da vida. Os que apontam para o
 * Estúdio pré-preenchem humor, cartão, ocasião e intensidade; os que apontam
 * para um módulo levam direto ao formulário certo. Nada é gravado: é só um
 * ponto de partida editável.
 */
export type StartPackDestino = "studio" | "maquiagem" | "cabelo" | "roupas" | "tatuagem" | "barba";

export interface StartPack {
  id: string;
  emoji: string;
  title: string;
  description: string;
  destino: StartPackDestino;
  entryMode?: string;
  emotion?: string;
  intensity?: number;
  occasion?: string;
  presentation?: "masculine" | "feminine";
}

export const START_PACKS: StartPack[] = [
  {
    id: "casamento-dia",
    emoji: "💍",
    title: "Casamento de dia",
    description: "Look leve para cerimônia ao ar livre, com conforto para dançar.",
    destino: "studio",
    entryMode: "event",
    emotion: "celebrating",
    intensity: 3,
    occasion: "casamento de dia, ao ar livre",
  },
  {
    id: "entrevista",
    emoji: "💼",
    title: "Entrevista de emprego",
    description: "Presença profissional sem exageros, para causar boa impressão.",
    destino: "studio",
    entryMode: "professional",
    emotion: "gentle",
    intensity: 2,
    occasion: "entrevista de emprego na próxima semana",
  },
  {
    id: "primeira-tatuagem",
    emoji: "🖤",
    title: "Primeira tatuagem discreta",
    description: "Comece pela intenção, veja conceitos e só decida depois.",
    destino: "tatuagem",
  },
  {
    id: "barba-desenhada",
    emoji: "💈",
    title: "Barba desenhada",
    description: "Comprimento, desenho e cuidados no seu ritmo.",
    destino: "barba",
  },
  {
    id: "festa-surpresa",
    emoji: "🎉",
    title: "Festa à noite",
    description: "Algo mais ousado para uma ocasião especial.",
    destino: "studio",
    entryMode: "event",
    emotion: "brave",
    intensity: 4,
    occasion: "festa à noite com amigos",
  },
  {
    id: "mudanca-de-fase",
    emoji: "🌱",
    title: "Mudança de fase",
    description: "Uma evolução gentil para o novo momento da sua vida.",
    destino: "studio",
    entryMode: "general",
    emotion: "curious",
    intensity: 3,
    occasion: "começar uma nova fase pessoal",
  },
  {
    id: "look-trabalho",
    emoji: "🗂️",
    title: "Look de trabalho",
    description: "Combinações práticas que funcionam no dia a dia.",
    destino: "studio",
    entryMode: "professional",
    emotion: "tired",
    intensity: 2,
    occasion: "rotina de trabalho, pouco tempo pela manhã",
  },
  {
    id: "viagem",
    emoji: "✈️",
    title: "Viagem",
    description: "Poucas peças, muitas combinações, clima diferente.",
    destino: "studio",
    entryMode: "clothing",
    emotion: "curious",
    intensity: 2,
    occasion: "viagem de uma semana, clima variado",
  },
  {
    id: "maquiagem-do-dia",
    emoji: "💄",
    title: "Maquiagem do dia",
    description: "Um look rápido e confortável para o seu ritual.",
    destino: "maquiagem",
  },
  {
    id: "cabelo-leve",
    emoji: "💇🏾‍♀️",
    title: "Cabelo mais leve",
    description: "Corte e cor com cuidado com a saúde do fio.",
    destino: "cabelo",
  },
  {
    id: "teste-rapido",
    emoji: "⚡",
    title: "Teste rápido (10 min)",
    description: "Uma mudança pequena para experimentar hoje.",
    destino: "studio",
    entryMode: "quick",
    emotion: "tired",
    intensity: 1,
    occasion: "só 10 minutos antes de sair",
  },
  {
    id: "autoconfianca",
    emoji: "✨",
    title: "Me sentir bem",
    description: "Conforto e autoestima como ponto de partida.",
    destino: "studio",
    entryMode: "general",
    emotion: "gentle",
    intensity: 2,
    occasion: "quero me sentir bem no dia a dia",
  },
];

export function findPack(id: string | undefined | null): StartPack | null {
  if (!id) return null;
  return START_PACKS.find((p) => p.id === id) ?? null;
}

/** Destino real do pack (para links), preservando o id para pré-preencher o Estúdio. */
export function packHref(pack: StartPack): string {
  switch (pack.destino) {
    case "maquiagem": return "/maquiagem/gerar";
    case "cabelo": return "/cabelo/gerar";
    case "roupas": return "/roupas/gerar";
    case "tatuagem": return "/tatuagem/perfil";
    case "barba": return "/barba";
    default: return `/studio?pack=${encodeURIComponent(pack.id)}`;
  }
}
