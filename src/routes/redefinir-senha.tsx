import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Aviso, CabecalhoPagina, CarregandoPagina } from "@/components/estados";

/**
 * Rota PÚBLICA de redefinição de senha (/redefinir-senha), fora do gate
 * `_authenticated`: é para cá que o link do e-mail "Esqueci minha senha" aponta.
 * Se a sessão de recuperação existir, a pessoa define a nova senha; se não,
 * explicamos como pedir outro link — sem prometer um e-mail que o ambiente
 * talvez não entregue (SMTP pode não estar configurado).
 */

/** Erros do Supabase Auth em português — nunca mostrar a mensagem crua. */
const ERROS_AUTH: [RegExp, string][] = [
  [/at least 6 characters|password should|weak password/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/same (as|password)|should be different/i, "Escolha uma senha diferente da atual."],
  [/rate limit|too many/i, "Muitas tentativas em pouco tempo. Tente de novo em alguns minutos."],
  [/session|jwt|not authenticated|expired|refresh token|token/i, "O link expirou ou a sessão não é mais válida. Peça um novo link de recuperação."],
];

function traduzErroAuth(mensagem: string): string {
  return ERROS_AUTH.find(([padrao]) => padrao.test(mensagem))?.[1] ?? "Não foi possível salvar a senha agora. Tente novamente.";
}

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Aura ID" },
      { name: "description", content: "Defina uma nova senha para a sua conta Aura ID." },
    ],
  }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [estado, setEstado] = useState<"verificando" | "pronto" | "sem-sessao">("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    // O link do e-mail chega com a sessão de recuperação na URL
    // (#access_token…&type=recovery); o cliente do Supabase a reconhece.
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!ativo) return;
      if (evento === "PASSWORD_RECOVERY" || sessao) setEstado("pronto");
      else if (evento === "SIGNED_OUT") setEstado("sem-sessao");
    });
    void supabase.auth.getSession().then(({ data: sessaoAtual }) => {
      if (!ativo) return;
      if (sessaoAtual.session) setEstado("pronto");
      else setEstado((atual) => (atual === "pronto" ? atual : "sem-sessao"));
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    if (senha.length < 8) { setErro("A nova senha precisa ter pelo menos 8 caracteres."); return; }
    if (senha !== confirmar) { setErro("As senhas não são iguais. Confira e tente de novo."); return; }
    setErro("");
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) { setErro(traduzErroAuth(error.message)); return; }
      toast.success("Senha atualizada! Entre com a nova senha.");
      try { await supabase.auth.signOut(); } catch { /* sessão local pode já ter caído */ }
      nav({ to: "/auth" });
    } catch {
      setErro("Não foi possível salvar a senha agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (estado === "verificando") {
    return (
      <div className="grid min-h-screen place-items-center bg-aura px-4">
        <CarregandoPagina rotulo="Verificando o link…" />
      </div>
    );
  }

  if (estado === "sem-sessao") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-aura px-4">
        <div className="w-full max-w-md rounded-[2rem] border bg-card/90 p-8 shadow-soft backdrop-blur animate-rise">
          <Link to="/" className="font-display text-xl">Aura <em>ID</em></Link>
          <CabecalhoPagina
            titulo="Abra pelo link do e-mail"
            descricao="Para criar uma nova senha, abra o link que enviamos no e-mail de recuperação. Se ele expirou, foi aberto em outro navegador ou o envio de e-mails ainda não está disponível neste ambiente, peça um novo link na tela de entrada."
            className="mt-6 text-center [&_h1]:text-4xl [&>div]:justify-center [&>div>div]:mx-auto [&>div>div>p]:mx-auto [&>div>div>p]:text-sm"
          />
          <Button asChild className="mt-6 w-full"><Link to="/auth">Ir para a entrada</Link></Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Se o link não chegar, o envio de e-mails pode não estar configurado — avise o suporte do Aura ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-aura px-4">
      <div className="w-full max-w-md rounded-[2rem] border bg-card/90 p-8 shadow-soft backdrop-blur animate-rise">
        <Link to="/" className="font-display text-xl">Aura <em>ID</em></Link>
        <CabecalhoPagina
          titulo="Criar nova senha"
          descricao="Escolha uma senha nova para a sua conta. Depois você volta para a entrada."
          className="mt-6 text-center [&_h1]:text-4xl [&>div]:justify-center [&>div>div]:mx-auto [&>div>div>p]:mx-auto [&>div>div>p]:text-sm"
        />
        <form onSubmit={salvar} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmar">Confirmar nova senha</Label>
            <Input
              id="confirmar"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
          {erro && (
            <Aviso tom="atencao" acoes={<Button asChild size="sm" variant="outline"><Link to="/auth">Pedir novo link</Link></Button>}>
              {erro}
            </Aviso>
          )}
          <Button type="submit" className="w-full" disabled={salvando || senha.length < 8 || confirmar.length < 8}>
            {salvando ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>
        <Link to="/auth" className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground">
          Voltar para entrar
        </Link>
      </div>
    </div>
  );
}
