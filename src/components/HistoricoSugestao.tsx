import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Aviso, CarregandoInline, EstadoVazio, Meta, Secao } from "@/components/estados";
import { supabase } from "@/integrations/supabase/client";
import { CARTAO_COMPACTO } from "@/lib/design";
import { STATUS_LABEL } from "@/lib/aura";
import { cn } from "@/lib/utils";
import { duplicarSugestao, listarVersoes, type SugestaoDuplicavel } from "@/lib/duplicar";

const CLASSE_ABRIR = cn(buttonVariants({ size: "sm", variant: "ghost" }));

/** Rota de detalhe de cada tipo de sugestão — mantém "Abrir" dentro do módulo certo. */
function LinkAbrir({ kind, id, children, className }: { kind: string; id: string; children: ReactNode; className?: string }) {
  if (kind === "tattoo_plan") return <Link to="/tatuagem/plano/$id" params={{ id }} className={className}>{children}</Link>;
  if (kind === "makeup_look") return <Link to="/maquiagem/look/$id" params={{ id }} className={className}>{children}</Link>;
  if (kind === "hair_plan") return <Link to="/cabelo/plano/$id" params={{ id }} className={className}>{children}</Link>;
  if (kind === "outfit") return <Link to="/roupas/look/$id" params={{ id }} className={className}>{children}</Link>;
  return <Link to="/package/$id" params={{ id }} className={className}>{children}</Link>;
}

/**
 * "Histórico e versões" — linha do tempo das últimas 8 sugestões do mesmo tipo
 * e duplicação de qualquer versão (a original nunca é alterada). Sem coluna de
 * versão no banco: cada cópia é uma nova linha de `packages`.
 */
export function HistoricoSugestao({ kind, atualId }: { kind: string; atualId: string }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [duplicando, setDuplicando] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["versoes", kind],
    queryFn: async () => {
      const { data: sessao, error } = await supabase.auth.getUser();
      if (error || !sessao.user) throw new Error("Entre na sua conta para ver o histórico.");
      return listarVersoes(sessao.user.id, kind);
    },
  });

  const outras = (q.data ?? []).filter((v) => v.id !== atualId);

  function abrir(id: string) {
    if (kind === "tattoo_plan") void nav({ to: "/tatuagem/plano/$id", params: { id } });
    else if (kind === "makeup_look") void nav({ to: "/maquiagem/look/$id", params: { id } });
    else if (kind === "hair_plan") void nav({ to: "/cabelo/plano/$id", params: { id } });
    else if (kind === "outfit") void nav({ to: "/roupas/look/$id", params: { id } });
    else void nav({ to: "/package/$id", params: { id } });
  }

  async function duplicar(id: string) {
    if (duplicando) return;
    setDuplicando(id);
    try {
      const { data: linha, error } = await supabase
        .from("packages")
        .select("id,kind,entry_mode,emotional_mode,content,context,beautiful_not_practical")
        .eq("id", id)
        .maybeSingle();
      if (error || !linha) throw new Error("Não foi possível carregar esta sugestão. Tente de novo.");
      const { id: novoId } = await duplicarSugestao(linha as SugestaoDuplicavel);
      await qc.invalidateQueries({ queryKey: ["versoes", kind] });
      await qc.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Cópia criada — abrindo a nova sugestão.");
      abrir(novoId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível duplicar esta sugestão. Tente de novo.");
    } finally {
      setDuplicando(null);
    }
  }

  const rotuloData = (iso: string) => {
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? "data desconhecida" : data.toLocaleDateString("pt-BR");
  };

  return (
    <Secao
      titulo={
        <span className="inline-flex items-center gap-2">
          <History aria-hidden className="size-5 text-accent" />
          Histórico e versões
        </span>
      }
      descricao="Versões deste mesmo tipo. Abra para comparar, duplique para adaptar sem perder a original — duplicatas ficam marcadas como derivadas."
      acoes={
        <Button size="sm" variant="outline" disabled={duplicando !== null} onClick={() => void duplicar(atualId)}>
          {duplicando === atualId ? "Duplicando…" : "Duplicar esta sugestão"}
        </Button>
      }
    >
      {q.isLoading ? (
        <CarregandoInline rotulo="Carregando versões…" />
      ) : q.error ? (
        <Aviso
          tom="atencao"
          titulo="Não foi possível carregar o histórico"
          acoes={<Button size="sm" variant="outline" disabled={q.isFetching} onClick={() => void q.refetch()}>{q.isFetching ? "Tentando…" : "Tentar novamente"}</Button>}
        >
          {q.error instanceof Error ? q.error.message : "Tente de novo — nada foi perdido."}
        </Aviso>
      ) : outras.length === 0 ? (
        <EstadoVazio
          compacto
          titulo="Nenhuma outra versão ainda"
          descricao="Quando você duplicar esta sugestão — ou gerar outra do mesmo tipo — as versões aparecem aqui para comparar."
        />
      ) : (
        <ol className="space-y-2">
          {outras.map((v) => (
            <li key={v.id} className={cn(CARTAO_COMPACTO, "flex flex-wrap items-center justify-between gap-3 p-3")}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2">
                  <Meta>{rotuloData(v.created_at)}</Meta>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{STATUS_LABEL[v.status] ?? v.status}</span>
                  {v.versao_de && <span className="rounded-full border px-2 py-0.5 text-xs">derivada</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <LinkAbrir kind={kind} id={v.id} className={CLASSE_ABRIR}>Abrir</LinkAbrir>
                <Button size="sm" variant="outline" disabled={duplicando !== null} onClick={() => void duplicar(v.id)}>
                  {duplicando === v.id ? "Duplicando…" : "Duplicar"}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Secao>
  );
}
