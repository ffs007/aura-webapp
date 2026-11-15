# Roteiro do teste de pagamento real (30 min, com reembolso)

Objetivo: provar, com **um pagamento real**, que `checkout → webhook → entitlement → app libera` funciona — e que **cancelar revoga**. Depois reembolsar. Custo final: zero (reembolso).

> **Antes de começar:** existe uma correção do webhook aguardando deploy (o código antigo falhava ao sincronizar `customer.subscription.updated/deleted`). Rode o deploy descrito em `LIMITES-E-CUSTOS.md §4` **ou** peça para eu publicar quando o acesso voltar. O passo de compra já funciona; o de **cancelamento** só fica confiável depois desse deploy.

## 0. Verificação de infraestrutura (sem cobrar)

```powershell
cd webapp-lovable
$env:AURA_TESTE_EMAIL="sua-conta@exemplo.com"; $env:AURA_TESTE_SENHA="sua-senha"
node scripts/verificar-pagamento.mjs
```

Esperado: 4 PASS — health, webhook recusando payload sem assinatura (400), checkout `pass` e `pro` criando sessão **LIVE**.

## 1. Compra real (5 min)

1. Abra `https://www.auraid.app.br`, entre na sua conta.
2. Vá em **✦ Aura Pass** e clique em **Assinar**.
3. Pague com **seu cartão** (o Stripe está em modo LIVE). Anote a hora exata.
4. Você deve voltar para `/aura-pass?checkout=success` com o cartão ativo na tela.

## 2. Conferir no Stripe (5 min)

No Dashboard → **Payments**:
- existe um pagamento `succeeded` no valor do plano, com o seu e-mail;
- em **Developers → Events**, o evento `checkout.session.completed` foi **entregue com 2xx**.

Se o evento falhou: copie a resposta, verifique `STRIPE_WEBHOOK_SECRET` e a URL do endpoint (deve ser `https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/stripe-webhook`). Reprocessar o evento pelo Dashboard resolve sem nova cobrança.

## 3. Conferir no banco (2 min)

Supabase → SQL Editor:

```sql
select user_id, entitlement_id, is_active, platform, environment,
       stripe_customer_id, stripe_subscription_id, updated_at
from core.entitlements
where user_id = (select id from auth.users where email = 'seu-email@exemplo.com');

select event_id, type, created_at
from core.stripe_events
order by created_at desc limit 5;
```

Esperado: linha `pass` (ou `pro`) com `is_active = true`, `platform = 'web'`, cliente e assinatura preenchidos; evento registrado em `stripe_events`.

## 4. Conferir no app (3 min)

- `/aura-pass` mostra **assinatura ativa** e o botão **Gerenciar assinatura** (portal).
- Em qualquer tela de geração, o chip mostra `Aura Pass · X/50 imagens no mês · hoje X/12`.
- Gere **uma imagem** e confirme que **não** aparece "grátis esgotado" — o limite agora é o uso justo.
- `/admin` → **Custo de IA**: aparece o custo da geração de hoje.

## 5. Cancelar (5 min)

1. `/aura-pass` → **Gerenciar assinatura** → **Cancelar assinatura** no portal do Stripe.
2. No Stripe, o evento `customer.subscription.deleted` deve ser entregue com 2xx.
3. No banco, `core.entitlements.is_active` deve virar `false`.
4. No app, `/aura-pass` volta a oferecer assinatura e o chip volta a mostrar grátis.

> Se o item 3 não acontecer, é o bug do webhook antigo: o deploy da correção resolve. Até lá, **não venda**: cancelamento não revogaria o acesso.

## 6. Reembolso (5 min)

Stripe → **Payments** → o pagamento → **Refund** → reembolso total. Confirme no app do cartão (5–10 dias úteis). Registre o ID do reembolso no seu controle.

## 7. Limpeza

- Se a conta usada for descartável: excluir em **Configurações → Excluir minha conta** (valida o fluxo LGPD de uma vez).
- Se for sua conta principal: apenas confirme que a assinatura está cancelada e reembolsada.

## Critérios de aprovação

- [ ] Checkout cria sessão LIVE para `pass` e `pro`
- [ ] Pagamento `succeeded` e webhook 2xx
- [ ] `core.entitlements` ativo e app liberado
- [ ] Chip mostra uso justo (não "grátis")
- [ ] Cancelamento revoga (`is_active = false`) e app volta ao grátis
- [ ] Reembolso total processado

## Se falhar

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Checkout 502 | preço/ID inválido ou Stripe fora | conferir `STRIPE_PRICE_ID`/`STRIPE_PRICE_ID_PRO` nos secrets |
| Pagamento ok, app não libera | webhook não entregue ou segredo errado | Stripe → Events; conferir `STRIPE_WEBHOOK_SECRET` |
| App libera, cancelamento não revoga | bug do webhook antigo | publicar a correção (`stripe-webhook`) |
| Portal 404 | entitlement sem `stripe_customer_id` | conferir se o evento `checkout.session.completed` gravou o cliente |
