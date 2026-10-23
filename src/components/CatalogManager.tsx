import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const EMPTY = { category: "", name: "", price_min: "", price_max: "", finish: "", tags: "" };

export function CatalogManager() {
  const qc = useQueryClient();
  const [f, setF] = useState(EMPTY);
  const q = useQuery({ queryKey: ["catalog"], queryFn: async () => (await supabase.from("product_catalog").select("*").order("category").order("name")).data ?? [] });

  async function add() {
    if (!f.category || !f.name) { toast.error("Informe categoria e nome."); return; }
    const { error } = await supabase.from("product_catalog").insert({ category: f.category, name: f.name, price_min: Number(f.price_min) || 0, price_max: Number(f.price_max) || 0, finish: f.finish || null, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) });
    if (error) { toast.error("Não foi possível adicionar."); return; }
    setF(EMPTY); qc.invalidateQueries({ queryKey: ["catalog"] });
  }
  async function patch(id: string, v: Record<string, unknown>) {
    const { error } = await supabase.from("product_catalog").update(v as never).eq("id", id);
    if (error) toast.error("Não foi possível atualizar.");
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-3xl">Catálogo de produtos (maquiagem)</h2>
      <p className="text-sm text-muted-foreground">Categorias e faixas de preço usadas pela IA. Google Sheets / Airtable ainda não conectados.</p>
      <div className="grid gap-2 md:grid-cols-6">
        <Input placeholder="Categoria" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        <Input placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="R$ mín" value={f.price_min} onChange={(e) => setF({ ...f, price_min: e.target.value })} />
        <Input placeholder="R$ máx" value={f.price_max} onChange={(e) => setF({ ...f, price_max: e.target.value })} />
        <Input placeholder="Acabamento" value={f.finish} onChange={(e) => setF({ ...f, finish: e.target.value })} />
        <Input placeholder="tags, separadas" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
      </div>
      <Button onClick={add}>Adicionar item</Button>
      <div className="max-h-96 overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left"><tr><th className="p-2">Categoria</th><th className="p-2">Nome</th><th className="p-2">Faixa</th><th className="p-2">Pele sensível</th><th className="p-2">Ativo</th></tr></thead>
          <tbody>
            {(q.data ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.category}</td><td className="p-2">{r.name}</td><td className="p-2">R$ {r.price_min}–{r.price_max}</td>
                <td className="p-2"><Switch checked={r.sensitive_safe} onCheckedChange={(v) => patch(r.id, { sensitive_safe: v })} /></td>
                <td className="p-2"><Switch checked={r.active} onCheckedChange={(v) => patch(r.id, { active: v })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
