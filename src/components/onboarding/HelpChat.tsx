import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircleQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarregandoInline, Cartao } from "@/components/estados";
import { FOCO } from "@/lib/design";
import { onboardingHelp } from "@/lib/onboarding.functions";
import type { OField } from "@/lib/onboarding";

type Msg = { role: "user" | "assistant"; text: string; example?: string; options?: string[] };

export function HelpChat({ field, onPick, onSkip }: { field: OField; onPick: (v: string) => void; onSkip: () => void }) {
  const ask = useServerFn(onboardingHelp);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { setMsgs([]); }, [field.key]);
  useEffect(() => { if (open) inp.current?.focus(); }, [open, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, text }];
    setMsgs(next); setQ(""); setBusy(true);
    try {
      const r = await ask({ data: {
        field: field.label, hint: field.hint, options: (field.options ?? []).map((o) => o.label), question: text,
        history: next.slice(-8).map((m) => ({ role: m.role, text: m.text })),
      } });
      if (r.error || !r.answer) setMsgs([...next, { role: "assistant", text: r.error ?? "Não foi possível responder agora." }]);
      else setMsgs([...next, { role: "assistant", text: r.answer.answer, example: r.answer.example, options: r.answer.options }]);
    } catch { setMsgs([...next, { role: "assistant", text: "Não foi possível responder agora. Você pode pular e retomar depois." }]); }
    finally { setBusy(false); }
  }

  function pick(label: string) {
    const opt = field.options?.find((o) => o.label === label);
    onPick(opt ? opt.value : label);
  }

  if (!open) return <Button variant="outline" size="sm" onClick={() => setOpen(true)}><MessageCircleQuestion aria-hidden className="mr-1 h-4 w-4" />Precisa de ajuda?</Button>;
  return (
    <Cartao compacto className="shadow-soft">
      <div className="flex items-center justify-between"><p className="text-sm font-medium">Ajuda sobre "{field.label}"</p><button aria-label="Fechar ajuda" onClick={() => setOpen(false)} className={`rounded-md p-1 ${FOCO}`}><X aria-hidden className="h-4 w-4" /></button></div>
      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto text-sm">
        {msgs.length === 0 && <p className="text-muted-foreground">Pergunte qualquer coisa, por exemplo: "não sei o que responder".</p>}
        {msgs.map((m, i) => m.role === "user" ? (
          <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground">{m.text}</p>
        ) : (
          <div key={i} className="space-y-2">
            <p>{m.text}</p>
            {m.example && <p className="text-muted-foreground">Exemplo: {m.example}</p>}
            <div className="flex flex-wrap gap-2">
              {(m.options ?? []).map((o) => <button key={o} onClick={() => pick(o)} className={`rounded-full border bg-background px-3 py-1 text-xs hover:bg-secondary ${FOCO}`}>Usar: {o}</button>)}
              <button onClick={onSkip} className={`rounded-full border border-dashed px-3 py-1 text-xs hover:bg-secondary ${FOCO}`}>Pular e retomar depois</button>
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gerado por IA</p>
          </div>
        ))}
        {busy && <CarregandoInline rotulo="Pensando…" />}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <Input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sua dúvida…" disabled={busy} />
        <Button type="submit" size="sm" disabled={busy || !q.trim()}>Enviar</Button>
      </form>
    </Cartao>
  );
}
