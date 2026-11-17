import { describe, expect, it } from "vitest";
import { destinoSeguro } from "@/lib/navegacao";

describe("destinoSeguro — antirredirecionamento aberto (regressão Mimosa)", () => {
  it("aceita apenas caminhos internos do próprio app", () => {
    expect(destinoSeguro("/dashboard")).toBe("/dashboard");
    expect(destinoSeguro("/roupas/look/123?batch=abc")).toBe("/roupas/look/123?batch=abc");
    expect(destinoSeguro("/p/maria-souza")).toBe("/p/maria-souza");
  });

  it("rejeita URLs externas e protocolo-relativas", () => {
    expect(destinoSeguro("https://evil.com")).toBeNull();
    expect(destinoSeguro("http://evil.com/phish")).toBeNull();
    expect(destinoSeguro("//evil.com")).toBeNull();
    expect(destinoSeguro("evil.com")).toBeNull();
  });

  it("rejeita o bypass clássico de barra invertida (virava //evil.com no navegador)", () => {
    expect(destinoSeguro("/\\evil.com")).toBeNull();
    expect(destinoSeguro("/\\/\\evil.com")).toBeNull();
    expect(destinoSeguro("/dashboard\\?x=1")).toBeNull();
  });

  it("rejeita esquemas embutidos e entradas não-string", () => {
    expect(destinoSeguro("data:text/html,<script>1</script>")).toBeNull();
    expect(destinoSeguro("")).toBeNull();
    expect(destinoSeguro(null)).toBeNull();
    expect(destinoSeguro(42)).toBeNull();
    expect(destinoSeguro({ x: 1 })).toBeNull();
  });
});
