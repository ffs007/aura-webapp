import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logEvent } from "@/lib/aura";

/**
 * Instrumentação leve do app (Onda 3 · Etapa 2.7).
 *
 * - `iniciarInstrumentacao()` registra, uma vez por página, a tela visitada
 *   (`tela_visualizada`) e erros globais (`erro_tela`). É idempotente e
 *   tolerante a SSR: pode ser chamada repetidas vezes sem duplicar listeners.
 * - `registrarEventoFunil(nome, meta)` é o atalho para marcar passos-chave do
 *   funil na mesma tabela `audit_events` usada pelo `logEvent`.
 *
 * Privacidade: só guardamos o caminho da rota (sem query string) e a mensagem
 * de erro truncada. Nunca vão para o `meta` nome, e-mail, texto de formulário,
 * fotos ou qualquer outro dado pessoal.
 */

const EVENTO_TELA = "tela_visualizada";
const EVENTO_ERRO = "erro_tela";
const DEDUPE_TELA_MS = 5_000;
const DEDUPE_ERRO_MS = 30_000;
const MAX_MENSAGEM = 200;
const MAX_CHAVES = 100;

const telasRecentes = new Map<string, number>();
const errosRecentes = new Map<string, number>();

const agora = () => Date.now();

function pathAtual(): string {
  try {
    return window.location.pathname || "/";
  } catch {
    return "/";
  }
}

/** Mantém os mapas de dedupe pequenos: sem isso eles cresceriam sem limite. */
function limparAntigos(mapa: Map<string, number>, validadeMs: number) {
  if (mapa.size <= MAX_CHAVES) return;
  const limite = agora() - validadeMs;
  for (const [chave, quando] of mapa) if (quando < limite) mapa.delete(chave);
  if (mapa.size <= MAX_CHAVES) return;
  const excedente = [...mapa.entries()].sort((a, b) => a[1] - b[1]).slice(0, mapa.size - MAX_CHAVES);
  for (const [chave] of excedente) mapa.delete(chave);
}

/** Login e consentimento só contam como tela quando já existe sessão. */
function caminhoEhFluxoDeAcesso(path: string) {
  return path === "/auth" || path.startsWith("/auth/") || path === "/consent" || path.startsWith("/consent/");
}

async function temSessao(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

async function enviarTela(path: string) {
  try {
    if (caminhoEhFluxoDeAcesso(path) && !(await temSessao())) return;
    await logEvent(EVENTO_TELA, { path });
  } catch {
    // instrumentação nunca deve quebrar a navegação
  }
}

function registrarTela(path: string) {
  try {
    const quando = agora();
    if (quando - (telasRecentes.get(path) ?? 0) < DEDUPE_TELA_MS) return;
    telasRecentes.set(path, quando);
    limparAntigos(telasRecentes, DEDUPE_TELA_MS);
    void enviarTela(path);
  } catch {
    // nunca lança
  }
}

function textoDoErro(motivo: unknown): string {
  if (typeof motivo === "string") return motivo;
  if (motivo instanceof Error) return motivo.message;
  if (motivo === undefined || motivo === null) return "";
  try {
    return JSON.stringify(motivo);
  } catch {
    return String(motivo);
  }
}

function registrarErro(tipo: "error" | "unhandledrejection", motivo: unknown) {
  try {
    const path = pathAtual();
    const mensagem = textoDoErro(motivo).replace(/\s+/g, " ").trim().slice(0, MAX_MENSAGEM);
    if (!mensagem) return;
    const chave = `${path}|${mensagem}`;
    const quando = agora();
    if (quando - (errosRecentes.get(chave) ?? 0) < DEDUPE_ERRO_MS) return;
    errosRecentes.set(chave, quando);
    limparAntigos(errosRecentes, DEDUPE_ERRO_MS);
    void logEvent(EVENTO_ERRO, { path, tipo, mensagem }).catch(() => {});
  } catch {
    // a captura de erro nunca vira erro
  }
}

function aoErroGlobal(evento: Event) {
  const e = evento as ErrorEvent;
  registrarErro("error", e.message || e.error);
}

function aRejeicaoNaoTratada(evento: PromiseRejectionEvent) {
  registrarErro("unhandledrejection", evento.reason);
}

type JanelaInstrumentada = Window & { __auraInstrumentacao?: boolean };

/**
 * Liga a instrumentação uma única vez por página.
 * Seguro durante SSR (`typeof window === "undefined"` sai sem fazer nada).
 */
export function iniciarInstrumentacao() {
  if (typeof window === "undefined") return;
  const janela = window as JanelaInstrumentada;
  if (janela.__auraInstrumentacao) return;
  janela.__auraInstrumentacao = true;
  try {
    registrarTela(pathAtual());
    const { pushState, replaceState } = window.history;
    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const resultado = pushState.apply(window.history, args);
      registrarTela(pathAtual());
      return resultado;
    };
    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      const resultado = replaceState.apply(window.history, args);
      registrarTela(pathAtual());
      return resultado;
    };
    window.addEventListener("popstate", () => registrarTela(pathAtual()));
    window.addEventListener("error", aoErroGlobal);
    // `onerror` cobre os erros síncronos não tratados; o listener acima é a
    // forma moderna. O dedupe garante um único `erro_tela` por mensagem/30 s.
    const onerrorAnterior = window.onerror;
    window.onerror = function (mensagem, fonte, linha, coluna, erro) {
      registrarErro("error", erro ?? mensagem);
      if (typeof onerrorAnterior === "function") {
        try {
          return onerrorAnterior.call(window, mensagem, fonte, linha, coluna, erro);
        } catch {
          return false;
        }
      }
      return false;
    };
    window.addEventListener("unhandledrejection", aRejeicaoNaoTratada);
  } catch {
    // sem histórico/eventos: o app segue sem instrumentação
  }
}

/**
 * Marca um passo-chave do funil no `audit_events` (mesma tabela do `logEvent`).
 * Use apenas eventos canônicos do funil e nunca inclua dados pessoais no `meta`.
 */
export async function registrarEventoFunil(nome: string, meta: Record<string, Json> = {}) {
  try {
    await logEvent(nome, meta);
  } catch {
    // instrumentação nunca deve quebrar o fluxo principal
  }
}
