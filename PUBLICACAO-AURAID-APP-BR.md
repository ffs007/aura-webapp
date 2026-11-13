# Publicar `auraid.app.br` (Vercel + Cloudflare + Supabase)

**Estado em 13/11/2026:** o domínio **já está no ar** (Cloudflare proxied → Vercel). Hoje `https://www.auraid.app.br` responde 200 e o apex `https://auraid.app.br` faz **308 para o www**. A recomendação é inverter: apex como principal e `www` redirecionando para ele (o código publica `canonical`/`og:url` no apex).

> ⚠️ O Stripe está em **modo LIVE** e o checkout já usa `https://auraid.app.br` como retorno. Confirme que a configuração de domínio está concluída antes de divulgar o link de venda.

## 1. Ajustar o domínio principal na Vercel

1. Vercel → projeto do Aura ID → **Settings → Domains**.
2. Em `auraid.app.br`, use **Set as Primary Domain** (ou "Redirect to" invertido): apex serve o site, `www` faz 301 para o apex.
3. Se preferir manter `www` como principal, defina `VITE_APP_URL=https://www.auraid.app.br` no ambiente de produção da Vercel para o `canonical` acompanhar — mas o padrão do projeto é o apex.

Referência de registros (Cloudflare, zona `auraid.app.br`):

| Tipo | Nome | Conteúdo | Proxy |
| --- | --- | --- | --- |
| A | `@` | IP mostrado pela Vercel (ex.: `76.76.21.21`) | Proxied (funciona hoje) ou DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | idem |

## 2. Registros no Cloudflare (já criados; confira se for recriar)

O domínio usa os nameservers da Cloudflare (`ashton.ns.cloudflare.com`, `hope.ns.cloudflare.com`). Hoje o apex e o `www` resolvem para IPs da Cloudflare (proxy laranja) e chegam à Vercel.

1. Cloudflare → zona `auraid.app.br` → **DNS → Records**.
2. Se precisar recriar: **A** `@` com o IPv4 indicado pela Vercel e **CNAME** `www` → `cname.vercel-dns.com`.
3. Proxy pode ficar ligado (funciona) — se aparecer erro de certificado/loop, troque para **DNS only (nuvem cinza)** e deixe a Vercel emitir o TLS.
4. Não remova registros de e-mail (MX/SPF/DKIM).

## 3. Confirmar na Vercel

- Settings → Domains: `auraid.app.br` deve ficar **Valid Configuration**.
- Aguarde o certificado (minutos). Teste `https://auraid.app.br` com cadeado válido.
- Se ficar em "Invalid Configuration", o registro está errado ou ainda propagando (TTL da Cloudflare é automático; costuma ser rápido).

## 4. Supabase Auth (obrigatório para login e recuperação de senha)

Projeto `oyfqecigqrceijoxggqw` → Authentication → URL Configuration:

| Campo | Valor |
| --- | --- |
| `Site URL` | `https://auraid.app.br` |
| `Redirect URLs` | `https://auraid.app.br/**`, `https://www.auraid.app.br/**`, `http://localhost:8080/**` |

Depois: Authentication → Email Templates → confira que os botões usam `{{ .SiteURL }}`/`{{ .ConfirmationURL }}` (sem `localhost` fixo) e que o remetente está no domínio verificado.

## 5. E-mail transacional

- Resend → **Domains** → adicionar `auraid.app.br` e publicar SPF, DKIM e DMARC no Cloudflare.
- Supabase → Authentication → SMTP: usar o provedor configurado (chave `RESEND_API_KEY` já existe nos secrets) com remetente `nao-responda@auraid.app.br`.
- Teste um cadastro novo e um "Esqueci minha senha": o link deve chegar e voltar para o domínio novo.

## 6. Stripe (já em LIVE — só conferir)

- Dashboard Stripe → Developers → Webhooks: endpoint apontando para `https://oyfqecigqrceijoxggqw.supabase.co/functions/v1/stripe-webhook` (não depende do domínio) e eventos de `checkout.session.completed`, `customer.subscription.*`.
- Confirmar que os preços `Aura Pass` e `Plano Profissional` estão ativos no modo LIVE.
- Fazer uma compra real de teste com o próprio cartão e reembolsar em seguida (valida webhook → entitlement → liberação no app).

## 7. Smoke de produção

```powershell
cd webapp-lovable
node scripts/smoke-producao.mjs https://auraid.app.br
node scripts/smoke-producao.mjs https://aura-webapp-dusky.vercel.app
```

O script confere: home, `canonical`/`og:image` no domínio oficial, arte de compartilhamento, páginas legais, robots, 404 e headers. Sai com código 1 se algo obrigatório falhar.

## 8. Checklist final

- [ ] Registro A do apex criado (DNS only) e propagado
- [ ] CNAME do `www` criado (DNS only) e `www` redireciona para o apex
- [ ] Vercel mostra **Valid Configuration** e certificado válido
- [ ] `Site URL`/`Redirect URLs` do Supabase atualizados
- [ ] E-mail de confirmação e de recuperação chegam com domínio novo
- [ ] Resend com domínio verificado (SPF/DKIM/DMARC)
- [ ] Compra real de teste + reembolso validados
- [ ] `node scripts/smoke-producao.mjs https://auraid.app.br` sem FAIL
- [ ] Compartilhar `https://auraid.app.br` no WhatsApp/LinkedIn e conferir título/imagem

## 9. Rollback

Se algo quebrar: Vercel → Domains → remover o domínio (o app continua no `*.vercel.app`); Cloudflare → remover os registros criados. Nada no código depende do domínio estar ativo (o `VITE_APP_URL` só afeta canonical/OG).
