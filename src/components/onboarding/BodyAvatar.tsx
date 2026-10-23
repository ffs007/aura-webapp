import { memo } from "react";
import { SKIN, EYES, HAIR_COLORS, optColor, type Data } from "@/lib/onboarding";

// Espelho ilustrado: atualiza instantaneamente a partir das respostas. Não é foto nem simulação real.
const SHAPES: Record<string, [number, number, number]> = {
  retangular: [38, 34, 38], triangulo: [33, 30, 44], triangulo_invertido: [45, 32, 34], oval: [38, 42, 40], ampulheta: [42, 27, 42],
};

export type Outfit = { top?: string | undefined; bottom?: string | undefined; layer?: string | undefined; topFit?: number; bottomFit?: number };

export const BodyAvatar = memo(function BodyAvatar({ data, outfit }: { data: Data; outfit?: Outfit }) {
  const [sh0, wa0, hip0] = SHAPES[String(data["body_shape"] ?? "retangular")] ?? SHAPES["retangular"]!;
  const tf = (outfit?.topFit ?? 0) * 2, bf = (outfit?.bottomFit ?? 0) * 2;
  const sh = sh0 + tf, wa = wa0 + tf, hip = hip0 + Math.max(tf, bf) / 2;
  const legW = hip0 - 8 + bf;
  const skin = optColor(SKIN, data["skin_tone"], "#c99673");
  const eye = optColor(EYES, data["eye_color"], "#3b2416");
  const hair = optColor(HAIR_COLORS, data["hair_color"], "#3d2618");
  const h = Math.min(Math.max(Number(data["height_cm"]) || 165, 140), 200);
  const scale = 0.85 + ((h - 140) / 60) * 0.2;
  const tex = String(data["hair_texture"] ?? "Ondulado");
  const cx = 60;
  const body = `M ${cx - sh} 92 Q ${cx - wa - 4} 125 ${cx - wa} 140 Q ${cx - hip - 2} 160 ${cx - hip} 182 L ${cx + hip} 182 Q ${cx + hip + 2} 160 ${cx + wa} 140 Q ${cx + wa + 4} 125 ${cx + sh} 92 Z`;
  const curls = tex === "Cacheado" || tex === "Crespo";
  return (
    <svg viewBox="0 0 120 260" role="img" aria-label="Avatar ilustrado com base nas suas respostas" className="h-full w-full">
      <ellipse cx={cx} cy={252} rx={34} ry={4} className="fill-foreground/10" />
      <g style={{ transform: `scale(${scale})`, transformOrigin: "60px 250px", transition: "transform .3s ease" }}>
        <g style={{ transition: "all .3s ease" }}>
          {/* cabelo atrás */}
          {curls ? <circle cx={cx} cy={52} r={tex === "Crespo" ? 32 : 28} fill={hair} /> : <path d={`M ${cx - 24} 50 Q ${cx} 10 ${cx + 24} 50 L ${cx + 24} ${tex === "Liso" ? 96 : 88} Q ${cx} 92 ${cx - 24} ${tex === "Liso" ? 96 : 88} Z`} fill={hair} />}
          <rect x={cx - 7} y={72} width={14} height={20} fill={skin} />
          <ellipse cx={cx} cy={56} rx={18} ry={22} fill={skin} />
          <path d={`M ${cx - 19} 50 Q ${cx} 26 ${cx + 19} 50 Q ${cx + 8} 38 ${cx - 19} 50 Z`} fill={hair} />
          <circle cx={cx - 7} cy={58} r={2.4} fill={eye} /><circle cx={cx + 7} cy={58} r={2.4} fill={eye} />
          <path d={`M ${cx - 5} 67 Q ${cx} 70 ${cx + 5} 67`} className="stroke-foreground/50" fill="none" strokeWidth={1.2} strokeLinecap="round" />
          {/* braços */}
          <path d={`M ${cx - sh} 94 Q ${cx - sh - 8} 140 ${cx - hip - 6} 176`} stroke={skin} strokeWidth={9} strokeLinecap="round" fill="none" />
          <path d={`M ${cx + sh} 94 Q ${cx + sh + 8} 140 ${cx + hip + 6} 176`} stroke={skin} strokeWidth={9} strokeLinecap="round" fill="none" />
          <path d={body} className={outfit?.top ? undefined : "fill-primary"} style={{ transition: "all .3s ease", fill: outfit?.top }} />
          {outfit?.layer && <><path d={`M ${cx - sh - 2} 90 L ${cx - 6} 96 L ${cx - 8} 170 L ${cx - wa - 6} 170 Z`} style={{ fill: outfit.layer }} opacity={0.95} /><path d={`M ${cx + sh + 2} 90 L ${cx + 6} 96 L ${cx + 8} 170 L ${cx + wa + 6} 170 Z`} style={{ fill: outfit.layer }} opacity={0.95} /></>}
          {/* pernas */}
          <rect x={cx - 2 - legW} y={180} width={legW} height={66} rx={6} className={outfit?.bottom ? undefined : "fill-accent"} style={{ fill: outfit?.bottom, transition: "all .3s ease" }} />
          <rect x={cx + 2} y={180} width={legW} height={66} rx={6} className={outfit?.bottom ? undefined : "fill-accent"} style={{ fill: outfit?.bottom, transition: "all .3s ease" }} />
        </g>
      </g>
    </svg>
  );
});
