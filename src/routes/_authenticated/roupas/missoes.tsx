import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO_COMPACTO, TITULO_ITEM } from "@/lib/design";
import { generateMissions } from "@/lib/clothing.functions";
import type { StyleMissions } from "@/lib/clothing";

const META = "Desafios curtos para redescobrir as peças que você já tem.";
export const Route = createFileRoute("/_authenticated/roupas/missoes")({
  head: () => ({ meta: [{ title: "Missões de estilo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Missões de estilo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Missions,
});

function Missions() {
  const qc = useQueryClient();
  const run = useServerFn(generateMissions);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["missions"], queryFn: async () => (await supabase.from("style_analyses").select("*").eq("kind", "missions").order("created_at", { ascending: false }).limit(1).maybeSingle()).data });
  async function go() {
    setBusy(true);
    try { const r = await run(); if (r.error) toast.error(r.error); else qc.invalidateQueries({ queryKey: ["missions"] }); }
    catch { toast.error("Não foi possível criar as missões. Tente de novo."); } finally { setBusy(false); }
  }
  async function toggle() { if (!q.data) return; await supabase.from("style_analyses").update({ done: !q.data.done }).eq("id", q.data.id); qc.invalidateQueries({ queryKey: ["missions"] }); }
  const m = q.data?.content as unknown as StyleMissions | undefined;
  return (
    <div className="space-y-6">
      <div className="flex gap-2"><Button variant="accent" onClick={go} disabled={busy}>{busy ? "Criando…" : m ? "Novas missões" : "Criar missões da semana"}</Button>{m && <Button variant="outline" onClick={toggle}>{q.data!.done ? "Reabrir" : "Concluí as missões"}</Button>}</div>
      {!m ? (
        <EstadoVazio
          compacto
          icone={<Sparkles className="size-6" />}
          titulo="Nenhuma missão ainda"
          descricao="Crie as missões da semana para redescobrir peças que você já tem, com desafios curtos e sem compras."
        />
      ) : (
        <><AiLabel /><div className="grid gap-4 md:grid-cols-2">{m.missions.map((x) => (
          <div key={x.title} className={CARTAO_COMPACTO}>
            <h3 className={TITULO_ITEM}>{x.title}</h3><p className="mt-1 text-sm">{x.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">{x.pieces.map((p) => <span key={p} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{p}</span>)}</div>
            <p className="mt-3 text-xs italic text-muted-foreground">{x.reflection}</p>
          </div>
        ))}</div></>
      )}
    </div>
  );
}
