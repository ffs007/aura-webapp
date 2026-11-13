import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EsqueletoLista, EstadoErro, EstadoVazio } from "@/components/estados";
import { AiLabel } from "@/components/PackageView";
import { CARTAO_CLICAVEL, CARTAO_DESTAQUE, FOCO, GRADE_CARTOES, TITULO_ITEM } from "@/lib/design";
import { OUTFIT_STATUS, type Outfit } from "@/lib/clothing";
import { cn } from "@/lib/utils";

const META = "Seus looks gerados, em teste e já usados.";
export const Route = createFileRoute("/_authenticated/roupas/")({
  head: () => ({ meta: [{ title: "Meus looks de roupa — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Meus looks de roupa — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Looks,
});

function Looks() {
  const [f, setF] = useState("all");
  const q = useQuery({ queryKey: ["outfits"], queryFn: async () => {
    const { data, error } = await supabase.from("packages").select("*").eq("kind", "outfit").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  if (q.isLoading) return <EsqueletoLista itens={2} altura="h-40" />;
  if (q.error) return <EstadoErro titulo="Não foi possível carregar seus looks" descricao="Tente de novo — nada do que você fez foi perdido." onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;
  const all = q.data ?? [];
  const testing = all.filter((p) => p.status === "testing");
  if (!all.length) return (
    <EstadoVazio
      icone={<Shirt className="size-6" />}
      tom="destaque"
      titulo="Nenhum look ainda"
      descricao="Cadastre algumas peças (pode ser à mão) e escolha uma ocasião."
      acoes={<><Button asChild variant="outline"><Link to="/roupas/armario">Guarda-roupa</Link></Button><Button asChild><Link to="/roupas/gerar">Gerar looks</Link></Button></>}
    />
  );
  const list = all.filter((p) => f === "all" || p.status === f);
  return (
    <div className="space-y-6">
      {testing.length > 0 && <div className={`${CARTAO_DESTAQUE} text-sm`}>Você tem {testing.length} {testing.length === 1 ? "look" : "looks"} em teste. Usou? Conte como foi no look.</div>}
      <div className="flex flex-wrap gap-2">{[["all", "todos"], ...Object.entries(OUTFIT_STATUS)].map(([k, l]) => <button key={k} onClick={() => setF(k ?? "all")} aria-pressed={f === k} className={cn("rounded-full px-3 py-1 text-sm", FOCO, f === k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{l}</button>)}</div>
      <div className={GRADE_CARTOES}>
        {list.map((p) => {
          const c = p.content as unknown as Outfit;
          return (
            <Link key={p.id} to="/roupas/look/$id" params={{ id: p.id }} className={CARTAO_CLICAVEL}>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{(p.context as { occasion?: string })?.occasion}</span><div className="flex gap-2">{p.status !== "new" && <span className="text-accent">{OUTFIT_STATUS[p.status]}</span>}<AiLabel /></div></div>
              <h3 className={`mt-2 ${TITULO_ITEM}`}>{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.invitation}</p>
              <div className="mt-3 flex flex-wrap gap-1">{c.colors?.map((x) => <span key={x} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{x}</span>)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
