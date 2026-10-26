import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

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
        {/* Hero em CSS até existir src/assets/hero.jpg no projeto (binário não veio no export do Lovable).
            Para voltar à foto: adicione o arquivo e restaure `import hero from "@/assets/hero.jpg"` + <img>. */}
        <div className="animate-rise relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-soft" role="img" aria-label="Lenço de seda, brinco e amostras de tecido sobre linho">
          <div className="absolute inset-0 bg-gradient-to-br from-[#efe6d8] via-[#e8dccb] to-[#dcc9b4]" />
          <div className="absolute left-[12%] top-[14%] h-40 w-40 rounded-full bg-[#c98a6b]/70 blur-[2px]" />
          <div className="absolute right-[14%] top-[30%] h-56 w-56 rounded-full bg-[#8f6b52]/50 blur-[1px]" />
          <div className="absolute bottom-[12%] left-[30%] h-32 w-32 rounded-full bg-[#b3572e]/40" />
          <div className="absolute bottom-[24%] right-[24%] h-20 w-20 rounded-full border-8 border-[#e8dcc7]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
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
