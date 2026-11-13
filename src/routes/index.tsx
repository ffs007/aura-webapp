import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina } from "@/components/estados";
import { TITULO_ITEM } from "@/lib/design";
import { urlAbsoluta } from "@/lib/site";
import { RodapeLegal } from "@/components/RodapeLegal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura ID — Uma companhia gentil para sua identidade visual" },
      { name: "description", content: "Ideias integradas de roupas, maquiagem, cabelo e acessórios, moldadas pela sua cultura, clima, rotina, orçamento e humor. Sem ranking. Sem regras." },
      { property: "og:title", content: "Aura ID — Uma companhia gentil para sua identidade visual" },
      { property: "og:description", content: "Sugestões de identidade visual contextuais e emocionalmente seguras, como experimentos, não regras." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: urlAbsoluta("/") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: urlAbsoluta("/") }],
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
          <CabecalhoPagina
            antes={<p className="mb-4 text-sm uppercase tracking-[0.2em] text-accent">Identidade visual pessoal</p>}
            titulo={<>Um jeito mais gentil de <em>se tornar</em> quem você quer mostrar.</>}
            descricao={<>A Aura ID une roupas, maquiagem, cabelo, acessórios e até a visibilidade de tatuagens em looks coerentes — cada um com versões seguras, intermediárias e ousadas para explorar no seu ritmo.</>}
            className="[&_h1]:text-5xl [&_h1]:leading-[1.05] md:[&_h1]:text-7xl [&>div>div>p]:mt-6 [&>div>div>p]:max-w-md [&>div>div>p]:text-lg"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Começar meu perfil</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#principios">Nossos princípios</a></Button>
          </div>
        </div>
        {/* Hero em CSS até existir src/assets/hero.jpg no projeto (binário não veio no export inicial).
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
              <h3 className={TITULO_ITEM}>{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Provador fotorrealista, simulação de penteados, realidade aumentada ao vivo, simulação de tatuagem em movimento e correção por vídeo ao vivo estão no nosso roteiro e ainda não fazem parte desta versão.
        </p>
      </section>
      <RodapeLegal />
    </div>
  );
}
