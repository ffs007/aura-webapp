import { describe, expect, it } from "vitest";
import { mensagemSenhaFraca, traduzErroAuth } from "@/lib/erros-auth";

// Mensagens capturadas da produção (Supabase auth, nov/2026).
const MSG_PWNED = "Password is known to be weak and easy to guess, please choose a different one.";
const MSG_POLITICA =
  "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789. Password is known to be weak and easy to guess, please choose a different one.";

describe("traduzErroAuth", () => {
  it("explica senha vazada (pwned) — era o erro genérico que o usuário via", () => {
    const r = traduzErroAuth(MSG_PWNED);
    expect(r).toContain("vazamentos");
    expect(r).not.toContain("Algo deu errado");
  });

  it("explica a política de caracteres quando a mensagem é combinada", () => {
    const r = traduzErroAuth(MSG_POLITICA);
    expect(r).toContain("maiúscula");
    expect(r).toContain("8 caracteres");
  });

  it("traduz credenciais inválidas, e-mail já registrado e rate limit", () => {
    expect(traduzErroAuth("Invalid login credentials")).toContain("incorretos");
    expect(traduzErroAuth("User already registered")).toContain("já tem conta");
    expect(traduzErroAuth("For security purposes, you can only request this after 60 seconds")).toContain("Muitas tentativas");
  });

  it("traduz falha de envio de e-mail (SMTP) sem expor detalhe técnico", () => {
    const r = traduzErroAuth("Error sending confirmation email");
    expect(r).toContain("Não conseguimos enviar o e-mail");
  });

  it("mantém o fallback da rota para erro desconhecido", () => {
    expect(traduzErroAuth("algum erro novo")).toBe("Algo deu errado. Tente novamente.");
    expect(traduzErroAuth("algum erro novo", "Não foi possível salvar a senha agora. Tente novamente."))
      .toBe("Não foi possível salvar a senha agora. Tente novamente.");
  });
});

describe("mensagemSenhaFraca", () => {
  it("aceita senha que cumpre a política do projeto", () => {
    expect(mensagemSenhaFraca("LilianDiag1")).toBeNull();
  });

  it("aponta exatamente o que falta", () => {
    expect(mensagemSenhaFraca("abc12345")).toContain("maiúscula");
    expect(mensagemSenhaFraca("ABCD1234")).toContain("minúscula");
    expect(mensagemSenhaFraca("Abcdefgh")).toContain("número");
    expect(mensagemSenhaFraca("Ab1")).toContain("8 caracteres");
  });
});
