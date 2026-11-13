import { Link } from "@tanstack/react-router";
import { EMPRESA } from "@/lib/empresa";

/** Rodapé público com os documentos legais e a identificação do fornecedor. */
export function RodapeLegal() {
  return (
    <footer className="mt-16 border-t py-8 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
        <p>
          {EMPRESA.nomeFantasia} · {EMPRESA.razaoSocial} · {EMPRESA.documento}
        </p>
        <nav aria-label="Documentos legais" className="flex flex-wrap gap-4">
          <Link to="/termos" className="underline underline-offset-2 hover:text-foreground">Termos de uso</Link>
          <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground">Privacidade e LGPD</Link>
          <Link to="/reembolso" className="underline underline-offset-2 hover:text-foreground">Assinatura e reembolso</Link>
          <a href={`mailto:${EMPRESA.emailSuporte}`} className="underline underline-offset-2 hover:text-foreground">Suporte</a>
        </nav>
      </div>
    </footer>
  );
}
