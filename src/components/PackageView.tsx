import { Badge } from "@/components/ui/badge";
import { LEVEL3, LEVEL_LABEL, REVERSIBILITY, type AuraPackage } from "@/lib/aura";
import { CARTAO_COMPACTO, ROTULO_CATEGORIA } from "@/lib/design";
import { ReferenceImage } from "./ReferenceImage";

export function Indicators({ c }: { c: AuraPackage }) {
  const cost = c.cost ? LEVEL3[c.cost] ?? c.cost : "";
  const maintenance = c.maintenance ? LEVEL3[c.maintenance] ?? c.maintenance : "";
  const reversibility = c.reversibility ? REVERSIBILITY[c.reversibility] ?? c.reversibility : "";
  const adaptation = typeof c.adaptation_time === "string" ? c.adaptation_time.trim() : "";
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {cost && <Badge variant="secondary">Custo: {cost}</Badge>}
      {maintenance && <Badge variant="secondary">Manutenção: {maintenance}</Badge>}
      {reversibility && <Badge variant={c.reversibility === "permanent" ? "destructive" : "secondary"}>Reversibilidade: {reversibility}</Badge>}
      {adaptation && <Badge variant="secondary">Adaptação: {adaptation}</Badge>}
      {c.professional_validation && <Badge className="bg-ochre text-foreground hover:bg-ochre">Validar com profissional</Badge>}
    </div>
  );
}

export function AiLabel() {
  return <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-widest text-muted-foreground">Gerado por IA</span>;
}

export function Variations({ c, packageId }: { c: AuraPackage; packageId?: string }) {
  const items = Array.isArray(c.variations) ? c.variations : [];
  if (!items.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((v) => (
        <div key={v.level} className={CARTAO_COMPACTO}>
          <div className={ROTULO_CATEGORIA}>{LEVEL_LABEL[v.level] ?? v.level}</div>
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
