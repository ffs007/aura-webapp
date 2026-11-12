import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { routeTree } from "./routeTree.gen";

/**
 * Feedback de carregamento de rotas: nunca mais tela branca/"congelada".
 * Depois de 12 s mostra uma saída clara para conexão lenta ou falha — sem
 * deixar a pessoa presa em "Preparando…" para sempre.
 */
function Carregando() {
  const [demorando, setDemorando] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDemorando(true), 12000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Carregando">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center text-muted-foreground">
        <span className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm">Preparando…</p>
        {demorando && (
          <>
            <p className="text-xs">Está demorando mais que o normal. Sua conexão pode estar lenta.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border px-3 py-1 text-xs text-foreground hover:bg-secondary"
            >
              Recarregar a página
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: Carregando,
    defaultPendingMs: 300,
  });

  return router;
};
