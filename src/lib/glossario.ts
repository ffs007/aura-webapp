/**
 * Glossário do Aura ID — vocabulário único do produto.
 *
 * Uma mesma palavra deve significar a mesma coisa em todas as telas. Este
 * arquivo é a fonte dos termos canônicos e das definições curtas exibidas em
 * /guia; use-o como referência antes de inventar um sinônimo na interface.
 */
export type TermoGlossario = {
  /** Termo canônico, exatamente como aparece na interface. */
  termo: string;
  /** Definição curta, em PT-BR, para quem está começando. */
  definicao: string;
};

export const GLOSSARIO: TermoGlossario[] = [
  {
    termo: "Sugestão",
    definicao:
      "A ideia que a IA monta para você: uma página com três variações (segura, intermediária e ousada) para explorar no seu ritmo.",
  },
  {
    termo: "Pacote",
    definicao:
      "Nome antigo da Sugestão. Era a página que reunia as três variações; hoje o app usa “sugestão”.",
  },
  {
    termo: "Briefing",
    definicao:
      "O documento que reúne seu pedido — contexto, medidas e referências — para enviar a uma profissional ou levar ao tatuador.",
  },
  {
    termo: "Trilha",
    definicao:
      "Um conjunto de módulos que combina com o seu momento (Visual, Cabelo, Estilo, Barbearia). Você escolhe até três e o menu se ajusta.",
  },
  {
    termo: "Meu Modelo",
    definicao:
      "Suas duas imagens-base privadas (rosto e corpo), criadas a partir das suas fotos. É sobre elas que maquiagem, cabelo, roupas e tatuagem são simulados.",
  },
  {
    termo: "Aura Retrato",
    definicao:
      "Edição de uma foto real sua, um pedido por vez: você descreve o ajuste e a IA aplica na foto.",
  },
  {
    termo: "DNA Visual",
    definicao:
      "Um resumo editável das suas preferências e reações, usado para personalizar as sugestões dos módulos.",
  },
  {
    termo: "Jornada",
    definicao:
      "O acompanhamento dos seus planos em passos, com registros gentis — sem cobrança de progresso.",
  },
  {
    termo: "Vitrine",
    definicao:
      "A galeria pública de designs dos estúdios de tatuagem; você pode copiar um design para testar no seu modelo.",
  },
  {
    termo: "Coleção",
    definicao:
      "Um grupo de sugestões salvas ou aprovadas que você separa por tema, estação ou ocasião.",
  },
  {
    termo: "Aura Pass",
    definicao:
      "A assinatura mensal com uso justo de 50 imagens por mês (até 12 por dia) e mais análises de texto; cancele quando quiser.",
  },
  {
    termo: "Status",
    definicao:
      "O estado de uma sugestão: nova, salva, aprovada ou rejeitada.",
  },
];
