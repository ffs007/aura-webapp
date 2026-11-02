import { describe, expect, it } from 'vitest';
import { aplicarStencil, otsu } from '@/lib/stencil';

/** Monta um RGBA de w×h a partir de cores [r,g,b] por pixel. */
function img(w: number, h: number, cor: (x: number, y: number) => [number, number, number]) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = cor(x, y), i = (y * w + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
  return px;
}

describe('stencil para impressão (Fatia D3)', () => {
  it('traço preto no branco: tinta vira preto puro e fundo transparente', () => {
    const px = img(3, 3, (x, y) => (x === 1 && y === 1 ? [0, 0, 0] : [255, 255, 255]));
    const r = aplicarStencil(px, 3, 3, false);
    expect(r.invertido).toBe(false);
    const meio = 4 * (1 * 3 + 1);
    expect([px[meio], px[meio + 1], px[meio + 2], px[meio + 3]]).toEqual([0, 0, 0, 255]); // tinta
    expect(px[3]).toBe(0); // fundo transparente
  });

  it('desenho BRANCO no preto: inverte a polaridade automaticamente pela borda', () => {
    const px = img(3, 3, (x, y) => (x === 1 && y === 1 ? [255, 255, 255] : [0, 0, 0]));
    const r = aplicarStencil(px, 3, 3, false);
    expect(r.invertido).toBe(true);
    const meio = 4 * (1 * 3 + 1);
    expect(px[meio + 3]).toBe(255); // o traço branco virou tinta
    expect(px[meio]).toBe(0);       // ...em preto puro
    expect(px[3]).toBe(0);          // fundo preto virou transparente
  });

  it('modo fundo branco mantém o fundo opaco (bom para visualizar/imprimir direto)', () => {
    const px = img(3, 3, (x, y) => (x === 1 && y === 1 ? [0, 0, 0] : [255, 255, 255]));
    aplicarStencil(px, 3, 3, true);
    expect(px[3]).toBe(255); // fundo branco opaco
  });

  it('Otsu separa histograma bimodal (meio-termo entre picos)', () => {
    const hist = new Array<number>(256).fill(0);
    hist[40] = 100; hist[200] = 100;
    const t = otsu(hist, 200);
    expect(t).toBeGreaterThanOrEqual(40);
    expect(t).toBeLessThan(200);
  });
});
