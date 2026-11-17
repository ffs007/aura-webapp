import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { souAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiLabel, Indicators } from "@/components/PackageView";
import { StartPacks } from "@/components/StartPacks";
import { CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoLista } from "@/components/estados";
import { ENTRY_MODES, STATUS_LABEL, type PackageRow } from "@/lib/aura";
import { CARTAO_CLICAVEL, CARTAO_DESTAQUE, FOCO, TITULO_ITEM, TITULO_PAGINA } from "@/lib/design";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: z.object({ batch: z.string().optional() }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Suas sugestões — Aura ID" }, { name: "description", content: "Sugestões visuais integradas criadas para você." }, { property: "og:title", content: "Suas sugestões — Aura ID" }, { property: "og:description", content: "Sugestões visuais integradas criadas para você." }] }),
  component: Dashboard,
});

const FILTERS = [["all", "todas"], ["new", "novas"], ["saved", "salvas"], ["approved", "aprovadas"], ["rejected", "rejeitadas"]] as const;
type Ordem = "recentes" | "antigas" | "status";

function Dashboard() {
  const { batch } = Route.useSearch();
  const [filter, setFilter] = useState<string>("all");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const souAdminFn = useServerFn(souAdmin);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { souAdminFn().then((r) => setIsAdmin(r.admin)).catch(() => {}); }, []);
  const q = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PackageRow[];
    },
  });

  const all = q.data ?? [];
  const termo = busca.trim().toLowerCase();
  const list = useMemo(() => {
    const base = all
      .filter((p) => (batch ? p.batch_id === batch : true))
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => !termo || `${p.content.title} ${p.content.invitation}`.toLowerCase().includes(termo));
    const ordenada = [...base];
    if (ordem === "antigas") ordenada.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (ordem === "status") ordenada.sort((a, b) => String(a.status).localeCompare(String(b.status)));
    else ordenada.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ordenada;
  }, [all, batch, filter, termo, ordem]);

  if (q.isLoading) return <EsqueletoLista itens={4} altura="h-48" />;
  if (q.error) return <EstadoErro titulo="Não conseguimos carregar suas sugestões" onTentarNovamente={() => void q.refetch()} recarregando={q.isFetching} />;

  const guia = (
    <div className={cn(CARTAO_DESTAQUE, "mb-8 flex flex-wrap items-center justify-between gap-4")}>
      <div>
        <p className="text-sm font-medium">Primeira vez? Comece pelo guia — e crie seu 👤 Meu Modelo</p>
        <p className="mt-1 text-xs text-muted-foreground">5 passos com exemplos. Com o modelo pronto, toda simulação sai com a sua cara.</p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/guia">Abrir o guia</Link></Button>
        <Button asChild size="sm"><Link to="/modelo">👤 Meu Modelo</Link></Button>
      </div>
    </div>
  );

  if (!all.length) return (
    <div className="mx-auto max-w-5xl space-y-8 py-10">
      <div className="text-center">
        <h1 className={TITULO_PAGINA}>Vamos começar?</h1>
        <p className="mt-2 text-muted-foreground">Escolha uma situação da vida real abaixo ou abra o Estúdio para montar seu primeiro convite. Você ajusta tudo depois.</p>
        <Button asChild className="mt-5"><Link to="/studio">Abrir o Estúdio</Link></Button>
      </div>
      <StartPacks limite={6} />
      {guia}
    </div>
  );

  const counts: Record<string, number> = {
    all: all.length,
    new: all.filter((p) => p.status === "new").length,
    saved: all.filter((p) => p.status === "saved").length,
    approved: all.filter((p) => p.status === "approved").length,
    rejected: all.filter((p) => p.status === "rejected").length,
  };

  return (
    <div>
      {guia}
      {isAdmin && (
        <div className="mb-4">
          <Button asChild size="sm" variant="outline"><Link to="/admin">🛠️ Painel admin — catálogo parceiro</Link></Button>
        </div>
      )}
      <CabecalhoPagina
        titulo={batch ? "Sugestões novas" : "Suas sugestões"}
        descricao="Cada uma é uma hipótese para brincar — fique com o que fizer sentido."
        acoes={batch && <Button asChild variant="outline"><Link to="/dashboard" search={{}}>Ver todas</Link></Button>}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map(([f, l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(FOCO, "rounded-full px-3 py-1 text-sm capitalize", filter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}
          >
            {l} ({counts[f] ?? 0})
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            aria-label="Buscar sugestões"
            className="h-9 w-52"
            placeholder="Buscar por título ou resumo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            aria-label="Ordenar sugestões"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="status">Por status</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((p) => (
          <Link key={p.id} to={p.kind === "tattoo_plan" ? "/tatuagem/plano/$id" : p.kind === "makeup_look" ? "/maquiagem/look/$id" : p.kind === "hair_plan" ? "/cabelo/plano/$id" : p.kind === "outfit" ? "/roupas/look/$id" : "/package/$id"} params={{ id: p.id }} className={cn(CARTAO_CLICAVEL, "animate-rise")}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{p.kind === "makeup_look" ? "Maquiagem · look" : ENTRY_MODES.find((m) => m.id === p.entry_mode)?.label ?? p.entry_mode}</span>
              <div className="flex items-center gap-2">{p.status !== "new" && <span className="text-xs capitalize text-accent">{STATUS_LABEL[p.status]}</span>}<AiLabel /></div>
            </div>
            <h2 className={cn(TITULO_ITEM, "mt-2")}>{p.content.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content.invitation}</p>
            <div className="mt-4"><Indicators c={p.content} /></div>
            {p.beautiful_not_practical && <p className="mt-3 text-xs italic text-muted-foreground">Bonito, mas não prático</p>}
          </Link>
        ))}
        {!list.length && (
          <EstadoVazio
            className="md:col-span-2"
            compacto
            icone={<SearchX aria-hidden className="size-5" />}
            titulo={termo ? "Nenhuma sugestão encontrada" : "Nenhuma sugestão neste filtro"}
            descricao={termo ? `Não encontramos nada para “${busca.trim()}”.` : "Troque o filtro ou crie uma nova exploração no Estúdio."}
            acoes={<Button size="sm" variant="outline" onClick={() => { setBusca(""); setFilter("all"); }}>Limpar busca e filtros</Button>}
          />
        )}
      </div>
    </div>
  );
}
