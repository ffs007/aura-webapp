import { describe, expect, it } from "vitest";
import { briefDeReserva, compileLookPrompt, normalizarLookBrief, type LookBrief } from "@/lib/look-brief";

/**
 * Regressão de 15/11/2026: com foto-base (Meu Modelo), o prompt era de GERAÇÃO
 * ("fotografia de pessoa fictícia") e o provedor devolvia praticamente a mesma
 * foto — três gerações diferentes com ~3% de diferença entre si, sem a
 * maquiagem pedida. O prompt ancorado (edição + objetivo visual) faz a mudança
 * aparecer, medido em imagem real.
 */

const makeup: LookBrief = {
  kind: "makeup_look",
  resumo: "adicionar profundidade aos olhos e definição às sobrancelhas, mantendo a pele leve",
  atributos: [
    { rotulo: "olhos", valor: "sombra marrom esfumada com profundidade" },
    { rotulo: "sobrancelhas", valor: "preenchidas e definidas" },
    { rotulo: "pele", valor: "uniforme, acabamento natural" },
  ],
  ajuste_usuario: "",
  duvidas: [],
};

describe("compileLookPrompt com foto-base (ancorada)", () => {
  const prompt = compileLookPrompt(makeup, { ancorada: true });

  it("pede edição da foto real, não uma pessoa fictícia", () => {
    expect(prompt).toMatch(/^Edite a fotografia real enviada/);
    expect(prompt).toContain("é a própria pessoa");
    expect(prompt).not.toMatch(/pessoa adulta fictícia/);
  });

  it("manda preservar identidade, pose e enquadramento", () => {
    expect(prompt).toContain("preserve o rosto, a identidade");
    expect(prompt).toContain("a pose, o enquadramento, a luz e o fundo");
  });

  it("exige mudança visível e proíbe devolver a foto original", () => {
    expect(prompt).toContain("claramente visível");
    expect(prompt).toContain("visivelmente diferente da foto original");
    expect(prompt).toContain("não devolva a foto original sem as mudanças");
  });

  it("leva o objetivo visual e os atributos do pedido", () => {
    expect(prompt).toContain("Objetivo visual do pedido: adicionar profundidade aos olhos");
    expect(prompt).toContain("olhos: sombra marrom esfumada com profundidade");
    expect(prompt).toContain("sobrancelhas: preenchidas e definidas");
  });

  it("usa a ação certa por tipo de look", () => {
    expect(compileLookPrompt({ ...makeup, kind: "makeup_look" }, { ancorada: true })).toContain("Aplique exatamente a maquiagem descrita");
    expect(compileLookPrompt({ ...makeup, kind: "outfit" }, { ancorada: true })).toContain("Vista a pessoa exatamente com as peças descritas");
    expect(compileLookPrompt({ ...makeup, kind: "hair_plan" }, { ancorada: true })).toContain("Mude o cabelo exatamente para o corte");
  });

  it("mantém o ajuste obrigatório do usuário", () => {
    expect(compileLookPrompt({ ...makeup, ajuste_usuario: "tom terroso" }, { ancorada: true })).toContain("Ajuste obrigatório do usuário: tom terroso");
  });
});

describe("compileLookPrompt sem foto-base", () => {
  it("continua sendo prompt de geração por tipo", () => {
    const prompt = compileLookPrompt(makeup, { apresentacao: "feminine" });
    expect(prompt).toContain("Fotografia editorial realista de rosto e ombros");
    expect(prompt).toContain("Especificações obrigatórias do pedido");
    expect(prompt).toContain("Apresentação informada: feminine");
  });

  it("não fala em editar a foto", () => {
    expect(compileLookPrompt(makeup)).not.toContain("Edite a fotografia real");
  });
});

describe("resumo do brief", () => {
  it("normaliza o resumo vindo da IA", () => {
    const brief = normalizarLookBrief({ resumo: "olhos marcados e pele leve", atributos: [{ rotulo: "olhos", valor: "sombra cinza" }] }, "makeup_look");
    expect(brief?.resumo).toBe("olhos marcados e pele leve");
  });

  it("usa a reserva do pacote quando a IA não devolve resumo", () => {
    const brief = briefDeReserva({ summary: "Pele leve com olhos definidos", products: ["corretivo"] }, "makeup_look");
    expect(brief?.resumo).toBe("Pele leve com olhos definidos");
  });

  it("devolve resumo vazio quando não há", () => {
    expect(normalizarLookBrief({ atributos: [{ rotulo: "olhos", valor: "sombra" }] }, "makeup_look")?.resumo).toBe("");
  });
});
