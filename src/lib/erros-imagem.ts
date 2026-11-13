/**
 * Mensagens de erro da geração de imagem em PT-BR.
 *
 * O provedor de imagem (gateway/fal) devolve erros crus como
 * "Provedor de imagem respondeu 403: {"detail":"User is locked. Reason: TOP_UP."}".
 * Isso não deve chegar à pessoa: traduzimos para algo acionável e sem detalhe técnico.
 */
export function mensagemDeImagemAmigavel(texto: string | null | undefined): string {
  const bruto = String(texto ?? "").trim();
  const t = bruto.toLowerCase();
  if (/top_up|top up|user is locked|locked|insufficient funds|payment required|sem saldo|sem cr[ée]dito/.test(t)) {
    return "A geração de imagem está temporariamente indisponível porque o provedor está sem créditos. Tente de novo mais tarde — nada do que você fez foi perdido.";
  }
  if (/permiss[ãa]o para imagens|consent|permission/.test(t)) {
    return "Permissão para imagens desativada. Ative as permissões em Configurações e tente de novo.";
  }
  if (/timeout|timed out|demorou/.test(t)) {
    return "A geração demorou mais que o normal e foi interrompida. Tente de novo em instantes.";
  }
  if (!bruto) return "Não foi possível gerar a imagem agora. Tente de novo.";
  return bruto.length > 280 ? "Não foi possível gerar a imagem agora. Tente de novo em instantes." : bruto;
}
