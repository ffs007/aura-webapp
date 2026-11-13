# Monitoramento e limites — operação do beta

Este documento cobre o que já está instrumentado no app, como acompanhar e como reagir. Ele **não** substitui um APM completo (Sentry/Datadog): é o mínimo confiável para um beta pago com poucas dezenas de contas.

## 1. O que é medido hoje

| Sinal | Onde nasce | Onde ver |
| --- | --- | --- |
| Página visitada (`tela_visualizada`) | `src/lib/instrumentacao.ts` → `audit_events` | **/admin** → Funil |
| Erro no navegador (`erro_tela`, só path + mensagem truncada em 200 chars) | idem | **/admin** → Erros de tela (24 h) |
| Funil de 7 dias (perfil, onboarding, sugestão salva/aprovada, feedback, export, briefing) | `registrarEventoFunil` | **/admin** → Funil |
| Disponibilidade + banco | `GET /api/health` | monitor externo (item 3) |
| Falhas de imagem/IA | mensagens amigáveis + `core.ai_runs` (gateway) | log do provedor + mensagem no app |

Privacidade: a instrumentação guarda **apenas** caminho de rota e mensagem de erro. Nunca nome, e-mail, texto de formulário ou foto.

## 2. Painel admin

`/admin` (só administradores) agora tem:
- **Funil (7 dias)**: contagens por passo, top eventos e série diária.
- **Erros de tela (24 h)**: total, última hora, grupos distintos e lista por rota + mensagem. Quando passa de **5 erros na última hora** ou **20 no dia**, aparece um aviso de "volume acima do normal" para agir antes de convidar mais gente.

## 3. Health check e monitor externo

- Endpoint público: `GET https://www.auraid.app.br/api/health`
- Saudável: HTTP **200** + `{"ok":true,"checks":{"configuracao":true,"banco":true},...}`
- Falha: HTTP **503** (configuração ausente ou banco inalcançável).
- Expõe apenas: `ok`, `servico`, `versao`, `commit` (7 primeiros chars do SHA da Vercel), `ambiente`, `tempo` e os checks booleanos — nenhum segredo.

**Configurar um monitor gratuito (5 min):**

1. Crie uma conta no UptimeRobot (ou Better Stack / cron-job.org).
2. Monitor HTTP(s): `https://www.auraid.app.br/api/health`
3. Intervalo: **5 minutos**. Timeout: 10 s. Método: GET.
4. Palavra-chave esperada: `"ok":true` (opcional, reduz falso positivo de página de erro).
5. Alerta: e-mail seu **e** um segundo contato; se possível, webhook para WhatsApp/Telegram.

> Não monitor apenas a home: o health é que detecta banco fora ou variável de ambiente faltando após um deploy.

## 4. Limites implementados (anti-spam)

| Ação | Limite | Onde |
| --- | --- | --- |
| Feedback anônimo | 3 envios / 10 min por IP (memória do processo) | `enviarFeedback` |
| Feedback logado | 3 / 10 min **+** 15 por 24 h (contando linhas no banco) | `enviarFeedback` |
| Briefing para profissional | 10 por hora por conta | `enviarBriefing` |

Mensagem para o usuário é clara e com tempo de espera ("Tente novamente em X min"), sem detalhe técnico.

**Limitação conhecida:** o balde de curta duração vive na memória de cada instância serverless. Em pico, duas instâncias podem permitir 6 envios em vez de 3. A proteção **durável** é a borda — item 5.

## 5. Rate limit na borda (Cloudflare) — recomendado

O domínio está atrás da Cloudflare. Configure em **Security → WAF → Rate limiting rules**:

| Regra | Expressão | Limite sugerido | Ação |
| --- | --- | --- | --- |
| API sensível | `http.request.uri.path starts_with "/api/"` | 30 req/min por IP | Block por 1 min |
| Geração de imagem | `http.request.uri.path eq "/api/reference-image"` | 10 req/min por IP | Block por 5 min |
| Login/cadastro | host da aplicação e path `/auth` | 30 req/min por IP | Managed Challenge |
| Bot | `cf.client.bot` ou user-agent vazio | — | Bot Fight Mode ligado |

Ajuste para trás se sobrar bloqueio falso (o app já tem cotas de IA no gateway, então o limite aqui é só contra abuso).

## 6. Logs e deploy (Vercel)

- **Deployments → (deploy) → Functions/Logs**: erro de servidor, `console.error` (imagem/Stripe) e trace.
- **Deployments → Redeploy** do commit anterior para rollback em 1 clique.
- Cada resposta traz `x-vercel-id`; use-o para achar a requisição nos logs.
- O health mostra o `commit` em produção — confirme que é o commit esperado depois de cada deploy.

## 7. Runbook do beta

**Health 503**
1. Abrir `https://www.auraid.app.br/api/health` e ler `checks`.
2. `configuracao=false` → faltou variável de ambiente (Vercel → Settings → Environment Variables) e redeploy.
3. `banco=false` → status do Supabase; se o projeto estiver fora, avisar e pausar convites.
4. Se o app abriu normalmente e o health está 503, suspeite de deploy parcial: redeploy.

**Erros de tela subindo**
1. `/admin` → Erros de tela: identificar a rota e a mensagem de maior volume.
2. Reproduzir na rota (conta de teste), olhar console e logs do Vercel.
3. Hotfix em branch curta → PR → merge (deploy automático) e conferir se o grupo desaparece.
4. Se for erro de terceiro (IA/pagamento), verificar status do provedor antes de mexer no código.

**Abuso de feedback/briefing**
1. Cloudflare → regra de rate limit (item 5) e/ou bloquear IP.
2. `/admin` → canal de opinião: apagar/ignorar as mensagens de spam.
3. Para conta logada recorrente: revogar acesso/suspender manualmente.

**Compra sem liberação**
1. Stripe → Events: ver se `checkout.session.completed` chegou e o webhook respondeu 2xx.
2. Supabase → `core.entitlements`: linha `pass`/`pro` com `is_active=true`.
3. Se o webhook falhou, reprocessar o evento no Stripe após corrigir.

## 8. Rotina sugerida

| Frequência | Checagem |
| --- | --- |
| Contínuo | monitor batendo `/api/health` (alerta por e-mail) |
| Diário (5 min) | `/admin` → erros 24 h e funil do dia; Stripe sem pagamento pendente |
| Semanal | taxa de erro por rota, custo de IA no provedor de imagem, contas de teste para remover |
| A cada deploy | health com `commit` novo + smoke (`npm run smoke:producao`) |

## 9. Próximos passos (fora deste ciclo)

- Sentry ou similar com source maps para stack trace real (hoje só path + mensagem).
- Alerta automático por limiar de `erro_tela` (hoje é visual no admin).
- Push/e-mail de lembretes (depende de infra de notificação).
- Backups automáticos do banco (Supabase → Database → Backups) conferidos semanalmente.
