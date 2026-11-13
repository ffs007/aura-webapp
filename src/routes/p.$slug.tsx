import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BadgeCheck, SearchX, Send, Sparkles } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { CabecalhoPagina, CarregandoPagina, EstadoErro, EstadoVazio } from '@/components/estados';
import { CARTAO } from '@/lib/design';
import { guardarDestino } from '@/lib/navegacao';
import { perfilProfissional, type PerfilProfissional } from '@/lib/profissionais.functions';

export const Route = createFileRoute('/p/$slug')({
  head: () => ({
    meta: [
      { title: 'Profissional · Aura ID' },
      { name: 'description', content: 'Envie seu briefing visual para quem vai atender você no Aura ID.' },
      { property: 'og:title', content: 'Profissional · Aura ID' },
      { property: 'og:description', content: 'Veja como você ficaria antes de ir ao salão — e envie seu briefing.' },
    ],
  }),
  component: Page,
});

const ROTULOS: Record<string, string> = {
  cabeleireira: 'Cabelo', maquiadora: 'Maquiagem', tatuadora: 'Tatuagem',
  esteticista: 'Estética', barbeiro: 'Barbearia', manicure: 'Manicure',
};

/** WhatsApp salvo como digits (10-11) ganha 55; senão usa como está. */
const linkWhats = (w: string) => {
  const d = w.replace(/\D/g, '');
  return `https://wa.me/${d.length >= 12 ? d : '55' + d}`;
};

function Page() {
  const { slug } = Route.useParams();
  const perfilFn = useServerFn(perfilProfissional);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'vazio' | 'erro'>('carregando');
  const [p, setP] = useState<PerfilProfissional | null>(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let vivo = true;
    setEstado('carregando');
    perfilFn({ data: { slug } }).then((r) => { if (vivo) { setP(r); setEstado(r ? 'ok' : 'vazio'); } }).catch(() => { if (vivo) setEstado('erro'); });
    return () => { vivo = false; };
  }, [slug, tentativa]);

  if (estado === 'carregando') return <CarregandoPagina rotulo="Carregando perfil…" className="min-h-screen" />;

  if (estado === 'erro') {
    return (
      <div className="mx-auto max-w-md py-24">
        <EstadoErro
          titulo="Não foi possível carregar o perfil"
          descricao="Pode ser instabilidade de conexão. Tente de novo — o link continua válido."
          onTentarNovamente={() => setTentativa((n) => n + 1)}
          acoes={<Button asChild variant="outline"><Link to="/profissionais">Ver profissionais perto de mim</Link></Button>}
        />
      </div>
    );
  }

  if (estado === 'vazio' || !p) {
    return (
      <div className="mx-auto max-w-md py-20">
        <EstadoVazio
          icone={<SearchX className="size-5" />}
          titulo="Perfil não encontrado"
          descricao="Este link pode ter mudado ou o perfil não está mais ativo."
          acoes={<Button asChild><Link to="/profissionais">Ver profissionais perto de mim</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 py-6">
      <CabecalhoPagina
        antes={<p className="text-xs tracking-wide text-accent">✨ AURA ID · REDE DE PROFISSIONAIS</p>}
        titulo={<>{p.nome} {p.verificado && <BadgeCheck className="ml-1 inline size-6 text-accent" aria-label="Perfil verificado" />}</>}
        descricao={<>{ROTULOS[p.profissao] ?? p.profissao}{p.nome_salao ? ` · ${p.nome_salao}` : ''}</>}
        className="text-center [&_h1]:text-4xl [&_h1]:font-display [&>div]:justify-center [&>div>div]:mx-auto"
      />
      {p.bio && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.bio}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {p.instagram && <a href={`https://instagram.com/${p.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-3 py-1 text-sm transition hover:opacity-80">📷 {p.instagram.startsWith('@') ? p.instagram : `@${p.instagram}`}</a>}
        {p.whatsapp && <a href={linkWhats(p.whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-3 py-1 text-sm transition hover:opacity-80">💬 WhatsApp</a>}
      </div>

      <section className={`space-y-4 ${CARTAO}`}>
        <div>
          <p className="text-sm font-medium">Como funciona</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Você cria seu visual com a IA do Aura ID — maquiagem, cabelo, look, tatuagem…</li>
            <li>Envia o <strong>briefing</strong> para cá com um clique — foto e pacote são opcionais.</li>
            <li>{p.nome.split(' ')[0]} responde com orçamento, prazo e — se você quiser — uma prévia de como ficaria em você.</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          {/*
            O briefing é autenticado (/briefing/{slug} fica no gate _authenticated),
            então guardamos o destino antes de sair: depois de login, consentimento
            e onboarding a pessoa volta para cá com a profissional preservada.
          */}
          <Button asChild>
            <a
              href={`/briefing/${slug}`}
              onClick={() => guardarDestino(`/briefing/${slug}`)}
            >
              <Send className="size-4" /> Enviar meu briefing
            </a>
          </Button>
          <Button asChild variant="outline"><Link to="/studio"><Sparkles className="size-4" /> Criar meu visual primeiro</Link></Button>
        </div>
        <p className="text-xs text-muted-foreground">Ao continuar você cria sua conta gratuita no Aura ID. Seus dados e fotos ficam privados — só o que você enviar chega a quem atende.</p>
      </section>

      <p className="text-center text-xs text-muted-foreground">Perfil mantido pela própria pessoa no Aura ID · aura-webapp-dusky.vercel.app</p>
    </div>
  );
}
