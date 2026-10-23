import { ReferenceImage } from "@/components/ReferenceImage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Confirm } from "@/components/Confirm";
import { AiLabel } from "@/components/PackageView";
import { logEvent } from "@/lib/aura";
import { LEVEL_LABEL, MAINT_LABEL, REV_LABEL, HAIR_DISCLAIMER, planToMarkdown, type HairPlan } from "@/lib/hair";

const META = "Propostas, linha do tempo, guia de salão e rotina do seu plano de cabelo.";
export const Route = createFileRoute("/_authenticated/cabelo/plano/$id")({
  head: () => ({ meta: [{ title: "Plano de cabelo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Plano de cabelo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Plan,
});

function Plan() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const q = useQuery({ queryKey: ["hair-plan", id], queryFn: async () => (await supabase.from("packages").select("*").eq("id", id).maybeSingle()).data });
  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!q.data) return <p>Plano não encontrado. <Link to="/cabelo" className="underline">Voltar</Link></p>;
  const p = q.data.content as unknown as HairPlan;

  async function setStatus(status: string) {
    await supabase.from("packages").update({ status }).eq("id", id);
    await logEvent(status === "rejected" ? "idea_rejected" : "idea_saved", { module: "hair" });
    toast.success(status === "rejected" ? "Ideia descartada — vamos evitar algo parecido" : "Plano salvo"); qc.invalidateQueries();
  }
  async function exportGuide() {
    const blob = new Blob([planToMarkdown(p)], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "guia-de-salao.md"; a.click();
    await logEvent("salon_guide_exported", { module: "hair" });
  }
  async function feedback() {
    if (!rating) { toast.error("Escolha uma nota."); return; }
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, package_id: id, rating, reflection: text || null, module: "hair" });
    if (error) { toast.error("Não foi possível enviar."); return; }
    await logEvent("feedback_submitted", { module: "hair" }); toast.success("Obrigado pelo retorno!"); setRating(0); setText("");
  }
  async function del() {
    await supabase.from("packages").delete().eq("id", id);
    await logEvent("data_deleted", { scope: "hair_plan" }); toast.success("Plano excluído"); nav({ to: "/cabelo" });
  }

  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <AiLabel />
        <h2 className="text-4xl">{p.title}</h2>
        <p className="max-w-2xl text-lg">{p.invitation}</p>
        <p className="max-w-2xl rounded-2xl bg-secondary p-4 text-sm">{p.reassurance}</p>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button size="sm" onClick={() => setStatus("saved")}>Salvar</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("rejected")}>Não é para mim</Button>
          <Button size="sm" variant="outline" onClick={exportGuide}>Baixar guia de salão</Button>
          <Button size="sm" variant="outline" onClick={() => { logEvent("salon_guide_exported", { module: "hair", format: "print" }); window.print(); }}>Imprimir</Button>
          <Confirm label="Excluir plano" desc="O plano e o guia serão apagados." onYes={del} />
        </div>
      </header>

      {p.warnings?.length > 0 && <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm"><strong>Atenção:</strong><ul className="mt-1 list-disc pl-5">{p.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>}

      <section><h3 className="text-3xl">Propostas</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {p.proposals.map((x) => (
            <div key={x.level} className="space-y-3 rounded-2xl border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-accent">{LEVEL_LABEL[x.level]}</div>
              <h4 className="text-2xl">{x.title}</h4>
              <p className="text-sm"><strong>Corte:</strong> {x.cut}</p>
              <p className="text-sm"><strong>Cor:</strong> {x.color}</p>
              <p className="text-sm italic text-muted-foreground">{x.visual_message}</p>
              <dl className="grid grid-cols-2 gap-1 text-xs">
                <dt className="text-muted-foreground">Manutenção</dt><dd>{MAINT_LABEL[x.maintenance]}</dd>
                <dt className="text-muted-foreground">Custo</dt><dd>{x.cost_brl}</dd>
                <dt className="text-muted-foreground">Adaptação</dt><dd>{x.adaptation_time}</dd>
                <dt className="text-muted-foreground">Reversão</dt><dd>{REV_LABEL[x.reversibility]}</dd>
              </dl>
              <div className="flex flex-wrap gap-1 text-xs">
                {x.chemical && <span className="rounded-full bg-destructive/10 px-2 py-0.5">Procedimento químico</span>}
                {x.high_maintenance && <span className="rounded-full bg-accent/15 px-2 py-0.5">Alta manutenção</span>}
                {x.professional_validation && <span className="rounded-full bg-secondary px-2 py-0.5">Validar com profissional</span>}
              </div>
              <ReferenceImage packageId={id} slot={x.level} />
              {x.warnings?.length > 0 && <ul className="list-disc pl-5 text-xs text-muted-foreground">{x.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
            </div>
          ))}
        </div>
      </section>

      <section><h3 className="text-3xl">Linha do tempo conceitual</h3>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">{p.timeline.map((t) => <li key={t.period} className="rounded-2xl border-l-4 border-accent bg-card p-5"><div className="font-medium">{t.period}</div><ul className="mt-2 list-disc pl-5 text-sm">{t.steps.map((s) => <li key={s}>{s}</li>)}</ul></li>)}</ol>
      </section>

      <section className="rounded-2xl border bg-card p-6"><h3 className="text-3xl">Guia de salão</h3>
        <p className="mt-3 text-sm">{p.salon_guide.technical}</p>
        <h4 className="mt-4 font-medium">Frases para usar</h4><ul className="mt-1 space-y-1 text-sm">{p.salon_guide.phrases.map((x) => <li key={x}>“{x}”</li>)}</ul>
        <h4 className="mt-4 font-medium">Perguntas para fazer</h4><ul className="mt-1 list-disc pl-5 text-sm">{p.salon_guide.questions.map((x) => <li key={x}>{x}</li>)}</ul>
        <h4 className="mt-4 font-medium">Evitar</h4><ul className="mt-1 list-disc pl-5 text-sm">{p.salon_guide.avoid.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-4 text-xs text-muted-foreground">{HAIR_DISCLAIMER} Exportação para Google Docs ainda não conectada.</p>
      </section>

      <section><h3 className="text-3xl">Rotina e cronograma</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">{p.routine.map((r) => <div key={r.frequency} className="rounded-2xl border bg-card p-5"><div className="font-medium">{r.frequency}</div><ul className="mt-2 list-disc pl-5 text-sm">{r.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>)}</div>
        <p className="mt-2 text-sm"><Link to="/cabelo/alertas" className="underline">Ativar lembretes</Link></p>
      </section>

      <section className="max-w-xl space-y-3 print:hidden"><h3 className="text-3xl">Como foi?</h3>
        <p className="text-sm text-muted-foreground">Depois do salão ou de testar a rotina, conte para a gente.</p>
        <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} className={`h-9 w-9 rounded-full border ${rating >= n ? "bg-primary text-primary-foreground" : "bg-card"}`}>{n}</button>)}</div>
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="O que deu certo? O que você mudaria?" />
        <Button onClick={feedback}>Enviar feedback</Button>
      </section>
    </article>
  );
}
