/**
 * Validação de URLs de imagem usadas em funções de servidor.
 *
 * As fotos pessoais ficam no bucket privado `user-photos` e chegam ao servidor
 * como URL assinada. Aceitar qualquer URL permitiria que o gateway do provedor
 * buscasse endereços arbitrários (SSRF/abuso). Aqui só passa URL assinada do
 * próprio bucket e da pasta do usuário autenticado.
 */
export function urlDoCofreValida(valor: string, userId: string): boolean {
  try {
    const url = new URL(valor);
    const base = new URL(process.env["SUPABASE_URL"] ?? "");
    if (url.origin !== base.origin) return false;
    if (!url.pathname.startsWith("/storage/v1/object/sign/user-photos/")) return false;
    return url.pathname.includes(`/${userId}/`);
  } catch {
    return false;
  }
}

export const AVISO_URL_INVALIDA = "A foto precisa ser uma imagem privada sua do Aura ID. Envie de novo pela tela do módulo.";
