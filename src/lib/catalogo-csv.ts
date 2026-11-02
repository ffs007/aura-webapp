/**
 * Fatia B4 (v1) — INTERPRETADOR DE CATÁLOGO EM MASSA.
 * Converte CSV de loja (padrão Google Shopping ou planilha simples PT-BR)
 * em peças prontas para o catálogo parceiro. Puro e testável: sem rede, sem banco.
 */

export type LinhaImportada = {
  titulo: string; descricao: string | null; categoria: string; cor: string | null;
  preco: number; url: string; imagem_url: string | null; tags: string[]; ativo: boolean;
};

export type ResultadoCsv = { pecas: LinhaImportada[]; total: number; erros: string[] };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Cabeçalho normalizado (acentos/caixa/espaços fora) → nome canônico nosso. */
const CAMPOS: Record<string, string[]> = {
  titulo: ['titulo', 'title', 'nome', 'item_title'],
  descricao: ['descricao', 'description', 'item_description'],
  categoria: ['categoria', 'product_type', 'tipo', 'category', 'google_product_category'],
  cor: ['cor', 'color', 'colour'],
  preco: ['preco', 'price', 'sale_price', 'preco_venda', 'valor'],
  url: ['url', 'link', 'item_link'],
  imagem_url: ['imagem_url', 'image_link', 'image_url', 'image', 'foto', 'link_imagem'],
  disponibilidade: ['availability', 'disponibilidade', 'estoque'],
};

/** Divide uma linha de CSV respeitando campos entre aspas; delimitador , ou ; (detectado no cabeçalho). */
function parsearLinha(linha: string, delim: string): string[] {
  const out: string[] = [];
  let atual = '', entreAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (entreAspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else entreAspas = !entreAspas;
    } else if (c === delim && !entreAspas) {
      out.push(atual); atual = '';
    } else atual += c;
  }
  out.push(atual);
  return out.map((s) => s.trim());
}

/** "R$ 1.899,90" | "189.90" | "49.00 BRL" | "189,90" → número (ou null se inválido). */
export function parsePreco(bruto: string): number | null {
  const s = bruto.replace(/[^\d.,]/g, '');
  if (!s) return null;
  const temV = s.includes(','), temP = s.includes('.');
  let limpo: string;
  if (temV && temP) limpo = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (temV) limpo = s.replace(',', '.');
  else {
    // só pontos: grupo final de 3 dígitos com mais dígitos antes = separador de milhar ("1.899")
    const partes = s.split('.');
    const ultimo = partes[partes.length - 1] ?? '';
    limpo = partes.length > 1 && ultimo.length === 3 && partes.slice(0, -1).join('').length > 0 ? s.replace(/\./g, '') : s;
  }
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : null;
}

const CATEGORIAS: [RegExp, string][] = [
  [/vestido|midi|maxi|evase/, 'vestido'], [/calca|jeans|wide|pantalona/, 'calca'],
  [/blazer|palet/, 'blazer'], [/blusa|camisa|cropped|regata|\btop\b/, 'blusa'],
  [/saia/, 'saia'], [/short/, 'shorts'], [/jaqueta|casaco|sobretudo|coat/, 'casaco'],
  [/brinco|colar|bolsa|cinto|acessorio|lenco/, 'acessorio'], [/sapato|tenis|sandalia|scarpin|bota|rasteira/, 'calcado'],
];

const inferirCategoria = (titulo: string) => CATEGORIAS.find(([re]) => re.test(norm(titulo)))?.[1] ?? 'peca';

const tagsDe = (titulo: string, cor: string | null, categoria: string) => {
  const palavras = norm(titulo).split(/[^a-z0-9]+/).filter((p) => p.length >= 4);
  return [...new Set([cor ? norm(cor) : '', categoria, ...palavras].filter(Boolean))].slice(0, 8);
};

const MAX_LINHAS = 500;

/** CSV completo → peças normalizadas (dedupe por URL dentro do arquivo). */
export function interpretarCsvCatalogo(csv: string): ResultadoCsv {
  const erros: string[] = [];
  const linhas = csv.replace(/\r/g, '').split('\n').filter((l) => l.trim().length > 0);
  if (linhas.length < 2) return { pecas: [], total: 0, erros: ['CSV vazio ou sem linhas de dados.'] };
  const cab = linhas[0] ?? '';
  const delim = (cab.split(';').length > cab.split(',').length ? ';' : ',');
  const colunas = parsearLinha(cab, delim).map((h) => norm(h).replace(/[^a-z0-9]+/g, '_'));
  const idx = (campo: string) => colunas.findIndex((c) => CAMPOS[campo]?.includes(c) ?? false);
  const iTitulo = idx('titulo'), iUrl = idx('url'), iPreco = idx('preco');
  if (iTitulo < 0 || iUrl < 0 || iPreco < 0) {
    return { pecas: [], total: 0, erros: ['Colunas necessárias não encontradas. Precisamos de: título (title), link (url) e preço (price). Padrão Google Shopping funciona direto.'] };
  }
  const iDescricao = idx('descricao'), iCategoria = idx('categoria'), iCor = idx('cor'), iImagem = idx('imagem_url'), iDisp = idx('disponibilidade');
  const pecas: LinhaImportada[] = [];
  const vistas = new Set<string>();
  let total = 0;
  for (const linha of linhas.slice(1, MAX_LINHAS + 1)) {
    total++;
    const c = parsearLinha(linha, delim);
    const titulo = (c[iTitulo] ?? '').slice(0, 160).trim();
    const url = (c[iUrl] ?? '').trim();
    const preco = parsePreco(c[iPreco] ?? '');
    if (!titulo || !/^https?:\/\/.+/i.test(url) || preco === null) {
      if (erros.length < 5) erros.push(`Linha ${total} ignorada (título, link https ou preço inválidos).`);
      continue;
    }
    if (vistas.has(url)) continue;
    vistas.add(url);
    const cor = iCor >= 0 ? (c[iCor] ?? '').slice(0, 40).trim() || null : null;
    const categoria = (iCategoria >= 0 ? (c[iCategoria] ?? '').trim() : '').split('>').pop()!.trim();
    const catFinal = (categoria ? norm(categoria).slice(0, 60) : inferirCategoria(titulo)) || 'peca';
    const disp = iDisp >= 0 ? norm(c[iDisp] ?? '') : '';
    const imagem = iImagem >= 0 ? (c[iImagem] ?? '').trim() : '';
    pecas.push({
      titulo,
      descricao: iDescricao >= 0 && (c[iDescricao] ?? '').trim() ? (c[iDescricao] ?? '').slice(0, 600).trim() : null,
      categoria: catFinal,
      cor,
      preco,
      url: url.slice(0, 500),
      imagem_url: imagem && /^https?:\/\/.+/i.test(imagem) ? imagem.slice(0, 500) : null,
      tags: tagsDe(titulo, cor, catFinal),
      ativo: disp ? /in stock|disponivel|em estoque|instock/.test(disp) : true,
    });
  }
  if (linhas.length - 1 > MAX_LINHAS) erros.push(`Importamos as primeiras ${MAX_LINHAS} linhas deste arquivo.`);
  return { pecas, total, erros };
}
