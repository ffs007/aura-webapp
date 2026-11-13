import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { GitCompare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AiLabel, Indicators } from "@/components/PackageView";
import { CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoLista } from "@/components/estados";
import { CARTAO_COMPACTO, TITULO_ITEM } from "@/lib/design";
import { LEVEL_LABEL, type PackageRow } from "@/lib/aura";
import type { TattooPlan } from "@/lib/tattoo";

const contentOf = (p: PackageRow) => (p.content ?? {}) as unknown as Record<string, unknown>;
const textOf = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const titleOf = (p: PackageRow) => textOf(contentOf(p)["title"]) || "Sugestão";
const rowsOf = (v: unknown) => (Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {})) : []);
const levelLabel = (level: string) => LEVEL_LABEL[level] ?? level;

/** Níveis exibíveis por tipo: variations (Aura/maquiagem), versions (roupas) ou proposals (cabelo). */
function levelsOf(p: PackageRow) {
  const c = contentOf(p);
  const variations = rowsOf(c["variations"]);
  if (variations.length) return variations.map((v) => ({ level: textOf(v["level"]), summary: textOf(v["summary"]) }));
  const versions = rowsOf(c["versions"]);
  if (versions.length) return versions.map((v) => ({ level: textOf(v["level"]), summary: textOf(v["summary"]) }));
  return rowsOf(c["proposals"]).map((v) => ({ level: textOf(v["level"]), summary: [textOf(v["title"]), textOf(v["cut"]) && `Corte: ${textOf(v["cut"])}`, textOf(v["color"]) && `Cor: ${textOf(v["color"])}`].filter(Boolean).join(" · ") }));
}
const stepsOf = (p: PackageRow) => { const s = contentOf(p)["steps"]; return Array.isArray(s) ? s.length : null; };
const conceptsOf = (p: PackageRow) => (p.kind === "tattoo_plan" && Array.isArray((p.content as unknown as TattooPlan).concepts) ? (p.content as unknown as TattooPlan).concepts : []);

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

  if (q.isLoading) return <div className="space-y-6"><CabecalhoPagina titulo="Comparar" descricao="Escolha até três sugestões." /><EsqueletoLista itens={2} altura="h-40" /></div>;
  if (q.error) return <EstadoErro titulo="Não foi possível carregar suas sugestões" onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;
  if (!list.length) return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Comparar" descricao="Escolha até três sugestões." />
      <EstadoVazio
        icone={<GitCompare aria-hidden className="size-5" />}
        titulo="Nada para comparar ainda"
        descricao="Crie algumas sugestões no Estúdio e volte para vê-las lado a lado."
        acoes={<Button asChild><Link to="/studio">Criar sugestões</Link></Button>}
      />
    </div>
  );

  return (
    <div>
      <CabecalhoPagina titulo="Comparar" descricao="Escolha até três sugestões." />
      <div className="mt-6 flex flex-wrap gap-2">
        {list.map((p) => (
          <label key={p.id} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
            <Checkbox aria-label={titleOf(p)} checked={sel.includes(p.id)} onCheckedChange={() => toggle(p.id)} />{titleOf(p)}
          </label>
        ))}
      </div>
      {chosen.length > 0 && (
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${chosen.length}, minmax(0, 1fr))` }}>
          {chosen.map((p) => (
            <div key={p.id} className={`${CARTAO_COMPACTO} space-y-4`}>
              <AiLabel />
              <h2 className={TITULO_ITEM}>{titleOf(p)}</h2>
              <Indicators c={p.content} />
              {conceptsOf(p).map((c) => <div key={c.level} className="border-b pb-3 text-sm"><strong>{c.level === "safe" ? "Discreta" : levelLabel(c.level)}</strong><p className="mt-1">{[textOf(c.area), textOf(c.size_cm)].filter(Boolean).join(" · ") || "—"}</p><p>{[textOf(c.style), textOf(c.visibility)].filter(Boolean).join(" · ") || "—"}</p></div>)}
              {levelsOf(p).map((v, i) => (
                <div key={`${v.level}-${i}`} className="text-sm"><div className="text-xs uppercase tracking-widest text-accent">{p.kind === "tattoo_plan" && v.level === "safe" ? "Discreta" : levelLabel(v.level)}</div>{v.summary}</div>
              ))}
              <div className="text-sm"><span className="text-muted-foreground">Passos: </span>{stepsOf(p) ?? "—"}</div>
              <Link to="/package/$id" params={{ id: p.id }} className="text-sm underline">Abrir</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
