export const OCCASIONS = ["Trabalho", "Faculdade", "Encontro", "Casamento", "Viagem", "Festa", "Entrevista", "Fim de semana", "Reunião importante"] as const;
export const WEATHER = ["Calor", "Ameno", "Frio", "Chuva"] as const;
export const ITEM_CATEGORIES = ["Parte de cima", "Parte de baixo", "Vestido/macacão", "Terceira peça", "Calçado", "Bolsa", "Acessório"] as const;

export const OUTFIT_STATUS: Record<string, string> = { new: "novo", approved: "aprovado", testing: "em teste", failed: "não funcionou", later: "talvez depois", implemented: "já usei" };

export type OutfitPiece = { piece: string; from_wardrobe: boolean; role: string };
export type OutfitVersion = { level: "safe" | "intermediate" | "bold"; summary: string; pieces: OutfitPiece[] };
export type Outfit = {
  title: string; invitation: string; why_it_works: string; occasion: string; formality: number;
  colors: string[]; textures: string[]; proportions: string; shoes: string; bag: string; accessories: string[];
  versions: OutfitVersion[]; weather_variants: { weather: string; change: string }[]; comfort_note: string;
};
export type WardrobeGaps = { summary: string; gaps: { piece: string; why: string; combinations_unlocked: number; priority: "high" | "medium" | "low"; price_brl: string }[]; capsule: { name: string; pieces: string[]; outfits_possible: number; note: string } };
export type ShoppingCheck = { verdict: "buy" | "wait" | "skip"; summary: string; combinations_with_wardrobe: number; similar_owned: string[]; questions: string[]; cost_per_use: string; alternatives: string[] };
export type StyleMissions = { missions: { title: string; description: string; pieces: string[]; reflection: string }[] };

export const VERDICT_LABEL = { buy: "Faz sentido comprar", wait: "Espere um pouco", skip: "Provavelmente não precisa" } as const;
export const CLOTHING_NOTE = "Silhuetas são opções de comunicação e conforto — nunca correção de corpo. Priorizamos o que você já tem antes de qualquer compra.";
