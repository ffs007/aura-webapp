import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { salvarTrilhas, TODAS_TRILHAS, TRILHAS, type TrilhaKey } from "@/lib/trilhas";

/**
 * Seletor de trilhas do Aura ID (webapp). Mostrado no primeiro acesso (nenhuma
 * trilha salva) e reaberto pelo botão "Trilhas" no header. Escolher 1–3; a
 * navegação passa a exibir somente os módulos das trilhas escolhidas.
 */
export function TrilhaPicker({ aberto, onFechar, iniciais }: { aberto: boolean; onFechar: () => void; iniciais: TrilhaKey[] }) {
  const [sel, setSel] = useState<TrilhaKey[]>(iniciais.length ? iniciais : []);

  useEffect(() => { setSel(iniciais.length ? iniciais : []); }, [iniciais.join(",")]);

  if (!aberto) return null;

  const toggle = (t: TrilhaKey) => setSel((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-lg rounded-3xl border bg-background p-8 shadow-soft animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl">Por onde você quer começar?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha até 3 trilhas. Só o que você escolher aparece no menu — nada de confusão.
          Dá para mudar depois no botão “Trilhas”.
        </p>
        <div className="mt-6 space-y-3">
          {TODAS_TRILHAS.map((key) => {
            const t = TRILHAS[key];
            const active = sel.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
                  active ? "border-primary bg-secondary/60" : "bg-card hover:bg-secondary/40",
                )}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{t.icon}</span>
                <span className="flex-1">
                  <span className="block font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.tagline}</span>
                </span>
                <span aria-hidden className={cn("text-xl", active ? "text-primary" : "text-muted-foreground/40")}>{active ? "✓" : "＋"}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onFechar}>Agora não</Button>
          <Button
            disabled={!sel.length}
            onClick={() => { salvarTrilhas(sel); onFechar(); }}
          >
            {sel.length ? `Começar com ${sel.length} ${sel.length === 1 ? "trilha" : "trilhas"}` : "Escolha ao menos 1"}
          </Button>
        </div>
      </div>
    </div>
  );
}
