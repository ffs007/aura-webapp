import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BadgeCheck, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { perfilProfissional, type PerfilProfissional } from '@/lib/profissionais.functions';

export const Route = createFileRoute('/p/$slug')({
  head: () => ({
    meta: [
      { title: 'Profissional · Aura ID' },
      { name: 'description', content: 'Envie seu briefing visual para esta profissional no Aura ID.' },
      { property: 'og:title', content: 'Profissional · Aura ID' },
      { property: 'og:description', content: 'Veja como você ficaria antes de ir ao salão — e envie seu briefing.' },
    ],
  }),
  component: Page,
});

const ROTULOS: Record<string, string> = {
  cabeleireira: 'Cabeleireira(o)', maquiadora: 'Maquiadora(o)', tatuadora: 'Tatuadora(o)',
  esteticista: 'Esteticista', barbeiro: 'Barbeiro', manicure: 'Manicure',
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
  useEffect(() => {
    perfilFn({ data: { slug } }).then((r) => { setP(r); setEstado(r ? 'ok' : 'vazio'); }).catch(() => setEstado('erro'));
  }, [slug]);

  if (estado === 'carregando') return <div className="grid place-items-center py-24 text-muted-foreground"><LoaderCircle className="size-6 animate-spin" /></div>;
  if (estado !== 'ok' || !p) return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-3xl">Perfil não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Este link pode ter mudado ou o perfil não está mais ativo.</p>
      <Button asChild className="mt-6"><Link to="/profissionais">Ver profissionais perto de mim</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-8 py-6">
      <header className="space-y-3 text-center">
        <span className="text-xs tracking-wide text-accent">✨ AURA ID · REDE DE PROFISSIONAIS</span>
        <h1 className="text-4xl font-display">
          {p.nome} {p.verificado && <BadgeCheck className="ml-1 inline size-6 text-accent" aria-label="Verificada" />}
        </h1>
        <p className="text-muted-foreground">
          {ROTULOS[p.profissao] ?? p.profissao}
          {p.nome_salao ? ` · ${p.nome_salao}` : ''}
        </p>
        {p.bio && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.bio}</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {p.instagram && <a href={`https://instagram.com/${p.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-3 py-1 text-sm transition hover:opacity-80">📷 {p.instagram.startsWith('@') ? p.instagram : `@${p.instagram}`}</a>}
          {p.whatsapp && <a href={linkWhats(p.whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-3 py-1 text-sm transition hover:opacity-80">💬 WhatsApp</a>}
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <p className="text-sm font-medium">Como funciona</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Você cria seu visual com a IA do Aura ID — maquiagem, cabelo, look, tatuagem…</li>
            <li>Envia o <strong>briefing com a imagem</strong> para cá com um clique.</li>
            <li>{p.nome.split(' ')[0]} responde com orçamento, prazo e — se você quiser — uma prévia de como ficaria em você.</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/profissionais"><Send className="size-4" /> Enviar meu briefing</Link></Button>
          <Button asChild variant="outline"><Link to="/studio"><Sparkles className="size-4" /> Criar meu visual primeiro</Link></Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Ao continuar você cria sua conta gratuita no Aura ID. Seus dados e fotos ficam privados — só o que você enviar chega à profissional.</p>
      </section>

      <p className="text-center text-[10px] text-muted-foreground">Perfil mantido pela própria profissional no Aura ID · aura-webapp-dusky.vercel.app</p>
    </div>
  );
}
