import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CARTAO_COMPACTO } from "@/lib/design";
import { cn } from "@/lib/utils";

/** Atalhos do assistente guiado: cada um leva direto ao ponto de partida certo. */
const ATALHOS = [
  { emoji: "💍", titulo: "Tenho um evento", href: "/studio?pack=casamento-dia", descricao: "Abre o Estúdio já preenchido para um casamento de dia — humor, ocasião e intensidade." },
  { emoji: "💇🏾‍♀️", titulo: "Quero mexer no cabelo", href: "/cabelo/gerar", descricao: "Leva ao gerador de cabelo: corte, cor e finalização com cuidado com o fio." },
  { emoji: "🖤", titulo: "Primeira tatuagem", href: "/tatuagem/perfil", descricao: "Começa pela intenção e mostra conceitos antes de qualquer decisão." },
  { emoji: "🧭", titulo: "Não sei por onde começar", href: "/guia", descricao: "O guia rápido mostra o caminho das primeiras escolhas, passo a passo." },
  { emoji: "✨", titulo: "Só explorar", href: "/studio", descricao: "Abre o Estúdio em branco para você escolher tudo do seu jeito." },
] as const;

/** Botão flutuante "?" (canto inferior esquerdo) com atalhos de ajuda em todas as páginas. */
export function GuiaRapidoAjuda() {
  const [aberto, setAberto] = useState(false);

  // O atalho `?` é detectado no BuscaGlobal (que conhece o foco do teclado) e
  // chega aqui por este evento global, mantendo o comportamento da busca e da
  // ajuda em um único lugar.
  useEffect(() => {
    const abrirAjuda = () => setAberto(true);
    window.addEventListener("aura:ajuda", abrirAjuda);
    return () => window.removeEventListener("aura:ajuda", abrirAjuda);
  }, []);

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
            <DialogDescription>Escolha um ponto de partida — cada atalho leva direto para lá.</DialogDescription>
          </DialogHeader>
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
