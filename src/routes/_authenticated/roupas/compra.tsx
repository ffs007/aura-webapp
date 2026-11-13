import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO_COMPACTO, META, PILHA_PAGINA, TITULO_ITEM, TITULO_SECAO } from "@/lib/design";
import { checkPurchase } from "@/lib/clothing.functions";
import { fmtDateTime } from "@/lib/aura";
import { VERDICT_LABEL, type ShoppingCheck } from "@/lib/clothing";

const META_PAGINA = "Antes de comprar: veja combinações, peças parecidas e custo por uso.";
export const Route = createFileRoute("/_authenticated/roupas/compra")({
  head: () => ({ meta: [{ title: "Compra consciente — Aura ID" }, { name: "description", content: META_PAGINA }, { property: "og:title", content: "Compra consciente — Aura ID" }, { property: "og:description", content: META_PAGINA }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Shop,
});

function Shop() {
  const qc = useQueryClient();
  const run = useServerFn(checkPurchase);
  const [item, setItem] = useState(""); const [price, setPrice] = useState(""); const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["purchases"], queryFn: async () => (await supabase.from("style_analyses").select("*").eq("kind", "purchase").order("created_at", { ascending: false }).limit(20)).data ?? [] });
  async function go() {
    if (item.trim().length < 2) { toast.error("Descreva a peça para avaliar a compra."); return; }
    setBusy(true);
    try { const r = await run({ data: { item, price, reason } }); if (r.error) toast.error(r.error); else { setItem(""); setPrice(""); setReason(""); qc.invalidateQueries({ queryKey: ["purchases"] }); } }
    catch { toast.error("Não foi possível concluir o checklist. Tente de novo."); } finally { setBusy(false); }
  }
  return (
    <div className={PILHA_PAGINA}>
      <section className={`max-w-2xl space-y-3 ${CARTAO_COMPACTO}`}>
        <h2 className={TITULO_SECAO}>O que você está pensando em comprar?</h2>
        <div className="space-y-2"><Label htmlFor="compra-peca">Peça</Label><Input id="compra-peca" value={item} onChange={(e) => setItem(e.target.value)} placeholder="ex.: blazer bege de alfaiataria" /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="compra-preco">Preço (opcional)</Label><Input id="compra-preco" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 350" /></div>
          <div className="space-y-2"><Label htmlFor="compra-motivo">Por que quer? (opcional)</Label><Input id="compra-motivo" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex.: está em promoção" /></div>
        </div>
        <Button variant="accent" onClick={go} disabled={busy}>{busy ? "Analisando…" : "Fazer checklist"}</Button>
      </section>
      {(q.data ?? []).length === 0 ? (
        <EstadoVazio
          compacto
          icone={<ShoppingBag className="size-6" />}
          titulo="Nenhum checklist ainda"
          descricao="Descreva uma peça acima para avaliar a compra com calma — combinações, custo por uso e alternativas."
        />
      ) : (
        <div className="space-y-4">{(q.data ?? []).map((a) => {
          const c = a.content as unknown as ShoppingCheck; const inp = a.input as { item?: string; price?: string };
          return (
            <div key={a.id} className={CARTAO_COMPACTO}>
              <div className={`flex justify-between ${META}`}><span>{fmtDateTime(a.created_at)}</span><AiLabel /></div>
              <h3 className={`mt-1 ${TITULO_ITEM}`}>{inp.item} {inp.price && <span className="text-base text-muted-foreground">· {inp.price}</span>}</h3>
              <p className="mt-1 font-medium text-accent">{VERDICT_LABEL[c.verdict]}</p>
              <p className="mt-1 text-sm">{c.summary}</p>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div><strong>Combina com {c.combinations_with_wardrobe} {c.combinations_with_wardrobe === 1 ? "peça" : "peças"} suas.</strong> Custo por uso: {c.cost_per_use}</div>
                {c.similar_owned.length > 0 && <div><strong>Parecidas que você já tem:</strong> {c.similar_owned.join(", ")}</div>}
                <div><strong>Pergunte-se:</strong><ul className="list-disc pl-5">{c.questions.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><strong>Teste antes com o que tem:</strong><ul className="list-disc pl-5">{c.alternatives.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}
