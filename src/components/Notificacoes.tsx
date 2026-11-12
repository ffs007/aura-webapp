import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CarregandoInline, EstadoErro, EstadoVazio } from "@/components/estados";
import { meusBriefings } from "@/lib/profissionais.functions";

/**
 * Sino do header (desktop e mobile): briefings respondidos/orçados/recusados,
 * lembretes vencidos e revisão de DNA pendente. "Marcar todas como vistas"
 * guarda um timestamp ISO em localStorage — o aviso reaparece quando chega
 * algo mais novo (ou quando um lembrete vence depois da marcação).
 */

const VISTAS_KEY = "aura.notificacoes.vistas";

type RotaNotificacao = "/profissionais" | "/settings" | "/dna";

type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  to: RotaNotificacao;
  quando: string; // ISO — base do "não visto"
};

function lerVistas(): string | null {
  try {
    return localStorage.getItem(VISTAS_KEY);
  } catch {
    return null;
  }
}

function gravarVistas(iso: string) {
  try {
    localStorage.setItem(VISTAS_KEY, iso);
  } catch {
    // sem localStorage: o aviso volta na próxima visita
  }
}

function dataCurta(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR");
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Notificacoes() {
  const meus = useServerFn(meusBriefings);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [vistas, setVistas] = useState<string | null>(() => lerVistas());

  const carregar = useCallback(async () => {
    setErro(false);
    let falhou = false;
    const lista: Notificacao[] = [];

    // 1) Briefings com resposta da profissional.
    try {
      const envios = await meus();
      for (const envio of envios) {
        if (!["respondido", "orcado", "recusado"].includes(envio.status)) continue;
        const profissional = envio.profissional?.nome ?? "Quem atende você";
        const valor = envio.orcamento_valor === null ? "" : ` · ${moeda(Number(envio.orcamento_valor))}`;
        const prazo = envio.orcamento_prazo ? ` · prazo: ${envio.orcamento_prazo}` : "";
        lista.push({
          id: `briefing-${envio.id}`,
          titulo: envio.status === "orcado" ? `Orçamento recebido: ${envio.titulo}` : `Resposta recebida: ${envio.titulo}`,
          descricao:
            envio.status === "orcado"
              ? `${profissional} enviou um orçamento${valor}${prazo}.`
              : envio.resposta
                ? `${profissional}: ${envio.resposta}`
                : `${profissional} respondeu ao seu briefing.`,
          to: "/profissionais",
          quando: envio.created_at,
        });
      }
    } catch {
      // O sino nunca deve quebrar o app; o resto continua carregando.
      falhou = true;
    }

    // 2) Lembretes vencidos e 3) DNA Visual com sinais novos.
    try {
      const { data: usuario } = await supabase.auth.getUser();
      const userId = usuario.user?.id;
      if (userId) {
        const { data: lembretes } = await supabase
          .from("reminders")
          .select("id,title,due_at,created_at")
          .eq("user_id", userId)
          .eq("done", false)
          .lt("due_at", new Date().toISOString())
          .order("due_at", { ascending: false })
          .limit(20);
        for (const lembrete of lembretes ?? []) {
          lista.push({
            id: `lembrete-${lembrete.id}`,
            titulo: `Lembrete: ${lembrete.title}`,
            descricao: `Venceu em ${dataCurta(lembrete.due_at)}. Marque como feito em Configurações.`,
            to: "/settings",
            // Usa created_at (quando o aviso passou a existir), não o vencimento:
            // um lembrete criado agora com data passada precisa voltar a marcar.
            quando: lembrete.created_at,
          });
        }

        const { data: dna } = await supabase
          .from("visual_dna")
          .select("signals_since_review,updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        const sinais = dna?.signals_since_review ?? 0;
        if (sinais >= 5) {
          lista.push({
            id: "dna-revisao",
            titulo: "Hora de revisar seu DNA Visual",
            descricao: `${sinais} sinais novos desde a última revisão.`,
            to: "/dna",
            quando: dna?.updated_at ?? new Date().toISOString(),
          });
        }
      }
    } catch {
      // idem: falha de rede não vira erro na tela
      falhou = true;
    }

    lista.sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime());
    setNotificacoes(lista);
    setCarregando(false);
    setErro(falhou);
  }, [meus]);

  // Atualiza ao montar e sempre que a aba volta a ficar visível/focada.
  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const aoFocar = () => {
      if (document.visibilityState === "visible") void carregar();
    };
    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoFocar);
    return () => {
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoFocar);
    };
  }, [carregar]);

  // Comparação numérica: o Postgres pode mandar "+00:00" e o localStorage ".000Z".
  const vistasMs = (() => {
    if (!vistas) return null;
    const valor = new Date(vistas).getTime();
    return Number.isNaN(valor) ? null : valor;
  })();
  const naoLidas = notificacoes.filter((n) => {
    if (vistasMs === null) return true;
    const quando = new Date(n.quando).getTime();
    return Number.isFinite(quando) && quando > vistasMs;
  }).length;

  function marcarTodasComoVistas() {
    const agora = new Date().toISOString();
    gravarVistas(agora);
    setVistas(agora);
    toast.success("Notificações marcadas como vistas.");
  }

  return (
    <Popover
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (valor) void carregar();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 shrink-0 md:h-9 md:w-9"
          aria-label={`Abrir notificações (${naoLidas})`}
          title="Notificações"
        >
          <Bell aria-hidden className="h-5 w-5" />
          {naoLidas > 0 && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-xs font-semibold leading-none text-accent-foreground"
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <p className="text-sm font-medium">Notificações</p>
          <span className="text-xs text-muted-foreground">{naoLidas > 0 ? `${naoLidas} nova${naoLidas > 1 ? "s" : ""}` : "em dia"}</span>
        </div>

        {carregando ? (
          <div className="flex justify-center px-3 py-6">
            <CarregandoInline />
          </div>
        ) : erro && notificacoes.length === 0 ? (
          <EstadoErro
            className="m-3"
            titulo="Não foi possível carregar suas notificações"
            onTentarNovamente={() => void carregar()}
          />
        ) : notificacoes.length === 0 ? (
          <EstadoVazio
            compacto
            className="m-3 border-0"
            icone={<CheckCheck className="size-5" />}
            titulo="Tudo em dia"
            descricao="Sem novos briefings, lembretes vencidos ou revisões de DNA."
            acoes={<Button asChild size="sm" variant="outline"><Link to="/profissionais" onClick={() => setAberto(false)}>Ver meus envios</Link></Button>}
          />
        ) : (
          <ul className="max-h-80 overflow-y-auto p-1">
            {notificacoes.map((notificacao) => {
              const quando = new Date(notificacao.quando).getTime();
              const nova = vistasMs === null || (Number.isFinite(quando) && quando > vistasMs);
              return (
                <li key={notificacao.id}>
                  <Link
                    // `to` é uma rota estática conhecida em runtime; o union dos três
                    // destinos só não casa com o tipo literal do roteador.
                    to={notificacao.to as never}
                    onClick={() => setAberto(false)}
                    className="flex gap-2 rounded-md px-2 py-2 hover:bg-secondary"
                  >
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${nova ? "bg-accent" : "bg-transparent"}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug">{notificacao.titulo}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{notificacao.descricao}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-xs"
            onClick={marcarTodasComoVistas}
            disabled={!notificacoes.length || naoLidas === 0}
          >
            <CheckCheck aria-hidden className="size-4" /> Marcar todas como vistas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
