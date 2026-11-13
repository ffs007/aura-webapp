import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Histórico/versões de sugestões (Etapa 2.6) — sem coluna de versão no banco.
 *
 * A "versão" de uma sugestão é outra linha de `packages` criada a partir dela.
 * O histórico confiável é a linha do tempo de itens do mesmo `kind`.
 */
type Json = Database["public"]["Tables"]["packages"]["Row"]["content"];

/** Linha mínima de `packages` necessária para duplicar uma sugestão. */
export type SugestaoDuplicavel = {
  id: string;
  kind?: string | null;
  entry_mode: string;
  emotional_mode?: string | null;
  content: unknown;
  context?: unknown;
  beautiful_not_practical?: boolean | null;
};

export type VersaoSugestao = {
  id: string;
  kind: string;
  title: string;
  status: string;
  created_at: string;
  entry_mode: string | null;
};

const TITULO_PADRAO = "Sugestão Aura ID";

/**
 * Cria uma cópia da sugestão como nova linha em `packages`, com status "new",
 * nota e lote zerados para o histórico começar limpo.
 *
 * Obs.: `batch_id` é `NOT NULL` no schema (sem migração aqui). Em vez de `null`,
 * a cópia recebe um lote próprio (`crypto.randomUUID()`), assim não entra no
 * lote/agrupamento da original e continua valendo como sugestão avulsa.
 */
export async function duplicarSugestao(p: SugestaoDuplicavel): Promise<{ id: string }> {
  const { data: sessao, error: erroUsuario } = await supabase.auth.getUser();
  const user = sessao?.user;
  if (erroUsuario || !user) throw new Error("Entre na sua conta para duplicar esta sugestão.");

  const original = (p.content && typeof p.content === "object" ? p.content : {}) as Record<string, unknown>;
  const tituloOriginal = typeof original["title"] === "string" && original["title"].trim() ? original["title"].trim() : TITULO_PADRAO;
  const content = { ...original, title: `${tituloOriginal} · cópia` };

  const { data, error } = await supabase
    .from("packages")
    .insert({
      user_id: user.id,
      batch_id: crypto.randomUUID(),
      entry_mode: p.entry_mode,
      status: "new",
      note: null,
      content: content as unknown as Json,
      ...(p.kind ? { kind: p.kind } : {}),
      ...(p.emotional_mode ? { emotional_mode: p.emotional_mode } : {}),
      ...(p.context !== undefined && p.context !== null ? { context: p.context as unknown as Json } : {}),
      ...(typeof p.beautiful_not_practical === "boolean" ? { beautiful_not_practical: p.beautiful_not_practical } : {}),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Não foi possível duplicar esta sugestão. Tente de novo.");
  return { id: data.id };
}

/**
 * Últimas 8 sugestões do mesmo `kind` para a linha do tempo do histórico.
 * `content.title` é lido em memória (o título mora no JSON, não em coluna).
 */
export async function listarVersoes(userId: string, kind: string): Promise<VersaoSugestao[]> {
  const { data, error } = await supabase
    .from("packages")
    .select("id,kind,status,created_at,entry_mode,content")
    .eq("user_id", userId)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw new Error("Não foi possível carregar o histórico agora. Tente de novo.");

  return (data ?? []).map((row) => {
    const content = (row.content ?? {}) as Record<string, unknown>;
    const title = typeof content["title"] === "string" && content["title"].trim() ? content["title"].trim() : TITULO_PADRAO;
    return {
      id: row.id,
      kind: row.kind,
      title,
      status: row.status,
      created_at: row.created_at,
      entry_mode: row.entry_mode ?? null,
    };
  });
}
