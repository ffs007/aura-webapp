import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { CLOTHING_NOTE } from "@/lib/clothing";

export const Route = createFileRoute("/_authenticated/roupas")({
  component: Layout,
});

const TABS = [
  ["/roupas", "Looks"], ["/roupas/gerar", "Gerar"], ["/roupas/armario", "Guarda-roupa"], ["/roupas/perfil", "Perfil de estilo"],
  ["/roupas/lacunas", "Peças-chave e cápsula"], ["/roupas/compra", "Compra consciente"], ["/roupas/missoes", "Missões"],
] as const;

function Layout() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl">Roupas</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Use melhor o que você já tem, monte looks para a vida real e compre só o que faz sentido.</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{CLOTHING_NOTE} Provador virtual fotorrealista: [FORA DO ESCOPO DOS CONECTORES LOVABLE].</p>
    </div>
  );
}
