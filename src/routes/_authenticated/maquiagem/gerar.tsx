import { GenerationPresentation } from "@/components/GenerationPresentation";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PaywallCard, ehErroDeCota } from "@/components/PaywallCard";
import { CARTAO_DESTAQUE, FOCO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
import { EMOTIONAL_MODES } from "@/lib/aura";
import { LIGHTS, MAKEUP_MODES } from "@/lib/makeup";
import { generateMakeupLooks } from "@/lib/makeup.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/maquiagem/gerar")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Gerar looks de maquiagem — Aura ID" }, { name: "description", content: "Escolha um modo e receba propostas segura, intermediária e ousada." }, { property: "og:title", content: "Gerar looks de maquiagem — Aura ID" }, { property: "og:description", content: "Escolha um modo e receba propostas segura, intermediária e ousada." }] }),
  component: Gen,
});

function Gen() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const gen = useServerFn(generateMakeupLooks);
  const [mode, setMode] = useState("5min");
  const [deep, setDeep] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [intensity, setIntensity] = useState(2);
  const [light, setLight] = useState("natural");
  const [emotion, setEmotion] = useState("curious");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [presentation, setPresentation] = useState("");
  const prof = useQuery({ queryKey: ["makeup-profile"], queryFn: async () => (await supabase.from("makeup_profiles").select("user_id").eq("user_id", user.id).maybeSingle()).data });

  async function go() {
    setBusy(true);
    setPaywall(null);
    try {
      const r = await gen({ data: { mode, occasion, intensity, light, extra, emotion, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error) { if (ehErroDeCota(r.error)) setPaywall(r.error); else toast.error(r.error); return; }
      toast.success("Looks prontos!");
      nav({ to: "/maquiagem" });
    } catch { toast.error("Não foi possível gerar os looks. Tente de novo."); } finally { setBusy(false); }
  }

  return (
    <div className={PILHA_PAGINA}>
      <GenerationPresentation value={presentation} onChange={setPresentation} />
      {!prof.isLoading && !prof.data && (
        <div className={`${CARTAO_DESTAQUE} text-sm`}>Seu perfil de pele ainda está vazio — as sugestões ficam mais seguras com ele. <Link to="/maquiagem/perfil" className="underline">Preencher agora</Link></div>
      )}
      <div>
        <h2 className={TITULO_SECAO}>Escolha um modo</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MAKEUP_MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id} className={cn("rounded-2xl border p-4 text-left transition", FOCO, mode === m.id ? "border-accent bg-card shadow-soft" : "bg-card/60 hover:bg-card")}>
              <div className="font-medium">{m.label}</div><div className="text-xs text-muted-foreground">{m.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setDeep(false)} aria-pressed={!deep} className={cn("rounded-full px-4 py-1.5 text-sm", FOCO, !deep ? "bg-primary text-primary-foreground" : "bg-secondary")}>Rápido</button>
        <button onClick={() => setDeep(true)} aria-pressed={deep} className={cn("rounded-full px-4 py-1.5 text-sm", FOCO, deep ? "bg-primary text-primary-foreground" : "bg-secondary")}>Detalhado</button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-2"><Label htmlFor="maq-gerar-ocasiao">Ocasião</Label><Input id="maq-gerar-ocasiao" value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="ex.: reunião com cliente às 9h" /></div>
          <div className="space-y-2"><Label>Intensidade</Label><Slider aria-label="Intensidade da maquiagem (1 a 5)" min={1} max={5} step={1} value={[intensity]} onValueChange={([v]) => setIntensity(v ?? 2)} /><div className="flex justify-between text-xs text-muted-foreground"><span>Quase imperceptível</span><span>Marcante</span></div></div>
          {deep && (
            <>
              <div className="space-y-2"><Label>Luz do ambiente</Label><div className="flex flex-wrap gap-2">{LIGHTS.map(([k, l]) => <button key={k} onClick={() => setLight(k)} aria-pressed={light === k} className={cn("rounded-full border px-3 py-1 text-sm", FOCO, light === k ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{l}</button>)}</div></div>
              <div className="space-y-2"><Label>Como você está hoje?</Label><div className="flex flex-wrap gap-2">{EMOTIONAL_MODES.map((m) => <button key={m.id} onClick={() => setEmotion(m.id)} aria-pressed={emotion === m.id} className={cn("rounded-full border px-3 py-1 text-sm", FOCO, emotion === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{m.label}</button>)}</div></div>
              <div className="space-y-2"><Label htmlFor="maq-gerar-extra">Algo mais?</Label><Textarea id="maq-gerar-extra" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="ex.: tenho medo de exagerar; uso só os produtos do dia a dia" /></div>
            </>
          )}
        </div>
        {deep && <PhotoUploader userId={user.id} kind="face" title="Fotos do rosto (opcional)" note="Opcional e privado. Ajuda a IA a entender o contexto; nunca é usado para avaliar seu rosto." />}
      </div>

      <div className="flex items-center gap-4">
        <Button size="lg" variant="accent" onClick={go} disabled={busy}>{busy ? "Criando seus looks…" : "Gerar looks"}</Button>
        {busy && <span className="text-sm text-muted-foreground">Pode levar até um minuto.</span>}
      </div>
      <PaywallCard mensagem={paywall} />
    </div>
  );
}
