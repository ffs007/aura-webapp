import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EsqueletoDetalhe } from "@/components/estados";
import { PILHA_PAGINA } from "@/lib/design";
import { logEvent } from "@/lib/aura";

const META = "Imagem desejada, profissão, rotina, clima, dress code e orçamento.";
export const Route = createFileRoute("/_authenticated/roupas/perfil")({
  head: () => ({ meta: [{ title: "Perfil de estilo — Aura ID" }, { name: "description", content: META }, { property: "og:title", content: "Perfil de estilo — Aura ID" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

const FIELDS = [
  ["desired_image", "Imagem que quero transmitir", "ex.: confiante, acessível, criativa"],
  ["profession", "Profissão", "ex.: advogada, designer, estudante"],
  ["routine", "Rotina", "ex.: home office e 2 dias no escritório"],
  ["dress_code", "Dress code do dia a dia", "ex.: casual inteligente"],
  ["climate", "Clima", "ex.: quente e úmido"],
  ["city", "Cidade (opcional)", "ex.: Recife"],
  ["budget", "Orçamento para roupas", "ex.: até R$ 200 por mês"],
  ["silhouettes", "Silhuetas que gosto", "ex.: cintura marcada, peças amplas"],
  ["avoided_pieces", "Peças que evito", "ex.: salto alto, gola alta"],
] as const;
type F = Record<(typeof FIELDS)[number][0], string>;

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<F>({} as F);
  const q = useQuery({ queryKey: ["style-profile"], queryFn: async () => (await supabase.from("style_profiles").select("*").eq("user_id", user.id).maybeSingle()).data });
  useEffect(() => { if (q.data) setF(Object.fromEntries(FIELDS.map(([k]) => [k, q.data?.[k] ?? ""])) as F); }, [q.data]);
  async function save() {
    const { error } = await supabase.from("style_profiles").upsert({ user_id: user.id, ...f, updated_at: new Date().toISOString() });
    if (error) { toast.error("Não foi possível salvar o perfil. Tente de novo."); return; }
    if (!q.data) await logEvent("onboarding_completed", { module: "clothing" });
    toast.success("Perfil de estilo salvo"); qc.invalidateQueries();
  }
  if (q.isLoading) return <EsqueletoDetalhe />;
  return (
    <div className={PILHA_PAGINA}>
      <p className="text-sm text-muted-foreground">Cores preferidas e rejeitadas vêm das suas <Link to="/settings" className="underline">preferências gerais</Link> e do DNA Visual, se autorizado.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([k, l, ph]) => <div key={k} className="space-y-2"><Label htmlFor={`roupas-perfil-${k}`}>{l}</Label><Input id={`roupas-perfil-${k}`} value={f[k] ?? ""} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}
      </div>
      <Button onClick={save}>Salvar perfil</Button>
    </div>
  );
}
