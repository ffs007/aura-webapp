import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoLista, Secao } from "@/components/estados";
import { downloadText, logEvent, packageToMarkdown, type PackageRow } from "@/lib/aura";

const titleOf = (p: PackageRow) => String((p.content as { title?: string } | null)?.title ?? "").trim() || "aura-id";

export const Route = createFileRoute("/_authenticated/export")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Exportar — Aura ID" }, { name: "description", content: "Baixe suas sugestões." }, { property: "og:title", content: "Exportar — Aura ID" }, { property: "og:description", content: "Baixe suas sugestões." }] }),
  component: Exp,
});

function Exp() {
  const q = useQuery({ queryKey: ["packages"], queryFn: async () => ((await supabase.from("packages").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as PackageRow[] });
  const saved = (q.data ?? []).filter((p) => p.status === "saved" || p.status === "approved");
  const kept = saved.filter(p => p.kind !== "tattoo_plan");
  const tattoos = saved.filter(p => p.kind === "tattoo_plan");
  function all() {
    const parts: string[] = [], skipped: string[] = [];
    for (const p of kept) {
      try { const md = packageToMarkdown(p); if (md.trim()) { parts.push(md); continue; } } catch { /* item isolado não derruba o lote */ }
      skipped.push(titleOf(p));
    }
    if (!parts.length) { toast.error("Não foi possível gerar os arquivos agora."); return; }
    downloadText("aura-id-sugestoes.md", parts.join("\n\n---\n\n"));
    logEvent("suggestion_exported", { count: parts.length });
    if (skipped.length) toast.warning(`${skipped.length} item(ns) ficaram de fora: ${skipped.join(", ")}.`);
  }
  function one(p: PackageRow) {
    try {
      downloadText(`${titleOf(p)}.md`, packageToMarkdown(p));
      logEvent("suggestion_exported", { package_id: p.id });
    } catch { toast.error("Não foi possível gerar este arquivo."); }
  }
  if (q.isLoading) return <div className="space-y-6"><CabecalhoPagina titulo="Central de exportação" descricao="Baixe sugestões salvas e aprovadas como um documento simples para imprimir ou compartilhar como quiser." /><EsqueletoLista itens={3} altura="h-14" /></div>;
  if (q.error) return <EstadoErro titulo="Não foi possível carregar suas sugestões" onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;
  if (!kept.length && !tattoos.length) return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Central de exportação" descricao="Baixe sugestões salvas e aprovadas como um documento simples para imprimir ou compartilhar como quiser." />
      <EstadoVazio
        icone={<Download aria-hidden className="size-5" />}
        titulo="Nada para exportar ainda"
        descricao="Salve ou aprove uma sugestão e ela aparece aqui, pronta para baixar."
        acoes={<Button asChild><Link to="/dashboard" search={{}}>Ver sugestões</Link></Button>}
      />
    </div>
  );
  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Central de exportação"
        descricao="Baixe sugestões salvas e aprovadas como um documento simples para imprimir ou compartilhar como quiser."
        acoes={
          <>
            <Button disabled={!kept.length} onClick={all}>Baixar todas ({kept.length})</Button>
            <Button variant="outline" onClick={() => window.print()}>Imprimir esta página</Button>
          </>
        }
      />
      <ul className="space-y-2">
        {kept.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
            <span>{titleOf(p)}</span>
            <Button size="sm" variant="ghost" onClick={() => one(p)}>Baixar</Button>
          </li>
        ))}
      </ul>
      {tattoos.length > 0 && (
        <Secao titulo="Briefings de tatuagem" descricao="Revise e confirme cada briefing antes de exportar. Fotos e notas privadas não são incluídas.">
          {tattoos.map(p => <p key={p.id}><Link to="/tatuagem/briefing" search={{ versao: p.id }} className="underline">{titleOf(p)} — revisar briefing</Link></p>)}
        </Secao>
      )}
      {!kept.length && <p className="text-sm text-muted-foreground">Salve ou aprove uma sugestão primeiro.</p>}
      <p className="text-xs text-muted-foreground">A exportação para Google Docs / Drive ainda não está conectada — pode ser adicionada depois, com acesso só aos arquivos criados pelo app.</p>
    </div>
  );
}
