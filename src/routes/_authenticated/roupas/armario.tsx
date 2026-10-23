import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Confirm } from "@/components/Confirm";
import { logEvent } from "@/lib/aura";
import { ITEM_CATEGORIES } from "@/lib/clothing";
import { cn } from "@/lib/utils";

const META = "Cadastre suas peças à mão ou com foto e veja o que você mais usa.";
export const Route = createFileRoute("/_authenticated/roupas/armario")({
  head: () => ({ meta: [{ title: "Meu guarda-roupa — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Meu guarda-roupa — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Wardrobe,
});

const EMPTY = { category: "Parte de cima", name: "", color: "", fabric: "", formality: 3, season: "" };

function Wardrobe() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("all");
  const items = useQuery({ queryKey: ["wardrobe"], queryFn: async () => (await supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false })).data ?? [] });
  const consent = useQuery({ queryKey: ["photo-consent"], queryFn: async () => !!(await supabase.from("consents").select("photo_processing").eq("user_id", user.id).maybeSingle()).data?.photo_processing });
  const urls = useQuery({
    queryKey: ["wardrobe-urls", items.data?.map((i) => i.photo_path).join()],
    enabled: !!items.data?.some((i) => i.photo_path),
    queryFn: async () => {
      const paths = items.data!.filter((i) => i.photo_path).map((i) => i.photo_path!);
      const { data } = await supabase.storage.from("user-photos").createSignedUrls(paths, 3600);
      return Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl]));
    },
  });

  async function add() {
    if (!f.name.trim()) { toast.error("Dê um nome à peça."); return; }
    let photo_path: string | null = null;
    if (file && consent.data) {
      photo_path = `${user.id}/wardrobe-${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("user-photos").upload(photo_path, file);
      if (error) { toast.error("Falha ao enviar a foto."); photo_path = null; } else await logEvent("photo_uploaded", { kind: "wardrobe" });
    }
    const { error } = await supabase.from("wardrobe_items").insert({ user_id: user.id, ...f, photo_path });
    if (error) { toast.error("Não foi possível salvar a peça."); return; }
    await logEvent("wardrobe_item_created", { category: f.category });
    toast.success("Peça adicionada"); setF({ ...EMPTY, category: f.category }); setFile(null); qc.invalidateQueries({ queryKey: ["wardrobe"] });
  }
  async function del(id: string, path: string | null) {
    if (path) await supabase.storage.from("user-photos").remove([path]);
    await supabase.from("wardrobe_items").delete().eq("id", id);
    await logEvent("data_deleted", { scope: "wardrobe_item" }); qc.invalidateQueries({ queryKey: ["wardrobe"] });
  }
  async function used(id: string, n: number) { await supabase.from("wardrobe_items").update({ times_used: n + 1 }).eq("id", id); qc.invalidateQueries({ queryKey: ["wardrobe"] }); }

  const list = (items.data ?? []).filter((i) => filter === "all" || i.category === filter);
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <section className="space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-20 lg:self-start">
        <h2 className="text-2xl">Adicionar peça</h2>
        <div className="flex flex-wrap gap-1">{ITEM_CATEGORIES.map((c) => <button key={c} onClick={() => setF({ ...f, category: c })} className={cn("rounded-full border px-2.5 py-1 text-xs", f.category === c ? "border-primary bg-primary text-primary-foreground" : "")}>{c}</button>)}</div>
        <div className="space-y-2"><Label>Nome</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ex.: camisa branca de linho" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2"><Label>Cor</Label><Input value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></div>
          <div className="space-y-2"><Label>Tecido</Label><Input value={f.fabric} onChange={(e) => setF({ ...f, fabric: e.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label>Formalidade</Label><Slider min={1} max={5} step={1} value={[f.formality]} onValueChange={([v]) => setF({ ...f, formality: v ?? 3 })} /><div className="flex justify-between text-xs text-muted-foreground"><span>Bem casual</span><span>Bem formal</span></div></div>
        <div className="space-y-2"><Label>Foto (opcional)</Label>
          {consent.data ? <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /> : <p className="text-xs text-muted-foreground">Para enviar fotos, ative o processamento de fotos nas configurações. O cadastro manual funciona sem foto.</p>}
        </div>
        <Button className="w-full" onClick={add}>Adicionar</Button>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">{["all", ...ITEM_CATEGORIES].map((c) => <button key={c} onClick={() => setFilter(c)} className={cn("rounded-full px-3 py-1 text-sm", filter === c ? "bg-primary text-primary-foreground" : "bg-secondary")}>{c === "all" ? `Tudo (${items.data?.length ?? 0})` : c}</button>)}</div>
        {items.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : !list.length ? <p className="py-10 text-center text-muted-foreground">Nenhuma peça aqui ainda.</p> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {list.map((i) => (
              <div key={i.id} className="overflow-hidden rounded-2xl border bg-card">
                {i.photo_path && urls.data?.[i.photo_path] ? <img src={urls.data[i.photo_path]} alt={i.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-secondary p-3 text-center font-display text-xl">{i.name}</div>}
                <div className="space-y-1 p-3 text-sm">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{[i.category, i.color, i.fabric].filter(Boolean).join(" · ")} · usada {i.times_used}x</div>
                  <div className="flex gap-1 pt-1"><Button size="sm" variant="outline" onClick={() => used(i.id, i.times_used)}>Usei hoje</Button><Confirm label="Excluir" desc="A peça e a foto serão apagadas." onYes={() => del(i.id, i.photo_path)} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
