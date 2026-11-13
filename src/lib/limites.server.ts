import { avaliarJanela, mensagemDeLimite, type ResultadoLimite } from "./limites";

/**
 * Limite de uso no servidor (memória do processo).
 *
 * Cobre o abuso trivial (loop de cliques, script repetindo uma ação) sem exigir
 * tabela nova nem migração. Limitação conhecida: em ambiente serverless cada
 * instância tem sua própria memória, então a proteção durável precisa estar na
 * borda — regras de rate limit na Cloudflare/Vercel. Ver
 * MONITORAMENTO-E-LIMITES.md.
 */

const MAX_CHAVES = 5_000;
const janelas = new Map<string, number[]>();

function podar(chave: string, janelaMs: number, agora: number) {
  const lista = janelas.get(chave);
  if (!lista) return [] as number[];
  const dentro = lista.filter((t) => t > agora - janelaMs);
  if (dentro.length) janelas.set(chave, dentro);
  else janelas.delete(chave);
  return dentro;
}

/** Consome uma tentativa da chave; registra quando permitido. */
export function consumirLimite(chave: string, max: number, janelaMs: number): ResultadoLimite {
  const agora = Date.now();
  const lista = podar(chave, janelaMs, agora);
  const resultado = avaliarJanela(lista, agora, max, janelaMs);
  if (resultado.permitido) {
    lista.push(agora);
    janelas.set(chave, lista);
    if (janelas.size > MAX_CHAVES) {
      // Descarta as chaves mais antigas sem varrer o mapa inteiro a cada chamada.
      for (const [k] of janelas) {
        janelas.delete(k);
        if (janelas.size <= MAX_CHAVES) break;
      }
    }
  }
  return resultado;
}

/** Só para testes/diagnóstico. */
export function limparLimites() {
  janelas.clear();
}

/**
 * Identificador estável e não reversível do cliente (IP quando disponível).
 * Guardado apenas em memória; nunca persistido nem devolvido ao navegador.
 */
export function identificadorDoCliente(request: Request | undefined | null): string {
  const headers = request?.headers;
  const bruto =
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-real-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  return hash(curto(bruto || "sem-ip"));
}

function curto(valor: string): string {
  return valor.slice(0, 64);
}

/** FNV-1a — suficiente para agrupar tentativas em memória, não é criptografia. */
function hash(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Resposta amigável com o tempo de espera, para reutilizar nos handlers. */
export function erroDeLimite(resultado: Extract<ResultadoLimite, { permitido: false }>): Error {
  return new Error(mensagemDeLimite(resultado.retryAfterMs));
}
