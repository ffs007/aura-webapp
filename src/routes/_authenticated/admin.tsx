import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CabecalhoPagina, CarregandoInline, CarregandoPagina, Cartao, EstadoErro, EstadoVazio, Aviso } from "@/components/estados";
import { TITULO_SECAO } from "@/lib/design";
import { adminStats } from "@/lib/aura.functions";
import { funilInstrumentacao, errosInstrumentacao, custosInstrumentacao, type FunilResposta, type ErrosResposta, type CustosResposta } from "@/lib/instrumentacao.functions";
import { fmtDateTime } from "@/lib/aura";
import { CatalogManager } from "@/components/CatalogManager";
import { ParceirosManager } from "@/components/ParceirosManager";
import { FeedbackAdmin } from "@/components/FeedbackAdmin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Admin — Aura ID" }, { name: "description", content: "Uso, auditoria de consentimento e segurança de conteúdo." }, { property: "og:title", content: "Admin — Aura ID" }, { property: "og:description", content: "Uso, auditoria de consentimento e segurança de conteúdo." }] }),
  component: Admin,
});

const CONNECTORS = [
  ["Contas e login", "Ativo"], ["Banco de dados", "Ativo"], ["Armazenamento privado de fotos", "Ativo"], ["Sugestões e DNA Visual por IA", "Ativo"],
  ["Exportação Google Docs / Drive", "Não conectado"], ["Lembretes por e-mail / SMS", "Não conectado"], ["Catálogo via Google Sheets / Airtable", "Não conectado (usando catálogo interno)"],
  ["RA em tempo real, correção por vídeo, simulação facial, guia na tela", "No roteiro — ainda não disponível nesta versão"],
  ["Relatórios da Jornada (Google Docs/Notion) e lembretes por Gmail/Telegram/Twilio", "Não conectado — relatórios e lembretes ficam no app"],
  ["Provador fotorrealista, simulação de cabelo, RA, tatuagem em movimento, vídeo ao vivo", "No roteiro — ainda não disponível nesta versão"],
];

function Admin() {
  const stats = useServerFn(adminStats);
  const funil = useServerFn(funilInstrumentacao);
  const erros = useServerFn(errosInstrumentacao);
  const custos = useServerFn(custosInstrumentacao);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin"], queryFn: () => stats() });
  const fq = useQuery({ queryKey: ["admin-funil"], queryFn: () => funil(), enabled: q.data?.allowed === true, retry: false, staleTime: 60_000 });
  const eq = useQuery({ queryKey: ["admin-erros"], queryFn: () => erros(), enabled: q.data?.allowed === true, retry: false, staleTime: 60_000 });
  const cq = useQuery({ queryKey: ["admin-custos"], queryFn: () => custos(), enabled: q.data?.allowed === true, retry: false, staleTime: 60_000 });
  const [terms, setTerms] = useState("");
  const [tattooWarning, setTattooWarning] = useState("");
  useEffect(() => { supabase.from("safety_config").select("blocked_terms,tattoo_disclaimer").eq("id", 1).maybeSingle().then(({ data }) => { setTerms((data?.blocked_terms ?? []).join(", ")); setTattooWarning(data?.tattoo_disclaimer ?? ""); }); }, []);

  if (q.isLoading) return <CarregandoPagina rotulo="Carregando painel admin…" />;
  if (q.error) return (
    <EstadoErro
      titulo="Não foi possível carregar os dados do admin."
      onTentarNovamente={() => void q.refetch()}
      recarregando={q.isFetching}
    />
  );
  if (!q.data?.allowed) return (
    <EstadoVazio
      compacto
      icone={<Lock />}
      titulo="Esta área é só para administradores."
    />
  );
  const d = q.data;

  async function saveTerms() {
    const { error } = await supabase.from("safety_config").update({ blocked_terms: terms.split(",").map((t) => t.trim()).filter(Boolean), updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error("Não foi possível salvar as palavras bloqueadas. Tente de novo."); return; }
    toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] });
  }

  return (
    <div className="space-y-10">
      <CabecalhoPagina titulo="Admin" />
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(d.totals).map(([k, v]) => <Cartao compacto key={k}><div className="text-sm capitalize text-muted-foreground">{k}</div><div className="font-display text-5xl">{v}</div></Cartao>)}
      </div>
      <section><h2 className={TITULO_SECAO}>Auditoria de consentimento</h2>
        <p className="mt-2 text-sm">{d.consent.total} consentiram · fotos {d.consent.photo} · personalização {d.consent.personalization} · DNA pausado {d.consent.paused} · lembretes {d.consent.reminders}</p></section>
      <section><h2 className={TITULO_SECAO}>Eventos</h2>
        <div className="mt-3 flex flex-wrap gap-2">{Object.entries(d.counts).map(([k, v]) => <span key={k} className="rounded-full bg-secondary px-3 py-1 text-sm">{k}: {v}</span>)}</div>
        <ul className="mt-4 space-y-1 text-xs text-muted-foreground">{d.recent.map((e, i) => <li key={i}>{fmtDateTime(e.created_at)} — {e.event}</li>)}</ul></section>
      <section><h2 className={TITULO_SECAO}>Funil (7 dias)</h2>
        <p className="mt-2 text-sm text-muted-foreground">Contagens anônimas dos passos-chave e das telas visitadas — sem nomes, e-mails ou conteúdo.</p>
        {fq.isLoading && <CarregandoInline rotulo="Carregando o funil dos últimos 7 dias…" className="mt-3" />}
        {fq.error && <EstadoErro className="mt-3" titulo="Não foi possível carregar o funil" onTentarNovamente={() => void fq.refetch()} recarregando={fq.isFetching} />}
        {fq.data && (fq.data.ok ? <FunilPainel dados={fq.data} /> : <Aviso tom="atencao" titulo="Funil indisponível" className="mt-3">{fq.data.motivo}</Aviso>)}
      </section>
      <section><h2 className={TITULO_SECAO}>Erros de tela (24 h)</h2>
        <p className="mt-2 text-sm text-muted-foreground">Capturados no navegador como <code>erro_tela</code>, agrupados por rota e mensagem. Só caminho e mensagem truncada — sem nomes, e-mails ou conteúdo.</p>
        {eq.isLoading && <CarregandoInline rotulo="Carregando erros recentes…" className="mt-3" />}
        {eq.error && <EstadoErro className="mt-3" titulo="Não foi possível carregar os erros" onTentarNovamente={() => void eq.refetch()} recarregando={eq.isFetching} />}
        {eq.data && (eq.data.ok ? <ErrosPainel dados={eq.data} /> : <Aviso tom="atencao" titulo="Erros indisponíveis" className="mt-3">{eq.data.motivo}</Aviso>)}
      </section>
      <section><h2 className={TITULO_SECAO}>Custo de IA (30 dias)</h2>
        <p className="mt-2 text-sm text-muted-foreground">Custo real registrado em <code>core.ai_runs</code>. É o que o gateway usa para o uso justo e o orçamento diário.</p>
        {cq.isLoading && <CarregandoInline rotulo="Carregando custos…" className="mt-3" />}
        {cq.error && <EstadoErro className="mt-3" titulo="Não foi possível carregar os custos" onTentarNovamente={() => void cq.refetch()} recarregando={cq.isFetching} />}
        {cq.data && (cq.data.ok ? <CustosPainel dados={cq.data} /> : <Aviso tom="atencao" titulo="Custos indisponíveis" className="mt-3">{cq.data.motivo}</Aviso>)}
      </section>
      <section><h2 className={TITULO_SECAO}>Status das integrações</h2>
        <ul className="mt-3 space-y-1 text-sm">{CONNECTORS.map(([n, s]) => <li key={n} className="flex justify-between gap-4 border-b py-1"><span>{n}</span><span className="text-right text-muted-foreground">{n?.startsWith("Sugestões") && !d.aiConfigured ? "Não configurado" : s}</span></li>)}</ul></section>
      <section><h2 className={TITULO_SECAO}>Diretrizes de linguagem da Jornada</h2><ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground"><li>Encorajar, nunca cobrar progresso.</li><li>“Não funcionou” é aprendizado.</li><li>Relatórios enfatizam aprendizado, nunca comparação.</li><li>Notas emocionais nunca são exportadas nem compartilhadas; admins não veem fotos, notas ou reflexões.</li></ul></section>
      <CatalogManager />
      <ParceirosManager />
      <FeedbackAdmin />
      <section className="space-y-3"><h2 className={TITULO_SECAO}>Segurança em tatuagens</h2><p className="text-sm text-muted-foreground">Aviso profissional exibido nos projetos e utilizado na geração. Não há acesso a fotos corporais, intenções privadas nem diário.</p><Textarea aria-label="Aviso de segurança de tatuagens" value={tattooWarning} onChange={e => setTattooWarning(e.target.value)} /><Button disabled={!tattooWarning.trim()} onClick={async () => { const { error } = await supabase.from("safety_config").update({ tattoo_disclaimer: tattooWarning.trim(), updated_at: new Date().toISOString() }).eq("id", 1); if (error) { toast.error("Não foi possível salvar o aviso. Tente de novo."); return; } qc.invalidateQueries(); toast.success("Aviso salvo."); }}>Salvar aviso</Button></section>
      <section><h2 className={TITULO_SECAO}>Segurança de conteúdo</h2>
        <p className="text-sm text-muted-foreground">Palavras que a IA deve evitar (separadas por vírgula).</p>
        <Textarea className="mt-2" value={terms} onChange={(e) => setTerms(e.target.value)} />
        <Button className="mt-2" onClick={saveTerms}>Salvar</Button></section>
      <p className="text-xs text-muted-foreground">Os detalhes dos erros ficam nos logs do servidor; aqui aparecem só contagens. Fotos privadas nunca aparecem nesta área. Métricas sem identificar pessoas.</p>
    </div>
  );
}

type FunilOk = Extract<FunilResposta, { ok: true }>;
type ErrosOk = Extract<ErrosResposta, { ok: true }>;
type CustosOk = Extract<CustosResposta, { ok: true }>;

function CustosPainel({ dados }: { dados: CustosOk }) {
  const usd = (valor: number) => `US$ ${valor.toFixed(2).replace(".", ",")}`;
  const alerta = dados.hojeUsd >= dados.orcamentoDiarioReferenciaUsd * 0.8;
  return (
    <div className="mt-3 space-y-5">
      {alerta && (
        <Aviso tom="atencao" titulo="Custo de hoje perto do orçamento">
          {usd(dados.hojeUsd)} de referência {usd(dados.orcamentoDiarioReferenciaUsd)}. Se o orçamento do gateway for atingido, as imagens pausam automaticamente.
        </Aviso>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao compacto><div className="text-sm text-muted-foreground">Últimos {dados.janelaDias} dias</div><div className="font-display text-4xl">{usd(dados.totalUsd)}</div></Cartao>
        <Cartao compacto><div className="text-sm text-muted-foreground">Hoje</div><div className="font-display text-4xl">{usd(dados.hojeUsd)}</div></Cartao>
        <Cartao compacto><div className="text-sm text-muted-foreground">Imagens geradas</div><div className="font-display text-4xl">{dados.imagens}</div></Cartao>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Top 5 por custo</h3>
          {dados.topUsuarios.length ? (
            <ol className="mt-2 space-y-1 text-sm">
              {dados.topUsuarios.map((u) => (
                <li key={u.usuario} className="flex items-baseline justify-between gap-3 border-b py-1">
                  <span className="font-mono text-xs text-muted-foreground">{u.usuario.slice(0, 8)}…</span>
                  <span>{usd(u.custoUsd)} · {u.runs} runs</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-2 text-sm text-muted-foreground">Nenhuma execução no período.</p>}
        </div>
        <div>
          <h3 className="text-sm font-medium">Últimos 7 dias</h3>
          <table className="mt-2 w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-normal">Dia</th><th className="font-normal">Custo</th></tr></thead>
            <tbody>{dados.serie.map((d) => <tr key={d.dia} className="border-t"><td className="py-1">{d.dia}</td><td>{usd(d.custoUsd)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ErrosPainel({ dados }: { dados: ErrosOk }) {
  return (
    <div className="mt-3 space-y-5">
      {dados.alerta && (
        <Aviso tom="atencao" titulo="Volume de erros acima do normal">
          {dados.naUltimaHora} erro(s) na última hora e {dados.total} nas últimas {dados.janelaHoras} h.
          Verifique <code>/api/health</code>, os logs do Vercel e o último deploy antes de convidar mais gente.
        </Aviso>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao compacto><div className="text-sm text-muted-foreground">Últimas {dados.janelaHoras} h</div><div className="font-display text-4xl">{dados.total}</div></Cartao>
        <Cartao compacto><div className="text-sm text-muted-foreground">Última hora</div><div className="font-display text-4xl">{dados.naUltimaHora}</div></Cartao>
        <Cartao compacto><div className="text-sm text-muted-foreground">Grupos distintos</div><div className="font-display text-4xl">{dados.grupos.length}</div></Cartao>
      </div>
      {dados.grupos.length ? (
        <ol className="space-y-2">
          {dados.grupos.map((g) => (
            <li key={`${g.path}|${g.mensagem}`} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{g.path}</span>
                <span className="text-xs text-muted-foreground">{g.total}x · último {fmtDateTime(g.ultimo)}</span>
              </div>
              <p className="mt-1 break-words text-xs text-muted-foreground">{g.mensagem}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum erro de tela registrado no período.</p>
      )}
    </div>
  );
}

function FunilPainel({ dados }: { dados: FunilOk }) {
  const inicio = new Date(dados.janela.de).toLocaleDateString("pt-BR");
  const fim = new Date(dados.janela.ate).toLocaleDateString("pt-BR");
  return (
    <div className="mt-3 space-y-5">
      <p className="text-xs text-muted-foreground">{dados.totalEventos} eventos registrados entre {inicio} e {fim} · leitura limitada aos 5.000 mais recentes.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dados.passos.map((p) => (
          <Cartao compacto key={p.evento}>
            <div className="text-sm text-muted-foreground">{p.nome}</div>
            <div className="font-display text-4xl">{p.total}</div>
            <div className="text-xs text-muted-foreground">{p.percentualDoAnterior === null ? "início do funil" : `${p.percentualDoAnterior}% do passo anterior`}</div>
          </Cartao>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Top 5 eventos</h3>
          {dados.topEventos.length ? (
            <ol className="mt-2 space-y-1 text-sm">{dados.topEventos.map((e) => <li key={e.evento} className="flex items-baseline justify-between gap-3 border-b py-1"><span className="break-all text-xs text-muted-foreground">{e.evento}</span><span className="font-medium">{e.total}</span></li>)}</ol>
          ) : <p className="mt-2 text-sm text-muted-foreground">Nenhum evento registrado neste período.</p>}
        </div>
        <div>
          <h3 className="text-sm font-medium">Série de 7 dias</h3>
          <table className="mt-2 w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-normal">Dia</th><th className="font-normal">Eventos</th><th className="font-normal">Telas</th><th className="font-normal">Erros</th></tr></thead>
            <tbody>{dados.serie.map((d) => <tr key={d.dia} className="border-t"><td className="py-1">{d.rotulo}</td><td>{d.total}</td><td>{d.telas}</td><td>{d.erros}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
