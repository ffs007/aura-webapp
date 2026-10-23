import { ReferenceImage } from "@/components/ReferenceImage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Confirm } from "@/components/Confirm";
import { AiLabel } from "@/components/PackageView";
import { logEvent, LEVEL_LABEL } from "@/lib/aura";
import { setOutfitStatus } from "@/lib/clothing.functions";
import { OUTFIT_STATUS, type Outfit } from "@/lib/clothing";
import { cn } from "@/lib/utils";

const META = "Detalhes do look: peças, cores, versões, clima e por que funciona.";
export const Route = createFileRoute("/_authenticated/roupas/look/$id")({
  head: () => ({ meta: [{ title: "Detalhe do look — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Detalhe do look — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Look,
});

function Look() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const setStatus = useServerFn(setOutfitStatus);
  const [rating, setRating] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [text, setText] = useState("");
  const q = useQuery({ queryKey: ["outfit", id], queryFn: async () => (await supabase.from("packages").select("*").eq("id", id).maybeSingle()).data });
  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!q.data) return <p>Look não encontrado. <Link to="/roupas" className="underline">Voltar</Link></p>;
  const c = q.data.content as unknown as Outfit;

  async function mark(status: "approved" | "testing" | "failed" | "later" | "implemented") {
    const r = await setStatus({ data: { id, status } });
    if (r.error) { toast.error(r.error); return; }
    toast.success(`Marcado como "${OUTFIT_STATUS[status]}"`); qc.invalidateQueries();
  }
  async function feedback() {
    if (!rating) { toast.error("Escolha uma nota."); return; }
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, package_id: id, rating, comfort: comfort || null, reflection: text || null, module: "clothing" });
    if (error) { toast.error("Não foi possível enviar."); return; }
    await logEvent("feedback_submitted", { module: "clothing" }); toast.success("Obrigado pelo retorno!"); setRating(0); setComfort(0); setText("");
  }
  async function del() { await supabase.from("packages").delete().eq("id", id); await logEvent("data_deleted", { scope: "outfit" }); nav({ to: "/roupas" }); }
  const scale = (v: number, set: (n: number) => void) => <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set(n)} className={cn("h-9 w-9 rounded-full border", v >= n ? "bg-primary text-primary-foreground" : "bg-card")}>{n}</button>)}</div>;

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>{c.occasion} · formalidade {c.formality}/5</span><AiLabel /></div>
        <h2 className="text-4xl">{c.title}</h2>
        <p className="max-w-2xl text-lg">{c.invitation}</p>
        <div className="flex flex-wrap gap-2">
          {(["approved", "testing", "later", "implemented", "failed"] as const).map((s) => <Button key={s} size="sm" variant={q.data!.status === s ? "default" : "outline"} onClick={() => mark(s)}>{OUTFIT_STATUS[s]}</Button>)}
          <Confirm label="Excluir" desc="Este look será apagado." onYes={del} />
        </div>
      </header>
      <section className="rounded-2xl bg-secondary p-5"><h3 className="text-2xl">Por que funciona</h3><p className="mt-2 text-sm">{c.why_it_works}</p><p className="mt-2 text-xs text-muted-foreground">{c.comfort_note}</p></section>
      <section className="grid gap-4 md:grid-cols-3">
        {c.versions.map((v) => (
          <div key={v.level} className="space-y-2 rounded-2xl border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-accent">{LEVEL_LABEL[v.level]}</div>
            <p className="text-sm">{v.summary}</p>
            <ReferenceImage packageId={id} slot={v.level} />
            <ul className="space-y-1 text-sm">{v.pieces.map((p) => <li key={p.piece} className="flex justify-between gap-2"><span>{p.piece} <span className="text-xs text-muted-foreground">({p.role})</span></span>{p.from_wardrobe ? <span className="text-xs text-accent">seu</span> : <span className="text-xs text-muted-foreground">ideia</span>}</li>)}</ul>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 text-sm space-y-2">
          <p><strong>Calçado:</strong> {c.shoes}</p><p><strong>Bolsa:</strong> {c.bag}</p><p><strong>Acessórios:</strong> {c.accessories.join(", ")}</p>
          <p><strong>Cores:</strong> {c.colors.join(", ")}</p><p><strong>Texturas:</strong> {c.textures.join(", ")}</p><p><strong>Proporções:</strong> {c.proportions}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-sm"><h3 className="text-xl">Variações de clima</h3><ul className="mt-2 space-y-1">{c.weather_variants.map((w) => <li key={w.weather}><strong>{w.weather}:</strong> {w.change}</li>)}</ul></div>
      </section>
      <section className="max-w-xl space-y-3"><h3 className="text-3xl">Depois de usar</h3>
        <p className="text-sm text-muted-foreground">Quanto você gostou?</p>{scale(rating, setRating)}
        <p className="text-sm text-muted-foreground">Quão confortável foi?</p>{scale(comfort, setComfort)}
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Como você se sentiu? Algo que mudaria?" />
        <Button onClick={feedback}>Enviar feedback</Button>
        <p className="text-xs text-muted-foreground">Com sua permissão, suas reações atualizam o DNA Visual. Você pode pausar quando quiser.</p>
      </section>
    </article>
  );
}
