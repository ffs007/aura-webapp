import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CabecalhoPagina } from "@/components/estados";
import { PILHA_PAGINA } from "@/lib/design";
import { CLOTHING_NOTE } from "@/lib/clothing";

export const Route = createFileRoute("/_authenticated/roupas")({
  component: Layout,
});

const TABS = [
  ["/roupas", "Looks"], ["/roupas/gerar", "Gerar"], ["/roupas/armario", "Guarda-roupa"], ["/roupas/perfil", "Perfil de estilo"],
  ["/roupas/lacunas", "Peças-chave e cápsula"], ["/roupas/compra", "Compra consciente"], ["/roupas/missoes", "Missões"],
] as const;

function Layout() {
  // Telas de detalhe já têm o próprio h1; o layout não duplica o título.
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const ehDetalhe = caminho.startsWith("/roupas/look/");
  return (
    <div className={PILHA_PAGINA}>
      {!ehDetalhe && (
        <CabecalhoPagina
          titulo="Roupas"
          descricao="Use melhor o que você já tem, monte looks para a vida real e compre só o que faz sentido."
        />
      )}
      <nav className="flex gap-1 overflow-x-auto border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{CLOTHING_NOTE} O provador virtual fotorrealista está no nosso roteiro e ainda não faz parte desta versão.</p>
    </div>
  );
}
