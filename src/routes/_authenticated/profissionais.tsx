import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Inbox, LoaderCircle, Palette, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { createCheckout, proStatus, AURA_PRO_PRECO } from '@/lib/stripe.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Confirm } from '@/components/Confirm';
import { Aviso, CabecalhoPagina, CarregandoInline, Cartao, EstadoVazio } from '@/components/estados';
import { CARTAO_COMPACTO } from '@/lib/design';
import { cn } from '@/lib/utils';
import { aplicarStencil } from '@/lib/stencil';
import { meusBriefings, salvarProfissional, briefingsRecebidos, responderBriefing, sugerirComIA, listarTodosProfissionais, type BriefingRecebido, type ProfissionalBusca } from '@/lib/profissionais.functions';
import { meusDesigns, publicarDesign, excluirDesign, ESTILOS_VITRINE, type MeuDesign } from '@/lib/vitrine.functions';

export const Route = createFileRoute('/_authenticated/profissionais')({
  head: () => ({ meta: [{ title: 'Profissionais · Aura ID' }] }),
  component: Page,
});

const PROFISSOES: [string, string][] = [
  ['cabeleireira', 'Cabelo'], ['maquiadora', 'Maquiagem'], ['tatuadora', 'Tatuagem'],
  ['esteticista', 'Estética'], ['barbeiro', 'Barbearia'], ['manicure', 'Manicure'],
];
const ROTULO_PROFISSAO = new Map(PROFISSOES);

type Envio = { id: string; titulo: string; texto: string; modulo: string | null; status: string; resposta: string | null; created_at: string; faz: boolean | null; orcamento_valor: number | null; orcamento_prazo: string | null; profissional: { nome: string; nome_salao: string | null; whatsapp: string | null } | null; sugestoes: { texto: string; image_url: string }[] };

function Page() {
  const meus = useServerFn(meusBriefings), salvar = useServerFn(salvarProfissional), recebidosFn = useServerFn(briefingsRecebidos), responder = useServerFn(responderBriefing), sugerir = useServerFn(sugerirComIA);
  const designsFn = useServerFn(meusDesigns), publicarFn = useServerFn(publicarDesign), excluirDesignFn = useServerFn(excluirDesign);
  const [sugestaoTexto, setSugestaoTexto] = useState('');
  const [sugerindo, setSugerindo] = useState('');
  const checkoutPro = useServerFn(createCheckout), statusPro = useServerFn(proStatus);
  const [proAtivo, setProAtivo] = useState(false);
  const [proPaywall, setProPaywall] = useState(false);
  const [assinando, setAssinando] = useState(false);
  useEffect(() => { statusPro().then((r) => setProAtivo(r.active)).catch(() => {}); }, []);

  /** 💰 Plano Profissional: assinatura mensal c/ sugestões de IA ilimitadas. */
  async function assinarPro() {
    setAssinando(true);
    try {
      const url = await checkoutPro({ data: { app_url: window.location.origin, plano: 'pro' } });
      window.location.href = url;
    } catch (e) { toast.error('Não foi possível iniciar o pagamento do Plano Profissional. Tente de novo.'); setAssinando(false); }
  }
  const [aba, setAba] = useState<'buscar' | 'envios' | 'recebidos' | 'cadastro' | 'vitrine'>('buscar');
  const [envios, setEnvios] = useState<Envio[] | null>(null);
  const [recebidos, setRecebidos] = useState<BriefingRecebido[] | null>(null);
  const [profissionais, setProfissionais] = useState<ProfissionalBusca[] | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroProfissao, setFiltroProfissao] = useState('');
  const listarTodos = useServerFn(listarTodosProfissionais);
  const [respondendo, setRespondendo] = useState("");
  const [respostaForm, setRespostaForm] = useState<{ valor: string; prazo: string; obs: string }>({ valor: '', prazo: '', obs: '' });
  const [salvando, setSalvando] = useState(false);
  const [meuLink, setMeuLink] = useState("");
  const [designs, setDesigns] = useState<MeuDesign[] | null>(null);
  const [formV, setFormV] = useState({ titulo: "", estilo: "fine line", tamanho: "", local: "", descricao: "", ativo: true });
  const [arquivoV, setArquivoV] = useState<File | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [vitrineErr, setVitrineErr] = useState("");
  const [stencil, setStencil] = useState<{ design: MeuDesign; nivel: number | "auto"; fundoBranco: boolean; url: string; invertido: boolean } | null>(null);
  const [stencilErr, setStencilErr] = useState("");

  /** Fatia D3 — versão pra impressão (stencil): traço preto puro, processado no navegador (sem custo de IA). */
  async function processarStencil(d: MeuDesign, nivel: number | "auto", fundoBranco: boolean) {
    setStencilErr("");
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("Não foi possível carregar a imagem do design. Tente de novo."));
        im.src = d.imagem_url;
      });
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx || !c.width) throw new Error("Não foi possível processar esta imagem. Tente outro arquivo.");
      ctx.drawImage(img, 0, 0);
      const dados = ctx.getImageData(0, 0, c.width, c.height);
      const r = aplicarStencil(dados.data, c.width, c.height, fundoBranco, nivel === "auto" ? undefined : nivel);
      ctx.putImageData(dados, 0, 0);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
      if (!blob) throw new Error("Não foi possível gerar o arquivo do stencil. Tente de novo.");
      const url = URL.createObjectURL(blob);
      setStencil((s) => { if (s?.url) URL.revokeObjectURL(s.url); return { design: d, nivel, fundoBranco, url, invertido: r.invertido }; });
    } catch (e) { setStencilErr(e instanceof Error && /^(Não foi possível)/.test(e.message) ? e.message : "Não foi possível gerar o stencil. Tente de novo."); }
  }

  function baixarStencil() {
    if (!stencil) return;
    const a = document.createElement("a");
    a.href = stencil.url;
    a.download = `stencil-${stencil.design.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
    a.click();
  }

  async function carregarDesigns() {
    try { setDesigns(await designsFn()); } catch { setDesigns([]); }
  }

  /** Fatia D1 — publica um design: upload no bucket público studio-media + registro. */
  async function publicarDesignUI() {
    setVitrineErr(""); setPublicando(true);
    try {
      if (!arquivoV) return setVitrineErr("Escolha a imagem do design.");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setVitrineErr("Entre na sua conta.");
      const caminho = `${u.user.id}/design-${Date.now()}`;
      const up = await supabase.storage.from("studio-media").upload(caminho, arquivoV, { contentType: arquivoV.type || "image/png" });
      if (up.error) throw new Error("Não foi possível enviar a imagem do design. Tente de novo.");
      const pub = supabase.storage.from("studio-media").getPublicUrl(caminho);
      await publicarFn({ data: {
        titulo: formV.titulo, estilo: formV.estilo || undefined, tamanho: formV.tamanho || undefined,
        local_sugerido: formV.local || undefined, descricao: formV.descricao || undefined,
        imagem_url: pub.data.publicUrl, ativo: formV.ativo,
      } });
      toast.success("Design publicado na vitrine! 🖤");
      setFormV({ titulo: "", estilo: "fine line", tamanho: "", local: "", descricao: "", ativo: true });
      setArquivoV(null);
      await carregarDesigns();
    } catch (e) { setVitrineErr(e instanceof Error && /^(Não foi possível|Escolha|Entre)/.test(e.message) ? e.message : "Não foi possível publicar o design. Tente de novo."); } finally { setPublicando(false); }
  }
  const [form, setForm] = useState({ nome: '', profissao: 'maquiadora', nome_salao: '', cep: '', whatsapp: '', instagram: '', bio: '', raio: 25 });
  const [err, setErr] = useState('');

  useEffect(() => {
    meus().then(setEnvios).catch(() => setEnvios([]));
    recebidosFn().then((r) => { setRecebidos(r); if (r.length) setAba('recebidos'); }).catch(() => setRecebidos([]));
  }, []);

  /** Aba "Buscar": carrega os profissionais ativos na primeira abertura. */
  useEffect(() => {
    if (aba !== 'buscar' || profissionais !== null) return;
    listarTodos().then(setProfissionais).catch(() => setProfissionais([]));
  }, [aba, profissionais, listarTodos]);

  async function responderBriefingUI(b: BriefingRecebido, faz: boolean) {    setRespondendo(b.id);
    try {
      await responder({ data: { id: b.id, faz, valor: faz ? Number(respostaForm.valor.replace(',', '.')) || undefined : undefined, prazo: respostaForm.prazo || undefined, resposta: respostaForm.obs || undefined } });
      toast.success(faz ? 'Orçamento enviado à cliente!' : 'Recusa registrada.');
      const r = await recebidosFn();
      setRecebidos(r);
      setRespostaForm({ valor: '', prazo: '', obs: '' });
    } catch (e) { toast.error('Não foi possível responder a este briefing. Tente de novo.'); } finally { setRespondendo(''); }
  }

  async function sugerirComIAUI(b: BriefingRecebido) {
    setSugerindo(b.id); setProPaywall(false);
    try {
      const r = await sugerir({ data: { briefing_id: b.id, texto: sugestaoTexto } });
      if (r.ok) toast.success('Sugestão aplicada e enviada à cliente! ✨');
      else toast.error('Não foi possível aplicar a sugestão. Tente de novo.');
      setSugestaoTexto('');
      setRecebidos(await recebidosFn());
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setProPaywall(/plano profissional|cr[eé]ditos/i.test(msg));
      toast.error('Não foi possível aplicar a sugestão. Tente de novo.');
    } finally { setSugerindo(''); }
  }

  async function cadastrar() {
    setErr(""); setSalvando(true);
    try {
      const cep = form.cep.replace(/\D/g, "");
      if (cep.length !== 8) return setErr("CEP: 8 números.");
      const geo = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const geoJson = (await geo.json()) as { location?: { coordinates?: { latitude?: number; longitude?: number } } };
      const lat = geoJson.location?.coordinates?.latitude, lng = geoJson.location?.coordinates?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") return setErr("Não achamos as coordenadas desse CEP.");
      const r = await salvar({ data: { nome: form.nome, profissao: form.profissao as never, nome_salao: form.nome_salao || undefined, cep, lat, lng, raio_atendimento_km: form.raio, whatsapp: form.whatsapp || undefined, instagram: form.instagram || undefined, bio: form.bio || undefined } });
      if (r.slug) setMeuLink(`${window.location.origin}/p/${r.slug}`);
      toast.success("Perfil de profissional salvo! Você já aparece nas buscas da sua região.");
    } catch (e) { setErr("Não foi possível salvar seu perfil. Tente de novo."); } finally { setSalvando(false); }
  }

  const STATUS: Record<string, string> = { enviado: '📤 Enviado', respondido: '💬 Respondido', orcado: '💰 Orçado', recusado: '✖ Recusado' };

  const termoBusca = busca.trim().toLowerCase();
  const profissionaisFiltrados = (profissionais ?? []).filter((p) => {
    const alvo = `${p.nome} ${p.nome_salao ?? ''}`.toLowerCase();
    return (!termoBusca || alvo.includes(termoBusca)) && (!filtroProfissao || p.profissao === filtroProfissao);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <CabecalhoPagina
        sobretitulo="Aura ID · Rede"
        titulo="Profissionais"
        descricao="Os briefings que você gerou podem ir direto para profissionais perto de você — e quem é da área pode se cadastrar para recebê-los."
      />

      {proAtivo ? (
        <Aviso tom="sucesso">💎 Plano Profissional ativo — sugestões de IA ilimitadas. Gerencie em <Link to="/aura-pass" className="underline">Aura Pass</Link>.</Aviso>
      ) : proPaywall ? (
        <div role="region" aria-label="Plano Profissional">
          <Aviso tom="atencao" titulo="Suas 3 sugestões grátis acabaram 💎">
            <p className="mt-1 text-xs text-muted-foreground">O Plano Profissional libera sugestões de IA ilimitadas sobre a foto da cliente — {AURA_PRO_PRECO}, cancele quando quiser.</p>
            <div className="mt-3"><Button size="sm" disabled={assinando} onClick={() => void assinarPro()}>{assinando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}Assinar {AURA_PRO_PRECO}</Button></div>
          </Aviso>
        </div>
      ) : (
        <div role="region" aria-label="Plano Profissional">
          <Aviso tom="info" titulo={<>💎 Plano Profissional — {AURA_PRO_PRECO}</>}>
            <p className="mt-1 text-xs text-muted-foreground">Sugestões de IA ilimitadas sobre a foto da cliente. As 3 primeiras de cada conta são grátis pra testar.</p>
            <div className="mt-3"><Button size="sm" disabled={assinando} onClick={() => void assinarPro()}>{assinando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}Assinar</Button></div>
          </Aviso>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={aba === 'buscar' ? 'default' : 'outline'} aria-pressed={aba === 'buscar'} onClick={() => setAba('buscar')}>Buscar</Button>
        <Button size="sm" variant={aba === 'envios' ? 'default' : 'outline'} aria-pressed={aba === 'envios'} onClick={() => setAba('envios')}>Meus envios</Button>
        <Button size="sm" variant={aba === 'recebidos' ? 'default' : 'outline'} aria-pressed={aba === 'recebidos'} onClick={() => setAba('recebidos')}>Recebidos{recebidos?.length ? ` (${recebidos.length})` : ''}</Button>
        <Button size="sm" variant={aba === 'vitrine' ? 'default' : 'outline'} aria-pressed={aba === 'vitrine'} onClick={() => { setAba('vitrine'); if (designs === null) void carregarDesigns(); }}>🖤 Vitrine do estúdio</Button>
        <Button size="sm" variant={aba === 'cadastro' ? 'default' : 'outline'} aria-pressed={aba === 'cadastro'} onClick={() => setAba('cadastro')}>Sou profissional — cadastrar</Button>
      </div>

      {aba === 'buscar' && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-sm">Buscar por nome ou salão<Input aria-label="Buscar por nome ou salão" className="mt-1" placeholder="ex.: Maria, Studio Aurora" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
            <label className="text-sm">Profissão<select aria-label="Filtrar por profissão" className="mt-1 w-full rounded-md border bg-background p-2 text-sm sm:w-56" value={filtroProfissao} onChange={(e) => setFiltroProfissao(e.target.value)}><option value="">Todas as profissões</option>{PROFISSOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          {profissionais === null && <CarregandoInline rotulo="Carregando profissionais…" />}
          {profissionais !== null && profissionaisFiltrados.length === 0 && (
            <EstadoVazio
              compacto
              tom={profissionais.length ? "neutro" : "destaque"}
              icone={<Search />}
              titulo={profissionais.length ? 'Nenhum profissional encontrado com esses filtros.' : 'Ainda não há profissionais ativos por aqui.'}
              descricao={profissionais.length ? 'Tente outro nome, salão ou profissão — ou convide alguém da sua região para se cadastrar.' : 'Quem é da área pode se cadastrar e receber os briefings de clientes da região. O cadastro é grátis.'}
              acoes={<>
                {profissionais.length > 0 && <Button size="sm" variant="outline" onClick={() => { setBusca(''); setFiltroProfissao(''); }}>Limpar filtros</Button>}
                <Button size="sm" onClick={() => setAba('cadastro')}>Sou profissional — cadastrar</Button>
              </>}
            />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {profissionaisFiltrados.map((p) => (
              <article key={p.id} className={cn("space-y-2", CARTAO_COMPACTO)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{p.nome}{p.verificado ? ' ✓' : ''}</p>
                  <span className="text-xs text-muted-foreground">{ROTULO_PROFISSAO.get(p.profissao) ?? p.profissao}</span>
                </div>
                {p.nome_salao && <p className="text-xs text-muted-foreground">{p.nome_salao}</p>}
                {p.bio && <p className="line-clamp-2 text-xs text-muted-foreground">{p.bio}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild><a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer">Ver perfil</a></Button>
                  <Button size="sm" asChild><a href={`/briefing/${p.slug}`}>Enviar briefing</a></Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {aba === 'recebidos' && (
        <section className="space-y-3">
          {recebidos === null && <CarregandoInline rotulo="Carregando briefings recebidos…" />}
          {recebidos?.length === 0 && (
            <EstadoVazio
              compacto
              tom="destaque"
              icone={<Inbox />}
              titulo="Nenhum briefing recebido ainda"
              descricao="Quando uma cliente enviar um briefing para o seu perfil, ele aparece aqui com a foto opcional, o status e o orçamento. Se você ainda não tem perfil de profissional, cadastre-se para receber briefings da sua região."
              acoes={<>
                <Button size="sm" onClick={() => setAba('cadastro')}>Cadastrar perfil de profissional</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAba('vitrine'); if (designs === null) void carregarDesigns(); }}>🖤 Ver vitrine do estúdio</Button>
              </>}
            />
          )}
          {recebidos?.map((b) => (
            <article key={b.id} className={cn("space-y-3", CARTAO_COMPACTO)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{b.titulo} <span className="text-xs text-muted-foreground">({b.modulo ?? 'visual'} · {new Date(b.created_at).toLocaleDateString('pt-BR')})</span></p>
                <span className="text-xs text-muted-foreground">{b.status === 'orcado' ? `💰 Orçado${b.orcamento_valor ? ` · R$ ${b.orcamento_valor.toFixed(2)}` : ''}` : b.status === 'recusado' ? '✖ Recusado' : '📤 Aguardando você'}</span>
              </div>
              <details><summary className="cursor-pointer text-xs text-accent">Ler o briefing</summary><div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">{b.texto}</div></details>
              {b.foto_url && (
                <div className="space-y-2 rounded border bg-background p-3">
                  <p className="text-xs font-medium">Foto enviada pela cliente (privada)</p>
                  <img src={b.foto_url} alt="Referência enviada pela cliente" className="max-h-64 rounded object-contain" />
                  <label className="block text-xs">Sua sugestão — a IA aplica na foto e envia pra cliente
                    <Textarea aria-label="Sua sugestão" className="mt-1" rows={2} maxLength={1000} placeholder="ex.: volume 20% menor, contorno mais definido, tom mais natural" value={sugestaoTexto} onChange={(e) => setSugestaoTexto(e.target.value)} />
                  </label>
                  <Button size="sm" disabled={sugerindo === b.id || sugestaoTexto.trim().length < 5} onClick={() => void sugerirComIAUI(b)}>{sugerindo === b.id ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : '✨'} Aplicar com IA e enviar</Button>
                  <p className="text-xs text-muted-foreground">3 sugestões grátis; depois faz parte do plano profissional.</p>
                </div>
              )}
              {b.sugestoes.length > 0 && (
                <div className="space-y-2">
                  {b.sugestoes.map((g, i) => (
                    <figure key={i} className="rounded border border-accent/40 bg-accent/5 p-2">
                      <img src={g.image_url} alt={`Sugestão ${i + 1}`} className="max-h-64 rounded object-contain" />
                      <figcaption className="mt-1 text-xs text-muted-foreground">Sugestão enviada: {g.texto}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {b.status === 'enviado' ? (
                <div className="space-y-2 rounded border bg-background p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs">Valor (R$)<Input aria-label="Valor do orçamento" className="mt-1 h-8" inputMode="decimal" placeholder="ex.: 150,00" value={respostaForm.valor} onChange={(e) => setRespostaForm({ ...respostaForm, valor: e.target.value })} /></label>
                    <label className="text-xs">Prazo / disponibilidade<Input aria-label="Prazo" className="mt-1 h-8" placeholder="ex.: esta semana" value={respostaForm.prazo} onChange={(e) => setRespostaForm({ ...respostaForm, prazo: e.target.value })} /></label>
                  </div>
                  <label className="block text-xs">Observação para a cliente (opcional)<Textarea aria-label="Observação" className="mt-1" rows={2} maxLength={2000} value={respostaForm.obs} onChange={(e) => setRespostaForm({ ...respostaForm, obs: e.target.value })} /></label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={respondendo === b.id || !respostaForm.valor} onClick={() => void responderBriefingUI(b, true)}>💰 Faço — enviar orçamento</Button>
                    <Button size="sm" variant="outline" disabled={respondendo === b.id} onClick={() => void responderBriefingUI(b, false)}>✖ Não faço este pedido</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded border border-accent/40 bg-accent/5 p-3 text-xs whitespace-pre-wrap">
                  Sua resposta: {b.faz ? `faço o pedido${b.orcamento_valor ? ` por R$ ${b.orcamento_valor.toFixed(2)}` : ''}${b.orcamento_prazo ? ` · prazo: ${b.orcamento_prazo}` : ''}` : 'não faço este pedido'}.{b.resposta ? `\n${b.resposta}` : ''}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {aba === 'envios' && (
        <section className="space-y-3">
          {envios === null && <CarregandoInline rotulo="Carregando seus envios…" />}
          {envios?.length === 0 && (
            <EstadoVazio
              compacto
              icone={<Send />}
              titulo="Nenhum briefing enviado ainda"
              descricao="Gere um visual, clique em “💚 Gostei — e agora?”, escolha “Briefing para o salão” e envie a um profissional da sua região."
              acoes={<Button asChild size="sm" variant="outline"><Link to="/dashboard">Ir para as sugestões</Link></Button>}
            />
          )}
          {envios?.map((s) => (
            <article key={s.id} className={cn("space-y-2", CARTAO_COMPACTO)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.titulo}</p>
                <span className="text-xs text-muted-foreground">{STATUS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-xs text-muted-foreground">Para: {s.profissional?.nome ?? 'profissional'}{s.profissional?.nome_salao ? ` · ${s.profissional.nome_salao}` : ''}{s.profissional?.whatsapp ? ` · ${s.profissional.whatsapp}` : ''}</p>
              <details><summary className="cursor-pointer text-xs text-accent">Ver briefing</summary><div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">{s.texto}</div></details>
              {s.status === 'orcado' && <Aviso tom="sucesso">💰 <strong>Orçamento:</strong> {s.faz ? 'faz o pedido' : ''}{s.orcamento_valor ? ` · R$ ${s.orcamento_valor.toFixed(2)}` : ''}{s.orcamento_prazo ? ` · prazo: ${s.orcamento_prazo}` : ''}</Aviso>}
              {s.status === 'recusado' && <Aviso tom="atencao">Este profissional não faz este pedido — tente outro da região.</Aviso>}
              {s.sugestoes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">✨ Proposta visual do profissional</p>
                  {s.sugestoes.map((g, i) => (
                    <figure key={i} className="rounded border border-accent/40 bg-accent/5 p-2">
                      <img src={g.image_url} alt={`Proposta visual ${i + 1}`} className="max-h-72 rounded object-contain" />
                      <figcaption className="mt-1 text-xs text-muted-foreground">{g.texto}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {s.resposta && <div className="rounded border border-accent/40 bg-accent/5 p-3 text-xs whitespace-pre-wrap">Mensagem do profissional: {s.resposta}</div>}
            </article>
          ))}
        </section>
      )}

      {aba === 'vitrine' && (
        <Cartao className="space-y-4">
          <div>
            <p className="text-sm font-medium">🖤 Vitrine do estúdio</p>
            <p className="mt-1 text-xs text-muted-foreground">Publique seus designs para as clientes verem na <Link to="/tatuagem/vitrine" className="underline text-accent">vitrine</Link> — e aplicar em você antes de marcar. Exclusivo para perfis de tatuagem.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Título do design<Input aria-label="Título do design" className="mt-1" placeholder="ex.: Ramo botânico fino" value={formV.titulo} onChange={(e) => setFormV({ ...formV, titulo: e.target.value })} /></label>
            <label className="text-sm">Estilo<select aria-label="Estilo" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={formV.estilo} onChange={(e) => setFormV({ ...formV, estilo: e.target.value })}>{ESTILOS_VITRINE.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
            <label className="text-sm">Tamanho sugerido (opcional)<Input aria-label="Tamanho" className="mt-1" placeholder="ex.: 8 cm" value={formV.tamanho} onChange={(e) => setFormV({ ...formV, tamanho: e.target.value })} /></label>
            <label className="text-sm">Local sugerido (opcional)<Input aria-label="Local sugerido" className="mt-1" placeholder="ex.: antebraço esquerdo" value={formV.local} onChange={(e) => setFormV({ ...formV, local: e.target.value })} /></label>
          </div>
          <label className="block text-sm">Descrição (opcional)<Textarea aria-label="Descrição" className="mt-1" rows={2} maxLength={400} value={formV.descricao} onChange={(e) => setFormV({ ...formV, descricao: e.target.value })} /></label>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="file" aria-label="Escolher imagem do design" accept="image/png,image/jpeg,image/webp" onChange={(e) => setArquivoV(e.target.files?.[0] ?? null)} />{arquivoV ? `📎 ${arquivoV.name}` : "Escolher imagem do design (PNG/JPG)"}</label>
          {vitrineErr && <div role="alert"><Aviso tom="atencao">{vitrineErr}</Aviso></div>}
          <Button disabled={publicando || formV.titulo.trim().length < 2 || !arquivoV} onClick={() => void publicarDesignUI()}>{publicando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}Publicar design</Button>
          {designs === null && <CarregandoInline rotulo="Carregando seus designs…" />}
          {designs?.length === 0 && (
            <EstadoVazio
              compacto
              icone={<Palette />}
              titulo="Nenhum design publicado ainda."
            />
          )}
          {designs && designs.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {designs.map((d) => (
                <li key={d.id} className="flex gap-3 rounded-md border bg-background p-3">
                  <img src={d.imagem_url} alt={d.titulo} className="size-20 shrink-0 rounded object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.titulo} {!d.ativo && <span className="text-xs text-muted-foreground">· ⏸️</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.estilo ?? '—'}{d.local_sugerido ? ` · ${d.local_sugerido}` : ''}</p>
                    <div className="mt-1 flex gap-1">
                      <Button size="sm" variant="ghost" aria-label={d.ativo ? 'Pausar design na vitrine' : 'Reativar design na vitrine'} title={d.ativo ? 'Pausar' : 'Reativar'} onClick={() => void publicarFn({ data: { id: d.id, titulo: d.titulo, estilo: d.estilo ?? undefined, tamanho: d.tamanho ?? undefined, local_sugerido: d.local_sugerido ?? undefined, descricao: d.descricao ?? undefined, imagem_url: d.imagem_url, ativo: !d.ativo } }).then(carregarDesigns).catch(() => toast.error('Não foi possível atualizar o design. Tente de novo.'))}>{d.ativo ? '⏸️' : '▶️'}</Button>
                      <Button size="sm" variant="ghost" aria-label="Abrir versão para impressão (stencil)" title="Versão para impressão (stencil)" onClick={() => void processarStencil(d, "auto", false)}>🖨️</Button>
                      <Confirm label="Excluir design" desc="Remove o design da sua vitrine. A imagem publicada deixa de ser listada; não pode ser desfeita." onYes={() => { void excluirDesignFn({ data: { id: d.id } }).then(carregarDesigns).catch(() => toast.error("Não foi possível excluir o design. Tente de novo.")); }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      {aba === 'cadastro' && (
        <Cartao className="space-y-3">
          <p className="text-sm text-muted-foreground">Grátis para começar. Suas informações ficam públicas apenas para as buscas (nome, profissão, salão, contato) — seu login e dados de conta nunca aparecem.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Nome profissional<Input aria-label="Nome profissional" className="mt-1" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
            <label className="text-sm">Profissão<select aria-label="Profissão" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })}>{PROFISSOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="text-sm">Nome do salão/estúdio (opcional)<Input aria-label="Nome do salão" className="mt-1" value={form.nome_salao} onChange={(e) => setForm({ ...form, nome_salao: e.target.value })} /></label>
            <label className="text-sm">CEP do salão (8 números)<Input aria-label="CEP" className="mt-1" inputMode="numeric" maxLength={9} value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></label>
            <label className="text-sm">WhatsApp (opcional)<Input aria-label="WhatsApp" className="mt-1" placeholder="(11) 9..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></label>
            <label className="text-sm">Instagram (opcional)<Input aria-label="Instagram" className="mt-1" placeholder="@seusalao" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></label>
            <label className="text-sm">Raio de atendimento<select aria-label="Raio de atendimento" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={form.raio} onChange={(e) => setForm({ ...form, raio: Number(e.target.value) })}>{[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} km</option>)}</select></label>
          </div>
          <label className="block text-sm">Bio (opcional)<Textarea aria-label="Bio" className="mt-1" rows={3} maxLength={600} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          {err && <div role="alert"><Aviso tom="atencao">{err}</Aviso></div>}
          <Button disabled={salvando || form.nome.trim().length < 2} onClick={() => void cadastrar()}>{salvando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}Salvar meu perfil</Button>
          {meuLink && (
            <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3" role="region" aria-label="Seu link público">
              <p className="text-xs font-medium">🔗 Seu link público — coloque na bio do Instagram:</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{meuLink}</code>
                <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(meuLink); toast.success("Link copiado!"); }}>Copiar</Button>
              </div>
              <a href={meuLink} target="_blank" rel="noopener noreferrer" className="block text-xs text-accent underline">Ver minha página ↗</a>
            </div>
          )}
        </Cartao>
      )}
      <Dialog open={!!stencil} onOpenChange={(o) => { if (!o) { if (stencil?.url) URL.revokeObjectURL(stencil.url); setStencil(null); } }}>
        <DialogContent>
          {stencil && (
            <div className="space-y-3">
              <DialogTitle>🖨️ Stencil — {stencil.design.titulo}</DialogTitle>
              <div className="mx-auto max-w-xs rounded border p-2" style={{ background: "repeating-conic-gradient(#e5e5e5 0 25%, #ffffff 0 50%) 0 0 / 16px 16px" }}>
                <img src={stencil.url} alt={`Stencil de ${stencil.design.titulo}`} className="w-full object-contain" />
              </div>
              <p className="text-xs text-muted-foreground">Traço preto puro convertido no seu aparelho — fiel ao design original, pronto para impressora térmica.{stencil.invertido ? " (desenho branco-no-preto detectado e invertido)" : ""}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={stencil.nivel === "auto"} onChange={(e) => void processarStencil(stencil.design, e.target.checked ? "auto" : 128, stencil.fundoBranco)} /> Limiar automático</label>
                {stencil.nivel !== "auto" && (
                  <input type="range" min={20} max={235} value={stencil.nivel} className="flex-1" onChange={(e) => void processarStencil(stencil.design, Number(e.target.value), stencil.fundoBranco)} aria-label="Limiar do traço" />
                )}
                <label className="flex items-center gap-2"><input type="checkbox" checked={stencil.fundoBranco} onChange={(e) => void processarStencil(stencil.design, stencil.nivel, e.target.checked)} /> Fundo branco</label>
              </div>
              {stencilErr && <div role="alert"><Aviso tom="atencao">{stencilErr}</Aviso></div>}
              <div className="flex gap-2">
                <Button size="sm" onClick={baixarStencil}>⬇️ Baixar PNG {stencil.fundoBranco ? "(fundo branco)" : "(fundo transparente)"}</Button>
                <Button size="sm" variant="outline" onClick={() => { if (stencil.url) URL.revokeObjectURL(stencil.url); setStencil(null); }}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
