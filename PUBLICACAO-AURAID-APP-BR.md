# Publicar `auraid.app.br` (Vercel + Cloudflare + Supabase)

**Estado em 13/11/2026:** o app responde em `https://aura-webapp-dusky.vercel.app` (Vercel, código de `main`) e o domínio **está registrado**, mas `auraid.app.br` e `www` **não têm registro A/CNAME** — ou seja, o domínio ainda não aponta para o app.

> ⚠️ O Stripe está em **modo LIVE** e o checkout já usa `https://auraid.app.br` como retorno. Vender antes de concluir este guia faz o cliente pagar e cair em página inexistente.

## 1. Adicionar o domínio na Vercel

1. Vercel → projeto do Aura ID → **Settings → Domains**.
2. Adicionar `auraid.app.br` (apex) e `www.auraid.app.br`.
3. A Vercel mostra os registros esperados. Use **exatamente** os valores que ela exibir:
   - apex: registro **A** → `76.76.21.21` (projetos novos podem mostrar `216.198.79.1`; vale o que o painel mostrar);
   - `www`: registro **CNAME** → `cname.vercel-dns.com`.
4. Escolha `auraid.app.br` como domínio principal e deixe `www` redirecionando para o apex (a Vercel faz o 301 automaticamente).

## 2. Criar os registros no Cloudflare

O domínio usa os nameservers da Cloudflare (`ashton.ns.cloudflare.com`, `hope.ns.cloudflare.com`).

1. Cloudflare → zona `auraid.app.br` → **DNS → Records**.
2. Criar:
   - **A** · nome `@` · IPv4 indicado pela Vercel · **Proxy status: DNS only (nuvem cinza)**;
   - **CNAME** · nome `www` · destino `cname.vercel-dns.com` · **Proxy: DNS only**.
3. Não remova os registros de e-mail (MX/SPF/DKIM) se já existirem.
4. Confira em segundos: `Resolve-DnsName auraid.app.br` deve devolver o IP da Vercel.

> Por que "DNS only": a Vercel precisa terminar o TLS para emitir o certificado do domínio. Com o proxy laranja ligado, o certificado pode falhar ou gerar loop de redirecionamento. Se quiser usar o proxy da Cloudflare depois, configure SSL/TLS **Full (strict)**.

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
