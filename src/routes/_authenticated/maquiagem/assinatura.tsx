import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EsqueletoDetalhe, EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO, TITULO_ITEM, TITULO_SECAO } from "@/lib/design";
import { fmtDateTime, logEvent } from "@/lib/aura";
import type { Signature } from "@/lib/makeup";
import { generateSignature } from "@/lib/makeup.functions";

export const Route = createFileRoute("/_authenticated/maquiagem/assinatura")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Assinatura de maquiagem — Aura ID" }, { name: "description", content: "O seu jeito de se maquiar, neste momento." }, { property: "og:title", content: "Assinatura de maquiagem — Aura ID" }, { property: "og:description", content: "O seu jeito de se maquiar, neste momento." }] }),
  component: Sig,
});

function Sig() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const gen = useServerFn(generateSignature);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["signatures"], queryFn: async () => (await supabase.from("makeup_signatures").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [] });

  async function run() {
    setBusy(true);
    const r = await gen().catch(() => ({ error: "Não foi possível gerar a assinatura. Tente de novo." }));
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    qc.invalidateQueries({ queryKey: ["signatures"] });
  }
  async function saveEdit(s: Signature) {
    try {
      const next = { ...s, ...JSON.parse(edit ?? "{}") };
      await supabase.from("makeup_signatures").insert({ user_id: user.id, summary: next });
      await logEvent("inference_corrected", { field: "makeup_signature" });
      setEdit(null); qc.invalidateQueries({ queryKey: ["signatures"] });
    } catch { toast.error("Não foi possível ler o formato. Revise o texto e tente de novo."); }
  }

  if (q.isLoading) return <EsqueletoDetalhe />;
  const [cur, ...older] = q.data ?? [];
  const s = cur?.summary as unknown as Signature | undefined;

  return (
    <div className="space-y-6">
      <Button variant="accent" onClick={run} disabled={busy}>{busy ? "Criando…" : s ? "Atualizar assinatura" : "Gerar minha assinatura"}</Button>
      {!s ? (
        <EstadoVazio
          compacto
          icone={<Sparkles className="size-6" />}
          titulo="Nenhuma assinatura ainda"
          descricao="Sua assinatura nasce dos looks que você salva, aprova e avalia. Quanto mais reações, mais fiel ela fica."
        />
      ) : (
        <div className={`${CARTAO} shadow-soft`}>
          <AiLabel />
          <h2 className={`mt-3 ${TITULO_SECAO}`}>{s.name}</h2>
          <p className="mt-2 text-lg">{s.essence}</p>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div><div className="text-muted-foreground">Acabamento</div>{s.finish}</div>
            <div><div className="text-muted-foreground">Cores</div>{s.colors.join(", ")}</div>
            <div><div className="text-muted-foreground">Passos-assinatura</div><ol className="list-decimal pl-5">{s.signature_steps.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
            <div><div className="text-muted-foreground">Sempre</div><ul className="list-disc pl-5">{s.always.map((x, i) => <li key={i}>{x}</li>)}</ul><div className="mt-2 text-muted-foreground">Evito</div><ul className="list-disc pl-5">{s.never.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{s.notes}</p>
          <p className="mt-3 text-xs italic text-muted-foreground">Uma fotografia do agora — pode mudar quando você quiser.</p>
          {edit === null ? (
            <Button className="mt-4" size="sm" variant="ghost" onClick={() => setEdit(JSON.stringify({ name: s.name, essence: s.essence, finish: s.finish }, null, 2))}>Editar</Button>
          ) : (
            <div className="mt-4 space-y-2"><Textarea rows={5} value={edit} onChange={(e) => setEdit(e.target.value)} className="font-mono text-xs" /><div className="flex gap-2"><Button size="sm" onClick={() => saveEdit(s)}>Salvar</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button></div></div>
          )}
        </div>
      )}
      {older.length > 0 && (
        <div><h3 className={TITULO_ITEM}>Histórico</h3><ul className="mt-2 space-y-1 text-sm">{older.map((o) => <li key={o.id} className="text-muted-foreground">{fmtDateTime(o.created_at)} — {(o.summary as unknown as Signature)?.name}</li>)}</ul></div>
      )}
    </div>
  );
}
