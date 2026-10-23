import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { logEvent } from "@/lib/aura";
import { cn } from "@/lib/utils";
import { ReferenceImage } from "@/components/ReferenceImage";
import { BodyAvatar } from "@/components/onboarding/BodyAvatar";
import { WardrobeFitting } from "@/components/onboarding/WardrobeFitting";
import { HelpChat } from "@/components/onboarding/HelpChat";
import { generateAvatar } from "@/lib/onboarding.functions";
import { stepsFor, computePending, coherence, fitTips, fieldByKey, optLabel, isEmpty, ENCOURAGE, type Data, type Mode, type OField } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Seu perfil visual — Aura ID" }, { name: "description", content: "Conte à Aura ID sobre você, no seu ritmo, com ajuda e avatar ilustrado." }, { property: "og:title", content: "Seu perfil visual — Aura ID" }, { property: "og:description", content: "Conte à Aura ID sobre você, no seu ritmo, com ajuda e avatar ilustrado." }] }),
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const { user } = Route.useRouteContext();
  const genAvatar = useServerFn(generateAvatar);
  const [loaded, setLoaded] = useState(false);
  const [existed, setExisted] = useState(false);
  const [mode, setMode] = useState<Mode>("quick");
  const [data, setData] = useState<Data>({});
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avBusy, setAvBusy] = useState(false);
  const dirty = useRef(false);

  const steps = stepsFor(mode);
  const onSummary = i >= steps.length;
  const step = steps[Math.min(i, steps.length - 1)]!;

  useEffect(() => {
    supabase.from("visual_profiles").select("data, completed, mode").eq("user_id", user.id).maybeSingle().then(({ data: r }) => {
      if (r) {
        const d = (r.data ?? {}) as Data;
        const m: Mode = r.mode === "quick" ? "quick" : "assisted";
        setExisted(!!r.completed); setMode(m); setData(d);
        const idx = stepsFor(m).findIndex((s) => s.id === d._last_step);
        if (idx >= 0 && !r.completed) setI(idx);
      }
      setLoaded(true);
    });
    supabase.from("photos").select("path").eq("kind", "avatar").order("created_at", { ascending: false }).limit(1).then(async ({ data: p }) => {
      if (p?.[0]) { const { data: s } = await supabase.storage.from("user-photos").createSignedUrl(p[0].path, 3600); setAvatarUrl(s?.signedUrl ?? null); }
    });
  }, [user.id]);

  // Autosave do rascunho (retomar exatamente de onde parou)
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const tm = setTimeout(() => {
      const payload = { ...data, _last_step: onSummary ? "summary" : step.id };
      supabase.from("visual_profiles").upsert({ user_id: user.id, data: payload, mode, completed: existed, updated_at: new Date().toISOString() });
    }, 800);
    return () => clearTimeout(tm);
  }, [data, mode, i, loaded]);

  useEffect(() => { if (onSummary) { setReveal(0); const iv = setInterval(() => setReveal((r) => (r >= 3 ? (clearInterval(iv), r) : r + 1)), 600); return () => clearInterval(iv); } }, [onSummary]);

  function set(k: string, v: string | number) {
    dirty.current = true;
    setData((d) => ({ ...d, [k]: v, _pending: (d._pending ?? []).filter((x) => x !== k) }));
  }
  function skip(k: string) {
    dirty.current = true;
    setData((d) => ({ ...d, _pending: Array.from(new Set([...(d._pending ?? []), k])) }));
    toast("Campo marcado como pendente — retome quando quiser.");
  }
  function changeMode(m: Mode) {
    dirty.current = true;
    const id = onSummary ? null : step.id;
    setMode(m);
    const ns = stepsFor(m);
    const idx = id ? ns.findIndex((s) => s.id === id) : -1;
    setI(idx >= 0 ? idx : onSummary ? ns.length : 0);
  }
  function next() {
    dirty.current = true;
    if (mode === "quick") {
      // padrões inteligentes: preenche o sugerido em campos vazios não pulados
      setData((d) => {
        const n = { ...d };
        for (const f of step.fields) if (!f.optional && isEmpty(n[f.key]) && !(n._pending ?? []).includes(f.key) && !isEmpty(f.suggested)) n[f.key] = f.suggested;
        return n;
      });
    }
    setI(i + 1);
  }
  function goTo(key: string) {
    const idx = steps.findIndex((s) => s.fields.some((f) => f.key === key));
    if (idx >= 0) setI(idx);
  }

  const pending = useMemo(() => computePending(data, mode), [data, mode]);
  const warns = useMemo(() => coherence(data), [data]);
  const tips = useMemo(() => fitTips(data), [data]);

  async function finish() {
    const clean = { ...data, _pending: pending, _last_step: "summary" };
    const { error } = await supabase.from("visual_profiles").upsert({ user_id: user.id, data: clean, mode, completed: true, updated_at: new Date().toISOString() });
    if (error) { toast.error("Não foi possível salvar seu perfil."); return; }
    if (!existed) await logEvent("profile_created", { mode, pending: pending.length });
    else await supabase.from("visual_dna").upsert({ user_id: user.id, signals_since_review: 10, updated_at: new Date().toISOString() });
    // Prefill do perfil capilar se ainda vazio
    const { data: hp } = await supabase.from("hair_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!hp && data["hair_texture"]) await supabase.from("hair_profiles").insert({ user_id: user.id, texture: String(data["hair_texture"]) });
    toast.success("Perfil salvo");
    nav({ to: "/studio" });
  }

  async function makeAvatar() {
    setAvBusy(true);
    try {
      const desc = ["body_shape", "height_cm", "skin_tone", "undertone", "eye_color", "hair_color", "hair_texture", "top_size", "bottom_size"].filter((k) => !isEmpty(data[k])).map((k) => `${fieldByKey(k)?.label}: ${optLabel(k, data[k])}${k === "height_cm" ? " cm" : ""}`).join("; ").replace("Blusas e camisas:", "Tamanho de blusa:").replace("Calças:", "Tamanho de calça (BR):");
      const r = await genAvatar({ data: { description: desc } });
      if (r.error || !r.path) { toast.error(r.error ?? "Falhou"); return; }
      const { data: s } = await supabase.storage.from("user-photos").createSignedUrl(r.path, 3600);
      setAvatarUrl(s?.signedUrl ?? null); toast.success("Retrato gerado");
    } catch { toast.error("Não foi possível gerar o avatar agora."); } finally { setAvBusy(false); }
  }

  if (!loaded) return <div className="mx-auto max-w-5xl animate-pulse text-muted-foreground">Carregando seu progresso…</div>;

  const progress = Math.round((Math.min(i, steps.length) / steps.length) * 100);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="inline-flex rounded-full border bg-card p-1 text-sm" role="tablist" aria-label="Modo">
          {([["quick", "Rápido"], ["assisted", "Assistido"]] as const).map(([m, l]) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => changeMode(m)} className={cn("rounded-full px-4 py-1.5", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{l}</button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{mode === "quick" ? "Menos perguntas, com respostas sugeridas." : "Passo a passo, com dicas em cada campo."} Trocar não apaga nada.</p>
      </div>
      <Progress value={progress} className="mb-2" />
      <p className="mb-8 text-sm text-muted-foreground">{onSummary ? "Resumo" : `Passo ${i + 1} de ${steps.length}`} · {ENCOURAGE[Math.min(i, ENCOURAGE.length - 1)]}{pending.length > 0 && ` · ${pending.length} pendente(s)`}</p>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          {onSummary ? (
            <Summary userId={user.id} data={data} mode={mode} pending={pending} warns={warns} reveal={reveal} tips={tips} goTo={goTo} set={set} />
          ) : (
            <>
              <h1 key={step.id} className="text-4xl animate-rise">{step.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">💡 {step.tip}</p>
              <div className="mt-8 space-y-8">
                {step.fields.map((f) => (
                  <FieldInput key={f.key} f={f} value={data[f.key]} assisted={mode === "assisted"} skipped={(data._pending ?? []).includes(f.key)}
                    warn={warns.find((w) => w.key === f.key)?.msg} onChange={(v) => set(f.key, v)} onSkip={() => skip(f.key)} />
                ))}
              </div>
            </>
          )}
          <div className="mt-10 flex justify-between gap-2">
            <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Voltar</Button>
            {onSummary ? <Button variant="accent" onClick={finish}>{pending.length ? "Salvar mesmo assim" : "Salvar perfil"}</Button> : <Button onClick={next}>{i === steps.length - 1 ? "Ver resumo" : "Próximo"}</Button>}
          </div>
          {onSummary && pending.length > 0 && <p className="mt-3 text-right text-sm text-muted-foreground">Faltam {pending.length} campo(s). Sem problema — dá para completar depois.</p>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Seu espelho</p>
            <div className="mx-auto h-72 w-40"><BodyAvatar data={data} /></div>
            <p className="text-center text-[11px] text-muted-foreground">Ilustração das suas respostas, não uma simulação real.</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm font-medium">Convites de caimento</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{tips.map((t) => <li key={t} className="animate-rise">· {t}</li>)}</ul>
          </div>
          <div className="rounded-2xl border bg-card p-4 text-sm">
            <p className="font-medium">Retrato por IA (opcional)</p>
            <ReferenceImage />
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldInput({ f, value, assisted, skipped, warn, onChange, onSkip }: { f: OField; value: unknown; assisted: boolean; skipped: boolean; warn?: string | undefined; onChange: (v: string | number) => void; onSkip: () => void }) {
  const v = value as string | number | undefined;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label className="text-base">{f.label}</Label>
        {skipped && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Pendente</span>}
      </div>
      {assisted && <p className="text-sm text-muted-foreground">{f.hint}{f.example && <> Ex.: <em>{f.example}</em></>}</p>}
      {f.type === "text" && <Input value={(v as string) ?? ""} placeholder={String(f.suggested || f.example || "")} onChange={(e) => onChange(e.target.value)} />}
      {f.type === "area" && <Textarea rows={3} value={(v as string) ?? ""} placeholder={f.example ? `ex.: ${f.example}` : ""} onChange={(e) => onChange(e.target.value)} />}
      {f.type === "number" && <div className="flex max-w-xs items-center gap-2"><Input type="number" inputMode="decimal" value={v ?? ""} placeholder={String(f.suggested || f.example || "")} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />{f.unit && <span className="text-sm text-muted-foreground">{f.unit}</span>}</div>}
      {f.type === "slider" && <div><Slider min={1} max={5} step={1} value={[Number(v ?? f.suggested)]} onValueChange={([x]) => onChange(x ?? 3)} /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{f.min}</span><span>{f.max}</span></div></div>}
      {f.type === "cards" && (
        <div className="flex flex-wrap gap-2">
          {f.options!.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)} className={cn("rounded-xl border px-3 py-2 text-left text-sm transition", v === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>
              {f.key === "body_shape" && <ShapeIcon shape={o.value} />}
              <span className="block font-medium">{o.label}</span>
              {o.hint && assisted && <span className="block max-w-[11rem] text-xs opacity-80">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
      {f.type === "colors" && (
        <div className="flex flex-wrap gap-3">
          {f.options!.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)} className="flex flex-col items-center gap-1 text-xs" aria-pressed={v === o.value}>
              <span className={cn("h-10 w-10 rounded-full border-2 transition", v === o.value ? "border-primary ring-2 ring-primary/40" : "border-border")} style={{ background: o.color }} />{o.label}
            </button>
          ))}
        </div>
      )}
      {warn && <p className="rounded-lg bg-secondary px-3 py-2 text-sm">🤔 {warn}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {!isEmpty(f.suggested) && isEmpty(v) && <button onClick={() => onChange(f.suggested)} className="rounded-full border px-3 py-1 text-xs hover:bg-secondary">Usar sugestão: {optLabel(f.key, f.suggested)}</button>}
        {!skipped && <button onClick={onSkip} className="rounded-full border border-dashed px-3 py-1 text-xs hover:bg-secondary">Não sei · pular e retomar depois</button>}
        <HelpChat field={f} onPick={onChange} onSkip={onSkip} />
      </div>
    </div>
  );
}

function ShapeIcon({ shape }: { shape: string }) {
  const p: Record<string, string> = {
    retangular: "M6 2h12v20H6z", triangulo: "M8 2h8l4 20H4z", triangulo_invertido: "M3 2h18l-5 20H8z",
    oval: "M12 2c6 0 8 6 8 10s-2 10-8 10S4 16 4 12 6 2 12 2z", ampulheta: "M4 2h16l-6 10 6 10H4l6-10z",
  };
  return <svg viewBox="0 0 24 24" className="mb-1 h-8 w-8" aria-hidden><path d={p[shape]} className="fill-current opacity-70" /></svg>;
}

function Summary({ userId, data, mode, pending, warns, reveal, tips, goTo, set }: { userId: string; data: Data; mode: Mode; pending: string[]; warns: { key: string; msg: string }[]; reveal: number; tips: string[]; goTo: (k: string) => void; set: (k: string, v: string | number) => void }) {
  const steps = stepsFor(mode);
  return (
    <div className="space-y-8 animate-rise">
      <h1 className="text-4xl">Seu resumo</h1>
      {pending.length > 0 && (
        <div className="rounded-2xl border border-accent/50 bg-card p-4 text-sm">
          <p className="font-medium">Pendências (não impedem salvar)</p>
          <div className="mt-2 flex flex-wrap gap-2">{pending.map((k) => <button key={k} onClick={() => goTo(k)} className="rounded-full border px-3 py-1 text-xs hover:bg-secondary">{fieldByKey(k)?.label} →</button>)}</div>
        </div>
      )}
      {warns.length > 0 && <div className="space-y-1 text-sm">{warns.map((w) => <p key={w.key + w.msg}>🤔 {w.msg}</p>)}</div>}
      <div className="space-y-4">
        {steps.map((s) => (
          <section key={s.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between"><h2 className="text-xl">{s.title}</h2><button className="text-xs underline" onClick={() => goTo(s.fields[0]!.key)}>Editar passo</button></div>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {s.fields.map((f) => (
                <div key={f.key} className="text-sm">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  {f.type === "text" || f.type === "number" ? (
                    <Input className="mt-1 h-8" type={f.type === "number" ? "number" : "text"} value={(data[f.key] as string) ?? ""} onChange={(e) => set(f.key, f.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} />
                  ) : <dd>{f.type === "area" ? (String(data[f.key] ?? "") || "—") : optLabel(f.key, data[f.key])}</dd>}
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <WardrobeFitting data={data} userId={userId} set={set} />
      <section>
        <h2 className="text-2xl">Primeiros convites, passo a passo</h2>
        <ol className="mt-3 space-y-2">
          {tips.map((t, n) => (
            <li key={t} className={cn("flex gap-3 rounded-xl border bg-card p-3 text-sm transition-all duration-500", n < reveal ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
              <span className="font-display text-2xl text-accent">{n + 1}</span>{t}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">Sugestões automáticas a partir das suas respostas · experimente só se quiser</p>
      </section>
    </div>
  );
}
