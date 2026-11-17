import { START_PACKS, packHref } from "@/lib/packs";
import { CARTAO_COMPACTO, TITULO_SECAO } from "@/lib/design";
import { cn } from "@/lib/utils";

/**
 * Packs prontos ("comece por aqui"): situações reais que levam a um ponto de
 * partida já ajustado. Nada é gravado — cada card é só um atalho editável.
 */
export function StartPacks({ limite, className }: { limite?: number; className?: string }) {
  const packs = typeof limite === "number" ? START_PACKS.slice(0, Math.max(0, limite)) : START_PACKS;
  return (
    <section className={cn("space-y-4", className)} aria-labelledby="comece-por-aqui">
      <div>
        <h2 id="comece-por-aqui" className={TITULO_SECAO}>Comece por aqui</h2>
        <p className="mt-1 text-sm text-muted-foreground">Uma situação da vida, um ponto de partida — você ajusta o resto.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {packs.map((pack) => (
          <a
            key={pack.id}
            href={packHref(pack)}
            className={cn(CARTAO_COMPACTO, "transition hover:border-accent hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl leading-none">{pack.emoji}</span>
              <div>
                <div className="font-medium">{pack.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
