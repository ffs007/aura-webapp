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

export type ErrosResposta =
  | {
      ok: true;
      janelaHoras: number;
      total: number;
      naUltimaHora: number;
      /** true quando o volume merece atenção imediata (alerta no painel). */
      alerta: boolean;
      grupos: { path: string; mensagem: string; total: number; ultimo: string }[];
    }
  | { ok: false; motivo: string };

const JANELA_ERROS_HORAS = 24;
const LIMITE_ERROS = 500;
const ALERTA_ULTIMA_HORA = 5;
const ALERTA_TOTAL_DIA = 20;

/**
 * Erros de tela dos últimos 24 h, agrupados por rota + mensagem.
 * Admin-only (service role), sem dado pessoal: só path e mensagem truncada que
 * a própria instrumentação já limita a 200 caracteres.
 */
export const errosInstrumentacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ErrosResposta> => {
    try {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) return { ok: false, motivo: MOTIVO_INDISPONIVEL };

      const agora = Date.now();
      const inicio = new Date(agora - JANELA_ERROS_HORAS * 60 * 60 * 1000).toISOString();
      const limiteHora = agora - 60 * 60 * 1000;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("audit_events")
        .select("created_at, meta")
        .eq("event", "erro_tela")
        .gte("created_at", inicio)
        .order("created_at", { ascending: false })
        .limit(LIMITE_ERROS);
      if (error) return { ok: false, motivo: MOTIVO_INDISPONIVEL };

      const linhas = data ?? [];
      let naUltimaHora = 0;
      const grupos = new Map<string, { path: string; mensagem: string; total: number; ultimo: string }>();
      for (const linha of linhas) {
        const meta = (linha.meta ?? {}) as Record<string, unknown>;
        const path = typeof meta["path"] === "string" ? meta["path"] : "(desconhecida)";
        const mensagem = typeof meta["mensagem"] === "string" ? meta["mensagem"] : "(sem mensagem)";
        if (new Date(linha.created_at).getTime() >= limiteHora) naUltimaHora += 1;
        const chave = `${path}|${mensagem}`;
        const atual = grupos.get(chave);
        if (atual) atual.total += 1;
        else grupos.set(chave, { path, mensagem, total: 1, ultimo: linha.created_at });
      }

      const ordenados = [...grupos.values()].sort((a, b) => b.total - a.total).slice(0, 8);
      return {
        ok: true,
        janelaHoras: JANELA_ERROS_HORAS,
        total: linhas.length,
        naUltimaHora,
        alerta: naUltimaHora >= ALERTA_ULTIMA_HORA || linhas.length >= ALERTA_TOTAL_DIA,
        grupos: ordenados,
      };
    } catch {
      return { ok: false, motivo: MOTIVO_INDISPONIVEL };
    }
  });

export type CustosResposta =
  | {
      ok: true;
      janelaDias: number;
      totalUsd: number;
      hojeUsd: number;
      imagens: number;
      orcamentoDiarioReferenciaUsd: number;
      topUsuarios: { usuario: string; custoUsd: number; runs: number }[];
      serie: { dia: string; custoUsd: number }[];
    }
  | { ok: false; motivo: string };

const JANELA_CUSTO_DIAS = 30;
const LIMITE_CUSTO_LINHAS = 10_000;
/** Mesmo valor padrão usado pelo gateway (IMAGE_DAILY_BUDGET_USD). */
const ORCAMENTO_DIARIO_REFERENCIA = 15;
const TAREFA_DE_IMAGEM = /render|\.edit|\.sim|tryon|adjust/;

/** Custo real de IA (core.ai_runs) dos últimos 30 dias — admin-only. */
export const custosInstrumentacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustosResposta> => {
    try {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) return { ok: false, motivo: MOTIVO_INDISPONIVEL };

      const agora = new Date();
      const inicio = new Date(agora.getTime() - JANELA_CUSTO_DIAS * 24 * 60 * 60 * 1000).toISOString();
      const inicioDia = diaLocal(agora.toISOString());
      // `core.ai_runs` fica em outro schema: lemos via REST com service role
      // (admin já validado acima). O contrato tipado cobre só `public`.
      const url = process.env["SUPABASE_URL"];
      const chaveServico = process.env["SUPABASE_SERVICE_ROLE_KEY"];
      if (!url || !chaveServico) return { ok: false, motivo: MOTIVO_INDISPONIVEL };
      const filtros = new URLSearchParams({
        select: "user_id,task_id,cost_usd,created_at",
        status: "eq.completed",
        created_at: `gte.${inicio}`,
        limit: String(LIMITE_CUSTO_LINHAS),
      });
      const resposta = await fetch(`${url}/rest/v1/ai_runs?${filtros}`, {
        headers: {
          apikey: chaveServico,
          Authorization: `Bearer ${chaveServico}`,
          "Accept-Profile": "core",
        },
      });
      if (!resposta.ok) return { ok: false, motivo: MOTIVO_INDISPONIVEL };
      const linhas = (await resposta.json()) as {
        user_id: string;
        task_id: string;
        cost_usd: number | string | null;
        created_at: string;
      }[];
      let totalUsd = 0;
      let hojeUsd = 0;
      let imagens = 0;
      const porUsuario = new Map<string, { custoUsd: number; runs: number }>();
      const porDia = new Map<string, number>();
      for (const linha of linhas) {
        const custo = Number(linha.cost_usd) || 0;
        totalUsd += custo;
        if (diaLocal(linha.created_at) === inicioDia) hojeUsd += custo;
        if (TAREFA_DE_IMAGEM.test(linha.task_id)) imagens += 1;
        const atual = porUsuario.get(linha.user_id) ?? { custoUsd: 0, runs: 0 };
        atual.custoUsd += custo;
        atual.runs += 1;
        porUsuario.set(linha.user_id, atual);
        porDia.set(diaLocal(linha.created_at), (porDia.get(diaLocal(linha.created_at)) ?? 0) + custo);
      }

      const topUsuarios = [...porUsuario.entries()]
        .map(([usuario, valor]) => ({ usuario, custoUsd: Math.round(valor.custoUsd * 1000) / 1000, runs: valor.runs }))
        .sort((a, b) => b.custoUsd - a.custoUsd)
        .slice(0, 5);

      const serie: { dia: string; custoUsd: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const dia = diaLocal(new Date(agora.getTime() - i * 24 * 60 * 60 * 1000).toISOString());
        serie.push({ dia: rotuloDia(dia), custoUsd: Math.round((porDia.get(dia) ?? 0) * 1000) / 1000 });
      }

      return {
        ok: true,
        janelaDias: JANELA_CUSTO_DIAS,
        totalUsd: Math.round(totalUsd * 100) / 100,
        hojeUsd: Math.round(hojeUsd * 100) / 100,
        imagens,
        orcamentoDiarioReferenciaUsd: ORCAMENTO_DIARIO_REFERENCIA,
        topUsuarios,
        serie,
      };
    } catch {
      return { ok: false, motivo: MOTIVO_INDISPONIVEL };
    }
  });

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
