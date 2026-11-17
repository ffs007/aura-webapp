import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Aviso, CabecalhoPagina } from "@/components/estados";
import { MarcaAura } from "@/components/MarcaAura";
import { FOCO } from "@/lib/design";
import { consumirDestino, destinoSeguro, irPara } from "@/lib/navegacao";

/** Erros do Supabase Auth em linguagem de gente (leigo não lê inglês cru). */
const ERROS_PT: [RegExp, string][] = [
  [/at least 6 characters/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/invalid login credentials/i, "E-mail ou senha incorretos. Confira e tente de novo."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar — olhe a caixa de entrada (e o spam)."],
  [/already (been )?registered|already registered/i, "Este e-mail já tem conta. Toque em “Já tem conta? Entre”."],
  [/rate limit|too many|only request this after/i, "Muitas tentativas em pouco tempo. Respire e tente de novo em alguns minutos."],
  [/unable to validate|validation failed/i, "Confira o e-mail digitado."],
  [/weak password|password should/i, "Escolha uma senha mais forte, com pelo menos 8 caracteres."],
];
const traduzErro = (msg: string) => ERROS_PT.find(([re]) => re.test(msg))?.[1] ?? "Algo deu errado. Tente novamente.";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { motivo?: "sessao" | "conexao"; redirect?: string } => {
    const out: { motivo?: "sessao" | "conexao"; redirect?: string } = {};
    const motivo = s["motivo"];
    if (motivo === "sessao" || motivo === "conexao") out.motivo = motivo;
    const redirecionar = s["redirect"];
    if (typeof redirecionar === "string") out.redirect = redirecionar;
    return out;
  },
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
  const search = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up" | "recuperar">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [avisoRecuperacao, setAvisoRecuperacao] = useState("");
  const [erroForm, setErroForm] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const jaRedirecionou = useRef(false);

  function irParaDestino() {
    if (jaRedirecionou.current) return;
    jaRedirecionou.current = true;
    const destino = destinoSeguro(search.redirect) ?? consumirDestino();
    if (destino) irPara(destino);
    else nav({ to: "/studio" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) irParaDestino(); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) irParaDestino(); });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErroForm("");
    setBusy(true);
    try {
      if (mode === "recuperar") {
        // Mensagem sempre igual, e só se houver conta o link chega: não revelamos
        // quem tem cadastro. A entrega depende do serviço de e-mail do ambiente.
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/redefinir-senha",
        });
        setAvisoRecuperacao(
          "Se este e-mail tiver conta, enviamos um link para redefinir a senha. Confira a caixa de entrada e o spam. Se o envio de e-mails ainda não estiver disponível neste ambiente, o link não chega — tente de novo mais tarde.",
        );
        setMode("in");
        setPassword("");
        if (error) setErroForm(traduzErro(error.message));
        return;
      }
      const { error, data } = mode === "in"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/auth" } });
      if (error) { setErroForm(traduzErro(error.message)); return; }
      if (mode === "up" && !data.session) toast.success("Confira sua caixa de entrada para confirmar o e-mail.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (googleBusy) return;
    setGoogleBusy(true);
    // No host do Lovable usamos o cloud-auth deles; fora dele (localhost/publicação própria) o Supabase Auth direto.
    const noLovable = !/(^|\.)lovableproject\.com$|(^|\.)lovableproject-dev\.com$|(^|\.)lovable\.app$/.test(window.location.hostname);
    if (noLovable) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) { setErroForm(traduzErro(error.message ?? "")); setGoogleBusy(false); }
      return;
    }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { setErroForm(traduzErro(r.error.message ?? "")); setGoogleBusy(false); }
  }

  const aviso = search.motivo === "sessao"
    ? "Entre para continuar de onde parou."
    : search.motivo === "conexao"
      ? "Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo."
      : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-aura px-4">
      {/* Textura de linho do kit de identidade — presença sutil (8%). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply" style={{ backgroundImage: "url(/texturas/linho.png)", backgroundSize: "512px 512px" }} />
      <div className="relative w-full max-w-md rounded-[2rem] border bg-card/90 p-8 shadow-soft backdrop-blur animate-rise">
        <Link to="/" className="flex items-center gap-3">
          <MarcaAura variante="selo" className="size-10" />
          <span className="font-display text-2xl">Aura <em>ID</em></span>
        </Link>
        <CabecalhoPagina
          titulo={mode === "in" ? "Que bom te ver" : mode === "up" ? "Comece com calma" : "Recuperar acesso"}
          descricao={mode === "recuperar"
            ? "Informe o e-mail da sua conta e, se ela existir, enviamos um link para você criar uma nova senha."
            : "Seu perfil é privado e visível só para você."}
          className="mt-6 text-center [&_h1]:text-4xl [&>div]:justify-center [&>div>div]:mx-auto [&>div>div>p]:mx-auto [&>div>div>p]:text-sm"
        />
        {aviso && <div role="status"><Aviso tom="info" className="mt-4">{aviso}</Aviso></div>}
        {avisoRecuperacao && <div role="status"><Aviso tom="info" className="mt-4">{avisoRecuperacao}</Aviso></div>}
        {mode !== "recuperar" && (
          <>
            <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={googleBusy || busy}>
              {googleBusy ? "Abrindo o Google…" : "Continuar com o Google"}
            </Button>
            <div className="my-5 text-center text-xs text-muted-foreground">ou com e-mail</div>
          </>
        )}
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {mode !== "recuperar" && (
            <div><Label htmlFor="p">Senha</Label><Input id="p" type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          )}
          {mode === "up" && <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>}
          {mode === "recuperar" && <p className="text-xs text-muted-foreground">Ao abrir o link do e-mail, você cria a senha nova em uma tela própria.</p>}
          {erroForm && (
            <Aviso tom="atencao" acoes={<Button type="button" size="sm" variant="outline" onClick={() => { setErroForm(""); formRef.current?.requestSubmit(); }}>Tentar novamente</Button>}>
              {erroForm}
            </Aviso>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Um momento…" : mode === "in" ? "Entrar" : mode === "up" ? "Criar conta" : "Enviar link de recuperação"}
          </Button>
        </form>
        {mode === "in" && (
          <button
            type="button"
            className={`mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline ${FOCO}`}
            onClick={() => { setAvisoRecuperacao(""); setMode("recuperar"); }}
          >
            Esqueci minha senha
          </button>
        )}
        <button
          type="button"
          className={`mt-2 w-full text-center text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline ${FOCO}`}
          onClick={() => { setAvisoRecuperacao(""); setMode(mode === "in" ? "up" : "in"); }}
        >
          {mode === "in" ? "Primeira vez? Crie uma conta" : mode === "up" ? "Já tem conta? Entre" : "Voltar para entrar"}
        </button>
      </div>
    </div>
  );
}
