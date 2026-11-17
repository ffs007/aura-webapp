import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOCO } from "@/lib/design";
import { useTema, type Tema } from "@/hooks/useTema";

const PROXIMO: Record<Tema, Tema> = { claro: "escuro", escuro: "sistema", sistema: "claro" };
const ROTULO: Record<Tema, string> = { claro: "Claro", escuro: "Escuro", sistema: "Sistema" };
const Icone = ({ tema }: { tema: Tema }) =>
  tema === "escuro" ? <Moon className="size-4" /> : tema === "claro" ? <Sun className="size-4" /> : <Monitor className="size-4" />;

/** Alternador de tema: claro → escuro → sistema (segue o aparelho). */
export function TemaToggle({ compacto = false }: { compacto?: boolean }) {
  const [tema, trocar] = useTema();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={`whitespace-nowrap ${FOCO}`}
      onClick={() => trocar(PROXIMO[tema])}
      title={`Tema: ${ROTULO[tema]} — clique para alternar`}
      aria-label={`Tema atual: ${ROTULO[tema]}. Clique para alternar.`}
    >
      <Icone tema={tema} />
      {!compacto && <span className="text-xs text-muted-foreground">{ROTULO[tema]}</span>}
    </Button>
  );
}
