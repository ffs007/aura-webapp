import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Aviso } from "@/components/estados";
import { FOCO, TITULO_SECAO } from "@/lib/design";
import { cn } from "@/lib/utils";
import { salvarTrilhas, TODAS_TRILHAS, TRILHAS, type TrilhaKey } from "@/lib/trilhas";

const MAX_TRILHAS = 3;

/**
 * Seletor de trilhas do Aura ID (webapp). Mostrado no primeiro acesso (nenhuma
 * trilha salva) e reaberto pelo botão "Trilhas" no header. Escolher de 1 a 3;
 * a navegação passa a exibir os módulos das trilhas escolhidas (os atalhos
 * fixos continuam disponíveis).
 */
export function TrilhaPicker({
  aberto,
  onFechar,
  onDispensar,
  iniciais,
}: {
  aberto: boolean;
  onFechar: () => void;
  onDispensar?: () => void;
  iniciais: TrilhaKey[];
}) {
  const [sel, setSel] = useState<TrilhaKey[]>(iniciais.length ? iniciais : []);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    setSel(iniciais.length ? iniciais : []);
    setAviso("");
  }, [iniciais.join(",")]);

  function toggle(t: TrilhaKey) {
    setAviso("");
    setSel((p) => {
      if (p.includes(t)) return p.filter((x) => x !== t);
      if (p.length >= MAX_TRILHAS) {
        setAviso(`Você pode escolher no máximo ${MAX_TRILHAS} trilhas. Desmarque uma para trocar.`);
        return p;
      }
      return [...p, t];
    });
  }

  function dispensar() {
    onDispensar?.();
    onFechar();
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={TITULO_SECAO}>Por onde você quer começar?</DialogTitle>
          <DialogDescription>
            Escolha até {MAX_TRILHAS} trilhas para personalizar o menu. Os atalhos fixos
            (Estúdio, Sugestões, DNA Visual, Comparar, Exportar e Configurações) continuam
            disponíveis. Dá para mudar depois no botão “Trilhas”.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          {TODAS_TRILHAS.map((key) => {
            const t = TRILHAS[key];
            const active = sel.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(key)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
                  FOCO,
                  active ? "border-primary bg-secondary/60" : "bg-card hover:bg-secondary/40",
                )}
              >
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{t.icon}</span>
                <span className="flex-1">
                  <span className="block font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.tagline}</span>
                </span>
                <span aria-hidden className={cn("text-xl", active ? "text-primary" : "text-muted-foreground/40")}>{active ? "✓" : "＋"}</span>
              </button>
            );
          })}
        </div>
        <div className="min-h-5">{aviso && <Aviso tom="atencao" className="py-2 text-sm">{aviso}</Aviso>}</div>
        <DialogFooter className="mt-2 flex-row items-center justify-between gap-3 sm:justify-between">
          <Button type="button" variant="ghost" onClick={dispensar}>Agora não</Button>
          <Button
            type="button"
            disabled={!sel.length}
            onClick={() => { salvarTrilhas(sel); onFechar(); }}
          >
            {sel.length ? `Começar com ${sel.length} ${sel.length === 1 ? "trilha" : "trilhas"}` : "Escolha ao menos 1"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
