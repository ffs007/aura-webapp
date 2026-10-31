import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { passStatus, portalUrl, createCheckout, AURA_PASS_PRECO, type PassStatus } from '@/lib/stripe.functions';

export const Route = createFileRoute('/_authenticated/aura-pass')({
  validateSearch: z.object({ checkout: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Aura Pass · Aura ID' }] }),
  component: Page,
});

function Page() {
  const checkout = Route.useSearch().checkout;
  const [status, setStatus] = useState<PassStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const carregar = async () => {
    try { setStatus(await passStatus()); } catch { setStatus({ active: false, purchased_at: null, expires_at: null }); }
  };
  useEffect(() => { void carregar(); }, []);
  useEffect(() => {
    if (checkout !== 'success') return;
    const tentativas = [3000, 4000, 5000].map((ms) => setTimeout(() => void carregar(), ms));
    return () => tentativas.forEach(clearTimeout);
  }, [checkout]);

  const assinar = async () => {
    setBusy(true); setErr('');
    try {
      const url = await createCheckout({ data: { app_url: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento.');
      setBusy(false);
    }
  };
  const gerenciar = async () => {
    setBusy(true); setErr('');
    try {
      const url = await portalUrl({ data: { app_url: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível abrir o gerenciamento.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <span className="text-sm text-accent">Assinatura</span>
        <h1 className="mt-2 text-5xl">Aura <em>Pass</em></h1>
        <p className="mt-3 text-muted-foreground">Mais imagens, sem trava — no app e no site, com a mesma conta.</p>
      </div>

      {checkout === 'success' && (
        <p className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
          Recebemos seu pagamento! Estamos ativando seu Pass — deve aparecer como ativo aqui em alguns segundos.
        </p>
      )}
      {checkout === 'cancel' && (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">A assinatura não foi concluída. Você pode tentar quando quiser.</p>
      )}

      {status?.active ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <p className="text-2xl">✨ Aura Pass ativo</p>
          <dl className="space-y-1 text-sm text-muted-foreground">
            {status.purchased_at && <div>Ativo desde {new Date(status.purchased_at).toLocaleDateString('pt-BR')}</div>}
            <div>{status.expires_at ? `Válido até ${new Date(status.expires_at).toLocaleDateString('pt-BR')}` : 'Renovação automática mensal · cancele quando quiser'}</div>
          </dl>
          <Button onClick={gerenciar} disabled={busy}>Gerenciar assinatura</Button>
        </section>
      ) : (
        <section className="space-y-5 rounded-lg border bg-card p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-3xl">Tudo liberado</h2>
            <p className="text-2xl font-semibold">{AURA_PASS_PRECO}</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li>✦ Gerações de imagem sem limite justo de teste — as 5 gratuitas viram passado</li>
            <li>✦ Interpretação, geração e verificação de tatuagens e looks sem interrupção</li>
            <li>✦ Vale no site e no app com a mesma conta</li>
            <li>✦ Cancele quando quiser, sem multa</li>
          </ul>
          <p className="text-xs text-muted-foreground">Grátis para começar: 5 imagens por conta. Pix ou cartão de crédito, pagamento processado pelo Stripe.</p>
          <Button onClick={assinar} disabled={busy} size="lg">{busy ? 'Abrindo pagamento…' : `Assinar · ${AURA_PASS_PRECO}`}</Button>
        </section>
      )}

      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <p className="text-sm text-muted-foreground"><Link to="/settings" className="underline">Voltar para Configurações</Link></p>
    </div>
  );
}
