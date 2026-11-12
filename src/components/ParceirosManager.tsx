import { useEffect, useState } from 'react';
import { LoaderCircle, Pencil, Plus, Star, Store, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EstadoErro, EstadoVazio, EsqueletoLista } from '@/components/estados';
import { CARTAO_COMPACTO, CARTAO_DESTAQUE, TITULO_SECAO } from '@/lib/design';
import {
  listarCatalogoAdmin, salvarLoja, excluirLoja, salvarProduto, excluirProduto, importarCatalogo,
  type LojaAdmin, type ProdutoAdmin,
} from '@/lib/admin.functions';

const FORM_PECA_VAZIO = {
  id: undefined as string | undefined, loja_id: '', titulo: '', descricao: '', categoria: '',
  cor: '', preco: '', url: '', imagem_url: '', tags: '', prioridade: false, ativo: true,
};

/** "1 peça" / "2 peças" — evita o feio "peça(s)". */
const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`;

/**
 * Guarda-Roupa Real — painel de administração (Fatia B2+, PLANO-EXPANSAO):
 * lojas parceiras e peças que casam com os looks gerados.
 * ⭐ = patrocinada (prioridade) — o espaço que a loja paga para ocupar (Premissa 2).
 */
export function ParceirosManager() {
  const listar = useServerFn(listarCatalogoAdmin);
  const salvarLojaFn = useServerFn(salvarLoja), excluirLojaFn = useServerFn(excluirLoja);
  const salvarPecaFn = useServerFn(salvarProduto), excluirPecaFn = useServerFn(excluirProduto), importarFn = useServerFn(importarCatalogo);
  const [lojas, setLojas] = useState<LojaAdmin[] | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [formLoja, setFormLoja] = useState({ id: undefined as string | undefined, nome: '', site_url: '', ativo: true });
  const [formPeca, setFormPeca] = useState(FORM_PECA_VAZIO);
  const [salvandoL, setSalvandoL] = useState(false);
  const [salvandoP, setSalvandoP] = useState(false);
  const [ocupado, setOcupado] = useState('');
  const [csv, setCsv] = useState('');
  const [lojaCsv, setLojaCsv] = useState('');
  const [lojaNovaCsv, setLojaNovaCsv] = useState('');
  const [importando, setImportando] = useState(false);
  const [resImport, setResImport] = useState('');

  async function importarCsvUI() {
    setImportando(true); setResImport('');
    try {
      const r = await importarFn({ data: { csv, ...(lojaCsv ? { loja_id: lojaCsv } : { loja_nova: lojaNovaCsv.trim() }) } });
      setResImport(`✅ ${plural(r.criadas, 'peça importada', 'peças importadas')} · ${plural(r.puladas, 'pulada', 'puladas')} por já existirem${r.erros.length ? ` · ⚠️ ${r.erros.join(' · ')}` : ''}`);
      toast.success(`${plural(r.criadas, 'peça no catálogo', 'peças no catálogo')}!`);
      setCsv('');
      await carregar();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível importar.'); } finally { setImportando(false); }
  }

  async function carregar() {
    setErroCarga(false);
    try { setLojas(await listar()); } catch { setErroCarga(true); setLojas([]); }
  }

  useEffect(() => { void carregar(); }, []);

  async function salvarLojaUI() {
    setSalvandoL(true);
    try {
      await salvarLojaFn({ data: {
        ...(formLoja.id ? { id: formLoja.id } : {}),
        nome: formLoja.nome.trim(), site_url: formLoja.site_url.trim() || undefined, ativo: formLoja.ativo,
      } });
      toast.success(formLoja.id ? 'Loja atualizada!' : 'Loja criada!');
      setFormLoja({ id: undefined, nome: '', site_url: '', ativo: true });
      await carregar();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSalvandoL(false); }
  }

  async function salvarPecaUI() {
    const preco = Number(formPeca.preco.replace(',', '.'));
    if (!formPeca.loja_id) return toast.error('Escolha a loja da peça.');
    if (!(preco > 0)) return toast.error('Preço inválido — use números, ex.: 189.90');
    setSalvandoP(true);
    try {
      await salvarPecaFn({ data: {
        ...(formPeca.id ? { id: formPeca.id } : {}),
        loja_id: formPeca.loja_id, titulo: formPeca.titulo.trim(),
        descricao: formPeca.descricao.trim() || undefined,
        categoria: formPeca.categoria.trim(), cor: formPeca.cor.trim() || undefined,
        preco, url: formPeca.url.trim(), imagem_url: formPeca.imagem_url.trim() || undefined,
        tags: formPeca.tags.split(',').map((t) => t.trim()).filter(Boolean),
        prioridade: formPeca.prioridade, ativo: formPeca.ativo,
      } });
      toast.success(formPeca.id ? 'Peça atualizada!' : 'Peça adicionada ao catálogo!');
      setFormPeca(FORM_PECA_VAZIO);
      await carregar();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSalvandoP(false); }
  }

  /** Quick-toggle (⭐ patrocínio / pausar) reaproveita o update completo da peça. */
  async function alternarPeca(p: ProdutoAdmin, campo: 'prioridade' | 'ativo') {
    setOcupado(p.id);
    try {
      await salvarPecaFn({ data: {
        id: p.id, loja_id: p.loja_id, titulo: p.titulo, descricao: p.descricao ?? undefined,
        categoria: p.categoria, cor: p.cor ?? undefined, preco: p.preco, url: p.url,
        imagem_url: p.imagem_url ?? undefined, tags: p.tags,
        prioridade: campo === 'prioridade' ? !(p.prioridade > 0) : (p.prioridade > 0),
        ativo: campo === 'ativo' ? !p.ativo : p.ativo,
      } });
      await carregar();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível alterar.'); } finally { setOcupado(''); }
  }

  function editarPeca(p: ProdutoAdmin) {
    setFormPeca({ id: p.id, loja_id: p.loja_id, titulo: p.titulo, descricao: p.descricao ?? '', categoria: p.categoria, cor: p.cor ?? '', preco: String(p.preco), url: p.url, imagem_url: p.imagem_url ?? '', tags: p.tags.join(', '), prioridade: p.prioridade > 0, ativo: p.ativo });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className={TITULO_SECAO}>🛍️ Catálogo parceiro (Guarda-Roupa Real)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lojas e peças que aparecem nas sugestões de roupa das clientes. Peça ⭐ <strong>patrocinada</strong> vem primeiro — é o espaço que a loja paga para ocupar.</p>
      </div>

      <details className={`space-y-3 ${CARTAO_DESTAQUE}`}>
        <summary className="cursor-pointer text-sm font-medium">📥 Importar catálogo em massa (CSV da loja)</summary>
        <p className="text-xs text-muted-foreground">A planilha que a loja já usa no Google Shopping entra direto (colunas title, link, price, image link…). Planilha simples também: título, categoria, cor, preço, url, imagem_url, tags. Peças com o mesmo link são puladas — pode importar de novo sem medo.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select aria-label="Loja do CSV" className="rounded-md border bg-background p-2 text-sm" value={lojaCsv} onChange={(e) => setLojaCsv(e.target.value)}>
            <option value="">Nova loja…</option>
            {lojas?.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          {!lojaCsv && <Input aria-label="Nome da nova loja" placeholder="Nome da nova loja" value={lojaNovaCsv} onChange={(e) => setLojaNovaCsv(e.target.value)} />}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Upload className="size-4" />
          Escolher arquivo .csv do computador
          <input type="file" aria-label="Escolher arquivo CSV do catálogo" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => {
            const arq = e.target.files?.[0];
            if (!arq) return;
            const fr = new FileReader();
            fr.onload = () => setCsv(String(fr.result ?? ''));
            fr.readAsText(arq);
          }} />
        </label>
        <Textarea aria-label="CSV colado" rows={5} className="font-mono text-xs" placeholder={'Ou cole aqui:\ntitle,link,price,image link\nVestido midi preto,https://loja.com.br/vestido,189.90,https://loja.com.br/vestido.jpg'} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={importando || csv.trim().length < 10 || (!lojaCsv && lojaNovaCsv.trim().length < 2)} onClick={() => void importarCsvUI()}>
            {importando ? <LoaderCircle className="size-4 animate-spin" /> : null}Importar
          </Button>
          {resImport && <p className="text-xs text-muted-foreground">{resImport}</p>}
        </div>
      </details>

      <div className={`space-y-3 ${CARTAO_COMPACTO}`}>
        <p className="text-sm font-medium">{formLoja.id ? '✏️ Editando loja' : '➕ Nova loja'}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Nome da loja" placeholder="Nome da loja (ex.: C&A)" value={formLoja.nome} onChange={(e) => setFormLoja({ ...formLoja, nome: e.target.value })} />
          <Input aria-label="Site da loja" placeholder="Site (https://…) — opcional" value={formLoja.site_url} onChange={(e) => setFormLoja({ ...formLoja, site_url: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formLoja.ativo} onChange={(e) => setFormLoja({ ...formLoja, ativo: e.target.checked })} /> Loja ativa (visível nas sugestões)</label>
        <div className="flex gap-2">
          <Button size="sm" disabled={salvandoL || formLoja.nome.trim().length < 2} onClick={() => void salvarLojaUI()}>
            {salvandoL ? <LoaderCircle className="size-4 animate-spin" /> : null}{formLoja.id ? 'Salvar alterações' : 'Criar loja'}
          </Button>
          {formLoja.id && <Button size="sm" variant="outline" onClick={() => setFormLoja({ id: undefined, nome: '', site_url: '', ativo: true })}>Cancelar</Button>}
        </div>
      </div>

      <div className={`space-y-3 ${CARTAO_COMPACTO}`}>
        <p className="text-sm font-medium">{formPeca.id ? '✏️ Editando peça' : '➕ Nova peça'}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select aria-label="Loja da peça" className="rounded-md border bg-background p-2 text-sm" value={formPeca.loja_id} onChange={(e) => setFormPeca({ ...formPeca, loja_id: e.target.value })}>
            <option value="">Loja…</option>
            {lojas?.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <Input aria-label="Título" placeholder="Título (ex.: Vestido midi preto)" value={formPeca.titulo} onChange={(e) => setFormPeca({ ...formPeca, titulo: e.target.value })} />
          <Input aria-label="Categoria" placeholder="Categoria (ex.: vestido, blazer, calça)" value={formPeca.categoria} onChange={(e) => setFormPeca({ ...formPeca, categoria: e.target.value })} />
          <Input aria-label="Cor" placeholder="Cor (ex.: preto, terracota)" value={formPeca.cor} onChange={(e) => setFormPeca({ ...formPeca, cor: e.target.value })} />
          <Input aria-label="Preço" placeholder="Preço (ex.: 189.90)" inputMode="decimal" value={formPeca.preco} onChange={(e) => setFormPeca({ ...formPeca, preco: e.target.value })} />
          <Input aria-label="Link do produto" placeholder="Link do produto (https://…)" value={formPeca.url} onChange={(e) => setFormPeca({ ...formPeca, url: e.target.value })} />
          <Input aria-label="Imagem" placeholder="URL da imagem (opcional)" value={formPeca.imagem_url} onChange={(e) => setFormPeca({ ...formPeca, imagem_url: e.target.value })} />
          <Input aria-label="Tags" placeholder="Tags por vírgula (preto, festa, midi)" value={formPeca.tags} onChange={(e) => setFormPeca({ ...formPeca, tags: e.target.value })} />
        </div>
        <Textarea aria-label="Descrição" placeholder="Descrição curta (opcional)" value={formPeca.descricao} onChange={(e) => setFormPeca({ ...formPeca, descricao: e.target.value })} />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formPeca.prioridade} onChange={(e) => setFormPeca({ ...formPeca, prioridade: e.target.checked })} /> ⭐ Patrocinada (aparece primeiro)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formPeca.ativo} onChange={(e) => setFormPeca({ ...formPeca, ativo: e.target.checked })} /> Peça ativa</label>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={salvandoP || formPeca.titulo.trim().length < 2 || !formPeca.loja_id} onClick={() => void salvarPecaUI()}>
            {salvandoP ? <LoaderCircle className="size-4 animate-spin" /> : null}{formPeca.id ? 'Salvar alterações' : 'Adicionar peça'}
          </Button>
          {formPeca.id && <Button size="sm" variant="outline" onClick={() => setFormPeca(FORM_PECA_VAZIO)}>Cancelar</Button>}
        </div>
      </div>

      {erroCarga && <EstadoErro titulo="Não foi possível carregar o catálogo" onTentarNovamente={() => void carregar()} />}
      {lojas === null && !erroCarga && <EsqueletoLista itens={2} colunas={2} altura="h-32" />}
      {lojas?.length === 0 && (
        <EstadoVazio
          compacto
          icone={<Store className="size-5" />}
          titulo="Nenhuma loja ainda"
          descricao="Cadastre a primeira loja no formulário acima para as peças aparecerem nas sugestões das clientes."
          acoes={<Button size="sm" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cadastrar primeira loja</Button>}
        />
      )}
      {lojas?.map((l) => (
        <article key={l.id} className={`space-y-3 ${CARTAO_COMPACTO}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{l.nome} {!l.ativo && <span className="text-xs text-muted-foreground">· ⏸️ pausada</span>}</p>
              <p className="text-xs text-muted-foreground">{plural(l.produtos.length, 'peça', 'peças')}{l.site_url ? ` · ${l.site_url}` : ''}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" aria-label="Editar loja" title="Editar loja" onClick={() => { setFormLoja({ id: l.id, nome: l.nome, site_url: l.site_url ?? '', ativo: l.ativo }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil className="size-4" /></Button>
              <Button size="sm" variant="outline" aria-label="Excluir loja" title="Excluir loja" onClick={() => { if (confirm(`Excluir ${l.nome} e suas ${plural(l.produtos.length, 'peça', 'peças')}?`)) void excluirLojaFn({ data: { id: l.id } }).then(carregar).catch((e) => toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.')); }}><Trash2 className="size-4" /></Button>
              <Button size="sm" title="Nova peça nesta loja" onClick={() => { setFormPeca({ ...FORM_PECA_VAZIO, loja_id: l.id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Plus className="size-4" /> Peça</Button>
            </div>
          </div>
          {l.produtos.length > 0 && (
            <ul className="divide-y rounded-md border">
              {l.produtos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.prioridade > 0 && <span title="Patrocinada" className="mr-1 text-accent">⭐</span>}{p.titulo} {!p.ativo && <span className="text-xs text-muted-foreground">· ⏸️</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.categoria}{p.cor ? ` · ${p.cor}` : ''} · R$ {p.preco.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={ocupado === p.id} aria-label={p.prioridade > 0 ? 'Remover patrocínio' : 'Marcar como patrocinada'} title={p.prioridade > 0 ? 'Remover patrocínio' : 'Marcar como patrocinada'} onClick={() => void alternarPeca(p, 'prioridade')}><Star className={`size-4 ${p.prioridade > 0 ? 'fill-accent text-accent' : ''}`} /></Button>
                    <Button size="sm" variant="ghost" disabled={ocupado === p.id} aria-label={p.ativo ? 'Pausar peça' : 'Reativar peça'} title={p.ativo ? 'Pausar peça' : 'Reativar peça'} onClick={() => void alternarPeca(p, 'ativo')}>{p.ativo ? '⏸️' : '▶️'}</Button>
                    <Button size="sm" variant="ghost" aria-label="Editar peça" title="Editar peça" onClick={() => editarPeca(p)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" aria-label="Excluir peça" title="Excluir peça" onClick={() => { if (confirm(`Excluir "${p.titulo}"?`)) void excluirPecaFn({ data: { id: p.id } }).then(carregar).catch((e) => toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.')); }}><Trash2 className="size-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
