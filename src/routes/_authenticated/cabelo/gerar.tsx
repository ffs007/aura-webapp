import { GenerationPresentation } from "@/components/GenerationPresentation";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateHairPlan } from "@/lib/hair.functions";
import { HAIR_GOALS } from "@/lib/hair";
import { EMOTIONAL_MODES } from "@/lib/aura";
import { cn } from "@/lib/utils";

const META = "Escolha um objetivo e receba propostas segura, intermediária e ousada para o seu cabelo.";
export const Route = createFileRoute("/_authenticated/cabelo/gerar")({
  head: () => ({ meta: [{ title: "Novo plano de cabelo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Novo plano de cabelo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Gen,
});

function Gen() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const gen = useServerFn(generateHairPlan);
  const [goal, setGoal] = useState("gradual");
  const [desire, setDesire] = useState("");
  const [emotion, setEmotion] = useState("curious");
  const [busy, setBusy] = useState(false);
  const [presentation, setPresentation] = useState("");
  const prof = useQuery({ queryKey: ["hair-profile-exists"], queryFn: async () => (await supabase.from("hair_profiles").select("user_id").eq("user_id", user.id).maybeSingle()).data });

  async function go() {
    setBusy(true);
    try {
      const r = await gen({ data: { goal, desire, emotion, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error || !r.id) { toast.error(r.error ?? "Não foi possível gerar o plano."); return; }
      toast.success("Plano pronto!");
      nav({ to: "/cabelo/plano/$id", params: { id: r.id } });
    } catch { toast.error("Algo deu errado ao gerar o plano."); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-10">
      <GenerationPresentation value={presentation} onChange={setPresentation} />
      {!prof.isLoading && !prof.data && <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4 text-sm">Seu perfil capilar está vazio — as propostas ficam mais seguras com ele. <Link to="/cabelo/perfil" className="underline">Preencher agora</Link></div>}
      <div>
        <h2 className="text-3xl">Qual é o seu objetivo?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {HAIR_GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)} className={cn("rounded-2xl border p-4 text-left transition", goal === g.id ? "border-accent bg-card shadow-soft" : "bg-card/60 hover:bg-card")}>
              <div className="font-medium">{g.label}</div><div className="text-xs text-muted-foreground">{g.hint}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid max-w-3xl gap-6">
        <div className="space-y-2"><Label>Como você está se sentindo com a mudança?</Label><div className="flex flex-wrap gap-2">{EMOTIONAL_MODES.map((m) => <button key={m.id} onClick={() => setEmotion(m.id)} className={cn("rounded-full border px-3 py-1 text-sm", emotion === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{m.label}</button>)}</div></div>
        <div className="space-y-2"><Label>Conte o que você imagina (opcional)</Label><Textarea rows={3} value={desire} onChange={(e) => setDesire(e.target.value)} placeholder="ex.: quero clarear, mas tenho medo de estragar; não posso ir ao salão todo mês" /></div>
        <p className="text-sm text-muted-foreground">Fotos e inspirações são opcionais e ficam no <Link to="/cabelo/perfil" className="underline">perfil capilar</Link>.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button size="lg" variant="accent" onClick={go} disabled={busy}>{busy ? "Montando seu plano…" : "Gerar plano"}</Button>
        {busy && <span className="text-sm text-muted-foreground">Pode levar até um minuto.</span>}
      </div>
    </div>
  );
}
