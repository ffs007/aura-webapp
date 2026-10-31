import { z } from "zod";

/**
 * Camada de interpretação de tatuagens (feedback 2026-10-27).
 * O pedido livre do usuário vira um BRIEF estruturado, confirmado por ele,
 * e o brief vira um prompt determinístico com restrições negativas explícitas.
 * Regra de ouro: o texto pedido é o próprio objeto — nunca substituído por símbolo.
 */

export const tattooBriefSchema = z.object({
  tipo: z.enum(["lettering", "simbolo", "composicao"]),
  texto: z.string().max(160).optional(),
  fonte_estilo: z.string().max(80).optional(),
  elementos: z.array(z.string().max(80)).max(8).default([]),
  local_corpo: z.string().max(80).optional(),
  lateralidade: z.enum(["esquerda", "direita", "central", "nao_se_aplica"]).default("nao_se_aplica"),
  tamanho: z.string().max(60).optional(),
  estilo: z.string().max(80).optional(),
  preview: z.enum(["no_corpo", "isolado"]).default("no_corpo"),
  duvidas: z.array(z.string().max(200)).max(3).default([]),
});
export type TattooBrief = z.infer<typeof tattooBriefSchema>;

const s = { type: "string" };
export const interpretJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["tipo", "elementos", "lateralidade", "preview", "duvidas"],
  properties: {
    tipo: { type: "string", enum: ["lettering", "simbolo", "composicao"] },
    texto: s, fonte_estilo: s,
    elementos: { type: "array", items: s },
    local_corpo: s,
    lateralidade: { type: "string", enum: ["esquerda", "direita", "central", "nao_se_aplica"] },
    tamanho: s, estilo: s,
    preview: { type: "string", enum: ["no_corpo", "isolado"] },
    duvidas: { type: "array", items: s },
  },
};

/** Prompt determinístico para o modelo de imagem — entidades explícitas + negativas obrigatórias. */
export function compileTattooPrompt(b: TattooBrief): string {
  const onde = [b.local_corpo, b.lateralidade !== "nao_se_aplica" ? `lado ${b.lateralidade}` : null, b.tamanho]
    .filter(Boolean).join(" · ");
  const partes: string[] = [];
  partes.push(b.preview === "no_corpo" && b.local_corpo
    ? `Fotografia realista de PRÉVIA de tatuagem aplicada em ${onde} de pessoa adulta fictícia. Enquadramento fechado na região citada, pele natural, curvatura e perspectiva reais da área, luz suave de estúdio.`
    : "Ilustração do conceito de tatuagem isolado em folha branca, sem pessoa, sem corpo, aplicação futura a decidir com o tatuador.");
  if (b.tipo === "lettering" && b.texto) {
    const linhas = b.texto.split("\\n").join(" / ");
    partes.push(`O ELEMENTO PRINCIPAL É A ESCRITA: reproduza EXATAMENTE o texto "${linhas}" — ortografia, acentos (ç ã õ é í), maiúsculas/minúsculas e quebras de linha idênticas ao pedido. Tipografia: ${b.fonte_estilo ?? "coerente com o estilo pedido"}, traço limpo e legível. As palavras são o próprio objeto da tatuagem.`);
  } else if (b.tipo === "simbolo") {
    partes.push(`Elemento principal: ${b.elementos[0] ?? "símbolo pedido"}. Sem escrita, sem letras decorativas não solicitadas.`);
  } else {
    partes.push(`Composição com: ${b.elementos.join(", ")}.${b.texto ? ` Inclui a escrita exata "${b.texto}" com acentos preservados.` : ""}`);
  }
  if (b.estilo) partes.push(`Estilo de tatuagem: ${b.estilo}.`);
  if (b.elementos.length && b.tipo !== "simbolo") partes.push(`Elementos permitidos na cena: apenas ${b.elementos.join(", ")} e a região do corpo citada.`);
  partes.push("PROIBIDO expressamente: substituir texto por símbolo, animal, ornamento ou pictograma; traduzir, abreviar ou reescrever palavras; espelhar a lateralidade (trocar esquerda/direita); adicionar dedos, orelhas ou membros extras; marcas d'água; texto de fundo; sobreposição plástica de adesivo; alterar o estilo pedido.");
  partes.push("Referência visual de conceito, não prova virtual. Não retratar pessoas reais.");
  return partes.join(" ");
}

/** Resumo em PT-BR do que o sistema entendeu — exibido para confirmação antes de gerar. */
export function resumoDoPedido(b: TattooBrief): { rotulo: string; valor: string }[] {
  return [
    { rotulo: "Tipo", valor: b.tipo === "lettering" ? "Escrita (lettering)" : b.tipo === "simbolo" ? "Símbolo" : "Composição" },
    ...(b.texto ? [{ rotulo: "Texto exato", valor: `"${b.texto}"` }] : []),
    ...(b.fonte_estilo ? [{ rotulo: "Tipografia", valor: b.fonte_estilo }] : []),
    ...(b.elementos.length ? [{ rotulo: "Elementos", valor: b.elementos.join(", ") }] : []),
    ...(b.local_corpo ? [{ rotulo: "Local no corpo", valor: `${b.local_corpo}${b.lateralidade !== "nao_se_aplica" ? ` (lado ${b.lateralidade})` : ""}` }] : []),
    ...(b.tamanho ? [{ rotulo: "Tamanho", valor: b.tamanho }] : []),
    ...(b.estilo ? [{ rotulo: "Estilo", valor: b.estilo }] : []),
    { rotulo: "Prévia", valor: b.preview === "no_corpo" ? "Aplicada no corpo (região citada)" : "Desenho isolado em folha" },
  ];
}
