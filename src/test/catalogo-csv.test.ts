import { describe, expect, it } from 'vitest';
import { interpretarCsvCatalogo, parsePreco } from '@/lib/catalogo-csv';

describe('interpretador de CSV do catálogo (Fatia B4)', () => {
  it('lê planilha padrão Google Shopping (inglês, aspas e vírgulas no texto)', () => {
    const csv = [
      'id,title,description,link,image link,price,availability,color',
      '1,"Vestido midi preto, crepe","Corte acinturado, forroreto",https://loja.com/vestido,https://loja.com/vestido.jpg,189.90 USD,in stock,preto',
      '2,Blazer bege,,https://loja.com/blazer,https://loja.com/blazer.jpg,249.00 BRL,out of stock,bege',
    ].join('\n');
    const r = interpretarCsvCatalogo(csv);
    expect(r.pecas).toHaveLength(2);
    expect(r.pecas[0]!.titulo).toBe('Vestido midi preto, crepe');
    expect(r.pecas[0]!.preco).toBe(189.9);
    expect(r.pecas[0]!.imagem_url).toBe('https://loja.com/vestido.jpg');
    expect(r.pecas[0]!.ativo).toBe(true);
    expect(r.pecas[1]!.ativo).toBe(false); // out of stock entra pausada
    expect(r.pecas[0]!.categoria).toBe('vestido'); // inferida do título
  });

  it('lê planilha simples PT-BR com ponto-e-vírgula e preço "R$ 1.899,90"', () => {
    const csv = 'titulo;categoria;cor;preco;url;imagem_url\nCalça alfaiataria wide leg;;terracota;R$ 1.899,90;https://loja.com/calsa;https://loja.com/calsa.jpg';
    const r = interpretarCsvCatalogo(csv);
    expect(r.pecas).toHaveLength(1);
    expect(r.pecas[0]!.preco).toBe(1899.9);
    expect(r.pecas[0]!.categoria).toBe('calca');
    expect(r.pecas[0]!.cor).toBe('terracota');
    expect(r.pecas[0]!.tags).toContain('terracota');
  });

  it('pula linhas com link ou preço inválidos e deduplica por URL', () => {
    const csv = [
      'title,link,price',
      'Peça boa,https://loja.com/a,99.90',
      'Sem link,loja.com/b,99.90',
      'Link ruim,https://loja.com/c,grátis',
      'Duplicada,https://loja.com/a,119.90',
    ].join('\n');
    const r = interpretarCsvCatalogo(csv);
    expect(r.pecas).toHaveLength(1);
    expect(r.pecas[0]!.url).toBe('https://loja.com/a');
    expect(r.total).toBe(4);
    expect(r.erros.length).toBeGreaterThan(0);
  });

  it('exige colunas de título, link e preço — senão explica em português', () => {
    const r = interpretarCsvCatalogo('produto;valor\nCamiseta;50');
    expect(r.pecas).toHaveLength(0);
    expect(r.erros[0]).toContain('title');
  });

  it('parsePreco entende os formatos que aparecem no Brasil', () => {
    expect(parsePreco('189.90')).toBe(189.9);
    expect(parsePreco('189,90')).toBe(189.9);
    expect(parsePreco('R$ 1.899,90')).toBe(1899.9);
    expect(parsePreco('49.00 BRL')).toBe(49);
    expect(parsePreco('1.899')).toBe(1899); // milhar com ponto
    expect(parsePreco('')).toBeNull();
    expect(parsePreco('grátis')).toBeNull();
  });
});
