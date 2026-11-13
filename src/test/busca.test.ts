import { describe, expect, it } from "vitest";
import { corresponde, filtrarPorTermo, limitar, normalizarBusca, type ItemBusca } from "@/lib/busca";

const ITENS: ItemBusca[] = [
  { id: "col-1", titulo: "Coleção Verão", descricao: "peças claras e leves", grupo: "Coleções", rota: "/collections" },
  { id: "lem-1", titulo: "Lembrete de corte", descricao: "marcar para sexta", grupo: "Lembretes", rota: "/settings" },
  { id: "bri-1", titulo: "Briefing de noiva", descricao: "Salão da Bia", grupo: "Briefings", rota: "/profissionais" },
];

describe("normalizarBusca", () => {
  it("remove acentos/diacríticos", () => {
    expect(normalizarBusca("Estética Ação Coração")).toBe("estetica acao coracao");
  });

  it("passa para minúsculas e apara as pontas", () => {
    expect(normalizarBusca("  MAQUIAGEM  ")).toBe("maquiagem");
  });

  it("preserva textos já sem acento", () => {
    expect(normalizarBusca("DNA Visual")).toBe("dna visual");
  });
});

describe("corresponde", () => {
  it("encontra correspondência parcial ignorando acento e caixa", () => {
    expect(corresponde("Estética", "estetica")).toBe(true);
    expect(corresponde("Cabelo e barba", "BARBA")).toBe(true);
  });

  it("não confunde termos diferentes", () => {
    expect(corresponde("Cabelo", "unha")).toBe(false);
  });

  it("termo vazio corresponde a tudo", () => {
    expect(corresponde("qualquer coisa", "")).toBe(true);
    expect(corresponde("qualquer coisa", "   ")).toBe(true);
  });
});

describe("filtrarPorTermo", () => {
  const campos = (item: ItemBusca) => [item.titulo, item.descricao];

  it("filtra usando múltiplos campos do item", () => {
    const peloTitulo = filtrarPorTermo(ITENS, "coleção", campos);
    expect(peloTitulo).toHaveLength(1);
    expect(peloTitulo[0]?.id).toBe("col-1");

    const pelaDescricao = filtrarPorTermo(ITENS, "sexta", campos);
    expect(pelaDescricao).toHaveLength(1);
    expect(pelaDescricao[0]?.id).toBe("lem-1");
  });

  it("ignora acentos na consulta e nos campos", () => {
    expect(filtrarPorTermo(ITENS, "verao", campos).map((i) => i.id)).toEqual(["col-1"]);
    expect(filtrarPorTermo(ITENS, "Salão", campos).map((i) => i.id)).toEqual(["bri-1"]);
  });

  it("termo vazio devolve todos os itens", () => {
    expect(filtrarPorTermo(ITENS, "", campos)).toHaveLength(ITENS.length);
    expect(filtrarPorTermo(ITENS, "   ", campos)).toHaveLength(ITENS.length);
  });

  it("sem correspondência devolve lista vazia", () => {
    expect(filtrarPorTermo(ITENS, "inexistente", campos)).toEqual([]);
  });

  it("não muta a lista original", () => {
    const copia = [...ITENS];
    filtrarPorTermo(ITENS, "coleção", campos);
    expect(ITENS).toEqual(copia);
  });
});

describe("busca tolerante a erro de digitação", () => {
  it("encontra com um erro de digitação em palavra longa", () => {
    expect(corresponde("Maquiagem", "maquigem")).toBe(true);
    expect(corresponde("Cabelo e barba", "cabello")).toBe(true);
  });

  it("encontra por prefixo", () => {
    expect(corresponde("Maquiagem", "maqui")).toBe(true);
    expect(corresponde("Briefing de noiva", "brief")).toBe(true);
  });

  it("aceita várias palavras em qualquer ordem", () => {
    expect(corresponde("Coleção Verão", "verao colecao")).toBe(true);
    expect(corresponde("Coleção Verão", "colecao verao")).toBe(true);
  });

  it("não aproxima demais palavras curtas nem termos diferentes", () => {
    expect(corresponde("Unha", "uva")).toBe(false);
    expect(corresponde("Coleção Verão", "coracao")).toBe(false);
    expect(corresponde("Cabelo", "unha")).toBe(false);
  });

  it("a lista também se beneficia da tolerância", () => {
    const campos = (item: ItemBusca) => [item.titulo, item.descricao];
    expect(filtrarPorTermo(ITENS, "verao", campos).map((i) => i.id)).toEqual(["col-1"]);
    expect(filtrarPorTermo(ITENS, "lembrete corte", campos).map((i) => i.id)).toEqual(["lem-1"]);
  });
});

describe("limitar", () => {
  it("corta a lista no limite pedido", () => {
    expect(limitar([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });

  it("devolve a lista inteira quando o limite é maior", () => {
    expect(limitar([1, 2], 10)).toEqual([1, 2]);
  });

  it("limite zero ou inválido devolve lista vazia", () => {
    expect(limitar([1, 2, 3], 0)).toEqual([]);
    expect(limitar([1, 2, 3], -2)).toEqual([]);
    expect(limitar([1, 2, 3], Number.NaN)).toEqual([]);
  });

  it("não muta a lista original", () => {
    const original = [1, 2, 3];
    limitar(original, 1);
    expect(original).toEqual([1, 2, 3]);
  });
});
