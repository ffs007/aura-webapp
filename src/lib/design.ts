/**
 * Tokens visuais compartilhados — a "gramática" de superfícies, tipografia e
 * espaçamento do Aura ID.
 *
 * Regra geral: nenhuma tela inventa tamanho de título ou cartão por conta
 * própria. Use os componentes de `@/components/estados` (que já aplicam estes
 * tokens) e, quando precisar de um `Link` ou `section`, use as constantes
 * abaixo. Assim a mesma coisa parece a mesma coisa em todas as telas.
 */

/** Superfície padrão: cartão de conteúdo com respiro confortável. */
export const CARTAO = "rounded-2xl border bg-card p-6";

/** Superfície compacta: listas, itens e blocos secundários. */
export const CARTAO_COMPACTO = "rounded-2xl border bg-card p-5";

/** Cartão que inteiro é um link (sugestões, looks, planos). */
export const CARTAO_CLICAVEL = `${CARTAO} block transition hover:shadow-soft`;

/** Bloco de destaque suave (convite, dica, próximo passo). */
export const CARTAO_DESTAQUE = "rounded-2xl border border-accent/40 bg-accent/5 p-5";

/** Área neutra para conteúdo desligado, pausado ou informativo. */
export const CARTAO_NEUTRO = "rounded-2xl border bg-secondary p-6";

/** Título de página (h1) — sempre dentro de `CabecalhoPagina`. */
export const TITULO_PAGINA = "text-4xl md:text-5xl";

/** Título de seção (h2) dentro de uma página. */
export const TITULO_SECAO = "text-3xl";

/** Título de item/cartão (h2 ou h3). */
export const TITULO_ITEM = "text-2xl";

/** Texto auxiliar de metadados (datas, status, contagens). */
export const META = "text-xs text-muted-foreground";

/** Rótulo em caixa alta de categoria (ex.: "CUSTO", "DNA"). */
export const ROTULO_CATEGORIA = "text-xs uppercase tracking-widest text-accent";

/** Grade de cartões usada na maioria das listas. */
export const GRADE_CARTOES = "grid gap-4 md:grid-cols-2";

/** Pilha vertical padrão entre blocos de uma página. */
export const PILHA_PAGINA = "space-y-8";

/**
 * Anel de foco visível para controles que não usam o componente `Button`
 * (chips, filtros, botões de emoção). Teclado precisa enxergar onde está.
 */
export const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
