import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { HAIR_DISCLAIMER } from "@/lib/hair";

export const Route = createFileRoute("/_authenticated/cabelo")({
  component: Layout,
});

const TABS = [["/cabelo", "Planos"], ["/cabelo/gerar", "Novo plano"], ["/cabelo/perfil", "Perfil capilar"], ["/cabelo/alertas", "Alertas"]] as const;

function Layout() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl">Cabelo</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Cortes, cores, texturas e transições no seu ritmo — sempre com um caminho gradual antes do radical.</p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{HAIR_DISCLAIMER} Simulação realista de cabelo, imagens fotorrealistas de cortes e cores, previsão exata de crescimento e correção por vídeo ao vivo: [FORA DO ESCOPO DOS CONECTORES LOVABLE].</p>
    </div>
  );
}
