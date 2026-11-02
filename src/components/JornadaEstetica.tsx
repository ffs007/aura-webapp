import { useEffect, useState } from 'react';
import { LoaderCircle, Sprout, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { PROCEDIMENTOS, CUIDADOS, criarJornada, listarJornadas, addRegistro, atualizarJornada, excluirJornada, type JornadaEstetica } from '@/lib/estetica.functions';

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAte = (iso: string | null) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d;
};

/**
 * Fatia C4 — Jornada pós-procedimento: diário de evolução com fotos (privadas),
 * data de retorno com contagem regressiva e cuidados por procedimento.
 * RLS fechada: só a própria usuária vê.
 */
export function JornadaEstetica({ procedimentoAtual }: { procedimentoAtual?: string | null }) {
  const listar = useServerFn(listarJornadas), criar = useServerFn(criarJornada);
  const addFn = useServerFn(addRegistro), atualizar = useServerFn(atualizarJornada), excluir = useServerFn(excluirJornada);
  const [jornadas, setJornadas] = useState<JornadaEstetica[] | null>(null);
  const [proc, setProc] = useState(procedimentoAtual ?? PROCEDIMENTOS[0]?.id ?? '');
  const [inicio, setInicio] = useState(hoje());
  const [retorno, setRetorno] = useState('');
  const [criando, setCriando] = useState(false);
  const [err, setErr] = useState('');
  const [nota, setNota] = useState<Record<string, string>>({});
  const [arquivo, setArquivo] = useState<Record<string, File | null>>({});
  const [salvandoReg, setSalvandoReg] = useState('');

  async function carregar() {
    try { setJornadas(await listar()); } catch { setJornadas([]); }
  }
  useEffect(() => { void carregar(); }, []);

  async function comecar() {
    setCriando(true); setErr('');
    try {
      await criar({ data: { procedimento: proc as never, inicio, ...(retorno ? { retorno_em: retorno } : {}) } });
      toast.success('Jornada começada! Registre sua evolução e leve no retorno. 🌱');
      setRetorno('');
      await carregar();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Não foi possível começar.'); } finally { setCriando(false); }
  }

  async function registrar(j: JornadaEstetica) {
    const texto = nota[j.id]?.trim();
    const arq = arquivo[j.id];
    if (!texto && !arq) return toast.error('Escreva algo ou anexe uma foto.');
    setSalvandoReg(j.id);
    try {
      let foto_path: string | undefined;
      if (arq) {
        const { data: u } = await supabase.auth.getUser();
        const caminho = `${u.user?.id ?? ''}/jornada-${j.id}-${Date.now()}.png`;
        const up = await supabase.storage.from('user-photos').upload(caminho, arq, { contentType: arq.type || 'image/png' });
        if (up.error) throw new Error(up.error.message);
        foto_path = caminho;
      }
      await addFn({ data: { jornada_id: j.id, ...(texto ? { texto } : {}), ...(foto_path ? { foto_path } : {}) } });
      setNota((x) => ({ ...x, [j.id]: '' }));
      setArquivo((x) => ({ ...x, [j.id]: null }));
      await carregar();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSalvandoReg(''); }
  }

  return (
    <section className="space-y-4" role="region" aria-label="Jornada pós-procedimento">
      <div>
        <h2 className="text-3xl">🌱 Jornada pós-procedimento</h2>
        <p className="mt-1 text-sm text-muted-foreground">Fez o procedimento? Registre a evolução com fotos (privadas, só suas), acompanhe a data do retorno e os cuidados. É seu histórico — leve no consultório.</p>
      </div>

      <div className="grid gap-2 rounded-lg border bg-card p-4 sm:grid-cols-4 sm:items-end">
        <label className="text-sm">Procedimento<select aria-label="Procedimento" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={proc} onChange={(e) => setProc(e.target.value)}>{PROCEDIMENTOS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label className="text-sm">Feito em<Input aria-label="Data do procedimento" type="date" className="mt-1" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
        <label className="text-sm">Retorno (opcional)<Input aria-label="Data de retorno" type="date" className="mt-1" value={retorno} onChange={(e) => setRetorno(e.target.value)} /></label>
        <Button size="sm" disabled={criando} onClick={() => void comecar()}>{criando ? <LoaderCircle className="size-4 animate-spin" /> : <Sprout className="size-4" />}Começar jornada</Button>
      </div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}

      {jornadas?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma jornada ativa. Comece uma quando fizer o procedimento.</p>}
      {jornadas?.map((j) => {
        const nome = PROCEDIMENTOS.find((p) => p.id === j.procedimento)?.nome ?? j.procedimento;
        const dias = diasAte(j.retorno_em);
        const aberta = j.status === 'ativa';
        return (
          <article key={j.id} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{nome} <span className="text-xs text-muted-foreground">· desde {new Date(j.inicio).toLocaleDateString('pt-BR')}</span></p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${aberta ? 'bg-emerald-500/10 text-emerald-700' : 'bg-secondary'}`}>{aberta ? 'ativa' : j.status}</span>
                  {aberta && dias !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${dias <= 7 ? 'bg-amber-500/15 text-amber-700' : 'bg-secondary'}`}>
                      {dias < 0 ? `retorno era ${new Date(j.retorno_em!).toLocaleDateString('pt-BR')}` : dias === 0 ? 'retorno HOJE' : `retorno em ${dias} dia(s)`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {aberta && (
                  <>
                    <Input aria-label="Nova data de retorno" type="date" className="h-8 w-36" value={j.retorno_em ? new Date(j.retorno_em).toISOString().slice(0, 10) : ''} onChange={(e) => void atualizar({ data: { id: j.id, retorno_em: e.target.value || null } }).then(carregar).catch(() => toast.error('Não salvou.'))} title="Definir data de retorno" />
                    <Button size="sm" variant="outline" onClick={() => void atualizar({ data: { id: j.id, status: 'concluida' } }).then(carregar)}>Concluir</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" title="Excluir jornada" onClick={() => { if (confirm('Excluir a jornada e todos os registros?')) void excluir({ data: { id: j.id } }).then(carregar).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro.')); }}><Trash2 className="size-4" /></Button>
              </div>
            </div>

            <details className="rounded-md border bg-background p-3">
              <summary className="cursor-pointer text-xs text-accent">Cuidados gerais com {nome.toLowerCase()}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {(CUIDADOS[j.procedimento] ?? ['Siga as orientações do seu profissional.']).map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="mt-2 text-[10px] text-amber-700">Orientações genéricas de autocuidado — SEMPRE prevalecem as do profissional que atendeu você.</p>
            </details>

            <div className="space-y-2">
              {j.registros.map((r) => (
                <div key={r.id} className="flex gap-3 rounded-md border bg-background p-2">
                  {r.foto_url && <img src={r.foto_url} alt="Registro da evolução" className="size-16 shrink-0 rounded object-cover" />}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{new Date(r.quando).toLocaleString('pt-BR')}</p>
                    {r.texto && <p className="text-sm whitespace-pre-wrap">{r.texto}</p>}
                  </div>
                </div>
              ))}
              {aberta && (
                <div className="space-y-2 rounded-md border border-dashed p-2">
                  <Textarea aria-label="Como você está" rows={2} maxLength={2000} placeholder="Como está sentindo hoje? Inchaço, resultado, dúvidas…" value={nota[j.id] ?? ''} onChange={(e) => setNota((x) => ({ ...x, [j.id]: e.target.value }))} />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => setArquivo((x) => ({ ...x, [j.id]: e.target.files?.[0] ?? null }))} />
                      📷 {arquivo[j.id] ? arquivo[j.id]?.name : 'anexar foto'}
                    </label>
                    <Button size="sm" disabled={salvandoReg === j.id} onClick={() => void registrar(j)}>{salvandoReg === j.id ? <LoaderCircle className="size-4 animate-spin" /> : null}Registrar</Button>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
