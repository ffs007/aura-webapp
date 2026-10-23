import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminStats } from "@/lib/aura.functions";
import { fmtDateTime } from "@/lib/aura";
import { CatalogManager } from "@/components/CatalogManager";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Admin — Aura ID" }, { name: "description", content: "Uso, auditoria de consentimento e segurança de conteúdo." }, { property: "og:title", content: "Admin — Aura ID" }, { property: "og:description", content: "Uso, auditoria de consentimento e segurança de conteúdo." }] }),
  component: Admin,
});

const CONNECTORS = [
  ["Contas e login", "Ativo"], ["Banco de dados", "Ativo"], ["Armazenamento privado de fotos", "Ativo"], ["Sugestões e DNA Visual por IA", "Ativo"],
  ["Exportação Google Docs / Drive", "Não conectado"], ["Lembretes por e-mail / SMS", "Não conectado"], ["Catálogo via Google Sheets / Airtable", "Não conectado (usando catálogo interno)"],
  ["RA em tempo real, correção por vídeo, simulação facial, guia na tela", "[FORA DO ESCOPO DOS CONECTORES LOVABLE]"],
  ["Relatórios da Jornada (Google Docs/Notion) e lembretes por Gmail/Telegram/Twilio", "Não conectado — relatórios e lembretes ficam no app"],
  ["Provador fotorrealista, simulação de cabelo, RA, tatuagem em movimento, vídeo ao vivo", "[FORA DO ESCOPO DOS CONECTORES LOVABLE]"],
];

function Admin() {
  const stats = useServerFn(adminStats);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin"], queryFn: () => stats() });
  const [terms, setTerms] = useState("");
  const [tattooWarning, setTattooWarning] = useState("");
  useEffect(() => { supabase.from("safety_config").select("blocked_terms,tattoo_disclaimer").eq("id", 1).maybeSingle().then(({ data }) => { setTerms((data?.blocked_terms ?? []).join(", ")); setTattooWarning(data?.tattoo_disclaimer ?? ""); }); }, []);

  if (q.isLoading) return <p>Carregando…</p>;
  if (q.error) return <p className="text-destructive">Não foi possível carregar os dados do admin.</p>;
  if (!q.data?.allowed) return <p className="text-muted-foreground">Esta área é só para administradores.</p>;
  const d = q.data;

  async function saveTerms() {
    const { error } = await supabase.from("safety_config").update({ blocked_terms: terms.split(",").map((t) => t.trim()).filter(Boolean), updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error("Não foi possível salvar"); return; }
    toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] });
  }

  return (
    <div className="space-y-10">
      <h1 className="text-5xl">Admin</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(d.totals).map(([k, v]) => <div key={k} className="rounded-2xl border bg-card p-5"><div className="text-sm capitalize text-muted-foreground">{k}</div><div className="font-display text-5xl">{v}</div></div>)}
      </div>
      <section><h2 className="text-3xl">Auditoria de consentimento</h2>
        <p className="mt-2 text-sm">{d.consent.total} consentiram · fotos {d.consent.photo} · personalização {d.consent.personalization} · DNA pausado {d.consent.paused} · lembretes {d.consent.reminders}</p></section>
      <section><h2 className="text-3xl">Eventos</h2>
        <div className="mt-3 flex flex-wrap gap-2">{Object.entries(d.counts).map(([k, v]) => <span key={k} className="rounded-full bg-secondary px-3 py-1 text-sm">{k}: {v}</span>)}</div>
        <ul className="mt-4 space-y-1 text-xs text-muted-foreground">{d.recent.map((e, i) => <li key={i}>{fmtDateTime(e.created_at)} — {e.event}</li>)}</ul></section>
      <section><h2 className="text-3xl">Status dos conectores</h2>
        <ul className="mt-3 space-y-1 text-sm">{CONNECTORS.map(([n, s]) => <li key={n} className="flex justify-between gap-4 border-b py-1"><span>{n}</span><span className="text-right text-muted-foreground">{n?.startsWith("Sugestões") && !d.aiConfigured ? "Não configurado" : s}</span></li>)}</ul></section>
      <section><h2 className="text-3xl">Diretrizes de linguagem da Jornada</h2><ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground"><li>Encorajar, nunca cobrar progresso.</li><li>“Não funcionou” é aprendizado.</li><li>Relatórios enfatizam aprendizado, nunca comparação.</li><li>Notas emocionais nunca são exportadas nem compartilhadas; admins não veem fotos, notas ou reflexões.</li></ul></section>
      <CatalogManager />
      <section className="space-y-3"><h2 className="text-3xl">Segurança em tatuagens</h2><p className="text-sm text-muted-foreground">Aviso profissional exibido nos projetos e utilizado na geração. Não há acesso a fotos corporais, intenções privadas nem diário.</p><Textarea aria-label="Aviso de segurança de tatuagens" value={tattooWarning} onChange={e => setTattooWarning(e.target.value)} /><Button disabled={!tattooWarning.trim()} onClick={async () => { const { error } = await supabase.from("safety_config").update({ tattoo_disclaimer: tattooWarning.trim(), updated_at: new Date().toISOString() }).eq("id", 1); if (error) { toast.error("Não foi possível salvar."); return; } qc.invalidateQueries(); toast.success("Aviso salvo."); }}>Salvar aviso</Button></section>
      <section><h2 className="text-3xl">Segurança de conteúdo</h2>
        <p className="text-sm text-muted-foreground">Palavras que a IA deve evitar (separadas por vírgula).</p>
        <Textarea className="mt-2" value={terms} onChange={(e) => setTerms(e.target.value)} />
        <Button className="mt-2" onClick={saveTerms}>Salvar</Button></section>
      <p className="text-xs text-muted-foreground">Os registros de erro ficam nos logs do servidor; fotos privadas nunca aparecem aqui. Métricas sem identificar pessoas.</p>
    </div>
  );
}
