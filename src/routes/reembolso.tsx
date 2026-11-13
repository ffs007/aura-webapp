import { createFileRoute } from "@tanstack/react-router";
import { DocumentoLegal, Secao } from "@/components/DocumentoLegal";
import { EMPRESA } from "@/lib/empresa";
import { urlAbsoluta } from "@/lib/site";

export const Route = createFileRoute("/reembolso")({
  head: () => ({
    meta: [
      { title: "Assinatura e reembolso · Aura ID" },
      { name: "description", content: "Como funcionam Aura Pass, Plano Profissional, cancelamento e reembolso." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: urlAbsoluta("/reembolso") },
    ],
    links: [{ rel: "canonical", href: urlAbsoluta("/reembolso") }],
  }),
  component: Page,
});

function Page() {
  return (
    <DocumentoLegal
      titulo="Assinatura e reembolso"
      descricao="Regras claras para contratar, cancelar e pedir reembolso do Aura Pass e do Plano Profissional."
    >
      <Secao titulo="1. Planos e valores">
        <p>
          O Aura Pass é uma assinatura mensal que amplia as gerações de imagem e recursos do app. O Plano Profissional é
          uma assinatura mensal voltada a profissionais, com recursos adicionais. O valor vigente é sempre o exibido na
          tela de contratação antes do pagamento, em reais, com impostos incluídos.
        </p>
      </Secao>

      <Secao titulo="2. Cobrança">
        <p>
          A cobrança é feita pelo Stripe no cartão informado, no ato da contratação e a cada renovação mensal. A renovação
          é automática até que você cancele. O comprovante é enviado pelo próprio Stripe.
        </p>
      </Secao>

      <Secao titulo="3. Cancelamento">
        <p>
          Você pode cancelar quando quiser em <strong>Configurações → gerenciar assinatura</strong> (portal do Stripe) ou
          pedindo por {EMPRESA.emailSuporte}. O cancelamento interrompe as cobranças futuras e o acesso aos recursos pagos
          continua até o fim do período já pago. Não há multa.
        </p>
      </Secao>

      <Secao titulo="4. Direito de arrependimento">
        <p>
          Por se tratar de contratação fora do estabelecimento comercial, você pode exercer o direito de arrependimento
          em até <strong>7 dias corridos</strong> da contratação (art. 49 do Código de Defesa do Consumidor), com
          devolução integral do valor pago. Basta escrever para {EMPRESA.emailSuporte} com o e-mail da conta e a data da
          compra.
        </p>
      </Secao>

      <Secao titulo="5. Reembolso proporcional">
        <p>
          Fora do prazo de arrependimento, avaliamos pedidos de reembolso proporcional quando houver falha comprovada do
          serviço que impeça o uso do recurso pago. Não há reembolso por uso parcial do período, salvo nas hipóteses
          previstas no Código de Defesa do Consumidor.
        </p>
      </Secao>

      <Secao titulo="6. Como pedir">
        <p>
          Envie para {EMPRESA.emailSuporte}: nome, e-mail da conta, plano, data da compra e o motivo. Respondemos em até 5
          dias úteis. Reembolsos aprovados são processados pelo Stripe no mesmo meio de pagamento, com prazo de
          compensação definido pela operadora do cartão (normalmente de 5 a 10 dias úteis).
        </p>
      </Secao>

      <Secao titulo="7. Exclusão de conta">
        <p>
          Ao excluir sua conta, a assinatura também deve ser cancelada. Se você excluir a conta mantendo a assinatura
          ativa, escreva para {EMPRESA.emailSuporte} para que o cancelamento seja concluído e não haja cobranças
          indevidas.
        </p>
      </Secao>

      <p className="text-xs text-muted-foreground">
        Documento complementar aos <a className="underline" href="/termos">Termos de uso</a> e à{" "}
        <a className="underline" href="/privacidade">Privacidade e LGPD</a>.
      </p>
    </DocumentoLegal>
  );
}
