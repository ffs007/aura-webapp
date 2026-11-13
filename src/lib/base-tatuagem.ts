/**
 * Regra da imagem-base das prévias de tatuagem.
 *
 * Bug real (11/2026): pedido de "linha no antebraço esquerdo" saiu no ombro e
 * com a palavra "forever" escrita — porque a geração partia de prompt puro, sem
 * foto. Modelo de imagem não obedece localização só por texto. Por isso a
 * prévia "no corpo" exige uma base real (Meu Modelo ou foto do local) e sai
 * como edição dessa foto.
 */
export type BaseTatuagem = "livre" | "modelo" | "foto" | "nenhuma";

export interface OpcoesBaseTatuagem {
  /** `isolado` é desenho em folha: não precisa de corpo. */
  preview: "no_corpo" | "isolado";
  /** Existe `${userId}/modelo-corpo.png` (Meu Modelo — foto do corpo inteiro). */
  temModeloCorpo: boolean;
  /** O usuário aceitou usar o Meu Modelo como base. */
  usarModelo: boolean;
  /** Existe foto privada do local (`photos.kind = 'tattoo_body'`). */
  temFotoDoLocal: boolean;
}

export function escolherBaseTatuagem(p: OpcoesBaseTatuagem): BaseTatuagem {
  if (p.preview === "isolado") return "livre";
  if (p.temModeloCorpo && p.usarModelo) return "modelo";
  if (p.temFotoDoLocal) return "foto";
  return "nenhuma";
}

export const AVISO_SEM_BASE =
  "Para a prévia sair no SEU corpo, precisamos de uma foto do local da tatuagem — ou do seu Meu Modelo. Sem imagem de referência a IA inventa a região do corpo e pode até escrever algo que você não pediu.";
