import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Entrar — Aura ID" },
      { name: "description", content: "Entre ou crie sua conta Aura ID." },
      { property: "og:title", content: "Entrar — Aura ID" },
      { property: "og:description", content: "Entre ou crie sua conta Aura ID." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/studio" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) nav({ to: "/studio" }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up" && !data.session) toast.success("Confira sua caixa de entrada para confirmar o e-mail.");
  }

  async function google() {
    // No host do Lovable usamos o cloud-auth deles; fora dele (localhost/publicação própria) o Supabase Auth direto.
    const noLovable = !/(^|\.)lovableproject\.com$|(^|\.)lovableproject-dev\.com$|(^|\.)lovable\.app$/.test(window.location.hostname);
    if (noLovable) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) toast.error(error.message ?? "Não foi possível entrar com o Google");
      return;
    }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Não foi possível entrar com o Google");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-aura px-4">
      <div className="w-full max-w-md rounded-[2rem] border bg-card/90 p-8 shadow-soft backdrop-blur animate-rise">
        <Link to="/" className="font-display text-xl">Aura <em>ID</em></Link>
        <h1 className="mt-6 text-4xl">{mode === "in" ? "Que bom te ver" : "Comece com calma"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Seu perfil é privado e visível só para você.</p>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>Continuar com o Google</Button>
        <div className="my-5 text-center text-xs text-muted-foreground">ou com e-mail</div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="p">Senha</Label><Input id="p" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Um momento…" : mode === "in" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Primeira vez? Crie uma conta" : "Já tem conta? Entre"}
        </button>
      </div>
    </div>
  );
}
