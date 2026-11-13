import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { EstadoErro, EsqueletoLista } from "@/components/estados";
import { CARTAO_COMPACTO, TITULO_SECAO } from "@/lib/design";
import { cn } from "@/lib/utils";
import { logEvent, MODULES } from "@/lib/aura";

export const Route = createFileRoute("/_authenticated/dna/permissoes")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Permissões — DNA Visual — Aura ID" }, { name: "description", content: "Controle onde seu DNA Visual pode ser usado." }, { property: "og:title", content: "Permissões — DNA Visual — Aura ID" }, { property: "og:description", content: "Controle onde seu DNA Visual pode ser usado." }] }),
  component: Perms,
});

function Row({ title, body, checked, onChange, disabled }: { title: string; body: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn("flex items-start justify-between gap-6", CARTAO_COMPACTO)}>
      <div><div className="font-medium">{title}</div><p className="text-sm text-muted-foreground">{body}</p></div>
      <Switch aria-label={title} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}

function Perms() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["perms"], queryFn: async () => (await supabase.from("consents").select("personalization, dna_paused, module_permissions").eq("user_id", user.id).maybeSingle()).data });
  if (q.isLoading) return <EsqueletoLista itens={6} colunas={1} altura="h-20" />;
  if (q.error) return (
    <EstadoErro
      titulo="Não conseguimos carregar suas permissões."
      onTentarNovamente={() => void q.refetch()}
      recarregando={q.isFetching}
    />
  );
  const c = q.data;
  if (!c) return (
    <EstadoErro
      titulo="Não encontramos seus consentimentos."
      onTentarNovamente={() => void q.refetch()}
      recarregando={q.isFetching}
    />
  );
  const perms = (c.module_permissions ?? {}) as Record<string, boolean>;

  async function patch(values: Record<string, unknown>, meta: Record<string, string | boolean>) {
    const { error } = await supabase.from("consents").update({ ...values, updated_at: new Date().toISOString() } as never).eq("user_id", user.id);
    if (error) { toast.error("Não foi possível atualizar as permissões. Tente de novo."); return; }
    await logEvent("consent_changed", meta);
    qc.invalidateQueries();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">As sugestões só usam seu DNA Visual quando a personalização está ativa, não pausada, e o módulo está liberado.</p>
      <Row title="Personalização entre módulos" body="Permite formar e usar seu DNA Visual a partir de reações e feedback."
        checked={c.personalization} onChange={async (v) => { await patch({ personalization: v }, { scope: "personalization", value: v }); if (v) await logEvent("cross_module_enabled"); }} />
      <Row title="Pausar DNA Visual" body="Mantém tudo guardado, mas para de usar e de aprender até você retomar."
        checked={c.dna_paused} disabled={!c.personalization} onChange={(v) => patch({ dna_paused: v }, { scope: "dna_paused", value: v })} />
      <h2 className={cn(TITULO_SECAO, "pt-4")}>Por módulo</h2>
      {MODULES.map((m) => (
        <Row key={m.id} title={m.label} body={`Usar o DNA Visual nas sugestões de ${m.label.toLowerCase()}.`}
          checked={m.id === "beard" ? perms[m.id] === true : perms[m.id] !== false} disabled={!c.personalization}
          onChange={(v) => patch({ module_permissions: { ...perms, [m.id]: v } }, { scope: `module:${m.id}`, value: v })} />
      ))}
    </div>
  );
}
