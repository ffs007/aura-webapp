import { createFileRoute } from "@tanstack/react-router";
import { DocumentoLegal, Secao } from "@/components/DocumentoLegal";
import { EMPRESA } from "@/lib/empresa";
import { urlAbsoluta } from "@/lib/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e LGPD · Aura ID" },
      { name: "description", content: "Quais dados o Aura ID trata, para quê, com quem compartilha e como exercer seus direitos." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: urlAbsoluta("/privacidade") },
    ],
    links: [{ rel: "canonical", href: urlAbsoluta("/privacidade") }],
  }),
  component: Page,
});

function Page() {
  return (
    <DocumentoLegal
      titulo="Privacidade e LGPD"
      descricao="Como o Aura ID trata seus dados pessoais, com quem compartilha e como você exerce seus direitos."
    >
      <Secao titulo="1. Controlador">
        <p>
          Controlador dos dados: {EMPRESA.razaoSocial}, {EMPRESA.documento}, {EMPRESA.endereco}. Encarregado de dados
          (DPO): {EMPRESA.emailEncarregado}. Assuntos gerais: {EMPRESA.emailSuporte}.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados tratamos">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Conta:</strong> e-mail, senha (armazenada de forma criptografada pelo provedor de autenticação), data de cadastro.</li>
          <li><strong>Perfil visual:</strong> respostas do onboarding (estilo, cores, rotina, orçamento, clima, preferências), preferências de apresentação e DNA visual.</li>
          <li><strong>Fotos (opcionais):</strong> imagem enviada para Retrato, Meu Modelo, Estética, provador ou referências de tatuagem, sempre condicionadas a consentimento específico.</li>
          <li><strong>Conteúdo criado:</strong> sugestões, planos, briefings, diários, reflexões, lembretes e coleções.</li>
          <li><strong>Pagamento:</strong> identificador de cliente e status da assinatura; dados de cartão são tratados diretamente pelo Stripe, não passam pelo app.</li>
          <li><strong>Uso e segurança:</strong> página acessada, tipo de erro, registros de consentimento e de auditoria.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Para que usamos e base legal">
        <ul className="list-disc space-y-1 pl-5">
          <li>Executar o serviço e entregar sugestões — execução de contrato (art. 7º, V, LGPD).</li>
          <li>Personalizar respostas com base no seu perfil — consentimento, revogável a qualquer momento (art. 7º, I).</li>
          <li>Processar fotos para edição/simulação — consentimento específico para fotos e para uso de IA (art. 11 para dados sensíveis, quando aplicável).</li>
          <li>Cobrança de assinatura — execução de contrato e obrigações legais/fiscais.</li>
          <li>Segurança, prevenção a fraude e melhoria do produto — legítimo interesse (art. 7º, IX), com dados agregados ou minimizados.</li>
        </ul>
      </Secao>

      <Secao titulo="4. Compartilhamento">
        <p>
          Não vendemos seus dados. Compartilhamos apenas o necessário com operadores que sustentam o serviço:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento privado de fotos.</li>
          <li><strong>fal.ai / provedores de IA</strong> — geração e verificação de imagens; recebem o prompt e, quando a funcionalidade exige, a imagem-base com consentimento.</li>
          <li><strong>Stripe</strong> — processamento de pagamento e assinatura.</li>
          <li><strong>Vercel</strong> — hospedagem do site.</li>
          <li><strong>Provedor de e-mail</strong> — envio de confirmação, recuperação de senha e avisos transacionais.</li>
          <li><strong>Autoridades</strong> — quando houver obrigação legal ou ordem judicial.</li>
        </ul>
        <p>
          Alguns desses operadores podem processar dados fora do Brasil. Nesses casos, exigimos cláusulas contratuais e
          salvaguardas compatíveis com a LGPD.
        </p>
      </Secao>

      <Secao titulo="5. Por quanto tempo guardamos">
        <p>
          Conta e conteúdo ficam enquanto a conta existir. Fotos e resultados podem ser excluídos por você a qualquer
          momento. Ao excluir a conta, apagamos os dados pessoais e os arquivos do cofre; registros fiscais de pagamento
          podem ser mantidos pelo prazo legal. Registros de consentimento podem ser mantidos para comprovar conformidade.
        </p>
      </Secao>

      <Secao titulo="6. Seus direitos">
        <p>
          Você pode pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação,
          informação sobre compartilhamento e revogação de consentimento. O app já oferece exportação dos seus dados e
          exclusão de conta em Configurações. Para os demais pedidos, escreva para {EMPRESA.emailEncarregado}. Responderemos
          nos prazos da LGPD.
        </p>
      </Secao>

      <Secao titulo="7. Cookies e armazenamento local">
        <p>
          Usamos armazenamento local do navegador para manter a sessão autenticada, guardar rascunhos e preferências de
          interface. Não usamos cookies de publicidade de terceiros. Você pode limpar esses dados no navegador, mas isso
          encerra a sessão e apaga rascunhos.
        </p>
      </Secao>

      <Secao titulo="8. Segurança">
        <p>
          Aplicamos controle de acesso por conta, políticas de isolamento no banco, links assinados de curta duração para
          fotos privadas e minimização de dados. Nenhum sistema é imune a incidentes; em caso de incidente relevante,
          comunicaremos as pessoas afetadas e a ANPD conforme a lei.
        </p>
      </Secao>

      <Secao titulo="9. Crianças e adolescentes">
        <p>
          O serviço não é destinado a menores de 18 anos sem supervisão de responsável legal. Não coletamos dados de
          crianças intencionalmente.
        </p>
      </Secao>

      <Secao titulo="10. Atualizações">
        <p>
          Podemos atualizar este documento. Mudanças relevantes serão comunicadas no app ou por e-mail. A versão vigente
          é sempre a publicada nesta página.
        </p>
      </Secao>
    </DocumentoLegal>
  );
}
