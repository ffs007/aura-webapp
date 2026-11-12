import { useEffect, useState } from "react";

/**
 * Modo de visualização do app:
 * - "simples": menu enxuto (Estúdio, Sugestões, Meu Modelo, Profissionais,
 *   Configurações) para quem está começando;
 * - "completo": todas as ferramentas e módulos.
 *
 * A escolha é local ao navegador (por usuário na chave), sincronizada entre
 * abas pelo evento `aura:modo`.
 */
export type ModoVisual = "simples" | "completo";

const KEY = "aura.modo";
const EVENTO = "aura:modo";

export function lerModo(): ModoVisual {
  try {
    return localStorage.getItem(KEY) === "simples" ? "simples" : "completo";
  } catch {
    return "completo";
  }
}

export function salvarModo(modo: ModoVisual) {
  try {
    localStorage.setItem(KEY, modo);
    window.dispatchEvent(new CustomEvent(EVENTO));
  } catch {
    // sem localStorage: a escolha vale só enquanto a aba estiver aberta
  }
}

export function useModoVisual(): [ModoVisual, (modo: ModoVisual) => void] {
  const [modo, setModo] = useState<ModoVisual>(() => lerModo());
  useEffect(() => {
    const atualizar = () => setModo(lerModo());
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);
  return [modo, salvarModo];
}
