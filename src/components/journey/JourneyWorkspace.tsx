import { Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CabecalhoPagina, EstadoVazio } from '@/components/estados';
import { CARTAO_COMPACTO, TITULO_ITEM, TITULO_SECAO } from '@/lib/design';
import { Sprout, Image as ImageIcon, History, LayoutList, SearchX } from 'lucide-react';
import { Confirm } from '@/components/Confirm';
import { supabase } from '@/integrations/supabase/client';
import { JOURNEY_GOALS, STEP_CATEGORIES, STEP_STATUSES, STATUS_KEYS, journeyToMarkdown, type JourneyReport } from '@/lib/journey';
import { journeyData, saveGoal, savePlan, suggestPlan, addStep, setStepStatus, addReflection, registerJourneyPhoto, generateReport, addJourneyReminder, logJourneyEvent, deleteJourneyPlan } from '@/lib/journey.functions';
import { lerRascunho, limparRascunho, rotuloRascunho, useSalvarRascunho } from '@/hooks/useRascunho';

export const journeyQuery = queryOptions({ queryKey: ['journey'], queryFn: () => journeyData() });
export function useJourney() { return useSuspenseQuery(journeyQuery).data; }
const err = (_e: unknown) => toast.error('Não foi possível concluir. Tente de novo.');
const sel = 'mt-2 w-full rounded-md border bg-background p-3';

export function JourneyNav() {
  const items = [['/jornada', 'Início'], ['/jornada/objetivo', 'Objetivo e plano'], ['/jornada/diario', 'Diário visual'], ['/jornada/galeria', 'Antes e depois'], ['/jornada/relatorios', 'Relatórios'], ['/jornada/linha-do-tempo', 'Linha do tempo']] as const;
  return <nav aria-label="Jornada" className="mb-8 flex flex-wrap gap-2 border-b pb-4">{items.map(([to, l]) => <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1 text-sm text-muted-foreground" activeProps={{ className: 'bg-secondary text-foreground' }}>{l}</Link>)}</nav>;
}

export function PlanSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const d = useJourney();
  return <label className="block max-w-md text-sm">Plano<select aria-label="Plano" className={sel} value={value} onChange={e => onChange(e.target.value)}><option value="">Selecione um plano</option>{d.plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>;
}

export function JourneyHome() {
  const d = useJourney(); const qc = useQueryClient(); const del = useServerFn(deleteJourneyPlan);
  return <div className="space-y-8">
    <CabecalhoPagina
      sobretitulo="Aura ID · mudanças no seu ritmo"
      titulo="Jornada"
      descricao="Transforme sugestões em pequenos passos, registre o que viveu e lembre do que funcionou para você."
      acoes={<Button asChild><Link to="/jornada/objetivo">Novo plano</Link></Button>}
    />
    {!d.plans.length && (
      <EstadoVazio
        icone={<Sprout className="size-5" />}
        titulo="Nenhum plano ainda"
        descricao="Comece escolhendo uma intenção — não há jeito certo de começar."
        tom="destaque"
        acoes={<Button asChild><Link to="/jornada/objetivo">Criar meu primeiro plano</Link></Button>}
      />
    )}
    <div className="grid gap-4 md:grid-cols-2">{d.plans.map(p => { const st = d.steps.filter(s => s.plan_id === p.id); return <article key={p.id} className={`space-y-0 ${CARTAO_COMPACTO}`}><p className="text-xs text-accent">{p.period === 'monthly' ? 'Mensal' : 'Trimestral'} · desde {new Date(p.starts_on + 'T12:00').toLocaleDateString('pt-BR')}</p><h2 className={`mt-1 ${TITULO_SECAO}`}>{p.title}</h2><p className="mt-2 text-sm text-muted-foreground">{st.length} {st.length === 1 ? 'passo' : 'passos'} · {st.filter(s => s.status === 'testing').length} em teste</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/jornada/plano/$id" params={{ id: p.id }}>Abrir plano</Link></Button><Confirm label="Excluir plano" desc="Remove passos, reflexões, fotos, relatórios e lembretes deste plano. Não pode ser desfeito." onYes={async () => { try { await del({ data: { plan_id: p.id } }); qc.invalidateQueries(); } catch (e) { err(e); } }} /></div></article>; })}</div>
  </div>;
}

type Draft = { title: string; category: string; period_index: number; package_id: string | null };
type GoalDraft = { goal: string; custom: string; why: string; period: 'monthly' | 'quarterly'; title: string; start: string; steps: Draft[] };
type ReflexaoDraft = { note: string; emotional_note: string; practicality: number | null; maintenance: number | null; self_esteem: number | null; social_reception: string; include_in_report: boolean };
export function GoalAndPlan() {
  const d = useJourney(); const nav = useNavigate(); const qc = useQueryClient();
  const sg = useServerFn(saveGoal), sp = useServerFn(savePlan), sug = useServerFn(suggestPlan);
  const [goal, setGoal] = useState<string>(''); const [custom, setCustom] = useState(''); const [why, setWhy] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly'); const [title, setTitle] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10)); const [steps, setSteps] = useState<Draft[]>([]); const [busy, setBusy] = useState(''); const [aiUsed, setAiUsed] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);
  const [uid, setUid] = useState(''); const [limpoEm, setLimpoEm] = useState(0); const [concluido, setConcluido] = useState(false);
  const draftKey = uid ? `jornada:${uid}:objetivo` : '';
  const draft = useMemo<GoalDraft>(() => ({ goal, custom, why, period, title, start, steps }), [goal, custom, why, period, title, start, steps]);
  const editado = goal !== '' || custom !== '' || why !== '' || period !== 'monthly' || title !== '' || start !== hoje || steps.length > 0;
  const salvoEm = useSalvarRascunho(draftKey, draft, !!draftKey && editado && !concluido);
  const mostrarRascunho = salvoEm !== null && salvoEm > limpoEm && !concluido;
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? '')); }, []);
  useEffect(() => {
    if (!draftKey) return;
    const salvo = lerRascunho<GoalDraft>(draftKey);
    if (!salvo) return;
    if (typeof salvo.goal === 'string') setGoal(salvo.goal);
    if (typeof salvo.custom === 'string') setCustom(salvo.custom);
    if (typeof salvo.why === 'string') setWhy(salvo.why);
    if (salvo.period === 'monthly' || salvo.period === 'quarterly') setPeriod(salvo.period);
    if (typeof salvo.title === 'string') setTitle(salvo.title);
    if (typeof salvo.start === 'string' && salvo.start) setStart(salvo.start);
    if (Array.isArray(salvo.steps)) setSteps(salvo.steps.flatMap(s => (s && typeof s.title === 'string') ? [{ title: s.title, category: typeof s.category === 'string' ? s.category : 'outro', period_index: Number.isFinite(s.period_index) ? s.period_index : 1, package_id: typeof s.package_id === 'string' ? s.package_id : null }] : []));
  }, [draftKey]);
  function descartar() { if (draftKey) limparRascunho(draftKey); setGoal(''); setCustom(''); setWhy(''); setPeriod('monthly'); setTitle(''); setStart(hoje); setSteps([]); setAiUsed(false); setLimpoEm(Date.now()); }
  const customText = custom.trim(); const fallbackTitle = customText || goal; const hasIntent = !!fallbackTitle;
  const savingRef = useRef(false);
  const slots = period === 'monthly' ? 4 : 3; const slotName = period === 'monthly' ? 'Semana' : 'Mês';
  async function suggest() { if (busy) return; if (!hasIntent) { toast.error('Escolha uma intenção para o seu plano.'); return; } setBusy('ai'); try { const r = await sug({ data: { goal: customText || goal, why, period } }); if (r.error || !r.plan) { toast.error(r.error ?? 'Não foi possível montar uma sugestão. Tente de novo.'); return; } setTitle(t => t || r.plan!.title); setSteps(r.plan.steps.map(s => ({ ...s, package_id: null }))); setAiUsed(true); } catch (e) { err(e); } finally { setBusy(''); } }
  async function submit(e: React.FormEvent) { e.preventDefault(); if (savingRef.current || busy) return; if (!hasIntent) { toast.error('Escolha uma intenção para o seu plano.'); return; } savingRef.current = true; setBusy('save'); try { const g = await sg({ data: { goal: goal || 'Com as minhas palavras', custom, why } }); const p = await sp({ data: { goal_id: g.id, title: title.trim() || fallbackTitle, period, starts_on: start, steps: steps.filter(s => s.title.trim()) } }); setConcluido(true); if (draftKey) limparRascunho(draftKey); await qc.invalidateQueries({ queryKey: ['journey'] }); await nav({ to: '/jornada/plano/$id', params: { id: p.id } }); } catch (e) { err(e); } finally { savingRef.current = false; setBusy(''); } }
  const upd = (i: number, v: Partial<Draft>) => setSteps(s => s.map((x, j) => j === i ? { ...x, ...v } : x));
  return <form onSubmit={submit} className="max-w-3xl space-y-8">
    <CabecalhoPagina titulo="Sua intenção de transformação" />
    <fieldset className="space-y-3"><legend className="text-sm">O que você deseja cultivar?<span className="text-accent"> (escolha uma intenção ou escreva com suas palavras)</span></legend><div className="flex flex-wrap gap-2">{JOURNEY_GOALS.map(g => <Button type="button" key={g} size="sm" variant={goal === g ? 'default' : 'outline'} aria-pressed={goal === g} onClick={() => setGoal(goal === g ? '' : g)}>{g}</Button>)}</div>
      <p className="text-xs text-muted-foreground">{hasIntent ? `Intenção do plano: “${fallbackTitle}”.` : 'Escolha uma intenção acima ou escreva com suas palavras — é o ponto de partida do plano.'}</p>
      <label className="block text-sm">Com suas palavras (opcional — vale como intenção se nenhuma for escolhida)<Input className="mt-2" maxLength={300} value={custom} onChange={e => setCustom(e.target.value)} /></label>
      <label className="block text-sm">Por que agora? (opcional, privado)<Textarea className="mt-2" maxLength={1000} value={why} onChange={e => setWhy(e.target.value)} /></label></fieldset>
    <div className="grid gap-5 sm:grid-cols-3"><label className="text-sm">Duração<select aria-label="Duração" className={sel} value={period} onChange={e => { setPeriod(e.target.value as 'monthly'); setSteps([]); }}><option value="monthly">Mensal (4 semanas)</option><option value="quarterly">Trimestral (3 meses)</option></select></label><label className="text-sm">Início<Input type="date" className="mt-2" value={start} onChange={e => setStart(e.target.value)} required /></label><label className="text-sm">Nome do plano<Input className="mt-2" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder={fallbackTitle || 'Ex.: Meu novo ritmo'} /><span className="mt-1 block text-xs text-muted-foreground">{title.trim() ? `Nome do plano: “${title.trim()}”.` : fallbackTitle ? `Em branco, usamos “${fallbackTitle}”.` : 'Sem nome, usamos a intenção escolhida.'}</span></label></div>
    <section className="space-y-4 border-t pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className={TITULO_SECAO}>Passos</h2><div className="flex gap-2"><Button type="button" variant="outline" disabled={!!busy} onClick={suggest}>{busy === 'ai' ? 'Sugerindo…' : 'Sugerir rascunho com IA'}</Button><Button type="button" variant="ghost" onClick={() => setSteps(s => [...s, { title: '', category: 'outro', period_index: 1, package_id: null }])}>Adicionar passo</Button></div></div>
      {aiUsed && <p className="text-xs text-accent">Rascunho gerado por IA — edite à vontade.</p>}
      {steps.map((s, i) => <div key={i} className={`grid gap-3 ${CARTAO_COMPACTO} sm:grid-cols-[1fr_auto_auto_auto]`}><Input aria-label="Passo" value={s.title} maxLength={160} onChange={e => upd(i, { title: e.target.value })} placeholder="Ex.: testar coque baixo no trabalho" /><select aria-label="Área" className="rounded-md border bg-background p-2" value={s.category} onChange={e => upd(i, { category: e.target.value })}>{Object.entries(STEP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><select aria-label={slotName} className="rounded-md border bg-background p-2" value={s.period_index} onChange={e => upd(i, { period_index: Number(e.target.value) })}>{Array.from({ length: slots }, (_, n) => <option key={n} value={n + 1}>{slotName} {n + 1}</option>)}</select><Button type="button" size="sm" variant="ghost" onClick={() => setSteps(x => x.filter((_, j) => j !== i))}>Remover</Button>
        <select aria-label="Ligar a uma sugestão salva" className="rounded-md border bg-background p-2 text-sm sm:col-span-4" value={s.package_id ?? ''} onChange={e => upd(i, { package_id: e.target.value || null })}><option value="">Sem sugestão ligada</option>{d.packages.map(p => <option key={p.id} value={p.id}>{String((p.content as Record<string, unknown>)['title'] ?? 'Sugestão')}</option>)}</select></div>)}
      {!steps.length && <p className="text-sm text-muted-foreground">Comece com um ou dois passos pequenos. Você pode adicionar outros depois.</p>}
    </section>
    <div className="space-y-2"><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!!busy}>{busy === 'save' ? 'Salvando…' : 'Criar plano'}</Button>{mostrarRascunho && <p className="text-xs text-muted-foreground">{rotuloRascunho(salvoEm)}</p>}{mostrarRascunho && <Button type="button" variant="ghost" size="sm" onClick={descartar}>Descartar rascunho</Button>}</div>{!hasIntent && <p className="text-xs text-muted-foreground">Falta escolher uma intenção (ou escrever com suas palavras) para criar o plano.</p>}</div>
  </form>;
}

function Score({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return <fieldset className="text-sm"><legend>{label}</legend><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map(n => <Button type="button" size="sm" key={n} aria-label={`${label} ${n}`} aria-pressed={value === n} variant={value === n ? 'default' : 'outline'} onClick={() => onChange(n)}>{n}</Button>)}</div></fieldset>;
}

export function ReflectionForm({ planId, stepId, onDone }: { planId: string; stepId: string | null; onDone?: () => void }) {
  const add = useServerFn(addReflection); const qc = useQueryClient();
  const empty: ReflexaoDraft = { note: '', emotional_note: '', practicality: null, maintenance: null, self_esteem: null, social_reception: '', include_in_report: false };
  const chave = `jornada:${planId}:${stepId ?? 'livre'}:reflexao`;
  const [f, setF] = useState<ReflexaoDraft>(empty); const [busy, setBusy] = useState(false);
  const [limpoEm, setLimpoEm] = useState(0); const chaveRef = useRef('');
  useEffect(() => {
    if (chaveRef.current === chave) return;
    chaveRef.current = chave;
    const salvo = lerRascunho<ReflexaoDraft>(chave);
    setF(salvo ? { ...empty, ...salvo } : empty);
    setLimpoEm(Date.now());
  }, [chave]);
  const editado = f.note !== '' || f.emotional_note !== '' || f.practicality !== null || f.maintenance !== null || f.self_esteem !== null || f.social_reception !== '' || f.include_in_report;
  const salvoEm = useSalvarRascunho(chave, f, editado);
  const mostrarRascunho = salvoEm !== null && salvoEm > limpoEm;
  function descartar() { limparRascunho(chave); setF(empty); setLimpoEm(Date.now()); }
  return <form className={`space-y-4 ${CARTAO_COMPACTO}`} onSubmit={async e => { e.preventDefault(); setBusy(true); try { await add({ data: { plan_id: planId, step_id: stepId, ...f } }); limparRascunho(chave); setF(empty); setLimpoEm(Date.now()); await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success('Reflexão guardada.'); onDone?.(); } catch (e) { err(e); } finally { setBusy(false); } }}>
    <h3 className={TITULO_ITEM}>Como foi?</h3>
    <label className="block text-sm">O que você notou<Textarea className="mt-2" maxLength={2000} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
    <div className="grid gap-4 sm:grid-cols-3"><Score label="Praticidade" value={f.practicality} onChange={v => setF({ ...f, practicality: v })} /><Score label="Manutenção leve" value={f.maintenance} onChange={v => setF({ ...f, maintenance: v })} /><Score label="Autoestima" value={f.self_esteem} onChange={v => setF({ ...f, self_esteem: v })} /></div>
    <label className="block text-sm">Recepção das pessoas (opcional)<Input className="mt-2" maxLength={500} value={f.social_reception} onChange={e => setF({ ...f, social_reception: e.target.value })} /></label>
    <label className="block text-sm">Nota emocional (privada)<Textarea className="mt-2" maxLength={2000} value={f.emotional_note} onChange={e => setF({ ...f, emotional_note: e.target.value })} /></label>
    <label className="flex items-center justify-between gap-4 text-sm"><span>Usar a nota emocional no meu relatório (nunca exportada nem compartilhada)</span><Switch aria-label="Usar nota emocional no relatório" checked={f.include_in_report} onCheckedChange={v => setF({ ...f, include_in_report: v })} /></label>
    <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar reflexão'}</Button>{mostrarRascunho && <span className="text-xs text-muted-foreground">{rotuloRascunho(salvoEm)}</span>}{mostrarRascunho && <Button type="button" size="sm" variant="ghost" onClick={descartar}>Descartar rascunho</Button>}</div>
  </form>;
}

export function PlanView({ id }: { id: string }) {
  const d = useJourney(); const qc = useQueryClient(); const nav = useNavigate();
  const setS = useServerFn(setStepStatus), add = useServerFn(addStep), rem = useServerFn(addJourneyReminder), gen = useServerFn(generateReport);
  const plan = d.plans.find(p => p.id === id); const [reflect, setReflect] = useState<string | null>(null);
  const [nt, setNt] = useState(''); const [nc, setNc] = useState('outro'); const [rt, setRt] = useState('Revisar meu plano'); const [rd, setRd] = useState(''); const [busy, setBusy] = useState(false);
  if (!plan) return <EstadoVazio compacto icone={<SearchX className="size-5" />} titulo="Plano não encontrado" descricao="Ele pode ter sido excluído ou o link está incompleto." acoes={<Button asChild variant="outline"><Link to="/jornada">Voltar para a Jornada</Link></Button>} />;
  const steps = d.steps.filter(s => s.plan_id === id); const slots = plan.period === 'monthly' ? 4 : 3; const slotName = plan.period === 'monthly' ? 'Semana' : 'Mês';
  const refresh = () => qc.invalidateQueries({ queryKey: ['journey'] });
  async function report() { setBusy(true); try { const r = await gen({ data: { plan_id: id, kind: plan!.period === 'monthly' ? 'month' : 'quarter' } }); if (r.error || !r.id) { toast.error(r.error ?? 'Não foi possível gerar o relatório. Tente de novo.'); return; } await refresh(); await nav({ to: '/jornada/relatorio/$id', params: { id: r.id } }); } catch (e) { err(e); } finally { setBusy(false); } }
  return <div className="space-y-10">
    <CabecalhoPagina
      sobretitulo={plan.period === 'monthly' ? 'Plano mensal' : 'Plano trimestral'}
      titulo={plan.title}
      acoes={<Button onClick={report} disabled={busy || !steps.length}>{busy ? 'Gerando…' : plan.period === 'monthly' ? 'Gerar “Meu mês em imagens”' : 'Gerar relatório do trimestre'}</Button>}
    />
    <section><h2 className={TITULO_SECAO}>Construtor</h2><div className="mt-4 grid gap-4 md:grid-cols-4">{Array.from({ length: slots }, (_, n) => <div key={n} className="rounded-lg border p-4"><h3 className="text-xl">{slotName} {n + 1}</h3><ul className="mt-2 space-y-1 text-sm">{steps.filter(s => s.period_index === n + 1).map(s => <li key={s.id}>{s.title} <span className="text-muted-foreground">· {STEP_STATUSES[s.status]}</span></li>)}</ul></div>)}</div>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); try { await add({ data: { plan_id: id, title: nt, category: nc, period_index: Number(f.get('slot')), package_id: null } }); setNt(''); refresh(); } catch (e) { err(e); } }}><Input aria-label="Novo passo" className="max-w-xs" required maxLength={160} value={nt} onChange={e => setNt(e.target.value)} placeholder="Novo passo" /><select aria-label="Área do passo" className="rounded-md border bg-background p-2" value={nc} onChange={e => setNc(e.target.value)}>{Object.entries(STEP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><select name="slot" aria-label="Período" className="rounded-md border bg-background p-2">{Array.from({ length: slots }, (_, n) => <option key={n} value={n + 1}>{slotName} {n + 1}</option>)}</select><Button type="submit" variant="outline">Adicionar</Button></form></section>
    <section><h2 className={TITULO_SECAO}>Quadro de experimentos</h2><p className="mt-1 text-sm text-muted-foreground">Cada resultado ensina algo — inclusive o que não funcionou.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{STATUS_KEYS.map(k => <div key={k} className="rounded-lg bg-secondary/50 p-3"><h3 className="text-sm font-semibold">{STEP_STATUSES[k]}</h3><div className="mt-2 space-y-2">{steps.filter(s => s.status === k).map(s => <article key={s.id} className="rounded-md border bg-card p-3 text-sm"><p className="text-xs text-accent">{STEP_CATEGORIES[s.category]}</p><p className="mt-1">{s.title}</p>{s.package_id && <Link to="/package/$id" params={{ id: s.package_id }} className="text-xs underline">Ver sugestão</Link>}<select aria-label={`Status de ${s.title}`} className="mt-2 w-full rounded border bg-background p-1 text-xs" value={s.status} onChange={async e => { try { await setS({ data: { id: s.id, status: e.target.value } }); refresh(); } catch (er) { err(er); } }}>{STATUS_KEYS.map(x => <option key={x} value={x}>{STEP_STATUSES[x]}</option>)}</select><Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => setReflect(reflect === s.id ? null : s.id)}>Refletir</Button></article>)}</div></div>)}</div>
      {reflect && <div className="mt-5 max-w-2xl"><ReflectionForm planId={id} stepId={reflect} onDone={() => setReflect(null)} /></div>}</section>
    <section className="max-w-2xl space-y-3 border-t pt-6"><h2 className={TITULO_SECAO}>Lembretes opcionais</h2><p className="text-sm text-muted-foreground">Aparecem só dentro do app. Nada é enviado por e-mail ou mensagem.</p>
      <div className="flex flex-wrap gap-2">{['Revisar meu plano', 'Preparar para evento', 'Check-in do que está em teste', 'Gerar relatório do mês'].map(t => <Button key={t} size="sm" variant={rt === t ? 'default' : 'outline'} aria-pressed={rt === t} onClick={() => setRt(t)}>{t}</Button>)}</div>
      <form className="flex flex-wrap gap-2" onSubmit={async e => { e.preventDefault(); try { await rem({ data: { plan_id: id, title: rt, due_at: rd } }); setRd(''); refresh(); toast.success('Lembrete criado.'); } catch (e) { err(e); } }}><Input aria-label="Data do lembrete" type="datetime-local" required className="max-w-xs" value={rd} onChange={e => setRd(e.target.value)} /><Button type="submit" variant="outline">Criar lembrete</Button></form>
      <ul className="space-y-2 text-sm">{d.reminders.filter(r => r.journey_plan_id === id).map(r => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
          <span className={r.done ? 'text-muted-foreground line-through' : ''}>{r.title} · {new Date(r.due_at).toLocaleString('pt-BR')}</span>
          <span className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={async () => { const { error } = await supabase.from('reminders').update({ done: !r.done }).eq('id', r.id); if (error) return err(error); refresh(); }}>{r.done ? 'Reabrir' : 'Concluir'}</Button>
            <Confirm label="Excluir lembrete" desc="Este lembrete do plano será removido permanentemente." onYes={async () => { const { error } = await supabase.from('reminders').delete().eq('id', r.id); if (error) return err(error); toast.success('Lembrete excluído.'); refresh(); }} />
          </span>
        </li>
      ))}</ul></section>
  </div>;
}

function usePhotoUrls() {
  const d = useJourney();
  return useQuery({ queryKey: ['journey-photos', d.photos.map(p => p.id).join()], queryFn: async () => Object.fromEntries(await Promise.all(d.photos.map(async p => [p.id, (await supabase.storage.from('user-photos').createSignedUrl(p.path, 600)).data?.signedUrl ?? ''] as const))) });
}

export function Diary() {
  const d = useJourney(); const qc = useQueryClient(); const reg = useServerFn(registerJourneyPhoto); const log = useServerFn(logJourneyEvent);
  const [plan, setPlan] = useState(d.plans[0]?.id ?? ''); const [step, setStep] = useState(''); const [role, setRole] = useState<'' | 'before' | 'after'>(''); const [busy, setBusy] = useState(false);
  const urls = usePhotoUrls(); const steps = d.steps.filter(s => s.plan_id === plan); const ids = new Set(steps.map(s => s.id));
  const allowed = !!d.consent?.photo_processing;
  async function upload(file?: File) {
    if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error('Use JPG, PNG ou WebP de até 10 MB.'); return; }
    setBusy(true); const { data: u } = await supabase.auth.getUser(); const path = `${u.user?.id}/journey-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    try { const up = await supabase.storage.from('user-photos').upload(path, file); if (up.error) throw up.error; try { await reg({ data: { path, step_id: step || null, pair_role: step ? role || null : null } }); } catch (e) { await supabase.storage.from('user-photos').remove([path]); throw e; } await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success(step ? 'Registro privado salvo.' : 'Registro livre privado salvo.'); } catch (e) { err(e); } finally { setBusy(false); }
  }
  async function removePhoto(photoId: string, path: string) { try { const rm = await supabase.storage.from('user-photos').remove([path]); if (rm.error) throw rm.error; const r = await supabase.from('photos').delete().eq('id', photoId); if (r.error) throw r.error; await log({ data: { event: 'data_deleted' } }); await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success('Foto apagada.'); } catch (e) { err(e); } }
  async function removeReflection(reflectionId: string) { try { const r = await supabase.from('journey_reflections').delete().eq('id', reflectionId); if (r.error) throw r.error; await log({ data: { event: 'data_deleted' } }); await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success('Reflexão apagada.'); } catch (e) { err(e); } }
  const photos = d.photos.filter(p => p.journey_step_id && ids.has(p.journey_step_id));
  const freePhotos = d.photos.filter(p => !p.journey_step_id);
  return <div className="space-y-8">
    <CabecalhoPagina titulo="Diário visual" descricao="Fotos e reflexões são privadas. As fotos não são analisadas por IA." />
    <PlanSelect value={plan} onChange={v => { setPlan(v); setStep(''); }} />
    {!d.plans.length && (
      <EstadoVazio compacto icone={<ImageIcon className="size-5" />} titulo="Nenhum plano ainda" descricao="Crie um plano para começar seu diário visual." acoes={<Button asChild size="sm"><Link to="/jornada/objetivo">Criar plano</Link></Button>} />
    )}
    {plan && <>
      <section className="max-w-2xl space-y-3 border-y py-5"><h2 className={TITULO_ITEM}>Novo registro visual</h2>
        {!allowed && <p className="text-sm">Ative a permissão de fotos em <Link to="/settings" className="underline">Configurações</Link> para enviar registros.</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Passo (opcional)<select aria-label="Passo da foto" className={sel} value={step} onChange={e => { setStep(e.target.value); if (!e.target.value) setRole(''); }}><option value="">Sem passo · registro livre</option>{steps.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select><span className="mt-1 block text-xs text-muted-foreground">Sem passo, a foto fica em “Registros livres”.</span></label><label className="text-sm">Marcar como<select aria-label="Marcar como" className={sel} value={step ? role : ''} disabled={!step} onChange={e => setRole(e.target.value as '')}><option value="">Registro livre</option><option value="before">Antes</option><option value="after">Depois</option></select><span className="mt-1 block text-xs text-muted-foreground">{step ? 'Antes/Depois forma pares na galeria.' : 'Escolha um passo para marcar Antes/Depois.'}</span></label></div>
        <Input id="diario-foto" aria-label="Enviar foto" type="file" accept="image/jpeg,image/png,image/webp" disabled={!allowed || busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />{busy && <p role="status">Enviando…</p>}</section>
      {!photos.length && (
        <EstadoVazio compacto icone={<ImageIcon className="size-5" />} titulo="Nenhum registro com passo ainda" descricao="Escolha um passo para usar Antes/Depois." acoes={<label htmlFor="diario-foto" className="inline-flex h-8 cursor-pointer items-center rounded-full border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-secondary">Enviar primeira foto</label>} />
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{photos.map(p => <figure key={p.id} className="rounded-lg border bg-card p-2">{urls.data?.[p.id] && <img src={urls.data[p.id]} alt="Seu registro visual privado" className="aspect-square w-full rounded-md object-cover" />}<figcaption className="mt-1 text-xs text-muted-foreground">{d.steps.find(s => s.id === p.journey_step_id)?.title}{p.pair_role ? ` · ${p.pair_role === 'before' ? 'Antes' : 'Depois'}` : ''}</figcaption><div className="mt-1"><Confirm label="Excluir foto" desc="Esta foto privada será apagada permanentemente." onYes={() => removePhoto(p.id, p.path)} /></div></figure>)}</div>
      <section className="space-y-3"><h2 className={TITULO_ITEM}>Registros livres</h2><p className="text-sm text-muted-foreground">Fotos sem passo. Elas não entram em pares antes/depois e continuam privadas.</p>
        {!freePhotos.length ? <EstadoVazio compacto icone={<ImageIcon className="size-5" />} titulo="Nenhum registro livre ainda" descricao="Fotos sem passo ficam aqui e continuam privadas." acoes={<label htmlFor="diario-foto" className="inline-flex h-8 cursor-pointer items-center rounded-full border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-secondary">Enviar foto</label>} /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{freePhotos.map(p => <figure key={p.id} className="rounded-lg border bg-card p-2">{urls.data?.[p.id] && <img src={urls.data[p.id]} alt="Seu registro visual livre e privado" className="aspect-square w-full rounded-md object-cover" />}<figcaption className="mt-1 text-xs text-muted-foreground">Registro livre · {new Date(p.created_at).toLocaleDateString('pt-BR')}</figcaption><div className="mt-1"><Confirm label="Excluir foto" desc="Esta foto privada será apagada permanentemente." onYes={() => removePhoto(p.id, p.path)} /></div></figure>)}</div>}</section>
      <section className="max-w-2xl"><ReflectionForm planId={plan} stepId={step || null} /></section>
      <section className="space-y-3"><h2 className={TITULO_SECAO}>Reflexões</h2>{d.reflections.filter(r => r.plan_id === plan).map(r => <article key={r.id} className={`${CARTAO_COMPACTO} text-sm`}><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')} · {d.steps.find(s => s.id === r.step_id)?.title ?? 'Plano'}</p>{r.note && <p className="mt-2">{r.note}</p>}<p className="mt-2 text-xs text-muted-foreground">Praticidade {r.practicality ?? '—'} · Manutenção {r.maintenance ?? '—'} · Autoestima {r.self_esteem ?? '—'}{r.social_reception ? ` · ${r.social_reception}` : ''}</p>{r.emotional_note && <p className="mt-2 italic text-muted-foreground">Nota privada: {r.emotional_note}</p>}<div className="mt-2"><Confirm label="Excluir reflexão" desc="Esta reflexão será apagada permanentemente, incluindo a nota privada e a nota emocional." onYes={() => removeReflection(r.id)} /></div></article>)}</section>
    </>}
  </div>;
}

export function Gallery() {
  const d = useJourney(); const urls = usePhotoUrls();
  const bySteps = d.steps.map(s => ({ s, before: d.photos.filter(p => p.journey_step_id === s.id && p.pair_role === 'before'), after: d.photos.filter(p => p.journey_step_id === s.id && p.pair_role === 'after') })).filter(x => x.before.length || x.after.length);
  const img = (id: string, alt: string) => urls.data?.[id] ? <img src={urls.data[id]} alt={alt} className="aspect-[3/4] w-full rounded-md object-cover" /> : <div className="aspect-[3/4] rounded-md bg-secondary" />;
  return <div className="space-y-8">
    <CabecalhoPagina titulo="Antes e depois" descricao="Não é sobre ficar “melhor”. É sobre lembrar de onde você partiu e do que escolheu experimentar." />
    {!bySteps.length && (
      <EstadoVazio icone={<ImageIcon className="size-5" />} titulo="Nenhum par antes/depois ainda" descricao="Marque fotos como “Antes” e “Depois” no diário visual para formar pares." acoes={<Button asChild variant="outline"><Link to="/jornada/diario">Abrir o diário visual</Link></Button>} />
    )}
    {bySteps.map(({ s, before, after }) => <section key={s.id} className="border-t pt-6"><p className="text-xs text-accent">{STEP_CATEGORIES[s.category]} · {STEP_STATUSES[s.status]}</p><h2 className={TITULO_SECAO}>{s.title}</h2><div className="mt-4 grid max-w-2xl grid-cols-2 gap-4"><div><p className="mb-2 text-sm">Antes</p>{before[0] ? img(before[0].id, `Antes: ${s.title}`) : <p className="text-sm text-muted-foreground">Sem foto</p>}</div><div><p className="mb-2 text-sm">Depois</p>{after[0] ? img(after[0].id, `Depois: ${s.title}`) : <p className="text-sm text-muted-foreground">Sem foto</p>}</div></div></section>)}
  </div>;
}

export function Reports() {
  const d = useJourney();
  return <div className="space-y-8">
    <CabecalhoPagina titulo="Relatórios de evolução" descricao="Gere um relatório a partir de um plano. Eles destacam aprendizados, não comparações." />
    {!d.reports.length && (
      <EstadoVazio compacto icone={<LayoutList className="size-5" />} titulo="Nenhum relatório ainda" descricao="Abra um plano e gere “Meu mês em imagens” para guardar seus aprendizados." acoes={<Button asChild variant="outline"><Link to="/jornada">Ver meus planos</Link></Button>} />
    )}
    <div className="grid gap-4 md:grid-cols-2">{d.reports.map(r => <Link key={r.id} to="/jornada/relatorio/$id" params={{ id: r.id }} className={CARTAO_COMPACTO}><span className="text-xs text-accent">Gerado por IA · {r.kind === 'quarter' ? 'Trimestral' : 'Mensal'}</span><h2 className={`mt-1 ${TITULO_ITEM}`}>{(r.content as unknown as JourneyReport).title}</h2><p className="mt-2 text-xs text-muted-foreground">{d.plans.find(p => p.id === r.plan_id)?.title} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</p></Link>)}</div>
  </div>;
}

export function ReportView({ id }: { id: string }) {
  const d = useJourney(); const log = useServerFn(logJourneyEvent); const qc = useQueryClient(); const nav = useNavigate(); const [ok, setOk] = useState(false);
  const r = d.reports.find(x => x.id === id); if (!r) return <EstadoVazio compacto icone={<SearchX className="size-5" />} titulo="Relatório não encontrado" descricao="Ele pode ter sido excluído ou o link está incompleto." acoes={<Button asChild variant="outline"><Link to="/jornada/relatorios">Ver relatórios</Link></Button>} />;
  const c = r.content as unknown as JourneyReport; const planTitle = d.plans.find(p => p.id === r.plan_id)?.title ?? '';
  const block = (t: string, xs: string[]) => <section className="border-t pt-4"><h2 className={TITULO_ITEM}>{t}</h2>{xs.length ? <ul className="mt-2 list-disc pl-5 text-sm">{xs.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Ainda sem registros suficientes.</p>}</section>;
  function download() { const blob = new Blob([journeyToMarkdown(planTitle, r!.kind, c)], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatorio-jornada.md'; a.click(); log({ data: { event: 'export_requested' } }); }
  return <article className="max-w-3xl space-y-6"><p className="text-xs text-accent">Gerado por IA · {r.kind === 'quarter' ? 'Relatório trimestral' : 'Meu mês em imagens'} · {planTitle}</p><CabecalhoPagina titulo={c.title} descricao={c.summary} className="[&_p]:text-lg [&_p]:text-foreground" />
    {block('Escolhas favoritas', c.favorite_choices)}{block('Estilos que se repetem', c.repeated_styles)}{block('Cores mais usadas', c.most_used_colors)}{block('Mudanças que trouxeram confiança', c.confidence_changes)}{block('Aprendizados', c.learnings)}{block('Próximos convites', c.next_invitations)}
    <section className="space-y-3 border-t pt-4 print:hidden"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />Entendo que o arquivo sai do app. Notas emocionais e fotos não serão incluídas.</label><div className="flex flex-wrap gap-2"><Button disabled={!ok} onClick={download}>Baixar</Button><Button variant="outline" disabled={!ok} onClick={() => { log({ data: { event: 'export_requested' } }); window.print(); }}>Imprimir</Button><Confirm label="Excluir relatório" desc="Este relatório será removido." onYes={async () => { const x = await supabase.from('journey_reports').delete().eq('id', id); if (x.error) return err(x.error); await log({ data: { event: 'data_deleted' } }); await qc.invalidateQueries({ queryKey: ['journey'] }); nav({ to: '/jornada/relatorios' }); }} /></div></section>
  </article>;
}

export function Timeline() {
  const d = useJourney();
  type Ev = { at: string; label: string; detail: string };
  const ev: Ev[] = [
    ...d.plans.map(p => ({ at: p.created_at, label: 'Plano criado', detail: p.title })),
    ...d.steps.flatMap(s => ((s.status_history as { status: string; at: string }[]) ?? []).map(h => ({ at: h.at, label: STEP_STATUSES[h.status] ?? h.status, detail: s.title }))),
    ...d.photos.map(p => ({ at: p.created_at, label: 'Registro visual', detail: d.steps.find(s => s.id === p.journey_step_id)?.title ?? '' })),
    ...d.reflections.map(r => ({ at: r.created_at, label: 'Reflexão', detail: r.note?.slice(0, 80) || 'Reflexão guardada' })),
    ...d.reports.map(r => ({ at: r.created_at, label: 'Relatório', detail: (r.content as unknown as JourneyReport).title })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return <div className="space-y-8">
    <CabecalhoPagina titulo="Linha do tempo" />
    {!ev.length && <EstadoVazio compacto icone={<History className="size-5" />} titulo="Sua história começa no primeiro plano" descricao="Crie um plano e registre seus passos para ver a linha do tempo." acoes={<Button asChild size="sm"><Link to="/jornada/objetivo">Criar plano</Link></Button>} />}
    <ol className="max-w-2xl border-l-2 border-accent pl-6">{ev.map((e, i) => <li key={i} className="mb-5"><p className="text-xs text-muted-foreground">{new Date(e.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p><p className="font-semibold">{e.label}</p><p className="text-sm text-muted-foreground">{e.detail}</p></li>)}</ol></div>;
}
