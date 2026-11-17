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
import { FOCO } from "@/lib/design";
import type { ModoVisual } from "@/hooks/useModoVisual";
import { MarcaAura } from "@/components/MarcaAura";
import { TemaToggle } from "@/components/TemaToggle";
import {
  ATALHOS, FERRAMENTAS, modulosNaBarra, emBreve,
  DENSIDADES, lerDensidade, salvarDensidade, type Densidade,
} from "@/lib/navegacao-primaria";

/** No modo simples, ferramentas avançadas ficam atrás de "Mais opções". */
const AVANCADAS = FERRAMENTAS.filter(([to]) => !["/modelo", "/retrato"].includes(to));

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

function ItemEmBreve({ rotulo, icone }: { rotulo: string; icone: string }) {
  return (
    <li>
      <span className="flex min-h-11 cursor-default items-center rounded-lg px-3 text-sm opacity-60" aria-disabled title="Em breve">
        {icone} {rotulo}
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">em breve</span>
      </span>
    </li>
  );
}

/**
 * Menu mobile (< md): hambúrguer que abre um Sheet com os grupos fixos —
 * Criar, Módulos (sempre os 4 essenciais), Ferramentas e Conta. Igual à barra
 * do desktop: mesma ordem, mesmos rótulos, nada depende de trilhas.
 */
export function AppMenu({ modo, saindo, onSair }: { modo: ModoVisual; saindo: boolean; onSair: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const [densidade, setDensidade] = useState<Densidade>(() => lerDensidade());
  const fechar = () => setAberto(false);
  const simples = modo === "simples";
  const modulos = modulosNaBarra();
  const emBreveLista = emBreve();

  const trocarDensidade = (d: Densidade) => {
    salvarDensidade(d);
    setDensidade(d);
    window.dispatchEvent(new Event("aura:densidade"));
  };

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
          <SheetTitle className="flex items-center gap-3 font-display text-2xl">
            <MarcaAura variante="selo" className="size-9" />
            Aura <em>ID</em>
          </SheetTitle>
          <SheetDescription>
            {simples ? "O essencial para começar — o resto fica em Mais opções." : "Criar, acessar seus módulos e cuidar da conta."}
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal" className="mt-5 space-y-5">
          <Secao titulo="Criar">
            {ATALHOS.map(([to, label]) => (
              <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
            ))}
          </Secao>

          <Secao titulo="Módulos">
            {modulos.map((m) => (
              <ItemLink key={m.id} to={m.href} label={`${m.icone} ${m.rotulo}`} onNavigate={fechar} />
            ))}
            {emBreveLista.map((m) => (
              <ItemEmBreve key={m.id} rotulo={m.rotulo} icone={m.icone} />
            ))}
          </Secao>

          <Secao titulo="Ferramentas">
            <ItemLink to="/modelo" label="👤 Meu Modelo" onNavigate={fechar} />
            <ItemLink to="/aura-pass" label="✦ Pass" onNavigate={fechar} />
            {simples ? (
              <>
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
                  <li id="appmenu-mais-opcoes">
                    <ul className="space-y-0.5 pt-1">
                      <ItemLink to="/retrato" label="📸 Aura Retrato" onNavigate={fechar} />
                      {AVANCADAS.map(([to, label]) => (
                        <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
                      ))}
                    </ul>
                  </li>
                )}
              </>
            ) : (
              <>
                <ItemLink to="/retrato" label="📸 Aura Retrato" onNavigate={fechar} />
                {AVANCADAS.map(([to, label]) => (
                  <ItemLink key={to} to={to} label={label} onNavigate={fechar} />
                ))}
              </>
            )}
          </Secao>

          <Secao titulo="Conta">
            <li className="px-3 py-1">
              <TemaToggle />
            </li>
            <ItemLink to="/settings" label="Configurações" onNavigate={fechar} />
            <li>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Densidade — {densidade}</p>
              <ul className="grid grid-cols-3 gap-1 px-3 pb-1">
                {DENSIDADES.map((d) => (
                  <li key={d.id}>
                    <Button
                      type="button"
                      size="sm"
                      variant={densidade === d.id ? "default" : "outline"}
                      className={`w-full ${FOCO}`}
                      onClick={() => trocarDensidade(d.id)}
                    >
                      {d.rotulo}
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
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
