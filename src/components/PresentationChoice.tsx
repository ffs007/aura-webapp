import { Button } from "@/components/ui/button";
import { PRESENTATIONS } from "@/lib/presentation";
export function PresentationChoice({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">Estrutura da sugestão</legend><div className="flex flex-wrap gap-2">{PRESENTATIONS.map(p => <Button type="button" key={p.value} size="sm" variant={value === p.value ? "default" : "outline"} aria-pressed={value === p.value} onClick={() => onChange(p.value)}>{p.label}</Button>)}</div></fieldset>;
}