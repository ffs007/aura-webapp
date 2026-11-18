import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { FeedbackButton } from "@/components/FeedbackButton";
import { GuiaRapidoAjuda } from "@/components/GuiaRapidoAjuda";
import { SCRIPT_ANTI_FLASH } from "@/hooks/useTema";
import { supabase } from "@/integrations/supabase/client";
import { iniciarInstrumentacao } from "@/lib/instrumentacao";
import { iniciarPixelMeta } from "@/lib/pixel-meta";
import { IMAGEM_COMPARTILHAMENTO, urlAbsoluta } from "@/lib/site";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p aria-hidden className="font-display text-7xl font-semibold text-foreground">404</p>
        <h1 className="mt-4 text-3xl">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild><Link to="/">Voltar ao início</Link></Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const semConexao = /NETWORK|fetch|network|failed to fetch|load failed|timed? ?out/i.test(String((error as Error | undefined)?.message ?? ""));
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div role="alert" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {semConexao ? "Parece que a conexão caiu" : "Esta página não carregou"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {semConexao
            ? "Não conseguimos falar com o servidor. Verifique sua internet e tente de novo — nada do que você fez foi perdido."
            : "Algo deu errado do nosso lado. Tente recarregar ou volte ao início."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recarregar a página
          </Button>
          <Button asChild variant="outline">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Aviso global quando o navegador fica sem conexão; some sozinho ao voltar. */
function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-sm text-white">
      <span>Sem conexão com a internet. Algumas ações podem falhar.</span>
      <button onClick={() => window.location.reload()} className="underline underline-offset-2">Tentar de novo</button>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aura ID — Sua identidade visual, com delicadeza" },
      { name: "description", content: "Companhia de identidade visual guiada por IA e emocionalmente segura." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Aura ID" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: urlAbsoluta(IMAGEM_COMPARTILHAMENTO) },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Aura ID — sua identidade visual, com delicadeza" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: urlAbsoluta(IMAGEM_COMPARTILHAMENTO) },
      { name: "theme-color", content: "#4A2036" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Karla:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        {/* Anti-flash: aplica o tema salvo ANTES da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_FLASH }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  // Instrumentação (Onda 3 · 2.7): telas visitadas e erros globais, uma vez só.
  // Pixel do Meta (opcional): só carrega se VITE_META_PIXEL_ID estiver definida.
  useEffect(() => {
    iniciarInstrumentacao();
    iniciarPixelMeta();
  }, []);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      else queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" />
      <GuiaRapidoAjuda />
      <FeedbackButton />
    </QueryClientProvider>
  );
}
