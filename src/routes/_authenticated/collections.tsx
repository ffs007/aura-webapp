import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirm } from "@/components/Confirm";
import { Aviso, CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoLista } from "@/components/estados";
import { CARTAO_COMPACTO, FOCO, GRADE_CARTOES, TITULO_ITEM } from "@/lib/design";
import { cn } from "@/lib/utils";
import type { PackageRow } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/collections")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Coleções — Aura ID" }, { name: "description", content: "Agrupe as sugestões que você ama." }, { property: "og:title", content: "Coleções — Aura ID" }, { property: "og:description", content: "Agrupe as sugestões que você ama." }] }),
  component: Collections,
});

function Collections() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [criando, setCriando] = useState(false);
  const cols = useQuery({ queryKey: ["collections"], queryFn: async () => (await supabase.from("collections").select("*").order("created_at", { ascending: false })).data ?? [] });
  const pkgs = useQuery({ queryKey: ["packages"], queryFn: async () => ((await supabase.from("packages").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as PackageRow[] });
  const kept = (pkgs.data ?? []).filter((p) => p.status === "saved" || p.status === "approved");

  async function create() {
    if (criando) return;
    if (!name.trim()) { toast.error("Dê um nome à coleção."); return; }
    setCriando(true);
    try {
      const { error } = await supabase.from("collections").insert({ user_id: user.id, name: name.trim() });
      if (error) { toast.error("Não foi possível criar a coleção."); return; }
      setName(""); qc.invalidateQueries({ queryKey: ["collections"] });
    } finally { setCriando(false); }
  }
  async function toggle(colId: string, ids: string[], pid: string) {
    const next = ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid];
    const { error } = await supabase.from("collections").update({ package_ids: next }).eq("id", colId);
    if (error) { toast.error("Não foi possível atualizar a coleção."); return; }
    qc.invalidateQueries({ queryKey: ["collections"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir a coleção."); return; }
    qc.invalidateQueries({ queryKey: ["collections"] });
  }

  return (
    <div className="space-y-8">
      <CabecalhoPagina
        titulo="Coleções"
        descricao="Agrupe sugestões salvas e aprovadas — para uma estação, uma viagem, um novo capítulo."
      />
      <div className="flex max-w-md gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova coleção" aria-label="Nome da nova coleção" /><Button onClick={create} disabled={criando}>{criando ? "Criando…" : "Criar"}</Button></div>
      {cols.isLoading ? (
        <EsqueletoLista itens={2} altura="h-40" />
      ) : cols.error ? (
        <EstadoErro titulo="Não foi possível carregar suas coleções" onTentarNovamente={() => void cols.refetch()} recarregando={cols.isFetching} />
      ) : !cols.data?.length ? (
        <EstadoVazio
          icone={<Layers aria-hidden className="size-5" />}
          titulo="Nenhuma coleção ainda"
          descricao="Crie a primeira para guardar as sugestões de uma estação, de uma viagem ou de um novo capítulo."
        />
      ) : null}
      {kept.length === 0 && (
        <Aviso tom="info">
          Salve ou aprove sugestões para adicioná-las aqui. <Link to="/dashboard" search={{}} className="underline">Ver sugestões</Link>
        </Aviso>
      )}
      <div className={GRADE_CARTOES}>
        {cols.data?.map((c) => (
          <div key={c.id} className={CARTAO_COMPACTO}>
            <div className="flex items-center justify-between"><h2 className={TITULO_ITEM}>{c.name}</h2><Confirm label="Excluir" desc="A coleção será apagada; as sugestões continuam salvas." onYes={() => void remove(c.id)} /></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {kept.map((p) => (
                <button key={p.id} onClick={() => toggle(c.id, c.package_ids, p.id)} aria-pressed={c.package_ids.includes(p.id)} className={c.package_ids.includes(p.id) ? cn(FOCO, "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground") : cn(FOCO, "rounded-full bg-secondary px-3 py-1 text-xs")}>{p.content.title}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
