/**
 * Dados do fornecedor exibidos nos documentos legais (Termos, Privacidade,
 * Reembolso) e no rodapé.
 *
 * Preencher antes de vender: valores entre colchetes aparecem como pendência na
 * própria página e o build não falha (para não travar homologação).
 */
export const EMPRESA = {
  nomeFantasia: "Aura ID",
  razaoSocial: "[RAZÃO SOCIAL / NOME COMPLETO]",
  documento: "[CNPJ ou CPF]",
  endereco: "[ENDEREÇO COMPLETO — cidade/UF/CEP]",
  emailSuporte: "[E-MAIL DE SUPORTE]",
  emailEncarregado: "[E-MAIL DO ENCARREGADO DE DADOS]",
  foro: "[COMARCA]",
} as const;

/** Versão dos documentos — altere ao revisar o texto. */
export const DOCUMENTOS_VERSAO = "1.0 · 13/11/2026";

/** `true` enquanto houver campo entre colchetes (documento incompleto). */
export const DADOS_DO_FORNECEDOR_PENDENTES = Object.values(EMPRESA).some((valor) => valor.startsWith("["));
