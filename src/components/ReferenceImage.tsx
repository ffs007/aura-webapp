import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Download, Trash2, Expand, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { prepareReference, finishReference, interpretLookRequest, verifyReference, guiaPosGeracao } from "@/lib/references.functions";
import { interpretTattooRequest } from "@/lib/tattoo.functions";
import { resumoDoPedido, type TattooBrief } from "@/lib/tattoo-brief";
import { AURA_PASS_PRECO } from "@/lib/stripe.functions";
import { QuotaChip } from "@/components/QuotaChip";
import { EnviarBriefing } from "@/components/EnviarBriefing";
import { buscarPecas, type PecaCasada } from "@/lib/catalogo.functions";
import { streamImage } from "@/lib/stream-image";

type LookBrief = { kind: string; atributos: { rotulo: string; valor: string }[]; ajuste_usuario: string; duvidas: string[] };

export function ReferenceImage({ packageId, slot = "avatar", tattoo = false, look = false }: { packageId?: string; slot?: string; tattoo?: boolean; look?: boolean }) {
  const prepare = useServerFn(prepareReference), finish = useServerFn(finishReference), interpret = useServerFn(interpretTattooRequest), interpretLook = useServerFn(interpretLookRequest), guia = useServerFn(guiaPosGeracao), pecasFn = useServerFn(buscarPecas), qc = useQueryClient();
  const [pecas, setPecas] = useState<PecaCasada[] | null>(null);
  const [buscandoPecas, setBuscandoPecas] = useState(false);
  async function verPecas() {
    setBuscandoPecas(true); setPecas(null);
    try {
      const atributos = lookBrief ? lookBrief.atributos.map((a) => `${a.rotulo}: ${a.valor}`).join("; ") : "";
      setPecas(await pecasFn({ data: { texto: atributos || "look outfit" } }));
    } catch { toast.error("Não consegui buscar o catálogo agora."); } finally { setBuscandoPecas(false); }
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
      if (r.error || !r.texto) { toast.error(r.error ?? "Não consegui montar o guia."); return; }
      setGuiaTxt({ titulo: r.titulo ?? "Guia", texto: r.texto });
    } catch { toast.error("Não consegui montar o guia."); } finally { setGerandoGuia(""); }
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
      const { data: p } = await supabase.from("packages").select("kind").eq("id", packageId).maybeSingle();
      pacoteKind.current = String(p?.kind ?? "");
    })();
  }, [packageId, tattoo, look]);
  const regen = useRef(false);
  const running = useRef(false);
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
      if (r1 === "reprovado" && !regen.current) {
        regen.current = true;
        toast.info("A verificação da imagem reprovou o pedido — gerando novamente automaticamente…");
        await runGeneration(briefConfirmado);
      }
    } finally { running.current = false; setBusy(false); }
  }
  async function runGeneration(briefConfirmado?: TattooBrief | LookBrief): Promise<"ok" | "reprovado" | "falhou"> {
    let id: string | undefined;
    try {
      if (q.data?.status === "ready" || q.data?.status === "generating") throw new Error("Existe uma solicitação em andamento. Aguarde ou descarte a anterior.");
      const r = await prepare({ data: { packageId, slot, agree, ...(briefConfirmado ? { brief: briefConfirmado } : {}) } }); id = r.id;
      const { data: auth } = await supabase.auth.getSession(); if (!auth.session) throw new Error("Entre na sua conta.");
      // Tatuagem de escrita (lettering/composição): motor Ideogram (com reserva fal) + referências do projeto.
      let taskId: string | undefined;
      let refs: string[] = [];
      if (briefConfirmado && "tipo" in briefConfirmado) {
        const b = briefConfirmado as TattooBrief;
        if (b.tipo === "lettering" || b.tipo === "composicao") {
          taskId = "webapp.ink.render";
          for (const p of refsPaths.current) {
            const s = await supabase.storage.from("user-photos").createSignedUrl(p, 600);
            if (s.data?.signedUrl) refs.push(s.data.signedUrl);
          }
        }
      }
      // Modelo pessoal como base: aplicações saem SOBRE a imagem-base da própria pessoa (Kontext).
      if (!taskId && usarModelo && temModelo && (tattoo || look)) {
        const { data: u } = await supabase.auth.getUser();
        const arquivo = /makeup|hair|barba/.test(pacoteKind.current) ? "modelo-rosto.png" : "modelo-corpo.png";
        const s = await supabase.storage.from("user-photos").createSignedUrl(`${u.user?.id ?? ""}/${arquivo}`, 600);
        if (s.data?.signedUrl) refs.push(s.data.signedUrl);
      }
      let completed: string | undefined;
      await streamImage("/api/reference-image", { id, ...(taskId ? { task_id: taskId } : {}), ...(refs.length ? { input_refs: refs } : {}) }, (url, done) => { setPreview(url); setFinal(done); if (done) completed = url; }, undefined, { Authorization: `Bearer ${auth.session.access_token}` });
      if (!completed) throw new Error("A IA não devolveu uma imagem final.");
      const path = `${auth.session.user.id}/reference-${id}.png`;
      const blob = await (await fetch(completed)).blob();
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
          if (v.verificado && v.veredito && !v.veredito.aprovado) { setPendencia(v.veredito.falhas); return "reprovado"; }
        }
      }
      setPendencia(null);
      return "ok";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível gerar a imagem.";
      setPaywall(/gera(ç|c)(õ|o)es gratuitas|Aura Pass/i.test(message));
      setErr(message); setPreview(null); if (id) await finish({ data: { id, error: message } }).catch(() => {});
      return "falhou";
    }
  }
  async function iniciar() {
    if (!packageId || slot === "avatar" || (!tattoo && !look)) return generate();
    setErr(""); setBrief(null); setLookBrief(null); regen.current = false; setInterpretando(true); setPaywall(false);
    try {
      if (tattoo) {
        const r = await interpret({ data: { packageId, slot } });
        if (r.error || !r.brief) { setErr(r.error ?? "Não consegui interpretar o pedido."); return; }
        setBrief(r.brief);
        if (r.brief.tipo === "lettering" || r.brief.tipo === "composicao") await carregarRefsTattoo();
      } else {
        const r = await interpretLook({ data: { packageId, slot } });
        if (r.error || !r.brief) { setErr(r.error ?? "Não consegui interpretar o pedido."); return; }
        setLookBrief(r.brief);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Não consegui interpretar o pedido."); } finally { setInterpretando(false); }
  }
  return <div className="mt-4 space-y-3 border-t pt-3 print:hidden">
    {image && <figure><img src={image} alt="Referência visual gerada por IA, pessoa fictícia ou conceito ilustrado" className={`aspect-[2/3] w-full rounded-lg object-contain transition-[filter] ${busy && !final ? "blur-2xl" : "blur-0"}`} /><figcaption className="mt-2 text-xs text-muted-foreground">Gerado por IA · Referência visual — não é prova virtual</figcaption></figure>}
    {!image && <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />Autorizo gerar e guardar imagens privadas de pessoa fictícia. Usa créditos de IA, sem enviar minhas fotos.</label>}
    {brief && !busy && <div className="rounded-lg border border-accent/40 bg-accent/5 p-4" role="region" aria-label="Confirmação do pedido entendido">
      <p className="text-sm font-medium">Entendi assim — confirme antes de gerar</p>
      <dl className="mt-3 space-y-1.5 text-xs">{resumoDoPedido(brief).map(l => <div key={l.rotulo} className="flex gap-2"><dt className="w-32 shrink-0 text-muted-foreground">{l.rotulo}</dt><dd className="font-medium">{l.valor}</dd></div>)}</dl>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {brief.tipo === "lettering" && <label className="text-xs">Texto exato<Input className="mt-1 h-8" value={brief.texto ?? ""} onChange={e => setBrief({ ...brief, texto: e.target.value })} /> </label>}
        <label className="text-xs">Local no corpo<Input className="mt-1 h-8" value={brief.local_corpo ?? ""} placeholder="ex.: ombro esquerdo" onChange={e => setBrief({ ...brief, local_corpo: e.target.value, preview: e.target.value ? "no_corpo" : "isolado" })} /></label>
      </div>
      {brief.duvidas.length > 0 && <ul className="mt-3 space-y-1 text-xs text-amber-600">{brief.duvidas.map(d => <li key={d}>Pendência: {d}</li>)}</ul>}
      {(brief.tipo === "lettering" || brief.tipo === "composicao") && <>
        {refsPaths.current.length > 0 && <p className="mt-2 text-xs text-muted-foreground">📎 {refsPaths.current.length} referência{refsPaths.current.length > 1 ? "s" : ""} sua{refsPaths.current.length > 1 ? "s" : ""} de tatuagem {refsPaths.current.length > 1 ? "serão" : "será"} usada{refsPaths.current.length > 1 ? "s" : ""} como base.</p>}
        <p className="mt-2 text-xs text-muted-foreground">A escrita sai caractere por caractere, exatamente como confirmada acima.</p>
      </>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => generate(brief)}>Confirmar e gerar</Button>
        <Button size="sm" variant="ghost" onClick={() => setBrief(null)}>Corrigir pedido depois</Button>
      </div>
    </div>}
    {lookBrief && !busy && <div className="rounded-lg border border-accent/40 bg-accent/5 p-4" role="region" aria-label="Confirmação do pedido entendido">
      <p className="text-sm font-medium">Entendi assim — confirme antes de gerar</p>
      <dl className="mt-3 space-y-1.5 text-xs">{lookBrief.atributos.map(a => <div key={a.rotulo} className="flex gap-2"><dt className="w-32 shrink-0 text-muted-foreground">{a.rotulo}</dt><dd className="font-medium">{a.valor}</dd></div>)}</dl>
      <label className="mt-3 block text-xs">Ajuste obrigatório (opcional)<Input className="mt-1 h-8" placeholder="ex.: tecido leve, tom terroso" value={lookBrief.ajuste_usuario} onChange={e => setLookBrief({ ...lookBrief, ajuste_usuario: e.target.value })} /></label>
      {lookBrief.duvidas.length > 0 && <ul className="mt-3 space-y-1 text-xs text-amber-600">{lookBrief.duvidas.map(d => <li key={d}>Pendência: {d}</li>)}</ul>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => generate(lookBrief)}>Confirmar e gerar</Button>
        <Button size="sm" variant="ghost" onClick={() => setLookBrief(null)}>Corrigir pedido depois</Button>
      </div>
    </div>}
    <div className="flex flex-wrap gap-2">
      {temModelo && (tattoo || look) && !busy && !interpretando && <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={usarModelo} onChange={(e) => setUsarModelo(e.target.checked)} />Usar meu modelo pessoal (a imagem sai com você)</label>}
      <Button size="sm" variant="outline" disabled={busy || interpretando || q.isLoading || (!image && !agree)} onClick={iniciar}>{busy || interpretando ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ? "Gerando…" : interpretando ? "Interpretando…" : image ? "Gerar novamente" : slot === "avatar" ? "Gerar retrato" : "Gerar imagem"}</Button>
      {image && !busy && <><Button size="icon" variant="ghost" title="Ampliar imagem" aria-label="Ampliar imagem" onClick={() => setOpen(true)}><Expand className="size-4" /></Button><Button size="icon" variant="ghost" title="Baixar imagem" aria-label="Baixar imagem" onClick={async () => { const blob = await (await fetch(image)).blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "aura-id-referencia.png"; a.click(); URL.revokeObjectURL(url); }}><Download className="size-4" /></Button></>}
      {q.data?.id && !busy && <Button size="icon" variant="ghost" title="Excluir referência ou solicitação" aria-label="Excluir referência ou solicitação" onClick={() => remove().catch(() => toast.error("Não foi possível excluir."))}><Trash2 className="size-4" /></Button>}
    </div>
    {pendencia && !busy && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">Verificação automática — pendências após 2 tentativas: {pendencia.join(" · ")}</p>}
    {(err || q.data?.error) && <p role="alert" className="break-words text-xs text-destructive">{err || q.data?.error}</p>}
    <QuotaChip tasks={tattoo ? ["webapp.reference.render", "webapp.ink.render"] : ["webapp.reference.render"]} />
    {image && !busy && packageId && slot !== "avatar" && (
      <div className="rounded-lg border bg-card p-4" role="region" aria-label="E agora?">
        {!gostei ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">Gostou do resultado?</p>
            <Button size="sm" variant="outline" onClick={() => setGostei(true)}>💚 Gostei — e agora?</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">O que você quer fazer com esse visual?</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("casa")}>{gerandoGuia === "casa" ? <LoaderCircle className="size-4 animate-spin" /> : "🏠"} Como fazer em casa</Button>
              <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("salao")}>{gerandoGuia === "salao" ? <LoaderCircle className="size-4 animate-spin" /> : "💅"} Briefing para o salão</Button>
              {look && <Button size="sm" variant="outline" disabled={!!gerandoGuia} onClick={() => void pedirGuia("busca")}>{gerandoGuia === "busca" ? <LoaderCircle className="size-4 animate-spin" /> : "🔍"} Buscar peça parecida</Button>}
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
              />
            )}
            {look && pacoteKind.current === "outfit" && (
              <div className="space-y-3 rounded-lg border bg-card p-4" role="region" aria-label="Peças parecidas">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium">🛍️ Peças parecidas no catálogo parceiro</p>
                  <Button size="sm" variant="outline" disabled={buscandoPecas} onClick={() => void verPecas()}>{buscandoPecas ? <LoaderCircle className="size-4 animate-spin" /> : null}{buscandoPecas ? "Buscando…" : "Ver peças"}</Button>
                </div>
                {pecas && pecas.length === 0 && <p className="text-xs text-muted-foreground">Nada parecido no catálogo ainda — novas lojas em breve.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {pecas?.map((p) => (
                    <a key={p.id} href={p.url + (p.url.includes('?') ? '&' : '?') + 'utm_source=aura-id'} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-md border bg-background p-3 transition hover:shadow-soft">
                      {p.imagem_url
                        ? <img src={p.imagem_url} alt={p.titulo} className="size-16 shrink-0 rounded object-cover" />
                        : <div className="grid size-16 shrink-0 place-items-center rounded bg-secondary text-xl">👗</div>}
                      <div className="min-w-0">
                        {p.patrocinado && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-700">Patrocinado</span>}
                        <p className="truncate text-sm font-medium">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">{p.loja} · R$ {p.preco.toFixed(2).replace('.', ',')}</p>
                        <p className="text-xs text-accent">Ver na loja ↗</p>
                      </div>
                    </a>
                  ))}
                </div>
                {pecas && <p className="text-[10px] text-muted-foreground">Itens do catálogo parceiro; loja parceira define preço e disponibilidade. Lojas em fase demo.</p>}
              </div>
            )}
            {!guiaTxt && !gerandoGuia && <Button size="sm" variant="ghost" onClick={() => setGostei(false)}>Fechar</Button>}
          </div>
        )}
      </div>
    )}
    {paywall && !busy && <div role="region" aria-label="Aura Pass" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="text-sm font-medium">Suas gerações gratuitas acabaram ✨</p>
      <p className="mt-1 text-xs text-muted-foreground">O Aura Pass libera as gerações de imagem — Pix ou cartão, cancele quando quiser.</p>
      <Button asChild size="sm" className="mt-3"><Link to="/aura-pass">Desbloquear com Aura Pass · {AURA_PASS_PRECO}</Link></Button>
    </div>}
    {q.data?.status === "generating" && !busy && <p className="text-xs text-muted-foreground">Solicitação em andamento. Se a página foi fechada, descarte a solicitação antes de iniciar outra.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-auto"><DialogTitle>Referência visual · Gerado por IA</DialogTitle>{image && <img src={image} alt="Referência ampliada" className="w-full object-contain" />}</DialogContent></Dialog>
  </div>;
}