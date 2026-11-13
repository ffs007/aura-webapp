import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle, PenTool, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuotaChip } from '@/components/QuotaChip';
import { PaywallCard } from '@/components/PaywallCard';
import { Aviso, CabecalhoPagina, EsqueletoLista, EstadoVazio } from '@/components/estados';
import { FOCO, META, PILHA_PAGINA, TITULO_ITEM } from '@/lib/design';
import { supabase } from '@/integrations/supabase/client';
import { enviarBriefing } from '@/lib/profissionais.functions';
import { listarVitrine, copiarDesign, ESTILOS_VITRINE, type DesignVitrine, type CopiadoDesign } from '@/lib/vitrine.functions';

export const Route = createFileRoute('/_authenticated/tatuagem/vitrine')({
  head: () => ({ meta: [{ title: 'Vitrine de tatuagens · Aura ID' }] }),
  component: Page,
});

/** Fatia D1+D2 — vitrine dos estúdios + "Copiar pra mim": a IA aplica o design no corpo da cliente. */
function Page() {
  const listar = useServerFn(listarVitrine), copiar = useServerFn(copiarDesign), enviar = useServerFn(enviarBriefing);
  const [estilo, setEstilo] = useState('');
  const [designs, setDesigns] = useState<DesignVitrine[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [temCorpo, setTemCorpo] = useState(false);
  const [uid, setUid] = useState('');
  const [provando, setProvando] = useState('');
  const [enviando, setEnviando] = useState('');
  const [provas, setProvas] = useState<Record<string, CopiadoDesign>>({});
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUid(u.user.id);
      const { data: arqs } = await supabase.storage.from('user-photos').list(u.user.id, { search: 'modelo-' });
      setTemCorpo((arqs ?? []).some((a) => a.name === 'modelo-corpo.png'));
    })();
  }, []);

  async function carregar(e: string) {
    setEstilo(e); setCarregando(true);
    try { setDesigns(await listar({ data: e ? { estilo: e } : {} })); } catch { setDesigns([]); } finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(''); }, []);

  async function copiarPraMim(d: DesignVitrine) {
    if (provando) return;
    if (!temCorpo || !uid) {
      toast.error('Crie seu 👤 Meu Modelo (foto do corpo) primeiro — é rápido e a tatuagem sai em você.');
      return;
    }
    setProvando(d.id); setPaywall(false);
    try {
      const r = await copiar({ data: { design_id: d.id, foto_path: `${uid}/modelo-corpo.png` } });
      setProvas((xs) => ({ ...xs, [d.id]: r }));
      window.dispatchEvent(new Event('aura:quota'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível aplicar o design. Tente de novo.';
      setPaywall(/gratuitas|Aura Pass/i.test(msg));
      toast.error(msg);
    } finally { setProvando(''); }
  }

  /** "Quero essa": guarda a simulação no cofre privado e vira briefing pro estúdio. */
  async function queroEssa(d: DesignVitrine) {
    const prova = provas[d.id];
    if (!prova || enviando) return;
    setEnviando(d.id);
    try {
      const blob = await (await fetch(prova.image_url)).blob();
      const caminho = `${uid}/vitrine-${d.id}.png`;
      const up = await supabase.storage.from('user-photos').upload(caminho, blob, { contentType: 'image/png' });
      if (up.error) throw new Error(up.error.message);
      const s = await supabase.storage.from('user-photos').createSignedUrl(caminho, 60 * 60 * 24 * 30);
      const fotoUrl = s.data?.signedUrl;
      const p = prova.design;
      const texto = `A cliente viu o design "${p.titulo}"${p.estilo ? ` (estilo ${p.estilo})` : ''} na vitrine e quer essa tatuagem.\n\n- Design: ${p.titulo}\n- Local desejado: ${p.local_sugerido ?? 'a combinar com o estúdio'}\n- Tamanho de referência: ${p.tamanho ?? 'a definir'}\n- Imagem anexa: simulação da tatuagem NO CORPO da cliente (gerada por IA — usar como referência da intenção, não como molde final).\n\nPerguntas da cliente: tamanho ideal para o local? o design precisa de adaptação? dá em uma sessão?`;
      await enviar({ data: { professional_id: p.professional_id, modulo: 'tatuagem', titulo: `Quero esse design: ${p.titulo}`, texto, ...(fotoUrl ? { foto_url: fotoUrl } : {}) } });
      toast.success(`Briefing enviado para ${p.estudio}! A resposta aparece em Profissionais → Meus envios.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível enviar o briefing. Tente de novo.'); } finally { setEnviando(''); }
  }

  return (
    <div className={PILHA_PAGINA}>
      <div className="space-y-2">
        <CabecalhoPagina
          sobretitulo="Aura ID · Tatuagem"
          titulo="🖤 Vitrine dos estúdios"
          descricao={<>Designs publicados pelas tatuadoras da rede. Achou o seu? <strong>Copie pra você</strong>: a IA aplica no seu corpo (use seu 👤 Meu Modelo) — e com um clique o briefing vai direto pro estúdio.</>}
        />
        <QuotaChip tasks={['webapp.ink.tryon']} />
        {!temCorpo && (
          <Aviso tom="atencao">
            Para copiar um design pro seu corpo, crie seu <Link to="/modelo" className="underline">👤 Meu Modelo</Link> primeiro (foto do corpo).
          </Aviso>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void carregar('')} aria-pressed={estilo === ''} className={`rounded-full px-3 py-1 text-sm ${FOCO} ${estilo === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Todos</button>
        {ESTILOS_VITRINE.map((e) => (
          <button key={e} onClick={() => void carregar(e)} aria-pressed={estilo === e} className={`rounded-full px-3 py-1 text-sm capitalize ${FOCO} ${estilo === e ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{e}</button>
        ))}
      </div>

      {carregando && <EsqueletoLista colunas={3} itens={6} altura="h-64" />}
      {designs?.length === 0 && (
        <EstadoVazio
          compacto
          icone={<PenTool className="size-6" />}
          titulo={`Nenhum design publicado ainda${estilo ? ` no estilo ${estilo}` : ''}`}
          descricao="Convide seu estúdio — publicar é grátis."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs?.map((d) => (
          <article key={d.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
            <img src={d.imagem_url} alt={d.titulo} className="aspect-square w-full bg-secondary object-contain" loading="lazy" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div>
                {d.destaque > 0 && <Badge variant="secondary">Patrocinado</Badge>}
                <h2 className={`mt-1 ${TITULO_ITEM}`}>{d.titulo}</h2>
                <p className={META}>
                  {d.estilo ? `${d.estilo} · ` : ''}{d.local_sugerido ?? 'local a combinar'}{d.tamanho ? ` · ${d.tamanho}` : ''}
                </p>
                {d.estudio && (
                  <p className="text-xs text-accent">
                    {d.slug
                      ? <Link to="/p/$slug" params={{ slug: d.slug }} className="underline">{d.estudio}{d.verificado ? ' ✓' : ''}</Link>
                      : <>{d.estudio}{d.verificado ? ' ✓' : ''}</>}
                  </p>
                )}
                {d.descricao && <p className={`mt-1 ${META}`}>{d.descricao}</p>}
              </div>
              <Button size="sm" className="w-full" disabled={!!provando} onClick={() => void copiarPraMim(d)}>
                {provando === d.id ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
                {provando === d.id ? 'Aplicando em você…' : 'Copiar pra mim'}
              </Button>
              {provas[d.id] && (
                <div className="space-y-2 rounded-md border border-accent/40 bg-accent/5 p-2" role="region" aria-label={`Simulação de ${d.titulo}`}>
                  <img src={provas[d.id]?.image_url} alt={`Você com ${d.titulo}`} className="aspect-[2/3] w-full rounded object-contain" />
                  <p className={META}>Simulação no seu corpo · gerada por IA</p>
                  <Button size="sm" className="w-full" disabled={!!enviando} onClick={() => void queroEssa(d)}>
                    {enviando === d.id ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
                    Quero essa — enviar pro estúdio
                  </Button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <PaywallCard mensagem={paywall ? 'Seus testes grátis acabaram — o Aura Pass libera as provas de tatuagem.' : null} />
    </div>
  );
}
