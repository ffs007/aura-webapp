import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { meusBriefings, salvarProfissional } from '@/lib/profissionais.functions';

export const Route = createFileRoute('/_authenticated/profissionais')({
  head: () => ({ meta: [{ title: 'Profissionais · Aura ID' }] }),
  component: Page,
});

const PROFISSOES: [string, string][] = [
  ['cabeleireira', 'Cabeleireira(o)'], ['maquiadora', 'Maquiadora(o)'], ['tatuadora', 'Tatuadora(o)'],
  ['esteticista', 'Esteticista'], ['barbeiro', 'Barbeiro'], ['manicure', 'Manicure'],
];

type Envio = { id: string; titulo: string; texto: string; modulo: string | null; status: string; resposta: string | null; created_at: string; profissional: { nome: string; nome_salao: string | null; whatsapp: string | null } | null };

function Page() {
  const meus = useServerFn(meusBriefings), salvar = useServerFn(salvarProfissional);
  const [aba, setAba] = useState<'envios' | 'cadastro'>('envios');
  const [envios, setEnvios] = useState<Envio[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', profissao: 'maquiadora', nome_salao: '', cep: '', whatsapp: '', instagram: '', bio: '', raio: 25 });
  const [err, setErr] = useState('');

  useEffect(() => { meus().then(setEnvios).catch(() => setEnvios([])); }, []);

  async function cadastrar() {
    setErr(''); setSalvando(true);
    try {
      const cep = form.cep.replace(/\D/g, '');
      if (cep.length !== 8) return setErr('CEP: 8 números.');
      const geo = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const geoJson = (await geo.json()) as { location?: { coordinates?: { latitude?: number; longitude?: number } } };
      const lat = geoJson.location?.coordinates?.latitude, lng = geoJson.location?.coordinates?.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return setErr('Não achamos as coordenadas desse CEP.');
      await salvar({ data: { nome: form.nome, profissao: form.profissao as never, nome_salao: form.nome_salao || undefined, cep, lat, lng, raio_atendimento_km: form.raio, whatsapp: form.whatsapp || undefined, instagram: form.instagram || undefined, bio: form.bio || undefined } });
      toast.success('Perfil de profissional salvo! Você já aparece nas buscas da sua região.');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSalvando(false); }
  }

  const STATUS: Record<string, string> = { enviado: '📤 Enviado', respondido: '💬 Respondido', orcado: '💰 Orçado', recusado: '✖ Recusado' };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <span className="text-sm text-accent">Aura ID · Rede</span>
        <h1 className="mt-2 text-5xl">Profissionais</h1>
        <p className="mt-3 text-muted-foreground">Os briefings que você gerou podem ir direto para profissionais perto de você — e quem é da área pode se cadastrar para recebê-los.</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={aba === 'envios' ? 'default' : 'outline'} onClick={() => setAba('envios')}>Meus envios</Button>
        <Button size="sm" variant={aba === 'cadastro' ? 'default' : 'outline'} onClick={() => setAba('cadastro')}>Sou profissional — cadastrar</Button>
      </div>

      {aba === 'envios' && (
        <section className="space-y-3">
          {envios === null && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {envios?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum briefing enviado ainda. Gere um visual, clique em “💚 Gostei — e agora?”, escolha “Briefing para o salão” e envie a um profissional da sua região.</p>}
          {envios?.map((s) => (
            <article key={s.id} className="space-y-2 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.titulo}</p>
                <span className="text-xs text-muted-foreground">{STATUS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-xs text-muted-foreground">Para: {s.profissional?.nome ?? 'profissional'}{s.profissional?.nome_salao ? ` · ${s.profissional.nome_salao}` : ''}{s.profissional?.whatsapp ? ` · ${s.profissional.whatsapp}` : ''}</p>
              <details><summary className="cursor-pointer text-xs text-accent">Ver briefing</summary><div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">{s.texto}</div></details>
              {s.resposta && <div className="rounded border border-accent/40 bg-accent/5 p-3 text-xs whitespace-pre-wrap">Resposta do profissional: {s.resposta}</div>}
            </article>
          ))}
        </section>
      )}

      {aba === 'cadastro' && (
        <section className="space-y-3 rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Grátis para começar. Suas informações ficam públicas apenas para as buscas (nome, profissão, salão, contato) — seu login e dados de conta nunca aparecem.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Nome profissional<Input aria-label="Nome profissional" className="mt-1" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
            <label className="text-sm">Profissão<select aria-label="Profissão" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })}>{PROFISSOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="text-sm">Nome do salão/estúdio (opcional)<Input aria-label="Nome do salão" className="mt-1" value={form.nome_salao} onChange={(e) => setForm({ ...form, nome_salao: e.target.value })} /></label>
            <label className="text-sm">CEP do salão (8 números)<Input aria-label="CEP" className="mt-1" inputMode="numeric" maxLength={9} value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></label>
            <label className="text-sm">WhatsApp (opcional)<Input aria-label="WhatsApp" className="mt-1" placeholder="(11) 9..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></label>
            <label className="text-sm">Instagram (opcional)<Input aria-label="Instagram" className="mt-1" placeholder="@seusalao" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></label>
            <label className="text-sm">Raio de atendimento<select aria-label="Raio de atendimento" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={form.raio} onChange={(e) => setForm({ ...form, raio: Number(e.target.value) })}>{[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} km</option>)}</select></label>
          </div>
          <label className="block text-sm">Bio (opcional)<Textarea aria-label="Bio" className="mt-1" rows={3} maxLength={600} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <Button disabled={salvando || form.nome.trim().length < 2} onClick={() => void cadastrar()}>{salvando ? <LoaderCircle className="size-4 animate-spin" /> : null}Salvar meu perfil</Button>
        </section>
      )}
    </div>
  );
}
