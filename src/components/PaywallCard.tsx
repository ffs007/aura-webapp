import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Aviso } from "@/components/estados";
import { AURA_PASS_PRECO } from "@/lib/stripe.functions";

/** Reconhece as mensagens de cota/paywall que o gateway devolve como texto. */
export function ehErroDeCota(mensagem: string | null | undefined): boolean {
  if (!mensagem) return false;
  return /gratuit|esgotad|paywall|aura pass|limite de|cr[ée]ditos?|sem cr[ée]dito/i.test(mensagem);
}

/**
 * Cartão único de paywall: aparece quando a geração falha por cota, com preço,
 * link para o Aura Pass e a mensagem original em letras menores. Antes cada
 * tela mostrava só um toast genérico e a pessoa não sabia qual era o próximo passo.
 */
export function PaywallCard({ mensagem }: { mensagem?: string | null }) {
  if (!mensagem) return null;
  return (
    <div role="region" aria-label="Aura Pass">
      <Aviso
        tom="atencao"
        titulo="Suas gerações grátis acabaram ✨"
        acoes={
          <Button asChild size="sm">
            <Link to="/aura-pass">Desbloquear com Aura Pass · {AURA_PASS_PRECO}</Link>
          </Button>
        }
      >
        <p>{mensagem}</p>
        <p className="mt-1">O Aura Pass libera mais gerações — Pix ou cartão, cancele quando quiser.</p>
      </Aviso>
    </div>
  );
}
