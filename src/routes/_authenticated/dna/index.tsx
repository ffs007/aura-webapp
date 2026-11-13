import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Dna, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiLabel } from "@/components/PackageView";
import { Aviso, Cartao, EstadoErro, EstadoVazio, EsqueletoDetalhe } from "@/components/estados";
import { FOCO, GRADE_CARTOES, META, ROTULO_CATEGORIA, TITULO_SECAO } from "@/lib/design";
import { DNA_FIELDS, fmtDateTime, logEvent, MODULES, type DnaSummary } from "@/lib/aura";
import { synthesizeDna } from "@/lib/aura.functions";

export const Route = createFileRoute("/_authenticated/dna/")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "DNA Visual — Aura ID" }, { name: "description", content: "Seu DNA Visual: editável, explicável e não diagnóstico." }, { property: "og:title", content: "DNA Visual — Aura ID" }, { property: "og:description", content: "Seu DNA Visual: editável, explicável e não diagnóstico." }] }),
  component: Summary,
});

type FieldKey = keyof DnaSummary;

function Summary() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const synth = useServerFn(synthesizeDna);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const q = useQuery({
    queryKey: ["dna"],
    queryFn: async () => {
      const [{ data: c }, { data: d }] = await Promise.all([
        supabase.from("consents").select("personalization, dna_paused").eq("user_id", user.id).maybeSingle(),
        supabase.from("visual_dna").select("summary, updated_at").eq("user_id", user.id).maybeSingle(),
      ]);
      return { on: !!c?.personalization, paused: !!c?.dna_paused, summary: (d?.summary ?? null) as DnaSummary | null, updated: d?.updated_at };
    },
  });

  async function generate() {
    setBusy(true);
    const r = await synth().catch(() => ({ error: "Não foi possível gerar o DNA Visual. Tente de novo." }));
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("DNA Visual atualizado");
    qc.invalidateQueries();
  }

  async function saveField(key: string, original: unknown, value: string | string[] | Record<string, string>, removed = false) {
    const s = q.data?.summary;
    if (!s) return;
    const next = { ...s, [key]: value } as DnaSummary;
    const now = new Date().toISOString();
    const { error } = await supabase.from("visual_dna").update({ summary: next as never, updated_at: now }).eq("user_id", user.id);
    if (error) { toast.error("Não foi possível salvar a correção. Tente de novo."); return; }
    await supabase.from("dna_corrections").insert({ user_id: user.id, field: key, original: typeof original === "string" ? original : JSON.stringify(original), correction: removed ? "(removido — inferência errada)" : typeof value === "string" ? value : JSON.stringify(value) });
    await supabase.from("dna_versions").insert({ user_id: user.id, summary: next as never, source: "edit" });
    await logEvent("inference_corrected", { field: key, removed });
    await logEvent("version_created", { source: "edit" });
    setEditing(null);
    toast.success("Correção registrada — a IA não repetirá essa inferência.");
    qc.invalidateQueries({ queryKey: ["dna"] });
  }

  if (q.isLoading) return <EsqueletoDetalhe />;
  if (q.error || !q.data) return (
    <EstadoErro
      titulo="Não foi possível carregar seu DNA Visual."
      onTentarNovamente={() => void q.refetch()}
      recarregando={q.isFetching}
    />
  );
  const { on, paused, summary } = q.data;

  if (!on) return (
    <EstadoVazio
      icone={<ShieldOff />}
      titulo="A personalização entre módulos está desligada"
      descricao="Sem ela, não sintetizamos um DNA Visual e as sugestões não usam seu histórico. Você pode ativá-la quando quiser."
      acoes={<Button asChild><Link to="/dna/permissoes">Abrir permissões</Link></Button>}
    />
  );

  return (
    <div className="space-y-6">
      {paused && <Aviso tom="neutro">Seu DNA Visual está <strong>pausado</strong>: continua guardado, mas não é usado nas sugestões nem recebe novos sinais. <Link to="/dna/permissoes" className="underline">Retomar</Link></Aviso>}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="accent" onClick={generate} disabled={busy}>{busy ? "Sintetizando…" : summary ? "Atualizar resumo" : "Gerar meu DNA Visual"}</Button>
        {q.data.updated && summary && <span className={META}>Atualizado em {fmtDateTime(q.data.updated)}</span>}
      </div>

      {!summary ? (
        <EstadoVazio
          tom="destaque"
          icone={<Dna />}
          titulo="Seu DNA Visual ainda não foi gerado"
          descricao={<>Ele é criado só a partir do que você autorizou: perfil, preferências, reações e feedback. Complete suas <Link to="/dna/preferencias" className="underline">preferências</Link> para um resumo mais fiel.</>}
        />
      ) : (
        <>
          <Cartao>
            <div className="flex items-center justify-between"><AiLabel /></div>
            <h2 className="mt-3 text-4xl">{summary.headline}</h2>
            <p className="mt-2 text-sm text-muted-foreground"><strong>De onde veio:</strong> {summary.explanation}</p>
            <p className="mt-3 text-xs italic text-muted-foreground">Isto são hipóteses sobre o que tem funcionado para você — não regras, nem verdades objetivas.</p>
          </Cartao>
          <div className={GRADE_CARTOES}>
            {DNA_FIELDS.map((f) => {
              const val = summary[f.key];
              const text = Array.isArray(val) ? val.join(", ") : String(val ?? "");
              const isEditing = editing === f.key;
              return (
                <Cartao compacto key={f.key}>
                  <div className={ROTULO_CATEGORIA}>{f.label}</div>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
                      {f.list && <p className="text-xs text-muted-foreground">Separe itens por vírgula.</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveField(f.key, val, f.list ? draft.split(",").map((x) => x.trim()).filter(Boolean) : draft)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm">{text || <span className="text-muted-foreground">Ainda não sabemos.</span>}</p>
                      <div className="mt-3 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(f.key); setDraft(text); }}>Editar</Button>
                        {text && <Button size="sm" variant="ghost" onClick={() => saveField(f.key as FieldKey, val, f.list ? [] : "", true)}>Isso está errado</Button>}
                      </div>
                    </>
                  )}
                </Cartao>
              );
            })}
          </div>
          <Cartao>
            <h3 className={TITULO_SECAO}>Notas por módulo</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {MODULES.filter((m) => m.id !== "professional").map((m) => {
                const k = m.id as keyof DnaSummary["module_notes"];
                const v = summary.module_notes?.[k] ?? "";
                return (
                  <div key={m.id} className="text-sm">
                    <div className="font-medium">{m.label}</div>
                    <p className="text-muted-foreground">{v || "Ainda não sabemos."}</p>
                    {v && <button className={`mt-1 text-xs underline ${FOCO}`} onClick={() => saveField("module_notes", summary.module_notes, { ...summary.module_notes, [k]: "" }, true)}>Isso está errado</button>}
                  </div>
                );
              })}
            </div>
          </Cartao>
        </>
      )}
    </div>
  );
}
