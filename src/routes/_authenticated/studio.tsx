import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StartPacks } from "@/components/StartPacks";
import { ENTRY_MODES, EMOTIONAL_MODES, logEvent } from "@/lib/aura";
import { generatePackages } from "@/lib/aura.functions";
import { findPack } from "@/lib/packs";
import { cn } from "@/lib/utils";
import { PresentationChoice } from "@/components/PresentationChoice";
import { lerRascunho, limparRascunho, rotuloRascunho, useSalvarRascunho } from "@/hooks/useRascunho";
import { CabecalhoPagina } from "@/components/estados";
import { CARTAO_COMPACTO, FOCO, TITULO_ITEM, TITULO_SECAO } from "@/lib/design";

export const Route = createFileRoute("/_authenticated/studio")({
  validateSearch: z.object({ pack: z.string().optional() }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Estúdio — Aura ID" }, { name: "description", content: "Comece uma nova exploração visual." }, { property: "og:title", content: "Estúdio — Aura ID" }, { property: "og:description", content: "Comece uma nova exploração visual." }] }),
  component: Studio,
});

function Studio() {
  const nav = useNavigate();
  const { user } = Route.useRouteContext();
  const { pack: packId } = Route.useSearch();
  const pack = findPack(packId);
  const gen = useServerFn(generatePackages);
  const [emotion, setEmotion] = useState("curious");
  const [entry, setEntry] = useState("general");
  const [occasion, setOccasion] = useState("");
  const [extra, setExtra] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [busy, setBusy] = useState(false);
  const [presentation, setPresentation] = useState("");
  const packAplicado = useRef<string | null>(null);
  const chaveRascunho = `estudio:${user.id}:campos`;
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const conteudoVisto = useRef(false);

  useEffect(() => {
    supabase.from("visual_profiles").select("data").eq("user_id", user.id).maybeSingle().then(({ data }) => setPresentation(String((data?.data as Record<string, unknown> | null)?.["presentation"] ?? "")));
  }, [user.id]);

  // Restaura o rascunho do formulário; o pack (se houver) aplica depois e tem prioridade.
  useEffect(() => {
    if (rascunhoCarregado) return;
    const r = lerRascunho<{ entry?: string; emotion?: string; occasion?: string; extra?: string; intensity?: number }>(chaveRascunho);
    if (r) {
      if (typeof r.entry === "string" && ENTRY_MODES.some((m) => m.id === r.entry)) setEntry(r.entry);
      if (typeof r.emotion === "string" && EMOTIONAL_MODES.some((m) => m.id === r.emotion)) setEmotion(r.emotion);
      if (typeof r.occasion === "string") setOccasion(r.occasion);
      if (typeof r.extra === "string") setExtra(r.extra);
      if (typeof r.intensity === "number" && r.intensity >= 1 && r.intensity <= 5) setIntensity(r.intensity);
    }
    setRascunhoCarregado(true);
  }, [chaveRascunho, rascunhoCarregado]);

  // Aplica o pack só uma vez (ou quando o pack muda), preservando o que a pessoa já editou.
  useEffect(() => {
    if (!pack || packAplicado.current === pack.id) return;
    packAplicado.current = pack.id;
    if (pack.emotion) setEmotion(pack.emotion);
    if (pack.entryMode) setEntry(pack.entryMode);
    if (typeof pack.intensity === "number") setIntensity(pack.intensity);
    if (pack.occasion) setOccasion(pack.occasion);
  }, [pack]);

  const valorRascunho = useMemo(() => ({ entry, emotion, occasion, extra, intensity }), [entry, emotion, occasion, extra, intensity]);
  const temConteudoRascunho = entry !== "general" || emotion !== "curious" || occasion.trim().length > 0 || extra.trim().length > 0 || intensity !== 3;
  const salvoEm = useSalvarRascunho(chaveRascunho, valorRascunho, rascunhoCarregado && temConteudoRascunho);
  const rotuloRascunhoAtual = temConteudoRascunho ? rotuloRascunho(salvoEm) : "";

  // Se o formulário voltar ao padrão, o rascunho local deixa de fazer sentido.
  useEffect(() => {
    if (!rascunhoCarregado) return;
    if (temConteudoRascunho) { conteudoVisto.current = true; return; }
    if (conteudoVisto.current) { limparRascunho(chaveRascunho); conteudoVisto.current = false; }
  }, [rascunhoCarregado, temConteudoRascunho, chaveRascunho]);

  async function generate() {
    if (entry === "beard") { nav({ to: "/barba" }); return; }
    if (entry === "makeup") { nav({ to: "/maquiagem/gerar" }); return; }
    setBusy(true);
    try {
      const r = await gen({ data: { entryMode: entry, emotionalMode: emotion, occasion, extra, intensity, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error) { toast.error(r.error); return; }
      limparRascunho(chaveRascunho);
      conteudoVisto.current = false;
      toast.success("Suas sugestões estão prontas.");
      nav({ to: "/dashboard", search: { batch: r.batchId ?? undefined } });
    } catch (e) {
      toast.error("Algo deu errado ao criar suas sugestões.");
      console.error(e);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <StartPacks limite={6} />
        {pack && <div className="rounded-2xl border border-accent/50 bg-accent/5 px-4 py-3 text-sm">Começando pelo pack <strong>{pack.title}</strong> — ajuste o que quiser.</div>}
      </div>
      <PresentationChoice value={presentation} onChange={setPresentation} />
      <CabecalhoPagina
        titulo="Como você chega hoje?"
        descricao="Seu humor define o quão ousados — ou suaves — serão nossos convites."
      >
        <div className="flex flex-wrap gap-2">
          {EMOTIONAL_MODES.map((m) => (
            <button key={m.id} onClick={() => setEmotion(m.id)} className={cn(FOCO, "rounded-full border px-4 py-2 text-sm transition", emotion === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")} title={m.hint} aria-pressed={emotion === m.id}>{m.label}</button>
          ))}
        </div>
      </CabecalhoPagina>

      <div>
        <h2 className={TITULO_SECAO}>O que você quer explorar?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRY_MODES.map((m) => (
            <button key={m.id} onClick={() => setEntry(m.id)} className={cn("rounded-2xl border p-4 text-left transition", entry === m.id ? "border-accent bg-card shadow-soft" : "bg-card/60 hover:bg-card")}>
              <div className="font-medium">{m.label}</div><div className="text-xs text-muted-foreground">{m.hint}</div>
            </button>
          ))}
          <Link to="/collections" className="rounded-2xl border border-dashed p-4 text-left hover:bg-card">
            <div className="font-medium">Coleções salvas</div><div className="text-xs text-muted-foreground">Reveja o que você guardou</div>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-2"><Label htmlFor="studio-ocasiao">{entry === "event" ? "O evento (data, lugar, clima)" : "Ocasião ou contexto (opcional)"}</Label><Input id="studio-ocasiao" value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder={entry === "event" ? "Casamento de amiga, ao ar livre, tarde de março" : "ex.: emprego novo mês que vem"} /></div>
          <div className="space-y-2"><Label>Intensidade desejada</Label><Slider aria-label="Intensidade desejada (1 a 5)" min={1} max={5} step={1} value={[intensity]} onValueChange={([v]) => setIntensity(v ?? 3)} /><div className="flex justify-between text-xs text-muted-foreground"><span>Sutil</span><span>Marcante</span></div></div>
          <div className="space-y-2"><Label htmlFor="studio-extra">Algo mais para hoje?</Label><Textarea id="studio-extra" value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="ex.: só tenho 10 minutos de manhã" /></div>
        </div>
        <div className={CARTAO_COMPACTO}>
          <h3 className={TITULO_ITEM}>Quer ver as sugestões em VOCÊ?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crie seu <strong>Meu Modelo</strong> — duas imagens-base suas, privadas — e toda maquiagem, cabelo, roupa ou tatuagem sai com a sua cara, nunca com uma pessoa genérica.</p>
          <p className="mt-2 text-xs text-muted-foreground">Envie as fotos por lá mesmo (bem iluminadas, rosto e corpo): é o único lugar que aceita fotos suas, e elas ficam no seu cofre privado.</p>
          <Button asChild size="sm" className="mt-4"><Link to="/modelo">👤 Criar meu modelo</Link></Button>
          <p className="mt-3 text-xs text-muted-foreground">Primeira vez aqui? Veja o <Link to="/guia" className="underline">guia rápido</Link>.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" variant="accent" onClick={generate} disabled={busy}>{busy ? "Compondo seus convites…" : entry === "makeup" ? "Ir para o gerador de maquiagem" : "Criar minhas sugestões"}</Button>
        {busy && <span className="text-sm text-muted-foreground">Isso pode levar até um minuto.</span>}
        {rotuloRascunhoAtual && <span role="status" className="text-xs text-muted-foreground">{rotuloRascunhoAtual}</span>}
      </div>
    </div>
  );
}
