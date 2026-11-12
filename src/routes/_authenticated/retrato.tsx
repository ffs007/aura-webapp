import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useServerFn } from '@tanstack/react-start';
import { interpretRetrato, editarRetrato, verificarRetrato, type VereditoRetrato } from '@/lib/retrato.functions';
import { QuotaChip } from '@/components/QuotaChip';
import { PaywallCard } from '@/components/PaywallCard';
import { Aviso, CabecalhoPagina, CarregandoPagina } from '@/components/estados';
import { CARTAO_DESTAQUE, PILHA_PAGINA } from '@/lib/design';
import { lerRascunho, limparRascunho, rotuloRascunho, useSalvarRascunho } from '@/hooks/useRascunho';

export const Route = createFileRoute('/_authenticated/retrato')({
  head: () => ({ meta: [{ title: 'Aura Retrato · Aura ID' }] }),
  component: Page,
});

function Page() {
  const interpret = useServerFn(interpretRetrato), editar = useServerFn(editarRetrato), verificar = useServerFn(verificarRetrato);
  const { user } = Route.useRouteContext();
  const [permite, setPermite] = useState<boolean | null>(null);
  const [permFotos, setPermFotos] = useState<boolean | null>(null);
  const [permImagens, setPermImagens] = useState<boolean | null>(null);
  const [foto, setFoto] = useState<{ path: string; url: string } | null>(null);
  const [pedido, setPedido] = useState('');
  const [interpretando, setInterpretando] = useState(false);
  const [ajustes, setAjustes] = useState<{ alvo: string; mudanca: string }[] | null>(null);
  const [duvidas, setDuvidas] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [veredito, setVeredito] = useState<VereditoRetrato | null>(null);
  const [pendencia, setPendencia] = useState<string[] | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [err, setErr] = useState('');
  const regen = useRef(false);
  const falhasRef = useRef<string[]>([]);
  const chaveRascunho = `retrato:${user.id}:pedido`;
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoAtivo, setRascunhoAtivo] = useState(true);

  // Permissões: consulta SEMPRE filtrada pelo usuário. Sem o filtro, um admin
  // (RLS "admin read consents") enxerga as linhas de todas as contas e o
  // maybeSingle() falha — parecia que o consentimento estava desligado.
  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      const { data, error } = await supabase
        .from('consents')
        .select('photo_processing,image_generation')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ativo) return;
      if (error) {
        setPermFotos(false); setPermImagens(false); setPermite(false);
        return;
      }
      setPermFotos(!!data?.photo_processing);
      setPermImagens(!!data?.image_generation);
      setPermite(!!data?.photo_processing && !!data?.image_generation);
    };
    void carregar();
    // Voltou das Configurações? Revalida sem exigir recarregar a página.
    const aoVoltar = () => { if (document.visibilityState === 'visible') void carregar(); };
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { ativo = false; window.removeEventListener('focus', aoVoltar); document.removeEventListener('visibilitychange', aoVoltar); };
  }, [user.id]);

  // Restaura o rascunho da descrição; a chave é por usuário.
  useEffect(() => {
    if (rascunhoCarregado) return;
    const r = lerRascunho<string>(chaveRascunho);
    if (typeof r === 'string' && r.trim()) setPedido(r);
    setRascunhoCarregado(true);
  }, [chaveRascunho, rascunhoCarregado]);

  const temPedido = pedido.trim().length > 0;
  const salvoEm = useSalvarRascunho(chaveRascunho, pedido, rascunhoCarregado && rascunhoAtivo && temPedido);

  async function subirFoto(file: File) {
    setErr('');
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErr('Use PNG ou JPG.');
    if (file.size > 5 * 1024 * 1024) return setErr('A foto deve ter até 5 MB. Escolha uma menor.');
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const path = `${u.user.id}/retrato-${crypto.randomUUID()}.png`;
    const up = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type });
    if (up.error) return setErr('Não foi possível guardar a foto. Tente de novo.');
    const signed = await supabase.storage.from('user-photos').createSignedUrl(path, 3600);
    setFoto({ path, url: signed.data?.signedUrl ?? '' });
    setAjustes(null); setResultado(null); setVeredito(null); setPendencia(null); setPaywall(false); regen.current = false;
  }

  async function removerFoto() {
    if (!foto) return;
    await supabase.storage.from('user-photos').remove([foto.path]);
    setFoto(null); setAjustes(null); setResultado(null); setVeredito(null); setErr('');
  }

  async function iniciar() {
    setErr(''); setAjustes(null); setDuvidas([]); setInterpretando(true);
    try {
      const r = await interpret({ data: { pedido } });
      if (r.error || !r.ajustes) { setErr(r.error ?? 'Não foi possível entender o pedido. Tente de novo.'); return; }
      setAjustes(r.ajustes); setDuvidas(r.duvidas);
    } catch { setErr('Não foi possível interpretar o pedido. Tente de novo.'); } finally { setInterpretando(false); }
  }

  async function rodarEdicao(lista: { alvo: string; mudanca: string }[], correcao?: string[]): Promise<boolean> {
    if (!foto) return false;
    falhasRef.current = [];
    setEditando(true); setErr(''); setPendencia(null); setPaywall(false); setVeredito(null);
    try {
      const signed = await supabase.storage.from('user-photos').createSignedUrl(foto.path, 600);
      const imageUrl = signed.data?.signedUrl;
      if (!imageUrl) { setErr('Não foi possível usar a foto. Tente de novo.'); return false; }
      const r = await editar({ data: { imageUrl, ajustes: lista, ...(correcao?.length ? { correcao } : {}) } });
      if (!r.ok || !r.image_url) {
        const msg = r.error ?? 'Não foi possível editar a foto agora.';
        setPaywall(/gratuitas|Aura Pass/i.test(msg));
        setErr(msg); return false;
      }
      setResultado(r.image_url);
      // Guarda o resultado no cofre privado e verifica com a IA de visão.
      const blob = await (await fetch(r.image_url)).blob();
      const { data: u } = await supabase.auth.getUser();
      const resPath = `${u.user?.id}/retrato-resultado-${crypto.randomUUID()}.png`;
      const up = await supabase.storage.from('user-photos').upload(resPath, blob, { contentType: 'image/jpeg' });
      if (!up.error) {
        const resSigned = await supabase.storage.from('user-photos').createSignedUrl(resPath, 600);
        if (resSigned.data?.signedUrl) {
          const v = await verificar({ data: { imageUrl: resSigned.data.signedUrl, ajustes: lista } });
          if (v.verificado && v.veredito) {
            setVeredito(v.veredito);
            if (!v.veredito.aprovado) { falhasRef.current = v.veredito.falhas; setPendencia(v.veredito.falhas); return false; }
          }
        }
      }
      setPendencia(null);
      limparRascunho(chaveRascunho);
      setRascunhoAtivo(false);
      window.dispatchEvent(new Event('aura:quota'));
      return true;
    } catch {
      setErr('Não foi possível editar a foto. Tente de novo.');
      return false;
    } finally { setEditando(false); }
  }

  async function confirmarEditar() {
    if (!ajustes) return;
    const ok = await rodarEdicao(ajustes);
    if (!ok && falhasRef.current.length && !regen.current) {
      regen.current = true;
      toast.info('A verificação não aprovou a edição — gerando de novo com as correções…');
      await rodarEdicao(ajustes, falhasRef.current);
    }
  }

  if (permite === null) return <CarregandoPagina rotulo="Verificando permissões…" />;
  const rotuloRascunhoAtual = temPedido && rascunhoAtivo ? rotuloRascunho(salvoEm) : '';

  return (
    <div className={`mx-auto max-w-3xl ${PILHA_PAGINA}`}>
      <div className="space-y-3">
        <CabecalhoPagina
          sobretitulo="Sua foto, suas regras"
          titulo={<>Aura <em>Retrato</em></>}
          descricao="Envie uma foto sua e descreva o que quer testar — maquiagem, cabelo, o que imaginar. A edição acontece sobre a SUA foto, que fica privada no seu cofre."
        />
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Requisitos (Configurações → Consentimento):</span>
          <Link to="/settings" className={permFotos ? 'rounded-full border px-2 py-0.5 text-accent' : 'rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-accent underline'}>Fotos {permFotos === null ? '…' : permFotos ? '✅' : '❌ ligar'}</Link>
          <Link to="/settings" className={permImagens ? 'rounded-full border px-2 py-0.5 text-accent' : 'rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-accent underline'}>Imagens de IA {permImagens === null ? '…' : permImagens ? '✅' : '❌ ligar'}</Link>
        </p>
      </div>

      {!permite ? (
        <Aviso tom="atencao" titulo="Permissões necessárias" acoes={<Button asChild size="sm"><Link to="/settings">Abrir Configurações</Link></Button>}>
          Para usar o Retrato, ative as permissões de <strong>fotos</strong> e <strong>imagens geradas por IA</strong> nas Configurações.
        </Aviso>
      ) : (
        <>
          {!foto ? (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground hover:border-accent">
              <Upload aria-hidden className="size-6" />
              Toque para escolher uma foto sua (PNG/JPG, até 5MB)
              <input type="file" aria-label="Escolher foto para o retrato" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subirFoto(f); e.target.value = ''; }} />
            </label>
          ) : (
            <figure className="space-y-2">
              <img src={foto.url} alt="Sua foto enviada, armazenada em privado" className="max-h-96 rounded-lg object-contain" />
              <figcaption className="flex items-center gap-3 text-xs text-muted-foreground">
                Foto privada · ninguém além de você vê
                <Button size="sm" variant="ghost" onClick={() => void removerFoto()}><Trash2 aria-hidden className="size-4" /> Excluir foto</Button>
              </figcaption>
            </figure>
          )}

          <section className="space-y-3">
            <label className="block text-sm">O que você quer aplicar na foto?</label>
            <Textarea aria-label="O que você quer aplicar na foto" placeholder="ex.: batom vermelho mate, cabelo com ondas leves, sombra esfumada marrom" maxLength={1000} value={pedido} onChange={(e) => { const v = e.target.value; setPedido(v); setRascunhoAtivo(true); if (!v.trim()) limparRascunho(chaveRascunho); }} />
            {rotuloRascunhoAtual && <p role="status" className="text-xs text-muted-foreground">{rotuloRascunhoAtual}</p>}
            <Button disabled={!foto || pedido.trim().length < 3 || interpretando || editando} onClick={() => void iniciar()}>
              {interpretando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
              {interpretando ? 'Interpretando…' : 'Entender meu pedido'}
            </Button>
          </section>

          {ajustes && (
            <section className={`${CARTAO_DESTAQUE} space-y-2`} role="region" aria-label="Confirmação do que será editado">
              <p className="text-sm font-medium">Vou aplicar na sua foto — confirme</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{ajustes.map((a) => <li key={a.alvo + a.mudanca}><strong className="capitalize">{a.alvo}:</strong> {a.mudanca}</li>)}</ul>
              {duvidas.length > 0 && <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{duvidas.map((d) => <li key={d}>Pendência: {d}</li>)}</ul>}
              <p className="mt-3 text-xs text-muted-foreground">O resto fica idêntico: rosto, pose, fundo e luz.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" disabled={editando} onClick={() => void confirmarEditar()}>
                  {editando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
                  {editando ? 'Editando sua foto…' : 'Confirmar e editar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAjustes(null)}>Mudar o pedido</Button>
              </div>
            </section>
          )}

          {resultado && (
            <figure className="space-y-2">
              <img src={resultado} alt="Sua foto com a edição aplicada por IA" className={`max-h-96 rounded-lg object-contain ${editando ? 'opacity-50' : ''}`} />
              <figcaption className="text-xs text-muted-foreground">Edição por IA sobre a sua foto · não é resultado profissional garantido</figcaption>
              {veredito?.aprovado && <p className="text-xs text-accent">Verificação automática: edição aprovada. {veredito.resumo}</p>}
            </figure>
          )}

          {pendencia && !editando && (
            <Aviso tom="atencao">
              Verificação automática — pendências após 2 tentativas: {pendencia.join(' · ')}
            </Aviso>
          )}

          {err && !paywall && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <QuotaChip tasks={['webapp.retrato.edit']} label="Retrato" />

          {paywall && !editando && <PaywallCard mensagem={err || "Suas edições gratuitas acabaram — o Aura Pass libera o Retrato."} />}
        </>
      )}
    </div>
  );
}
