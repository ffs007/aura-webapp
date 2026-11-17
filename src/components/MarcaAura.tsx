import { cn } from "@/lib/utils";

/**
 * Marca Aura ID — símbolo "Íris Serena" (kit de identidade, 2026-11-17):
 * auréola + olho em traço contínuo + íris. Geometria idêntica à do favicon
 * (/favicon.svg) para o símbolo ser reconhecido em qualquer tamanho.
 *
 * - variante "simbolo": traço em currentColor — herda a cor do texto
 *   (header, títulos, claro e escuro);
 * - variante "selo": quadrado arredondado vinho com traço marfim —
 *   a cara do favicon (login, splash, menus).
 */
export function MarcaAura({
  variante = "simbolo",
  className,
  titulo = "Aura ID",
}: {
  variante?: "simbolo" | "selo";
  className?: string;
  titulo?: string;
}) {
  const selo = variante === "selo";
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={titulo}
      className={cn(selo ? "rounded-[15%]" : "", className)}
    >
      {selo && <rect width="100" height="100" rx="15" ry="15" fill="#4A2036" />}
      <g
        fill="none"
        stroke={selo ? "#FAF5EE" : "currentColor"}
        strokeLinecap="round"
      >
        {/* Auréola reduzida */}
        <path d="M 32 33 Q 50 17 68 33" strokeWidth="4.6" />
        {/* Silhueta do olho */}
        <path d="M 13 54 Q 50 25 87 54" strokeWidth="5.4" />
        <path d="M 13 54 Q 50 80 87 54" strokeWidth="5.4" />
      </g>
      <circle cx="50" cy="54" r="9.8" fill={selo ? "#FAF5EE" : "currentColor"} />
      <circle cx="50" cy="54" r="4.4" fill={selo ? "#4A2036" : "var(--background)"} />
    </svg>
  );
}
