import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Download, Trash2, Expand, LoaderCircle, Shirt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { prepareReference, finishReference, interpretLookRequest, verifyReference, guiaPosGeracao } from "@/lib/references.functions";
import { interpretTattooRequest } from "@/lib/tattoo.functions";
import { resumoDoPedido, type TattooBrief } from "@/lib/tattoo-brief";
import { imagemVazia } from "@/lib/imagem-vazia";
import { QuotaChip } from "@/components/QuotaChip";
import { EnviarBriefing } from "@/components/EnviarBriefing";
import { Aviso, CarregandoInline, EstadoErro } from "@/components/estados";
import { PaywallCard } from "@/components/PaywallCard";
import { CARTAO_COMPACTO, CARTAO_DESTAQUE, META } from "@/lib/design";
import { AVISO_SEM_BASE, escolherBaseTatuagem } from "@/lib/base-tatuagem";
import { buscarPecas, provarPeca, type PecaCasada } from "@/lib/catalogo.functions";
import { streamImage } from "@/lib/stream-image";

type LookBrief = { kind: string; resumo?: string; atributos: { rotulo: string; valor: string }[]; ajuste_usuario: string; duvidas: string[] };

export function ReferenceImage({ packageId, slot = "avatar", tattoo = false, look = false }: { packageId?: string; slot?: string; tattoo?: boolean; look?: boolean }) {
  const prepare = useServerFn(prepareReference), finish = useServerFn(finishReference), interpret = useServerFn(interpretTattooRequest), interpretLook = useServerFn(interpretLookRequest), guia = useServerFn(guiaPosGeracao), pecasFn = useServerFn(buscarPecas), provarFn = useServerFn(provarPeca), qc = useQueryClient();
  const [pecas, setPecas] = useState<PecaCasada[] | null>(null);
  const [buscandoPecas, setBuscandoPecas] = useState(false);
  const [provando, setProvando] = useState("");
  const [provas, setProvas] = useState<Record<string, string>>({});
  async function verPecas() {
    setBuscandoPecas(true); setPecas(null);
    try {
      const atributos = lookBrief ? lookBrief.atributos.map((a) => `${a.rotulo}: ${a.valor}`).join("; ") : "";
      setPecas(await pecasFn({ data: { texto: atributos || "look outfit" } }));
    } catch { toast.error("Não foi possível buscar o catálogo. Tente de novo."); } finally { setBuscandoPecas(false); }
  }
  const [busy, setBusy] = useState(false), [preview, setPreview] = useState<string | null>(null), [final, setFinal] = useState(false), [open, setOpen] = useState(false), [agree, setAgree] = useState(false), [err, setErr] = useState("");
  const [brief, setBrief] = useState<TattooBrief | null>(null), [lookBrief, setLookBrief] = useState<LookBrief | null>(null), [interpretando, setInterpretando] = useState(false);
  const [pendencia, setPendencia] = useState<string[] | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [gostei, setGostei] = useState(false);
  const [guiaTxt, setGuiaTxt] = useState<{ titulo: string; texto: string } | null>(null);
  const [guiaTipo, setGuiaTipo] = useState("");
  const [gerandoGuia, setGerandoGuia] = useState("");
  async function pedirGuia(tipo: "casa" | "salao" | "busca") {
    if (!packageId) return;
    setGerandoGuia(tipo); setGuiaTxt(null); setGuiaTipo(tipo);
    try {
      const r = await guia({ data: { packageId, slot, tipo } });
      if (r.error || !r.texto) { toast.error(r.error ?? "Não foi possível montar o guia. Tente de novo."); return; }
      setGuiaTxt({ titulo: r.titulo ?? "Guia", texto: r.texto });
    } catch { toast.error("Não foi possível montar o guia. Tente de novo."); } finally { setGerandoGuia(""); }
  }
  function baixarGuia() {
    if (!guiaTxt) return;
    const blob = new Blob([guiaTxt.texto], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aura-id-${guiaTxt.titulo.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 40)}.md`; a.click();
    URL.revokeObjectURL(url);
  }
  const [temModelo, setTemModelo] = useState(false);
  const [temCorpo, setTemCorpo] = useState(false);
  const [fotoLocal, setFotoLocal] = useState<string | null>(null);
  const [usarModelo, setUsarModelo] = useState(true);
  const pacoteKind = useRef("");
  useEffect(() => {
    if (!(tattoo || look) || !packageId) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: arqs } = await supabase.storage.from("user-photos").list(u.user.id, { search: "modelo-" });
      const nomes = new Set((arqs ?? []).map((a) => a.name));
      setTemModelo(nomes.has("modelo-rosto.png") || nomes.has("modelo-corpo.png"));
      setTemCorpo(nomes.has("modelo-corpo.png"));
      const { data: p } = await supabase.from("packages").select("kind,context").eq("id", packageId).maybeSingle();
      pacoteKind.current = String(p?.kind ?? "");
      // Tatuagem: foto privada do local é a base que garante a região certa na prévia.
      if (tattoo) {
        const pid = (p?.context as Record<string, unknown> | null)?.["project_id"];
        if (pid) {
          const { data: fotos } = await supabase.from("photos").select("path")
            .eq("user_id", u.user.id).eq("tattoo_project_id", String(pid)).eq("kind", "tattoo_body")
            .order("created_at", { ascending: false }).limit(1);
          setFotoLocal(fotos?.[0]?.path ?? null);
        }
      }
    })();
  }, [packageId, tattoo, look]);
  /** Fatia B3 — provador: base preferida é o modelo pessoal (corpo); senão o visual gerado. */
  async function provar(p: PecaCasada) {
    if (provando) return;
    const { data: u } = await supabase.auth.getUser();
    const base = temCorpo && u.user ? `${u.user.id}/modelo-corpo.png` : q.data?.path;
    if (!base) { toast.error("Gere o visual primeiro — ou crie seu 👤 Meu Modelo."); return; }
    setProvando(p.id); setPaywall(false);
    try {
      const r = await provarFn({ data: { peca_id: p.id, foto_path: base } });
      setProvas((xs) => ({ ...xs, [p.id]: r.image_url }));
      window.dispatchEvent(new Event("aura:quota"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível provar a peça. Tente de novo.";
      setPaywall(/gratuitas|Aura Pass/i.test(msg));
      toast.error(msg);
    } finally { setProvando(""); }
  }
  const regen = useRef(false);
  const running = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [decorrido, setDecorrido] = useState(0);
  useEffect(() => {
    if (!busy) { setDecorrido(0); return; }
    const inicio = Date.now();
    const t = setInterval(() => setDecorrido(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => clearInterval(t);
  }, [busy]);
  function cancelarGeracao() {
    abortRef.current?.abort();
    toast.info("Cancelando a geração…");
  }
  const refsPaths = useRef<string[]>([]);
  const carregarRefsTattoo = async () => {
    if (!packageId) { refsPaths.current = []; return; }
    try {
      const { data: pack } = await supabase.from("packages").select("context").eq("id", packageId).maybeSingle();
      const pid = (pack?.context as Record<string, unknown> | null)?.["project_id"];
      if (!pid) { refsPaths.current = []; return; }
      const { data: fotos } = await supabase.from("photos").select("path")
        .eq("tattoo_project_id", String(pid)).eq("kind", "tattoo_reference").limit(3);
      refsPaths.current = (fotos ?? []).map((f: { path: string }) => f.path);
    } catch { refsPaths.current = []; }
  };
  const key = ["references", packageId ?? "avatar", slot];
  const q = useQuery({ queryKey: key, queryFn: async () => {
    let query = supabase.from("generated_references").select("id,path,status,error").eq("slot", slot).order("created_at", { ascending: false }).limit(1);
    query = packageId ? query.eq("package_id", packageId) : query.is("package_id", null);
    const { data, error } = await query.maybeSingle(); if (error) throw error;
    const signed = data?.path ? await supabase.storage.from("user-photos").createSignedUrl(data.path, 3600) : null;
    return { ...data, url: signed?.data?.signedUrl };
  } });
  const image = preview ?? q.data?.url;
  async function remove() {
    if (!q.data?.id) return;
    if (q.data.path) { const r = await supabase.storage.from("user-photos").remove([q.data.path]); if (r.error) throw r.error; await supabase.from("photos").delete().eq("path", q.data.path); }
    const r = await supabase.from("generated_references").delete().eq("id", q.data.id); if (r.error) throw r.error;
    setPreview(null); await qc.invalidateQueries({ queryKey: key });
  }
  const verify = useServerFn(verifyReference);
  async function generate(briefConfirmado?: TattooBrief | LookBrief) {
    if (running.current) return;
    running.current = true; setBusy(true); setErr(""); setPendencia(null); setPaywall(false); setGostei(false); setGuiaTxt(null);
    try {
      const r1 = await runGeneration(briefConfirmado);
      if (r1.status === "reprovado" && !regen.current) {
        regen.current = true;
        toast.info("A verificação não aprovou a imagem — gerando de novo com as correções…");
        await runGeneration(briefConfirmado, r1.falhas);
      }
    } finally { running.current = false; setBusy(false); }
  }
  /** Assina caminhos privados do cofre para servirem de imagem-base na geração. */
  async function assinarBase(caminhos: string[]): Promise<string[]> {
    const urls: string[] = [];
    for (const caminho of caminhos.filter(Boolean).slice(0, 3)) {
      const s = await supabase.storage.from("user-photos").createSignedUrl(caminho, 600);
      if (s.data?.signedUrl) urls.push(s.data.signedUrl);
    }
    return urls;
  }
  async function runGeneration(briefConfirmado?: TattooBrief | LookBrief, correcao?: string[]): Promise<{ status: "ok" | "reprovado" | "falhou"; falhas?: string[] }> {
    let id: string | undefined;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (q.data?.status === "ready" || q.data?.status === "generating") throw new Error("Existe uma solicitação em andamento. Aguarde ou descarte a anterior.");
      const { data: auth } = await supabase.auth.getSession(); if (!auth.session) throw new Error("Entre na sua conta.");
      const briefTattoo = briefConfirmado && "tipo" in briefConfirmado ? (briefConfirmado as TattooBrief) : null;
      let taskId: string | undefined;
      let refs: string[] = [];
      let ancorada = false;
      if (briefTattoo && (briefTattoo.tipo === "lettering" || briefTattoo.tipo === "composicao")) {
        // Escrita: motor de lettering (Ideogram com reserva fal) + referências do projeto.
        taskId = "webapp.ink.render";
        refs = await assinarBase([...refsPaths.current, ...(fotoLocal ? [fotoLocal] : [])]);
      } else if (briefTattoo) {
        // Símbolo/linha: a prévia nasce de uma FOTO (Meu Modelo ou foto do local).
        // Sem base o modelo inventa a região do corpo — por isso aqui é obrigatório.
        const origem = escolherBaseTatuagem({ preview: briefTattoo.preview, temModeloCorpo: temCorpo, usarModelo, temFotoDoLocal: !!fotoLocal });
        if (origem === "nenhuma") throw new Error(AVISO_SEM_BASE);
        const caminho = origem === "modelo" ? `${auth.session.user.id}/modelo-corpo.png` : String(fotoLocal);
        refs = await assinarBase([caminho]);
        if (!refs.length) throw new Error("Não foi possível abrir sua foto de referência. Tente novamente.");
        ancorada = true;
      } else if (usarModelo && temModelo && (tattoo || look)) {
        // Modelo pessoal como base: aplicações saem SOBRE a imagem-base da própria pessoa.
        const arquivo = /makeup|hair|barba/.test(pacoteKind.current) ? "modelo-rosto.png" : "modelo-corpo.png";
        refs = await assinarBase([`${auth.session.user.id}/${arquivo}`]);
      }
      // Qualquer base real (modelo ou foto do local) exige prompt de EDIÇÃO:
      // sem isso o provedor devolvia praticamente a mesma foto, sem o look pedido.
      if (refs.length) ancorada = true;
      const r = await prepare({ data: { packageId, slot, agree, ...(briefConfirmado ? { brief: briefConfirmado } : {}), ...(correcao?.length ? { correcao } : {}), ...(ancorada ? { ancorada: true } : {}) } }); id = r.id;
      let completed: string | undefined;
      await streamImage("/api/reference-image", { id, ...(taskId ? { task_id: taskId } : {}), ...(refs.length ? { input_refs: refs } : {}) }, (url, done) => { setPreview(url); setFinal(done); if (done) completed = url; }, controller.signal, { Authorization: `Bearer ${auth.session.access_token}` });
      if (!completed) throw new Error("A IA não devolveu uma imagem final.");
      const path = `${auth.session.user.id}/reference-${id}.png`;
      const blob = await (await fetch(completed)).blob();
      // O provedor responde 200 com um quadro preto quando filtra o prompt:
      // conferir antes de salvar evita guardar "imagem" vazia na conta da usuária.
      if (await imagemVazia(blob)) throw new Error("A IA devolveu uma imagem vazia (quadro preto) e nada foi salvo. Tente gerar de novo — desta vez o pedido vai sem o prompt genérico.");
      const upload = await supabase.storage.from("user-photos").upload(path, blob, { contentType: "image/png" }); if (upload.error) throw upload.error;
      await finish({ data: { id, path } });
      if (q.data?.id) await remove();
      await qc.invalidateQueries({ queryKey: key }); toast.success("Referência guardada em privado."); setBrief(null); setLookBrief(null); window.dispatchEvent(new Event("aura:quota"));
      if (briefConfirmado && completed) {
        // O verificador exige URL assinada do próprio storage: assinamos a imagem recém-enviada.
        const signed = await supabase.storage.from("user-photos").createSignedUrl(path, 600);
        const imageUrl = signed.data?.signedUrl;
        if (imageUrl) {
          const v = await verify({ data: { imageUrl, brief: briefConfirmado as unknown as Record<string, unknown> } });
          if (v.verificado && v.veredito && !v.veredito.aprovado) { setPendencia(v.veredito.falhas); return { status: "reprovado", falhas: v.veredito.falhas }; }
        }
      }
      setPendencia(null);
      return { status: "ok" };
    } catch (e) {
      const cancelada = e instanceof Error && (e.name === "AbortError" || /abort/i.test(e.message));
      const message = cancelada
        ? "Geração cancelada — nenhuma imagem foi guardada."
        : e instanceof Error ? e.message : "Não foi possível gerar a imagem. Tente de novo.";
      setPaywall(!cancelada && /gera(ç|c)(õ|o)es gratuitas|Aura Pass/i.test(message));
      setErr(message); setPreview(null); if (id) await finish({ data: { id, error: message } }).catch(() => {});
      return { status: "falhou" };
    } finally {
      abortRef.current = null;
    }
  }
  async function iniciar() {
    if (!packageId || slot === "avatar" || (!tattoo && !look)) return generate();
    setErr(""); setBrief(null); setLookBrief(null); regen.current = false; setInterpretando(true); setPaywall(false);
    try {
      if (tattoo) {
        const r = await interpret({ data: { packageId, slot } });
        if (r.error || !r.brief) { setErr(r.error ?? "Não foi possível interpretar o pedido. Tente de novo."); return; }
        setBrief(r.brief);
        if (r.brief.tipo === "lettering" || r.brief.tipo === "composicao") await carregarRefsTattoo();
      } else {
        const r = await interpretLook({ data: { packageId, slot } });
        if (r.error || !r.brief) { setErr(r.error ?? "Não foi possível interpretar o pedido. Tente de novo."); return; }
        setLookBrief(r.brief);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Não foi possível interpretar o pedido. Tente de novo."); } finally { setInterpretando(false); }
  }
  // Base da prévia de tatuagem: foto do local > Meu Modelo > desenho isolado.
  const origemBase = brief
    ? escolherBaseTatuagem({ preview: brief.preview, temModeloCorpo: temCorpo, usarModelo, temFotoDoLocal: !!fotoLocal })
    : null;
  return <div className="mt-4 space-y-3 border-t pt-3 print:hidden">
    {q.isLoading && <CarregandoInline rotulo="Carregando imagem…" />}
    {q.error && <EstadoErro titulo="Não foi possível carregar a referência" onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />}
    {image && <figure><img src={image} alt="Referência visual gerada por IA, pessoa fictícia ou conceito ilustrado" className={`aspect-[2/3] w-full rounded-lg object-contain transition-[filter] ${busy && !final ? "blur-2xl" : "blur-0"}`} /><figcaption className="mt-2 text-xs text-muted-foreground">Gerado por IA · Referência visual — não é prova virtual</figcaption></figure>}
    {!image && <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />Autorizo gerar e guardar imagens privadas de pessoa fictícia. Usa créditos de IA, sem enviar minhas fotos.</label>}
    {brief && !busy && <div className={CARTAO_DESTAQUE} role="region" aria-label="Confirmação do pedido entendido">
      <p className="text-sm font-medium">Entendi assim — confirme antes de gerar</p>
      <dl className="mt-3 space-y-1.5 text-xs">{resumoDoPedido(brief).map(l => <div key={l.rotulo} className="flex gap-2"><dt className="w-32 shrink-0 text-muted-foreground">{l.rotulo}</dt><dd className="font-medium">{l.valor}</dd></div>)}</dl>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {brief.tipo === "lettering" && <label className="text-xs">Texto exato<Input className="mt-1 h-8" value={brief.texto ?? ""} onChange={e => setBrief({ ...brief, texto: e.target.value })} /> </label>}
        <label className="text-xs">Local no corpo<Input className="mt-1 h-8" value={brief.local_corpo ?? ""} placeholder="ex.: antebraço interno esquerdo" onChange={e => setBrief({ ...brief, local_corpo: e.target.value, preview: e.target.value ? "no_corpo" : "isolado" })} /></label>
        <label className="text-xs">Lado<select aria-label="Lado do corpo" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={brief.lateralidade} onChange={e => setBrief({ ...brief, lateralidade: e.target.value as TattooBrief["lateralidade"] })}><option value="nao_se_aplica">Não se aplica</option><option value="esquerda">Esquerda</option><option value="direita">Direita</option><option value="central">Central</option></select></label>
        <label className="text-xs">Tamanho<Input className="mt-1 h-8" value={brief.tamanho ?? ""} placeholder="ex.: 8 cm" onChange={e => setBrief({ ...brief, tamanho: e.target.value })} /></label>
        <label className="text-xs">Estilo<Input className="mt-1 h-8" value={brief.estilo ?? ""} placeholder="ex.: fine line" onChange={e => setBrief({ ...brief, estilo: e.target.value })} /></label>
      </div>
      {brief.duvidas.length > 0 && <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{brief.duvidas.map(d => <li key={d}>Pendência: {d}</li>)}</ul>}
      {(brief.tipo === "lettering" || brief.tipo === "composicao") && <>
        {refsPaths.current.length > 0 && <p className="mt-2 text-xs text-muted-foreground">📎 {refsPaths.current.length} referência{refsPaths.current.length > 1 ? "s" : ""} sua{refsPaths.current.length > 1 ? "s" : ""} de tatuagem {refsPaths.current.length > 1 ? "serão" : "será"} usada{refsPaths.current.length > 1 ? "s" : ""} como base.</p>}
        <p className="mt-2 text-xs text-muted-foreground">A escrita sai caractere por caractere, exatamente como confirmada acima.</p>
      </>}
      {origemBase === "nenhuma" && <Aviso tom="atencao">{AVISO_SEM_BASE} <a className="underline underline-offset-2" href="/tatuagem/referencias">Enviar foto do local</a> ou <a className="underline underline-offset-2" href="/modelo">criar meu Meu Modelo</a>.</Aviso>}
      {origemBase === "foto" && <p className={META}>🖼️ Sua foto do local será usada como base — a tatuagem é aplicada sobre ela, na região fotografada.</p>}
      {origemBase === "modelo" && <p className={META}>👤 Seu Meu Modelo (corpo) será usado como base da prévia.</p>}
      {origemBase === "livre" && <p className={META}>Desenho isolado em folha: sem corpo e sem foto de base.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => generate(brief)} disabled={origemBase === "nenhuma"}>Confirmar e gerar</Button>
        <Button size="sm" variant="ghost" onClick={() => setBrief(null)}>Corrigir pedido depois</Button>
      </div>
    </div>}
    {lookBrief && !busy && <div className={CARTAO_DESTAQUE} role="region" aria-label="Confirmação do pedido entendido">
      <p className="text-sm font-medium">Entendi assim — confirme antes de gerar</p>
      {lookBrief.resumo && <p className="mt-1 text-xs text-muted-foreground">{lookBrief.resumo}</p>}
      <dl className="mt-3 space-y-1.5 text-xs">{lookBrief.atributos.map(a => <div key={a.rotulo} className="flex gap-2"><dt className="w-32 shrink-0 text-muted-foreground">{a.rotulo}</dt><dd className="font-medium">{a.valor}</dd></div>)}</dl>
      <label className="mt-3 block text-xs">Ajuste obrigatório (opcional)<Input className="mt-1 h-8" placeholder="ex.: tecido leve, tom terroso" value={lookBrief.ajuste_usuario} onChange={e => setLookBrief({ ...lookBrief, ajuste_usuario: e.target.value })} /></label>
      {lookBrief.duvidas.length > 0 && <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{lookBrief.duvidas.map(d => <li key={d}>Pendência: {d}</li>)}</ul>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => generate(lookBrief)}>Confirmar e gerar</Button>
        <Button size="sm" variant="ghost" onClick={() => setLookBrief(null)}>Corrigir pedido depois</Button>
      </div>
    </div>}
    <div className="flex flex-wrap gap-2">
      {temModelo && (tattoo || look) && !busy && !interpretando && <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={usarModelo} onChange={(e) => setUsarModelo(e.target.checked)} />Usar meu modelo pessoal (a imagem sai com você)</label>}
      <Button size="sm" variant="outline" disabled={busy || interpretando || q.isLoading || (!image && !agree)} onClick={iniciar}>{busy || interpretando ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}{busy ? `Gerando… ${decorrido}s` : interpretando ? "Interpretando…" : image ? "Gerar novamente" : slot === "avatar" ? "Gerar retrato" : "Gerar imagem"}</Button>
      {busy && <Button size="sm" variant="ghost" onClick={cancelarGeracao}>Cancelar</Button>}
      {image && !busy && <><Button size="icon" variant="ghost" title="Ampliar imagem" aria-label="Ampliar imagem" onClick={() => setOpen(true)}><Expand aria-hidden className="size-4" /></Button><Button size="icon" variant="ghost" title="Baixar imagem" aria-label="Baixar imagem" onClick={async () => { const blob = await (await fetch(image)).blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "aura-id-referencia.png"; a.click(); URL.revokeObjectURL(url); }}><Download aria-hidden className="size-4" /></Button></>}
      {q.data?.id && !busy && <Button size="icon" variant="ghost" title="Excluir referência ou solicitação" aria-label="Excluir referência ou solicitação" onClick={() => remove().catch(() => toast.error("Não foi possível excluir a referência. Tente de novo."))}><Trash2 aria-hidden className="size-4" /></Button>}
    </div>
    {pendencia && !busy && <Aviso tom="atencao">A verificação não aprovou a imagem em 2 tentativas. Gere novamente (ou ajuste o local/texto do pedido). Pendências: {pendencia.join(" · ")}</Aviso>}
    {(err || q.data?.error) && !paywall && <p role="alert" className="break-words text-xs text-destructive">{err || q.data?.error}</p>}
    <QuotaChip tasks={tattoo ? ["webapp.reference.render", "webapp.ink.render"] : look ? ["webapp.reference.render", "webapp.tryon.render"] : ["webapp.reference.render"]} />
    {image && !busy && packageId && slot !== "avatar" && (
      <div className={CARTAO_COMPACTO} role="region" aria-label="E agora?">
        {!gostei ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">Gostou do resultado?</p>
            <Button size="sm" variant="outline" onClick={() => setGostei(true)}>💚 Gostei — e agora?</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">O que você quer fazer com esse visual?</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("casa")}>{gerandoGuia === "casa" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : "🏠"} Como fazer em casa</Button>
              <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("salao")}>{gerandoGuia === "salao" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : "💅"} Briefing para o salão</Button>
              {look && <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("busca")}>{gerandoGuia === "busca" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : "🔍"} Buscar peça parecida</Button>}
            </div>
            {guiaTxt && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{guiaTxt.titulo}</p>
                <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs leading-relaxed">{guiaTxt.texto}</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(guiaTxt.texto); toast.success("Copiado!"); }}>Copiar</Button>
                  <Button size="sm" variant="secondary" onClick={baixarGuia}>Baixar .md</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setGuiaTxt(null); setGostei(false); }}>Fechar</Button>
                </div>
              </div>
            )}
            {guiaTxt && guiaTipo === "salao" && (
              <EnviarBriefing
                titulo={guiaTxt.titulo}
                texto={guiaTxt.texto}
                modulo={tattoo ? "tatuagem" : look ? "look" : "visual"}
                profissaoFixa={tattoo ? "tatuadora" : undefined}
                packageId={packageId}
                fotoPath={q.data?.path ?? undefined}
              />
            )}
            {look && pacoteKind.current === "outfit" && (
              <div className={`space-y-3 ${CARTAO_COMPACTO}`} role="region" aria-label="Peças parecidas">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium">🛍️ Peças parecidas no catálogo parceiro</p>
                  <Button size="sm" variant="outline" disabled={buscandoPecas} onClick={() => void verPecas()}>{buscandoPecas ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}{buscandoPecas ? "Buscando…" : "Ver peças"}</Button>
                </div>
                {pecas && pecas.length === 0 && <p className="text-xs text-muted-foreground">Nada parecido no catálogo ainda — novas lojas em breve.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {pecas?.map((p) => (
                    <div key={p.id} className="space-y-2 rounded-md border bg-background p-3">
                      <a href={p.url + (p.url.includes('?') ? '&' : '?') + 'utm_source=aura-id'} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition hover:opacity-90">
                        {p.imagem_url
                          ? <img src={p.imagem_url} alt={p.titulo} className="size-16 shrink-0 rounded object-cover" />
                          : <div className="grid size-16 shrink-0 place-items-center rounded bg-secondary text-xl">👗</div>}
                        <div className="min-w-0">
                          {p.patrocinado && <Badge variant="secondary">Patrocinado</Badge>}
                          <p className="truncate text-sm font-medium">{p.titulo}</p>
                          <p className="text-xs text-muted-foreground">{p.loja} · R$ {p.preco.toFixed(2).replace('.', ',')}</p>
                          <p className="text-xs text-accent">Ver na loja ↗</p>
                        </div>
                      </a>
                      <Button size="sm" variant="outline" className="w-full" disabled={!!provando} onClick={() => void provar(p)}>
                        {provando === p.id ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Shirt aria-hidden className="size-4" />}
                        {provando === p.id ? "Provando em você…" : "Provar em mim"}
                      </Button>
                      {provas[p.id] && (
                        <div className="space-y-2 rounded-md border border-accent/40 bg-accent/5 p-2" role="region" aria-label={`Você vestindo ${p.titulo}`}>
                          <img src={provas[p.id]} alt={`Você vestindo ${p.titulo}`} className="aspect-[2/3] w-full rounded object-contain" />
                          <p className="text-xs text-muted-foreground">Você com {p.titulo} · simulação Aura</p>
                          <Button asChild size="sm" className="w-full"><a href={p.url + (p.url.includes('?') ? '&' : '?') + 'utm_source=aura-id'} target="_blank" rel="noopener noreferrer">Ver na loja · R$ {p.preco.toFixed(2).replace('.', ',')} ↗</a></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pecas && <p className="text-xs text-muted-foreground">Itens do catálogo parceiro; loja parceira define preço e disponibilidade. Lojas em fase demo.</p>}
              </div>
            )}
            {!guiaTxt && !gerandoGuia && <Button size="sm" variant="ghost" onClick={() => setGostei(false)}>Fechar</Button>}
          </div>
        )}
      </div>
    )}
    {paywall && !busy && <PaywallCard mensagem={err || "Suas gerações gratuitas acabaram — o Aura Pass libera as gerações de imagem."} />}
    {q.data?.status === "generating" && !busy && <p className={META}>Solicitação em andamento. Se a página foi fechada, descarte a solicitação antes de iniciar outra.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-auto"><DialogTitle>Referência visual · Gerado por IA</DialogTitle>{image && <img src={image} alt="Referência ampliada" className="w-full object-contain" />}</DialogContent></Dialog>
  </div>;
}