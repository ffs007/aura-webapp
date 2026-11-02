/**
 * Trilhas do Aura ID (webapp) — mesma lógica do app mobile (D1, 2026-10-22):
 * composição 100% feminina, 3 trilhas de 2-3 módulos, usuário escolhe 1-3 e a
 * navegação esconde o resto. Barba permanece acessível por URL, mas fora do nav.
 */

export type TrilhaKey = "visual" | "cabelo" | "estilo";

export interface TrilhaDef {
  key: TrilhaKey;
  label: string;
  icon: string;
  tagline: string;
  links: [string, string][]; // [to, label] exibidos quando a trilha está ativa
}

export const TRILHAS: Record<TrilhaKey, TrilhaDef> = {
  visual: {
    key: "visual",
    label: "Visual",
    icon: "✨",
    tagline: "Maquiagem que combina com você e coleções suas",
    links: [
      ["/maquiagem", "Maquiagem"],
      ["/collections", "Coleções"],
    ],
  },
  cabelo: {
    key: "cabelo",
    label: "Cabelo",
    icon: "💇🏾‍♀️",
    tagline: "Cortes, cor e planos de transição",
    links: [["/cabelo", "Cabelo"]],
  },
  estilo: {
    key: "estilo",
    label: "Estilo",
    icon: "👗",
    tagline: "Roupas, tatuagens e planos de transformação",
    links: [
      ["/roupas", "Roupas"],
      ["/tatuagem", "Tatuagens"],
      ["/tatuagem/vitrine", "Vitrine"],
      ["/jornada", "Jornada"],
    ],
  },
};

export const TODAS_TRILHAS: TrilhaKey[] = ["visual", "cabelo", "estilo"];

const STORAGE_KEY = "aura.trilhas";

export function lerTrilhas(): TrilhaKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as TrilhaKey[]) : null;
    if (Array.isArray(parsed) && parsed.length && parsed.every((t) => TODAS_TRILHAS.includes(t))) return parsed;
  } catch {
    // localStorage indisponível: comporta-se como primeira visita
  }
  return [];
}

export function salvarTrilhas(trilhas: TrilhaKey[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trilhas));
    window.dispatchEvent(new CustomEvent("aura:trilhas"));
  } catch {
    // sem persistência: escolha vale só para a sessão atual do componente
  }
}

/** Links fixos, independem de trilha. Barba fica fora (composição feminina, decisão D1). */
export const LINKS_FIXOS: [string, string][] = [
  ["/studio", "Estúdio"],
  ["/dashboard", "Sugestões"],
  ["/dna", "DNA Visual"],
  ["/compare", "Comparar"],
  ["/export", "Exportar"],
  ["/settings", "Configurações"],
];

export function linksVisiveis(trilhas: TrilhaKey[]): [string, string][] {
  const extras = trilhas.flatMap((t) => TRILHAS[t].links);
  return [...LINKS_FIXOS.slice(0, 2), ...extras, ...LINKS_FIXOS.slice(2)];
}
