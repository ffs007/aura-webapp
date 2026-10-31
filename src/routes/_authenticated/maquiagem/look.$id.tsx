import { ReferenceImage } from "@/components/ReferenceImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AiLabel, Indicators } from "@/components/PackageView";
import { bumpSignals, downloadText, LEVEL_LABEL, logEvent, STATUS_LABEL } from "@/lib/aura";
import { lookToMarkdown } from "@/lib/manual";
import { SKILL_LABEL, type MakeupLook } from "@/lib/makeup";

export const Route = createFileRoute("/_authenticated/maquiagem/look/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Look de maquiagem — Aura ID" }, { name: "description", content: "Detalhes, passos e ajustes do seu look." }, { property: "og:title", content: "Look de maquiagem — Aura ID" }, { property: "og:description", content: "Detalhes, passos e ajustes do seu look." }] }),
  component: LookDetail,
});

function LookDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [fb, setFb] = useState({ rating: 3, comfort: 3, reflection: "" });
  const q = useQuery({ queryKey: ["look", id], queryFn: async () => (await supabase.from("packages").select("*").eq("id", id).maybeSingle()).data });
  useEffect(() => { if (q.data) setNote(q.data.note ?? ""); }, [q.data]);

  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!q.data) return <p>Este look não existe mais. <Link to="/maquiagem" className="underline">Voltar</Link></p>;
  const p = q.data;
  const c = p.content as unknown as MakeupLook;

  async function update(patch: Record<string, unknown>, event?: string) {
    const { error } = await supabase.from("packages").update(patch as never).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar."); return; }
    if (event) { await logEvent(event, { package_id: id, module: "makeup" }); await bumpSignals(); }
    qc.invalidateQueries();
    toast.success("Atualizado");
  }

  async function sendFeedback() {
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, package_id: id, module: "makeup", ...fb });
    if (error) { toast.error("Não foi possível salvar o feedback."); return; }
    await logEvent("feedback_submitted", { module: "makeup", rating: fb.rating });
    const { data: consent } = await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", user.id).maybeSingle();
    const perms = (consent?.module_permissions ?? {}) as Record<string, boolean>;
    if (consent?.personalization && !consent.dna_paused && perms["makeup"] !== false) {
      const { data: dna } = await supabase.from("visual_dna").select("signals, signals_since_review").eq("user_id", user.id).maybeSingle();
      const signals = Array.isArray(dna?.signals) ? dna!.signals : [];
      const signal = { id: crypto.randomUUID(), title: c.title, module: "makeup", liked: fb.rating >= 4, comfort: fb.comfort, reflection: fb.reflection, at: new Date().toISOString() };
      await supabase.from("visual_dna").upsert({ user_id: user.id, signals: [signal, ...signals].slice(0, 100), signals_since_review: (dna?.signals_since_review ?? 0) + 1, updated_at: new Date().toISOString() });
      toast.success("Obrigada(o) — seu DNA Visual recebeu este sinal.");
    } else toast.success("Feedback salvo (DNA Visual não autorizado para maquiagem).");
    setFb({ rating: 3, comfort: 3, reflection: "" });
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3"><Link to="/maquiagem" className="text-sm text-muted-foreground">← Looks</Link><AiLabel /></div>
        <h2 className="mt-3 text-5xl">{c.title}</h2>
        <p className="mt-3 max-w-2xl text-lg">{c.invitation}</p>
        <p className="mt-3 max-w-2xl text-muted-foreground"><span className="font-medium text-foreground">Por que pode funcionar: </span>{c.why_it_works}</p>
        <div className="mt-4"><Indicators c={c as never} /></div>
      </div>
      {c.professional_validation && (
        <Alert className="border-ochre bg-ochre/15"><AlertTitle>Vale validar com um profissional</AlertTitle><AlertDescription>{c.professional_validation_note || "Com alergias, pele sensível ou condições de pele, consulte um dermatologista e teste produtos novos numa pequena área."}</AlertDescription></Alert>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {c.variations.map((v) => (
          <div key={v.level} className="rounded-2xl border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-accent">{LEVEL_LABEL[v.level]}</div>
            <p className="mt-1 font-display text-xl">{v.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground">{v.time_minutes} min · habilidade {SKILL_LABEL[v.skill] ?? v.skill} · {v.cost_brl}</p>
            <h4 className="mt-3 text-sm font-medium">Checklist de produtos</h4>
            <ul className="mt-1 space-y-1 text-sm">{v.products.map((x, i) => <li key={i}>☐ {x}</li>)}</ul>
            <ReferenceImage packageId={id} slot={v.level} look />
            <h4 className="mt-3 text-sm font-medium">Ordem de aplicação</h4>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{v.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="text-3xl">Se algo não sair como esperado</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{c.adjustments.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h4 className="mt-5 font-medium">Como adaptar</h4><p className="text-sm text-muted-foreground">{c.adaptation}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="text-3xl">Pontos de atenção</h3>
          {c.risks.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{c.risks.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nada em especial.</p>}
          {c.event_checklist.length > 0 && (<><h4 className="mt-5 font-medium">Checklist do evento</h4><ul className="text-sm">{c.event_checklist.map((x, i) => <li key={i}>☐ {x}</li>)}</ul></>)}
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-3xl">Sua resposta</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => update({ status: "saved" }, "look_saved")}>Salvar</Button>
          <Button variant="accent" onClick={() => update({ status: "approved" }, "look_saved")}>Aprovar — vou testar</Button>
          <Button variant="outline" onClick={() => update({ beautiful_not_practical: !p.beautiful_not_practical }, p.beautiful_not_practical ? undefined : "marked_not_practical")}>{p.beautiful_not_practical ? "Desmarcar" : "Bonito, mas não prático"}</Button>
          <Button variant="outline" onClick={() => update({ status: "rejected" }, "look_rejected")}>Não é para mim</Button>
          <Button variant="ghost" onClick={() => { downloadText(`${c.title}.md`, lookToMarkdown(c, p.note)); logEvent("manual_exported", { package_id: id }); }}>Exportar</Button>
          <Button asChild variant="ghost"><Link to="/compare">Comparar</Link></Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Status: {STATUS_LABEL[p.status] ?? p.status}</p>
        <div className="mt-5 space-y-2"><label className="text-sm font-medium">Notas</label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /><Button size="sm" variant="secondary" onClick={() => update({ note })}>Salvar nota</Button></div>
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-3xl">Depois de usar</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div><label className="text-sm">Quanto gostou?</label><Slider className="mt-3" min={1} max={5} step={1} value={[fb.rating]} onValueChange={([v]) => setFb({ ...fb, rating: v ?? 3 })} /></div>
          <div><label className="text-sm">Quão confortável se sentiu?</label><Slider className="mt-3" min={1} max={5} step={1} value={[fb.comfort]} onValueChange={([v]) => setFb({ ...fb, comfort: v ?? 3 })} /></div>
        </div>
        <Textarea className="mt-4" rows={2} value={fb.reflection} onChange={(e) => setFb({ ...fb, reflection: e.target.value })} placeholder="Durou bem? Pareceu você? Achou exagerado?" />
        <Button className="mt-3" size="sm" onClick={sendFeedback}>Enviar feedback</Button>
      </div>
    </div>
  );
}
