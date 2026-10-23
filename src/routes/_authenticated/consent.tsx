import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSENT_ITEMS, logEvent } from "@/lib/aura";

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
    if (error) { toast.error("Não foi possível salvar suas escolhas. Tente novamente."); return; }
    await logEvent("consent_changed", { ...vals, initial: true });
    if (vals.personalization) await logEvent("cross_module_enabled");
    nav({ to: "/onboarding" });
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <h1 className="text-5xl">Antes de começarmos</h1>
      <p className="mt-3 text-muted-foreground">A Aura ID oferece sugestões, nunca julgamentos. Você decide o que podemos usar — e pode mudar tudo isso depois em Configurações ou na Central de permissões do DNA Visual.</p>
      <div className="mt-8 space-y-4">
        {CONSENT_ITEMS.map((c) => (
          <label key={c.key} className="flex items-start justify-between gap-6 rounded-2xl border bg-card p-5">
            <div><div className="font-medium">{c.title}</div><p className="mt-1 text-sm text-muted-foreground">{c.body}</p></div>
            <Switch checked={vals[c.key]} onCheckedChange={(v) => setVals({ ...vals, [c.key]: v })} />
          </label>
        ))}
      </div>
      <label className="mt-6 flex items-start gap-3 text-sm">
        <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
        <span>Entendo que as sugestões são convites gerados por IA, não aconselhamento profissional, e que mudanças permanentes (tatuagens, químicas) devem ser validadas com um profissional.</span>
      </label>
      <Button className="mt-8" size="lg" disabled={!terms || busy} onClick={save}>Continuar</Button>
    </div>
  );
}
