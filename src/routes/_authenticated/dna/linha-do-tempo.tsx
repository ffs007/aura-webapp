import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EstadoErro, EstadoVazio, EsqueletoLista } from "@/components/estados";
import { FOCO, META } from "@/lib/design";
import { ENTRY_MODES, fmtDateTime } from "@/lib/aura";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dna/linha-do-tempo")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Linha do tempo — DNA Visual — Aura ID" }, { name: "description", content: "Todos os sinais que formam seu DNA Visual." }, { property: "og:title", content: "Linha do tempo — DNA Visual — Aura ID" }, { property: "og:description", content: "Todos os sinais que formam seu DNA Visual." }] }),
  component: Timeline,
});

const LABEL: Record<string, string> = {
  recommendation_saved: "Salvou uma sugestão", recommendation_approved: "Aprovou uma sugestão", recommendation_rejected: "Rejeitou uma sugestão",
  marked_not_practical: "Marcou como bonito, mas não prático", feedback_given: "Deu feedback", inference_corrected: "Corrigiu uma inferência",
  preferences_updated: "Atualizou preferências", profile_created: "Criou o perfil", version_created: "Nova versão do DNA",
  look_saved: "Salvou um look", look_rejected: "Rejeitou um look", feedback_submitted: "Deu feedback", look_generated: "Gerou looks", makeup_profile_updated: "Atualizou o perfil de pele",
  consent_changed: "Mudou um consentimento", cross_module_enabled: "Ativou a personalização entre módulos", reset_requested: "Pediu redefinição", data_deleted: "Excluiu dados",
};
const MODS = [["all", "Todos"], ["makeup", "Maquiagem"], ["hair", "Cabelo"], ["clothing", "Roupas"], ["tattoo", "Tatuagem"], ["other", "Outros"]] as const;

function Timeline() {
  const [mod, setMod] = useState("all");
  const q = useQuery({
    queryKey: ["timeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_events").select("*").in("event", Object.keys(LABEL)).order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <EsqueletoLista itens={5} colunas={1} altura="h-16" />;
  if (q.error) return (
    <EstadoErro
      titulo="Não foi possível carregar a linha do tempo."
      onTentarNovamente={() => void q.refetch()}
      recarregando={q.isFetching}
    />
  );
  const list = (q.data ?? []).filter((e) => {
    const m = (e.meta as { module?: string })?.module;
    if (mod === "all") return true;
    if (mod === "other") return !m || !["makeup", "hair", "clothing", "tattoo"].includes(m);
    return m === mod;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">{MODS.map(([k, l]) => <button key={k} onClick={() => setMod(k)} aria-pressed={mod === k} className={cn("rounded-full px-3 py-1 text-sm", FOCO, mod === k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{l}</button>)}</div>
      {!list.length ? (
        <EstadoVazio
          compacto
          icone={<History />}
          titulo="Nenhum sinal ainda"
          descricao="Reaja às sugestões, dê feedback ou edite suas preferências."
          acoes={<Button asChild size="sm" variant="outline"><Link to="/dna/preferencias">Editar preferências</Link></Button>}
        />
      ) : (
        <ol className="relative space-y-4 border-l pl-6">
          {list.map((e) => {
            const meta = e.meta as { module?: string; field?: string; scope?: string };
            const modLabel = ENTRY_MODES.find((m) => m.id === meta.module)?.label;
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="text-sm">{LABEL[e.event] ?? e.event}{modLabel && <span className="text-muted-foreground"> · {modLabel}</span>}{meta.field && <span className="text-muted-foreground"> · {meta.field}</span>}{meta.scope && <span className="text-muted-foreground"> · {meta.scope}</span>}</div>
                <div className={META}>{fmtDateTime(e.created_at)}</div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
