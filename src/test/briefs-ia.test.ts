import { describe, expect, it } from "vitest";
import { briefDeReserva, normalizarLookBrief } from "@/lib/look-brief";
import { normalizarTattooBrief } from "@/lib/tattoo-brief";
import { normalizarAjustesRetrato } from "@/lib/retrato-ajustes";

/**
 * Regressão do bug de 15/11/2026: o JSON da IA era reprovado por limites
 * apertados (look: 10 atributos / valor 160; tatuagem: elementos 8; retrato:
 * alvo 40) e a tela exibia "Não consegui entender o pedido com segurança",
 * como se fosse bloqueio de conteúdo. Estes casos são recortes reais do que o
 * modelo devolveu — todos precisam virar brief utilizável.
 */

function atributos(n: number) {
  return Array.from({ length: n }, (_, i) => ({ rotulo: `campo_${i}`, valor: `descrição do campo ${i}` }));
}

describe("normalizarLookBrief", () => {
  it("aceita os 13 atributos que a maquiagem 'bold' devolveu (antes falhava)", () => {
    const brief = normalizarLookBrief({ kind: "makeup_look", atributos: atributos(13), ajuste_usuario: "", duvidas: [] }, "makeup_look");
    expect(brief?.atributos).toHaveLength(13);
    expect(brief?.kind).toBe("makeup_look");
  });

  it("aceita valor de 349 caracteres (antes falhava no limite de 160)", () => {
    const brief = normalizarLookBrief({ atributos: [{ rotulo: "corte", valor: "x".repeat(349) }], duvidas: [] }, "hair_plan");
    expect(brief?.atributos[0]?.valor).toHaveLength(349);
  });

  it("apara rótulo e valor exagerados em vez de rejeitar", () => {
    const brief = normalizarLookBrief({ atributos: [{ rotulo: "r".repeat(120), valor: "v".repeat(900) }] }, "outfit");
    expect(brief?.atributos[0]?.rotulo).toHaveLength(80);
    expect(brief?.atributos[0]?.valor).toHaveLength(600);
  });

  it("limita dúvidas a 3 e completa ajuste ausente", () => {
    const brief = normalizarLookBrief({ atributos: atributos(2), duvidas: ["a", "b", "c", "d", "e"] }, "outfit");
    expect(brief?.duvidas).toEqual(["a", "b", "c"]);
    expect(brief?.ajuste_usuario).toBe("");
  });

  it("converte números em texto (o modelo às vezes devolve 40 em vez de '40 cm')", () => {
    const brief = normalizarLookBrief({ atributos: [{ rotulo: "caimento", valor: 40 }] }, "outfit");
    expect(brief?.atributos[0]?.valor).toBe("40");
  });

  it("remove itens vazios e atributos repetidos", () => {
    const brief = normalizarLookBrief({ atributos: [{ rotulo: "cor", valor: "verde" }, { rotulo: "cor", valor: "azul" }, { rotulo: "", valor: "x" }, { rotulo: "tecido", valor: "  " }] }, "outfit");
    expect(brief?.atributos).toEqual([{ rotulo: "cor", valor: "verde" }]);
  });

  it("devolve null só quando não sobrou nenhum atributo", () => {
    expect(normalizarLookBrief({ atributos: [] }, "outfit")).toBeNull();
    expect(normalizarLookBrief(null, "outfit")).toBeNull();
    expect(normalizarLookBrief("texto solto", "outfit")).toBeNull();
  });
});

describe("briefDeReserva", () => {
  it("monta o brief a partir da opção do pacote quando a IA não devolve nada", () => {
    const brief = briefDeReserva(
      { level: "intermediate", summary: "Pele leve com olhos marcados", products: ["corretivo", "sombra em bastão"], steps: ["prepare a pele", "esfume a sombra"] },
      "makeup_look",
    );
    expect(brief?.atributos.map((a) => a.rotulo)).toEqual(["resumo do pedido", "produtos", "execucao"]);
    expect(brief?.atributos[1]?.valor).toBe("corretivo; sombra em bastão");
  });

  it("devolve null quando a opção também está vazia", () => {
    expect(briefDeReserva({}, "outfit")).toBeNull();
  });
});

describe("normalizarTattooBrief", () => {
  it("mantém lettering com texto e acentos", () => {
    const brief = normalizarTattooBrief({ tipo: "lettering", texto: "Força & Coração", elementos: [], local_corpo: "antebraço interno", lateralidade: "esquerda", preview: "no_corpo", duvidas: [] });
    expect(brief?.tipo).toBe("lettering");
    expect(brief?.texto).toBe("Força & Coração");
    expect(brief?.local_corpo).toBe("antebraço interno");
  });

  it("não transforma 'fine line' em lettering quando o modelo já classificou como símbolo", () => {
    const brief = normalizarTattooBrief({ tipo: "simbolo", elementos: ["linha fina", "lua"], local_corpo: "ombro esquerdo", preview: "no_corpo", duvidas: [] });
    expect(brief?.tipo).toBe("simbolo");
    expect(brief?.lateralidade).toBe("esquerda");
  });

  it("infere composição quando o tipo vem inválido mas há texto e elementos", () => {
    const brief = normalizarTattooBrief({ tipo: "tatuagem", texto: "2026", elementos: ["estrela"], local_corpo: "braço", duvidas: [] });
    expect(brief?.tipo).toBe("composicao");
  });

  it("rejeita lettering sem texto (não há o que escrever)", () => {
    expect(normalizarTattooBrief({ tipo: "lettering", elementos: [], duvidas: [] })).toBeNull();
  });

  it("rejeita símbolo sem elementos", () => {
    expect(normalizarTattooBrief({ tipo: "simbolo", elementos: [], duvidas: [] })).toBeNull();
  });

  it("aceita 12 elementos e corta no limite de 8, aparando cada um", () => {
    const brief = normalizarTattooBrief({ tipo: "composicao", texto: "x", elementos: Array.from({ length: 12 }, (_, i) => `e${i}`.padEnd(120, "y")), duvidas: [] });
    expect(brief?.elementos).toHaveLength(8);
    expect(brief?.elementos[0]).toHaveLength(80);
  });

  it("corta texto acima de 160 e mantém lateralidade e preview válidos", () => {
    const brief = normalizarTattooBrief({ tipo: "lettering", texto: "a".repeat(300), local_corpo: "costela direita", lateralidade: "do_lado", preview: "flutuante", duvidas: ["e?", "f?", "g?", "h?"] });
    expect(brief?.texto).toHaveLength(160);
    expect(brief?.lateralidade).toBe("direita");
    expect(brief?.preview).toBe("no_corpo");
    expect(brief?.duvidas).toHaveLength(3);
  });
});

describe("normalizarAjustesRetrato", () => {
  it("aceita 8 ajustes e corta em 6, descartando repetidos", () => {
    const bruto = { ajustes: [...Array.from({ length: 8 }, (_, i) => ({ alvo: `alvo ${i}`, mudanca: `mudança ${i}` })), { alvo: "lábios", mudanca: "batom vermelho mate" }, { alvo: "lábios", mudanca: "batom vermelho mate" }], duvidas: [] };
    const ajustes = normalizarAjustesRetrato(bruto);
    expect(ajustes?.ajustes).toHaveLength(6);
  });

  it("apara alvo e mudança longos em vez de rejeitar", () => {
    const ajustes = normalizarAjustesRetrato({ ajustes: [{ alvo: "a".repeat(100), mudanca: "m".repeat(500) }], duvidas: [] });
    expect(ajustes?.ajustes[0]?.alvo).toHaveLength(60);
    expect(ajustes?.ajustes[0]?.mudanca).toHaveLength(300);
  });

  it("devolve null quando não há nenhum ajuste utilizável", () => {
    expect(normalizarAjustesRetrato({ ajustes: [{ alvo: "", mudanca: "" }] })).toBeNull();
    expect(normalizarAjustesRetrato({})).toBeNull();
  });
});
