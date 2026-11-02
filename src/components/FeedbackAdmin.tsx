import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listarFeedbackAdmin } from '@/lib/feedback.functions';

const CORES: Record<string, string> = {
  critica: 'bg-red-500/10 text-red-700',
  sugestao: 'bg-blue-500/10 text-blue-700',
  duvida: 'bg-amber-500/10 text-amber-700',
  elogio: 'bg-emerald-500/10 text-emerald-700',
};
const ROTULO: Record<string, string> = { critica: '🙃 Crítica', sugestao: '💡 Sugestão', duvida: '❓ Dúvida', elogio: '💛 Elogio' };

/** Painel admin: tudo que chegou pelo canal de opinião — crítica é ouro. */
export function FeedbackAdmin() {
  const listar = useServerFn(listarFeedbackAdmin);
  const q = useQuery({ queryKey: ['feedback'], queryFn: () => listar() });

  return (
    <section className="space-y-3">
      <h2 className="text-3xl">💬 Feedback ({q.data?.length ?? 0})</h2>
      <p className="text-sm text-muted-foreground">Críticas, sugestões, dúvidas e elogios — anônimos ou identificados.</p>
      {q.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {q.error && <p className="text-sm text-destructive">{q.error instanceof Error ? q.error.message : 'Erro ao carregar.'}</p>}
      {q.data?.length === 0 && <p className="text-sm text-muted-foreground">Nada ainda — o botão 💬 Opinião está no rodapé de todas as páginas.</p>}
      <ul className="space-y-2">
        {q.data?.map((f) => (
          <li key={f.id} className="space-y-1 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${CORES[f.tipo] ?? 'bg-secondary'}`}>{ROTULO[f.tipo] ?? f.tipo}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(f.created_at).toLocaleString('pt-BR')}
                {f.rota ? ` · ${f.rota}` : ''}
                {f.contato ? ` · ${f.contato}` : ''}
                {f.user_id ? ' · logado' : ' · anônimo'}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{f.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
