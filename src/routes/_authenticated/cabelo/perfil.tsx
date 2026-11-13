import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { EsqueletoDetalhe } from "@/components/estados";
import { Confirm } from "@/components/Confirm";
import { PhotoUploader } from "@/components/PhotoUploader";
import { CARTAO_COMPACTO, FOCO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
import { logEvent } from "@/lib/aura";
import { TEXTURES, LENGTHS, LEVELS } from "@/lib/hair";
import { cn } from "@/lib/utils";

const META = "Textura, comprimento, histórico químico e sensibilidade do seu cabelo.";
export const Route = createFileRoute("/_authenticated/cabelo/perfil")({
  head: () => ({ meta: [{ title: "Perfil capilar — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Perfil capilar — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

type F = { texture: string; current_length: string; chemical_history: string; heat_damage: string; bleaching_history: string; scalp_sensitivity: string; maintenance_tolerance: number; skill: number; desired_image: string; grooming_mode: boolean };
const EMPTY: F = { texture: "", current_length: "", chemical_history: "", heat_damage: "", bleaching_history: "", scalp_sensitivity: "", maintenance_tolerance: 2, skill: 2, desired_image: "", grooming_mode: false };

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<F>(EMPTY);
  const q = useQuery({ queryKey: ["hair-profile"], queryFn: async () => (await supabase.from("hair_profiles").select("*").eq("user_id", user.id).maybeSingle()).data });
  useEffect(() => { const d = q.data; if (d) setF({ ...EMPTY, ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ?? ""])) } as F); }, [q.data]);

  async function save() {
    const { error } = await supabase.from("hair_profiles").upsert({ user_id: user.id, ...f, updated_at: new Date().toISOString() });
    if (error) { toast.error("Não foi possível salvar o perfil. Tente de novo."); return; }
    if (!q.data) await logEvent("profile_completed", { module: "hair" });
    toast.success("Perfil capilar salvo"); qc.invalidateQueries();
  }
  async function del() {
    const { error } = await supabase.from("hair_profiles").delete().eq("user_id", user.id);
    if (error) { toast.error("Não foi possível excluir o perfil. Tente de novo."); return; }
    await logEvent("data_deleted", { scope: "hair_profile" });
    setF(EMPTY); toast.success("Perfil capilar excluído"); qc.invalidateQueries();
  }
  if (q.isLoading) return <EsqueletoDetalhe />;
  const chips = (opts: readonly string[], k: keyof F) => (
    <div className="flex flex-wrap gap-2">{opts.map((o) => <button key={o} onClick={() => setF({ ...f, [k]: o })} aria-pressed={f[k] === o} className={cn("rounded-full border px-3 py-1 text-sm", FOCO, f[k] === o ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{o}</button>)}</div>
  );
  const row = (label: string, k: keyof F, opts: readonly string[]) => <section className="space-y-2"><Label>{label}</Label>{chips(opts, k)}</section>;

  return (
    <div className={cn("max-w-3xl", PILHA_PAGINA)}>
      {row("Textura", "texture", TEXTURES)}
      {row("Comprimento atual", "current_length", LENGTHS)}
      <section className={`${CARTAO_COMPACTO} space-y-4`}>
        <h2 className={TITULO_SECAO}>Histórico e sensibilidade</h2>
        <p className="text-sm text-muted-foreground">Usado só para deixar as sugestões mais seguras. Química, descoloração e couro cabeludo sensível sempre pedem validação profissional.</p>
        {row("Química (coloração, alisamento, progressiva…)", "chemical_history", LEVELS)}
        {row("Descoloração", "bleaching_history", LEVELS)}
        {row("Dano por calor (chapinha, secador)", "heat_damage", LEVELS)}
        {row("Sensibilidade do couro cabeludo", "scalp_sensitivity", LEVELS)}
      </section>
      <section className="space-y-2"><Label>Tolerância a manutenção</Label><Slider aria-label="Tolerância a manutenção do cabelo (1 a 5)" min={1} max={5} step={1} value={[f.maintenance_tolerance]} onValueChange={([v]) => setF({ ...f, maintenance_tolerance: v ?? 2 })} /><div className="flex justify-between text-xs text-muted-foreground"><span>Quase nenhuma</span><span>Vou ao salão sempre</span></div></section>
      <section className="space-y-2"><Label>Habilidade para arrumar em casa</Label><Slider aria-label="Habilidade para arrumar o cabelo em casa (1 a 5)" min={1} max={5} step={1} value={[f.skill]} onValueChange={([v]) => setF({ ...f, skill: v ?? 2 })} /><div className="flex justify-between text-xs text-muted-foreground"><span>Iniciante</span><span>Faço de tudo</span></div></section>
      <section className="space-y-2"><Label htmlFor="cab-perfil-imagem">Imagem que você quer transmitir</Label><Textarea id="cab-perfil-imagem" rows={2} value={f.desired_image} onChange={(e) => setF({ ...f, desired_image: e.target.value })} placeholder="ex.: mais leve e prática, sem perder o volume" /></section>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.grooming_mode} onChange={(e) => setF({ ...f, grooming_mode: e.target.checked })} /> Ativar modo barbearia (corte, barba e cuidados masculinos)</label>
      <div className="flex gap-2"><Button onClick={save}>Salvar perfil</Button>{q.data && <Confirm label="Excluir perfil capilar" desc="Todos os dados do perfil capilar serão apagados." onYes={del} />}</div>
      <div className="grid gap-6 md:grid-cols-2">
        <PhotoUploader userId={user.id} kind="hair_photo" title="Fotos do cabelo (opcional)" note="Frente, lado e costas. Opcional e privado; nunca é usado para avaliar sua aparência." />
        <PhotoUploader userId={user.id} kind="hair_reference" title="Inspirações (opcional)" note="Referências de cortes e cores que você gosta. Exclua quando quiser." />
      </div>
    </div>
  );
}
