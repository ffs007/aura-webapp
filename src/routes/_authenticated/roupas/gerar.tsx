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
import { generateOutfits } from "@/lib/clothing.functions";
import { PaywallCard, ehErroDeCota } from "@/components/PaywallCard";
import { CARTAO_DESTAQUE, FOCO, PILHA_PAGINA } from "@/lib/design";
import { OCCASIONS, WEATHER } from "@/lib/clothing";
import { EMOTIONAL_MODES } from "@/lib/aura";
import { cn } from "@/lib/utils";

const META = "Escolha a ocasião e o clima e receba looks completos com o que você já tem.";
export const Route = createFileRoute("/_authenticated/roupas/gerar")({
  head: () => ({ meta: [{ title: "Gerar looks de roupa — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Gerar looks de roupa — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Gen,
});

function Gen() {
  const nav = useNavigate();
  const gen = useServerFn(generateOutfits);
  const [occasion, setOccasion] = useState<string>("Trabalho");
  const [weather, setWeather] = useState<string>("Ameno");
  const [emotion, setEmotion] = useState("curious");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [presentation, setPresentation] = useState("");
  const count = useQuery({ queryKey: ["wardrobe-count"], queryFn: async () => (await supabase.from("wardrobe_items").select("id", { count: "exact", head: true })).count ?? 0 });
  const chip = (v: string, cur: string, set: (s: string) => void, label = v) => <button key={v} onClick={() => set(v)} aria-pressed={cur === v} className={cn("rounded-full border px-3 py-1.5 text-sm", FOCO, cur === v ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{label}</button>;

  async function go() {
    setBusy(true);
    setPaywall(null);
    try {
      const r = await gen({ data: { occasion, weather, extra, emotion, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error) { if (ehErroDeCota(r.error)) setPaywall(r.error); else toast.error(r.error); return; }
      toast.success("Looks prontos!"); nav({ to: "/roupas" });
    } catch { toast.error("Não foi possível gerar os looks. Tente de novo."); } finally { setBusy(false); }
  }
  return (
    <div className={`max-w-3xl ${PILHA_PAGINA}`}>
      <GenerationPresentation value={presentation} onChange={setPresentation} />
      {count.data === 0 && <div className={`${CARTAO_DESTAQUE} text-sm`}>Seu guarda-roupa está vazio — os looks ficam mais úteis com suas peças. <Link to="/roupas/armario" className="underline">Cadastrar peças</Link></div>}
      <div className="space-y-2"><Label>Ocasião</Label><div className="flex flex-wrap gap-2">{OCCASIONS.map((o) => chip(o, occasion, setOccasion))}</div></div>
      <div className="space-y-2"><Label>Clima</Label><div className="flex flex-wrap gap-2">{WEATHER.map((o) => chip(o, weather, setWeather))}</div></div>
      <div className="space-y-2"><Label>Como você quer se sentir?</Label><div className="flex flex-wrap gap-2">{EMOTIONAL_MODES.map((m) => chip(m.id, emotion, setEmotion, m.label))}</div></div>
      <div className="space-y-2"><Label htmlFor="roupas-gerar-extra">Algo mais? (opcional)</Label><Textarea id="roupas-gerar-extra" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="ex.: vou andar muito; quero usar a saia verde que nunca uso" /></div>
      <div className="flex items-center gap-4"><Button size="lg" variant="accent" onClick={go} disabled={busy}>{busy ? "Montando seus looks…" : "Gerar looks"}</Button>{busy && <span className="text-sm text-muted-foreground">Pode levar até um minuto.</span>}</div>
      <PaywallCard mensagem={paywall} />
    </div>
  );
}
