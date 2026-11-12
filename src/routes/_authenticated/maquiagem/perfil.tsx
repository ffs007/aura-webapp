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
import { EsqueletoDetalhe } from "@/components/estados";
import { Confirm } from "@/components/Confirm";
import { CARTAO_COMPACTO, FOCO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
import { logEvent } from "@/lib/aura";
import { SKILL_LABEL } from "@/lib/makeup";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/maquiagem/perfil")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Perfil de pele e alergias — Aura ID" }, { name: "description", content: "Pele, alergias, ingredientes a evitar e sua rotina de maquiagem." }, { property: "og:title", content: "Perfil de pele e alergias — Aura ID" }, { property: "og:description", content: "Pele, alergias, ingredientes a evitar e sua rotina de maquiagem." }] }),
  component: Profile,
});

const SKINS = ["Seca", "Normal", "Mista", "Oleosa", "Sensível", "Não sei"];
const FINISHES = ["Natural", "Matte", "Acetinado", "Luminoso", "Sem preferência"];
type F = { skin_type: string; allergies: string; avoid_ingredients: string; products_used: string; finish: string; skill: number; time_minutes: number; budget: string; references_text: string; skin_conditions: string };
const EMPTY: F = { skin_type: "", allergies: "", avoid_ingredients: "", products_used: "", finish: "", skill: 2, time_minutes: 10, budget: "", references_text: "", skin_conditions: "" };

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<F>(EMPTY);
  const q = useQuery({ queryKey: ["makeup-profile-full"], queryFn: async () => (await supabase.from("makeup_profiles").select("*").eq("user_id", user.id).maybeSingle()).data });
  useEffect(() => {
    const d = q.data;
    if (d) setF({ skin_type: d.skin_type ?? "", allergies: d.allergies ?? "", avoid_ingredients: d.avoid_ingredients.join(", "), products_used: d.products_used.join(", "), finish: d.finish ?? "", skill: d.skill, time_minutes: d.time_minutes, budget: d.budget ?? "", references_text: d.references_text ?? "", skin_conditions: d.skin_conditions ?? "" });
  }, [q.data]);

  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  async function save() {
    const { error } = await supabase.from("makeup_profiles").upsert({ user_id: user.id, ...f, avoid_ingredients: split(f.avoid_ingredients), products_used: split(f.products_used), updated_at: new Date().toISOString() });
    if (error) { toast.error("Não foi possível salvar o perfil. Tente de novo."); return; }
    await logEvent(q.data ? "makeup_profile_updated" : "profile_created", { module: "makeup" });
    toast.success("Perfil de pele salvo");
    qc.invalidateQueries();
  }
  async function clearAllergy() {
    const { error } = await supabase.from("makeup_profiles").update({ allergies: null, avoid_ingredients: [], skin_conditions: null }).eq("user_id", user.id);
    if (error) { toast.error("Não foi possível excluir os dados. Tente de novo."); return; }
    await logEvent("data_deleted", { scope: "allergy_data" });
    toast.success("Dados de alergia excluídos");
    qc.invalidateQueries();
  }

  if (q.isLoading) return <EsqueletoDetalhe />;
  const chip = (val: string, cur: string, k: keyof F) => <button key={val} onClick={() => setF({ ...f, [k]: val })} aria-pressed={cur === val} className={cn("rounded-full border px-3 py-1 text-sm", FOCO, cur === val ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{val}</button>;

  return (
    <div className={cn("max-w-3xl", PILHA_PAGINA)}>
      <section className="space-y-3"><Label>Tipo de pele</Label><div className="flex flex-wrap gap-2">{SKINS.map((s) => chip(s, f.skin_type, "skin_type"))}</div></section>
      <section className={cn("space-y-4", CARTAO_COMPACTO)}>
        <h2 className={TITULO_SECAO}>Alergias e sensibilidade</h2>
        <p className="text-sm text-muted-foreground">Usado só para evitar produtos. Se você tem alergias, pele sensível ou alguma condição de pele, procure um dermatologista antes de testar algo novo.</p>
        <div className="space-y-2"><Label htmlFor="maq-perfil-alergias">Histórico de alergias</Label><Textarea id="maq-perfil-alergias" rows={2} value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} placeholder="ex.: reação a fragrância em base" /></div>
        <div className="space-y-2"><Label htmlFor="maq-perfil-evitar">Ingredientes a evitar (separe por vírgula)</Label><Input id="maq-perfil-evitar" value={f.avoid_ingredients} onChange={(e) => setF({ ...f, avoid_ingredients: e.target.value })} placeholder="ex.: fragrância, álcool, níquel" /></div>
        <div className="space-y-2"><Label htmlFor="maq-perfil-condicoes">Condições de pele (opcional)</Label><Input id="maq-perfil-condicoes" value={f.skin_conditions} onChange={(e) => setF({ ...f, skin_conditions: e.target.value })} placeholder="ex.: rosácea, dermatite" /></div>
        {q.data && <Confirm label="Excluir dados de alergia" desc="Alergias, ingredientes a evitar e condições de pele serão apagados." onYes={clearAllergy} />}
      </section>
      <section className="space-y-3"><Label htmlFor="maq-perfil-produtos">Produtos que já usa (separe por vírgula)</Label><Input id="maq-perfil-produtos" value={f.products_used} onChange={(e) => setF({ ...f, products_used: e.target.value })} placeholder="ex.: protetor com cor, máscara, lip balm" /></section>
      <section className="space-y-3"><Label>Acabamento preferido</Label><div className="flex flex-wrap gap-2">{FINISHES.map((s) => chip(s, f.finish, "finish"))}</div></section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2"><Label>Nível de habilidade: {SKILL_LABEL[f.skill]}</Label><Slider aria-label="Nível de habilidade com maquiagem (1 a 5)" min={1} max={5} step={1} value={[f.skill]} onValueChange={([v]) => setF({ ...f, skill: v ?? 2 })} /></div>
        <div className="space-y-2"><Label>Tempo disponível: {f.time_minutes} min</Label><Slider aria-label="Tempo disponível para maquiagem (2 a 60 minutos)" min={2} max={60} step={1} value={[f.time_minutes]} onValueChange={([v]) => setF({ ...f, time_minutes: v ?? 10 })} /></div>
      </section>
      <section className="space-y-2"><Label htmlFor="maq-perfil-orcamento">Orçamento</Label><Input id="maq-perfil-orcamento" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} placeholder="ex.: até R$ 150 no total" /></section>
      <section className="space-y-2"><Label htmlFor="maq-perfil-referencias">Referências</Label><Textarea id="maq-perfil-referencias" rows={2} value={f.references_text} onChange={(e) => setF({ ...f, references_text: e.target.value })} placeholder="pessoas, fotos, estilos que você admira" /></section>
      <Button size="lg" onClick={save}>Salvar perfil de pele</Button>
    </div>
  );
}
