import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { listarVitrine, ESTILOS_VITRINE, type DesignVitrine } from '@/lib/vitrine.functions';

export const Route = createFileRoute('/_authenticated/tatuagem/vitrine')({
  head: () => ({ meta: [{ title: 'Vitrine de tatuagens · Aura ID' }] }),
  component: Page,
});

/** Fatia D1 — vitrine dos estúdios: designs publicados para se inspirar (e em breve provar no corpo — D2). */
function Page() {
  const listar = useServerFn(listarVitrine);
  const [estilo, setEstilo] = useState('');
  const [designs, setDesigns] = useState<DesignVitrine[] | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function carregar(e: string) {
    setEstilo(e); setCarregando(true);
    try { setDesigns(await listar({ data: e ? { estilo: e } : {} })); } catch { setDesigns([]); } finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(''); }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-sm text-accent">Aura ID · Tatuagem</span>
        <h1 className="mt-2 text-4xl">🖤 Vitrine dos estúdios</h1>
        <p className="mt-2 text-muted-foreground">Designs publicados pelas tatuadoras da rede. Achou o seu? Em breve você testa no próprio corpo antes de marcar (provador em produção) — e o briefing vai direto pro estúdio.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void carregar('')} className={`rounded-full px-3 py-1 text-sm ${estilo === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Todos</button>
        {ESTILOS_VITRINE.map((e) => (
          <button key={e} onClick={() => void carregar(e)} className={`rounded-full px-3 py-1 text-sm capitalize ${estilo === e ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{e}</button>
        ))}
      </div>

      {carregando && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Carregando…</p>}
      {designs?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum design publicado ainda{estilo ? ` no estilo ${estilo}` : ''}. Convide seu estúdio — publicar é grátis.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs?.map((d) => (
          <article key={d.id} className="overflow-hidden rounded-xl border bg-card">
            <img src={d.imagem_url} alt={d.titulo} className="aspect-square w-full bg-secondary object-contain" loading="lazy" />
            <div className="space-y-1 p-4">
              {d.destaque > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-700">Patrocinado</span>}
              <h2 className="text-lg font-medium">{d.titulo}</h2>
              <p className="text-xs text-muted-foreground">
                {d.estilo ? `${d.estilo} · ` : ''}{d.local_sugerido ?? 'local a combinar'}{d.tamanho ? ` · ${d.tamanho}` : ''}
              </p>
              {d.estudio && (
                <p className="text-xs text-accent">
                  {d.slug
                    ? <Link to="/p/$slug" params={{ slug: d.slug }} className="underline">{d.estudio}{d.verificado ? ' ✓' : ''}</Link>
                    : <>{d.estudio}{d.verificado ? ' ✓' : ''}</>}
                </p>
              )}
              {d.descricao && <p className="text-xs text-muted-foreground">{d.descricao}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
