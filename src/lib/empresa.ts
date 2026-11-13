/**
 * Dados do fornecedor exibidos nos documentos legais (Termos, Privacidade,
 * Reembolso) e no rodapé.
 *
 * Preencher antes de vender: valores entre colchetes aparecem como pendência na
 * própria página e o build não falha (para não travar homologação).
 */
export const EMPRESA = {
  nomeFantasia: "Aura ID",
  razaoSocial: "MEDFLOW STARTUP LTDA",
  documento: "CNPJ 69.392.760/0001-98",
  endereco: "Quadra 204 S, Lote 10, Residencial Portinari, Apto. 502-A — Brasília/DF, CEP 71939-540",
  emailSuporte: "suporte@auraid.app.br",
  emailEncarregado: "privacidade@auraid.app.br",
  foro: "Brasília/DF",
} as const;

/** Versão dos documentos — altere ao revisar o texto. */
export const DOCUMENTOS_VERSAO = "1.2 · 13/11/2026";

/** `true` enquanto houver campo entre colchetes (documento incompleto). */
export const DADOS_DO_FORNECEDOR_PENDENTES = Object.values(EMPRESA).some((valor) => valor.startsWith("["));
