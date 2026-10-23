import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { logEvent, fmtDateTime } from "@/lib/aura";
import { ALERT_KINDS } from "@/lib/hair";

const META = "Lembretes opcionais de hidratação, corte, tratamento e manutenção de cor.";
export const Route = createFileRoute("/_authenticated/cabelo/alertas")({
  head: () => ({ meta: [{ title: "Alertas de cabelo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Alertas de cabelo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Alerts,
});

function Alerts() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hair-alerts-all"], queryFn: async () => (await supabase.from("hair_alerts").select("*")).data ?? [] });
  const refresh = () => qc.invalidateQueries();

  async function enable(kind: string, days: number) {
    const next = new Date(Date.now() + days * 864e5).toISOString();
    const { error } = await supabase.from("hair_alerts").insert({ user_id: user.id, kind, every_days: days, next_at: next });
    if (error) { toast.error("Não foi possível ativar."); return; }
    await logEvent("reminder_enabled", { module: "hair", kind }); toast.success("Alerta ativado"); refresh();
  }
  async function done(id: string, days: number) {
    await supabase.from("hair_alerts").update({ next_at: new Date(Date.now() + days * 864e5).toISOString() }).eq("id", id); refresh();
  }
  async function remove(id: string) { await supabase.from("hair_alerts").delete().eq("id", id); toast.success("Alerta removido"); refresh(); }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">Os alertas aparecem aqui e na página de planos quando chegar a hora. Lembretes por e-mail ou mensagem ainda não estão conectados.</p>
      {ALERT_KINDS.map((k) => {
        const a = (q.data ?? []).find((x) => x.kind === k.id);
        const due = a && new Date(a.next_at) <= new Date();
        return (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
            <div><div className="font-medium">{k.label}</div><div className="text-xs text-muted-foreground">{a ? `${due ? "Para agora" : "Próximo"}: ${fmtDateTime(a.next_at)} · a cada ${a.every_days} dias` : `Sugestão: a cada ${k.days} dias`}</div></div>
            {a ? <div className="flex gap-2"><Button size="sm" variant={due ? "accent" : "outline"} onClick={() => done(a.id, a.every_days)}>Feito</Button><Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Desativar</Button></div>
              : <Button size="sm" onClick={() => enable(k.id, k.days)}>Ativar</Button>}
          </div>
        );
      })}
    </div>
  );
}
