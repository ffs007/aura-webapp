# Como verificar os bloqueios de lançamento

Scripts prontos para rodar **quando você tiver as chaves**. Eles não substituem o beta com 5 pessoas, mas respondem "o ambiente está pronto?" em minutos, sem abrir o app no olho.

- `webapp-lovable/scripts/verificar-lancamento.mjs` — verificador principal (Node 18+, sem dependências).
- `webapp-lovable/package.json` → atalho `npm run verificar:lancamento`.

> **Nada de segredo é impresso:** o script mostra só presença, host e prefixo mascarado. As chaves são lidas de `.env` / `.env.local` / `.env.aura-id` (nunca versionados) ou de variáveis de ambiente.

---

## 1. Rodar o verificador

```powershell
cd webapp-lovable
npm run verificar:lancamento
```

Para incluir os testes que só fazem sentido com SMTP e deploy no ar:

```powershell
# SMTP: pede recuperação de senha para este e-mail (você confere a caixa)
$env:SMTP_TEST_EMAIL="seu@email.com"

# headers/CSP/HSTS do domínio publicado
$env:APP_URL="https://seu-dominio.com"

npm run verificar:lancamento
```

Opções:

| Comando | O que faz |
|---|---|
| `npm run verificar:lancamento` | Fases 1–8 (somente leitura) |
| `... --escrita` | Inclui upload + remoção de um arquivo dummy no bucket `user-photos` |
| `... --criar-conta-teste` | Cria conta descartável + dados/storage e imprime o passo manual de exclusão |
| `... --verificar-exclusao` | Depois de excluir pela UI, confere Auth + tabelas + storage |
| `... --limpar` | Lista contas `teste.*` (dry-run) |
| `... --limpar --sim` | Apaga as contas `teste.*` e as pastas de storage (irreversível) |
| `... --json scripts/resultado.json` | Salva o resultado em JSON |
| `... --sem-cores` | Saída sem cores (bom para log) |

O script termina com **exit code 1** se houver algum `FAIL` — dá para usar em CI/deploy gate.

---

## 2. O que cada fase cobre

| Fase | Verifica | Bloqueio correspondente |
|---|---|---|
| 1 | Variáveis de ambiente obrigatórias, chave secreta fora de `VITE_`, `.env.example` | build/execução |
| 2 | Projeto Supabase do código × `.env` × `config.toml` | deploy no projeto errado |
| 3 | Auth/health/settings acessíveis, confirmação de e-mail, REST | base do app |
| 4 | **Service role**: Admin API, REST sem RLS, buckets `user-photos` e `studio-media` (+ escrita com `--escrita`) | exclusão de conta/LGPD, admin, funil, vitrine |
| 5 | **SMTP**: pedido de recuperação de senha (`/auth/v1/recover`) | confirmação/recuperação |
| 6 | **Edge Functions** `stripe-checkout` e `ai-gateway` existem (sonda sem autenticação) + `core.entitlements` | pagamento e IA |
| 7 | **Headers** de produção: `nosniff`, `Referrer-Policy`, CSP, HSTS | segurança |
| 8 | **Dados de teste** `teste.*` / `@example.com` | go-live limpo |

### O que é automático e o que é manual

| Verificação | Automático? | Como fechar |
|---|---|---|
| Chaves/service role/buckets | ✅ | fase 4 |
| Edge Functions existem | ✅ (sonda 401) | fase 6 |
| **Entrega real de e-mail** | ❌ | fase 5 dispara; **você confere a caixa** em até 2 min |
| **Checkout/cancelamento Stripe** | ❌ | abrir `/aura-pass` e concluir um checkout em **modo de teste**; depois conferir no Stripe |
| **Exclusão de conta pela UI** | semi | `--criar-conta-teste` + 2 min na UI + `--verificar-exclusao` (seção 3) |
| Headers/CSP/HSTS | ✅ (com `APP_URL`) | fase 7 |

---

## 3. Exclusão de conta em conta descartável (o teste que importa)

### Passo 1 — criar a conta de teste com dados

```powershell
cd webapp-lovable
npm run verificar:lancamento -- --criar-conta-teste
```

O script cria via Admin API:

- usuário descartável `teste.exclusao.<timestamp>@example.com` (senha impressa na tela);
- linhas em `consents`, `visual_profiles`, `packages`, `reminders` e `collections`;
- um arquivo em `user-photos/<id>/…`;
- registra id/e-mail/senha em `scripts/.verificacao-conta.json` (ignorado pelo Git).

### Passo 2 — excluir pela interface (2 minutos)

1. Abra `${APP_URL}/auth` e entre com o e-mail/senha impressos.
2. Vá em **Configurações → Seus dados → Excluir minha conta** → confirmar.
3. Aguarde o toast/estado "Excluindo conta…".

> Esse passo precisa ser humano de propósito: o alvo é o **fluxo real** (`deleteAccount`), que mistura limpeza de tabelas, storage e Auth — não a API do Supabase.

### Passo 3 — verificar o que sobrou

```powershell
npm run verificar:lancamento -- --verificar-exclusao
```

Saída esperada:

```text
[PASS] 10.1  Conta removida do Auth
[PASS] 10.2  Nenhuma linha restante nas tabelas verificadas
[PASS] 10.3  Storage da conta vazio
[PASS] 10.5  EXCLUSÃO COMPLETA
```

Se falhar:

| Sintoma | Significado | O que fazer |
|---|---|---|
| 10.1 FAIL (conta ainda existe) | o `deleteAccount` falhou **antes** de apagar o login (por design: melhor deixar entrar e tentar de novo) | ver logs do worker; conferir `SUPABASE_SERVICE_ROLE_KEY` e tabela que falhou |
| 10.2 WARN (linhas restantes) | o fluxo não limpou alguma tabela | completar a lista em `deleteAccount` (`src/lib/aura.functions.ts`) |
| 10.3 WARN (storage restante) | bucket/policy ou listagem falhou | conferir policies de `user-photos`/`studio-media` e service role |

Ao fechar, o script apaga `scripts/.verificacao-conta.json` e libera o gate de exclusão.

---

## 4. Limpar dados de teste antes do go-live

```powershell
# 1) dry-run: só lista
npm run verificar:lancamento -- --limpar

# 2) apagar de verdade (irreversível)
npm run verificar:lancamento -- --limpar --sim
```

O script lista usuários `teste.*` / `@example.com` via Admin API, apaga as pastas deles em `user-photos` e `studio-media` e remove o usuário. **Confira a lista antes do `--sim`** para não apagar conta real com e-mail parecido.

---

## 5. Critérios para considerar "pode lançar"

Marque os quatro:

- [ ] `npm run verificar:lancamento` com **0 FAIL** (com `SMTP_TEST_EMAIL` e `APP_URL` definidos)
- [ ] E-mail de recuperação **recebido** (fase 5 manual)
- [ ] Checkout em **modo de teste** concluído e cancelamento validado (fase 6 manual)
- [ ] `--criar-conta-teste` + UI + `--verificar-exclusao` com **EXCLUSÃO COMPLETA**

Depois disso, ainda vale o beta de 5 pessoas (roteiro no [RELATORIO-LANCAMENTO-AURA-ID.md](RELATORIO-LANCAMENTO-AURA-ID.md#91-roteiro-de-beta-20-min-por-pessoa)).

---

## 6. Problemas comuns e correção

| Saída | Causa provável | Correção |
|---|---|---|
| `1.3 SUPABASE_SERVICE_ROLE_KEY ausente` | chave só no dashboard, não no ambiente que roda o script | colocar no `.env` local e nas variáveis da hospedagem |
| `2.3 config.toml aponta para projeto antigo` | `supabase/config.toml` com `project_id` antigo | atualizar/remover o arquivo ou o projeto |
| `4.1 Admin API recusou a chave` | chave de outro projeto ou publishable no lugar da service role | conferir ref do projeto e a chave `service_role` |
| `4.3/4.4 bucket inacessível` | bucket não criado | criar `user-photos` (privado) e `studio-media` (público) no Supabase Storage |
| `6.1/6.2 Edge Function não encontrada` | função não deployada | publicar `stripe-checkout`/`ai-gateway` no projeto correto |
| `6.3 core.entitlements inacessível` | schema `core` ausente | criar/validar schema e RLS de assinatura |
| `7.2 nosniff ausente` | deploy anterior à mudança do `server.ts` | republicar o app |
| `7.4 CSP ausente` / `7.5 HSTS ausente` | não configurado no domínio | definir CSP e HSTS no Cloudflare/hospedagem |

---

## 7. Notas honestas (estado em 10/11/2026)

- Rodando localmente **sem** service role/chaves, o resultado esperado é: **12 PASS · 1 FAIL · 4 WARN · 5 SKIP** — o FAIL é exatamente o bloqueio de service role. O WARN de `mailer_autoconfirm=true` é uma configuração atual do projeto Supabase: confirmação automática é aceitável no beta, mas para público vale exigir confirmação (com SMTP funcionando).
- `stripe-checkout` e `ai-gateway` **já respondem** no projeto atual (sonda 401 sem token), ou seja, existem — mas a validação de preço/webhook/cancelamento continua manual.
- O script **não** cria dados sem `--criar-conta-teste`/`--escrita`, e **não** apaga nada sem `--limpar --sim`.
- Nunca rode `--limpar --sim` em CI nem com contas reais. O `scripts/.verificacao-conta.json` fica fora do Git.
