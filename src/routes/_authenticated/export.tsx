import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { downloadText, logEvent, packageToMarkdown as basicMd, type PackageRow } from "@/lib/aura";
import { lookToMarkdown } from "@/lib/manual";
import type { MakeupLook } from "@/lib/makeup";

const packageToMarkdown = (p: PackageRow) => (p.kind === "makeup_look" ? lookToMarkdown(p.content as unknown as MakeupLook, p.note) : basicMd(p));

export const Route = createFileRoute("/_authenticated/export")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Exportar — Aura ID" }, { name: "description", content: "Baixe seus planos." }, { property: "og:title", content: "Exportar — Aura ID" }, { property: "og:description", content: "Baixe seus planos." }] }),
  component: Exp,
});

function Exp() {
  const q = useQuery({ queryKey: ["packages"], queryFn: async () => ((await supabase.from("packages").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as PackageRow[] });
  const saved = (q.data ?? []).filter((p) => p.status === "saved" || p.status === "approved");
  const kept = saved.filter(p => p.kind !== "tattoo_plan");
  const tattoos = saved.filter(p => p.kind === "tattoo_plan");
  function all() {
    downloadText("aura-id-plano.md", kept.map(packageToMarkdown).join("\n\n---\n\n"));
    logEvent("plan_exported", { count: kept.length });
  }
  return (
    <div className="space-y-6">
      <h1 className="text-5xl">Central de exportação</h1>
      <p className="text-muted-foreground">Baixe sugestões salvas e aprovadas como um documento simples para imprimir ou compartilhar você mesma(o).</p>
      <div className="flex gap-2"><Button disabled={!kept.length} onClick={all}>Baixar todas ({kept.length})</Button><Button variant="outline" onClick={() => window.print()}>Imprimir esta página</Button></div>
      <ul className="space-y-2">
        {kept.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <span>{p.content.title}</span>
            <Button size="sm" variant="ghost" onClick={() => { downloadText(`${p.content.title}.md`, packageToMarkdown(p)); logEvent("plan_exported", { package_id: p.id }); }}>Baixar</Button>
          </li>
        ))}
      </ul>
      {tattoos.length > 0 && <section className="space-y-3"><h2 className="text-3xl">Briefings de tatuagem</h2><p className="text-sm text-muted-foreground">Revise e confirme cada briefing antes de exportar. Fotos e notas privadas não são incluídas.</p>{tattoos.map(p => <p key={p.id}><Link to="/tatuagem/briefing" search={{ versao: p.id }} className="underline">{p.content.title} — revisar briefing</Link></p>)}</section>}
      {!kept.length && <p className="text-sm text-muted-foreground">Salve ou aprove uma sugestão primeiro.</p>}
      <p className="text-xs text-muted-foreground">A exportação para Google Docs / Drive ainda não está conectada — pode ser adicionada depois, com acesso só aos arquivos criados pelo app.</p>
    </div>
  );
}
