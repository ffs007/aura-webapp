import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Scissors } from "lucide-react";
import { generateBeardPlan } from "@/lib/beard.functions";
import { editarRetrato } from "@/lib/retrato.functions";
import { PresentationChoice } from "@/components/PresentationChoice";
import { EnviarBriefing } from "@/components/EnviarBriefing";
import { QuotaChip } from "@/components/QuotaChip";
import { PaywallCard } from "@/components/PaywallCard";
import { Aviso, CabecalhoPagina, EstadoVazio } from "@/components/estados";
import { CARTAO_COMPACTO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
export const Route = createFileRoute("/_authenticated/barba")({ head: () => ({ meta: [{ title: "Barba — Aura ID" }, { name: "description", content: "Desenho, comprimento, rotina e guia de barbearia no seu ritmo." }, { property: "og:title", content: "Barba — Aura ID" }, { property: "og:description", content: "Explore barba e bigode com escolhas graduais e cuidados respeitosos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Beard });
const fields = [["length", "Comprimento atual", "ex.: curta, 5 mm"], ["density", "Densidade percebida", "ex.: distribuída, áreas com menos pelos"], ["mustache", "Bigode", "ex.: aparado, sem bigode"], ["style", "Estilo desejado", "ex.: barba curta com contornos suaves"], ["sensitivity", "Sensibilidade informada (opcional)", "ex.: irritação após barbear"], ["time", "Tempo disponível", "ex.: 5 minutos por dia"], ["budget", "Orçamento", "ex.: prefiro cuidar em casa"]];

/** E3 — estilos de barba prontos pra provar na foto do modelo (alvo "barba" ONLY). */
const PRESETS_BARBA: [string, string][] = [
  ["Raspada", "barba totalmente raspada, pele lisa, sem sombra de pelos"],
  ["Curta aparada", "barba curta e bem aparada (~3 mm), contornos definidos"],
  ["Cavanhaque", "somente cavanhaque conectado ao bigode, bochechas raspadas"],
  ["Cheia", "barba cheia e densa, comprimento médio, aspecto natural"],
  ["Desenhada", "barba desenhada com contornos nítidos e linha no maxilar"],
  ["Bigode clássico", "somente bigode clássico aparado, restante do rosto raspado"],
];
function Beard() {
  const { user } = Route.useRouteContext(); const nav = useNavigate(), qc = useQueryClient(), generate = useServerFn(generateBeardPlan);
  const [data, setData] = useState<Record<string, string>>({ presence: "" }), [presentation, setPresentation] = useState(""), [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["beard", user.id], queryFn: async () => { const [profile, plans, visual] = await Promise.all([supabase.from("beard_profiles").select("data").eq("user_id", user.id).maybeSingle(), supabase.from("packages").select("id,content,status").eq("kind", "beard_plan").order("created_at", { ascending: false }), supabase.from("visual_profiles").select("data").eq("user_id", user.id).maybeSingle()]); return { profile: profile.data?.data, plans: plans.data ?? [], visual: visual.data?.data }; } });
  useEffect(() => { if (q.data) { setData((q.data.profile ?? { presence: "" }) as Record<string, string>); setPresentation(String((q.data.visual as Record<string, unknown> | null)?.["presentation"] ?? "")); } }, [q.data]);
  async function save() { const { error } = await supabase.from("beard_profiles").upsert({ user_id: user.id, data, updated_at: new Date().toISOString() }); if (error) throw new Error("Não foi possível salvar o perfil."); }

  // E1/E2/E3 — barbearia plugada: modelo do rosto, provador de barba e briefing pro barbeiro.
  const editar = useServerFn(editarRetrato);
  const [temRosto, setTemRosto] = useState(false);
  const [provando, setProvando] = useState("");
  const [prova, setProva] = useState<string | null>(null);
  const [provaErr, setProvaErr] = useState("");
  const [paywall, setPaywall] = useState(false);
  useEffect(() => { (async () => { const { data: arqs } = await supabase.storage.from("user-photos").list(user.id, { search: "modelo-" }); setTemRosto((arqs ?? []).some((a) => a.name === "modelo-rosto.png")); })(); }, [user.id]);

  async function provarBarba(rotulo: string, mudanca: string) {
    if (provando) return;
    if (!temRosto) { toast.error("Crie seu 👤 Meu Modelo (foto do rosto) primeiro."); return; }
    setProvando(rotulo); setProva(null); setProvaErr(""); setPaywall(false);
    try {
      const s = await supabase.storage.from("user-photos").createSignedUrl(`${user.id}/modelo-rosto.png`, 600);
      const imageUrl = s.data?.signedUrl;
      if (!imageUrl) throw new Error("Não achei sua foto de modelo — recrie o Meu Modelo.");
      const r = await editar({ data: { imageUrl, ajustes: [{ alvo: "barba", mudanca }] } });
      if (!r.ok || !r.image_url) throw new Error(r.error ?? "Não foi possível simular agora.");
      setProva(r.image_url);
      window.dispatchEvent(new Event("aura:quota"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível simular a barba. Tente de novo.";
      setPaywall(/gratuitas|Aura Pass/i.test(msg));
      setProvaErr(msg);
    } finally { setProvando(""); }
  }

  /** E2 — briefing determinístico do próprio perfil (zero IA, zero crédito). */
  const briefingBarbeiro = () => {
    const linhas = [`- Barba hoje: ${data["presence"] || "não informado"}`];
    for (const par of fields) { const k = par[0], label = par[1]; if (!k || !label) continue; const v = data[k]; if (v) linhas.push(`- ${label.replace(" (opcional)", "")}: ${v}`); }
    return `BRIEFING DE BARBEARIA — AURA ID\n\nPerfil do cliente:\n${linhas.join("\n")}\n\nPedido: avaliar o desenho de barba/bigode compatível com o formato do rosto e a densidade informada; sugerir ajuste de contornos e rotina de cuidado dentro do tempo/orçamento informados.\n\nPerguntas do cliente: quais produtos usar no dia a dia? com que frequência retocar os contornos?`;
  };
  return <div className={PILHA_PAGINA}><CabecalhoPagina titulo="Barba" descricao="Desenho, bigode e cuidados — inclusive a escolha de não usar barba." /><div className="max-w-2xl space-y-5"><h2 className={TITULO_SECAO}>Seu perfil</h2><PresentationChoice value={presentation} onChange={setPresentation} /><label className="block text-sm">Barba hoje<select aria-label="Barba hoje" className="mt-2 w-full rounded-md border bg-background p-3" value={data["presence"]} onChange={e => setData({ ...data, presence: e.target.value })}><option value="">Escolha</option><option>Sem barba</option><option>Com barba</option><option>Quero explorar</option></select></label>{fields.map(([key, label, hint]) => key && <label key={key} className="block text-sm">{label}<Input className="mt-2" value={data[key] ?? ""} placeholder={hint} onChange={e => setData({ ...data, [key]: e.target.value })} maxLength={300} /></label>)}<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !data["presence"]} onClick={() => save().then(() => toast.success("Perfil salvo.")).catch(e => toast.error(e.message))}>Salvar perfil</Button><Button disabled={busy || !data["presence"]} onClick={async () => { setBusy(true); try { await save(); const r = await generate({ data: { presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } }); if (r.error || !r.id) throw new Error(r.error ?? "Não foi possível gerar."); await qc.invalidateQueries({ queryKey: ["beard"] }); nav({ to: "/package/$id", params: { id: r.id } }); } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível gerar."); } finally { setBusy(false); } }}>{busy ? "Criando propostas…" : "Gerar plano de barba"}</Button></div><p className="text-xs text-muted-foreground">Sugestões não diagnosticam a pele nem prometem crescimento. Irritação persistente exige avaliação profissional.</p></div><section className="space-y-3 border-t pt-6">
        <h2 className={TITULO_SECAO}>🪞 Provar na sua cara</h2>
        <p className="text-sm text-muted-foreground">A IA aplica o estilo só no alvo <strong>barba</strong>, na foto do seu 👤 Meu Modelo — o resto do rosto fica intacto.</p>
        {!temRosto && <Aviso tom="atencao">Crie seu <Link to="/modelo" className="underline">👤 Meu Modelo</Link> (foto do rosto) para provar estilos de barba.</Aviso>}
        <div className="flex flex-wrap gap-2">
          {PRESETS_BARBA.map(([rotulo, mudanca]) => (
            <Button key={rotulo} size="sm" variant="outline" disabled={!!provando || !temRosto} onClick={() => void provarBarba(rotulo, mudanca)}>
              {provando === rotulo ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}{rotulo}
            </Button>
          ))}
        </div>
        <QuotaChip tasks={["webapp.retrato.edit"]} label="Retrato (prova de barba)" />
        {prova && <figure className="max-w-xs"><img src={prova} alt="Simulação de estilo de barba" className="rounded-lg" /><figcaption className="mt-1 text-xs text-muted-foreground">Simulação de barba · gerada por IA sobre o seu modelo</figcaption></figure>}
        {provaErr && <p role="alert" className="text-sm text-destructive">{provaErr}</p>}
        <PaywallCard mensagem={paywall ? "Suas simulações grátis acabaram — o Aura Pass libera as provas de barba." : null} />
      </section>

      {data["presence"] && (
        <section className="space-y-3 border-t pt-6">
          <h2 className={TITULO_SECAO}>💌 Levar ao barbeiro</h2>
          <p className="text-sm text-muted-foreground">Envie este perfil (com a foto do seu modelo{temRosto ? "" : " — crie o 👤 Meu Modelo para anexar"}) para barbeiros perto de você. Eles respondem com orçamento e podem sugerir ajustes por IA na sua foto.</p>
          <EnviarBriefing titulo="Briefing de barbearia" texto={briefingBarbeiro()} modulo="barba" profissaoFixa="barbeiro" fotoPath={temRosto ? `${user.id}/modelo-rosto.png` : undefined} />
        </section>
      )}

      <section className="space-y-3 border-t pt-6"><h2 className={TITULO_SECAO}>Seus planos</h2>{q.data?.plans.length ? q.data.plans.map(p => <Link key={p.id} to="/package/$id" params={{ id: p.id }} className={`block ${CARTAO_COMPACTO}`}>{String((p.content as Record<string, unknown>)["title"])} · {p.status === "saved" ? "salvo" : "proposta"}</Link>) : <EstadoVazio compacto icone={<Scissors className="size-6" />} titulo="Nenhum plano de barba ainda" descricao="Gere um plano de barba acima para guardar as propostas e levar ao barbeiro." />}</section></div>;
}