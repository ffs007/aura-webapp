import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiLabel } from "@/components/PackageView";
import { STATUS_LABEL, fmtDateTime } from "@/lib/aura";
import { HAIR_GOALS, ALERT_KINDS, type HairPlan } from "@/lib/hair";

const META = "Seus planos de cabelo, alertas e próximos passos.";
export const Route = createFileRoute("/_authenticated/cabelo/")({
  head: () => ({ meta: [{ title: "Meus planos de cabelo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Meus planos de cabelo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Plans,
});

function Plans() {
  const q = useQuery({ queryKey: ["hair-plans"], queryFn: async () => {
    const { data, error } = await supabase.from("packages").select("*").eq("kind", "hair_plan").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  const alerts = useQuery({ queryKey: ["hair-alerts"], queryFn: async () => (await supabase.from("hair_alerts").select("*").eq("active", true).order("next_at")).data ?? [] });
  if (q.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (q.error) return <p className="text-destructive">Não foi possível carregar seus planos.</p>;
  const list = q.data ?? [];
  const due = (alerts.data ?? []).filter((a) => new Date(a.next_at) <= new Date());
  return (
    <div className="space-y-6">
      {due.length > 0 && (
        <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4 text-sm">
          Lembretes para agora: {due.map((a) => ALERT_KINDS.find((k) => k.id === a.kind)?.label).join(", ")}. <Link to="/cabelo/alertas" className="underline">Ver alertas</Link>
        </div>
      )}
      {!list.length ? (
        <div className="py-16 text-center">
          <h2 className="text-4xl">Nenhum plano ainda</h2>
          <p className="mt-2 text-muted-foreground">Comece pelo perfil capilar — leva dois minutos — e depois escolha um objetivo.</p>
          <div className="mt-6 flex justify-center gap-2"><Button asChild variant="outline"><Link to="/cabelo/perfil">Perfil capilar</Link></Button><Button asChild><Link to="/cabelo/gerar">Criar plano</Link></Button></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const c = p.content as unknown as HairPlan;
            const goal = HAIR_GOALS.find((g) => g.id === (p.context as { goal?: string })?.goal)?.label;
            return (
              <Link key={p.id} to="/cabelo/plano/$id" params={{ id: p.id }} className="block rounded-2xl border bg-card p-6 transition hover:shadow-soft">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{goal} · {fmtDateTime(p.created_at)}</span><div className="flex gap-2">{p.status !== "new" && <span className="text-accent">{STATUS_LABEL[p.status]}</span>}<AiLabel /></div></div>
                <h3 className="mt-2 text-3xl">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.invitation}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
