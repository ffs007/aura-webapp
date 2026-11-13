import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { AiLabel, Indicators, Variations } from "@/components/PackageView";
import { Aviso, CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoDetalhe } from "@/components/estados";
import { CARTAO, TITULO_ITEM, TITULO_SECAO } from "@/lib/design";
import { bumpSignals, downloadText, logEvent, packageToMarkdown, STATUS_LABEL, type PackageRow } from "@/lib/aura";
import { generatePackages } from "@/lib/aura.functions";
import { GenerationPresentation } from "@/components/GenerationPresentation";
import { HistoricoSugestao } from "@/components/HistoricoSugestao";
import { lerRascunho, limparRascunho, rotuloRascunho, useSalvarRascunho } from "@/hooks/useRascunho";

export const Route = createFileRoute("/_authenticated/package/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Sugestão — Aura ID" }, { name: "description", content: "Uma sugestão visual integrada." }, { property: "og:title", content: "Sugestão — Aura ID" }, { property: "og:description", content: "Uma sugestão visual integrada." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const gen = useServerFn(generatePackages);
  const [note, setNote] = useState("");
  const [adaptNote, setAdaptNote] = useState("");
  const [adapting, setAdapting] = useState(false);
  const [presentation, setPresentation] = useState("");
  const [fb, setFb] = useState({ rating: 3, comfort: 3, reflection: "" });
  const [touched, setTouched] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFb, setEnviandoFb] = useState(false);
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoAtivo, setRascunhoAtivo] = useState(true);
  const conteudoVisto = useRef(false);
  const chaveRascunho = `pacote:${user.id}:${id}`;

  const q = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as (PackageRow & { context: { occasion?: string } }) | null;
    },
  });
  const notaServidor = q.data?.note ?? "";
  const temConteudoRascunho = note !== notaServidor || adaptNote.trim().length > 0;
  const valorRascunho = useMemo(() => ({ note, adaptNote }), [note, adaptNote]);
  const salvoEm = useSalvarRascunho(chaveRascunho, valorRascunho, rascunhoCarregado && rascunhoAtivo && temConteudoRascunho);
  const rotuloRascunhoAtual = temConteudoRascunho && rascunhoAtivo ? rotuloRascunho(salvoEm) : "";

  useEffect(() => { if (q.data && !rascunhoCarregado) setNote(q.data.note ?? ""); }, [q.data, rascunhoCarregado]);

  // Restaura o rascunho de notas/adaptação quando a sugestão carrega.
  useEffect(() => {
    if (rascunhoCarregado || !q.data) return;
    const r = lerRascunho<{ note?: string; adaptNote?: string }>(chaveRascunho);
    if (r) {
      if (typeof r.note === "string") setNote(r.note);
      if (typeof r.adaptNote === "string") setAdaptNote(r.adaptNote);
    }
    setRascunhoCarregado(true);
  }, [q.data, rascunhoCarregado, chaveRascunho]);

  // Se o conteúdo voltar ao estado salvo, o rascunho local deixa de fazer sentido.
  useEffect(() => {
    if (!rascunhoCarregado) return;
    if (temConteudoRascunho) { conteudoVisto.current = true; return; }
    if (conteudoVisto.current) { limparRascunho(chaveRascunho); conteudoVisto.current = false; }
  }, [rascunhoCarregado, temConteudoRascunho, chaveRascunho]);

  if (q.isLoading) return <EsqueletoDetalhe />;
  if (q.error) return <EstadoErro titulo="Não foi possível carregar esta sugestão" onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;
  if (!q.data) return (
    <EstadoVazio
      titulo="Esta sugestão não existe mais"
      descricao="Ela pode ter sido removida. Suas outras sugestões continuam salvas."
      acoes={<Button asChild><Link to="/dashboard" search={{}}>Voltar às sugestões</Link></Button>}
    />
  );
  const p = q.data;
  if (p.kind === "tattoo_plan") return <Aviso tom="info">Este é um conceito de tatuagem. <Link to="/tatuagem/plano/$id" params={{ id }} className="underline">Abrir em Tatuagens</Link></Aviso>;
  if ((p as { kind?: string }).kind === "outfit") return <Aviso tom="info">Este é um look de roupa. <Link to="/roupas/look/$id" params={{ id }} className="underline">Abrir no módulo Roupas</Link></Aviso>;
  if ((p as { kind?: string }).kind === "hair_plan") return <Aviso tom="info">Este é um plano de cabelo. <Link to="/cabelo/plano/$id" params={{ id }} className="underline">Abrir no módulo Cabelo</Link></Aviso>;
  if ((p as { kind?: string }).kind === "makeup_look") return <Aviso tom="info">Este é um look de maquiagem. <Link to="/maquiagem/look/$id" params={{ id }} className="underline">Abrir no módulo Maquiagem</Link></Aviso>;
  const c = p.content;

  async function update(patch: Partial<PackageRow>, event?: string) {
    const { error } = await supabase.from("packages").update(patch as never).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar."); return false; }
    if (event) { await logEvent(event, { package_id: id, module: p.entry_mode }); await bumpSignals(); }
    qc.invalidateQueries({ queryKey: ["package", id] });
    qc.invalidateQueries({ queryKey: ["packages"] });
    toast.success("Atualizado");
    return true;
  }

  async function salvarStatus(patch: Partial<PackageRow>, event?: string) {
    if (salvando) return;
    setSalvando(true);
    try { await update(patch, event); } finally { setSalvando(false); }
  }

  async function salvarNota() {
    if (!note.trim()) { toast.error("Escreva uma nota antes de salvar."); return; }
    if (salvando) return;
    setSalvando(true);
    try {
      const ok = await update({ note: note.trim() });
      if (ok) { limparRascunho(chaveRascunho); conteudoVisto.current = false; setRascunhoAtivo(false); }
    } finally { setSalvando(false); }
  }

  function descartarRascunho() {
    limparRascunho(chaveRascunho);
    conteudoVisto.current = false;
    setNote(notaServidor);
    setAdaptNote("");
    setRascunhoAtivo(false);
    toast.success("Rascunho descartado.");
  }

  async function adapt() {
    setAdapting(true);
    const r = await gen({ data: { entryMode: p.entry_mode, emotionalMode: p.emotional_mode ?? "curious", occasion: String(p.context?.occasion ?? ""), intensity: 3, extra: adaptNote, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined, adaptFrom: JSON.stringify({ title: c.title, invitation: c.invitation, pedido_de_mudanca: adaptNote }) } }).catch(() => ({ error: "Algo deu errado.", batchId: null }));
    setAdapting(false);
    if (r.error) { toast.error(r.error); return; }
    limparRascunho(chaveRascunho);
    conteudoVisto.current = false;
    nav({ to: "/dashboard", search: { batch: r.batchId ?? undefined } });
  }

  async function sendFeedback() {
    if (!touched) { toast.info("Escolha uma nota ou escreva uma reflexão antes de enviar."); return; }
    if (enviandoFb) return;
    setEnviandoFb(true);
    try {
      const { error } = await supabase.from("feedback").insert({ user_id: user.id, package_id: id, module: p.entry_mode, ...fb });
      if (error) { toast.error("Não foi possível salvar o feedback."); return; }
      await logEvent("feedback_given", { module: p.entry_mode, rating: fb.rating });
      const { data: consent } = await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", user.id).maybeSingle();
      const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
      if (consent?.personalization && !consent.dna_paused && (p.entry_mode === "beard" ? perms["beard"] === true : perms[p.entry_mode] !== false)) {
        const { data: dna } = await supabase.from("visual_dna").select("signals, signals_since_review").eq("user_id", user.id).maybeSingle();
        const signals = Array.isArray(dna?.signals) ? dna.signals : [];
        const signal = { id: crypto.randomUUID(), title: c.title, module: p.entry_mode, liked: fb.rating >= 4, comfort: fb.comfort, reflection: fb.reflection, at: new Date().toISOString() };
        const { error: dnaError } = await supabase.from("visual_dna").upsert({ user_id: user.id, signals: [signal, ...signals].slice(0, 100), signals_since_review: (dna?.signals_since_review ?? 0) + 1, updated_at: new Date().toISOString() });
        if (dnaError) toast.success("Tudo certo — feedback salvo, mas o DNA Visual não foi atualizado agora.");
        else toast.success("Tudo certo — seu DNA Visual recebeu este sinal.");
      } else toast.success("Tudo certo — feedback salvo (DNA Visual desligado ou pausado).");
      setFb({ rating: 3, comfort: 3, reflection: "" });
      setTouched(false);
    } finally { setEnviandoFb(false); }
  }

  return (
    <div className="space-y-10">
      <CabecalhoPagina
        className="animate-rise"
        antes={
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard" search={{}} className="text-sm text-muted-foreground">← Sugestões</Link>
            <AiLabel />
            {p.kind === "beard_plan" && <Link to="/barba" className="text-sm underline">Perfil e planos de Barba</Link>}
          </div>
        }
        titulo={c.title}
        descricao={<span className="text-lg text-foreground">{c.invitation}</span>}
      >
        <div className="space-y-3">
          <p className="max-w-2xl text-muted-foreground"><span className="font-medium text-foreground">Por que pode funcionar: </span>{c.why_it_works}</p>
          <Indicators c={c} />
          <p className="text-sm text-muted-foreground">Sobre o custo: {c.cost_note}</p>
        </div>
      </CabecalhoPagina>

      {(c.professional_validation || c.reversibility === "permanent") && (
        <Aviso tom="atencao" titulo="Pause antes de passos permanentes">
          {c.professional_validation_note || "Consulte um profissional qualificado antes de tatuagens, químicas ou outras mudanças duradouras."}
        </Aviso>
      )}

      <Button asChild variant="outline"><Link to="/onboarding">Rever estrutura e preferências</Link></Button>
      <Variations c={c} packageId={id} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className={CARTAO}>
          <h2 className={TITULO_SECAO}>Passo a passo</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{c.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {c.event_checklist.length > 0 && (<><h3 className={`${TITULO_ITEM} mt-6`}>Checklist do evento</h3><ul className="mt-2 space-y-1 text-sm">{c.event_checklist.map((s, i) => <li key={i}>☐ {s}</li>)}</ul></>)}
        </div>
        <div className={CARTAO}>
          <h2 className={TITULO_SECAO}>Pontos de atenção</h2>
          {c.risks.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{c.risks.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhum risco particular apontado.</p>}
        </div>
      </div>

      <div className={CARTAO}>
        <h2 className={TITULO_SECAO}>Sua resposta</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={salvando} onClick={() => void salvarStatus({ status: "saved" }, "recommendation_saved")}>Salvar</Button>
          <Button variant="accent" disabled={salvando} onClick={() => void salvarStatus({ status: "approved" }, "recommendation_approved")}>Aprovar — vou testar</Button>
          <Button variant="outline" disabled={salvando} onClick={() => void salvarStatus({ beautiful_not_practical: !p.beautiful_not_practical }, p.beautiful_not_practical ? undefined : "marked_not_practical")}>{p.beautiful_not_practical ? "Desmarcar" : "Bonito, mas não prático"}</Button>
          <Button variant="outline" disabled={salvando} onClick={() => void salvarStatus({ status: "rejected" }, "recommendation_rejected")}>Não é para mim</Button>
          <Button variant="ghost" onClick={() => { downloadText(`${c.title}.md`, packageToMarkdown(p)); logEvent("suggestion_exported", { package_id: id }); }}>Exportar</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Status atual: <span className="capitalize">{STATUS_LABEL[p.status] ?? p.status}</span></p>
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium" htmlFor="pkg-notas">Notas pessoais</label>
          <Textarea id="pkg-notas" value={note} onChange={(e) => { setRascunhoAtivo(true); setNote(e.target.value); }} rows={3} />
          <Button size="sm" variant="secondary" disabled={salvando} onClick={() => void salvarNota()}>{salvando ? "Salvando…" : "Salvar nota"}</Button>
        </div>
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium" htmlFor="pkg-adaptar">Adaptar esta ideia</label>
          <GenerationPresentation value={presentation} onChange={setPresentation} />
          <Textarea id="pkg-adaptar" value={adaptNote} onChange={(e) => { setRascunhoAtivo(true); setAdaptNote(e.target.value); }} rows={2} placeholder="ex.: mesma sensação, porém mais barato e sem salto" />
          <Button size="sm" variant="secondary" disabled={adapting} onClick={adapt}>{adapting ? "Adaptando…" : "Adaptar às minhas preferências"}</Button>
          {temConteudoRascunho && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span role="status">{rotuloRascunhoAtual || "Rascunho local em andamento…"}</span>
              <Button size="sm" variant="ghost" onClick={descartarRascunho}>Descartar rascunho</Button>
            </div>
          )}
        </div>
      </div>

      <HistoricoSugestao kind={p.kind ?? "look"} atualId={id} />

      <div className={CARTAO}>
        <h2 className={TITULO_SECAO}>Depois de experimentar</h2>
        <p className="text-sm text-muted-foreground">Uma reflexão curta ajuda a Aura a aprender — só se você permitiu a personalização.</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div><label className="text-sm">Quanto você gostou?</label><Slider aria-label="Quanto você gostou (1 a 5)" className="mt-3" min={1} max={5} step={1} value={[fb.rating]} onValueChange={([v]) => { setTouched(true); setFb({ ...fb, rating: v ?? 3 }); }} /></div>
          <div><label className="text-sm">Quão confortável você se sentiu?</label><Slider aria-label="Quão confortável você se sentiu (1 a 5)" className="mt-3" min={1} max={5} step={1} value={[fb.comfort]} onValueChange={([v]) => { setTouched(true); setFb({ ...fb, comfort: v ?? 3 }); }} /></div>
        </div>
        <Textarea aria-label="Sua reflexão sobre o experimento" className="mt-4" rows={2} value={fb.reflection} onChange={(e) => { setTouched(true); setFb({ ...fb, reflection: e.target.value }); }} placeholder="O que pareceu você? O que não pareceu?" />
        <Button className="mt-3" size="sm" disabled={enviandoFb} onClick={() => void sendFeedback()}>{enviandoFb ? "Enviando…" : "Enviar feedback"}</Button>
      </div>
    </div>
  );
}
