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

/** Distância de edição (Levenshtein). Tokens são curtos, então sem corte agressivo. */
function distanciaEdicao(a: string, b: string, limite: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min((anterior[j] ?? 0) + 1, (atual[j - 1] ?? 0) + 1, (anterior[j - 1] ?? 0) + custo);
    }
    anterior = atual;
  }
  return anterior[b.length] ?? limite + 1;
}

/** Quantos erros de digitação aceitamos num termo: 0 em termos curtos, 2 nos longos. */
function tolerancia(termo: string): number {
  if (termo.length >= 8) return 2;
  if (termo.length >= 4) return 1;
  return 0;
}

/**
 * Compara um token do texto com o termo aceitando prefixo e pequeno erro de
 * digitação ("maquigem" acha "maquiagem"; "vestidoo" acha "vestido").
 */
function tokenParecido(token: string, termo: string): boolean {
  if (token.includes(termo)) return true;
  if (token.length >= 3 && termo.includes(token)) return true;
  const limite = tolerancia(termo);
  if (limite === 0) return false;
  return distanciaEdicao(token, termo, limite) <= limite;
}

/** Separa em tokens normalizados (letras/números), descartando pontuação. */
function tokens(texto: string): string[] {
  return texto.split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * O texto contém o termo (os dois normalizados)? Termo vazio corresponde a
 * qualquer texto — quem filtra com a busca em branco vê a lista inteira.
 *
 * Aceita múltiplas palavras (todas precisam aparecer, em qualquer ordem) e
 * tolera erro de digitação leve, para a busca "quase certa" funcionar.
 */
export function corresponde(texto: string, termo: string): boolean {
  const alvo = normalizarBusca(texto);
  const procurado = normalizarBusca(termo);
  if (!procurado) return true;
  if (alvo.includes(procurado)) return true;
  const doAlvo = tokens(alvo);
  return tokens(procurado).every((t) => doAlvo.some((token) => tokenParecido(token, t)));
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
    campos(item).some((campo) => typeof campo === "string" && corresponde(campo, procurado)),
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
