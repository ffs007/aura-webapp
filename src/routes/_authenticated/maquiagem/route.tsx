import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CabecalhoPagina } from "@/components/estados";
import { PILHA_PAGINA } from "@/lib/design";
import { DISCLAIMER } from "@/lib/makeup";

export const Route = createFileRoute("/_authenticated/maquiagem")({
  component: Layout,
});

const TABS = [
  ["/maquiagem", "Looks"], ["/maquiagem/gerar", "Gerar"], ["/maquiagem/perfil", "Perfil de pele"],
  ["/maquiagem/assinatura", "Assinatura"], ["/maquiagem/kits", "Kits"], ["/maquiagem/manual", "Manual"],
] as const;

function Layout() {
  // Telas de detalhe já têm o próprio h1; o layout não duplica o título.
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const ehDetalhe = caminho.startsWith("/maquiagem/look/");
  return (
    <div className={PILHA_PAGINA}>
      {!ehDetalhe && (
        <CabecalhoPagina
          titulo="Maquiagem"
          descricao={<>Looks práticos para o seu tempo, sua pele e seu momento — para realçar, nunca para "corrigir".</>}
        />
      )}
      <nav className="flex flex-wrap gap-1 border-b pb-2 print:hidden">
        {TABS.map(([to, label]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>{label}</Link>
        ))}
      </nav>
      <Outlet />
      <p className="border-t pt-4 text-xs text-muted-foreground">{DISCLAIMER} Realidade aumentada, correção por vídeo ao vivo, simulação facial de alta fidelidade e orientação na tela em tempo real estão no nosso roteiro e ainda não fazem parte desta versão.</p>
    </div>
  );
}
