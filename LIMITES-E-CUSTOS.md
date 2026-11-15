# Uso justo, custo de IA e antifraude

**Decisão (15/11/2026):** assinatura deixou de ser "ilimitada". O gateway aplica uso justo mensal/diário, anti-rajada, flag de bloqueio e um orçamento global diário. Este documento explica o porquê, os números e como operar.

## 1. Por que mudar

Cada imagem custa **US$ 0,044** (fal `flux-pro`/`kontext`). O entitlement ativo pulava qualquer cota:

| Plano | Receita aprox. | Break-even | Risco anterior |
| --- | --- | --- | --- |
| Aura Pass R$ 19,90 | US$ 3,47 | ~79 imagens/mês | 1 imagem/10 s por 30 dias = 259.200 imagens ≈ **US$ 11.400** |
| Profissional R$ 49,90 | US$ 8,71 | ~198 imagens/mês | mesma mecânica |

Além do dinheiro: bloqueio da conta de imagem do provedor, disputa no cartão e conteúdo abusivo.

## 2. Limites aplicados (fonte da verdade: `ai-gateway`)

| Limite | Aura Pass | Profissional | Onde |
| --- | --- | --- | --- |
| Imagens por mês | 50 | 150 | `PASS_IMAGES_MONTH` / `PRO_IMAGES_MONTH` |
| Imagens por dia | 12 | 30 | `PASS_IMAGES_DAY` / `PRO_IMAGES_DAY` |
| Análises de texto por mês | 400 | 1.200 | `PASS_TEXT_MONTH` / `PRO_TEXT_MONTH` |
| Intervalo entre imagens | 8 s (todos) | 8 s (todos) | `IMAGE_MIN_INTERVAL_MS` |
| Orçamento diário global | US$ 15 | US$ 15 | `IMAGE_DAILY_BUDGET_USD` |
| Bloqueio administrativo | `image_access_state.denied` | idem | tabela pública do webapp |

Códigos de erro devolvidos: `FAIR_USE_MONTH` (402), `FAIR_USE_DAY` (429), `RATE_LIMIT` (429), `BUDGET` (503), `ACCOUNT_BLOCKED` (403). A mensagem já sai em PT-BR, pronta para a tela.

Contagem: `core.ai_runs` (`status = completed`) por usuário, mês e dia em **UTC**. O grátis continua com a cota própria (2 a 5 por tarefa) e passa a respeitar também o intervalo e o orçamento.

## 3. Onde está no código

- Gateway (Supabase, compartilhado com o app mobile): `AURA-ECOSSISTEMA/supabase/functions/ai-gateway/limits.ts`, `image.ts`, `gateway.ts`. Testes: `limits.test.ts`, `image.test.ts`, `gateway.test.ts` (`npx vitest run supabase/functions` → 42 testes).
- Webapp: `src/lib/planos.ts` (espelho dos valores para exibição), `src/lib/uso.functions.ts` (uso do mês/dia), `src/components/QuotaChip.tsx` ("Aura Pass · 12/50 imagens no mês · hoje 3/12"), `src/lib/ai.server.ts` (mensagens de 402/429) e cópia de `/aura-pass`, glossário e guia.
- Admin: "Custo de IA (30 dias)" com total, hoje, imagens, top 5 contas por custo e série de 7 dias; aviso em 80% do orçamento de referência.

> `src/lib/planos.ts` é só exibição. Ao mudar os números no gateway (env), atualize o espelho para o chip não mentir.

## 4. Deploy e ajuste

```powershell
# na pasta AURA-ECOSSISTEMA
cd supabase/functions
npx vitest run              # testes do gateway (42)
cd ../..
supabase secrets list --project-ref oyfqecigqrceijoxggqw   # conferir envs atuais
supabase functions deploy ai-gateway --project-ref oyfqecigqrceijoxggqw
```

Ajustar número **sem deploy de código**:

```powershell
supabase secrets set PASS_IMAGES_MONTH=50 PASS_IMAGES_DAY=12 `
  PRO_IMAGES_MONTH=150 PRO_IMAGES_DAY=30 `
  IMAGE_MIN_INTERVAL_MS=8000 IMAGE_DAILY_BUDGET_USD=15 `
  --project-ref oyfqecigqrceijoxggqw
```

O `ai-gateway` também serve o app mobile: os limites valem para a mesma conta nos dois produtos.

**Rollback:** `supabase functions deploy ai-gateway` de uma versão anterior do repositório, ou elevar os envs temporariamente (ex.: orçamento 50) sem mexer no código.

## 5. Antifraude (Stripe Radar — regras no painel)

O Stripe **não permite criar regras de Radar por API**; as regras abaixo são aplicadas no Dashboard em **Radar → Rules**. Elas são o complemento de cobrança dos limites de uso:

1. **3D Secure para risco elevado**: regra `Block if :risk_level: = 'highest'` ou `Request 3DS if :risk_level: >= 'elevated'`.
2. **Bloquear países fora de atuação** (quando definido): `Block if :card_country: != 'BR'` (ajustar).
3. **Bloquear e-mails descartáveis** em `customer_email`: `Block if :customer_email: matches list` com os domínios usados por abuso.
4. **Listas de bloqueio** (`Radar → Lists`): adicionar cartão, e-mail ou IP quando houver disputa/abuso comprovado.
5. Ativar **Radar for Fraud Teams** se o volume crescer; revisar disputas semanalmente.

No gateway, além dos limites, a conta pode ser bloqueada sem perder dados: inserir linha em `image_access_state` com `denied = true` e `message` explicando o motivo. O gateway passa a devolver 403 `ACCOUNT_BLOCKED` antes de qualquer geração.

## 6. Operação

- **Diário:** `/admin` → Custo de IA (hoje × US$ 15), Erros de tela 24 h e funil.
- **Semanal:** top contas por custo, disputas no Stripe, ajustar limites se o beta pedir.
- **Quando o orçamento estoura:** imagens pausam com 503 amigável; até o próximo dia UTC não há cobrança nova. Verifique top 5 no admin e bloqueie conta se for abuso.
- **Quando um usuário reclama do limite:** o chip mostra o uso; mês vira no dia 1 (UTC) e o dia vira à meia-noite UTC. Avaliar upgrade para o Profissional ou liberar exceção pontual via envs.

## 7. Perguntas frequentes

**"Não posso mais vender ilimitado?"** Pode, mas com preço condizente: 1.000 imagens/mês custam ~US$ 44. O uso justo é o que mantém o Pass lucrativo em R$ 19,90.

**"E se a pessoa realmente precisar de mais?"** Upgrade para o Profissional, ou pacote extra (não implementado) — nesse caso, criar preço no Stripe e liberar por `entitlements` específico.

**"O limite é contornável chamando o gateway direto?"** Não para o teto: a contagem é feita no próprio gateway, que é o único caminho até o provedor.
