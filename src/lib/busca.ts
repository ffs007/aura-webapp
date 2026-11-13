/**
 * Helpers puros da busca global (⌘K) — sem React e sem Supabase, para poder
 * testar normalização, correspondência e limites sem montar o diálogo.
 */

/** Item exibido numa seção da busca (páginas, coleções, lembretes…). */
export type ItemBusca = {
  id: string;
  titulo: string;
  descricao?: string;
  /** Título da seção a que pertence (ex.: "Coleções", "Lembretes"). */
  grupo: string;
  /** Caminho para onde navegar ao selecionar. */
  rota: string;
};

/**
 * Deixa o texto comparável: remove acentos/diacríticos, passa para minúsculas
 * e apara as pontas. "  Estética  " vira "estetica".
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * O texto contém o termo (os dois normalizados)? Termo vazio corresponde a
 * qualquer texto — quem filtra com a busca em branco vê a lista inteira.
 */
export function corresponde(texto: string, termo: string): boolean {
  const alvo = normalizarBusca(texto);
  const procurado = normalizarBusca(termo);
  if (!procurado) return true;
  return alvo.includes(procurado);
}

/**
 * Mantém os itens em que pelo menos um dos campos informados corresponde ao
 * termo. Aceita vários campos por item (título, descrição, nome da
 * profissional…) e devolve uma lista nova, sem mutar a original.
 */
export function filtrarPorTermo<T>(
  itens: readonly T[],
  termo: string,
  campos: (item: T) => readonly (string | null | undefined)[],
): T[] {
  const procurado = normalizarBusca(termo);
  if (!procurado) return [...itens];
  return itens.filter((item) =>
    campos(item).some((campo) => typeof campo === "string" && normalizarBusca(campo).includes(procurado)),
  );
}

/**
 * Corta a lista no limite pedido. Um limite inválido/negativo devolve lista
 * vazia; um limite maior que a lista devolve a lista inteira.
 */
export function limitar<T>(itens: readonly T[], n: number): T[] {
  if (!Number.isFinite(n) || n <= 0) return [];
  return itens.slice(0, Math.trunc(n));
}
