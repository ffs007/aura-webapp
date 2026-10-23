import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { bumpSignals, logEvent } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/dna/preferencias")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Preferências — DNA Visual — Aura ID" }, { name: "description", content: "Edite cores, estilos e limites do seu DNA Visual." }, { property: "og:title", content: "Preferências — DNA Visual — Aura ID" }, { property: "og:description", content: "Edite cores, estilos e limites do seu DNA Visual." }] }),
  component: Prefs,
});

type P = {
  colors_liked: string[]; colors_rejected: string[]; styles_liked: string[]; styles_rejected: string[];
  body_highlight: string; body_preserve: string; permanent_tolerance: number; works_in_life: string; theory_only: string;
  professional_goals: string; social_goals: string;
};
const EMPTY: P = { colors_liked: [], colors_rejected: [], styles_liked: [], styles_rejected: [], body_highlight: "", body_preserve: "", permanent_tolerance: 2, works_in_life: "", theory_only: "", professional_goals: "", social_goals: "" };

function Chips({ label, values, onChange, color }: { label: string; values: string[]; onChange: (v: string[]) => void; color?: boolean }) {
  const [v, setV] = useState("");
  const [hex, setHex] = useState("#b5654a");
  const add = () => { const t = (color ? `${v.trim() || hex}` : v.trim()); if (t && !values.includes(t)) onChange([...values, t]); setV(""); };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {color && <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border bg-transparent" aria-label="Escolher cor" />}
        <Input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={color ? "nome (ex.: terracota) ou use o seletor" : "ex.: alfaiataria leve"} />
        <Button type="button" variant="secondary" onClick={add}>Adicionar</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((x) => (
          <button key={x} onClick={() => onChange(values.filter((y) => y !== x))} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs" title="Remover">
            {color && x.startsWith("#") && <span className="h-3 w-3 rounded-full border" style={{ background: x }} />}{x} ×
          </button>
        ))}
        {!values.length && <span className="text-xs text-muted-foreground">Nada ainda.</span>}
      </div>
    </div>
  );
}

function Prefs() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [p, setP] = useState<P>(EMPTY);
  const [saving, setSaving] = useState(false);
  const q = useQuery({ queryKey: ["preferences"], queryFn: async () => (await supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle()).data });
  useEffect(() => {
    if (q.data) setP({ ...EMPTY, ...Object.fromEntries(Object.entries(q.data).filter(([, v]) => v != null)) } as P);
  }, [q.data]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("preferences").upsert({ user_id: user.id, ...p, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar suas preferências."); return; }
    await logEvent("preferences_updated");
    await bumpSignals(3);
    toast.success("Preferências salvas. Atualize o resumo quando quiser.");
    qc.invalidateQueries();
  }

  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  const set = (k: keyof P) => (v: unknown) => setP({ ...p, [k]: v } as P);
  return (
    <div className="max-w-3xl space-y-10">
      <section className="space-y-5"><h2 className="text-3xl">Cores</h2>
        <Chips color label="Cores preferidas" values={p.colors_liked} onChange={set("colors_liked")} />
        <Chips color label="Cores rejeitadas" values={p.colors_rejected} onChange={set("colors_rejected")} />
      </section>
      <section className="space-y-5"><h2 className="text-3xl">Estilos e referências</h2>
        <Chips label="Estilos favoritos" values={p.styles_liked} onChange={set("styles_liked")} />
        <Chips label="Estilos rejeitados" values={p.styles_rejected} onChange={set("styles_rejected")} />
      </section>
      <section className="space-y-4"><h2 className="text-3xl">Objetivos</h2>
        <div className="space-y-2"><Label>Imagem profissional</Label><Textarea rows={2} value={p.professional_goals} onChange={(e) => set("professional_goals")(e.target.value)} /></div>
        <div className="space-y-2"><Label>Imagem social</Label><Textarea rows={2} value={p.social_goals} onChange={(e) => set("social_goals")(e.target.value)} /></div>
      </section>
      <section className="space-y-4"><h2 className="text-3xl">Corpo e mudanças (opcional)</h2>
        <p className="text-sm text-muted-foreground">Só use se quiser. Nunca inferimos nada sobre seu corpo.</p>
        <div className="space-y-2"><Label>Áreas que gosta de valorizar</Label><Input value={p.body_highlight} onChange={(e) => set("body_highlight")(e.target.value)} /></div>
        <div className="space-y-2"><Label>Áreas que prefere preservar / não destacar</Label><Input value={p.body_preserve} onChange={(e) => set("body_preserve")(e.target.value)} /></div>
        <div className="space-y-2"><Label>Tolerância a mudanças permanentes</Label>
          <Slider min={1} max={5} step={1} value={[p.permanent_tolerance]} onValueChange={([v]) => set("permanent_tolerance")(v ?? 2)} />
          <div className="flex justify-between text-xs text-muted-foreground"><span>Só reversíveis</span><span>Aberta(o) a permanentes</span></div></div>
      </section>
      <section className="space-y-4"><h2 className="text-3xl">Vida real</h2>
        <div className="space-y-2"><Label>O que funciona na vida real</Label><Textarea rows={2} value={p.works_in_life} onChange={(e) => set("works_in_life")(e.target.value)} /></div>
        <div className="space-y-2"><Label>Bonito na teoria, mas não uso</Label><Textarea rows={2} value={p.theory_only} onChange={(e) => set("theory_only")(e.target.value)} /></div>
      </section>
      <Button size="lg" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar preferências"}</Button>
    </div>
  );
}
