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
import { PaywallCard, ehErroDeCota } from "@/components/PaywallCard";
import { CARTAO_DESTAQUE, FOCO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
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
  const [paywall, setPaywall] = useState<string | null>(null);
  const [presentation, setPresentation] = useState("");
  const prof = useQuery({ queryKey: ["hair-profile-exists"], queryFn: async () => (await supabase.from("hair_profiles").select("user_id").eq("user_id", user.id).maybeSingle()).data });

  async function go() {
    setBusy(true);
    setPaywall(null);
    try {
      const r = await gen({ data: { goal, desire, emotion, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error || !r.id) {
        const msg = r.error ?? "Não foi possível gerar o plano.";
        if (ehErroDeCota(msg)) setPaywall(msg); else toast.error(msg);
        return;
      }
      toast.success("Plano pronto!");
      nav({ to: "/cabelo/plano/$id", params: { id: r.id } });
    } catch { toast.error("Não foi possível gerar o plano. Tente de novo."); } finally { setBusy(false); }
  }

  return (
    <div className={PILHA_PAGINA}>
      <GenerationPresentation value={presentation} onChange={setPresentation} />
      {!prof.isLoading && !prof.data && <div className={`${CARTAO_DESTAQUE} text-sm`}>Seu perfil capilar está vazio — as propostas ficam mais seguras com ele. <Link to="/cabelo/perfil" className="underline">Preencher agora</Link></div>}
      <div>
        <h2 className={TITULO_SECAO}>Qual é o seu objetivo?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {HAIR_GOALS.map((g) => (
            <button key={g.id} aria-pressed={goal === g.id} onClick={() => setGoal(g.id)} className={cn("rounded-2xl border p-4 text-left transition", FOCO, goal === g.id ? "border-accent bg-card shadow-soft" : "bg-card/60 hover:bg-card")}>
              <div className="font-medium">{g.label}</div><div className="text-xs text-muted-foreground">{g.hint}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid max-w-3xl gap-6">
        <div className="space-y-2"><Label>Como você está se sentindo com a mudança?</Label><div className="flex flex-wrap gap-2">{EMOTIONAL_MODES.map((m) => <button key={m.id} onClick={() => setEmotion(m.id)} aria-pressed={emotion === m.id} className={cn("rounded-full border px-3 py-1 text-sm", FOCO, emotion === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{m.label}</button>)}</div></div>
        <div className="space-y-2"><Label htmlFor="cab-gerar-desejo">Conte o que você imagina (opcional)</Label><Textarea id="cab-gerar-desejo" rows={3} value={desire} onChange={(e) => setDesire(e.target.value)} placeholder="ex.: quero clarear, mas tenho medo de estragar; não posso ir ao salão todo mês" /></div>
        <p className="text-sm text-muted-foreground">Fotos e inspirações são opcionais e ficam no <Link to="/cabelo/perfil" className="underline">perfil capilar</Link>.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button size="lg" variant="accent" onClick={go} disabled={busy}>{busy ? "Montando seu plano…" : "Gerar plano"}</Button>
        {busy && <span className="text-sm text-muted-foreground">Pode levar até um minuto.</span>}
      </div>
      <PaywallCard mensagem={paywall} />
    </div>
  );
}
