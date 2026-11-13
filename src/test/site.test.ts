import { afterEach, describe, expect, it, vi } from "vitest";
import { DOMINIO_OFICIAL, IMAGEM_COMPARTILHAMENTO, urlAbsoluta, urlDoSite } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("domínio oficial", () => {
  it("usa auraid.app.br quando VITE_APP_URL não está definida", () => {
    expect(urlDoSite()).toBe(DOMINIO_OFICIAL);
    expect(DOMINIO_OFICIAL).toBe("https://auraid.app.br");
  });

  it("respeita VITE_APP_URL de homologação e remove barra final", () => {
    vi.stubEnv("VITE_APP_URL", "https://homolog.exemplo.com/");
    expect(urlDoSite()).toBe("https://homolog.exemplo.com");
  });

  it("ignora valor inválido e volta ao domínio oficial", () => {
    vi.stubEnv("VITE_APP_URL", "nao-e-url");
    expect(urlDoSite()).toBe(DOMINIO_OFICIAL);
  });

  it("monta URLs absolutas com e sem barra inicial", () => {
    expect(urlAbsoluta()).toBe(`${DOMINIO_OFICIAL}/`);
    expect(urlAbsoluta("/auth")).toBe(`${DOMINIO_OFICIAL}/auth`);
    expect(urlAbsoluta("auth")).toBe(`${DOMINIO_OFICIAL}/auth`);
  });

  it("aponta a arte de compartilhamento para public/", () => {
    expect(IMAGEM_COMPARTILHAMENTO).toBe("/og-aura-id.png");
    expect(urlAbsoluta(IMAGEM_COMPARTILHAMENTO)).toBe(`${DOMINIO_OFICIAL}/og-aura-id.png`);
  });
});
