import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Compass, FolderHeart, MapPin, MessagesSquare, Search, SearchX, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Aviso, CarregandoInline, EstadoVazio } from "@/components/estados";
import { filtrarPorTermo, limitar, normalizarBusca } from "@/lib/busca";

/**
 * Busca global (⌘K / Ctrl+K): páginas do app, sugestões, coleções, lembretes,
 * briefings e profissionais ativos. Cada fonte consulta o Supabase com limite
 * próprio e falha em silêncio (uma fonte com problema não derruba a busca).
 * O rodapé do diálogo lembra os atalhos; `?` abre a ajuda guiada.
 */

type Pagina = { to: string; label: string };

const PAGINAS: Pagina[] = [
  { to: "/studio", label: "Estúdio" },
  { to: "/dashboard", label: "Sugestões" },
  { to: "/maquiagem", label: "Maquiagem" },
  { to: "/cabelo", label: "Cabelo" },
  { to: "/roupas", label: "Roupas" },
  { to: "/tatuagem", label: "Tatuagem" },
  { to: "/jornada", label: "Jornada" },
  { to: "/dna", label: "DNA Visual" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/modelo", label: "Modelo" },
  { to: "/retrato", label: "Retrato" },
  { to: "/estetica", label: "Estética" },
  { to: "/export", label: "Exportar" },
  { to: "/compare", label: "Comparar" },
  { to: "/settings", label: "Configurações" },
  { to: "/guia", label: "Guia" },
  { to: "/aura-pass", label: "Aura Pass" },
];

/** Limite de resultados por fonte (5–8 itens, como pede a busca). */
const LIMITE_RESULTADOS = 8;

type Resultado = { id: string; titulo: string; descricao: string; rota: string; valor: string };
type Sugestao = { id: string; titulo: string; rota: string };
type Colecao = { id: string; name: string; total: number };
type Lembrete = { id: string; title: string; due_at: string; done: boolean };
type Briefing = { id: string; titulo: string; texto: string; status: string; profissional: string };
type ProfissionalBusca = { id: string; nome: string; nome_salao: string | null; profissao: string; slug: string };

/** Mesmo mapa de rotas por tipo usado no dashboard (sugestões). */
function rotaDoPacote(kind: string, id: string): string {
  switch (kind) {
    case "tattoo_plan": return `/tatuagem/plano/${id}`;
    case "makeup_look": return `/maquiagem/look/${id}`;
    case "hair_plan": return `/cabelo/plano/${id}`;
    case "outfit": return `/roupas/look/${id}`;
    default: return `/package/${id}`;
  }
}

/**
 * cmdk filtra pelo `value`: incluímos a forma original e a normalizada (sem
 * acento) para a busca funcionar tanto digitando "estetica" quanto "Estética".
 */
function valorDe(...textos: (string | null | undefined)[]): string {
  const texto = textos.filter((t): t is string => typeof t === "string" && t.length > 0).join(" ");
  return `${texto} ${normalizarBusca(texto)}`.trim();
}

function dataCurta(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR");
}

const STATUS_BRIEFING: Record<string, string> = {
  enviado: "Enviado",
  respondido: "Respondido",
  orcado: "Orçado",
  recusado: "Recusado",
};

export function BuscaGlobal() {
  const nav = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[] | null>(null);
  const [erroSugestoes, setErroSugestoes] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [colecoes, setColecoes] = useState<Colecao[] | null>(null);
  const [lembretes, setLembretes] = useState<Lembrete[] | null>(null);
  const [briefings, setBriefings] = useState<Briefing[] | null>(null);
  const [profissionais, setProfissionais] = useState<ProfissionalBusca[] | null>(null);

  // Ctrl/Cmd+K abre a busca em qualquer lugar; `?` abre a ajuda guiada
  // (só quando o foco não está num campo de digitação).
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setAberto((valor) => !valor);
        return;
      }
      if (evento.key !== "?" || evento.metaKey || evento.ctrlKey || evento.altKey || evento.repeat) return;
      const alvo = evento.target instanceof HTMLElement ? evento.target : null;
      const digitando = !!alvo && (
        alvo.tagName === "INPUT" ||
        alvo.tagName === "TEXTAREA" ||
        alvo.tagName === "SELECT" ||
        alvo.isContentEditable
      );
      if (digitando) return;
      evento.preventDefault();
      window.dispatchEvent(new CustomEvent("aura:ajuda"));
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  // Carrega as fontes a cada abertura (RLS já limita às linhas da pessoa).
  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    setErroSugestoes(false);

    const buscarSugestoes = (async (): Promise<Sugestao[] | null> => {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("id,kind,content")
          .order("created_at", { ascending: false })
          .limit(30);
        if (error) throw error;
        return (data ?? []).map((pacote) => ({
          id: pacote.id,
          titulo: (pacote.content as { title?: string } | null)?.title?.trim() || "Sugestão sem título",
          rota: rotaDoPacote(pacote.kind, pacote.id),
        }));
      } catch {
        if (ativo) setErroSugestoes(true);
        return null;
      }
    })();

    const buscarColecoes = (async (): Promise<Colecao[] | null> => {
      try {
        const { data, error } = await supabase
          .from("collections")
          .select("id,name,package_ids")
          .order("created_at", { ascending: false })
          .limit(LIMITE_RESULTADOS);
        if (error) throw error;
        return (data ?? []).map((colecao) => ({
          id: colecao.id,
          name: colecao.name,
          total: colecao.package_ids.length,
        }));
      } catch {
        return null; // fonte silenciosa: não derruba a busca
      }
    })();

    const buscarLembretes = (async (): Promise<Lembrete[] | null> => {
      try {
        const { data, error } = await supabase
          .from("reminders")
          .select("id,title,due_at,done")
          .order("due_at", { ascending: false })
          .limit(LIMITE_RESULTADOS);
        if (error) throw error;
        return data ?? [];
      } catch {
        return null;
      }
    })();

    const buscarBriefings = (async (): Promise<Briefing[] | null> => {
      try {
        const { data, error } = await supabase
          .from("briefing_sends")
          .select("id,titulo,texto,status,professional_id")
          .order("created_at", { ascending: false })
          .limit(LIMITE_RESULTADOS);
        if (error) throw error;
        const linhas = data ?? [];
        const ids = [...new Set(linhas.map((linha) => linha.professional_id))];
        const nomes = new Map<string, string>();
        if (ids.length) {
          const { data: profissionais } = await supabase
            .from("professionals")
            .select("id,nome")
            .in("id", ids);
          for (const profissional of profissionais ?? []) nomes.set(profissional.id, profissional.nome);
        }
        return linhas.map((linha) => ({
          id: linha.id,
          titulo: linha.titulo,
          texto: linha.texto,
          status: linha.status,
          profissional: nomes.get(linha.professional_id) ?? "Profissional",
        }));
      } catch {
        return null;
      }
    })();

    const buscarProfissionais = (async (): Promise<ProfissionalBusca[] | null> => {
      try {
        const { data, error } = await supabase
          .from("professionals")
          .select("id,nome,nome_salao,profissao,slug")
          .eq("ativo", true)
          .not("slug", "is", null)
          .order("nome", { ascending: true })
          .limit(LIMITE_RESULTADOS);
        if (error) throw error;
        return (data ?? []).flatMap((profissional) =>
          profissional.slug
            ? [{
                id: profissional.id,
                nome: profissional.nome,
                nome_salao: profissional.nome_salao,
                profissao: profissional.profissao,
                slug: profissional.slug,
              }]
            : [],
        );
      } catch {
        return null;
      }
    })();

    void (async () => {
      const [novasSugestoes, novasColecoes, novosLembretes, novosBriefings, novosProfissionais] = await Promise.all([
        buscarSugestoes,
        buscarColecoes,
        buscarLembretes,
        buscarBriefings,
        buscarProfissionais,
      ]);
      if (!ativo) return;
      setSugestoes((atuais) => novasSugestoes ?? atuais ?? []);
      setColecoes((atuais) => novasColecoes ?? atuais ?? []);
      setLembretes((atuais) => novosLembretes ?? atuais ?? []);
      setBriefings((atuais) => novosBriefings ?? atuais ?? []);
      setProfissionais((atuais) => novosProfissionais ?? atuais ?? []);
    })();

    return () => { ativo = false; };
  }, [aberto, tentativa]);

  function irPara(rota: string) {
    setAberto(false);
    // Rotas estáticas e caminhos concretos: o roteador resolve o caminho em
    // runtime; o cast é só porque o tipo exige o union literal de rotas.
    nav({ to: rota as never });
  }

  const buscando = termo.trim().length > 0;
  const carregando = sugestoes === null || colecoes === null || lembretes === null || briefings === null || profissionais === null;

  // Páginas: a lista completa continua visível em repouso (navegação rápida);
  // com termo, filtra e limita como as demais fontes.
  const paginasVisiveis = buscando
    ? limitar(filtrarPorTermo(PAGINAS, termo, (pagina) => [pagina.label, pagina.to]), LIMITE_RESULTADOS)
    : PAGINAS;

  const grupos: { chave: string; titulo: string; icone: ReactNode; itens: Resultado[]; extra?: ReactNode }[] = [
    {
      chave: "paginas",
      titulo: "Páginas",
      icone: <Compass aria-hidden className="size-3.5" />,
      itens: paginasVisiveis.map((pagina) => ({
        id: pagina.to,
        titulo: pagina.label,
        descricao: "",
        rota: pagina.to,
        valor: valorDe(pagina.label, pagina.to),
      })),
    },
    {
      chave: "sugestoes",
      titulo: "Suas sugestões",
      icone: <Sparkles aria-hidden className="size-3.5" />,
      itens: limitar(filtrarPorTermo(sugestoes ?? [], termo, (sugestao) => [sugestao.titulo]), LIMITE_RESULTADOS).map((sugestao) => ({
        id: sugestao.id,
        titulo: sugestao.titulo,
        descricao: "",
        rota: sugestao.rota,
        valor: valorDe(sugestao.titulo),
      })),
      extra: sugestoes === null
        ? <div className="px-2 py-2"><CarregandoInline rotulo="Carregando suas sugestões…" /></div>
        : erroSugestoes
          ? (
            <Aviso
              tom="atencao"
              acoes={<Button size="sm" variant="outline" onClick={() => setTentativa((n) => n + 1)}>Tentar novamente</Button>}
            >
              Não foi possível carregar suas sugestões.
            </Aviso>
          )
          : !buscando && sugestoes.length === 0
            ? (
              <EstadoVazio
                compacto
                className="border-0 py-6"
                titulo="Nenhuma sugestão ainda"
                descricao="Crie a primeira no Estúdio — ela aparece aqui para abrir com um clique."
                acoes={<Button size="sm" variant="outline" onClick={() => irPara("/studio")}>Abrir o Estúdio</Button>}
              />
            )
            : null,
    },
    {
      chave: "colecoes",
      titulo: "Coleções",
      icone: <FolderHeart aria-hidden className="size-3.5" />,
      itens: limitar(filtrarPorTermo(colecoes ?? [], termo, (colecao) => [colecao.name]), LIMITE_RESULTADOS).map((colecao) => ({
        id: colecao.id,
        titulo: colecao.name,
        descricao: `${colecao.total} ${colecao.total === 1 ? "sugestão" : "sugestões"}`,
        rota: "/collections",
        valor: valorDe(colecao.name),
      })),
    },
    {
      chave: "lembretes",
      titulo: "Lembretes",
      icone: <Bell aria-hidden className="size-3.5" />,
      itens: limitar(filtrarPorTermo(lembretes ?? [], termo, (lembrete) => [lembrete.title]), LIMITE_RESULTADOS).map((lembrete) => ({
        id: lembrete.id,
        titulo: lembrete.title,
        descricao: lembrete.done ? "Concluído" : `Vence em ${dataCurta(lembrete.due_at)}`,
        rota: "/settings",
        valor: valorDe(lembrete.title, dataCurta(lembrete.due_at)),
      })),
    },
    {
      chave: "briefings",
      titulo: "Briefings",
      icone: <MessagesSquare aria-hidden className="size-3.5" />,
      itens: limitar(filtrarPorTermo(briefings ?? [], termo, (briefing) => [briefing.titulo, briefing.texto, briefing.profissional]), LIMITE_RESULTADOS).map((briefing) => ({
        id: briefing.id,
        titulo: briefing.titulo,
        descricao: `${briefing.profissional} · ${STATUS_BRIEFING[briefing.status] ?? briefing.status}`,
        rota: "/profissionais",
        valor: valorDe(briefing.titulo, briefing.texto, briefing.profissional),
      })),
    },
    {
      chave: "profissionais",
      titulo: "Profissionais",
      icone: <MapPin aria-hidden className="size-3.5" />,
      itens: limitar(filtrarPorTermo(profissionais ?? [], termo, (profissional) => [profissional.nome, profissional.nome_salao, profissional.profissao]), LIMITE_RESULTADOS).map((profissional) => ({
        id: profissional.id,
        titulo: profissional.nome,
        descricao: [profissional.profissao, profissional.nome_salao].filter(Boolean).join(" · "),
        rota: `/p/${profissional.slug}`,
        valor: valorDe(profissional.nome, profissional.nome_salao, profissional.profissao),
      })),
    },
  ];

  /** Um grupo por fonte: título com ícone e contagem, itens e estado auxiliar. */
  function montarGrupo(grupo: (typeof grupos)[number]) {
    if (!grupo.itens.length && !grupo.extra) return null;
    return (
      <CommandGroup
        key={grupo.chave}
        heading={
          <span className="inline-flex items-center gap-1.5">
            {grupo.icone}
            {grupo.titulo}
            {grupo.itens.length > 0 ? ` · ${grupo.itens.length}` : ""}
          </span>
        }
      >
        {grupo.itens.map((item) => (
          <CommandItem
            key={`${grupo.chave}-${item.id}`}
            value={`${grupo.chave} ${item.valor}`}
            onSelect={() => irPara(item.rota)}
          >
            <div className="min-w-0">
              <div className="truncate">{item.titulo}</div>
              {item.descricao && <div className="truncate text-xs text-muted-foreground">{item.descricao}</div>}
            </div>
          </CommandItem>
        ))}
        {grupo.extra}
      </CommandGroup>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden h-9 gap-2 whitespace-nowrap md:inline-flex"
        onClick={() => setAberto(true)}
        aria-label="Buscar no app (Ctrl+K)"
        title="Buscar (Ctrl+K)"
      >
        <Search aria-hidden className="size-4" /> Buscar
        <kbd aria-hidden className="rounded border bg-muted px-1 text-xs font-medium text-muted-foreground">⌘K</kbd>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 md:hidden"
        onClick={() => setAberto(true)}
        aria-label="Buscar"
        title="Buscar"
      >
        <Search aria-hidden className="h-5 w-5" />
      </Button>

      <CommandDialog
        open={aberto}
        onOpenChange={(valor) => {
          setAberto(valor);
          if (!valor) setTermo("");
        }}
      >
        <CommandInput
          placeholder="Buscar páginas e suas sugestões…"
          aria-label="Buscar páginas e sugestões"
          value={termo}
          onValueChange={setTermo}
        />
        <CommandList>
          {!carregando && (
            <CommandEmpty>
              <EstadoVazio
                compacto
                className="border-0 py-6"
                icone={<SearchX className="size-5" />}
                titulo="Nada encontrado"
                descricao="Tente outro termo — ou comece uma criação no Estúdio."
                acoes={<Button size="sm" variant="outline" onClick={() => irPara("/studio")}>Buscar no Estúdio</Button>}
              />
            </CommandEmpty>
          )}
          {carregando && paginasVisiveis.length === 0 && (
            <div className="px-3 py-4"><CarregandoInline rotulo="Buscando…" /></div>
          )}
          {grupos.map(montarGrupo)}
        </CommandList>
        <div
          aria-label="Atalhos de teclado"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground"
        >
          <span><kbd className="rounded border bg-muted px-1 font-medium">Ctrl/Cmd K</kbd> — busca</span>
          <span><kbd className="rounded border bg-muted px-1 font-medium">?</kbd> — ajuda</span>
          <span><kbd className="rounded border bg-muted px-1 font-medium">Esc</kbd> — fechar</span>
        </div>
      </CommandDialog>
    </>
  );
}
