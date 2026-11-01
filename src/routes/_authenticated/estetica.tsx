import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle, Ruler, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import { PROCEDIMENTOS, analisarSimetria, briefingEstetico, type AnaliseSimetria } from '@/lib/estetica.functions';
import { EnviarBriefing } from '@/components/EnviarBriefing';

export const Route = createFileRoute('/_authenticated/estetica')({
  head: () => ({ meta: [{ title: 'Estética · Aura ID' }] }),
  component: Page,
});

const DISCLAIMER = 'A Aura mede e informa — não diagnostica, não prescreve e não promete resultados. Toda decisão é sua, com um profissional habilitado.';

function Page() {
  const analisar = useServerFn(analisarSimetria), briefing = useServerFn(briefingEstetico);
  const [permite, setPermite] = useState<boolean | null>(null);
  const [proc, setProc] = useState<string | null>(null);
  const [foto, setFoto] = useState<{ path: string; url: string } | null>(null);
  const [medindo, setMedindo] = useState(false);
  const [analise, setAnalise] = useState<AnaliseSimetria | null>(null);
  const [err, setErr] = useState('');
  const [briefTxt, setBriefTxt] = useState<{ titulo: string; texto: string } | null>(null);
  const [gerandoBrief, setGerandoBrief] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) setUserId(u.user.id);
      const { data: c } = await supabase.from('consents').select('photo_processing,image_generation').maybeSingle();
      setPermite(!!c?.photo_processing && !!c?.image_generation);
    })();
  }, []);

  const procObj = PROCEDIMENTOS.find((p) => p.id === proc);

  async function subir(file: File) {
    setErr(''); setAnalise(null); setBriefTxt(null);
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErr('Envie PNG ou JPG.');
    if (file.size > 5 * 1024 * 1024) return setErr('Foto acima de 5MB.');
    const path = `${userId}/estetica-${Date.now()}.png`;
    const up = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type });
    if (up.error) return setErr('Não foi possível guardar a foto.');
    const s = await supabase.storage.from('user-photos').createSignedUrl(path, 3600);
    setFoto({ path, url: s.data?.signedUrl ?? '' });
  }

  async function medir() {
    if (!foto || !proc) return;
    setMedindo(true); setErr(''); setAnalise(null); setBriefTxt(null);
    try {
      const s = await supabase.storage.from('user-photos').createSignedUrl(foto.path, 600);
      const imageUrl = s.data?.signedUrl;
      if (!imageUrl) return setErr('Não consegui autorizar o uso da foto.');
      const r = await analisar({ data: { imageUrl, procedimento: proc } });
      if (r.error || !r.analise) { setErr(r.error ?? 'Não consegui medir com essa foto.'); return; }
      setAnalise(r.analise);
      window.dispatchEvent(new Event('aura:quota'));
    } catch { setErr('A medição falhou. Tente novamente.'); } finally { setMedindo(false); }
  }

  async function gerarBriefing() {
    if (!analise || !procObj) return;
    setGerandoBrief(true); setErr('');
    try {
      const r = await briefing({ data: { procedimento: procObj.nome, regioes: analise.regioes, resumo: analise.resumo } });
      if (r.error || !r.texto) { setErr(r.error ?? 'Não consegui montar o briefing.'); return; }
      setBriefTxt({ titulo: r.titulo ?? 'Briefing estético', texto: r.texto });
    } catch { setErr('Não consegui montar o briefing.'); } finally { setGerandoBrief(false); }
  }

  function baixar() {
    if (!briefTxt) return;
    const blob = new Blob([briefTxt.texto], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aura-id-briefing-estetico.md'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <span className="text-sm text-accent">Medir para decidir melhor</span>
        <h1 className="mt-2 text-5xl">Estética <em>& simetria</em></h1>
        <p className="mt-3 text-muted-foreground">Escolha um procedimento de interesse, envie a foto no ângulo certo e a Aura <strong>mede a simetria</strong> das regiões do seu rosto — o primeiro passo para uma conversa bem informada com um profissional.</p>
        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">⚕️ {DISCLAIMER}</p>
      </div>

      {permite === false && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 space-y-2">
          <p className="text-sm">Ative as permissões de <strong>fotos</strong> e <strong>imagens de IA</strong> nas Configurações para usar a medição.</p>
          <Button asChild size="sm"><Link to="/settings">Abrir Configurações</Link></Button>
        </div>
      )}

      {permite && !proc && (
        <section className="grid gap-3 sm:grid-cols-2">
          {PROCEDIMENTOS.map((p) => (
            <button key={p.id} onClick={() => setProc(p.id)} className="rounded-xl border bg-card p-5 text-left transition hover:border-accent">
              <p className="font-medium">{p.nome}</p>
              <p className="mt-1 text-xs text-muted-foreground">Medição de simetria + briefing de avaliação</p>
            </button>
          ))}
        </section>
      )}

      {permite && procObj && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-3xl">{procObj.nome}</h2>
            <Button size="sm" variant="ghost" onClick={() => { setProc(null); setFoto(null); setAnalise(null); setBriefTxt(null); }}>Trocar procedimento</Button>
          </div>

          <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm">
            <p className="font-medium">📷 Como tirar a foto (importante pra medição)</p>
            <p className="mt-1 text-muted-foreground">{procObj.captura}</p>
          </div>

          {!foto ? (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground hover:border-accent">
              <Upload className="size-6" />
              Sua foto fica privada (cofre só seu) e é vista apenas pela IA de medição
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); e.target.value = ''; }} />
            </label>
          ) : (
            <figure className="space-y-2">
              <img src={foto.url} alt="Sua foto para medição de simetria" className="max-h-96 rounded-lg object-contain" />
              <Button size="sm" variant="outline" disabled={medindo} onClick={() => void medir()}>{medindo ? <LoaderCircle className="size-4 animate-spin" /> : <Ruler className="size-4" />}{medindo ? 'Medindo simetria…' : 'Medir simetria'}</Button>
            </figure>
          )}

          {analise && (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <p className="text-sm font-medium">Resultado da medição <span className="text-xs font-normal text-muted-foreground">(menor = mais simétrico; 2–15 é faixa natural de rostos)</span></p>
              {analise.regioes.map((r) => (
                <div key={r.regiao}>
                  <div className="flex items-center justify-between text-sm"><span className="capitalize">{r.regiao}</span><span className="tabular-nums text-muted-foreground">{r.assimetria_pct.toFixed(0)}%</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded bg-secondary"><div className={`h-full ${r.assimetria_pct > 15 ? 'bg-amber-500' : 'bg-accent'}`} style={{ width: `${Math.min(100, r.assimetria_pct * 5)}%` }} /></div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.observacao}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{analise.resumo}</p>
              {analise.limitacoes && <p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700">⚠️ {analise.limitacoes}</p>}
              <Button size="sm" disabled={gerandoBrief} onClick={() => void gerarBriefing()}>{gerandoBrief ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{gerandoBrief ? 'Montando briefing…' : 'Gerar briefing de avaliação'}</Button>
            </div>
          )}

          {briefTxt && (
            <div className="space-y-3 rounded-lg border bg-card p-5">
              <p className="text-sm font-medium">{briefTxt.titulo}</p>
              <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs leading-relaxed">{briefTxt.texto}</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(briefTxt.texto); toast.success('Copiado!'); }}>Copiar</Button>
                <Button size="sm" variant="secondary" onClick={baixar}>Baixar .md</Button>
              </div>
              <EnviarBriefing titulo={briefTxt.titulo} texto={briefTxt.texto} modulo="estetica" profissaoFixa="esteticista" />
              <p className="text-xs text-amber-700">⚕️ {DISCLAIMER}</p>
            </div>
          )}

          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        </section>
      )}
    </div>
  );
}
