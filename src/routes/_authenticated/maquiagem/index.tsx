import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EsqueletoLista, EstadoErro, EstadoVazio } from "@/components/estados";
import { AiLabel, Indicators } from "@/components/PackageView";
import { CARTAO_CLICAVEL, FOCO, GRADE_CARTOES, TITULO_ITEM } from "@/lib/design";
import { STATUS_LABEL, type AuraPackage } from "@/lib/aura";
import { MAKEUP_MODES } from "@/lib/makeup";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/maquiagem/")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Meus looks de maquiagem — Aura ID" }, { name: "description", content: "Looks de maquiagem gerados para você." }, { property: "og:title", content: "Meus looks de maquiagem — Aura ID" }, { property: "og:description", content: "Looks de maquiagem gerados para você." }] }),
  component: Looks,
});

const FILTERS = [["all", "todos"], ["new", "novos"], ["saved", "salvos"], ["approved", "aprovados"], ["rejected", "rejeitados"]] as const;

function Looks() {
  const [f, setF] = useState("all");
  const q = useQuery({
    queryKey: ["makeup-looks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("kind", "makeup_look").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <EsqueletoLista itens={2} altura="h-40" />;
  if (q.error) return <EstadoErro titulo="Não foi possível carregar seus looks" descricao="Tente de novo — nada do que você fez foi perdido." onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;
  const all = q.data ?? [];
  if (!all.length) return (
    <EstadoVazio
      icone={<Sparkles className="size-6" />}
      tom="destaque"
      titulo="Nenhum look ainda"
      descricao="Preencha seu perfil de pele e gere os primeiros looks."
      acoes={<><Button asChild variant="outline"><Link to="/maquiagem/perfil">Perfil de pele</Link></Button><Button asChild><Link to="/maquiagem/gerar">Gerar looks</Link></Button></>}
    />
  );
  const list = all.filter((p) => f === "all" || p.status === f);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">{FILTERS.map(([k, l]) => <button key={k} onClick={() => setF(k)} aria-pressed={f === k} className={cn("rounded-full px-3 py-1 text-sm", FOCO, f === k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{l}</button>)}</div>
      <div className={GRADE_CARTOES}>
        {list.map((p) => {
          const c = p.content as unknown as AuraPackage;
          const mode = MAKEUP_MODES.find((m) => m.id === (p.context as { mode?: string })?.mode)?.label;
          return (
            <Link key={p.id} to="/maquiagem/look/$id" params={{ id: p.id }} className={CARTAO_CLICAVEL}>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{mode}</span><div className="flex items-center gap-2">{p.status !== "new" && <span className="text-accent">{STATUS_LABEL[p.status]}</span>}<AiLabel /></div></div>
              <h3 className={`mt-2 ${TITULO_ITEM}`}>{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.invitation}</p>
              <div className="mt-4"><Indicators c={c} /></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
