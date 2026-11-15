/**
 * Detecta imagem "vazia" (preto/branco chapado ou totalmente transparente).
 *
 * Correção 2026-11-15: quando o provedor de imagem filtra o prompt, ele devolve
 * sucesso com um PNG preto 1024×768 em vez de erro — e o webapp salvava isso
 * como se fosse a referência da usuária ("agora a imagem é gerada com um quadro
 * preto"). Agora a imagem é conferida antes de ir para o armazenamento.
 */

/** Amostra RGBA de uma imagem pequena: sem variação de luz = vazia. */
export function amostraVazia(rgba: Uint8ClampedArray | number[], tolerancia = 6): boolean {
  let minimo = 255;
  let maximo = 0;
  let visiveis = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const alfa = Number(rgba[i + 3]);
    if (alfa < 8) continue; // transparente não conta como conteúdo
    visiveis += 1;
    const luz = 0.2126 * Number(rgba[i]) + 0.7152 * Number(rgba[i + 1]) + 0.0722 * Number(rgba[i + 2]);
    if (luz < minimo) minimo = luz;
    if (luz > maximo) maximo = luz;
  }
  if (visiveis === 0) return true; // tudo transparente
  return maximo - minimo < tolerancia;
}

/** Confere no navegador, antes de salvar. Falha de decodificação não bloqueia a geração. */
export async function imagemVazia(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(blob);
    const lado = 32;
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(bitmap, 0, 0, lado, lado);
    bitmap.close?.();
    return amostraVazia(ctx.getImageData(0, 0, lado, lado).data);
  } catch {
    return false;
  }
}
