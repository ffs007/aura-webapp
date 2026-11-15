import { describe, expect, it } from "vitest";
import { cenaEmProsa } from "@/lib/cena-prompt";
import { amostraVazia } from "@/lib/imagem-vazia";

/**
 * Regressão de 15/11/2026: a cena do pacote "visual" ia como JSON cru dentro do
 * prompt e o provedor devolvia imagem preta (1024×768). Em prosa, a imagem sai
 * normal; e imagem chapada nunca mais é salva.
 */

const CENA_REAL = {
  summary: "Visuais com camadas, texturas contrastantes e penteados que exploram o volume e a ousadia.",
  clothing: "Combine uma blusa fluida com uma jaqueta de couro ou jeans, criando camadas e texturas. Ex: macacão pantacourt com detalhe no decote.",
  makeup: "Olhos com um leve smokey eye em tons de marrom ou cinza. Batom em cor mais intensa, como vermelho cereja.",
  hair: "Um corte em camadas para realçar o movimento das ondas, ou um penteado com mais volume, como um 'messy bun'.",
  beard: "Não se aplica",
  accessories: "Mix de colares de diferentes comprimentos, maxi brincos e anéis statement.",
};

describe("cenaEmProsa", () => {
  it("não devolve chaves nem aspas de JSON (o que fazia o provedor devolver preto)", () => {
    const prosa = cenaEmProsa(CENA_REAL);
    expect(prosa).not.toMatch(/[{}"]/);
    expect(prosa).not.toMatch(/^\s*\{/);
  });

  it("mantém rótulos e valores na ordem", () => {
    const prosa = cenaEmProsa(CENA_REAL);
    expect(prosa.startsWith("summary: Visuais com camadas")).toBe(true);
    expect(prosa).toContain("clothing: Combine uma blusa fluida");
    expect(prosa).toContain("accessories: Mix de colares");
  });

  it("descarta campos sem conteúdo visual", () => {
    const prosa = cenaEmProsa(CENA_REAL);
    expect(prosa).not.toMatch(/beard/);
  });

  it("aceita listas e números sem virar JSON", () => {
    expect(cenaEmProsa({ pieces: ["blazer", "calça reta"], tamanho: 38 })).toBe("pieces: blazer, calça reta; tamanho: 38");
  });

  it("limita o tamanho da cena", () => {
    expect(cenaEmProsa({ summary: "x".repeat(5000) }).length).toBe(1200);
  });

  it("devolve string vazia quando não há nada aproveitável", () => {
    expect(cenaEmProsa({})).toBe("");
    expect(cenaEmProsa({ beard: "N/A", shoes: "—" })).toBe("");
  });
});

describe("amostraVazia", () => {
  const pixel = (r: number, g: number, b: number, a = 255) => [r, g, b, a];

  it("reconhece o quadro preto que o provedor devolve ao filtrar", () => {
    const preto = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < preto.length; i += 4) { preto[i + 3] = 255; }
    expect(amostraVazia(preto)).toBe(true);
  });

  it("reconhece branco chapado e imagem totalmente transparente", () => {
    const branco = new Uint8ClampedArray(16 * 4 * 4).fill(255);
    expect(amostraVazia(branco)).toBe(true);
    expect(amostraVazia(new Uint8ClampedArray(16 * 4))).toBe(true);
  });

  it("não marca como vazia uma foto com variação de luz", () => {
    expect(amostraVazia([...pixel(20, 20, 20), ...pixel(220, 180, 160), ...pixel(90, 70, 60)])).toBe(false);
  });

  it("tolera imagem quase preta mas com algum conteúdo", () => {
    expect(amostraVazia([...pixel(2, 2, 2), ...pixel(30, 26, 24)])).toBe(false);
  });

  it("ignora pixels transparentes ao calcular a variação", () => {
    expect(amostraVazia([...pixel(0, 0, 0, 0), ...pixel(40, 40, 40), ...pixel(180, 160, 150)])).toBe(false);
  });
});
