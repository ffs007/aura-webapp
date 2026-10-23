import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Confirm } from "@/components/Confirm";
import { CONSENT_ITEMS, fmtDateTime, logEvent } from "@/lib/aura";
import { deleteAccount } from "@/lib/aura.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Configurações e dados — Aura ID" }, { name: "description", content: "Gerencie consentimentos, lembretes e seus dados." }, { property: "og:title", content: "Configurações e dados — Aura ID" }, { property: "og:description", content: "Gerencie consentimentos, lembretes e seus dados." }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const del = useServerFn(deleteAccount);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const q = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [{ data: c }, { data: r }, { data: admin }] = await Promise.all([
        supabase.from("consents").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("reminders").select("*").order("due_at"),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      return { consent: c, reminders: r ?? [], admin: !!admin };
    },
  });
  const c = q.data?.consent;

  async function toggle(key: "photo_processing" | "personalization" | "reminders" | "image_generation", v: boolean) {
    const { error } = await supabase.from("consents").update({ [key]: v, updated_at: new Date().toISOString() } as never).eq("user_id", user.id);
    if (error) { toast.error("Não foi possível atualizar o consentimento"); return; }
    await logEvent("consent_changed", { scope: key, value: v });
    if (key === "personalization" && v) await logEvent("cross_module_enabled");
    if (key === "reminders" && v) await logEvent("reminder_enabled");
    qc.invalidateQueries();
  }

  async function addReminder() {
    if (!title || !due) return;
    await supabase.from("reminders").insert({ user_id: user.id, title, due_at: new Date(due).toISOString() });
    setTitle(""); setDue(""); qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function wipe(scope: "photos" | "packages") {
    const { data: references } = await supabase.from("generated_references").select("path");
    const paths = (references ?? []).flatMap(r => r.path ? [r.path] : []);
    if (paths.length) { const { error } = await supabase.storage.from("user-photos").remove(paths); if (error) { toast.error("Não foi possível excluir as referências."); return; } }
    await supabase.from("generated_references").delete().eq("user_id", user.id);
    if (scope === "photos") {
      const { data } = await supabase.from("photos").select("path");
      if (data?.length) await supabase.storage.from("user-photos").remove(data.map((p) => p.path));
    }
    const { error } = await supabase.from(scope).delete().eq("user_id", user.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    await logEvent("data_deleted", { scope });
    qc.invalidateQueries();
    toast.success("Excluído");
  }

  async function deleteAll() {
    const r = await del();
    if (r.error) { toast.error(r.error); return; }
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-5xl">Configurações e dados</h1>
      <section className="space-y-3">
        <h2 className="text-3xl">Consentimento</h2>
        <Button asChild variant="outline"><Link to="/onboarding">Editar estrutura masculina/feminina e preferências</Link></Button>
        <label className="flex items-start justify-between gap-6 rounded-lg border bg-card p-5"><div><div className="font-medium">Imagens geradas por IA</div><p className="text-sm text-muted-foreground">Pessoa fictícia e conceitos privados, sem enviar fotos pessoais. Cada geração usa créditos de IA.</p></div><Switch checked={!!c?.image_generation} onCheckedChange={v => toggle("image_generation", v)} /></label>
        {CONSENT_ITEMS.map((i) => (
          <label key={i.key} className="flex items-start justify-between gap-6 rounded-2xl border bg-card p-5">
            <div><div className="font-medium">{i.title}</div><p className="text-sm text-muted-foreground">{i.body}</p></div>
            <Switch checked={!!c?.[i.key]} onCheckedChange={(v) => toggle(i.key, v)} />
          </label>
        ))}
        <p className="text-sm text-muted-foreground">Permissões por módulo, pausa e redefinição do DNA ficam em <Link to="/dna/permissoes" className="underline">DNA Visual → Permissões</Link>.</p>
      </section>
      {c?.reminders && (
        <section className="space-y-3">
          <h2 className="text-3xl">Lembretes no app</h2>
          <div className="flex flex-wrap gap-2"><Input className="max-w-xs" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex.: Marcar corte de cabelo" /><Input type="datetime-local" className="max-w-xs" value={due} onChange={(e) => setDue(e.target.value)} /><Button onClick={addReminder}>Adicionar</Button></div>
          {q.data?.reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-2 text-sm">
              <span className={r.done ? "line-through text-muted-foreground" : ""}>{r.title} · {fmtDateTime(r.due_at)}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("reminders").update({ done: !r.done }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["settings"] }); }}>{r.done ? "Desfazer" : "Feito"}</Button>
                <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("reminders").delete().eq("id", r.id); qc.invalidateQueries({ queryKey: ["settings"] }); }}>Remover</Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Lembretes por e-mail ou SMS ainda não estão conectados.</p>
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-3xl">Seus dados</h2>
        <div className="flex flex-wrap gap-2">
          <Confirm label="Excluir todas as fotos" desc="Todas as fotos e referências enviadas serão removidas permanentemente." onYes={() => wipe("photos")} />
          <Confirm label="Excluir todas as sugestões" desc="Todos os pacotes gerados serão removidos." onYes={() => wipe("packages")} />
          <Button asChild variant="outline" size="sm"><Link to="/dna/redefinir">Redefinir ou exportar DNA Visual</Link></Button>
        </div>
        <div className="rounded-2xl border border-destructive/40 p-5">
          <p className="text-sm">Excluir sua conta remove tudo — perfil, fotos, sugestões, feedback, DNA Visual e histórico.</p>
          <div className="mt-3"><Confirm label="Excluir minha conta" desc="Isso não pode ser desfeito." onYes={deleteAll} /></div>
        </div>
      </section>
      {q.data?.admin && <Button asChild variant="secondary"><Link to="/admin">Abrir admin</Link></Button>}
    </div>
  );
}
