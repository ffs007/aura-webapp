/**
 * NAVEGAÇÃO PRIMÁRIA do Aura ID (decisão do Felipe, 2026-11-17):
 * a barra superior é o ponto de orientação — sempre os mesmos módulos,
 * na mesma ordem, independente de trilhas ou modo.
 *
 * Liberação gradual por FEATURE FLAG: Estética e Profissionais ficam OFF.
 * Para reativar sem mexer em layout: env `VITE_FEATURE_ESTETICA=true`
 * (ou `VITE_FEATURE_PROFISSIONAIS=true`) na Vercel + redeploy.
 * Desligados aparecem como "Em breve" (nunca link quebrado).
 */

const flag = (chave: string, padrao: boolean): boolean => {
  try {
    const v = (import.meta as { env?: Record<string, string | undefined> }).env?.[`VITE_FEATURE_${chave}`];
    return v === undefined ? padrao : v === "true";
  } catch {
    return padrao;
  }
};

export type ItemNav = { id: string; rotulo: string; href: string; icone: string; ativo: boolean; emBreve?: boolean };

/** Atalhos estruturais fixos (o ciclo básico: criar → ver resultado). */
export const ATALHOS: [string, string][] = [
  ["/studio", "Estúdio"],
  ["/dashboard", "Sugestões"],
];

/** Os 4 módulos essenciais — sempre visíveis, ordem fixa, rótulos curtos. */
export const MODULOS: ItemNav[] = [
  { id: "maquiagem", rotulo: "Maquiagem", href: "/maquiagem", icone: "✨", ativo: flag("MAQUIAGEM", true) },
  { id: "roupas", rotulo: "Roupas", href: "/roupas", icone: "👗", ativo: flag("ROUPAS", true) },
  { id: "cabelo", rotulo: "Cabelo", href: "/cabelo", icone: "💇", ativo: flag("CABELO", true) },
  { id: "barba", rotulo: "Barba", href: "/barba", icone: "💈", ativo: flag("BARBA", true) },
];

/** Liberação gradual — OFF por padrão, reativa por env, nunca some do mapa. */
export const MODULOS_GRADUAIS: ItemNav[] = [
  { id: "estetica", rotulo: "Estética", href: "/estetica", icone: "🧘", ativo: flag("ESTETICA", false), emBreve: true },
  { id: "profissionais", rotulo: "Profissionais", href: "/profissionais", icone: "💌", ativo: flag("PROFISSIONAIS", false), emBreve: true },
];

export const modulosNaBarra = () => [...MODULOS, ...MODULOS_GRADUAIS.filter((m) => m.ativo)];
export const emBreve = () => [...MODULOS_GRADUAIS, ...MODULOS].filter((m) => !m.ativo && m.emBreve);

/** Ferramentas e rotas secundárias — agrupadas no "Mais" (overflow controlado). */
export const FERRAMENTAS: [string, string][] = [
  ["/modelo", "👤 Meu Modelo"],
  ["/retrato", "📸 Aura Retrato"],
  ["/tatuagem/vitrine", "🖤 Vitrine de tatuagens"],
  ["/tatuagem", "🖋️ Tatuagens"],
  ["/jornada", "🌱 Jornada"],
  ["/collections", "📚 Coleções"],
  ["/dna", "🧬 DNA Visual"],
  ["/compare", "⚖️ Comparar"],
  ["/export", "📤 Exportar"],
  ["/guia", "🧭 Guia rápido"],
];

/** Densidade visual (largura útil do container) — preferência local do navegador. */
export type Densidade = "compacta" | "confortavel" | "ampla";
export const DENSIDADES: { id: Densidade; rotulo: string; classe: string }[] = [
  { id: "compacta", rotulo: "Compacta", classe: "max-w-6xl" },
  { id: "confortavel", rotulo: "Confortável", classe: "max-w-7xl" },
  { id: "ampla", rotulo: "Ampla", classe: "max-w-[1440px]" },
];
const CHAVE = "aura.densidade";

export function lerDensidade(): Densidade {
  try {
    const d = localStorage.getItem(CHAVE) as Densidade | null;
    if (d && DENSIDADES.some((x) => x.id === d)) return d;
  } catch { /* sem localStorage */ }
  return "ampla"; // padrão: aproveitar a largura, sem sobras laterais
}
export function salvarDensidade(d: Densidade) {
  try { localStorage.setItem(CHAVE, d); } catch { /* só preferência */ }
}
export const classeDensidade = (d: Densidade) => DENSIDADES.find((x) => x.id === d)?.classe ?? "max-w-[1440px]";
