import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadText, LEVEL_LABEL, logEvent } from "@/lib/aura";
import { manualMarkdown } from "@/lib/manual";
import { DISCLAIMER, type Kit, type MakeupLook, type Signature } from "@/lib/makeup";

export const Route = createFileRoute("/_authenticated/maquiagem/manual")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Manual de maquiagem — Aura ID" }, { name: "description", content: "Seu manual pessoal: assinatura, kits e looks salvos." }, { property: "og:title", content: "Manual de maquiagem — Aura ID" }, { property: "og:description", content: "Seu manual pessoal: assinatura, kits e looks salvos." }] }),
  component: Manual,
});

function Manual() {
  const q = useQuery({
    queryKey: ["manual"],
    queryFn: async () => {
      const [{ data: sig }, { data: kits }, { data: looks }] = await Promise.all([
        supabase.from("makeup_signatures").select("summary").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("confidence_kits").select("content").order("created_at", { ascending: false }),
        supabase.from("packages").select("content, note").eq("kind", "makeup_look").in("status", ["saved", "approved"]),
      ]);
      return { sig: (sig?.summary ?? null) as Signature | null, kits: (kits ?? []).map((k) => k.content as unknown as Kit), looks: (looks ?? []).map((l) => ({ content: l.content as unknown as MakeupLook, note: l.note })) };
    },
  });
  if (q.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  const d = q.data!;
  const empty = !d.sig && !d.kits.length && !d.looks.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button disabled={empty} onClick={() => { downloadText("manual-de-maquiagem.md", manualMarkdown(d.sig, d.kits, d.looks)); logEvent("manual_exported", { format: "md" }); }}>Baixar manual</Button>
        <Button variant="outline" disabled={empty} onClick={() => { logEvent("manual_exported", { format: "print" }); window.print(); }}>Imprimir / salvar PDF</Button>
        <span className="self-center text-xs text-muted-foreground">Google Docs: ainda não conectado.</span>
      </div>
      {empty ? <p className="text-muted-foreground">Gere uma assinatura, crie kits ou salve looks para montar seu manual.</p> : (
        <article className="space-y-8 rounded-2xl border bg-card p-8">
          <header><h2 className="text-4xl">Meu manual de maquiagem</h2><p className="text-xs italic text-muted-foreground">{DISCLAIMER}</p></header>
          {d.sig && <section><h3 className="text-3xl">{d.sig.name}</h3><p>{d.sig.essence}</p><ol className="mt-2 list-decimal pl-5 text-sm">{d.sig.signature_steps.map((x, i) => <li key={i}>{x}</li>)}</ol></section>}
          {d.kits.length > 0 && <section><h3 className="text-3xl">Kits de confiança</h3>{d.kits.map((k, i) => <div key={i} className="mt-3"><strong>{k.name}</strong> — {k.items.map((x) => x.item).join(", ")} ({k.total_brl})</div>)}</section>}
          {d.looks.length > 0 && <section><h3 className="text-3xl">Looks salvos</h3>{d.looks.map((l, i) => (
            <div key={i} className="mt-4 break-inside-avoid"><h4 className="font-display text-2xl">{l.content.title}</h4><p className="text-sm text-muted-foreground">{l.content.invitation}</p>
              {l.content.variations.map((v) => <div key={v.level} className="mt-2 text-sm"><span className="text-accent">{LEVEL_LABEL[v.level]}:</span> {v.steps.join(" → ")}</div>)}</div>
          ))}</section>}
        </article>
      )}
    </div>
  );
}
