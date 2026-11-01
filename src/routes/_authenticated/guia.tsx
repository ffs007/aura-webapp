import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/guia')({
  head: () => ({ meta: [{ title: 'Guia rápido · Aura ID' }] }),
  component: Page,
});

const PASSOS = [
  {
    n: 1, titulo: 'Comece pelo Meu Modelo', icone: '👤',
    corpo: 'É o coração do Aura ID: você envia de 3 a 8 fotos suas e a IA cria duas imagens-base suas (rosto e corpo), privadas no seu cofre. A partir daí, TODAS as simulações — maquiagem, cabelo, roupas, tatuagens — saem com a SUA cara, nunca com uma pessoa genérica.',
    dicas: ['Fotos bem iluminadas, sem filtro e sem óculos escuros', 'Pelo menos uma do rosto de frente e uma do corpo inteiro', 'Exemplo de pedido depois: "batom vermelho e cabelo liso" — a IA mostra o que entendeu e você confirma'],
    cta: { rotulo: 'Criar meu modelo', to: '/modelo' },
  },
  {
    n: 2, titulo: 'Ligue suas permissões (30 segundos)', icone: '🔐',
    corpo: 'Em Configurações → Consentimento, ative "processar fotos" e "imagens geradas por IA". O Meu Modelo tem uma permissão própria também — você liga lá mesmo, e desligar apaga suas imagens na hora.',
    dicas: ['Nada é público: suas fotos ficam num cofre só seu', 'Você pode desligar tudo quando quiser'],
    cta: { rotulo: 'Abrir Configurações', to: '/settings' },
  },
  {
    n: 3, titulo: 'Explore como quiser', icone: '🧭',
    corpo: 'No Estúdio você diz como está hoje ("quero me sentir poderosa pro aniversário da empresa") e a Aura cria convites visuais. Cada módulo (maquiagem, cabelo, roupas, tatuagem, jornada) tem seu gerador. Em tudo, a IA primeiro mostra o cartão "Entendi assim" — você corrige e confirma antes de gerar.',
    dicas: ['Seja específica: "cabelo cacheado solto, tom mel" funciona melhor que "cabelo diferente"', 'Não gostou? A verificação automática regenera 1x sozinha e te conta as pendências'],
    cta: { rotulo: 'Ir para o Estúdio', to: '/studio' },
  },
  {
    n: 4, titulo: 'Gere COM você (ou sem você)', icone: '📸',
    corpo: 'Com o modelo criado, todo gerador mostra a caixinha "Usar meu modelo pessoal (a imagem sai com você)". Ligada: o resultado é você com a mudança. Desligada: pessoa fictícia. Pro retoque fino na hora, use o Retrato — envie UMA foto e descreva o que mudar, alvo por alvo.',
    dicas: ['Cada geração tem checagem automática (texto certo, alvo certo, é você mesmo)', 'O contador embaixo mostra quantas grátis ainda restam'],
    cta: { rotulo: 'Experimentar o Retrato', to: '/retrato' },
  },
  {
    n: 5, titulo: 'Quando amar o resultado', icone: '✦',
    corpo: 'Toda imagem tem botões de baixar e guardar. Quando as gerações gratuitas acabarem, o Aura Pass (R$ 19,90/mês) libera tudo — Pix ou cartão, cancele quando quiser.',
    dicas: ['Suas imagens ficam salvas em privado, sempre', 'O Pass vale no site e no app com a mesma conta'],
    cta: { rotulo: 'Conhecer o Aura Pass', to: '/aura-pass' },
  },
];

function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <span className="text-sm text-accent">Primeira vez? Comece aqui</span>
        <h1 className="mt-2 text-5xl">Guia <em>rápido</em></h1>
        <p className="mt-3 text-muted-foreground">Cinco passos e você domina o Aura ID. Na ordem — o primeiro é o que muda tudo.</p>
      </div>
      <ol className="space-y-6">
        {PASSOS.map((p) => (
          <li key={p.n} className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.icone}</span>
              <h2 className="text-2xl"><span className="text-muted-foreground">{p.n}.</span> {p.titulo}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{p.corpo}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{p.dicas.map((d) => <li key={d}>💡 {d}</li>)}</ul>
            <Button asChild size="sm" variant="outline" className="mt-4"><Link to={p.cta.to}>{p.cta.rotulo}</Link></Button>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">Dúvidas ou algo saiu estranho? O botão de regenerar é seu amigo — e a IA te conta o que ficou pendente. <Link to="/studio" className="underline">Já quero começar →</Link></p>
    </div>
  );
}
