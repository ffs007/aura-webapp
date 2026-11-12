import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { MessageSquareHeart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { listarFeedbackAdmin } from '@/lib/feedback.functions';
import { CarregandoInline, EstadoErro, EstadoVazio } from '@/components/estados';
import { CARTAO_COMPACTO, META, TITULO_SECAO } from '@/lib/design';

/** Estilos por tipo usando as variantes do Badge (tokens) — sem cores soltas. */
const ESTILO: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  critica: { variant: 'destructive' },
  sugestao: { variant: 'secondary' },
  duvida: { variant: 'outline' },
  elogio: { variant: 'outline', className: 'border-sage/60 bg-sage/15 text-foreground' },
};
const ROTULO: Record<string, string> = { critica: '🙃 Crítica', sugestao: '💡 Sugestão', duvida: '❓ Dúvida', elogio: '💛 Elogio' };

/** Painel admin: tudo que chegou pelo canal de opinião — crítica é ouro. */
export function FeedbackAdmin() {
  const listar = useServerFn(listarFeedbackAdmin);
  const q = useQuery({ queryKey: ['feedback'], queryFn: () => listar() });

  return (
    <section className="space-y-3">
      <h2 className={TITULO_SECAO}>💬 Feedback ({q.data?.length ?? 0})</h2>
      <p className="text-sm text-muted-foreground">Críticas, sugestões, dúvidas e elogios — anônimos ou identificados.</p>
      {q.isLoading && <CarregandoInline />}
      {q.error && (
        <EstadoErro
          titulo="Não foi possível carregar o feedback"
          onTentarNovamente={() => void q.refetch()}
          recarregando={q.isFetching}
          acoes={<p className="text-xs text-muted-foreground">Os envios continuam guardados; isto é só a lista do painel.</p>}
        />
      )}
      {q.data?.length === 0 && (
        <EstadoVazio
          compacto
          icone={<MessageSquareHeart className="size-5" />}
          titulo="Nada ainda"
          descricao="O botão 💬 Opinião está no rodapé de todas as páginas — o que chegar aparece aqui."
          acoes={<a href="/" className="text-sm underline underline-offset-4">Ver o app com o botão de opinião</a>}
        />
      )}
      <ul className="space-y-2">
        {q.data?.map((f) => {
          const estilo = ESTILO[f.tipo] ?? { variant: 'outline' as const };
          return (
            <li key={f.id} className={`${CARTAO_COMPACTO} space-y-1`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={estilo.variant} className={`px-2 py-0.5 text-xs ${estilo.className ?? ''}`}>{ROTULO[f.tipo] ?? f.tipo}</Badge>
                <span className={META}>
                  {new Date(f.created_at).toLocaleString('pt-BR')}
                  {f.rota ? ` · ${f.rota}` : ''}
                  {f.contato ? ` · ${f.contato}` : ''}
                  {f.user_id ? ' · logado' : ' · anônimo'}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{f.texto}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
