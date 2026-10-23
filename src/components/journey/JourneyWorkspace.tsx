import { Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Confirm } from '@/components/Confirm';
import { supabase } from '@/integrations/supabase/client';
import { JOURNEY_GOALS, STEP_CATEGORIES, STEP_STATUSES, STATUS_KEYS, journeyToMarkdown, type JourneyReport } from '@/lib/journey';
import { journeyData, saveGoal, savePlan, suggestPlan, addStep, setStepStatus, addReflection, registerJourneyPhoto, generateReport, addJourneyReminder, logJourneyEvent, deleteJourneyPlan } from '@/lib/journey.functions';

export const journeyQuery = queryOptions({ queryKey: ['journey'], queryFn: () => journeyData() });
export function useJourney() { return useSuspenseQuery(journeyQuery).data; }
const err = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Algo não deu certo. Tente novamente.');
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
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-accent">Aura ID · mudanças no seu ritmo</p><h1 className="mt-2 text-5xl">Jornada</h1><p className="mt-3 max-w-xl text-muted-foreground">Transforme sugestões em pequenos passos, registre o que viveu e lembre do que funcionou para você.</p></div><Button asChild><Link to="/jornada/objetivo">Novo plano</Link></Button></div>
    {!d.plans.length && <p className="border-t pt-8 text-muted-foreground">Nenhum plano ainda. Comece escolhendo uma intenção — não há jeito certo de começar.</p>}
    <div className="grid gap-4 md:grid-cols-2">{d.plans.map(p => { const st = d.steps.filter(s => s.plan_id === p.id); return <article key={p.id} className="rounded-lg border bg-card p-5"><p className="text-xs text-accent">{p.period === 'monthly' ? 'Mensal' : 'Trimestral'} · desde {new Date(p.starts_on + 'T12:00').toLocaleDateString('pt-BR')}</p><h2 className="mt-1 text-3xl">{p.title}</h2><p className="mt-2 text-sm text-muted-foreground">{st.length} passos · {st.filter(s => s.status === 'testing').length} em teste</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/jornada/plano/$id" params={{ id: p.id }}>Abrir plano</Link></Button><Confirm label="Excluir plano" desc="Remove passos, reflexões, fotos, relatórios e lembretes deste plano. Não pode ser desfeito." onYes={async () => { try { await del({ data: { plan_id: p.id } }); qc.invalidateQueries(); } catch (e) { err(e); } }} /></div></article>; })}</div>
  </div>;
}

type Draft = { title: string; category: string; period_index: number; package_id: string | null };
export function GoalAndPlan() {
  const d = useJourney(); const nav = useNavigate(); const qc = useQueryClient();
  const sg = useServerFn(saveGoal), sp = useServerFn(savePlan), sug = useServerFn(suggestPlan);
  const [goal, setGoal] = useState<string>(JOURNEY_GOALS[0]); const [custom, setCustom] = useState(''); const [why, setWhy] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly'); const [title, setTitle] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10)); const [steps, setSteps] = useState<Draft[]>([]); const [busy, setBusy] = useState(''); const [aiUsed, setAiUsed] = useState(false);
  const slots = period === 'monthly' ? 4 : 3; const slotName = period === 'monthly' ? 'Semana' : 'Mês';
  async function suggest() { setBusy('ai'); try { const r = await sug({ data: { goal: custom || goal, why, period } }); if (r.error || !r.plan) { toast.error(r.error ?? 'Sem sugestão.'); return; } setTitle(t => t || r.plan!.title); setSteps(r.plan.steps.map(s => ({ ...s, package_id: null }))); setAiUsed(true); } catch (e) { err(e); } finally { setBusy(''); } }
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy('save'); try { const g = await sg({ data: { goal, custom, why } }); const p = await sp({ data: { goal_id: g.id, title: title || custom || goal, period, starts_on: start, steps: steps.filter(s => s.title.trim()) } }); await qc.invalidateQueries({ queryKey: ['journey'] }); await nav({ to: '/jornada/plano/$id', params: { id: p.id } }); } catch (e) { err(e); } finally { setBusy(''); } }
  const upd = (i: number, v: Partial<Draft>) => setSteps(s => s.map((x, j) => j === i ? { ...x, ...v } : x));
  return <form onSubmit={submit} className="max-w-3xl space-y-8">
    <h1 className="text-5xl">Sua intenção de transformação</h1>
    <fieldset className="space-y-3"><legend className="text-sm">O que você deseja cultivar?</legend><div className="flex flex-wrap gap-2">{JOURNEY_GOALS.map(g => <Button type="button" key={g} size="sm" variant={goal === g ? 'default' : 'outline'} onClick={() => setGoal(g)}>{g}</Button>)}</div>
      <label className="block text-sm">Com suas palavras (opcional)<Input className="mt-2" maxLength={300} value={custom} onChange={e => setCustom(e.target.value)} /></label>
      <label className="block text-sm">Por que agora? (opcional, privado)<Textarea className="mt-2" maxLength={1000} value={why} onChange={e => setWhy(e.target.value)} /></label></fieldset>
    <div className="grid gap-5 sm:grid-cols-3"><label className="text-sm">Duração<select aria-label="Duração" className={sel} value={period} onChange={e => { setPeriod(e.target.value as 'monthly'); setSteps([]); }}><option value="monthly">Mensal (4 semanas)</option><option value="quarterly">Trimestral (3 meses)</option></select></label><label className="text-sm">Início<Input type="date" className="mt-2" value={start} onChange={e => setStart(e.target.value)} required /></label><label className="text-sm">Nome do plano<Input className="mt-2" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Meu novo ritmo" /></label></div>
    <section className="space-y-4 border-t pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-3xl">Passos</h2><div className="flex gap-2"><Button type="button" variant="outline" disabled={!!busy} onClick={suggest}>{busy === 'ai' ? 'Sugerindo…' : 'Sugerir rascunho com IA'}</Button><Button type="button" variant="ghost" onClick={() => setSteps(s => [...s, { title: '', category: 'outro', period_index: 1, package_id: null }])}>Adicionar passo</Button></div></div>
      {aiUsed && <p className="text-xs text-accent">Rascunho gerado por IA — edite à vontade.</p>}
      {steps.map((s, i) => <div key={i} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]"><Input aria-label="Passo" value={s.title} maxLength={160} onChange={e => upd(i, { title: e.target.value })} placeholder="Ex.: testar coque baixo no trabalho" /><select aria-label="Área" className="rounded-md border bg-background p-2" value={s.category} onChange={e => upd(i, { category: e.target.value })}>{Object.entries(STEP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><select aria-label={slotName} className="rounded-md border bg-background p-2" value={s.period_index} onChange={e => upd(i, { period_index: Number(e.target.value) })}>{Array.from({ length: slots }, (_, n) => <option key={n} value={n + 1}>{slotName} {n + 1}</option>)}</select><Button type="button" size="sm" variant="ghost" onClick={() => setSteps(x => x.filter((_, j) => j !== i))}>Remover</Button>
        <select aria-label="Ligar a uma sugestão salva" className="rounded-md border bg-background p-2 text-sm sm:col-span-4" value={s.package_id ?? ''} onChange={e => upd(i, { package_id: e.target.value || null })}><option value="">Sem sugestão ligada</option>{d.packages.map(p => <option key={p.id} value={p.id}>{String((p.content as Record<string, unknown>)['title'] ?? 'Sugestão')}</option>)}</select></div>)}
      {!steps.length && <p className="text-sm text-muted-foreground">Comece com um ou dois passos pequenos. Você pode adicionar outros depois.</p>}
    </section>
    <Button type="submit" disabled={!!busy}>{busy === 'save' ? 'Salvando…' : 'Criar plano'}</Button>
  </form>;
}

function Score({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return <fieldset className="text-sm"><legend>{label}</legend><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map(n => <Button type="button" size="sm" key={n} aria-label={`${label} ${n}`} variant={value === n ? 'default' : 'outline'} onClick={() => onChange(n)}>{n}</Button>)}</div></fieldset>;
}

export function ReflectionForm({ planId, stepId, onDone }: { planId: string; stepId: string | null; onDone?: () => void }) {
  const add = useServerFn(addReflection); const qc = useQueryClient();
  const empty = { note: '', emotional_note: '', practicality: null as number | null, maintenance: null as number | null, self_esteem: null as number | null, social_reception: '', include_in_report: false };
  const [f, setF] = useState(empty); const [busy, setBusy] = useState(false);
  return <form className="space-y-4 rounded-lg border bg-card p-5" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await add({ data: { plan_id: planId, step_id: stepId, ...f } }); setF(empty); await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success('Reflexão guardada.'); onDone?.(); } catch (e) { err(e); } finally { setBusy(false); } }}>
    <h3 className="text-2xl">Como foi?</h3>
    <label className="block text-sm">O que você notou<Textarea className="mt-2" maxLength={2000} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
    <div className="grid gap-4 sm:grid-cols-3"><Score label="Praticidade" value={f.practicality} onChange={v => setF({ ...f, practicality: v })} /><Score label="Manutenção leve" value={f.maintenance} onChange={v => setF({ ...f, maintenance: v })} /><Score label="Autoestima" value={f.self_esteem} onChange={v => setF({ ...f, self_esteem: v })} /></div>
    <label className="block text-sm">Recepção das pessoas (opcional)<Input className="mt-2" maxLength={500} value={f.social_reception} onChange={e => setF({ ...f, social_reception: e.target.value })} /></label>
    <label className="block text-sm">Nota emocional (privada)<Textarea className="mt-2" maxLength={2000} value={f.emotional_note} onChange={e => setF({ ...f, emotional_note: e.target.value })} /></label>
    <label className="flex items-center justify-between gap-4 text-sm"><span>Usar a nota emocional no meu relatório (nunca exportada nem compartilhada)</span><Switch aria-label="Usar nota emocional no relatório" checked={f.include_in_report} onCheckedChange={v => setF({ ...f, include_in_report: v })} /></label>
    <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar reflexão'}</Button>
  </form>;
}

export function PlanView({ id }: { id: string }) {
  const d = useJourney(); const qc = useQueryClient(); const nav = useNavigate();
  const setS = useServerFn(setStepStatus), add = useServerFn(addStep), rem = useServerFn(addJourneyReminder), gen = useServerFn(generateReport);
  const plan = d.plans.find(p => p.id === id); const [reflect, setReflect] = useState<string | null>(null);
  const [nt, setNt] = useState(''); const [nc, setNc] = useState('outro'); const [rt, setRt] = useState('Revisar meu plano'); const [rd, setRd] = useState(''); const [busy, setBusy] = useState(false);
  if (!plan) return <p>Plano não encontrado. <Link to="/jornada" className="underline">Voltar</Link></p>;
  const steps = d.steps.filter(s => s.plan_id === id); const slots = plan.period === 'monthly' ? 4 : 3; const slotName = plan.period === 'monthly' ? 'Semana' : 'Mês';
  const refresh = () => qc.invalidateQueries({ queryKey: ['journey'] });
  async function report() { setBusy(true); try { const r = await gen({ data: { plan_id: id, kind: plan!.period === 'monthly' ? 'month' : 'quarter' } }); if (r.error || !r.id) { toast.error(r.error ?? 'Sem relatório.'); return; } await refresh(); await nav({ to: '/jornada/relatorio/$id', params: { id: r.id } }); } catch (e) { err(e); } finally { setBusy(false); } }
  return <div className="space-y-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-accent">{plan.period === 'monthly' ? 'Plano mensal' : 'Plano trimestral'}</p><h1 className="mt-1 text-5xl">{plan.title}</h1></div><Button onClick={report} disabled={busy || !steps.length}>{busy ? 'Gerando…' : plan.period === 'monthly' ? 'Gerar “Meu mês em imagens”' : 'Gerar relatório do trimestre'}</Button></div>
    <section><h2 className="text-3xl">Construtor</h2><div className="mt-4 grid gap-4 md:grid-cols-4">{Array.from({ length: slots }, (_, n) => <div key={n} className="rounded-lg border p-4"><h3 className="text-xl">{slotName} {n + 1}</h3><ul className="mt-2 space-y-1 text-sm">{steps.filter(s => s.period_index === n + 1).map(s => <li key={s.id}>{s.title} <span className="text-muted-foreground">· {STEP_STATUSES[s.status]}</span></li>)}</ul></div>)}</div>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); try { await add({ data: { plan_id: id, title: nt, category: nc, period_index: Number(f.get('slot')), package_id: null } }); setNt(''); refresh(); } catch (e) { err(e); } }}><Input aria-label="Novo passo" className="max-w-xs" required maxLength={160} value={nt} onChange={e => setNt(e.target.value)} placeholder="Novo passo" /><select aria-label="Área do passo" className="rounded-md border bg-background p-2" value={nc} onChange={e => setNc(e.target.value)}>{Object.entries(STEP_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><select name="slot" aria-label="Período" className="rounded-md border bg-background p-2">{Array.from({ length: slots }, (_, n) => <option key={n} value={n + 1}>{slotName} {n + 1}</option>)}</select><Button type="submit" variant="outline">Adicionar</Button></form></section>
    <section><h2 className="text-3xl">Quadro de experimentos</h2><p className="mt-1 text-sm text-muted-foreground">Cada resultado ensina algo — inclusive o que não funcionou.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{STATUS_KEYS.map(k => <div key={k} className="rounded-lg bg-secondary/50 p-3"><h3 className="text-sm font-semibold">{STEP_STATUSES[k]}</h3><div className="mt-2 space-y-2">{steps.filter(s => s.status === k).map(s => <article key={s.id} className="rounded-md border bg-card p-3 text-sm"><p className="text-xs text-accent">{STEP_CATEGORIES[s.category]}</p><p className="mt-1">{s.title}</p>{s.package_id && <Link to="/package/$id" params={{ id: s.package_id }} className="text-xs underline">Ver sugestão</Link>}<select aria-label={`Status de ${s.title}`} className="mt-2 w-full rounded border bg-background p-1 text-xs" value={s.status} onChange={async e => { try { await setS({ data: { id: s.id, status: e.target.value } }); refresh(); } catch (er) { err(er); } }}>{STATUS_KEYS.map(x => <option key={x} value={x}>{STEP_STATUSES[x]}</option>)}</select><Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => setReflect(reflect === s.id ? null : s.id)}>Refletir</Button></article>)}</div></div>)}</div>
      {reflect && <div className="mt-5 max-w-2xl"><ReflectionForm planId={id} stepId={reflect} onDone={() => setReflect(null)} /></div>}</section>
    <section className="max-w-2xl space-y-3 border-t pt-6"><h2 className="text-3xl">Lembretes opcionais</h2><p className="text-sm text-muted-foreground">Aparecem só dentro do app. Nada é enviado por e-mail ou mensagem.</p>
      <div className="flex flex-wrap gap-2">{['Revisar meu plano', 'Preparar para evento', 'Check-in do que está em teste', 'Gerar relatório do mês'].map(t => <Button key={t} size="sm" variant={rt === t ? 'default' : 'outline'} onClick={() => setRt(t)}>{t}</Button>)}</div>
      <form className="flex flex-wrap gap-2" onSubmit={async e => { e.preventDefault(); try { await rem({ data: { plan_id: id, title: rt, due_at: rd } }); setRd(''); refresh(); toast.success('Lembrete criado.'); } catch (e) { err(e); } }}><Input aria-label="Data do lembrete" type="datetime-local" required className="max-w-xs" value={rd} onChange={e => setRd(e.target.value)} /><Button type="submit" variant="outline">Criar lembrete</Button></form>
      <ul className="text-sm">{d.reminders.filter(r => r.journey_plan_id === id).map(r => <li key={r.id}>{r.title} · {new Date(r.due_at).toLocaleString('pt-BR')}{r.done ? ' · feito' : ''}</li>)}</ul></section>
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
    try { const up = await supabase.storage.from('user-photos').upload(path, file); if (up.error) throw up.error; try { await reg({ data: { path, step_id: step || null, pair_role: role || null } }); } catch (e) { await supabase.storage.from('user-photos').remove([path]); throw e; } await qc.invalidateQueries({ queryKey: ['journey'] }); toast.success('Registro privado salvo.'); } catch (e) { err(e); } finally { setBusy(false); }
  }
  const photos = d.photos.filter(p => p.journey_step_id && ids.has(p.journey_step_id));
  return <div className="space-y-8"><h1 className="text-5xl">Diário visual</h1><p className="max-w-xl text-muted-foreground">Fotos e reflexões são privadas. As fotos não são analisadas por IA.</p>
    <PlanSelect value={plan} onChange={v => { setPlan(v); setStep(''); }} />
    {!d.plans.length && <p><Link to="/jornada/objetivo" className="underline">Crie um plano</Link> para começar seu diário.</p>}
    {plan && <>
      <section className="max-w-2xl space-y-3 border-y py-5"><h2 className="text-2xl">Novo registro visual</h2>
        {!allowed && <p className="text-sm">Ative a permissão de fotos em <Link to="/settings" className="underline">Configurações</Link> para enviar registros.</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Passo<select aria-label="Passo da foto" className={sel} value={step} onChange={e => setStep(e.target.value)}><option value="">Escolha o passo</option>{steps.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label className="text-sm">Marcar como<select aria-label="Marcar como" className={sel} value={role} onChange={e => setRole(e.target.value as '')}><option value="">Registro livre</option><option value="before">Antes</option><option value="after">Depois</option></select></label></div>
        <Input aria-label="Enviar foto" type="file" accept="image/jpeg,image/png,image/webp" disabled={!allowed || !step || busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />{busy && <p role="status">Enviando…</p>}</section>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{photos.map(p => <figure key={p.id} className="rounded-lg border bg-card p-2">{urls.data?.[p.id] && <img src={urls.data[p.id]} alt="Seu registro visual privado" className="aspect-square w-full rounded-md object-cover" />}<figcaption className="mt-1 text-xs text-muted-foreground">{d.steps.find(s => s.id === p.journey_step_id)?.title}{p.pair_role ? ` · ${p.pair_role === 'before' ? 'Antes' : 'Depois'}` : ''}</figcaption><Button size="sm" variant="ghost" className="w-full" onClick={async () => { try { await supabase.storage.from('user-photos').remove([p.path]); const r = await supabase.from('photos').delete().eq('id', p.id); if (r.error) throw r.error; await log({ data: { event: 'data_deleted' } }); qc.invalidateQueries({ queryKey: ['journey'] }); } catch (e) { err(e); } }}>Excluir</Button></figure>)}</div>
      <section className="max-w-2xl"><ReflectionForm planId={plan} stepId={step || null} /></section>
      <section className="space-y-3"><h2 className="text-3xl">Reflexões</h2>{d.reflections.filter(r => r.plan_id === plan).map(r => <article key={r.id} className="rounded-lg border bg-card p-4 text-sm"><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')} · {d.steps.find(s => s.id === r.step_id)?.title ?? 'Plano'}</p>{r.note && <p className="mt-2">{r.note}</p>}<p className="mt-2 text-xs text-muted-foreground">Praticidade {r.practicality ?? '—'} · Manutenção {r.maintenance ?? '—'} · Autoestima {r.self_esteem ?? '—'}{r.social_reception ? ` · ${r.social_reception}` : ''}</p>{r.emotional_note && <p className="mt-2 italic text-muted-foreground">Nota privada: {r.emotional_note}</p>}<Button size="sm" variant="ghost" onClick={async () => { const x = await supabase.from('journey_reflections').delete().eq('id', r.id); if (x.error) return err(x.error); await log({ data: { event: 'data_deleted' } }); qc.invalidateQueries({ queryKey: ['journey'] }); }}>Excluir</Button></article>)}</section>
    </>}
  </div>;
}

export function Gallery() {
  const d = useJourney(); const urls = usePhotoUrls();
  const bySteps = d.steps.map(s => ({ s, before: d.photos.filter(p => p.journey_step_id === s.id && p.pair_role === 'before'), after: d.photos.filter(p => p.journey_step_id === s.id && p.pair_role === 'after') })).filter(x => x.before.length || x.after.length);
  const img = (id: string, alt: string) => urls.data?.[id] ? <img src={urls.data[id]} alt={alt} className="aspect-[3/4] w-full rounded-md object-cover" /> : <div className="aspect-[3/4] rounded-md bg-secondary" />;
  return <div className="space-y-8"><h1 className="text-5xl">Antes e depois</h1><p className="max-w-xl text-muted-foreground">Não é sobre ficar “melhor”. É sobre lembrar de onde você partiu e do que escolheu experimentar.</p>
    {!bySteps.length && <p className="border-t pt-6 text-muted-foreground">Marque fotos como “Antes” e “Depois” no <Link to="/jornada/diario" className="underline">diário visual</Link> para formar pares.</p>}
    {bySteps.map(({ s, before, after }) => <section key={s.id} className="border-t pt-6"><p className="text-xs text-accent">{STEP_CATEGORIES[s.category]} · {STEP_STATUSES[s.status]}</p><h2 className="text-3xl">{s.title}</h2><div className="mt-4 grid max-w-2xl grid-cols-2 gap-4"><div><p className="mb-2 text-sm">Antes</p>{before[0] ? img(before[0].id, `Antes: ${s.title}`) : <p className="text-sm text-muted-foreground">Sem foto</p>}</div><div><p className="mb-2 text-sm">Depois</p>{after[0] ? img(after[0].id, `Depois: ${s.title}`) : <p className="text-sm text-muted-foreground">Sem foto</p>}</div></div></section>)}
  </div>;
}

export function Reports() {
  const d = useJourney();
  return <div className="space-y-8"><h1 className="text-5xl">Relatórios de evolução</h1><p className="text-muted-foreground">Gere um relatório a partir de um plano. Eles destacam aprendizados, não comparações.</p>
    {!d.reports.length && <p className="border-t pt-6 text-muted-foreground">Nenhum relatório ainda. Abra um plano e gere “Meu mês em imagens”.</p>}
    <div className="grid gap-4 md:grid-cols-2">{d.reports.map(r => <Link key={r.id} to="/jornada/relatorio/$id" params={{ id: r.id }} className="rounded-lg border bg-card p-5"><span className="text-xs text-accent">Gerado por IA · {r.kind === 'quarter' ? 'Trimestral' : 'Mensal'}</span><h2 className="mt-1 text-2xl">{(r.content as unknown as JourneyReport).title}</h2><p className="mt-2 text-xs text-muted-foreground">{d.plans.find(p => p.id === r.plan_id)?.title} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</p></Link>)}</div>
  </div>;
}

export function ReportView({ id }: { id: string }) {
  const d = useJourney(); const log = useServerFn(logJourneyEvent); const qc = useQueryClient(); const nav = useNavigate(); const [ok, setOk] = useState(false);
  const r = d.reports.find(x => x.id === id); if (!r) return <p>Relatório não encontrado.</p>;
  const c = r.content as unknown as JourneyReport; const planTitle = d.plans.find(p => p.id === r.plan_id)?.title ?? '';
  const block = (t: string, xs: string[]) => <section className="border-t pt-4"><h2 className="text-2xl">{t}</h2>{xs.length ? <ul className="mt-2 list-disc pl-5 text-sm">{xs.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Ainda sem registros suficientes.</p>}</section>;
  function download() { const blob = new Blob([journeyToMarkdown(planTitle, r!.kind, c)], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatorio-jornada.md'; a.click(); log({ data: { event: 'export_requested' } }); }
  return <article className="max-w-3xl space-y-6"><p className="text-xs text-accent">Gerado por IA · {r.kind === 'quarter' ? 'Relatório trimestral' : 'Meu mês em imagens'} · {planTitle}</p><h1 className="text-5xl">{c.title}</h1><p className="text-lg">{c.summary}</p>
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
  return <div className="space-y-8"><h1 className="text-5xl">Linha do tempo</h1>{!ev.length && <p className="text-muted-foreground">Sua história começa no primeiro plano.</p>}<ol className="max-w-2xl border-l-2 border-accent pl-6">{ev.map((e, i) => <li key={i} className="mb-5"><p className="text-xs text-muted-foreground">{new Date(e.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p><p className="font-semibold">{e.label}</p><p className="text-sm text-muted-foreground">{e.detail}</p></li>)}</ol></div>;
}
