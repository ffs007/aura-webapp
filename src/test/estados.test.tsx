import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Aviso,
  CabecalhoPagina,
  CarregandoInline,
  CarregandoPagina,
  EstadoErro,
  EstadoVazio,
  EsqueletoDetalhe,
  EsqueletoLista,
  Secao,
} from "@/components/estados";

describe("CabecalhoPagina", () => {
  it("usa um único h1 com título e descrição", () => {
    render(<CabecalhoPagina titulo="Suas sugestões" descricao="Cada uma é uma hipótese." />);
    expect(screen.getByRole("heading", { level: 1, name: "Suas sugestões" })).toBeInTheDocument();
    expect(screen.getByText("Cada uma é uma hipótese.")).toBeInTheDocument();
  });

  it("mostra sobretítulo, linha anterior e ações", () => {
    render(
      <CabecalhoPagina
        titulo="Guia rápido"
        sobretitulo="Primeira vez?"
        antes={<span>← Voltar</span>}
        acoes={<button>Criar</button>}
      />,
    );
    expect(screen.getByText("Primeira vez?")).toBeInTheDocument();
    expect(screen.getByText("← Voltar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument();
  });
});

describe("Secao", () => {
  it("liga a seção ao título pelo id", () => {
    const { container } = render(
      <Secao id="dna-secao" titulo="DNA Visual">
        <p>conteúdo</p>
      </Secao>,
    );
    const secao = container.querySelector("section");
    expect(secao).toHaveAttribute("aria-labelledby", "dna-secao");
    expect(screen.getByRole("heading", { level: 2, name: "DNA Visual" })).toHaveAttribute("id", "dna-secao");
  });
});

describe("EstadoVazio", () => {
  it("mostra título, descrição e próximo passo", () => {
    render(
      <EstadoVazio
        titulo="Nenhum look ainda"
        descricao="Preencha seu perfil de pele."
        acoes={<button>Gerar looks</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Nenhum look ainda" })).toBeInTheDocument();
    expect(screen.getByText("Preencha seu perfil de pele.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar looks" })).toBeInTheDocument();
  });

  it("esconde o ícone de leitores de tela", () => {
    const { container } = render(<EstadoVazio icone={<span>🎨</span>} titulo="Nada aqui" />);
    expect(container.querySelector("[aria-hidden]")).toContainElement(screen.getByText("🎨"));
  });
});

describe("EstadoErro", () => {
  it("anuncia o erro e permite tentar de novo", () => {
    const tentar = vi.fn();
    render(<EstadoErro titulo="Erro ao carregar" onTentarNovamente={tentar} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão enquanto recarrega", () => {
    render(<EstadoErro recarregando onTentarNovamente={() => {}} />);
    expect(screen.getByRole("button", { name: "Tentando…" })).toBeDisabled();
  });

  it("usa a mensagem de conexão quando semConexao", () => {
    render(<EstadoErro semConexao />);
    expect(screen.getByText(/Verifique sua internet/)).toBeInTheDocument();
  });
});

describe("esqueletos e carregamento", () => {
  it("EsqueletoLista anuncia carregamento e reserva os cartões", () => {
    const { container } = render(<EsqueletoLista itens={3} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("EsqueletoDetalhe anuncia carregamento", () => {
    render(<EsqueletoDetalhe />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Carregando conteúdo");
  });

  it("CarregandoPagina anuncia o estado com rótulo", () => {
    render(<CarregandoPagina rotulo="Preparando seu espaço…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Preparando seu espaço…");
  });

  it("CarregandoInline mantém o texto visível", () => {
    render(<CarregandoInline rotulo="Buscando profissionais…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando profissionais…");
  });
});

describe("Aviso", () => {
  it("renderiza título, conteúdo e ações", () => {
    render(
      <Aviso tom="atencao" titulo="Pause antes de passos permanentes" acoes={<button>Entendi</button>}>
        Consulte um profissional.
      </Aviso>,
    );
    expect(screen.getByText("Pause antes de passos permanentes")).toBeInTheDocument();
    expect(screen.getByText("Consulte um profissional.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entendi" })).toBeInTheDocument();
  });
});
