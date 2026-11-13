import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Trash2, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useServerFn } from '@tanstack/react-start';
import { modeloConsent, gerarModelo } from '@/lib/modelo.functions';
import { QuotaChip } from '@/components/QuotaChip';
import { PaywallCard } from '@/components/PaywallCard';
import { CabecalhoPagina } from '@/components/estados';
import { CARTAO_COMPACTO, PILHA_PAGINA, TITULO_SECAO } from '@/lib/design';

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
    let ativo = true;
    const carregarPermissoes = async (userId: string) => {
      const { data: c, error } = await supabase
        .from('consents')
        .select('photo_processing,image_generation,module_permissions')
        .eq('user_id', userId)
        .maybeSingle();
      if (!ativo) return;
      if (error) {
        setPermFotos(false); setPermImagens(false); setConsentido(false);
        return;
      }
      setPermFotos(!!c?.photo_processing);
      setPermImagens(!!c?.image_generation);
      setConsentido(!!((c?.module_permissions ?? {}) as Record<string, boolean>)['personal_model']);
    };
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !ativo) return;
      uid.current = u.user.id;
      await carregarPermissoes(u.user.id);
      await carregarModelo(u.user.id);
    })();
    // Voltou das Configurações? Revalida sem exigir recarregar a página.
    const aoVoltar = () => {
      if (document.visibilityState !== 'visible' || !uid.current) return;
      void carregarPermissoes(uid.current);
    };
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { ativo = false; window.removeEventListener('focus', aoVoltar); document.removeEventListener('visibilitychange', aoVoltar); };
  }, []);

  async function subirFoto(file: File) {
    setErr('');
    if (fotos.length >= 8) return setErr('Você pode enviar até 8 fotos.');
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErr('Use PNG ou JPG.');
    if (file.size > 5 * 1024 * 1024) return setErr('A foto deve ter até 5 MB.');
    const path = `${uid.current}/modelo-src-${Date.now()}-${fotos.length}.png`;
    const up = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type });
    if (up.error) return setErr('Não foi possível guardar a foto. Tente de novo.');
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

  async function gerarUm(tipo: 'rosto' | 'corpo', seedPath: string): Promise<{ ok: true } | { ok: false; motivo: string }> {
    const signed = await supabase.storage.from('user-photos').createSignedUrl(seedPath, 600);
    const seedUrl = signed.data?.signedUrl;
    if (!seedUrl) return { ok: false, motivo: 'não foi possível usar a foto base' };
    const r = await gerar({ data: { seedUrl, tipo } });
    if (!r.ok || !r.image_url) {
      const msg = r.error ?? 'Não foi possível gerar o modelo agora.';
      setPaywall(/gratuitas|Aura Pass/i.test(msg));
      return { ok: false, motivo: msg };
    }
    const blob = await (await fetch(r.image_url)).blob();
    const destino = `${uid.current}/modelo-${tipo}.png`;
    const up = await supabase.storage.from('user-photos').upload(destino, blob, { contentType: 'image/jpeg', upsert: true });
    if (up.error) return { ok: false, motivo: 'não foi possível guardar a imagem' };
    const prev = await supabase.storage.from('user-photos').createSignedUrl(destino, 3600);
    if (!prev.data?.signedUrl) return { ok: false, motivo: 'não foi possível abrir a imagem' };
    setModelo(m => ({ ...m, [tipo]: prev.data?.signedUrl }));
    window.dispatchEvent(new Event('aura:quota'));
    return { ok: true };
  }

  async function gerarModeloPessoal() {
    if (gerando) return;
    if (!seedRosto || !seedCorpo) { setErr('Envie as fotos e escolha as bases de rosto e corpo.'); return; }
    setGerando(true); setErr(''); setPaywall(false);
    try {
      const rosto = await gerarUm('rosto', seedRosto);
      const corpo = await gerarUm('corpo', seedCorpo);
      const falhas = [
        ...(rosto.ok ? [] : [{ tipo: 'rosto', motivo: rosto.motivo }]),
        ...(corpo.ok ? [] : [{ tipo: 'corpo', motivo: corpo.motivo }]),
      ];
      if (falhas.length === 0) {
        toast.success('Seu modelo pessoal está pronto.');
        return;
      }
      const partes = falhas.map(f => f.tipo).join(' e ');
      const motivos = [...new Set(falhas.map(f => f.motivo))].join(' · ');
      const mantidas = [
        ...(rosto.ok ? ['rosto'] : []),
        ...(corpo.ok ? ['corpo'] : []),
      ];
      setErr(`Não foi possível gerar o modelo de ${partes}: ${motivos}.${mantidas.length ? ` A imagem de ${mantidas.join(' e ')} foi mantida.` : ''}`);
    } finally { setGerando(false); }
  }

  const permissoesOk = permFotos && permImagens;

  return (
    <div className={`mx-auto max-w-3xl ${PILHA_PAGINA}`}>
      <div className="space-y-3">
        <CabecalhoPagina
          sobretitulo="A sua base para tudo"
          titulo={<>Meu <em>Modelo</em></>}
          descricao="Suba algumas fotos suas e a Aura cria duas imagens-base neutras — rosto e corpo — que preservam a SUA identidade. Maquiagem, cabelo, roupas e tatuagens passam a ser aplicadas sobre o seu modelo, nunca sobre uma pessoa genérica."
        />
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Requisitos (Configurações):</span>
          <Link to="/settings" className={permFotos ? 'rounded-full border px-2 py-0.5 text-accent' : 'rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-accent underline'}>Fotos {permFotos === null ? '…' : permFotos ? '✅' : '❌'}</Link>
          <Link to="/settings" className={permImagens ? 'rounded-full border px-2 py-0.5 text-accent' : 'rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-accent underline'}>Imagens de IA {permImagens === null ? '…' : permImagens ? '✅' : '❌'}</Link>
        </p>
      </div>

      <label className={`flex items-start justify-between gap-6 ${CARTAO_COMPACTO}`}>
        <div>
          <div className="font-medium">Autorizar meu modelo visual</div>
          <p className="text-sm text-muted-foreground">Permissão específica (LGPD): a Aura pode criar e usar imagens-base suas para simulações. Revoke quando quiser — excluir o modelo apaga as imagens do cofre.</p>
        </div>
        <Switch aria-label="Autorizar meu modelo visual" checked={consentido} disabled={!permissoesOk} onCheckedChange={async (v) => {
          try { await consentir({ data: { value: v } }); setConsentido(v); if (!v) await excluirModelo(); }
          catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar o perfil. Tente de novo.'); }
        }} />
      </label>

      {permissoesOk && consentido && (
        <>
          {(modelo.rosto || modelo.corpo) ? (
            <section className="space-y-3">
              <h2 className={TITULO_SECAO}>Seu modelo atual</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {modelo.rosto && <figure><img src={modelo.rosto} alt="Seu modelo de rosto" className="aspect-[3/4] w-full rounded-lg object-contain" /><figcaption className="mt-1 text-xs text-muted-foreground">Modelo · rosto</figcaption></figure>}
                {modelo.corpo && <figure><img src={modelo.corpo} alt="Seu modelo de corpo" className="aspect-[3/4] w-full rounded-lg object-contain" /><figcaption className="mt-1 text-xs text-muted-foreground">Modelo · corpo</figcaption></figure>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={gerando} onClick={() => void gerarModeloPessoal()}>{gerando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}{gerando ? 'Regenerando…' : 'Regenerar modelo'}</Button>
                <Button size="sm" variant="ghost" onClick={() => void excluirModelo()}><Trash2 aria-hidden className="size-4" /> Excluir modelo</Button>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className={TITULO_SECAO}>Criar meu modelo</h2>
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground hover:border-accent">
                <Upload aria-hidden className="size-6" />
                Envie de 3 a 8 fotos suas (rostos e corpo, bem iluminados)
                <input aria-label="Escolher fotos para o modelo pessoal" type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subirFoto(f); e.target.value = ''; }} />
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
                    <Button disabled={gerando || fotos.length < 3} onClick={() => void gerarModeloPessoal()}>{gerando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <UserRound aria-hidden className="size-4" />}{gerando ? 'Criando seu modelo…' : 'Gerar meu modelo'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => void removerFontes()}>Descartar fotos</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">A primeira geração é grátis (rosto + corpo). Regenerar faz parte do Aura Pass.</p>
                </>
              )}
            </section>
          )}
        </>
      )}

      {err && !paywall && <p role="alert" className="text-sm text-destructive">{err}</p>}
      {permissoesOk && consentido && <QuotaChip tasks={['webapp.modelo.render']} label="Modelo" />}
      {paywall && !gerando && <PaywallCard mensagem={err || "Sua geração grátis do modelo já foi usada — o Aura Pass libera regenerações."} />}
    </div>
  );
}
