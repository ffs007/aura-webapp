import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";
import { downloadText, logEvent } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/dna/redefinir")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Redefinir e excluir — DNA Visual — Aura ID" }, { name: "description", content: "Redefina, exclua ou exporte seu DNA Visual." }, { property: "og:title", content: "Redefinir e excluir — DNA Visual — Aura ID" }, { property: "og:description", content: "Redefina, exclua ou exporte seu DNA Visual." }] }),
  component: Reset,
});

function Reset() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  async function run(label: string, fn: () => PromiseLike<{ error: unknown }>, scope: string) {
    const { error } = await fn();
    if (error) { toast.error(`Não foi possível ${label}.`); return; }
    await logEvent("data_deleted", { scope });
    toast.success("Feito");
    qc.invalidateQueries();
  }

  async function resetDna() {
    await logEvent("reset_requested");
    await run("redefinir", () => supabase.from("visual_dna").delete().eq("user_id", user.id), "visual_dna");
  }

  async function exportAll() {
    const tables = ["visual_profiles", "preferences", "consents", "visual_dna", "dna_versions", "dna_corrections", "feedback", "packages", "collections", "reminders", "photos", "audit_events"] as const;
    const out: Record<string, unknown> = { exportado_em: new Date().toISOString() };
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data ?? [];
    downloadText("aura-id-meus-dados.json", JSON.stringify(out, null, 2), "application/json");
    await logEvent("data_exported");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-2xl">Exportar meus dados</h2>
        <p className="text-sm text-muted-foreground">Baixe um arquivo com seu perfil, preferências, DNA Visual, versões, correções, feedback e sugestões. As fotos em si não entram no arquivo — só as referências a elas.</p>
        <Button className="mt-3" variant="secondary" onClick={exportAll}>Baixar (JSON)</Button>
      </div>
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="text-2xl">Redefinir</h2>
        <p className="text-sm text-muted-foreground">Recomece seu DNA Visual mantendo o perfil e as preferências.</p>
        <div className="flex flex-wrap gap-2">
          <Confirm label="Redefinir DNA Visual" action="Redefinir" desc="Apaga o resumo e os sinais atuais. Perfil, preferências e versões antigas continuam." onYes={resetDna} />
          <Confirm label="Excluir sinais" desc="Remove todos os sinais aprendidos, mantendo o resumo." onYes={() => run("excluir os sinais", () => supabase.from("visual_dna").update({ signals: [], signals_since_review: 0 }).eq("user_id", user.id), "signals")} />
          <Confirm label="Excluir histórico de versões" desc="Todas as versões anteriores serão apagadas." onYes={() => run("excluir as versões", () => supabase.from("dna_versions").delete().eq("user_id", user.id), "dna_versions")} />
          <Confirm label="Excluir correções" desc="A IA deixará de considerar as correções que você fez." onYes={() => run("excluir as correções", () => supabase.from("dna_corrections").delete().eq("user_id", user.id), "dna_corrections")} />
          <Confirm label="Excluir preferências" desc="Cores, estilos e limites salvos serão apagados." onYes={() => run("excluir as preferências", () => supabase.from("preferences").delete().eq("user_id", user.id), "preferences")} />
        </div>
      </div>
      <div className="rounded-2xl border border-destructive/40 p-5">
        <p className="text-sm">Para excluir tudo, inclusive a conta, vá em <Link to="/settings" className="underline">Configurações</Link>.</p>
      </div>
    </div>
  );
}
