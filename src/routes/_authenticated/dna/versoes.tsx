import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DNA_FIELDS, fmtDateTime, logEvent, type DnaSummary } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/dna/versoes")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Versões — DNA Visual — Aura ID" }, { name: "description", content: "Histórico de versões do seu DNA Visual." }, { property: "og:title", content: "Versões — DNA Visual — Aura ID" }, { property: "og:description", content: "Histórico de versões do seu DNA Visual." }] }),
  component: Versions,
});

const SOURCE: Record<string, string> = { synthesis: "Síntese da IA", edit: "Sua edição", restore: "Restauração" };
const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")) || "—";

function Versions() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const q = useQuery({ queryKey: ["versions"], queryFn: async () => (await supabase.from("dna_versions").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [] });

  async function restore(summary: unknown) {
    const { error } = await supabase.from("visual_dna").upsert({ user_id: user.id, summary: summary as never, updated_at: new Date().toISOString() });
    if (error) { toast.error("Não foi possível restaurar."); return; }
    await supabase.from("dna_versions").insert({ user_id: user.id, summary: summary as never, source: "restore" });
    await logEvent("version_created", { source: "restore" });
    toast.success("Versão restaurada");
    qc.invalidateQueries();
  }

  if (q.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  const list = q.data ?? [];
  if (!list.length) return <p className="text-muted-foreground">Nenhuma versão ainda. Gere seu DNA Visual no Resumo.</p>;
  const cmp = list.filter((v) => sel.includes(v.id));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Marque duas versões para comparar.</p>
      <ul className="space-y-2">
        {list.map((v) => {
          const s = v.summary as unknown as DnaSummary;
          return (
            <li key={v.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Checkbox checked={sel.includes(v.id)} onCheckedChange={() => setSel(sel.includes(v.id) ? sel.filter((x) => x !== v.id) : [...sel.slice(-1), v.id])} />
                <div className="flex-1"><div className="font-medium">{s?.headline ?? "Versão"}</div><div className="text-xs text-muted-foreground">{fmtDateTime(v.created_at)} · {SOURCE[v.source] ?? v.source}</div></div>
                <Button size="sm" variant="ghost" onClick={() => setOpen(open === v.id ? null : v.id)}>{open === v.id ? "Fechar" : "Ver"}</Button>
                <Button size="sm" variant="outline" onClick={() => restore(v.summary)}>Restaurar</Button>
              </div>
              {open === v.id && (
                <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  {DNA_FIELDS.map((f) => <div key={f.key}><dt className="text-muted-foreground">{f.label}</dt><dd>{show(s?.[f.key])}</dd></div>)}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
      {cmp.length === 2 && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-3xl">Comparação</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-4">Campo</th>{cmp.map((v) => <th key={v.id} className="py-1 pr-4">{fmtDateTime(v.created_at)}</th>)}</tr></thead>
            <tbody>
              {DNA_FIELDS.map((f) => {
                const a = show((cmp[0]!.summary as unknown as DnaSummary)?.[f.key]);
                const b = show((cmp[1]!.summary as unknown as DnaSummary)?.[f.key]);
                return <tr key={f.key} className={a !== b ? "bg-accent/10" : ""}><td className="py-1 pr-4 align-top text-muted-foreground">{f.label}</td><td className="py-1 pr-4 align-top">{a}</td><td className="py-1 align-top">{b}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
