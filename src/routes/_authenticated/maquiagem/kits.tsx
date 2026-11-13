import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EsqueletoLista, EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO_COMPACTO, GRADE_CARTOES, TITULO_ITEM } from "@/lib/design";
import type { Kit } from "@/lib/makeup";
import { generateKit } from "@/lib/makeup.functions";

export const Route = createFileRoute("/_authenticated/maquiagem/kits")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Kits de confiança — Aura ID" }, { name: "description", content: "Pequenos kits que dão segurança no dia a dia." }, { property: "og:title", content: "Kits de confiança — Aura ID" }, { property: "og:description", content: "Pequenos kits que dão segurança no dia a dia." }] }),
  component: Kits,
});

const PRESETS = ["Kit bolsa", "Kit 5 minutos", "Kit reunião", "Kit viagem", "Kit calor", "Kit noite"];

function Kits() {
  const qc = useQueryClient();
  const gen = useServerFn(generateKit);
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["kits"], queryFn: async () => (await supabase.from("confidence_kits").select("*").order("created_at", { ascending: false })).data ?? [] });

  async function run(p: string) {
    if (!p.trim()) return;
    setBusy(true);
    const r = await gen({ data: { purpose: p } }).catch(() => ({ error: "Não foi possível montar o kit. Tente de novo." }));
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    setPurpose(""); qc.invalidateQueries({ queryKey: ["kits"] });
  }
  async function del(id: string) { await supabase.from("confidence_kits").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["kits"] }); }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <Button key={p} size="sm" variant="secondary" disabled={busy} onClick={() => run(p)}>{p}</Button>)}</div>
      <div className="flex max-w-lg gap-2"><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="ou descreva: ex.: casamento ao ar livre" /><Button onClick={() => run(purpose)} disabled={busy}>{busy ? "Montando…" : "Criar kit"}</Button></div>
      {q.isLoading ? <EsqueletoLista itens={2} altura="h-40" /> : !q.data?.length ? (
        <EstadoVazio
          compacto
          icone={<ShoppingBag className="size-6" />}
          titulo="Nenhum kit ainda"
          descricao="Escolha um propósito acima para montar seu primeiro kit de confiança."
        />
      ) : (
        <div className={GRADE_CARTOES}>
          {q.data.map((row) => {
            const k = row.content as unknown as Kit;
            return (
              <div key={row.id} className={CARTAO_COMPACTO}>
                <div className="flex items-center justify-between"><AiLabel /><Button size="sm" variant="ghost" onClick={() => del(row.id)}>Excluir</Button></div>
                <h3 className={`mt-2 ${TITULO_ITEM}`}>{k.name}</h3>
                <p className="text-sm text-muted-foreground">{k.purpose}</p>
                <ul className="mt-3 space-y-1 text-sm">{k.items.map((i, n) => <li key={n}>☐ <strong>{i.item}</strong> <span className="text-muted-foreground">({i.price_brl}) — {i.why}</span></li>)}</ul>
                <ol className="mt-3 list-decimal pl-5 text-sm">{k.order.map((x, n) => <li key={n}>{x}</li>)}</ol>
                <p className="mt-3 text-sm">Total estimado: <strong>{k.total_brl}</strong></p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
