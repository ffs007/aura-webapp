import { describe, expect, it } from "vitest";
import { AVISO_SEM_BASE, escolherBaseTatuagem } from "@/lib/base-tatuagem";

describe("escolherBaseTatuagem", () => {
  it("usa o Meu Modelo (corpo) quando ele existe e foi aceito", () => {
    expect(escolherBaseTatuagem({ preview: "no_corpo", temModeloCorpo: true, usarModelo: true, temFotoDoLocal: false })).toBe("modelo");
  });

  it("prefere o Meu Modelo à foto do local", () => {
    expect(escolherBaseTatuagem({ preview: "no_corpo", temModeloCorpo: true, usarModelo: true, temFotoDoLocal: true })).toBe("modelo");
  });

  it("cai para a foto do local quando o Meu Modelo não foi aceito", () => {
    expect(escolherBaseTatuagem({ preview: "no_corpo", temModeloCorpo: true, usarModelo: false, temFotoDoLocal: true })).toBe("foto");
  });

  it("bloqueia a prévia no corpo sem nenhuma foto de base", () => {
    expect(escolherBaseTatuagem({ preview: "no_corpo", temModeloCorpo: false, usarModelo: true, temFotoDoLocal: false })).toBe("nenhuma");
  });

  it("libera o desenho isolado sem exigir foto", () => {
    expect(escolherBaseTatuagem({ preview: "isolado", temModeloCorpo: false, usarModelo: true, temFotoDoLocal: false })).toBe("livre");
  });

  it("o aviso explica o que fazer e por que a foto é necessária", () => {
    expect(AVISO_SEM_BASE).toMatch(/foto do local/i);
    expect(AVISO_SEM_BASE).toMatch(/inventa a regi[ãa]o/i);
  });
});
