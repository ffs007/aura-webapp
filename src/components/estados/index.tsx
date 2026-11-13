import type { ReactNode } from "react";
import { AlertTriangle, LoaderCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CARTAO,
  CARTAO_COMPACTO,
  META,
  TITULO_ITEM,
  TITULO_PAGINA,
  TITULO_SECAO,
} from "@/lib/design";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Cabeçalho de página                                                       */
/* -------------------------------------------------------------------------- */

export function CabecalhoPagina({
  titulo,
  descricao,
  sobretitulo,
  acoes,
  antes,
  children,
  className,
}: {
  /** Título principal da tela (vira o único `h1` da página). */
  titulo: ReactNode;
  /** Uma frase explicando para que serve a tela. */
  descricao?: ReactNode;
  /** Rótulo curto acima do título (ex.: "Primeira vez? Comece aqui"). */
  sobretitulo?: ReactNode;
  /** Botões alinhados à direita do título. */
  acoes?: ReactNode;
  /** Linha acima do título (voltar, etiquetas, avisos). */
  antes?: ReactNode;
  /** Conteúdo logo abaixo do título (chips de humor, filtros, atalhos). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {antes}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {sobretitulo && <p className="text-sm text-accent">{sobretitulo}</p>}
          <h1 className={cn(TITULO_PAGINA, sobretitulo && "mt-2")}>{titulo}</h1>
          {descricao && <p className="mt-2 max-w-2xl text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </header>
  );
}

/** Seção com título padrão (h2) — evita cada tela escolher um tamanho. */
export function Secao({
  titulo,
  descricao,
  acoes,
  children,
  id,
  className,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)} aria-labelledby={id}>
      {(titulo || descricao || acoes) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {titulo && (
              <h2 id={id} className={TITULO_SECAO}>
                {titulo}
              </h2>
            )}
            {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Carregando                                                                */
/* -------------------------------------------------------------------------- */

/** Rodinha + rótulo para esperas curtas e blocos que ainda não têm forma. */
export function CarregandoInline({ rotulo = "Carregando…", className }: { rotulo?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      <span>{rotulo}</span>
    </div>
  );
}

/** Tela inteira enquanto a página carrega (usada por rotas sem forma conhecida). */
export function CarregandoPagina({ rotulo = "Carregando…", className }: { rotulo?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn("grid min-h-[40vh] place-items-center", className)}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LoaderCircle aria-hidden className="size-6 animate-spin" />
        <span className="text-sm">{rotulo}</span>
      </div>
    </div>
  );
}

/** Esqueleto de um cartão que já se sabe como vai parecer. */
export function EsqueletoCartao({ altura = "h-48", className }: { altura?: string; className?: string | undefined }) {
  return <Skeleton className={cn(altura, "rounded-2xl", className)} />;
}

/** Esqueleto de lista de cartões (a forma mais comum do app). */
export function EsqueletoLista({
  itens = 4,
  colunas = 2,
  altura = "h-48",
  className,
}: {
  itens?: number;
  colunas?: 1 | 2 | 3;
  altura?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando conteúdo"
      className={cn("grid gap-4", colunas === 2 && "md:grid-cols-2", colunas === 3 && "md:grid-cols-3", className)}
    >
      {Array.from({ length: itens }, (_, i) => (
        <EsqueletoCartao key={i} altura={altura} />
      ))}
    </div>
  );
}

/** Esqueleto de uma tela de detalhe (uma superfície grande). */
export function EsqueletoDetalhe({ altura = "h-96", className }: { altura?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label="Carregando conteúdo">
      <EsqueletoCartao altura={altura} className={className} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vazio                                                                     */
/* -------------------------------------------------------------------------- */

export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acoes,
  compacto = false,
  tom = "neutro",
  className,
}: {
  /** Ícone decorativo (já é escondido de leitores de tela). */
  icone?: ReactNode;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Botões/links para o próximo passo. Sem ação, a pessoa fica sem saída. */
  acoes?: ReactNode;
  compacto?: boolean;
  /** "destaque" para o primeiro uso (convite); "neutro" para "nada aqui". */
  tom?: "neutro" | "destaque";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed px-6 text-center",
        compacto ? "py-10" : "py-14",
        tom === "destaque" && "border-accent/50 bg-accent/5",
        className,
      )}
    >
      {icone && (
        <div aria-hidden className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          {icone}
        </div>
      )}
      <h2 className={TITULO_ITEM}>{titulo}</h2>
      {descricao && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{descricao}</p>}
      {acoes && <div className="mt-6 flex flex-wrap justify-center gap-2">{acoes}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Erro                                                                      */
/* -------------------------------------------------------------------------- */

export function EstadoErro({
  titulo = "Não foi possível carregar",
  descricao = "Isso pode ser instabilidade de conexão. Tente de novo — nada do que você fez foi perdido.",
  onTentarNovamente,
  recarregando = false,
  semConexao = false,
  acoes,
  className,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  /** Se existir, mostra "Tentar novamente". */
  onTentarNovamente?: () => void;
  recarregando?: boolean;
  /** Usa a mensagem de conexão em vez da genérica. */
  semConexao?: boolean;
  /** Ações extras (ex.: voltar para outra tela). */
  acoes?: ReactNode;
  className?: string;
}) {
  const Icone = semConexao ? WifiOff : AlertTriangle;
  return (
    <div role="alert" className={cn("rounded-2xl border border-destructive/30 bg-destructive/5 p-6", className)}>
      <div className="flex items-start gap-3">
        <Icone aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <h2 className={TITULO_ITEM}>{titulo}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {semConexao
              ? "Não conseguimos falar com o servidor. Verifique sua internet e tente de novo — nada do que você fez foi perdido."
              : descricao}
          </p>
          {(onTentarNovamente || acoes) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {onTentarNovamente && (
                <Button size="sm" variant="outline" onClick={onTentarNovamente} disabled={recarregando}>
                  {recarregando ? "Tentando…" : "Tentar novamente"}
                </Button>
              )}
              {acoes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avisos e superfícies                                                      */
/* -------------------------------------------------------------------------- */

const AVISO_TOM = {
  info: "border-accent/40 bg-accent/5",
  sucesso: "border-sage/60 bg-sage/15",
  atencao: "border-ochre bg-ochre/15",
  neutro: "border bg-secondary",
} as const;

/** Aviso em linha (dica, pendência, confirmação parcial). */
export function Aviso({
  tom = "info",
  titulo,
  children,
  acoes,
  className,
}: {
  tom?: keyof typeof AVISO_TOM;
  titulo?: ReactNode;
  children?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 text-sm", AVISO_TOM[tom], className)}>
      {titulo && <p className="font-medium">{titulo}</p>}
      {children && <div className={cn(titulo && "mt-1", "text-muted-foreground")}>{children}</div>}
      {acoes && <div className="mt-3 flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

/** Superfície de cartão padrão (para quando um `div` basta). */
export function Cartao({ children, className, compacto = false }: { children: ReactNode; className?: string; compacto?: boolean }) {
  return <div className={cn(compacto ? CARTAO_COMPACTO : CARTAO, className)}>{children}</div>;
}

/** Rótulo de metadados (data, status, contagem). */
export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(META, className)}>{children}</span>;
}
