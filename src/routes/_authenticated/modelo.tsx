import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Trash2, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useServerFn } from '@tanstack/react-start';
import { modeloConsent, gerarModelo } from '@/lib/modelo.functions';
import { AURA_PASS_PRECO } from '@/lib/stripe.functions';
import { QuotaChip } from '@/components/QuotaChip';

export const Route = createFileRoute('/_authenticated/modelo')({
  head: () => ({ meta: [{ title: 'Meu Modelo · Aura ID' }] }),
  component: Page,
});

type Foto = { path: string; url: string };

function Page() {
  const consentir = useServerFn(modeloConsent), gerar = useServerFn(gerarModelo);
  const [permFotos, setPermFotos] = useState<boolean | null>(null);
  const [permImagens, setPermImagens] = useState<boolean | null>(null);
  const [consentido, setConsentido] = useState(false);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [seedRosto, setSeedRosto] = useState('');
  const [seedCorpo, setSeedCorpo] = useState('');
  const [gerando, setGerando] = useState(false);
  const [modelo, setModelo] = useState<{ rosto?: string; corpo?: string }>({});
  const [paywall, setPaywall] = useState(false);
  const [err, setErr] = useState('');
  const uid = useRef('');

  async function carregarModelo(userId: string) {
    const { data: arqs } = await supabase.storage.from('user-photos').list(userId, { search: 'modelo-' });
    const achados: { rosto?: string; corpo?: string } = {};
    for (const a of arqs ?? []) {
      const s = await supabase.storage.from('user-photos').createSignedUrl(`${userId}/${a.name}`, 3600);
      const u2 = s.data?.signedUrl;
      if (a.name === 'modelo-rosto.png' && u2) achados.rosto = u2;
      if (a.name === 'modelo-corpo.png' && u2) achados.corpo = u2;
    }
    setModelo(achados);
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      uid.current = u.user.id;
      const { data: c } = await supabase.from('consents').select('photo_processing,image_generation,module_permissions').maybeSingle();
      setPermFotos(!!c?.photo_processing);
      setPermImagens(!!c?.image_generation);
      setConsentido(!!((c?.module_permissions ?? {}) as Record<string, boolean>)['personal_model']);
      await carregarModelo(u.user.id);
    })();
  }, []);

  async function subirFoto(file: File) {
    setErr('');
    if (fotos.length >= 8) return setErr('Máximo de 8 fotos.');
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErr('Envie PNG ou JPG.');
    if (file.size > 5 * 1024 * 1024) return setErr('Foto acima de 5MB.');
    const path = `${uid.current}/modelo-src-${Date.now()}-${fotos.length}.png`;
    const up = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type });
    if (up.error) return setErr('Não foi possível guardar a foto. Tente novamente.');
    const signed = await supabase.storage.from('user-photos').createSignedUrl(path, 3600);
    const nova = { path, url: signed.data?.signedUrl ?? '' };
    setFotos(f => [...f, nova]);
    if (!seedRosto) setSeedRosto(path);
    if (!seedCorpo) setSeedCorpo(path);
  }

  async function removerFontes() {
    if (!fotos.length) return;
    await supabase.storage.from('user-photos').remove(fotos.map(f => f.path));
    setFotos([]); setSeedRosto(''); setSeedCorpo('');
  }

  async function excluirModelo() {
    const caminhos = [`${uid.current}/modelo-rosto.png`, `${uid.current}/modelo-corpo.png`];
    await supabase.storage.from('user-photos').remove(caminhos);
    await supabase.from('audit_events').insert({ user_id: uid.current, event: 'data_deleted', meta: { scope: 'personal_model' } });
    setModelo({}); toast.success('Modelo pessoal excluído.');
  }

  async function gerarUm(tipo: 'rosto' | 'corpo', seedPath: string): Promise<boolean> {
    const signed = await supabase.storage.from('user-photos').createSignedUrl(seedPath, 600);
    const seedUrl = signed.data?.signedUrl;
    if (!seedUrl) { setErr('Não consegui autorizar o uso da foto base.'); return false; }
    const r = await gerar({ data: { seedUrl, tipo } });
    if (!r.ok || !r.image_url) {
      const msg = r.error ?? 'Não foi possível gerar o modelo agora.';
      setPaywall(/gratuitas|Aura Pass/i.test(msg));
      setErr(msg); return false;
    }
    const blob = await (await fetch(r.image_url)).blob();
    const destino = `${uid.current}/modelo-${tipo}.png`;
    await supabase.storage.from('user-photos').upload(destino, blob, { contentType: 'image/jpeg', upsert: true });
    const prev = await supabase.storage.from('user-photos').createSignedUrl(destino, 3600);
    setModelo(m => ({ ...m, [tipo]: prev.data?.signedUrl }));
    window.dispatchEvent(new Event('aura:quota'));
    return true;
  }

  async function gerarModeloPessoal() {
    if (!seedRosto || !seedCorpo) return setErr('Envie as fotos e escolha as bases de rosto e corpo.');
    setGerando(true); setErr(''); setPaywall(false);
    try {
      await gerarUm('rosto', seedRosto);
      await gerarUm('corpo', seedCorpo);
      toast.success('Seu modelo pessoal está pronto.');
    } finally { setGerando(false); }
  }

  const permissoesOk = permFotos && permImagens;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <span className="text-sm text-accent">A sua base para tudo</span>
        <h1 className="mt-2 text-5xl">Meu <em>Modelo</em></h1>
        <p className="mt-3 text-muted-foreground">Suba algumas fotos suas e a Aura cria duas imagens-base neutras — rosto e corpo — que preservam a SUA identidade. Maquiagem, cabelo, roupas e tatuagens passam a ser aplicadas sobre o seu modelo, nunca sobre uma pessoa genérica.</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Requisitos (Configurações):</span>
          <Link to="/settings" className={permFotos ? 'rounded-full border px-2 py-0.5 text-emerald-600' : 'rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-amber-700 underline'}>Fotos {permFotos === null ? '…' : permFotos ? '✅' : '❌'}</Link>
          <Link to="/settings" className={permImagens ? 'rounded-full border px-2 py-0.5 text-emerald-600' : 'rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-amber-700 underline'}>Imagens de IA {permImagens === null ? '…' : permImagens ? '✅' : '❌'}</Link>
        </p>
      </div>

      <label className="flex items-start justify-between gap-6 rounded-lg border bg-card p-5">
        <div>
          <div className="font-medium">Autorizar meu modelo visual</div>
          <p className="text-sm text-muted-foreground">Permissão específica (LGPD): a Aura pode criar e usar imagens-base suas para simulações. Revoke quando quiser — excluir o modelo apaga as imagens do cofre.</p>
        </div>
        <Switch checked={consentido} disabled={!permissoesOk} onCheckedChange={async (v) => {
          try { await consentir({ data: { value: v } }); setConsentido(v); if (!v) await excluirModelo(); }
          catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
        }} />
      </label>

      {permissoesOk && consentido && (
        <>
          {(modelo.rosto || modelo.corpo) ? (
            <section className="space-y-3">
              <h2 className="text-3xl">Seu modelo atual</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {modelo.rosto && <figure><img src={modelo.rosto} alt="Seu modelo de rosto" className="aspect-[3/4] w-full rounded-lg object-contain" /><figcaption className="mt-1 text-xs text-muted-foreground">Modelo · rosto</figcaption></figure>}
                {modelo.corpo && <figure><img src={modelo.corpo} alt="Seu modelo de corpo" className="aspect-[3/4] w-full rounded-lg object-contain" /><figcaption className="mt-1 text-xs text-muted-foreground">Modelo · corpo</figcaption></figure>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={gerando} onClick={() => void gerarModeloPessoal()}>{gerando ? <LoaderCircle className="size-4 animate-spin" /> : null}{gerando ? 'Regenerando…' : 'Regenerar modelo'}</Button>
                <Button size="sm" variant="ghost" onClick={() => void excluirModelo()}><Trash2 className="size-4" /> Excluir modelo</Button>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="text-3xl">Criar meu modelo</h2>
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground hover:border-accent">
                <Upload className="size-6" />
                Envie de 3 a 8 fotos suas (rostos e corpo, bem iluminados)
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subirFoto(f); e.target.value = ''; }} />
              </label>
              {fotos.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {fotos.map((f, i) => <img key={f.path} src={f.url} alt={`Foto enviada ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />)}
                  </div>
                  <p className="text-xs text-muted-foreground">{fotos.length} foto{fotos.length > 1 ? 's' : ''} · ficarão privadas no seu cofre</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">Foto-base do ROSTO<select aria-label="Foto-base do rosto" className="mt-1 w-full rounded-md border bg-background p-2" value={seedRosto} onChange={(e) => setSeedRosto(e.target.value)}>{fotos.map((f, i) => <option key={f.path} value={f.path}>Foto {i + 1}</option>)}</select></label>
                    <label className="text-sm">Foto-base do CORPO<select aria-label="Foto-base do corpo" className="mt-1 w-full rounded-md border bg-background p-2" value={seedCorpo} onChange={(e) => setSeedCorpo(e.target.value)}>{fotos.map((f, i) => <option key={f.path} value={f.path}>Foto {i + 1}</option>)}</select></label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={gerando || fotos.length < 3} onClick={() => void gerarModeloPessoal()}>{gerando ? <LoaderCircle className="size-4 animate-spin" /> : <UserRound className="size-4" />}{gerando ? 'Criando seu modelo…' : 'Gerar meu modelo'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => void removerFontes()}>Descartar fotos</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">A primeira geração é grátis (rosto + corpo). Regenerar faz parte do Aura Pass.</p>
                </>
              )}
            </section>
          )}
        </>
      )}

      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      {permissoesOk && consentido && <QuotaChip tasks={['webapp.modelo.render']} label="Modelo" />}
      {paywall && !gerando && (
        <div role="region" aria-label="Aura Pass" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">Sua geração grátis do modelo já foi usada ✨</p>
          <p className="mt-1 text-xs text-muted-foreground">O Aura Pass libera regenerações — Pix ou cartão, cancele quando quiser.</p>
          <Button asChild size="sm" className="mt-3"><Link to="/aura-pass">Desbloquear com Aura Pass · {AURA_PASS_PRECO}</Link></Button>
        </div>
      )}
    </div>
  );
}
