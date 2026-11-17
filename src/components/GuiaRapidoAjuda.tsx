import { useEffect, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CARTAO_COMPACTO, FOCO } from "@/lib/design";
import { cn } from "@/lib/utils";
import { interpretarAjuda } from "@/lib/ajuda.functions";

/** Atalhos do assistente guiado: cada um leva direto ao ponto de partida certo. */
const ATALHOS = [
  { emoji: "💍", titulo: "Tenho um evento", href: "/studio?pack=casamento-dia", descricao: "Abre o Estúdio já preenchido para um casamento de dia — humor, ocasião e intensidade." },
  { emoji: "💇🏾‍♀️", titulo: "Quero mexer no cabelo", href: "/cabelo/gerar", descricao: "Leva ao gerador de cabelo: corte, cor e finalização com cuidado com o fio." },
  { emoji: "🖤", titulo: "Primeira tatuagem", href: "/tatuagem/perfil", descricao: "Começa pela intenção e mostra conceitos antes de qualquer decisão." },
  { emoji: "🧭", titulo: "Não sei por onde começar", href: "/guia", descricao: "O guia rápido mostra o caminho das primeiras escolhas, passo a passo." },
  { emoji: "✨", titulo: "Só explorar", href: "/studio", descricao: "Abre o Estúdio em branco para você escolher tudo do seu jeito." },
] as const;

/**
 * Botão flutuante "?" — assistente-guia (Prompt 1 do ROI).
 * Camada 1: digite o que quer, a IA interpreta e navega.
 * Camada 2: atalhos rápidos para quem já sabe o caminho.
 */
export function GuiaRapidoAjuda() {
  const [aberto, setAberto] = useState(false);
  const interpretar = useServerFn(interpretarAjuda);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);

  useEffect(() => {
    const abrirAjuda = () => setAberto(true);
    window.addEventListener("aura:ajuda", abrirAjuda);
    return () => window.removeEventListener("aura:ajuda", abrirAjuda);
  }, []);

  async function perguntar() {
    if (pensando || texto.trim().length < 3) return;
    setPensando(true);
    try {
      const r = await interpretar({ data: { texto: texto.trim() } });
      setAberto(false);
      setTexto("");
      toast(r.explicacao, { icon: "🧭" });
      window.location.assign(r.rota);
    } catch {
      toast.error("Não consegui entender agora — tente um dos atalhos abaixo.");
    } finally {
      setPensando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir ajuda guiada"
        aria-keyshortcuts="?"
        title="Ajuda guiada — escolha por onde começar"
        className="fixed bottom-4 left-4 z-40 grid size-12 place-items-center rounded-full border bg-background/90 font-display text-xl shadow-soft backdrop-blur transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 print:hidden"
      >
        <span aria-hidden>?</span>
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuda guiada</DialogTitle>
            <DialogDescription>Diga o que você quer ou escolha um atalho.</DialogDescription>
          </DialogHeader>

          {/* Camada conversacional: a IA interpreta e navega. */}
          <div className="space-y-2">
            <form
              onSubmit={(e) => { e.preventDefault(); void perguntar(); }}
              className="flex gap-2"
            >
              <Input
                aria-label="O que você quer fazer hoje?"
                placeholder="ex.: quero arrasar num casamento"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={300}
                disabled={pensando}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={pensando || texto.trim().length < 3} className={FOCO}>
                {pensando ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
            {pensando && <p role="status" className="text-xs text-muted-foreground">Pensando no melhor caminho pra você…</p>}
          </div>

          {/* Camada de atalhos: um clique, direto ao ponto. */}
          <div className="grid gap-2">
            {ATALHOS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                onClick={() => setAberto(false)}
                className={cn(CARTAO_COMPACTO, "flex items-start gap-3 transition hover:border-accent hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
              >
                <span aria-hidden className="text-xl leading-none">{a.emoji}</span>
                <div>
                  <div className="text-sm font-medium">{a.titulo}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.descricao}</p>
                </div>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
