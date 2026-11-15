import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { usoQuota, LIMITES, type UsoQuotaResposta } from '@/lib/uso.functions';
import { passStatus } from '@/lib/stripe.functions';
import { resumoUsoImagens } from '@/lib/planos';

/**
 * Chip de uso: para assinantes mostra o uso justo do mês/dia; para quem é grátis
 * mostra "Restam X de N". Atualiza a cada geração via evento 'aura:quota'.
 */
export function QuotaChip({ tasks, label }: { tasks: string[]; label?: string }) {
  const uso = useServerFn(usoQuota), status = useServerFn(passStatus);
  const [dados, setDados] = useState<(UsoQuotaResposta & { pass: boolean }) | null>(null);

  const carregar = async () => {
    try {
      const [u, s] = await Promise.all([uso(), status()]);
      setDados({ ...u, pass: s.active });
    } catch {
      setDados({ contagem: {}, plano: null, imagensMes: 0, imagensHoje: 0, pass: false });
    }
  };
  useEffect(() => { void carregar(); window.addEventListener('aura:quota', carregar); return () => window.removeEventListener('aura:quota', carregar); }, []);

  if (!dados) return null;

  if (dados.plano) {
    return (
      <p className="text-xs text-accent">
        ✨ {resumoUsoImagens(dados.plano, { imagensMes: dados.imagensMes, imagensHoje: dados.imagensHoje })} ·{' '}
        <Link to="/aura-pass" className="underline">gerenciar</Link>
      </p>
    );
  }

  if (dados.pass) return <p className="text-xs text-accent">✨ Aura Pass ativo — gerações liberadas · <Link to="/aura-pass" className="underline">gerenciar</Link></p>;

  const linhas = tasks.filter((t) => LIMITES[t] !== undefined).map((t) => {
    const limite = LIMITES[t] ?? 0;
    const usadas = dados.contagem[t] ?? 0;
    const restam = Math.max(0, limite - usadas);
    return restam > 0
      ? `${label ? label + ': ' : ''}${restam === 1 ? 'resta' : 'restam'} ${restam} de ${limite} grátis`
      : `${label ? label + ': ' : ''}grátis esgotado — ✦ Pass libera`;
  }).filter(Boolean);
  if (!linhas.length) return null;
  return <p className="text-xs text-muted-foreground">{linhas.join(' · ')} · <Link to="/aura-pass" className="underline text-accent">✦ Aura Pass</Link></p>;
}
