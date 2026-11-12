import { describe, expect, it } from "vitest";
import { urlDoCofreValida } from "@/lib/seguranca-imagem";

const UID = "6590a438-277e-4894-8ca8-21d8b991d0e9";
const BASE = "https://oyfqecigqrceijoxggqw.supabase.co";
// O helper lê process.env na hora da chamada; garante a base antes dos testes.
process.env["SUPABASE_URL"] = BASE;

describe("urlDoCofreValida", () => {
  it("aceita URL assinada do bucket privado na pasta do próprio usuário", () => {
    expect(urlDoCofreValida(`${BASE}/storage/v1/object/sign/user-photos/${UID}/modelo-rosto.png?token=abc`, UID)).toBe(true);
  });

  it("recusa domínio diferente (SSRF)", () => {
    expect(urlDoCofreValida(`https://evil.example.com/storage/v1/object/sign/user-photos/${UID}/x.png`, UID)).toBe(false);
  });

  it("recusa bucket público/studio-media", () => {
    expect(urlDoCofreValida(`${BASE}/storage/v1/object/public/studio-media/${UID}/x.png`, UID)).toBe(false);
  });

  it("recusa pasta de outra pessoa", () => {
    expect(urlDoCofreValida(`${BASE}/storage/v1/object/sign/user-photos/outro-usuario/x.png`, UID)).toBe(false);
  });

  it("não quebra com entrada inválida", () => {
    expect(urlDoCofreValida("nao-e-url", UID)).toBe(false);
    expect(urlDoCofreValida("", UID)).toBe(false);
  });
});
