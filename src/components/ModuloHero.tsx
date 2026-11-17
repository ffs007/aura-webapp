import type { ReactNode } from "react";

/**
 * Herói de página de módulo (kit de identidade): título à esquerda,
 * still-life do kit à direita (/cards/*.png). A imagem é decorativa —
 * o conteúdo textual fica sempre acessível acima dela.
 */
export function ModuloHero({
  imagem,
  sobretitulo,
  titulo,
  descricao,
}: {
  imagem: string;
  sobretitulo: string;
  titulo: ReactNode;
  descricao: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border">
      <img
        src={imagem}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-90"
      />
      <div className="relative bg-gradient-to-r from-background via-background/95 to-transparent p-6 sm:p-8 sm:pr-[42%]">
        <span className="text-xs uppercase tracking-widest text-accent">{sobretitulo}</span>
        <h1 className="font-display text-4xl md:text-5xl">{titulo}</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descricao}</p>
      </div>
    </header>
  );
}
