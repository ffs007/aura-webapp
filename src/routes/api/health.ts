import { createFileRoute } from "@tanstack/react-router";

/**
 * Health check público para monitoramento (UptimeRobot/Better Stack/cron).
 *
 * Não expõe segredo nem dado de usuário: apenas presença de configuração,
 * alcance do banco e metadados de build. Responde 200 quando saudável e 503
 * quando algo essencial está fora — é o que o monitor deve usar como gatilho.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["SUPABASE_URL"];
        const chave = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const checks: { configuracao: boolean; banco: boolean } = { configuracao: Boolean(url && chave), banco: false };

        if (url && chave) {
          try {
            const res = await fetch(`${url}/rest/v1/`, {
              headers: { apikey: chave },
              signal: AbortSignal.timeout(3_000),
            });
            // 200/401/404 significam "banco respondeu"; 5xx e timeout são falha.
            checks.banco = res.status < 500;
          } catch {
            checks.banco = false;
          }
        }

        const saudavel = checks.configuracao === true && checks.banco === true;
        return Response.json(
          {
            ok: saudavel,
            servico: "aura-id-webapp",
            versao: process.env["npm_package_version"] ?? "webapp",
            commit: process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 7) ?? null,
            ambiente: process.env["VERCEL_ENV"] ?? "local",
            tempo: new Date().toISOString(),
            checks,
          },
          { status: saudavel ? 200 : 503, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
