import { createFileRoute } from "@tanstack/react-router";
import { DocumentoLegal, Secao } from "@/components/DocumentoLegal";
import { EMPRESA } from "@/lib/empresa";
import { urlAbsoluta } from "@/lib/site";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso · Aura ID" },
      { name: "description", content: "Condições de uso do Aura ID, Aura Pass e Plano Profissional." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: urlAbsoluta("/termos") },
    ],
    links: [{ rel: "canonical", href: urlAbsoluta("/termos") }],
  }),
  component: Page,
});

function Page() {
  return (
    <DocumentoLegal
      titulo="Termos de uso"
      descricao="As regras para usar o Aura ID com segurança — inclui os planos pagos, o uso da IA e os limites do serviço."
    >
      <Secao titulo="1. Quem oferece o serviço">
        <p>
          O Aura ID é oferecido por {EMPRESA.razaoSocial}, inscrito no documento {EMPRESA.documento}, com endereço em{" "}
          {EMPRESA.endereco}. Contato de suporte: {EMPRESA.emailSuporte}.
        </p>
      </Secao>

      <Secao titulo="2. O que é o Aura ID">
        <p>
          O Aura ID é uma ferramenta de apoio à decisão visual: cria sugestões, planos e referências de roupas, maquiagem,
          cabelo, barba, estética, jornada e tatuagem a partir das informações que você fornece. As sugestões são
          <strong> hipóteses e referências visuais</strong>, não garantia de resultado, prescrição estética, avaliação de
          saúde, diagnóstico ou prova virtual.
        </p>
      </Secao>

      <Secao titulo="3. Sua conta">
        <p>
          É necessário ter conta para usar os módulos. Você é responsável por manter a senha em segurança e pelas ações
          feitas na sua conta. Os dados que você informa devem ser seus ou de pessoa que autorizou o uso. Menores de 18
          anos só podem usar o serviço com supervisão de responsável legal.
        </p>
      </Secao>

      <Secao titulo="4. Conteúdo gerado por IA">
        <p>
          Os textos e imagens são produzidos por modelos de inteligência artificial e podem conter erros, imprecisões ou
          variações entre execuções. Imagens de referência não reproduzem exatamente a realidade e não substituem
          consulta com profissional habilitado. Você pode usar os resultados para uso pessoal; não é permitido usar o
          serviço para gerar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros.
        </p>
      </Secao>

      <Secao titulo="5. Fotos e conteúdo enviados">
        <p>
          Fotos são opcionais, privadas e processadas apenas para a finalidade que você autoriza. Você mantém a
          titularidade do conteúdo que envia e nos concede licença limitada para armazenar e processar esse conteúdo
          enquanto for necessário para entregar o serviço. Você pode revogar consentimentos e excluir dados a qualquer
          momento nas Configurações ou pelo fluxo de exclusão de conta.
        </p>
      </Secao>

      <Secao titulo="6. Planos pagos">
        <p>
          O Aura Pass e o Plano Profissional são assinaturas mensais, cobradas por meio do Stripe. O valor vigente é
          exibido antes da contratação. A renovação é automática até o cancelamento. Condições de cancelamento, prazo de
          acesso e reembolso estão em <a className="underline" href="/reembolso">Assinatura e reembolso</a>.
        </p>
      </Secao>

      <Secao titulo="7. Disponibilidade e mudanças">
        <p>
          O serviço pode passar por manutenções, sofrer indisponibilidade de fornecedores de IA, pagamento ou
          infraestrutura, e ter funcionalidades alteradas. Quando possível, avisaremos com antecedência. Não há
          garantia de disponibilidade ininterrupta.
        </p>
      </Secao>

      <Secao titulo="8. Limitação de responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, o Aura ID não responde por decisões estéticas, de saúde ou financeiras
          tomadas a partir das sugestões, nem por danos indiretos decorrentes do uso das referências. Nada aqui afasta
          direitos assegurados pelo Código de Defesa do Consumidor.
        </p>
      </Secao>

      <Secao titulo="9. Encerramento">
        <p>
          Você pode excluir sua conta a qualquer momento em Configurações → Excluir minha conta. Podemos encerrar contas
          que violem estes termos, com comunicação e possibilidade de contraditório quando cabível.
        </p>
      </Secao>

      <Secao titulo="10. Lei aplicável e foro">
        <p>
          Estes termos seguem a legislação brasileira. Fica eleito o foro de {EMPRESA.foro} para questões que não
          puderem ser resolvidas de forma amigável, respeitado o direito do consumidor de acionar o foro do seu
          domicílio.
        </p>
      </Secao>

      <p className="text-xs text-muted-foreground">
        Dúvidas sobre este documento: {EMPRESA.emailSuporte}. Privacidade e tratamento de dados: ver{" "}
        <a className="underline" href="/privacidade">Privacidade e LGPD</a>.
      </p>
    </DocumentoLegal>
  );
}
