import { useEffect, useState } from "react";

/**
 * Rascunho local (por navegador) para formulários que hoje perdem tudo ao sair.
 *
 * - `lerRascunho` devolve o último valor salvo (ou null), descartando rascunhos
 *   com mais de 7 dias.
 * - `useSalvarRascunho` salva com debounce e devolve o horário do último save
 *   (para mostrar "Rascunho salvo às HH:MM").
 * - `limparRascunho` deve ser chamado quando o formulário é concluído.
 *
 * Inclua o id do usuário na chave (ex.: `tattoo:<userId>:intencao`) para não
 * misturar rascunhos de contas diferentes no mesmo navegador.
 */
const PREFIX = "aura.rascunho.";
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

type Guardado<T> = { v: T; at: number };

export function lerRascunho<T>(chave: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + chave);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Guardado<T>;
    if (!parsed || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > VALIDADE_MS) {
      localStorage.removeItem(PREFIX + chave);
      return null;
    }
    return parsed.v ?? null;
  } catch {
    return null;
  }
}

export function limparRascunho(chave: string) {
  try {
    localStorage.removeItem(PREFIX + chave);
  } catch {
    // sem localStorage: nada a limpar
  }
}

export function useSalvarRascunho<T>(chave: string, valor: T, ativo = true): number | null {
  const [salvoEm, setSalvoEm] = useState<number | null>(null);
  useEffect(() => {
    if (!ativo) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + chave, JSON.stringify({ v: valor, at: Date.now() } satisfies Guardado<T>));
        setSalvoEm(Date.now());
      } catch {
        // sem localStorage: o rascunho simplesmente não é salvo
      }
    }, 700);
    return () => clearTimeout(t);
  }, [chave, valor, ativo]);
  return salvoEm;
}

export function rotuloRascunho(salvoEm: number | null): string {
  if (!salvoEm) return "";
  const hora = new Date(salvoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Rascunho salvo às ${hora}`;
}
