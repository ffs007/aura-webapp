import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { meusBriefings, salvarProfissional, briefingsRecebidos, responderBriefing, sugerirComIA, type BriefingRecebido } from '@/lib/profissionais.functions';
import { meusDesigns, publicarDesign, excluirDesign, ESTILOS_VITRINE, type MeuDesign } from '@/lib/vitrine.functions';

export const Route = createFileRoute('/_authenticated/profissionais')({
  head: () => ({ meta: [{ title: 'Profissionais · Aura ID' }] }),
  component: Page,
});

const PROFISSOES: [string, string][] = [
  ['cabeleireira', 'Cabeleireira(o)'], ['maquiadora', 'Maquiadora(o)'], ['tatuadora', 'Tatuadora(o)'],
  ['esteticista', 'Esteticista'], ['barbeiro', 'Barbeiro'], ['manicure', 'Manicure'],
];

type Envio = { id: string; titulo: string; texto: string; modulo: string | null; status: string; resposta: string | null; created_at: string; faz: boolean | null; orcamento_valor: number | null; orcamento_prazo: string | null; profissional: { nome: string; nome_salao: string | null; whatsapp: string | null } | null; sugestoes: { texto: string; image_url: string }[] };

function Page() {
  const meus = useServerFn(meusBriefings), salvar = useServerFn(salvarProfissional), recebidosFn = useServerFn(briefingsRecebidos), responder = useServerFn(responderBriefing), sugerir = useServerFn(sugerirComIA);
  const designsFn = useServerFn(meusDesigns), publicarFn = useServerFn(publicarDesign), excluirDesignFn = useServerFn(excluirDesign);
  const [sugestaoTexto, setSugestaoTexto] = useState('');
  const [sugerindo, setSugerindo] = useState('');
  const [aba, setAba] = useState<'envios' | 'recebidos' | 'cadastro' | 'vitrine'>('envios');
  const [envios, setEnvios] = useState<Envio[] | null>(null);
  const [recebidos, setRecebidos] = useState<BriefingRecebido[] | null>(null);
  const [respondendo, setRespondendo] = useState("");
  const [respostaForm, setRespostaForm] = useState<{ valor: string; prazo: string; obs: string }>({ valor: '', prazo: '', obs: '' });
  const [salvando, setSalvando] = useState(false);
  const [meuLink, setMeuLink] = useState("");
  const [designs, setDesigns] = useState<MeuDesign[] | null>(null);
  const [formV, setFormV] = useState({ titulo: "", estilo: "fine line", tamanho: "", local: "", descricao: "", ativo: true });
  const [arquivoV, setArquivoV] = useState<File | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [vitrineErr, setVitrineErr] = useState("");

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
      if (up.error) throw new Error(up.error.message);
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
    } catch (e) { setVitrineErr(e instanceof Error ? e.message : "Não foi possível publicar."); } finally { setPublicando(false); }
  }
  const [form, setForm] = useState({ nome: '', profissao: 'maquiadora', nome_salao: '', cep: '', whatsapp: '', instagram: '', bio: '', raio: 25 });
  const [err, setErr] = useState('');

  useEffect(() => {
    meus().then(setEnvios).catch(() => setEnvios([]));
    recebidosFn().then((r) => { setRecebidos(r); if (r.length) setAba('recebidos'); }).catch(() => setRecebidos([]));
  }, []);

  async function responderBriefingUI(b: BriefingRecebido, faz: boolean) {    setRespondendo(b.id);
    try {
      await responder({ data: { id: b.id, faz, valor: faz ? Number(respostaForm.valor.replace(',', '.')) || undefined : undefined, prazo: respostaForm.prazo || undefined, resposta: respostaForm.obs || undefined } });
      toast.success(faz ? 'Orçamento enviado à cliente!' : 'Recusa registrada.');
      const r = await recebidosFn();
      setRecebidos(r);
      setRespostaForm({ valor: '', prazo: '', obs: '' });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível responder.'); } finally { setRespondendo(''); }
  }

  async function sugerirComIAUI(b: BriefingRecebido) {
    setSugerindo(b.id);
    try {
      const r = await sugerir({ data: { briefing_id: b.id, texto: sugestaoTexto } });
      toast.success(r.ok ? 'Sugestão aplicada e enviada à cliente! ✨' : '');
      setSugestaoTexto('');
      setRecebidos(await recebidosFn());
    } catch (e) { toast.error(e instanceof Error ? e.message : 'A IA não conseguiu aplicar agora.'); } finally { setSugerindo(''); }
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
    } catch (e) { setErr(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setSalvando(false); }
  }

  const STATUS: Record<string, string> = { enviado: '📤 Enviado', respondido: '💬 Respondido', orcado: '💰 Orçado', recusado: '✖ Recusado' };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <span className="text-sm text-accent">Aura ID · Rede</span>
        <h1 className="mt-2 text-5xl">Profissionais</h1>
        <p className="mt-3 text-muted-foreground">Os briefings que você gerou podem ir direto para profissionais perto de você — e quem é da área pode se cadastrar para recebê-los.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={aba === 'envios' ? 'default' : 'outline'} onClick={() => setAba('envios')}>Meus envios</Button>
        {(recebidos?.length ?? 0) > 0 && <Button size="sm" variant={aba === 'recebidos' ? 'default' : 'outline'} onClick={() => setAba('recebidos')}>Recebidos ({recebidos?.length})</Button>}
        <Button size="sm" variant={aba === 'vitrine' ? 'default' : 'outline'} onClick={() => { setAba('vitrine'); if (designs === null) void carregarDesigns(); }}>🖤 Vitrine do estúdio</Button>
        <Button size="sm" variant={aba === 'cadastro' ? 'default' : 'outline'} onClick={() => setAba('cadastro')}>Sou profissional — cadastrar</Button>
      </div>

      {aba === 'recebidos' && (
        <section className="space-y-3">
          {recebidos?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum briefing recebido ainda. Quando uma cliente da sua região enviar, ele aparece aqui.</p>}
          {recebidos?.map((b) => (
            <article key={b.id} className="space-y-3 rounded-lg border bg-card p-4">
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
                  <Button size="sm" disabled={sugerindo === b.id || sugestaoTexto.trim().length < 5} onClick={() => void sugerirComIAUI(b)}>{sugerindo === b.id ? <LoaderCircle className="size-4 animate-spin" /> : '✨'} Aplicar com IA e enviar</Button>
                  <p className="text-[10px] text-muted-foreground">3 sugestões grátis; depois faz parte do plano profissional.</p>
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
          {envios === null && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {envios?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum briefing enviado ainda. Gere um visual, clique em “💚 Gostei — e agora?”, escolha “Briefing para o salão” e envie a um profissional da sua região.</p>}
          {envios?.map((s) => (
            <article key={s.id} className="space-y-2 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.titulo}</p>
                <span className="text-xs text-muted-foreground">{STATUS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-xs text-muted-foreground">Para: {s.profissional?.nome ?? 'profissional'}{s.profissional?.nome_salao ? ` · ${s.profissional.nome_salao}` : ''}{s.profissional?.whatsapp ? ` · ${s.profissional.whatsapp}` : ''}</p>
              <details><summary className="cursor-pointer text-xs text-accent">Ver briefing</summary><div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">{s.texto}</div></details>
              {s.status === 'orcado' && <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs">💰 <strong>Orçamento:</strong> {s.faz ? 'faz o pedido' : ''}{s.orcamento_valor ? ` · R$ ${s.orcamento_valor.toFixed(2)}` : ''}{s.orcamento_prazo ? ` · prazo: ${s.orcamento_prazo}` : ''}</div>}
              {s.status === 'recusado' && <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs">Este profissional não faz este pedido — tente outro da região.</div>}
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
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div>
            <p className="text-sm font-medium">🖤 Vitrine do estúdio</p>
            <p className="mt-1 text-xs text-muted-foreground">Publique seus designs para as clientes verem na <Link to="/tatuagem/vitrine" className="underline text-accent">vitrine</Link> — e em breve testarem no próprio corpo antes de marcar. Exclusivo para perfis de tatuadora(o).</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Título do design<Input aria-label="Título do design" className="mt-1" placeholder="ex.: Ramo botânico fino" value={formV.titulo} onChange={(e) => setFormV({ ...formV, titulo: e.target.value })} /></label>
            <label className="text-sm">Estilo<select aria-label="Estilo" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={formV.estilo} onChange={(e) => setFormV({ ...formV, estilo: e.target.value })}>{ESTILOS_VITRINE.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
            <label className="text-sm">Tamanho sugerido (opcional)<Input aria-label="Tamanho" className="mt-1" placeholder="ex.: 8 cm" value={formV.tamanho} onChange={(e) => setFormV({ ...formV, tamanho: e.target.value })} /></label>
            <label className="text-sm">Local sugerido (opcional)<Input aria-label="Local sugerido" className="mt-1" placeholder="ex.: antebraço esquerdo" value={formV.local} onChange={(e) => setFormV({ ...formV, local: e.target.value })} /></label>
          </div>
          <label className="block text-sm">Descrição (opcional)<Textarea aria-label="Descrição" className="mt-1" rows={2} maxLength={400} value={formV.descricao} onChange={(e) => setFormV({ ...formV, descricao: e.target.value })} /></label>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setArquivoV(e.target.files?.[0] ?? null)} />{arquivoV ? `📎 ${arquivoV.name}` : "Escolher imagem do design (PNG/JPG)"}</label>
          {vitrineErr && <p role="alert" className="text-sm text-destructive">{vitrineErr}</p>}
          <Button disabled={publicando || formV.titulo.trim().length < 2 || !arquivoV} onClick={() => void publicarDesignUI()}>{publicando ? <LoaderCircle className="size-4 animate-spin" /> : null}Publicar design</Button>
          {designs === null && <p className="text-xs text-muted-foreground">Carregando seus designs…</p>}
          {designs?.length === 0 && <p className="text-xs text-muted-foreground">Nenhum design publicado ainda.</p>}
          {designs && designs.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {designs.map((d) => (
                <li key={d.id} className="flex gap-3 rounded-md border bg-background p-3">
                  <img src={d.imagem_url} alt={d.titulo} className="size-20 shrink-0 rounded object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.titulo} {!d.ativo && <span className="text-xs text-muted-foreground">· ⏸️</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.estilo ?? '—'}{d.local_sugerido ? ` · ${d.local_sugerido}` : ''}</p>
                    <div className="mt-1 flex gap-1">
                      <Button size="sm" variant="ghost" title={d.ativo ? 'Pausar' : 'Reativar'} onClick={() => void publicarFn({ data: { id: d.id, titulo: d.titulo, estilo: d.estilo ?? undefined, tamanho: d.tamanho ?? undefined, local_sugerido: d.local_sugerido ?? undefined, descricao: d.descricao ?? undefined, imagem_url: d.imagem_url, ativo: !d.ativo } }).then(carregarDesigns).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro.'))}>{d.ativo ? '⏸️' : '▶️'}</Button>
                      <Button size="sm" variant="ghost" title="Excluir" onClick={() => { if (confirm(`Excluir "${d.titulo}"?`)) void excluirDesignFn({ data: { id: d.id } }).then(carregarDesigns).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro.')); }}>🗑️</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === 'cadastro' && (
        <section className="space-y-3 rounded-lg border bg-card p-5">
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
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <Button disabled={salvando || form.nome.trim().length < 2} onClick={() => void cadastrar()}>{salvando ? <LoaderCircle className="size-4 animate-spin" /> : null}Salvar meu perfil</Button>
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
        </section>
      )}
    </div>
  );
}
