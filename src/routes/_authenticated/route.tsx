import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppMenu } from "@/components/AppMenu";
import { BuscaGlobal } from "@/components/BuscaGlobal";
import { Notificacoes } from "@/components/Notificacoes";
import { TrilhaPicker } from "@/components/TrilhaPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModoVisual } from "@/hooks/useModoVisual";
import { FOCO } from "@/lib/design";
import { dispensarTrilhas, lerTrilhas, linksVisiveis, trilhasDispensadas, type TrilhaKey } from "@/lib/trilhas";

function erroDeConexao(): never {
  throw new Error("NETWORK");
}

/** Nav enxuta do modo simples: o resto fica em "Mais opções". */
const LINKS_SIMPLES: [string, string][] = [
  ["/studio", "Estúdio"],
  ["/dashboard", "Sugestões"],
  ["/profissionais", "Profissionais"],
];

const MAIS_OPCOES: [string, string][] = [
  ["/dna", "DNA Visual"],
  ["/compare", "Comparar"],
  ["/export", "Exportar"],
  ["/estetica", "✨ Estética"],
  ["/modelo", "👤 Modelo"],
  ["/retrato", "📸 Retrato"],
  ["/aura-pass", "✦ Pass"],
];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    let user = data.user;
    if (!user) {
      // Falha de rede não pode virar "logout": se existe sessão local, seguimos
      // com ela (as consultas vão falhar e a UI avisa). Só mandamos para o login
      // quando realmente não há sessão.
      const { data: sessao } = await supabase.auth.getSession();
      user = sessao.session?.user ?? null;
      if (!user) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        throw redirect({
          to: "/auth",
          // location.href já traz pathname + query string; location.search aqui é
          // um objeto (search parseado), não uma string.
          search: { motivo: offline ? "conexao" : "sessao", redirect: location.href },
        });
      }
    }
    if (location.pathname !== "/consent") {
      const { data: c, error: cErro } = await supabase.from("consents").select("user_id").eq("user_id", user.id).maybeSingle();
      if (cErro) erroDeConexao();
      if (!c) throw redirect({ to: "/consent" });
      if (location.pathname !== "/onboarding") {
        const { data: p, error: pErro } = await supabase.from("visual_profiles").select("completed").eq("user_id", user.id).maybeSingle();
        if (pErro) erroDeConexao();
        if (!p?.completed) throw redirect({ to: "/onboarding" });
      }
    }
    return { user };
  },
  component: Shell,
});

function Shell() {
  const nav = useNavigate();
  const [modo] = useModoVisual();
  const simples = modo === "simples";
  const [trilhas, setTrilhas] = useState<TrilhaKey[]>([]);
  const [pickerAberto, setPickerAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const carregar = () => {
      const salvas = lerTrilhas();
      setTrilhas(salvas);
      // Primeira visita: abre uma vez. "Agora não" é lembrado para o modal não
      // voltar a cada navegação (era um loop que travava o uso).
      if (!salvas.length && !trilhasDispensadas()) setPickerAberto(true);
    };
    carregar();
    window.addEventListener("aura:trilhas", carregar);
    return () => window.removeEventListener("aura:trilhas", carregar);
  }, []);

  const links = simples ? LINKS_SIMPLES : linksVisiveis(trilhas);

  async function sair() {
    if (saindo) return;
    setSaindo(true);
    try {
      await supabase.auth.signOut();
      nav({ to: "/" });
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-3 md:px-6">
          <Link to="/studio" className={`font-display text-xl whitespace-nowrap ${FOCO}`}>Aura <em>ID</em></Link>
          <nav aria-label="Navegação principal" className="hidden flex-1 gap-1 md:flex">
            {links.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-foreground ${FOCO}`}
                activeProps={{ className: "bg-secondary text-foreground", "aria-current": "page" }}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {/* Busca e notificações aparecem no desktop e no mobile. */}
            <BuscaGlobal />
            <Notificacoes />
            <div className="hidden items-center gap-2 md:flex">
              {simples ? (
                <>
                  <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/modelo">👤 Meu Modelo</Link></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="whitespace-nowrap">Mais opções</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {MAIS_OPCOES.map(([to, label]) => (
                        <DropdownMenuItem key={to} asChild>
                          <Link to={to}>{label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/estetica">✨ Estética</Link></Button>
                  <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/modelo">👤 Modelo</Link></Button>
                  <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/retrato">📸 Retrato</Link></Button>
                  <Button size="sm" asChild variant="outline" className="whitespace-nowrap border-accent/50 text-accent"><Link to="/aura-pass">✦ Pass</Link></Button>
                </>
              )}
              <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setPickerAberto(true)}>
                Trilhas{trilhas.length ? ` · ${trilhas.length}` : ""}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void sair()} disabled={saindo}>{saindo ? "Saindo…" : "Sair"}</Button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setPickerAberto(true)}>
                Trilhas{trilhas.length ? ` · ${trilhas.length}` : ""}
              </Button>
              <AppMenu
                trilhas={trilhas}
                modo={modo}
                saindo={saindo}
                onSair={() => void sair()}
                onAbrirTrilhas={() => setPickerAberto(true)}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10"><Outlet /></main>
      <TrilhaPicker
        aberto={pickerAberto}
        onFechar={() => setPickerAberto(false)}
        onDispensar={dispensarTrilhas}
        iniciais={trilhas}
      />
    </div>
  );
}
