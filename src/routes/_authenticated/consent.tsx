import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CabecalhoPagina } from "@/components/estados";
import { CARTAO_COMPACTO } from "@/lib/design";
import { cn } from "@/lib/utils";
import { CONSENT_ITEMS, logEvent } from "@/lib/aura";
import { consumirDestino, irPara, lerDestino } from "@/lib/navegacao";

export const Route = createFileRoute("/_authenticated/consent")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Privacidade e consentimento — Aura ID" }, { name: "description", content: "Escolha o que a Aura ID pode fazer com seus dados." }, { property: "og:title", content: "Privacidade e consentimento — Aura ID" }, { property: "og:description", content: "Escolha o que a Aura ID pode fazer com seus dados." }] }),
  component: Consent,
});

function Consent() {
  const nav = useNavigate();
  const { user } = Route.useRouteContext();
  const [terms, setTerms] = useState(false);
  const [vals, setVals] = useState({ photo_processing: false, personalization: false, reminders: false });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("consents").upsert({ user_id: user.id, ...vals, terms_version: "v2" });
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar suas escolhas. Tente de novo."); return; }
    await logEvent("consent_changed", { ...vals, initial: true });
    if (vals.personalization) await logEvent("cross_module_enabled");
    // Se a pessoa veio de um destino (ex.: briefing de uma profissional) e o
    // perfil já está completo, volta para lá; senão segue para o onboarding,
    // que consome o destino ao terminar.
    if (lerDestino()) {
      const { data: perfil } = await supabase.from("visual_profiles").select("completed").eq("user_id", user.id).maybeSingle();
      if (perfil?.completed) {
        const destino = consumirDestino();
        if (destino) { irPara(destino); return; }
      }
    }
    nav({ to: "/onboarding" });
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <CabecalhoPagina
        titulo="Antes de começarmos"
        descricao="A Aura ID oferece sugestões, nunca julgamentos. Você decide o que podemos usar — e pode mudar tudo isso depois em Configurações ou na Central de permissões do DNA Visual."
      />
      <div className="mt-8 space-y-4">
        {CONSENT_ITEMS.map((c) => (
          <label key={c.key} className={cn("flex items-start justify-between gap-6", CARTAO_COMPACTO)}>
            <div><div className="font-medium">{c.title}</div><p className="mt-1 text-sm text-muted-foreground">{c.body}</p></div>
            <Switch aria-label={c.title} checked={vals[c.key]} onCheckedChange={(v) => setVals({ ...vals, [c.key]: v })} />
          </label>
        ))}
      </div>
      <label className="mt-6 flex items-start gap-3 text-sm">
        <Checkbox aria-label="Aceito o aviso sobre sugestões de IA" checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
        <span>Entendo que as sugestões são convites gerados por IA, não aconselhamento profissional, e que mudanças permanentes (tatuagens, químicas) devem ser validadas com um profissional.</span>
      </label>
      <Button className="mt-8" size="lg" disabled={!terms || busy} onClick={save}>Continuar</Button>
    </div>
  );
}
