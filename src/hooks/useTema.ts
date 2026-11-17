import { useEffect, useState } from "react";

/**
 * Tema visual do app: "claro" | "escuro" | "sistema".
 * - "sistema" segue prefers-color-scheme do aparelho;
 * - Preferência salva em localStorage ("aura.tema"), sincronizada entre abas;
 * - Aplica/remove a classe `.dark` no <html> — todos os tokens CSS trocam.
 */
export type Tema = "claro" | "escuro" | "sistema";

const KEY = "aura.tema";
const EVENTO = "aura:tema";

const escuroReal = (tema: Tema): boolean => {
  if (tema === "escuro") return true;
  if (tema === "claro") return false;
  try { return window.matchMedia("(prefers-color-scheme: dark)").matches; }
  catch { return false; }
};

const aplicar = (tema: Tema) => {
  const escuro = escuroReal(tema);
  document.documentElement.classList.toggle("dark", escuro);
};

export function lerTema(): Tema {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "claro" || t === "escuro" || t === "sistema") return t;
  } catch { /* sem localStorage */ }
  return "sistema";
}

export function salvarTema(tema: Tema) {
  try {
    localStorage.setItem(KEY, tema);
    window.dispatchEvent(new CustomEvent(EVENTO));
  } catch { /* só preferência */ }
}

export function useTema(): [Tema, (tema: Tema) => void] {
  const [tema, setTema] = useState<Tema>(() => lerTema());

  useEffect(() => {
    aplicar(tema);
    const atualizar = () => { setTema(lerTema()); aplicar(lerTema()); };
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const ouvirPreferencia = () => { if (lerTema() === "sistema") aplicar("sistema"); };
    mq.addEventListener("change", ouvirPreferencia);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
      mq.removeEventListener("change", ouvirPreferencia);
    };
  }, [tema]);

  const trocar = (proximo: Tema) => {
    salvarTema(proximo);
    setTema(proximo);
    aplicar(proximo);
  };

  return [tema, trocar];
}

/** Script inline para <head> — evita flash de tema errado na primeira carga. */
export const SCRIPT_ANTI_FLASH = `try{const t=localStorage.getItem("aura.tema");const d=t==="escuro"||(t!=="claro"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}`;
