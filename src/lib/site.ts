/**
 * Domínio público do Aura ID (registrado em 11/2026).
 *
 * O app é servido em `auraid.app.br`; previews/homologação sobrescrevem a base
 * com `VITE_APP_URL` (ver `.env.example`) sem tocar no código.
 */
export const DOMINIO_OFICIAL = "https://auraid.app.br";

/** Base absoluta do site, sem barra no fim. */
export function urlDoSite(): string {
  const bruto = String(import.meta.env["VITE_APP_URL"] ?? "").trim();
  const base = /^https?:\/\//i.test(bruto) ? bruto : DOMINIO_OFICIAL;
  return base.replace(/\/+$/, "");
}

/** URL absoluta de um caminho interno — usada em canonical, og:url e og:image. */
export function urlAbsoluta(caminho = "/"): string {
  const limpo = caminho.trim();
  if (!limpo || limpo === "/") return `${urlDoSite()}/`;
  return `${urlDoSite()}${limpo.startsWith("/") ? limpo : `/${limpo}`}`;
}

/** Caminho da arte de compartilhamento (1200×630) servida em `public/`. */
export const IMAGEM_COMPARTILHAMENTO = "/og-aura-id.png";
