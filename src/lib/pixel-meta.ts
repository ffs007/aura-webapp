/**
 * Pixel do Meta (opcional, para anúncios/remarketing).
 *
 * Só carrega quando `VITE_META_PIXEL_ID` está definida (ex.: "1234567890").
 * Sem a variável, nada é injetado, nenhuma requisição sai — o app fica igual.
 *
 * Eventos mapeados hoje:
 * - PageView: a mudança de rota (mesma estratégia de history patch da instrumentação);
 * - CompleteRegistration: conta criada com sucesso (src/routes/auth.tsx);
 * - Purchase: checkout do Aura Pass voltou com sucesso (src/routes/_authenticated/aura-pass.tsx).
 *
 * Privacidade: o pixel é da Meta e segue a política dela; aqui só disparamos
 * nomes de evento e valores de plano — nunca dado pessoal do perfil.
 */

type FbqFn = (...args: unknown[]) => void;

type JanelaComPixel = Window & {
  fbq?: FbqFn;
  _fbq?: FbqFn;
  __auraPixelMeta?: boolean;
};

const idPixel = String(import.meta.env["VITE_META_PIXEL_ID"] ?? "").trim();

/** True quando o pixel está configurado e pode carregar. */
export const pixelMetaAtivo = () => idPixel !== "";

/** Dispara um evento padrão do Meta (PageView, CompleteRegistration, Purchase…). */
export function eventoMeta(nome: string, dados: Record<string, unknown> = {}) {
  try {
    if (typeof window === "undefined") return;
    const fbq = (window as JanelaComPixel).fbq;
    fbq?.("track", nome, dados);
  } catch {
    // o pixel nunca quebra o app
  }
}

/** Carrega o fbevents.js e registra o pixel uma única vez por página. */
export function iniciarPixelMeta() {
  if (typeof window === "undefined" || !pixelMetaAtivo()) return;
  const janela = window as JanelaComPixel;
  if (janela.__auraPixelMeta) return;
  janela.__auraPixelMeta = true;
  try {
    // Bootstrap padrão do Meta Pixel: fila local recebe os eventos até o
    // fbevents.js carregar e substituir window.fbq pela versão real.
    const fila = function (...args: unknown[]) {
      const n = janela.fbq as (FbqFn & { callMethod?: FbqFn; queue?: unknown[] }) | undefined;
      if (!n) return;
      if (n.callMethod) n.callMethod(...args);
      else n.queue?.push(args);
    } as FbqFn & { queue: unknown[]; loaded?: boolean; version?: string };
    fila.queue = [];
    fila.loaded = true;
    fila.version = "2.0";
    janela.fbq = fila;
    janela._fbq = fila;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    janela.fbq?.("init", idPixel);
    janela.fbq?.("track", "PageView");

    // SPA: a rota muda sem recarregar — acompanha o histórico como a instrumentação.
    const aoNavegar = () => janela.fbq?.("track", "PageView");
    const { pushState, replaceState } = window.history;
    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const r = pushState.apply(window.history, args);
      aoNavegar();
      return r;
    };
    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      const r = replaceState.apply(window.history, args);
      aoNavegar();
      return r;
    };
    window.addEventListener("popstate", aoNavegar);
  } catch {
    // sem pixel: o app segue igual
  }
}
