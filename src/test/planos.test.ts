import { describe, expect, it } from "vitest";
import { ehPlano, LIMITES_PLANO, NOME_PLANO, resumoUsoImagens } from "@/lib/planos";

describe("política de uso justo exibida no webapp", () => {
  it("mantém os valores aprovados por plano", () => {
    expect(LIMITES_PLANO.pass).toEqual({ imagensMes: 50, imagensDia: 12, textoMes: 400 });
    expect(LIMITES_PLANO.pro).toEqual({ imagensMes: 150, imagensDia: 30, textoMes: 1200 });
  });

  it("reconhece somente os planos válidos", () => {
    expect(ehPlano("pass")).toBe(true);
    expect(ehPlano("pro")).toBe(true);
    expect(ehPlano("free")).toBe(false);
    expect(ehPlano(null)).toBe(false);
  });

  it("monta o resumo com os limites do plano", () => {
    const texto = resumoUsoImagens("pass", { imagensMes: 12, imagensHoje: 3 });
    expect(texto).toContain("Aura Pass");
    expect(texto).toContain("12/50 imagens no mês");
    expect(texto).toContain("hoje 3/12");
    expect(NOME_PLANO.pro).toBe("Plano Profissional");
  });

  it("não mostra número acima do limite nem negativo", () => {
    const texto = resumoUsoImagens("pro", { imagensMes: 9999, imagensHoje: -2 });
    expect(texto).toContain("150/150");
    expect(texto).toContain("hoje 0/30");
  });
});
