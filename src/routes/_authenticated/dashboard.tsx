import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { souAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiLabel, Indicators } from "@/components/PackageView";
import { ENTRY_MODES, STATUS_LABEL, type PackageRow } from "@/lib/aura";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: z.object({ batch: z.string().optional() }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Suas sugestões — Aura ID" }, { name: "description", content: "Pacotes visuais integrados criados para você." }, { property: "og:title", content: "Suas sugestões — Aura ID" }, { property: "og:description", content: "Pacotes visuais integrados criados para você." }] }),
  component: Dashboard,
});

const FILTERS = [["all", "todas"], ["new", "novas"], ["saved", "salvas"], ["approved", "aprovadas"], ["rejected", "rejeitadas"]] as const;

function Dashboard() {
  const { batch } = Route.useSearch();
  const [filter, setFilter] = useState<string>("all");
  const souAdminFn = useServerFn(souAdmin);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { souAdminFn().then((r) => setIsAdmin(r.admin)).catch(() => {}); }, []);
  const q = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PackageRow[];
    },
  });

  if (q.isLoading) return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;
  if (q.error) return <p className="text-destructive">Não conseguimos carregar suas sugestões. Recarregue a página.</p>;

  const guia = (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <div>
        <p className="text-sm font-medium">Primeira vez? Comece pelo guia — e crie seu 👤 Meu Modelo</p>
        <p className="mt-1 text-xs text-muted-foreground">5 passos com exemplos. Com o modelo pronto, toda simulação sai com a sua cara.</p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/guia">Abrir o guia</Link></Button>
        <Button asChild size="sm"><Link to="/modelo">👤 Meu Modelo</Link></Button>
      </div>
    </div>
  );

  const all = q.data ?? [];
  if (!all.length) return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-4xl">Nada por aqui ainda</h1>
      <p className="mt-2 text-muted-foreground">Comece uma sessão no Estúdio e seus primeiros convites aparecerão aqui.</p>
      <Button asChild className="mt-6"><Link to="/studio">Abrir o Estúdio</Link></Button>
    </div>
  );

  const list = all.filter((p) => (batch ? p.batch_id === batch : true)).filter((p) => filter === "all" || p.status === filter);
  return (
    <div>
      {guia}
      {isAdmin && (
        <div className="mb-4">
          <Button asChild size="sm" variant="outline"><Link to="/admin">🛠️ Painel admin — catálogo parceiro</Link></Button>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">{batch ? "Convites fresquinhos" : "Suas sugestões"}</h1>
          <p className="mt-2 text-muted-foreground">Cada uma é uma hipótese para brincar — fique com o que fizer sentido.</p>
        </div>
        {batch && <Button asChild variant="outline"><Link to="/dashboard" search={{}}>Ver todas</Link></Button>}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(([f, l]) => <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3 py-1 text-sm capitalize", filter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{l}</button>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((p) => (
          <Link key={p.id} to={p.kind === "tattoo_plan" ? "/tatuagem/plano/$id" : p.kind === "makeup_look" ? "/maquiagem/look/$id" : p.kind === "hair_plan" ? "/cabelo/plano/$id" : p.kind === "outfit" ? "/roupas/look/$id" : "/package/$id"} params={{ id: p.id }} className="block rounded-2xl border bg-card p-6 transition hover:shadow-soft animate-rise">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{p.kind === "makeup_look" ? "Maquiagem · look" : ENTRY_MODES.find((m) => m.id === p.entry_mode)?.label ?? p.entry_mode}</span>
              <div className="flex items-center gap-2">{p.status !== "new" && <span className="text-xs capitalize text-accent">{STATUS_LABEL[p.status]}</span>}<AiLabel /></div>
            </div>
            <h2 className="mt-2 text-3xl">{p.content.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content.invitation}</p>
            <div className="mt-4"><Indicators c={p.content} /></div>
            {p.beautiful_not_practical && <p className="mt-3 text-xs italic text-muted-foreground">Bonito, mas não prático</p>}
          </Link>
        ))}
        {!list.length && <p className="text-muted-foreground">Nenhuma sugestão neste filtro.</p>}
      </div>
    </div>
  );
}
