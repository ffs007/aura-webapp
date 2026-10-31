import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrilhaPicker } from "@/components/TrilhaPicker";
import { lerTrilhas, linksVisiveis, type TrilhaKey } from "@/lib/trilhas";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    if (location.pathname !== "/consent") {
      const { data: c } = await supabase.from("consents").select("user_id").eq("user_id", data.user.id).maybeSingle();
      if (!c) throw redirect({ to: "/consent" });
      if (location.pathname !== "/onboarding") {
        const { data: p } = await supabase.from("visual_profiles").select("completed").eq("user_id", data.user.id).maybeSingle();
        if (!p?.completed) throw redirect({ to: "/onboarding" });
      }
    }
    return { user: data.user };
  },
  component: Shell,
});

function Shell() {
  const nav = useNavigate();
  const [trilhas, setTrilhas] = useState<TrilhaKey[]>([]);
  const [pickerAberto, setPickerAberto] = useState(false);

  useEffect(() => {
    const carregar = () => {
      const salvas = lerTrilhas();
      setTrilhas(salvas);
      if (!salvas.length) setPickerAberto(true); // primeira visita: escolha de trilhas
    };
    carregar();
    window.addEventListener("aura:trilhas", carregar);
    return () => window.removeEventListener("aura:trilhas", carregar);
  }, []);

  const links = linksVisiveis(trilhas);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-6 py-3">
          <Link to="/studio" className="font-display text-xl whitespace-nowrap">Aura <em>ID</em></Link>
          <nav className="flex flex-1 gap-1">
            {links.map(([to, label]) => (
              <Link key={to} to={to} className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
                {label}
              </Link>
            ))}
          </nav>
          <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/modelo">👤 Modelo</Link></Button>
          <Button size="sm" asChild variant="ghost" className="whitespace-nowrap"><Link to="/retrato">📸 Retrato</Link></Button>
          <Button size="sm" asChild variant="outline" className="whitespace-nowrap border-accent/50 text-accent"><Link to="/aura-pass">✦ Pass</Link></Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setPickerAberto(true)}>
            Trilhas{trilhas.length ? ` · ${trilhas.length}` : ""}
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}>Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10"><Outlet /></main>
      <TrilhaPicker aberto={pickerAberto} onFechar={() => setPickerAberto(false)} iniciais={trilhas} />
    </div>
  );
}
