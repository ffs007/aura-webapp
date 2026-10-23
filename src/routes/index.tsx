import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura ID — Uma companhia gentil para sua identidade visual" },
      { name: "description", content: "Ideias integradas de roupas, maquiagem, cabelo e acessórios, moldadas pela sua cultura, clima, rotina, orçamento e humor. Sem ranking. Sem regras." },
      { property: "og:title", content: "Aura ID — Uma companhia gentil para sua identidade visual" },
      { property: "og:description", content: "Sugestões de identidade visual contextuais e emocionalmente seguras, como experimentos, não regras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const principles = [
  ["Convites, não regras", "Cada sugestão é uma hipótese que você pode testar, adaptar ou deixar de lado."],
  ["Sem ranking, sem julgamento", "Nunca damos nota a rostos ou corpos. Seu conforto define o ritmo."],
  ["Contexto em primeiro lugar", "Cultura, clima, profissão, orçamento e rotina moldam cada ideia."],
  ["Seus dados, sua decisão", "Fotos são opcionais, privadas e podem ser excluídas a qualquer momento."],
];

function Landing() {
  return (
    <div className="min-h-screen bg-aura">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl">Aura <em>ID</em></span>
        <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-8 md:grid-cols-2">
        <div className="animate-rise">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-accent">Identidade visual pessoal</p>
          <h1 className="text-5xl leading-[1.05] md:text-7xl">Um jeito mais gentil de <em>se tornar</em> quem você quer mostrar.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            A Aura ID une roupas, maquiagem, cabelo, acessórios e até a visibilidade de tatuagens em looks coerentes — cada um com versões segura, intermediária e ousada para explorar no seu ritmo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Começar meu perfil</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#principios">Nossos princípios</a></Button>
          </div>
        </div>
        <div className="animate-rise overflow-hidden rounded-[2rem] shadow-soft">
          <img src={hero} alt="Lenço de seda, brinco e amostras de tecido sobre linho" className="aspect-square w-full object-cover" width={1280} height={1280} />
        </div>
      </main>
      <section id="principios" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-4">
          {principles.map(([t, d]) => (
            <div key={t} className="rounded-2xl border bg-card/70 p-6 backdrop-blur">
              <h3 className="text-2xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Provadores fotorrealistas, simulação de penteados, realidade aumentada ao vivo, simulação de tatuagem em movimento e correção por vídeo ao vivo: [FORA DO ESCOPO DOS CONECTORES LOVABLE].
        </p>
      </section>
    </div>
  );
}
