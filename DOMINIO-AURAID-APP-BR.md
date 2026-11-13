# Domínio `auraid.app.br` — o que fazer fora do código

**Status:** domínio registrado em 11/2026. O app já está preparado no código (canonical, `og:url`, `og:image` e `VITE_APP_URL`); o que falta são os passos de infraestrutura abaixo, porque dependem de painel (Registro.br, hospedagem, Supabase, Resend) e não do repositório.

> Resumo da ordem: **1) apontar DNS → 2) publicar na hospedagem → 3) ajustar Supabase Auth → 4) verificar e-mail → 5) conferir**. Fazer o item 3 antes do certificado TLS existir faz login por e-mail e recuperação de senha caírem em URL inválida.

## 1. DNS e hospedagem

1. No **Registro.br**, confira os servidores DNS do domínio (`auraid.app.br`). Se usar Lovable/Cloudflare, mantenha os nameservers apontados para o provedor.
2. Na **hospedagem** (hoje o build gera worker Cloudflare `ffs007-aura-webapp` pelo Lovable/nitro):
   - adicione o domínio `auraid.app.br` como domínio do projeto;
   - adicione `www.auraid.app.br` e defina um redirecionamento 301 para o apex (`https://auraid.app.br`) — escolha **uma** versão canônica; o código usa o apex;
   - os registros que o provedor informar (normalmente `CNAME` para o worker ou `A`/`AAAA`) devem ser criados no DNS.
3. Aguarde a emissão do certificado TLS (Let's Encrypt/Cloudflare). Sem HTTPS válido, o `Secure` dos cookies de auth e o `og:image` quebram.

**Conferir:**

```sh
dig +short auraid.app.br
dig +short www.auraid.app.br
curl -sI https://auraid.app.br | findstr /I "HTTP location content-type"
curl -sI https://www.auraid.app.br | findstr /I "HTTP location"
```

## 2. Supabase Auth (obrigatório — senão login recuperação quebram)

No projeto `oyfqecigqrceijoxggqw` → **Authentication → URL Configuration**:

| Campo | Valor |
| --- | --- |
| `Site URL` | `https://auraid.app.br` |
| `Redirect URLs` | `https://auraid.app.br/**` |
| `Redirect URLs` | `https://www.auraid.app.br/**` |
| `Redirect URLs` | `http://localhost:8080/**` (só desenvolvimento) |

Depois, revisar:

- **Authentication → Email Templates**: os botões de confirmação e de recuperação usam `{{ .SiteURL }}`/`{{ .ConfirmationURL }}`; se algum template tiver `localhost` fixo, troque pelo domínio.
- **Providers → Google**: em *Authorized redirect URIs* do Google Cloud precisa constar `https://oyfqecigqrceijoxggqw.supabase.co/auth/v1/callback` (não muda com o domínio) e a origem do site deve estar entre *Authorized JavaScript origins*: `https://auraid.app.br`.
- **Rate limits / CAPTCHA**: se houver CAPTCHA configurado com domínio de site, inclua `auraid.app.br`.

**Conferir (fluxo real):** abrir `https://auraid.app.br/auth`, pedir "Esqueci minha senha" com um e-mail de teste e confirmar que o link do e-mail volta para o domínio novo (não para `localhost` nem para URL de preview).

## 3. E-mail transacional (Resend)

A Edge Function já tem `RESEND_API_KEY` configurada; falta o domínio verificado (senão o remetente cai em spam ou é recusado).

1. No **Resend → Domains**, adicione `auraid.app.br`.
2. Publique no DNS os registros que ele mostrar:
   - `SPF` (`TXT` no apex, ex.: `v=spf1 include:amazonses.com ~all` — **um único** SPF por domínio; se já existir, mescle);
   - `DKIM` (registro `TXT`/`CNAME` por seletor);
   - `DMARC` sugerido: `_dmarc` → `v=DMARC1; p=none; rua=mailto:dmarc@auraid.app.br` (sem `p=reject` no começo).
3. Aguarde a verificação no painel (minutos a algumas horas) e envie um e-mail de teste.
4. Padronize o remetente: `nao-responda@auraid.app.br` (nome "Aura ID"). Nunca use um endereço `@gmail.com` como remetente.

**Conferir:**

```sh
nslookup -type=TXT auraid.app.br
nslookup -type=TXT _dmarc.auraid.app.br
```

Envie para um Gmail e confira "Mostrar original": deve ter `spf=pass` e `dkim=pass`.

## 4. O que já está no código (não precisa mexer no painel)

- `src/lib/site.ts`: domínio oficial + `urlAbsoluta()`; `VITE_APP_URL` sobrescreve em preview/homologação.
- `src/routes/__root.tsx`: `og:site_name`, `og:locale`, `og:image` (+ largura/altura/alt), `twitter:image`, `theme-color`.
- `src/routes/index.tsx`: `canonical` e `og:url` da home.
- `public/og-aura-id.png`: arte 1200×630 usada no compartilhamento.
- `.env.example`: `VITE_APP_URL=https://auraid.app.br`.

Cuidado: `VITE_APP_URL` entra no bundle do navegador (é valor público). Não coloque segredo ali.

## 5. Checklist final

- [ ] DNS do apex resolve e `https://auraid.app.br` abre com cadeado válido
- [ ] `www` redireciona 301 para o apex
- [ ] Supabase `Site URL` = `https://auraid.app.br` e `Redirect URLs` com `/**`
- [ ] Link de recuperação de senha volta para o domínio novo
- [ ] Login com Google funciona a partir do domínio novo
- [ ] Domínio verificado no Resend + SPF/DKIM/DMARC publicados
- [ ] E-mail de teste chega com `spf=pass` e `dkim=pass` (checar spam)
- [ ] Compartilhamento no WhatsApp/LinkedIn mostra título, descrição e imagem (`https://auraid.app.br/og-aura-id.png`)
- [ ] `VITE_APP_URL` definido no ambiente de produção do build
- [ ] Preview/homologação continua funcionando (variável apontando para a URL de preview)

## 6. Observações

- **Não** trocar `SUPABASE_URL` no app: o projeto Supabase continua no domínio `supabase.co`; só o site muda.
- Fotos privadas e imagens geradas usam URLs assinadas do storage do Supabase — não dependem do domínio do site.
- Se depois quiser `app.auraid.app.br` para o produto e `auraid.app.br` para a landing, é só repetir o item 1 e ajustar `Site URL`/`Redirect URLs` do Supabase; o código acompanha via `VITE_APP_URL`.
