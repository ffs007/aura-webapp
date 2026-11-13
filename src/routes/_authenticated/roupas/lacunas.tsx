import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EsqueletoLista, EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO, CARTAO_COMPACTO, META, TITULO_ITEM, TITULO_SECAO } from "@/lib/design";
import { analyzeWardrobe } from "@/lib/clothing.functions";
import { fmtDateTime, LEVEL3 } from "@/lib/aura";
import type { WardrobeGaps } from "@/lib/clothing";

const META_PAGINA = "Peças-chave que faltam, quantas combinações cada uma desbloqueia e seu guarda-roupa cápsula.";
export const Route = createFileRoute("/_authenticated/roupas/lacunas")({
  head: () => ({ meta: [{ title: "Peças-chave e cápsula — Aura ID" }, { name: "description", content: META_PAGINA }, { property: "og:title", content: "Peças-chave e cápsula — Aura ID" }, { property: "og:description", content: META_PAGINA }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Gaps,
});

function Gaps() {
  const qc = useQueryClient();
  const run = useServerFn(analyzeWardrobe);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["gaps"], queryFn: async () => (await supabase.from("style_analyses").select("*").eq("kind", "gaps").order("created_at", { ascending: false }).limit(1).maybeSingle()).data });
  async function go() {
    setBusy(true);
    try { const r = await run(); if (r.error) toast.error(r.error); else qc.invalidateQueries({ queryKey: ["gaps"] }); }
    catch { toast.error("Não foi possível analisar o guarda-roupa. Tente de novo."); } finally { setBusy(false); }
  }
  const g = q.data?.content as unknown as WardrobeGaps | undefined;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3"><Button variant="accent" onClick={go} disabled={busy}>{busy ? "Analisando…" : g ? "Analisar de novo" : "Analisar meu guarda-roupa"}</Button>{q.data && <span className={META}>Última análise: {fmtDateTime(q.data.created_at)}</span>}</div>
      {q.isLoading ? <EsqueletoLista itens={2} altura="h-40" /> : !g ? (
        <EstadoVazio
          compacto
          icone={<ShoppingBag className="size-6" />}
          titulo="Ainda sem análise"
          descricao="Cadastre algumas peças e peça uma análise. Primeiro vem o que você já tem; compras só se fizerem sentido."
          acoes={<Button asChild variant="outline" size="sm"><Link to="/roupas/armario">Cadastrar peças</Link></Button>}
        />
      ) : (
        <>
          <AiLabel /><p className="max-w-2xl">{g.summary}</p>
          <section><h2 className={TITULO_SECAO}>Peças-chave que faltam</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">{g.gaps.map((x) => (
              <div key={x.piece} className={CARTAO_COMPACTO}>
                <div className={`flex justify-between ${META}`}><span>prioridade {LEVEL3[x.priority]}</span><span>{x.price_brl}</span></div>
                <h3 className={`mt-1 ${TITULO_ITEM}`}>{x.piece}</h3>
                <p className="mt-1 text-sm">{x.why}</p>
                <p className="mt-2 text-sm font-medium text-accent">+{x.combinations_unlocked} combinações com o que você já tem</p>
              </div>
            ))}</div>
          </section>
          <section className={CARTAO}><h2 className={TITULO_SECAO}>Cápsula: {g.capsule.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{g.capsule.outfits_possible} {g.capsule.outfits_possible === 1 ? "look possível" : "looks possíveis"} · {g.capsule.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">{g.capsule.pieces.map((p) => <span key={p} className="rounded-full bg-secondary px-3 py-1 text-sm">{p}</span>)}</div>
          </section>
        </>
      )}
    </div>
  );
}
