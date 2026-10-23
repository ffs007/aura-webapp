import { Badge } from "@/components/ui/badge";
import { LEVEL3, LEVEL_LABEL, REVERSIBILITY, type AuraPackage } from "@/lib/aura";
import { ReferenceImage } from "./ReferenceImage";

export function Indicators({ c }: { c: AuraPackage }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="secondary">Custo: {LEVEL3[c.cost]}</Badge>
      <Badge variant="secondary">Manutenção: {LEVEL3[c.maintenance]}</Badge>
      <Badge variant={c.reversibility === "permanent" ? "destructive" : "secondary"}>Reversibilidade: {REVERSIBILITY[c.reversibility]}</Badge>
      <Badge variant="secondary">Adaptação: {c.adaptation_time}</Badge>
      {c.professional_validation && <Badge className="bg-ochre text-foreground hover:bg-ochre">Validar com profissional</Badge>}
    </div>
  );
}

export function AiLabel() {
  return <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Gerado por IA</span>;
}

export function Variations({ c, packageId }: { c: AuraPackage; packageId?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {c.variations.map((v) => (
        <div key={v.level} className="rounded-2xl border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-accent">{LEVEL_LABEL[v.level]}</div>
          <p className="mt-1 font-display text-xl leading-snug">{v.summary}</p>
          <dl className="mt-3 space-y-2 text-sm">
            {([["Roupas", v.clothing], ["Maquiagem", v.makeup], ["Cabelo", v.hair], ["Barba", v.beard], ["Acessórios", v.accessories], ["Visibilidade de tatuagem", v.tattoo_visibility]] as const).filter(([, val]) => val && !/^não se aplica[.!]?$/i.test(val.trim())).map(([k, val]) => (
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{val}</dd></div>
            ))}
          </dl>
          {packageId && <ReferenceImage packageId={packageId} slot={v.level} />}
        </div>
      ))}
    </div>
  );
}
