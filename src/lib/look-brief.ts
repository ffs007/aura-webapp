import { z } from "zod";

/**
 * Brief de look (roupas / maquiagem / cabelo) — interpretação do pedido em
 * atributos visuais obrigatórios, confirmados pela usuária antes de gerar.
 *
 * Correção 2026-11-15: os limites anteriores (10 atributos, valor ≤160) faziam
 * o `safeParse` reprovar pedidos legítimos — medido em 9 de 21 combinações
 * pacote×nível — e a tela mostrava "Não consegui entender o pedido com
 * segurança", que parece bloqueio de conteúdo mas era falha de validação.
 * Agora os limites são generosos e, na dúvida, o JSON é coagido/truncado (ver
 * `normalizarLookBrief`) em vez de descartado.
 */
export const lookBriefSchema = z.object({
  kind: z.enum(["outfit", "makeup_look", "hair_plan"]),
  /** Objetivo visual em uma frase — é o que o modelo de imagem deve perseguir. */
  resumo: z.string().max(400).default(""),
  atributos: z
    .array(z.object({ rotulo: z.string().min(1).max(80), valor: z.string().min(1).max(600) }))
    .max(40),
  ajuste_usuario: z.string().max(600).default(""),
  duvidas: z.array(z.string().max(200)).max(3).default([]),
});
export type LookBrief = z.infer<typeof lookBriefSchema>;
export type LookKind = LookBrief["kind"];

/** Esquema enviado ao modelo (structured output) — um pouco menor que o aceito na entrada. */
export const lookSchemaJson = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "resumo", "atributos", "ajuste_usuario", "duvidas"],
  properties: {
    kind: { type: "string", enum: ["outfit", "makeup_look", "hair_plan"] },
    resumo: { type: "string" },
    atributos: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rotulo", "valor"],
        properties: { rotulo: { type: "string" }, valor: { type: "string" } },
      },
    },
    ajuste_usuario: { type: "string" },
    duvidas: { type: "array", maxItems: 3, items: { type: "string" } },
  },
} as const;

/** Coage qualquer valor a texto curto e limpo (números são aceitos). */
function texto(bruto: unknown, max: number): string {
  if (typeof bruto === "number" && Number.isFinite(bruto)) return String(bruto).slice(0, max);
  if (typeof bruto !== "string") return "";
  return bruto.replace(/\s+/g, " ").trim().slice(0, max);
}

function listaDeTexto(bruto: unknown, maxItem: number, maxItens: number): string[] {
  if (!Array.isArray(bruto)) return [];
  return bruto
    .map((x) => (typeof x === "object" && x !== null ? texto((x as Record<string, unknown>)["valor"] ?? "", maxItem) : texto(x, maxItem)))
    .filter(Boolean)
    .slice(0, maxItens);
}

/**
 * Converte o JSON da IA em um brief utilizável, sem reprovar por excesso de
 * detalhe: filtra entradas vazias, apara tamanhos e mantém a ordem (que define
 * prioridade no prompt). Devolve `null` só quando não sobrou nenhum atributo —
 * nesse caso a chamada usa `briefDeReserva` com os dados do próprio pacote.
 */
export function normalizarLookBrief(bruto: unknown, kind: LookKind): LookBrief | null {
  if (!bruto || typeof bruto !== "object") return null;
  const d = bruto as Record<string, unknown>;
  const vistos = new Set<string>();
  const atributos: { rotulo: string; valor: string }[] = [];
  if (Array.isArray(d["atributos"])) {
    for (const item of d["atributos"]) {
      if (!item || typeof item !== "object") continue;
      const a = item as Record<string, unknown>;
      // `nome`/`campo` cobrem variações comuns do modelo quando ele troca o rótulo.
      const rotulo = texto(a["rotulo"] ?? a["nome"] ?? a["campo"], 80);
      const valor = texto(a["valor"] ?? a["valor_obrigatorio"] ?? a["descricao"], 600);
      if (!rotulo || !valor) continue;
      const chave = rotulo.toLowerCase();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      atributos.push({ rotulo, valor });
      if (atributos.length >= 40) break;
    }
  }
  const duvidas = listaDeTexto(d["duvidas"], 200, 3);
  const ajuste = texto(d["ajuste_usuario"] ?? d["ajuste"], 600);
  const resumo = texto(d["resumo"] ?? d["summary"] ?? d["objetivo"], 400);
  if (!atributos.length) return null;
  return { kind, resumo, atributos, ajuste_usuario: ajuste, duvidas };
}

/**
 * Brief determinístico a partir da própria opção do pacote — rede de segurança
 * quando a IA não devolveu JSON aproveitável. A geração nunca fica sem
 * especificação: os dados já estão no pacote e são do mesmo pedido.
 */
export function briefDeReserva(opcao: Record<string, unknown>, kind: LookKind): LookBrief | null {
  const atributos: { rotulo: string; valor: string }[] = [];
  const empurrar = (rotulo: string, valor: string) => {
    if (valor && !atributos.some((a) => a.rotulo === rotulo)) atributos.push({ rotulo, valor });
  };
  const lista = (bruto: unknown, maxItem: number) =>
    Array.isArray(bruto) ? bruto.map((x) => texto(x, maxItem)).filter(Boolean).join("; ") : "";

  empurrar("resumo do pedido", texto(opcao["summary"] ?? opcao["description"] ?? opcao["title"], 600));
  empurrar("pecas", lista(opcao["pieces"], 120));
  empurrar("produtos", lista(opcao["products"], 120));
  empurrar("corte", texto(opcao["cut"], 200));
  empurrar("cor", texto(opcao["color"], 200));
  empurrar("mensagem visual", texto(opcao["visual_message"], 400));
  empurrar("execucao", lista(opcao["steps"], 200));
  empurrar("acessorios", lista(opcao["accessories"], 80).slice(0, 600));
  if (!atributos.length) return null;
  return {
    kind,
    resumo: texto(opcao["summary"] ?? opcao["description"] ?? opcao["title"], 400),
    atributos: atributos.slice(0, 12),
    ajuste_usuario: "",
    duvidas: [],
  };
}

/**
 * Prompt do look para o modelo de imagem.
 *
 * `ancorada` (15/11/2026): quando existe foto-base (Meu Modelo ou foto enviada),
 * a geração é uma EDIÇÃO dessa foto. Antes o prompt era de "geração" (fotografia
 * de pessoa fictícia) mesmo com base anexada, e o provedor devolvia praticamente
 * a mesma foto — medido: três gerações diferentes com diferença de ~3% entre si e
 * ~8% do modelo, sem a maquiagem aplicada. Com o prompt de edição + objetivo
 * visual, a mudança aparece na imagem.
 */
const FRAMINGS: Record<string, string> = {
  outfit: "Fotografia editorial realista de corpo inteiro de pessoa adulta fictícia.",
  makeup_look: "Fotografia editorial realista de rosto e ombros de pessoa adulta fictícia, textura de pele natural visível.",
  hair_plan: "Fotografia editorial realista de rosto e ombros de pessoa adulta fictícia, cabelo como elemento principal.",
};
const FRAMING_OUTFIT = FRAMINGS["outfit"];

/** Ação de edição conforme o tipo de look (o modelo precisa saber O QUE trocar). */
function acaoDaEdicao(kind: LookKind): string {
  if (kind === "outfit") return "Vista a pessoa exatamente com as peças descritas, substituindo a roupa atual.";
  if (kind === "hair_plan") return "Mude o cabelo exatamente para o corte, a cor e a textura descritos.";
  return "Aplique exatamente a maquiagem descrita, com resultado visível na pele, nos olhos e nos lábios.";
}

export function compileLookPrompt(
  b: LookBrief,
  extras?: { atributosPessoa?: string; apresentacao?: string; ancorada?: boolean },
): string {
  const specs = b.atributos.map((a) => `${a.rotulo}: ${a.valor}`).join("; ");
  const ajuste = b.ajuste_usuario ? ` Ajuste obrigatório do usuário: ${b.ajuste_usuario}.` : "";
  const objetivo = b.resumo ? ` Objetivo visual do pedido: ${b.resumo}.` : "";

  if (extras?.ancorada) {
    return (
      `Edite a fotografia real enviada como referência — é a própria pessoa, não uma pessoa fictícia: ` +
      `preserve o rosto, a identidade, o tom e a textura da pele, a pose, o enquadramento, a luz e o fundo. ` +
      `${acaoDaEdicao(b.kind)}${objetivo} ` +
      `Mudanças que precisam aparecer de forma claramente visível na imagem final: ${specs}.${ajuste} ` +
      `O resultado tem de ser a MESMA pessoa com o visual pedido e visivelmente diferente da foto original — ` +
      `não devolva a foto original sem as mudanças. ` +
      `Não alterar corpo, idade, traços ou cenário; sem texto, logotipos, marcas d'água ou sobreposição plástica. ` +
      `Referência visual de conceito, não prova virtual.`
    );
  }

  const variar = b.kind === "outfit"
    ? "Variar tecido, caimento, dobras e proporção conforme citado — nunca um manequim de catálogo padronizado."
    : "Respeitar idade aparente, tom de pele e textura citados; nunca um rosto único de catálogo.";
  const pessoa = extras?.atributosPessoa ? ` Características reais da pessoa (não inferir outras): ${extras.atributosPessoa}.` : "";
  const apresentacao = extras?.apresentacao ? ` Apresentação informada: ${extras.apresentacao}.` : "";
  return `${FRAMINGS[b.kind] ?? FRAMING_OUTFIT}${objetivo} Especificações obrigatórias do pedido (restrições, não sugestões): ${specs}.${ajuste}${pessoa}${apresentacao} ${variar} Luz suave, fundo neutro coerente com o contexto citado. Regras: não ignorar cor, material ou posição pedidos; não padronizar biótipo, idade ou tom; sem texto, logotipos ou marcas; sem sobreposição plástica de adesivo; sem membros ou dedos extras. Referência visual, não prova virtual. Não retratar pessoas reais.`;
}
