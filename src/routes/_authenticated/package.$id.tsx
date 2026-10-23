import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AiLabel, Indicators, Variations } from "@/components/PackageView";
import { bumpSignals, downloadText, logEvent, packageToMarkdown, STATUS_LABEL, type PackageRow } from "@/lib/aura";
import { generatePackages } from "@/lib/aura.functions";
import { GenerationPresentation } from "@/components/GenerationPresentation";

export const Route = createFileRoute("/_authenticated/package/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Sugestão — Aura ID" }, { name: "description", content: "Um pacote visual integrado." }, { property: "og:title", content: "Sugestão — Aura ID" }, { property: "og:description", content: "Um pacote visual integrado." }] }),
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

  const q = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as (PackageRow & { context: { occasion?: string } }) | null;
    },
  });
  useEffect(() => { if (q.data) setNote(q.data.note ?? ""); }, [q.data]);

  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (q.error) return <p className="text-destructive">Não foi possível carregar esta sugestão.</p>;
  if (!q.data) return <p>Esta sugestão não existe mais. <Link to="/dashboard" search={{}} className="underline">Voltar</Link></p>;
  const p = q.data;
  if (p.kind === "tattoo_plan") return <p>Este é um conceito de tatuagem. <Link to="/tatuagem/plano/$id" params={{ id }} className="underline">Abrir em Tatuagens</Link></p>;
  if ((p as { kind?: string }).kind === "outfit") return <p>Este é um look de roupa. <Link to="/roupas/look/$id" params={{ id }} className="underline">Abrir no módulo Roupas</Link></p>;
  if ((p as { kind?: string }).kind === "hair_plan") return <p>Este é um plano de cabelo. <Link to="/cabelo/plano/$id" params={{ id }} className="underline">Abrir no módulo Cabelo</Link></p>;
  if ((p as { kind?: string }).kind === "makeup_look") return <p>Este é um look de maquiagem. <Link to="/maquiagem/look/$id" params={{ id }} className="underline">Abrir no módulo Maquiagem</Link></p>;
  const c = p.content;

  async function update(patch: Partial<PackageRow>, event?: string) {
    const { error } = await supabase.from("packages").update(patch as never).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar."); return; }
    if (event) { await logEvent(event, { package_id: id, module: p.entry_mode }); await bumpSignals(); }
    qc.invalidateQueries({ queryKey: ["package", id] });
    qc.invalidateQueries({ queryKey: ["packages"] });
    toast.success("Atualizado");
  }

  async function adapt() {
    setAdapting(true);
    const r = await gen({ data: { entryMode: p.entry_mode, emotionalMode: p.emotional_mode ?? "curious", occasion: String(p.context?.occasion ?? ""), intensity: 3, extra: adaptNote, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined, adaptFrom: JSON.stringify({ title: c.title, invitation: c.invitation, pedido_de_mudanca: adaptNote }) } }).catch(() => ({ error: "Algo deu errado.", batchId: null }));
    setAdapting(false);
    if (r.error) { toast.error(r.error); return; }
    nav({ to: "/dashboard", search: { batch: r.batchId ?? undefined } });
  }

  async function sendFeedback() {
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, package_id: id, module: p.entry_mode, ...fb });
    if (error) { toast.error("Não foi possível salvar o feedback."); return; }
    await logEvent("feedback_given", { module: p.entry_mode, rating: fb.rating });
    const { data: consent } = await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", user.id).maybeSingle();
    const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
    if (consent?.personalization && !consent.dna_paused && (p.entry_mode === "beard" ? perms["beard"] === true : perms[p.entry_mode] !== false)) {
      const { data: dna } = await supabase.from("visual_dna").select("signals, signals_since_review").eq("user_id", user.id).maybeSingle();
      const signals = Array.isArray(dna?.signals) ? dna.signals : [];
      const signal = { id: crypto.randomUUID(), title: c.title, module: p.entry_mode, liked: fb.rating >= 4, comfort: fb.comfort, reflection: fb.reflection, at: new Date().toISOString() };
      await supabase.from("visual_dna").upsert({ user_id: user.id, signals: [signal, ...signals].slice(0, 100), signals_since_review: (dna?.signals_since_review ?? 0) + 1, updated_at: new Date().toISOString() });
      toast.success("Obrigada(o) — seu DNA Visual recebeu este sinal.");
    } else toast.success("Obrigada(o) — feedback salvo (DNA Visual desligado ou pausado).");
    setFb({ rating: 3, comfort: 3, reflection: "" });
  }

  return (
    <div className="space-y-10">
      <div className="animate-rise">
        <div className="flex items-center gap-3"><Link to="/dashboard" search={{}} className="text-sm text-muted-foreground">← Sugestões</Link><AiLabel /></div>
        {p.kind === "beard_plan" && <Link to="/barba" className="text-sm underline">Perfil e planos de Barba</Link>}
        <h1 className="mt-3 text-5xl md:text-6xl">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-lg">{c.invitation}</p>
        <p className="mt-4 max-w-2xl text-muted-foreground"><span className="font-medium text-foreground">Por que pode funcionar: </span>{c.why_it_works}</p>
        <div className="mt-5"><Indicators c={c} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Sobre o custo: {c.cost_note}</p>
      </div>

      {(c.professional_validation || c.reversibility === "permanent") && (
        <Alert className="border-ochre bg-ochre/15">
          <AlertTitle>Pause antes de passos permanentes</AlertTitle>
          <AlertDescription>{c.professional_validation_note || "Consulte um profissional qualificado antes de tatuagens, químicas ou outras mudanças duradouras."}</AlertDescription>
        </Alert>
      )}

      <Button asChild variant="outline"><Link to="/onboarding">Rever estrutura e preferências</Link></Button>
      <Variations c={c} packageId={id} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-3xl">Passo a passo</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{c.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {c.event_checklist.length > 0 && (<><h3 className="mt-6 text-2xl">Checklist do evento</h3><ul className="mt-2 space-y-1 text-sm">{c.event_checklist.map((s, i) => <li key={i}>☐ {s}</li>)}</ul></>)}
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-3xl">Pontos de atenção</h2>
          {c.risks.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{c.risks.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhum risco particular apontado.</p>}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-3xl">Sua resposta</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => update({ status: "saved" }, "recommendation_saved")}>Salvar</Button>
          <Button variant="accent" onClick={() => update({ status: "approved" }, "recommendation_approved")}>Aprovar — vou testar</Button>
          <Button variant="outline" onClick={() => update({ beautiful_not_practical: !p.beautiful_not_practical }, p.beautiful_not_practical ? undefined : "marked_not_practical")}>{p.beautiful_not_practical ? "Desmarcar" : "Bonito, mas não prático"}</Button>
          <Button variant="outline" onClick={() => update({ status: "rejected" }, "recommendation_rejected")}>Não é para mim</Button>
          <Button variant="ghost" onClick={() => { downloadText(`${c.title}.md`, packageToMarkdown(p)); logEvent("plan_exported", { package_id: id }); }}>Exportar</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Status atual: <span className="capitalize">{STATUS_LABEL[p.status] ?? p.status}</span></p>
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium">Notas pessoais</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <Button size="sm" variant="secondary" onClick={() => update({ note })}>Salvar nota</Button>
        </div>
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium">Adaptar esta ideia</label>
          <GenerationPresentation value={presentation} onChange={setPresentation} />
          <Textarea value={adaptNote} onChange={(e) => setAdaptNote(e.target.value)} rows={2} placeholder="ex.: mesma sensação, porém mais barato e sem salto" />
          <Button size="sm" variant="secondary" disabled={adapting} onClick={adapt}>{adapting ? "Adaptando…" : "Adaptar às minhas preferências"}</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-3xl">Depois de experimentar</h2>
        <p className="text-sm text-muted-foreground">Uma reflexão curta ajuda a Aura a aprender — só se você permitiu a personalização.</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div><label className="text-sm">Quanto você gostou?</label><Slider className="mt-3" min={1} max={5} step={1} value={[fb.rating]} onValueChange={([v]) => setFb({ ...fb, rating: v ?? 3 })} /></div>
          <div><label className="text-sm">Quão confortável você se sentiu?</label><Slider className="mt-3" min={1} max={5} step={1} value={[fb.comfort]} onValueChange={([v]) => setFb({ ...fb, comfort: v ?? 3 })} /></div>
        </div>
        <Textarea className="mt-4" rows={2} value={fb.reflection} onChange={(e) => setFb({ ...fb, reflection: e.target.value })} placeholder="O que pareceu você? O que não pareceu?" />
        <Button className="mt-3" size="sm" onClick={sendFeedback}>Enviar feedback</Button>
      </div>
    </div>
  );
}
