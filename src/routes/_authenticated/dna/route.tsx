import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Aviso, CabecalhoPagina } from "@/components/estados";

export const Route = createFileRoute("/_authenticated/dna")({
  component: DnaLayout,
});

const TABS = [
  ["/dna", "Resumo"],
  ["/dna/preferencias", "Preferências"],
  ["/dna/linha-do-tempo", "Linha do tempo"],
  ["/dna/permissoes", "Permissões"],
  ["/dna/versoes", "Versões"],
  ["/dna/redefinir", "Redefinir"],
] as const;

function DnaLayout() {
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["dna-review"],
    queryFn: async () => (await supabase.from("visual_dna").select("signals_since_review").eq("user_id", user.id).maybeSingle()).data?.signals_since_review ?? 0,
  });
  return (
    <div className="space-y-8">
      <CabecalhoPagina
        titulo="DNA Visual"
        descricao={<>Um retrato vivo e editável do que parece você <em>neste momento</em>. Não é diagnóstico nem verdade objetiva — sua identidade é fluida.</>}
      />
      {(q.data ?? 0) >= 10 && (
        <Aviso tom="info">
          Muita coisa mudou desde a última revisão ({q.data} novos sinais ou edições). Que tal <Link to="/dna" className="underline">atualizar seu resumo</Link>?
        </Aviso>
      )}
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
