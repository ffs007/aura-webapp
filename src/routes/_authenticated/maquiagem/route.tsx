import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { DISCLAIMER } from "@/lib/makeup";

export const Route = createFileRoute("/_authenticated/maquiagem")({
  component: Layout,
});

const TABS = [
  ["/maquiagem", "Looks"], ["/maquiagem/gerar", "Gerar"], ["/maquiagem/perfil", "Perfil de pele"],
  ["/maquiagem/assinatura", "Assinatura"], ["/maquiagem/kits", "Kits"], ["/maquiagem/manual", "Manual"],
] as const;

function Layout() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl">Maquiagem</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Looks práticos para o seu tempo, sua pele e seu momento — para realçar, nunca para "corrigir".</p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{DISCLAIMER} Realidade aumentada, correção por vídeo ao vivo, simulação facial de alta fidelidade e orientação na tela em tempo real: [FORA DO ESCOPO DOS CONECTORES LOVABLE].</p>
    </div>
  );
}
