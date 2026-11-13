import { beforeEach, describe, expect, it } from "vitest";
import { avaliarJanela, mensagemDeLimite } from "@/lib/limites";
import { consumirLimite, identificadorDoCliente, limparLimites } from "@/lib/limites.server";

const AGORA = 1_700_000_000_000;
const MIN = 60_000;

describe("avaliarJanela", () => {
  it("permite enquanto está abaixo do máximo", () => {
    const r = avaliarJanela([AGORA - 1 * MIN], AGORA, 3, 10 * MIN);
    expect(r.permitido).toBe(true);
    if (r.permitido) expect(r.restantes).toBe(2);
  });

  it("bloqueia ao atingir o máximo e informa quanto esperar", () => {
    const r = avaliarJanela([AGORA - 9 * MIN, AGORA - 5 * MIN, AGORA - 1 * MIN], AGORA, 3, 10 * MIN);
    expect(r.permitido).toBe(false);
    if (!r.permitido) {
      // a ocorrência mais antiga expira em ~1 minuto
      expect(r.retryAfterMs).toBeGreaterThanOrEqual(MIN);
      expect(r.retryAfterMs).toBeLessThanOrEqual(2 * MIN);
    }
  });

  it("ignora ocorrências fora da janela", () => {
    const r = avaliarJanela([AGORA - 30 * MIN, AGORA - 20 * MIN, AGORA - 15 * MIN], AGORA, 2, 10 * MIN);
    expect(r.permitido).toBe(true);
  });

  it("máximo inválido bloqueia por segurança", () => {
    expect(avaliarJanela([], AGORA, 0, 10 * MIN).permitido).toBe(false);
    expect(avaliarJanela([], AGORA, Number.NaN, 10 * MIN).permitido).toBe(false);
  });

  it("a mensagem informa minutos e não vaza detalhe técnico", () => {
    const msg = mensagemDeLimite(2 * MIN);
    expect(msg).toContain("2 min");
    expect(msg).not.toContain("ms");
  });
});

describe("consumirLimite (memória do processo)", () => {
  beforeEach(() => limparLimites());

  it("permite até o máximo e depois bloqueia", () => {
    const chave = "teste:janela";
    expect(consumirLimite(chave, 2, 10 * MIN).permitido).toBe(true);
    expect(consumirLimite(chave, 2, 10 * MIN).permitido).toBe(true);
    expect(consumirLimite(chave, 2, 10 * MIN).permitido).toBe(false);
  });

  it("chaves diferentes não se afetam", () => {
    expect(consumirLimite("a", 1, 10 * MIN).permitido).toBe(true);
    expect(consumirLimite("b", 1, 10 * MIN).permitido).toBe(true);
  });
});

describe("identificadorDoCliente", () => {
  const comHeader = (nome: string, valor: string) => new Request("https://auraid.app.br", { headers: { [nome]: valor } });

  it("usa cf-connecting-ip quando existe", () => {
    const a = identificadorDoCliente(comHeader("cf-connecting-ip", "203.0.113.9"));
    const b = identificadorDoCliente(comHeader("cf-connecting-ip", "203.0.113.9"));
    const c = identificadorDoCliente(comHeader("cf-connecting-ip", "198.51.100.4"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("cai para x-forwarded-for e não devolve o IP puro", () => {
    const id = identificadorDoCliente(comHeader("x-forwarded-for", "203.0.113.9, 10.0.0.1"));
    expect(id).not.toContain("203.0.113.9");
    expect(id.length).toBeGreaterThan(0);
  });

  it("funciona sem requisição", () => {
    expect(identificadorDoCliente(undefined)).toBe(identificadorDoCliente(null));
  });
});
