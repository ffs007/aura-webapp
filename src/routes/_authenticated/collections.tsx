import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PackageRow } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/collections")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Coleções — Aura ID" }, { name: "description", content: "Agrupe as sugestões que você ama." }, { property: "og:title", content: "Coleções — Aura ID" }, { property: "og:description", content: "Agrupe as sugestões que você ama." }] }),
  component: Collections,
});

function Collections() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const cols = useQuery({ queryKey: ["collections"], queryFn: async () => (await supabase.from("collections").select("*").order("created_at", { ascending: false })).data ?? [] });
  const pkgs = useQuery({ queryKey: ["packages"], queryFn: async () => ((await supabase.from("packages").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as PackageRow[] });
  const kept = (pkgs.data ?? []).filter((p) => p.status === "saved" || p.status === "approved");

  async function create() {
    if (!name.trim()) return;
    const { error } = await supabase.from("collections").insert({ user_id: user.id, name: name.trim() });
    if (error) { toast.error("Não foi possível criar a coleção"); return; }
    setName(""); qc.invalidateQueries({ queryKey: ["collections"] });
  }
  async function toggle(colId: string, ids: string[], pid: string) {
    const next = ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid];
    await supabase.from("collections").update({ package_ids: next }).eq("id", colId);
    qc.invalidateQueries({ queryKey: ["collections"] });
  }
  async function remove(id: string) {
    await supabase.from("collections").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["collections"] });
  }

  return (
    <div className="space-y-8">
      <div><h1 className="text-5xl">Coleções</h1><p className="mt-2 text-muted-foreground">Agrupe sugestões salvas e aprovadas — para uma estação, uma viagem, um novo capítulo.</p></div>
      <div className="flex max-w-md gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova coleção" /><Button onClick={create}>Criar</Button></div>
      {!cols.data?.length && <p className="text-muted-foreground">Nenhuma coleção ainda.</p>}
      {kept.length === 0 && <p className="text-sm text-muted-foreground">Salve ou aprove sugestões para adicioná-las aqui. <Link to="/dashboard" search={{}} className="underline">Ver sugestões</Link></p>}
      <div className="grid gap-4 md:grid-cols-2">
        {cols.data?.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between"><h2 className="text-3xl">{c.name}</h2><Button size="sm" variant="ghost" onClick={() => remove(c.id)}>Excluir</Button></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {kept.map((p) => (
                <button key={p.id} onClick={() => toggle(c.id, c.package_ids, p.id)} className={c.package_ids.includes(p.id) ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground" : "rounded-full bg-secondary px-3 py-1 text-xs"}>{p.content.title}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
