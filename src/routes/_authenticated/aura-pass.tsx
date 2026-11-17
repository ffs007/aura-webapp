import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Aviso, Cartao } from '@/components/estados';
import { TITULO_ITEM, TITULO_SECAO } from '@/lib/design';
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
      setErr('Não foi possível iniciar o pagamento. Tente de novo.');
      setBusy(false);
    }
  };
  const gerenciar = async () => {
    setBusy(true); setErr('');
    try {
      const url = await portalUrl({ data: { app_url: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      setErr('Não foi possível abrir o gerenciamento da assinatura. Tente de novo.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Herói com a faixa de identidade: brilho dourado do Pass sobre vinho. */}
      <header className="relative overflow-hidden rounded-2xl border">
        <img src="/banners/banner-pass.svg" alt="" aria-hidden loading="lazy" className="h-40 w-full object-cover sm:h-48" />
        <div className="absolute inset-0 flex flex-col justify-center gap-1 p-5 sm:p-8">
          <span className="text-xs uppercase tracking-widest text-[#E8CA79]">Assinatura</span>
          <h1 className="font-display text-4xl text-[#FAF5EE] md:text-5xl">Aura <em>Pass</em></h1>
          <p className="max-w-[16rem] text-sm text-[#F3E3D8] sm:max-w-xs">Mais imagens, sem trava — no app e no site, com a mesma conta.</p>
        </div>
      </header>

      {checkout === 'success' && (
        <Aviso tom="sucesso">
          Recebemos seu pagamento! Estamos ativando seu Pass — deve aparecer como ativo aqui em alguns segundos.
        </Aviso>
      )}
      {checkout === 'cancel' && (
        <Aviso tom="neutro">A assinatura não foi concluída. Você pode tentar quando quiser.</Aviso>
      )}

      {status?.active ? (
        <Cartao className="space-y-4">
          <p className={TITULO_ITEM}>✨ Aura Pass ativo</p>
          <dl className="space-y-1 text-sm text-muted-foreground">
            {status.purchased_at && <div>Ativo desde {new Date(status.purchased_at).toLocaleDateString('pt-BR')}</div>}
            <div>{status.expires_at ? `Válido até ${new Date(status.expires_at).toLocaleDateString('pt-BR')}` : 'Renovação automática mensal · cancele quando quiser'}</div>
          </dl>
          <Button onClick={gerenciar} disabled={busy}>Gerenciar assinatura</Button>
        </Cartao>
      ) : (
        <Cartao className="space-y-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={TITULO_SECAO}>Uso justo, sem sustos</h2>
            <p className="text-2xl font-semibold">{AURA_PASS_PRECO}</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li>✦ Uso justo: <strong>50 imagens por mês</strong> e até 12 por dia — o limite renova todo mês</li>
            <li>✦ Interpretação, geração e verificação de tatuagens e looks sem interrupção</li>
            <li>✦ Vale no site e no app com a mesma conta</li>
            <li>✦ Cancele quando quiser, sem multa</li>
          </ul>
          <p className="text-xs text-muted-foreground">Grátis para começar: 5 imagens por conta. Pix ou cartão de crédito, pagamento processado pelo Stripe.</p>
          <Button onClick={assinar} disabled={busy} size="lg">{busy ? 'Abrindo pagamento…' : `Assinar · ${AURA_PASS_PRECO}`}</Button>
        </Cartao>
      )}

      {err && <div role="alert"><Aviso tom="atencao">{err}</Aviso></div>}
      <p className="text-sm text-muted-foreground"><Link to="/settings" className="underline">Voltar para Configurações</Link></p>
    </div>
  );
}
