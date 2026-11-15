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
  required: ["kind", "atributos", "ajuste_usuario", "duvidas"],
  properties: {
    kind: { type: "string", enum: ["outfit", "makeup_look", "hair_plan"] },
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
  if (!atributos.length) return null;
  return { kind, atributos, ajuste_usuario: ajuste, duvidas };
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
  return { kind, atributos: atributos.slice(0, 12), ajuste_usuario: "", duvidas: [] };
}
