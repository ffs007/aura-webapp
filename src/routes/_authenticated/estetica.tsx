import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle, Ruler, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import { PROCEDIMENTOS, analisarSimetria, briefingEstetico, simularProcedimento, type AnaliseSimetria } from '@/lib/estetica.functions';
import { EnviarBriefing } from '@/components/EnviarBriefing';
import { JornadaEstetica } from '@/components/JornadaEstetica';
import { QuotaChip } from '@/components/QuotaChip';
import { PaywallCard, ehErroDeCota } from '@/components/PaywallCard';
import { Aviso, CabecalhoPagina, CarregandoPagina } from '@/components/estados';
import { CARTAO_COMPACTO, CARTAO_DESTAQUE, FOCO, PILHA_PAGINA, TITULO_SECAO } from '@/lib/design';

export const Route = createFileRoute('/_authenticated/estetica')({
  head: () => ({ meta: [{ title: 'Estética · Aura ID' }] }),
  component: Page,
});

const DISCLAIMER = 'A Aura mede e informa — não diagnostica, não prescreve e não promete resultados. Toda decisão é sua, com um profissional habilitado.';

function Page() {
  const analisar = useServerFn(analisarSimetria), briefing = useServerFn(briefingEstetico), simular = useServerFn(simularProcedimento);
  const [simImg, setSimImg] = useState<string | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [reMedida, setReMedida] = useState<AnaliseSimetria | null>(null);
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
    let ativo = true;
    let idAtual = '';
    const carregar = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!ativo || !u.user) return;
      idAtual = u.user.id;
      setUserId(u.user.id);
      // Filtro por usuário é obrigatório: admin vê todas as linhas via RLS e o
      // maybeSingle() sem filtro falha, mostrando permissão desligada.
      const { data: c, error } = await supabase
        .from('consents')
        .select('photo_processing,image_generation')
        .eq('user_id', u.user.id)
        .maybeSingle();
      if (!ativo) return;
      setPermite(!error && !!c?.photo_processing && !!c?.image_generation);
    };
    void carregar();
    const aoVoltar = () => { if (document.visibilityState === 'visible' && idAtual) void carregar(); };
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { ativo = false; window.removeEventListener('focus', aoVoltar); document.removeEventListener('visibilitychange', aoVoltar); };
  }, []);

  const procObj = PROCEDIMENTOS.find((p) => p.id === proc);

  async function subir(file: File) {
    setErr(''); setAnalise(null); setBriefTxt(null);
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErr('Use PNG ou JPG.');
    if (file.size > 5 * 1024 * 1024) return setErr('A foto deve ter até 5 MB.');
    const path = `${userId}/estetica-${Date.now()}.png`;
    const up = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type });
    if (up.error) return setErr('Não foi possível guardar a foto. Tente de novo.');
    const s = await supabase.storage.from('user-photos').createSignedUrl(path, 3600);
    setFoto({ path, url: s.data?.signedUrl ?? '' });
  }

  async function medir() {
    if (!foto || !proc) return;
    setMedindo(true); setErr(''); setAnalise(null); setBriefTxt(null);
    try {
      const s = await supabase.storage.from('user-photos').createSignedUrl(foto.path, 600);
      const imageUrl = s.data?.signedUrl;
      if (!imageUrl) return setErr('Não foi possível usar a foto. Tente de novo.');
      const r = await analisar({ data: { imageUrl, procedimento: proc } });
      if (r.error || !r.analise) { setErr(r.error ?? 'Não foi possível medir com essa foto. Tente de novo.'); return; }
      setAnalise(r.analise);
      window.dispatchEvent(new Event('aura:quota'));
    } catch { setErr('Não foi possível medir a simetria. Tente de novo.'); } finally { setMedindo(false); }
  }

  async function simularNaFoto() {
    if (!foto || !proc || !analise) return;
    setSimulando(true); setErr(''); setSimImg(null); setReMedida(null);
    try {
      const s = await supabase.storage.from('user-photos').createSignedUrl(foto.path, 600);
      const imageUrl = s.data?.signedUrl;
      if (!imageUrl) return setErr('Não foi possível usar a foto. Tente de novo.');
      const r = await simular({ data: { imageUrl, procedimento: proc, regioes: analise.regioes } });
      if (!r.ok || !r.image_url) { setErr(r.error ?? 'Não foi possível simular agora.'); return; }
      setSimImg(r.image_url);
      // Guarda a simulação no cofre e RE-MEDE para mostrar o antes/depois.
      const blob = await (await fetch(r.image_url)).blob();
      const destino = `${userId}/estetica-sim-${Date.now()}.png`;
      const up = await supabase.storage.from('user-photos').upload(destino, blob, { contentType: 'image/jpeg' });
      if (!up.error) {
        const rs = await supabase.storage.from('user-photos').createSignedUrl(destino, 600);
        if (rs.data?.signedUrl) {
          const m = await analisar({ data: { imageUrl: rs.data.signedUrl, procedimento: proc } });
          if (!m.error && m.analise) setReMedida(m.analise);
        }
      }
      window.dispatchEvent(new Event('aura:quota'));
    } catch { setErr('Não foi possível simular o procedimento. Tente de novo.'); } finally { setSimulando(false); }
  }

  async function gerarBriefing() {
    if (!analise || !procObj) return;
    setGerandoBrief(true); setErr('');
    try {
      const simulacao = reMedida
        ? `Simulação ilustrativa aplicada sobre a foto. Medidas antes → depois: ${analise.regioes.map((a) => { const d = reMedida.regioes.find((x) => x.regiao === a.regiao); return d ? `${a.regiao} ${a.assimetria_pct.toFixed(0)}%→${d.assimetria_pct.toFixed(0)}%` : ''; }).filter(Boolean).join('; ')}.`
        : undefined;
      const r = await briefing({ data: { procedimento: procObj.nome, regioes: analise.regioes, resumo: analise.resumo, ...(simulacao ? { simulacao } : {}) } });
      if (r.error || !r.texto) { setErr(r.error ?? 'Não foi possível montar o briefing. Tente de novo.'); return; }
      setBriefTxt({ titulo: r.titulo ?? 'Briefing estético', texto: r.texto });
    } catch { setErr('Não foi possível montar o briefing. Tente de novo.'); } finally { setGerandoBrief(false); }
  }

  function baixar() {
    if (!briefTxt) return;
    const blob = new Blob([briefTxt.texto], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aura-id-briefing-estetico.md'; a.click();
    URL.revokeObjectURL(url);
  }

  if (permite === null) return <CarregandoPagina rotulo="Verificando permissões…" />;

  return (
    <div className={`mx-auto max-w-3xl ${PILHA_PAGINA}`}>
      <div className="space-y-3">
        <CabecalhoPagina
          sobretitulo="Medir para decidir melhor"
          titulo={<>Estética <em>& simetria</em></>}
          descricao="Escolha um procedimento de interesse, envie a foto no ângulo certo e a Aura mede a simetria das regiões do seu rosto — o primeiro passo para uma conversa bem informada com um profissional."
        />
        <Aviso tom="atencao">⚕️ {DISCLAIMER}</Aviso>
        <QuotaChip tasks={['webapp.estetica.sim']} label="Estética" />
      </div>

      {permite === false && (
        <Aviso tom="atencao" titulo="Permissões necessárias" acoes={<Button asChild size="sm"><Link to="/settings">Abrir Configurações</Link></Button>}>
          Ative as permissões de <strong>fotos</strong> e <strong>imagens de IA</strong> nas Configurações para usar a medição.
        </Aviso>
      )}

      {permite && !proc && (
        <section className="grid gap-3 sm:grid-cols-2">
          {PROCEDIMENTOS.map((p) => (
            <button key={p.id} onClick={() => setProc(p.id)} aria-pressed={proc === p.id} className={`${CARTAO_COMPACTO} ${FOCO} text-left transition hover:border-accent`}>
              <p className="font-medium">{p.nome}</p>
              <p className="mt-1 text-xs text-muted-foreground">Medição de simetria + briefing de avaliação</p>
            </button>
          ))}
        </section>
      )}

      {permite && procObj && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={TITULO_SECAO}>{procObj.nome}</h2>
            <Button size="sm" variant="ghost" onClick={() => { setProc(null); setFoto(null); setAnalise(null); setBriefTxt(null); }}>Trocar procedimento</Button>
          </div>

          <div className={`${CARTAO_DESTAQUE} text-sm`}>
            <p className="font-medium">📷 Como tirar a foto (importante pra medição)</p>
            <p className="mt-1 text-muted-foreground">{procObj.captura}</p>
          </div>

          {!foto ? (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground hover:border-accent">
              <Upload aria-hidden className="size-6" />
              Sua foto fica privada (cofre só seu) e é vista apenas pela IA de medição
              <input type="file" aria-label="Escolher foto para medição de simetria" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); e.target.value = ''; }} />
            </label>
          ) : (
            <figure className="space-y-2">
              <img src={foto.url} alt="Sua foto para medição de simetria" className="max-h-96 rounded-lg object-contain" />
              <Button size="sm" variant="outline" disabled={medindo} onClick={() => void medir()}>{medindo ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Ruler aria-hidden className="size-4" />}{medindo ? 'Medindo simetria…' : 'Medir simetria'}</Button>
            </figure>
          )}

          {analise && (
            <div className={`space-y-4 ${CARTAO_COMPACTO}`}>
              <p className="text-sm font-medium">Resultado da medição <span className="text-xs font-normal text-muted-foreground">(menor = mais simétrico; 2–15 é faixa natural de rostos)</span></p>
              {analise.regioes.map((r) => (
                <div key={r.regiao}>
                  <div className="flex items-center justify-between text-sm"><span className="capitalize">{r.regiao}</span><span className="tabular-nums text-muted-foreground">{r.assimetria_pct.toFixed(0)}%</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded bg-secondary"><div className={`h-full ${r.assimetria_pct > 15 ? 'bg-ochre' : 'bg-accent'}`} style={{ width: `${Math.min(100, r.assimetria_pct * 5)}%` }} /></div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.observacao}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{analise.resumo}</p>
              {analise.limitacoes && <Aviso tom="atencao">⚠️ {analise.limitacoes}</Aviso>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={simulando} onClick={() => void simularNaFoto()}>{simulando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : '🎬'}{simulando ? 'Simulando na sua foto…' : 'Simular procedimento na minha foto'}</Button>
                <Button size="sm" disabled={gerandoBrief} onClick={() => void gerarBriefing()}>{gerandoBrief ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}{gerandoBrief ? 'Montando briefing…' : 'Gerar briefing de avaliação'}</Button>
              </div>
            </div>
          )}

          {simImg && foto && (
            <div className={`space-y-4 ${CARTAO_COMPACTO}`}>
              <p className="text-sm font-medium">Antes e depois (simulação ilustrativa)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <figure><img src={foto.url} alt="Sua foto original" className="aspect-[3/4] w-full rounded-lg object-contain" /><figcaption className="mt-1 text-xs text-muted-foreground">Antes (medido)</figcaption></figure>
                <figure><img src={simImg} alt="Simulação do procedimento" className={`aspect-[3/4] w-full rounded-lg object-contain ${simulando ? 'opacity-50' : ''}`} /><figcaption className="mt-1 text-xs text-muted-foreground">Depois (simulado por IA)</figcaption></figure>
              </div>
              {reMedida && (
                <div className="space-y-1 text-sm">
                  {analise?.regioes.map((a) => {
                    const d = reMedida.regioes.find((x) => x.regiao === a.regiao);
                    if (!d) return null;
                    const delta = a.assimetria_pct - d.assimetria_pct;
                    return (
                      <div key={a.regiao} className="flex items-center justify-between gap-2 text-xs">
                        <span className="capitalize">{a.regiao}</span>
                        <span className="tabular-nums">{a.assimetria_pct.toFixed(0)}% → <strong>{d.assimetria_pct.toFixed(0)}%</strong> {delta > 0.5 ? <span className="text-accent">(−{delta.toFixed(0)} assimetria)</span> : delta < -0.5 ? <span className="text-muted-foreground">(+{(-delta).toFixed(0)} na re-leitura)</span> : <span className="text-muted-foreground">(estável)</span>}</span>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-xs text-muted-foreground">Re-leitura da simulação: {reMedida.resumo}</p>
                </div>
              )}
              <Aviso tom="atencao">⚕️ Simulação gerada por IA sobre a sua foto — caráter ilustrativo, não é garantia de resultado. Avaliação presencial define o que é possível.</Aviso>
            </div>
          )}

          {briefTxt && (
            <div className={`space-y-3 ${CARTAO_COMPACTO}`}>
              <p className="text-sm font-medium">{briefTxt.titulo}</p>
              <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs leading-relaxed">{briefTxt.texto}</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(briefTxt.texto); toast.success('Copiado!'); }}>Copiar</Button>
                <Button size="sm" variant="secondary" onClick={baixar}>Baixar .md</Button>
              </div>
              <EnviarBriefing titulo={briefTxt.titulo} texto={briefTxt.texto} modulo="estetica" profissaoFixa="esteticista" fotoPath={foto?.path ?? undefined} />
              <Aviso tom="atencao">⚕️ {DISCLAIMER}</Aviso>
            </div>
          )}

          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <PaywallCard mensagem={ehErroDeCota(err) ? err : null} />
        </section>
      )}

      <JornadaEstetica procedimentoAtual={proc} />
    </div>
  );
}
