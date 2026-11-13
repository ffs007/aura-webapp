import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Painel do funil (Onda 3 · Etapa 2.7) — leitura somente para administradores.
 * Lê `audit_events` (a mesma tabela que o `logEvent` já alimenta) dos últimos
 * 7 dias e devolve apenas contagens: nenhum dado pessoal sai daqui.
 */

const MOTIVO_INDISPONIVEL = "Funil indisponível para esta conta.";
const JANELA_DIAS = 7;
const LIMITE_EVENTOS = 5000;
const FUSO = "America/Sao_Paulo";

/** Ordem canônica do funil — eventos ausentes aparecem com 0 no painel. */
export const FUNIL_PASSOS = [
  { evento: "profile_created", nome: "Perfil criado" },
  { evento: "onboarding_completed", nome: "Onboarding concluído" },
  { evento: "recommendation_saved", nome: "Sugestão salva" },
  { evento: "recommendation_approved", nome: "Sugestão aprovada" },
  { evento: "feedback_given", nome: "Feedback enviado" },
  { evento: "suggestion_exported", nome: "Sugestão exportada" },
  { evento: "briefing_sent", nome: "Briefing enviado" },
] as const;

export type FunilPasso = {
  evento: string;
  nome: string;
  total: number;
  /** % sobre o passo anterior; `null` no primeiro passo ou quando o anterior é 0. */
  percentualDoAnterior: number | null;
};

export type FunilDia = {
  /** Data local (America/Sao_Paulo) no formato YYYY-MM-DD. */
  dia: string;
  /** Data curta para exibição, ex.: "09/11". */
  rotulo: string;
  total: number;
  telas: number;
  erros: number;
};

export type FunilResposta =
  | {
      ok: true;
      janela: { de: string; ate: string; dias: number };
      totalEventos: number;
      passos: FunilPasso[];
      topEventos: { evento: string; total: number }[];
      serie: FunilDia[];
    }
  | { ok: false; motivo: string };

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-11-09T..." → "2026-11-09" no fuso de São Paulo. */
function diaLocal(iso: string): string {
  return formatoDia.format(new Date(iso));
}

function rotuloDia(dia: string): string {
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

export const funilInstrumentacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FunilResposta> => {
    try {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) return { ok: false, motivo: MOTIVO_INDISPONIVEL };

      const agora = new Date();
      const inicio = new Date(agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000);

      // Agregado global: só o service role (admin-only neste handler) enxerga
      // eventos de todas as contas. Qualquer falha vira resposta amigável.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("audit_events")
        .select("event, created_at, meta")
        .gte("created_at", inicio.toISOString())
        .order("created_at", { ascending: false })
        .limit(LIMITE_EVENTOS);
      if (error) return { ok: false, motivo: MOTIVO_INDISPONIVEL };

      const linhas = data ?? [];
      const porEvento = new Map<string, number>();
      const dias: string[] = [];
      for (let i = JANELA_DIAS - 1; i >= 0; i--) {
        dias.push(diaLocal(new Date(agora.getTime() - i * 24 * 60 * 60 * 1000).toISOString()));
      }
      const porDia = new Map<string, { total: number; telas: number; erros: number }>();
      for (const dia of dias) porDia.set(dia, { total: 0, telas: 0, erros: 0 });

      for (const linha of linhas) {
        porEvento.set(linha.event, (porEvento.get(linha.event) ?? 0) + 1);
        const dia = porDia.get(diaLocal(linha.created_at));
        if (!dia) continue;
        dia.total += 1;
        if (linha.event === "tela_visualizada") dia.telas += 1;
        if (linha.event === "erro_tela") dia.erros += 1;
      }

      let anterior: number | null = null;
      const passos: FunilPasso[] = FUNIL_PASSOS.map(({ evento, nome }) => {
        const total = porEvento.get(evento) ?? 0;
        const percentualDoAnterior = anterior === null || anterior === 0 ? null : Math.round((total / anterior) * 100);
        anterior = total;
        return { evento, nome, total, percentualDoAnterior };
      });

      const topEventos = [...porEvento.entries()]
        .map(([evento, total]) => ({ evento, total }))
        .sort((a, b) => b.total - a.total || a.evento.localeCompare(b.evento, "pt-BR"))
        .slice(0, 5);

      const serie: FunilDia[] = dias.map((dia) => {
        const d = porDia.get(dia) ?? { total: 0, telas: 0, erros: 0 };
        return { dia, rotulo: rotuloDia(dia), total: d.total, telas: d.telas, erros: d.erros };
      });

      return {
        ok: true,
        janela: { de: inicio.toISOString(), ate: agora.toISOString(), dias: JANELA_DIAS },
        totalEventos: linhas.length,
        passos,
        topEventos,
        serie,
      };
    } catch {
      return { ok: false, motivo: MOTIVO_INDISPONIVEL };
    }
  });
