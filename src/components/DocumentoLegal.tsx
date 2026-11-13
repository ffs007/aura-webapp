import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CabecalhoPagina } from "@/components/estados";
import { Aviso } from "@/components/estados";
import { RodapeLegal } from "@/components/RodapeLegal";
import { CARTAO, PILHA_PAGINA, TITULO_SECAO } from "@/lib/design";
import { DADOS_DO_FORNECEDOR_PENDENTES, DOCUMENTOS_VERSAO } from "@/lib/empresa";

/** Casca comum dos documentos legais públicos (Termos, Privacidade, Reembolso). */
export function DocumentoLegal({ titulo, descricao, children }: { titulo: ReactNode; descricao: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-aura">
      <main className={`mx-auto max-w-3xl px-6 py-10 ${PILHA_PAGINA}`}>
        <CabecalhoPagina
          sobretitulo={`Documento legal · versão ${DOCUMENTOS_VERSAO}`}
          titulo={titulo}
          descricao={descricao}
          acoes={<Link to="/" className="text-sm underline underline-offset-2">Voltar ao início</Link>}
        />
        {DADOS_DO_FORNECEDOR_PENDENTES && (
          <Aviso tom="atencao" titulo="Documento em finalização">
            Os dados do fornecedor (razão social, CNPJ/CPF, endereço e contatos) ainda estão pendentes de preenchimento.
            Este texto não deve ser usado como versão final para venda até a conclusão.
          </Aviso>
        )}
        <article className={`${CARTAO} space-y-6 text-sm leading-relaxed`}>{children}</article>
      </main>
      <RodapeLegal />
    </div>
  );
}

/** Seção numerada do documento. */
export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className={TITULO_SECAO}>{titulo}</h2>
      {children}
    </section>
  );
}
