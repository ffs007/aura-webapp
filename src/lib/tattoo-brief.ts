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

/**
 * Prompt determinístico para o modelo de imagem — entidades explícitas + negativas obrigatórias.
 *
 * `ancorada` (11/2026): quando existe foto real (Meu Modelo ou foto do local), a
 * geração é uma EDIÇÃO dessa foto. Sem isso o modelo escolhe a região do corpo e
 * ignora o local pedido — foi o que fez um pedido de antebraço sair no ombro.
 */
export function compileTattooPrompt(b: TattooBrief, opcoes?: { ancorada?: boolean }): string {
  // Campos editáveis pelo usuário (local, estilo, elementos) viram texto do
  // prompt: removemos pontuação que poderia funcionar como instrução e limitamos
  // o tamanho, para o local não "ensinar" o modelo a escrever outra coisa.
  const limpar = (v?: string) => (v ?? "").replace(/[;\n\r"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const local = limpar(b.local_corpo);
  const estilo = limpar(b.estilo);
  const elementos = b.elementos.map((e) => limpar(e)).filter(Boolean).slice(0, 8);
  const onde = [local, b.lateralidade !== "nao_se_aplica" ? `lado ${b.lateralidade}` : null, b.tamanho]
    .filter(Boolean).join(" · ");
  const noCorpo = b.preview === "no_corpo" && !!local;
  const temTexto = b.tipo === "lettering" || (b.tipo === "composicao" && !!b.texto);
  // Com foto de base, a instrução deixa de ser "fotografe tal região" e passa a ser
  // "edite ESTA foto": a região, o ângulo e o corpo vêm da imagem, não do texto.
  const ancorada = !!opcoes?.ancorada && noCorpo;
  const partes: string[] = [];
  if (ancorada) {
    partes.push(
      `Edite a fotografia real enviada como referência (o próprio corpo da pessoa): preserve exatamente o enquadramento, o ângulo, a luz, a pele, o formato do membro e a perspectiva da foto — não gerar outro corpo, não recortar outra região e não reposicionar o membro. ` +
      `Desenhe a tatuagem sobre a pele dessa foto, exatamente em ${onde}. ` +
      `A tatuagem está exatamente em ${local}${b.lateralidade !== "nao_se_aplica" ? ` (lado ${b.lateralidade})` : ""}: não deslocar para a região vizinha (antebraço não é braço; braço não é antebraço; ombro não é braço) nem trocar o lado. ` +
      `A textura da pele, a iluminação e o formato vêm da foto original; a tatuagem parece cicatrizada e integrada à pele. ` +
      `Mantenha o resultado como FOTOGRAFIA realista da pessoa: não converter a imagem em desenho, ilustração, esboço, aquarela, filtro artístico ou arte vetorial.`,
    );
  } else if (noCorpo) {
    partes.push(
      `Fotografia realista de uma tatuagem já aplicada em ${onde}, em pessoa adulta fictícia. ` +
      `Enquadramento bem fechado, mostrando apenas ${local} e o entorno imediato — não mostrar o corpo inteiro, o rosto inteiro nem outras regiões. ` +
      `A tatuagem está exatamente em ${local}${b.lateralidade !== "nao_se_aplica" ? ` (lado ${b.lateralidade})` : ""}: não deslocar para a região vizinha (antebraço não é braço; braço não é antebraço; ombro não é braço). ` +
      `Pele natural, pelos finos, curvatura e perspectiva reais da região, luz suave de estúdio.`,
    );
  } else {
    partes.push("Ilustração do desenho de tatuagem isolado em folha branca, sem pessoa, sem corpo, para decidir a aplicação com o tatuador.");
  }
  if (b.tipo === "lettering" && b.texto) {
    const linhas = b.texto.split("\\n").join(" / ");
    partes.push(
      `O elemento principal é a escrita: reproduza exatamente o texto "${linhas}" — ortografia, acentos, maiúsculas/minúsculas e quebras de linha idênticas. Tipografia: ${b.fonte_estilo ?? "coerente com o estilo pedido"}, traço limpo e legível. Nenhuma outra palavra pode aparecer na imagem.`,
    );
  } else if (b.tipo === "simbolo") {
    partes.push(`Elemento principal: ${elementos[0] ?? "o símbolo pedido"}. Sem escrita, sem letras e sem números no desenho.`);
  } else {
    partes.push(`Composição com: ${elementos.join(", ")}.${b.texto ? ` Inclui a escrita exata "${b.texto}" com acentos preservados.` : ""}`);
  }
  if (estilo) partes.push(`Estilo de tatuagem: ${estilo}.${ancorada ? " Esse estilo vale apenas para o traço da tatuagem, não para a foto." : ""}`);
  if (elementos.length && b.tipo !== "simbolo") partes.push(`Elementos permitidos na cena: apenas ${elementos.join(", ")} e a região do corpo citada.`);
  if (temTexto) {
    partes.push("Não adicionar legendas, assinaturas, palavras soltas, marcas d'água ou qualquer texto além do pedido.");
  } else {
    partes.push("A imagem não contém nenhuma palavra, letra, número, legenda ou assinatura escrita: o desenho é só gráfico, sem texto de qualquer tipo.");
  }
  partes.push("Regras obrigatórias: não substituir texto pedido por símbolo; não traduzir, abreviar ou reescrever palavras; não espelhar a lateralidade; não adicionar dedos, orelhas ou membros extras; não usar marcas d'água nem texto de fundo; não simular sobreposição plástica de adesivo; não alterar o estilo pedido.");
  if (ancorada) {
    partes.push("A foto de referência manda: mesma pessoa, mesma região, mesmo enquadramento. Reproduzir a foto original com a tatuagem aplicada, sem improvisar cenário, roupa ou outra parte do corpo.");
  }
  partes.push(
    ancorada
      ? "Referência visual de conceito, não prova virtual. Usar somente a pessoa da foto enviada; não inventar outras pessoas."
      : "Referência visual de conceito, não prova virtual. Não retratar pessoas reais.",
  );
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
