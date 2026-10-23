import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { AiLabel, Indicators } from "@/components/PackageView";
import { LEVEL_LABEL, type PackageRow } from "@/lib/aura";
import type { TattooPlan } from "@/lib/tattoo";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Comparar — Aura ID" }, { name: "description", content: "Compare sugestões lado a lado." }, { property: "og:title", content: "Comparar — Aura ID" }, { property: "og:description", content: "Compare sugestões lado a lado." }] }),
  component: Compare,
});

function Compare() {
  const [sel, setSel] = useState<string[]>([]);
  const q = useQuery({
    queryKey: ["packages"],
    queryFn: async () => ((await supabase.from("packages").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as PackageRow[],
  });
  const list = (q.data ?? []).filter((p) => p.status !== "rejected");
  const chosen = list.filter((p) => sel.includes(p.id));
  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : sel.length < 3 ? [...sel, id] : sel);

  return (
    <div>
      <h1 className="text-5xl">Comparar</h1>
      <p className="mt-2 text-muted-foreground">Escolha até três sugestões.</p>
      {!list.length && !q.isLoading && <p className="mt-6">Ainda não há sugestões. <Link to="/studio" className="underline">Crie algumas</Link>.</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {list.map((p) => (
          <label key={p.id} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
            <Checkbox checked={sel.includes(p.id)} onCheckedChange={() => toggle(p.id)} />{p.content.title}
          </label>
        ))}
      </div>
      {chosen.length > 0 && (
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${chosen.length}, minmax(0, 1fr))` }}>
          {chosen.map((p) => (
            <div key={p.id} className="space-y-4 rounded-2xl border bg-card p-5">
              <AiLabel />
              <h2 className="text-2xl">{p.content.title}</h2>
              <Indicators c={p.content} />
              {p.kind === "tattoo_plan" && <div className="space-y-3">{(p.content as TattooPlan).concepts.map(c => <div key={c.level} className="border-b pb-3 text-sm"><strong>{c.level === "safe" ? "Discreta" : LEVEL_LABEL[c.level]}</strong><p className="mt-1">{c.area} · {c.size_cm}</p><p>{c.style} · {c.visibility}</p></div>)}</div>}
              {(p.content.variations ?? []).map((v) => (
                <div key={v.level} className="text-sm"><div className="text-xs uppercase tracking-widest text-accent">{p.kind === "tattoo_plan" && v.level === "safe" ? "Discreta" : LEVEL_LABEL[v.level]}</div>{v.summary}</div>
              ))}
              <div className="text-sm"><span className="text-muted-foreground">Passos: </span>{p.content.steps?.length ?? 0}</div>
              <Link to="/package/$id" params={{ id: p.id }} className="text-sm underline">Abrir</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
