import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { linksVisiveis, type TrilhaKey } from "@/lib/trilhas";
import { FOCO } from "@/lib/design";
import type { ModoVisual } from "@/hooks/useModoVisual";

/** Atalhos fixos que já aparecem em "Criar" e "Ferramentas" — saem de "Meus módulos". */
const CRIAR: [string, string][] = [
  ["/studio", "Estúdio"],
  ["/dashboard", "Sugestões"],
];

const FERRAMENTAS: [string, string][] = [
  ["/dna", "DNA Visual"],
  ["/compare", "Comparar"],
  ["/export", "Exportar"],
  ["/tatuagem/vitrine", "🖼️ Vitrine"],
  ["/profissionais", "Profissionais"],
  ["/estetica", "✨ Estética"],
  ["/modelo", "👤 Modelo"],
  ["/retrato", "📸 Retrato"],
  ["/aura-pass", "✦ Pass"],
];

/** No modo simples, tudo além de Profissionais fica atrás de "Mais opções". */
const FERRAMENTAS_AVANCADAS = FERRAMENTAS.filter(([to]) => to !== "/profissionais");

const JA_NO_MENU = new Set([...CRIAR, ...FERRAMENTAS].map(([to]) => to));
JA_NO_MENU.add("/settings"); // Configurações já está na seção Conta

const itemLink =
  `flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground ${FOCO}`;
const itemBotao = `h-11 w-full justify-start rounded-lg px-3 text-sm font-normal ${FOCO}`;

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h2>
      <ul className="mt-1 space-y-0.5">{children}</ul>
    </section>
  );
}

function ItemLink({ to, label, onNavigate }: { to: string; label: string; onNavigate: () => void }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className={itemLink}
        activeProps={{ className: "bg-secondary text-foreground", "aria-current": "page" }}
      >
        {label}
      </Link>
    </li>
  );
}

/**
 * Menu mobile (< md): hambúrguer de 44px que abre um Sheet com os módulos
 * agrupados (Criar, Meus módulos, Ferramentas e Conta). A nav rolável do
 * header some no mobile; no desktop este componente fica oculto.
 *
 * No modo simples o menu fica enxuto: Profissionais continua visível e o resto
 * (módulos das trilhas + ferramentas avançadas) vai para "Mais opções".
 */
export function AppMenu({
  trilhas,
  modo,
  saindo,
  onSair,
  onAbrirTrilhas,
}: {
  trilhas: TrilhaKey[];
  modo: ModoVisual;
  saindo: boolean;
  onSair: () => void;
  onAbrirTrilhas: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const fechar = () => setAberto(false);
  // linksVisiveis já deduplica /cabelo (Cabelo + Barbearia); aqui só tiramos os
  // atalhos fixos que já estão nas seções Criar/Ferramentas para não repetir.
  const meusModulos = linksVisiveis(trilhas).filter(([to]) => !JA_NO_MENU.has(to));
  const abrirTrilhas = () => {
    fechar();
    onAbrirTrilhas();
  };
  const simples = modo === "simples";

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Abrir menu"
          title="Abrir menu"
          className="h-11 w-11 shrink-0 md:hidden"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl">Aura <em>ID</em></SheetTitle>
          <SheetDescription>
            {simples ? "O essencial para começar — o resto fica em Mais opções." : "Criar, acessar seus módulos e cuidar da conta."}
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal" className="mt-5 space-y-5">
          <Secao titulo="Criar">
            {CRIAR.map(([to, label]) => (
              <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
            ))}
          </Secao>

          {!simples && (
            <Secao titulo="Meus módulos">
              {meusModulos.length ? (
                meusModulos.map(([to, label]) => (
                  <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
                ))
              ) : (
                <li>
                  <button type="button" onClick={abrirTrilhas} className={`${itemLink} w-full`}>
                    Escolha trilhas para ver seus módulos
                  </button>
                </li>
              )}
            </Secao>
          )}

          <Secao titulo="Ferramentas">
            {simples ? (
              <>
                <ItemLink to="/profissionais" label="Profissionais" onNavigate={fechar} />
                <ItemLink to="/modelo" label="👤 Meu Modelo" onNavigate={fechar} />
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    className={itemBotao}
                    aria-expanded={maisAberto}
                    aria-controls="appmenu-mais-opcoes"
                    onClick={() => setMaisAberto((valor) => !valor)}
                  >
                    {maisAberto ? "Menos opções" : "Mais opções"}
                  </Button>
                </li>
                {maisAberto && (
                  <li id="appmenu-mais-opcoes" className="space-y-2 pt-1">
                    <div>
                      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meus módulos</p>
                      <ul className="space-y-0.5">
                        {meusModulos.length ? (
                          meusModulos.map(([to, label]) => (
                            <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
                          ))
                        ) : (
                          <li>
                            <button type="button" onClick={abrirTrilhas} className={`${itemLink} w-full`}>
                              Escolha trilhas para ver seus módulos
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avançado</p>
                      <ul className="space-y-0.5">
                        {FERRAMENTAS_AVANCADAS.map(([to, label]) => (
                          <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
                        ))}
                      </ul>
                    </div>
                  </li>
                )}
              </>
            ) : (
              FERRAMENTAS.map(([to, label]) => (
                <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
              ))
            )}
          </Secao>

          <Secao titulo="Conta">
            <li>
              <Button type="button" variant="ghost" className={itemBotao} onClick={abrirTrilhas}>
                Trilhas{trilhas.length ? ` · ${trilhas.length}` : ""}
              </Button>
            </li>
            <ItemLink to="/settings" label="Configurações" onNavigate={fechar} />
            <li>
              <Button
                type="button"
                variant="ghost"
                className={itemBotao}
                disabled={saindo}
                onClick={() => onSair()}
              >
                {saindo ? "Saindo…" : "Sair"}
              </Button>
            </li>
          </Secao>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
