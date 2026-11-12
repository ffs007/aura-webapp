import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CabecalhoPagina } from "@/components/estados";
import { PILHA_PAGINA } from "@/lib/design";
import { HAIR_DISCLAIMER } from "@/lib/hair";

export const Route = createFileRoute("/_authenticated/cabelo")({
  component: Layout,
});

const TABS = [["/cabelo", "Planos"], ["/cabelo/gerar", "Novo plano"], ["/cabelo/perfil", "Perfil capilar"], ["/cabelo/alertas", "Alertas"]] as const;

function Layout() {
  // Telas de detalhe já têm o próprio h1; o layout não duplica o título.
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const ehDetalhe = caminho.startsWith("/cabelo/plano/");
  return (
    <div className={PILHA_PAGINA}>
      {!ehDetalhe && (
        <CabecalhoPagina
          titulo="Cabelo"
          descricao="Cortes, cores, texturas e transições no seu ritmo — sempre com um caminho gradual antes do radical."
        />
      )}
      <nav className="flex flex-wrap gap-1 border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{HAIR_DISCLAIMER} Simulação realista de cabelo, imagens fotorrealistas de cortes e cores, previsão exata de crescimento e correção por vídeo ao vivo estão no roteiro do produto e ainda não fazem parte desta versão.</p>
    </div>
  );
}
