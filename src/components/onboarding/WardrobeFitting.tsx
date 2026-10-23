import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BodyAvatar } from "./BodyAvatar";
import { colorFromName, SIZE_TOPS, SIZE_BOTTOMS, PALETTE, type Data } from "@/lib/onboarding";

type Item = { id: string; name: string; category: string; color: string | null };
const SLOTS = [["top", "Parte de cima"], ["bottom", "Parte de baixo"], ["layer", "Terceira peça"]] as const;
type Slot = (typeof SLOTS)[number][0];

/** Provador ilustrado: peças do Guarda-roupa combinadas sobre o boneco. Não é prova virtual real. */
export function WardrobeFitting({ data, userId, set }: { data: Data; userId: string; set: (k: string, v: string | number) => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [pick, setPick] = useState<Record<Slot, string | null>>({ top: null, bottom: null, layer: null });
  const [colors, setColors] = useState<Record<Slot, string | null>>({ top: null, bottom: null, layer: null });
  const [topSize, setTopSize] = useState(String(data["top_size"] ?? "M"));
  const [bottomSize, setBottomSize] = useState(String(data["bottom_size"] ?? "40"));

  useEffect(() => {
    supabase.from("wardrobe_items").select("id, name, category, color").eq("user_id", userId).in("category", SLOTS.map((s) => s[1])).order("created_at", { ascending: false }).then(({ data: r }) => {
      const list = (r ?? []) as Item[];
      setItems(list);
      setPick({ top: list.find((x) => x.category === "Parte de cima")?.id ?? null, bottom: list.find((x) => x.category === "Parte de baixo")?.id ?? null, layer: null });
    });
  }, [userId]);

  const colorOf = (slot: Slot) => {
    if (colors[slot]) return colors[slot]!;
    const it = items?.find((x) => x.id === pick[slot]);
    return it ? colorFromName(it.color) : undefined;
  };
  const fit = (list: string[], chosen: string, base: unknown) => {
    const a = list.indexOf(chosen), b = list.indexOf(String(base ?? chosen));
    return a < 0 || b < 0 ? 0 : a - b;
  };
  const topFit = fit(SIZE_TOPS, topSize, data["top_size"]);
  const bottomFit = fit(SIZE_BOTTOMS, bottomSize, data["bottom_size"]);
  const fitMsg = (n: number) => (n === 0 ? "no seu tamanho" : n > 0 ? "mais solto" : "mais justo");

  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="text-2xl">Provador com seu Guarda-roupa</h2>
      <p className="mt-1 text-sm text-muted-foreground">Combine peças sobre o boneco e brinque com tamanhos e cores. É uma ilustração, não mostra o caimento real.</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-[160px_1fr]">
        <div className="mx-auto h-72 w-40">
          <BodyAvatar data={data} outfit={{ top: colorOf("top"), bottom: colorOf("bottom"), layer: pick.layer || colors.layer ? colorOf("layer") ?? "#6b5a4e" : undefined, topFit, bottomFit }} />
        </div>
        <div className="space-y-4 text-sm">
          {items === null ? <p className="text-muted-foreground">Carregando suas peças…</p> : items.length === 0 && (
            <p className="rounded-lg bg-secondary p-3">Seu Guarda-roupa ainda está vazio. Teste com as cores abaixo ou <Link to="/roupas/armario" className="underline">cadastre peças</Link>.</p>
          )}
          {SLOTS.map(([slot, cat]) => {
            const list = (items ?? []).filter((x) => x.category === cat);
            return (
              <div key={slot}>
                <p className="font-medium">{cat}</p>
                {list.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {slot === "layer" && <button onClick={() => setPick((p) => ({ ...p, layer: null }))} className={cn("rounded-full border px-2.5 py-1 text-xs", !pick.layer && "border-primary bg-primary text-primary-foreground")}>Sem</button>}
                    {list.map((it) => (
                      <button key={it.id} onClick={() => { setPick((p) => ({ ...p, [slot]: it.id })); setColors((c) => ({ ...c, [slot]: null })); }}
                        className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", pick[slot] === it.id && "border-primary bg-primary text-primary-foreground")}>
                        <span className="h-3 w-3 rounded-full border" style={{ background: colorFromName(it.color) }} />{it.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`Cor de ${cat}`}>
                  {PALETTE.map((c) => (
                    <button key={c.value} title={c.label} aria-label={c.label} onClick={() => setColors((s) => ({ ...s, [slot]: c.color! }))}
                      className={cn("h-6 w-6 rounded-full border-2", colors[slot] === c.color ? "border-primary ring-2 ring-primary/40" : "border-border")} style={{ background: c.color }} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="grid gap-3 sm:grid-cols-2">
            <SizePick label="Tamanho da blusa" list={SIZE_TOPS} value={topSize} onChange={setTopSize} note={fitMsg(topFit)} onSave={data["top_size"] !== topSize ? () => set("top_size", topSize) : undefined} />
            <SizePick label="Tamanho da calça" list={SIZE_BOTTOMS} value={bottomSize} onChange={setBottomSize} note={fitMsg(bottomFit)} onSave={data["bottom_size"] !== bottomSize ? () => set("bottom_size", bottomSize) : undefined} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SizePick({ label, list, value, onChange, note, onSave }: { label: string; list: string[]; value: string; onChange: (v: string) => void; note: string; onSave?: (() => void) | undefined }) {
  return (
    <div>
      <p className="font-medium">{label} <span className="font-normal text-muted-foreground">· {note}</span></p>
      <div className="mt-1 flex flex-wrap gap-1">
        {list.map((s) => <button key={s} onClick={() => onChange(s)} className={cn("rounded-md border px-2 py-0.5 text-xs", value === s && "border-primary bg-primary text-primary-foreground")}>{s}</button>)}
      </div>
      {onSave && <button onClick={onSave} className="mt-1 text-xs underline">Usar {value} no meu perfil</button>}
    </div>
  );
}
