/**
 * Fatia D3 — STENCIL PARA IMPRESSÃO: converte o design em traço preto puro
 * (fundo transparente ou branco) pronto para impressora térmica.
 * Processamento determinístico no navegador: zero custo de IA e fidelidade
 * total ao traço — a IA redesenharia, e molde não pode mudar.
 * (Vetorização real — SVG — fica para uma fase futura.)
 */

/** Limiar de Otsu sobre o histograma de luminância (0-255). */
export function otsu(hist: readonly number[], total: number): number {
  let soma = 0;
  for (let i = 0; i < 256; i++) soma += i * (hist[i] ?? 0);
  let somaB = 0, wB = 0, maxVar = -1, limiar = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t] ?? 0;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    somaB += t * (hist[t] ?? 0);
    const mB = somaB / wB, mF = (soma - somaB) / wF;
    const varEntre = wB * wF * (mB - mF) ** 2;
    if (varEntre > maxVar) { maxVar = varEntre; limiar = t; }
  }
  return limiar;
}

const luminancia = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Aplica o stencil IN PLACE no array RGBA: tinta vira preto puro; o restante
 * vira transparente (ou branco). Detecta a polaridade pela moldura — desenhos
 * branco-no-preto são invertidos automaticamente. Retorna o limiar usado.
 */
export function aplicarStencil(
  px: Uint8ClampedArray,
  w: number,
  h: number,
  fundoBranco: boolean,
  limiarManual?: number,
): { limiar: number; invertido: boolean } {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < px.length; i += 4) {
    const l = Math.round(luminancia(px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0));
    hist[l] = (hist[l] ?? 0) + 1;
  }
  // Polaridade: média da moldura de 1px — o fundo costuma dominar a borda.
  let somaBorda = 0, nBorda = 0;
  const amostrar = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    somaBorda += luminancia(px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0);
    nBorda++;
  };
  for (let x = 0; x < w; x++) { amostrar(x, 0); amostrar(x, h - 1); }
  for (let y = 0; y < h; y++) { amostrar(0, y); amostrar(w - 1, y); }
  const invertido = somaBorda / Math.max(1, nBorda) < 118;
  const limiar = limiarManual ?? otsu(hist, px.length / 4);
  for (let i = 0; i < px.length; i += 4) {
    let l = luminancia(px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0);
    if (invertido) l = 255 - l;
    if (l <= limiar) {
      px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 255; // tinta: preto puro
    } else if (fundoBranco) {
      px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255;
    } else {
      px[i + 3] = 0; // fundo transparente
    }
  }
  return { limiar, invertido };
}
