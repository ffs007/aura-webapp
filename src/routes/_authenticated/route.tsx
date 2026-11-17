import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppMenu } from "@/components/AppMenu";
import { BuscaGlobal } from "@/components/BuscaGlobal";
import { Notificacoes } from "@/components/Notificacoes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModoVisual } from "@/hooks/useModoVisual";
import { FOCO } from "@/lib/design";
import { destinoSeguro } from "@/lib/navegacao";
import { MarcaAura } from "@/components/MarcaAura";
import { TemaToggle } from "@/components/TemaToggle";
import {
  ATALHOS, FERRAMENTAS, modulosNaBarra, emBreve,
  DENSIDADES, lerDensidade, salvarDensidade, classeDensidade, type Densidade,
} from "@/lib/navegacao-primaria";

function erroDeConexao(): never {
  throw new Error("NETWORK");
}

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
      const destino = destinoSeguro(location.href);
      throw redirect({
        to: "/auth",
        // location.href já traz pathname + query string (interno do roteador).
        // destinoSeguro garante na EMISSÃO que só caminhos internos passam —
        // o consumo em /auth valida de novo (defesa em duas camadas).
        search: { motivo: offline ? "conexao" : "sessao", ...(destino ? { redirect: destino } : {}) },
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
  const [saindo, setSaindo] = useState(false);
  const [densidade, setDensidade] = useState<Densidade>(() => lerDensidade());
  const largura = classeDensidade(densidade);
  const modulos = modulosNaBarra();
  const emBreveLista = emBreve();

  useEffect(() => {
    const sincronizar = () => setDensidade(lerDensidade());
    window.addEventListener("aura:densidade", sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener("aura:densidade", sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  function trocarDensidade(d: Densidade) {
    salvarDensidade(d);
    setDensidade(d);
    window.dispatchEvent(new Event("aura:densidade"));
  }

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
        <div className={`mx-auto flex w-full ${largura} items-center gap-3 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8`}>
          <Link to="/studio" className={`flex items-center gap-2 whitespace-nowrap ${FOCO}`}>
            <MarcaAura className="size-7 text-primary" titulo="Aura ID — início" />
            <span className="font-display text-xl leading-none">Aura <em>ID</em></span>
          </Link>

          {/* Navegação primária: sempre os mesmos módulos, na mesma ordem. */}
          <nav aria-label="Navegação principal" className="hidden flex-1 gap-1 md:flex">
            {ATALHOS.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${FOCO}`}
                activeProps={{ className: "bg-secondary text-foreground", "aria-current": "page" }}
              >
                {label}
              </Link>
            ))}
            <span aria-hidden className="mx-1 my-2 w-px shrink-0 bg-border" />
            {modulos.map((m) => (
              <Link
                key={m.id}
                to={m.href}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${FOCO}`}
                activeProps={{ className: "bg-secondary text-foreground", "aria-current": "page" }}
              >
                {m.rotulo}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <BuscaGlobal />
            <Notificacoes />
            <div className="hidden items-center gap-2 md:flex">
              <TemaToggle compacto />
              <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/modelo">👤 Meu Modelo</Link></Button>
              <Button size="sm" asChild variant="outline" className="whitespace-nowrap border-accent/50 text-accent"><Link to="/aura-pass">✦ Pass</Link></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="whitespace-nowrap">Mais</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {FERRAMENTAS.map(([to, label]) => (
                    <DropdownMenuItem key={to} asChild>
                      <Link to={to}>{label}</Link>
                    </DropdownMenuItem>
                  ))}
                  {emBreveLista.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">Em breve</DropdownMenuLabel>
                      {emBreveLista.map((m) => (
                        <DropdownMenuItem key={m.id} disabled aria-disabled title="Em breve">
                          <span className="opacity-60">{m.icone} {m.rotulo}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">em breve</span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">Densidade</DropdownMenuLabel>
                  {DENSIDADES.map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      onSelect={() => trocarDensidade(d.id)}
                      className={densidade === d.id ? "bg-secondary font-medium" : ""}
                    >
                      {d.rotulo}{densidade === d.id ? " ✓" : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="ghost" onClick={() => void sair()} disabled={saindo}>{saindo ? "Saindo…" : "Sair"}</Button>
            </div>
            {/* Mobile: módulos e ferramentas no menu de hambúrguer. */}
            <div className="flex items-center gap-2 md:hidden">
              <AppMenu modo={modo} saindo={saindo} onSair={() => void sair()} />
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full ${largura} px-4 py-8 sm:px-6 md:py-10 lg:px-8`}><Outlet /></main>
    </div>
  );
}
