import { describe, expect, it } from "vitest";
import { compileTattooPrompt, type TattooBrief } from "@/lib/tattoo-brief";
import { mensagemDeImagemAmigavel } from "@/lib/erros-imagem";

const base: TattooBrief = {
  tipo: "simbolo",
  elementos: ["linha contínua abstrata"],
  lateralidade: "nao_se_aplica",
  preview: "no_corpo",
  local_corpo: "antebraço",
  duvidas: [],
};

describe("compileTattooPrompt", () => {
  it("não usa a palavra 'prévia' (que virava tatuagem escrita na imagem)", () => {
    const prompt = compileTattooPrompt(base);
    expect(prompt).not.toMatch(/pr[ée]via/i);
  });

  it("fixa o local do corpo e proíbe deslocar para região vizinha", () => {
    const prompt = compileTattooPrompt(base);
    expect(prompt).toContain("antebraço");
    expect(prompt).toMatch(/não deslocar|região vizinha/i);
    expect(prompt).toMatch(/antebraço não é braço|braço não é antebraço/i);
  });

  it("proíbe texto quando o pedido é símbolo/linha", () => {
    const prompt = compileTattooPrompt(base);
    expect(prompt).toMatch(/n[ãa]o cont[ée]m nenhuma palavra, letra, n[úu]mero, legenda/i);
  });

  it("mantém o texto exato e único quando o pedido é lettering", () => {
    const prompt = compileTattooPrompt({ ...base, tipo: "lettering", texto: "respire", elementos: [] });
    expect(prompt).toContain('"respire"');
    expect(prompt).toMatch(/Nenhuma outra palavra pode aparecer/i);
    expect(prompt).not.toMatch(/n[ãa]o cont[ée]m nenhuma palavra, letra/i);
  });

  it("mantém prévia isolada sem pessoa quando não há local", () => {
    const prompt = compileTattooPrompt({ ...base, preview: "isolado", local_corpo: undefined });
    expect(prompt).toMatch(/folha branca, sem pessoa, sem corpo/i);
  });

  it("com foto de base, manda EDITAR a foto e preservar enquadramento e região", () => {
    const prompt = compileTattooPrompt(base, { ancorada: true });
    expect(prompt).toMatch(/Edite a fotografia real enviada como refer[êe]ncia/i);
    expect(prompt).toMatch(/preserve exatamente o enquadramento/i);
    expect(prompt).toMatch(/n[ãa]o gerar outro corpo/i);
    expect(prompt).toMatch(/mesma regi[ãa]o, mesmo enquadramento/i);
    expect(prompt).toMatch(/n[ãa]o converter a imagem em desenho/i);
    expect(prompt).not.toMatch(/pessoa adulta fict[íi]cia/i);
    expect(prompt).toMatch(/n[ãa]o cont[ée]m nenhuma palavra, letra, n[úu]mero, legenda/i);
  });

  it("sem foto de base continua descrevendo a cena (não menciona edição de foto)", () => {
    const prompt = compileTattooPrompt(base);
    expect(prompt).not.toMatch(/Edite a fotografia real/i);
    expect(prompt).toMatch(/pessoa adulta fict[íi]cia/i);
  });

  it("pedido isolado nunca pede edição de foto, mesmo ancorado", () => {
    const prompt = compileTattooPrompt({ ...base, preview: "isolado" }, { ancorada: true });
    expect(prompt).not.toMatch(/Edite a fotografia real/i);
    expect(prompt).toMatch(/folha branca, sem pessoa/i);
  });
});

describe("mensagemDeImagemAmigavel", () => {
  it("traduz bloqueio de créditos do provedor sem vazar detalhe técnico", () => {
    const msg = mensagemDeImagemAmigavel('Provedor de imagem respondeu 403: {"detail":"User is locked. Reason: TOP_UP."}');
    expect(msg).toMatch(/temporariamente indispon[íi]vel/i);
    expect(msg).not.toMatch(/TOP_UP|locked|403/i);
  });

  it("mantém mensagem curta e útil quando não é erro de provedor", () => {
    expect(mensagemDeImagemAmigavel("Permissão para imagens desativada.")).toMatch(/permiss/i);
  });

  it("não devolve vazio quando o erro vem sem texto", () => {
    expect(mensagemDeImagemAmigavel("")).toMatch(/n[ãa]o foi poss[íi]vel/i);
  });
});
