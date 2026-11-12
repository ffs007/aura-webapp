# 🚀 Relatório consolidado de lançamento — Aura ID

**Data:** 10/11/2026 · **Base:** `webapp-lovable` · **Escopo:** consolidação das Etapas 0, 1 e 2 + prontidão de lançamento (produto, qualidade, ambiente, segurança, operação).
**Fontes:** código em `src/`, scripts `.e2e/`, [RELATORIO-TESTE-PROFUNDO.md](RELATORIO-TESTE-PROFUNDO.md), [ETAPA-0-EXECUCAO.md](ETAPA-0-EXECUCAO.md), [ETAPA-1-ONDA-1.md](ETAPA-1-ONDA-1.md) … [ETAPA-1-ONDA-3.md](ETAPA-1-ONDA-3.md), [ETAPA-2-ONDA-1.md](ETAPA-2-ONDA-1.md) … [ETAPA-2-ONDA-3.md](ETAPA-2-ONDA-3.md), [GUIA-DE-ESTILO-AURA.md](GUIA-DE-ESTILO-AURA.md), `crawl-results.json` e levantamento de ambiente/segurança feito nesta rodada.

---

## 0. Veredito em 10 linhas

1. **O produto está pronto para um beta fechado e útil**, não para lançamento público amplo.
2. **4 áreas estão plenamente prontas**, **18 prontas com ressalva** e **2 bloqueadas por ambiente** (Aura Pass e painel de funil).
3. A experiência está consistente: um `h1` por tela, mesmos estados de carregando/vazio/erro em todo o app, contraste AA medido, foco visível, microcopy neutra.
4. A confiança foi atacada de frente: erros honestos, retry, confirmação de exclusões, retomada de rascunho, nenhum "falso sucesso" conhecido.
5. **5 bloqueios reais** impedem o lançamento público: service role, SMTP, Stripe, schema/RLS não reproduzível e segurança de sessão/headers.
6. Beta fechado só é seguro **depois** de resolver service role (exclusão LGPD) e SMTP (confirmação/recuperação).
7. O maior risco financeiro é lançar cobrança sem validar checkout/webhook/cancelamento de ponta a ponta.
8. O maior risco de governança é o schema real não estar versionado: 9 tabelas e todo o schema `core` vivem fora do repo.
9. **Não prometer** no lançamento: realidade aumentada, correção por vídeo, push/e-mail, Google Docs/Drive, simulador fotorrealista de cabelo/roupa/tatuagem.
10. **Recomendação:** GO condicional para beta (T+0 após 3 correções), NO-GO público até fechar os 5 bloqueios e limpar os dados de teste.

**Semáforo geral:** 🟡 **amarelo** — lançável com escopo controlado, não "abrir a porta".

---

## 1. O produto em uma página

O **Aura ID** é uma companhia de identidade visual guiada por IA, emocionalmente segura, em PT-BR. A pessoa chega por um convite ("como você chega hoje?"), recebe **sugestões visuais** com 3 intensidades, guarda o que faz sentido, experimenta em **Meu Modelo** (imagens-base privadas) e acompanha mudanças em módulos: **maquiagem, cabelo, roupas, tatuagem, barba, estética, retrato e jornada**. Também conecta clientes a **profissionais** por briefing, e oferece **Aura Pass** como assinatura.

**Diferenciais já entregues:**
- linguagem e mecanismos anti-pressão (não diagnosticar, não prometer, "bonito mas não prático", confirmação antes de permanente);
- privacidade como produto (consentimentos por tipo de dado, DNA Visual editável e pausável, diário que nunca sai do app);
- honestidade de estado (retry, offline, quota/paywall, "não foi possível" com o que fazer).

**Números do app hoje:** 65 páginas (61 autenticadas + 4 públicas), 6 layouts autenticados, 34+ tabelas usadas, 8 validações de navegador automatizadas, 64 testes unitários.

---

## 2. Prontidão por dimensão

| Dimensão | Nota | Evidência | O que falta para público |
|---|---|---|---|
| **Produto / funcionalidades** | 🟢 4/5 | 24 áreas: 4 prontas, 18 com ressalva, 2 bloqueadas por ambiente | fechar ressalvas de exclusão/edição por módulo |
| **UX / consistência** | 🟢 4,5/5 | design system de estados em 49 arquivos; 1 `h1`/tela em 16 telas validadas; foco visível 12/12 | rodada com usuários reais |
| **Acessibilidade** | 🟡 3,5/5 | contraste AA medido em 10 telas (0 falhas), foco e aria pontuais | auditoria axe completa; leitor de tela real; contraste em todas as telas |
| **Microcopy / confiança** | 🟢 4,5/5 | gênero neutro, ~70 erros padronizados, guia de estilo, 0 texto <12 px | revisão humana final de tom |
| **Qualidade de código** | 🟢 4/5 | `tsc` 0, 64 testes, build ok, 24 rotas sem erro de console | lint/format no CI; cobertura de testes maior |
| **Segurança / privacidade** | 🔴 2/5 | RLS nas tabelas migradas, service role server-side, sem PII na instrumentação | service role em prod, CSP, sessão, schema versionado, rate limit |
| **Pagamento** | 🔴 1,5/5 | UI de preço e estados; integração via Edge Function | validar checkout/webhook/cancelamento; preço no Supabase |
| **Operação / deploy** | 🔴 2/5 | build Nitro/Cloudflare; README só de dev | runbook, env matrix, monitoramento, rollback |
| **E-mail / notificações** | 🔴 2/5 | notificações in-app funcionam | SMTP, templates, push (opcional) |
| **Pronto para beta** | 🟡 3,5/5 | experiência sólida e regressão automatizada | service role + SMTP + limpeza de dados |

---

## 3. Matriz de funcionalidades (estado real)

Legenda: **P** pronto · **PR** pronto com ressalva · **BA** bloqueado por ambiente.
Contagem: **P = 4 · PR = 18 · BA = 2**.

| # | Área | Status | Rota principal | Ressalva principal |
|---|---|---|---|---|
| 1 | Contas (cadastro, login, recuperação, nome/e-mail/senha, sessões, exclusão) | PR | `/auth`, `/redefinir-senha`, `/settings` | e-mails dependem de **SMTP**; exclusão real não foi exercitada (sem **service role**) e não cancela assinatura Stripe |
| 2 | Consentimento + onboarding | P | `/consent`, `/onboarding` | — |
| 3 | DNA Visual (resumo, preferências, permissões, versões, redefinir) | PR | `/dna` | "Restaurar" versão não pede confirmação (`dna/versoes.tsx`) |
| 4 | Estúdio + Sugestões (notas, adaptar, feedback) | PR | `/studio`, `/dashboard`, `/package/$id` | geração sem cancelar/progresso (~21 s medidos) |
| 5 | Comparar | P | `/compare` | — |
| 6 | Coleções | P | `/collections` | — |
| 7 | Exportação | PR | `/export` | Google Docs/Drive não conectado; tatuagem só via briefing |
| 8 | Meu Modelo | PR | `/modelo` | geração de imagem paga não exercitada ao vivo |
| 9 | Aura Retrato | PR | `/retrato` | resultado sem download/galeria; imagem paga não exercitada |
| 10 | Estética | PR | `/estetica` | 4–5 chamadas de IA por sessão; cota depende do gateway |
| 11 | Barba | PR | `/barba` | planos sem ação de excluir na UI |
| 12 | Maquiagem (perfil/gerar/kits/assinatura/manual) | PR | `/maquiagem` | look sem ação de excluir |
| 13 | Cabelo (perfil/planos/alertas) | PR | `/cabelo` | lista de planos sem filtro por status |
| 14 | Roupas (perfil/gerar/armário/lacunas/compra/missões) | PR | `/roupas` | lacunas/compra/missões sem estado de erro de consulta |
| 15 | Tatuagem (intenção/conceitos/vitrine/referências/decisão/briefing/cuidados) | PR | `/tatuagem` (+8) | vitrine fora da navegação do módulo |
| 16 | Jornada (planos/diário/galeria/linha do tempo/relatórios) | PR | `/jornada` (+6) | lembretes da jornada não podem ser apagados na UI |
| 17 | Profissionais (vitrine, busca, briefings) | PR | `/profissionais`, `/briefing/$slug`, `/p/$slug` | sem profissional ativo publicado no banco de teste |
| 18 | **Aura Pass** (assinatura) | **BA** | `/aura-pass` | checkout/cobrança não exercitados (chaves LIVE; Edge Function externa) |
| 19 | Configurações (modo simples, lembretes, exportar dados, sessões) | PR | `/settings` | lembretes por e-mail/SMS não conectados; modo simples é localStorage |
| 20 | Guia + glossário | P | `/guia` | — |
| 21 | Notificações in-app | PR | shell autenticado | sem push/e-mail/Realtime; atualiza ao montar/focar/abrir |
| 22 | Busca ⌘K (6 fontes) | PR | shell autenticado | substring normalizada, não fuzzy; fontes dependem de dados |
| 23 | Histórico/duplicação de sugestões | PR | 5 telas de detalhe | duplicar cria cópia nova; "restaurar" só no DNA |
| 24 | **Instrumentação de funil** | **BA** | `/admin` | painel exige role `admin` (conta de teste não tem) |

> Áreas P/PR/BA foram levantadas no código e nos docs — não é opinião. O que falta para "P" está na coluna de ressalva.

---

## 4. O que foi entregue (histórico das ondas)

| Etapa | Onda | Entrega | Validação registrada |
|---|---|---|---|
| 0 | Correções imediatas | export/compare por tipo, jargão removido, trilhas, sessão/offline, confirmações, falsos sucessos, duplo clique, jornada vazia, exclusão de conta completa, CTA público de briefing | 27/27 + 14/14 · 33 testes |
| 1 | 1 | onboarding gentil, packs prontos, ajuda guiada, menu mobile, dashboard útil no vazio, cotas, feedback de fim de fluxo | 31/31 · 36 testes |
| 1 | 2 | rascunho/retomada universal, painel de conta, recuperação de senha, glossário, profissionais no menu + busca, paywall único | 29/29 |
| 1 | 3 | notificações in-app, busca ⌘K, modo simples × completo, 57 correções de a11y/microcopy | 27/27 |
| 2 | 1 | design system de estados (loading/vazio/erro/cabeçalho/superfícies) em 49 arquivos, 13 testes novos | 43/43 · 49 testes |
| 2 | 2 | microcopy neutra + guia de estilo, contraste AA (accent 3,0→5,37:1), foco visível | 56/56 |
| 2 | 3 | busca em 6 fontes + `?`, histórico/duplicação (5 tipos), instrumentação de funil/erros, regressão de 24 rotas | 120/120 · 64 testes |

**Total de checks de navegador registrados:** 27 + 14 + 31 + 29 + 27 + 43 + 56 + 120 = **347**.
**Working tree:** 85 arquivos versionados alterados (+3.359/−1.212) + docs e componentes novos; **nada commitado** (conforme `AGENTS.md`/Lovable).

---

## 5. Evidências de qualidade (e o que elas não cobrem)

### 5.1 Estática
| Check | Resultado | Frequência recomendada |
|---|---|---|
| `npx tsc --noEmit` | **0 erros** | todo PR |
| `npx vitest run` | **8 arquivos / 64 testes / 0 falhas** | todo PR |
| `npm run build` | **sucesso** (Nitro Cloudflare) | todo deploy |

### 5.2 Navegador (Chromium via CDP, conta de teste)
- **Consistência:** 16 telas com exatamente 1 `h1` e mesmo tamanho; nenhum erro sem "Tentar novamente".
- **Contraste:** 10 telas medidas em WCAG (conversão `oklch`→sRGB, fundo efetivo composto) — **0 pares abaixo de AA**.
- **Foco:** 12/12 paradas de Tab com anel visível e fora do body.
- **Loading/erro/vazio:** esqueleto sob latência de 2 s, `EstadoErro` com retry recuperando conteúdo, vazio com ação.
- **Regressão:** 24 rotas, **0 `pageerror`/`console.error`**, responsivo 375×812 sem overflow.
- **Busca:** grupos de páginas + coleções/lembretes/profissionais, Escape fecha.

### 5.3 O que a validação **não** cobre
- Dispositivos reais (iOS/Android) e navegadores além do Chromium.
- Fluxos pagos de imagem (IA premium) e cobrança real.
- SMTP/confirmação/recuperação reais e exclusão de conta real.
- 5 usuários reais (beta) — roteiro pronto, execução depende de recrutamento.
- Performance de produção (timings medidos são de `vite dev`: média ~6,8 s aquecido; **não** representam produção).
- Auditoria axe completa e leitor de tela real.

---

## 6. Lacunas de produto conhecidas (priorizadas para o pós-lançamento)

| # | Lacuna | Impacto | Prioridade |
|---|---|---|---|
| 1 | Planos de barba, looks de maquiagem e lembretes da jornada não têm exclusão na UI | acúmulo/limpeza; sensação de falta de controle | P1 |
| 2 | Vitrine de tatuagem fora da navegação do módulo | descoberta | P1 |
| 3 | Geração sem cancelar/progresso/estimativa (~21 s) | ansiedade/abandono | P1 |
| 4 | Retrato sem download/galeria do resultado | perda do resultado | P1 |
| 5 | Restaurar versão do DNA sem confirmação | risco de sobrescrever | P1 |
| 6 | Cota da Estética depende de o gateway contar `webapp.estetica.sim` | paywall inconsistente | P2 |
| 7 | Lista de planos de cabelo sem filtro por status | navegação | P2 |
| 8 | Busca não fuzzy | busca "quase certa" | P2 |
| 9 | Duplicar cria cópia (não versão da mesma linha) | expectativa de histórico | P2 |
| 10 | Sem download/PDF no Retrato e em relatórios | compartilhamento | P2 |
| 11 | Sem push/e-mail | lembretes só ao abrir o app | P2 (infra) |
| 12 | Google Docs/Drive, Sheets/Airtable, RA, vídeo, simulador fotorrealista | rotas futuras — já rotuladas "roteiro" | P3 |
| 13 | `/admin` sem funil para conta não-admin | operação exige role admin | P2 (operacional) |
| 14 | `AURA-ID-DOCUMENTO-GUIA.md §10` desatualizado (lista ausências já entregues) | documentação | P2 (doc) |
| 15 | Copy "em breve testarem no próprio corpo" contradizia o botão "Copiar pra mim" | confiança | ✅ corrigido nesta rodada |

---

## 7. Pré-requisitos de lançamento (o que precisa estar de pé)

### 7.1 Variáveis de ambiente

| Variável | Onde | Obrigatória | Para quê |
|---|---|---|---|
| `SUPABASE_URL` | servidor | ✅ | Auth/REST/Storage/Edge Functions |
| `SUPABASE_PUBLISHABLE_KEY` | servidor | ✅ | chamadas server-side com `apikey` público |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | ✅ (fluxos privilegiados) | **exclusão de conta (LGPD)**, admin, funil de instrumentação |
| `VITE_SUPABASE_URL` | build (browser) | ✅ | client do navegador |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build (browser) | ✅ | client do navegador |
| `LOVABLE_API_KEY` | servidor | condicional | avatar do onboarding / gateway de imagem legado |

- **Stripe não tem chave no app:** checkout/portal/webhook vivem em Edge Functions (`stripe-checkout`) + `core.entitlements`. As chaves e price IDs ficam no projeto Supabase, não neste repo.
- **IA de texto/visão** vai por Edge Function `ai-gateway`; **IA de imagem** por gateway externo. Nenhuma chave de provedor no repo.
- **Não existe no código:** SMTP/Resend/SendGrid, push/VAPID, Sentry/OTel, `.env.example` (agora criado).
- **Código morto/oportunidade:** `LOVABLE_CRON_SECRET(_PREVIOUS)` em `cron-auth.ts` sem chamador no app.

> Template criado nesta rodada: [`.env.example`](.env.example).

### 7.2 Supabase
- **Auth:** Site URL + Redirect URLs com `https://SEU-DOMINIO/auth` e `https://SEU-DOMINIO/redefinir-senha`; provedor Google habilitado; templates PT-BR de confirmação e recuperação.
- **SMTP:** provedor próprio (Resend/SendGrid/SES) — sem isso, confirmação/recuperação dependem do e-mail padrão limitado do Supabase.
- **Storage:** `user-photos` (privado; policies de select/insert/delete por pasta do usuário — **falta policy de UPDATE**, e o app faz upsert em `modelo.tsx`); `studio-media` (público, usado na vitrine — criar bucket e policies no dashboard; não versionado).
- **Tabelas/RPCs:** `has_role` (admin), `audit_events`, `safety_config`, `core.ai_runs`, `core.entitlements`, além das 34 tabelas usadas. **9 tabelas e todo o schema `core` não têm migration no repo** (`briefing_sends`, `briefing_suggestions`, `estetica_jornada`, `estetica_registro`, `feedback_aura`, `partner_stores`, `products`, `professionals`, `tattoo_designs`).
- **Admin:** conceder role `admin` à conta do dono (via dashboard/RPC) para liberar `/admin` e o funil.
- **Edge Functions:** confirmar deploy de `ai-gateway`, `stripe-checkout` e do webhook de assinatura no projeto correto.

### 7.3 Deploy
```powershell
cd webapp-lovable
npm ci
npx tsc --noEmit
npx vitest run
npm run build
# artefato Nitro gerado; preview/deploy oficiais do worker:
cd .output
npx wrangler dev      # preview do worker
npx wrangler deploy   # deploy Cloudflare (ou publicar pelo Lovable)
```
- Preset: **Cloudflare module worker** (`ffs007-aura-webapp`), `nodejs_compat`.
- O `npm run preview` do `package.json` é `vite preview` (não é o preview do worker) — **divergência documentada**.
- Caminho `..\public` no `wrangler.json` gerado usa barras do Windows — validar em CI Linux.
- Caminho principal de publicação hoje é o **Lovable** (branch conectada); o deploy direto Cloudflare é alternativa a validar.

---

## 8. Segurança e privacidade: achados e decisões

| # | Achado | Severidade | Evidência | Decisão necessária |
|---|---|---|---|---|
| S1 | **Service role ausente no ambiente local** (e não documentada na produção) impede exclusão de conta, admin e funil | 🔴 Crítica | `client.server.ts:34-44`, `aura.functions.ts:165/342/432` | configurar na hospedagem **antes** de convidar usuários |
| S2 | **Sessão JWT em `localStorage`** (fora das zonas de preview) | 🟠 Alta | `previewAuthStorage.ts:18`, `client.ts:69-73` | aceitar risco com CSP/XSS hardening ou migrar para cookie httpOnly |
| S3 | **Sem CSP/HSTS**; headers de segurança ausentes | 🟠 Alta | `server.ts` (antes), `public/_headers` inexistente | ✅ `nosniff` + `Referrer-Policy` aplicados nesta rodada; CSP e HSTS no domínio (cloudflare) |
| S4 | **Schema/RLS não reprodutível**: 9 tabelas + `core.*` + buckets + Edge Functions fora do repo; `drizzle/schema.ts` vazio | 🟠 Alta (governança) | `drizzle/migrations`, `supabase/config.toml` | trazer schema real para migrations versionadas |
| S5 | **Exclusão de conta não cancela assinatura Stripe** | 🟠 Alta (compliance) | `ETAPA-0 §3.2` | incluir cancelamento no fluxo de exclusão |
| S6 | **`feedback_aura` aceita INSERT anônimo** | 🟡 Média (spam) | `feedback.functions.ts:15-18,37-44` | rate limit/captcha ou migrar para Edge Function |
| S7 | **`audit_events` gravável pelo próprio usuário** (trilha não à prova de adulteração) | 🟡 Média | migration `0000:28`, `aura.ts:93-96` | aceitar para produto, não usar como auditoria legal |
| S8 | **`user-photos` sem policy de UPDATE** e app faz upsert | 🟡 Média (falha intermitente) | `0000:38-40` vs `modelo.tsx:101` | criar policy `for update` ou trocar upsert por upload/delete |
| S9 | **Projeto Supabase inconsistente** entre código (`oyfq…`), `config.toml` (`bdlv…`), `.env` (anon legado) e backup | 🟠 Alta (deploy errado) | 11 arquivos hardcoded + configs | unificar projeto de produção antes do deploy |
| S10 | **Sem rate limiting no app** (quotas no gateway externo) | 🟡 Média | grep sem rate limit | rate limit nas Edge Functions/worker |
| S11 | **Sem observabilidade fora do Lovable** | 🟡 Média | `lovable-error-reporting.ts` | Sentry/OTel ou logs do worker + alerta |
| S12 | **Logs do servidor gravam erro completo** | 🟢 Baixa | `server.ts:31,54` | revisar PII em produção |

**Instrumentação:** coleta só `pathname` (sem query string) e mensagem de erro truncada em 200 chars — sem nome, e-mail, foto ou texto de formulário. ✅

---

## 9. Plano de lançamento sugerido

### Fase A — Bloqueios (T−7 a T−3)
1. Configurar `SUPABASE_SERVICE_ROLE_KEY` na hospedagem e **testar exclusão de conta** com conta descartável.
2. Configurar **SMTP + templates + redirect allowlist**; testar cadastro, confirmação e recuperação de senha.
3. Validar **Stripe**: checkout (pass/pro), webhook, portal e cancelamento; incluir cancelamento na exclusão de conta.
4. Confirmar as **Edge Functions** de IA e imagem no projeto certo (e a conta admin do dono).
5. **Segurança:** decidir CSP/HSTS e estratégia de sessão; adicionar rate limit no feedback.
6. **Limpar dados de teste** (seção 13) e revisar contas `teste.*`.

### Fase B — Beta fechado (T−3 a T−1)
7. Dry-run do deploy (`.output` → wrangler/Lovable) em um ambiente de staging.
8. Rodar a regressão completa: `tsc`, `vitest`, `build`, e as suítes `.e2e` (347 checks).
9. Smoke em **dispositivos reais** (iPhone + Android) nas 5 telas principais.
10. Convidar **5 pessoas** com roteiro de 20 min (seção 9.1) e canal de suporte (💬 no app + WhatsApp).
11. Ajustar o que aparecer de P0/P1 antes de abrir mais.

### Fase C — Lançamento público (T+0)
12. Publicar; verificar em produção: cadastro, recuperação, primeira sugestão, exportação, um briefing e um pagamento real (se o Pass estiver ativo).
13. Monitorar por 1 h: erros de console/`erro_tela`, funil, fila de suporte.
14. Rodar o smoke de 24 rotas contra produção (script `.e2e/onda8-regressao.mjs`, apontando BASE para o domínio público).

### Fase D — Pós (T+1 a T+7)
15. Revisar funil e erros no `/admin` (com conta admin).
16. Fechar lacunas P1 da seção 6.
17. Retrospectiva e priorização da próxima onda.

### 9.1 Roteiro de beta (20 min por pessoa)
1. Criar conta e aceitar consentimento → onboarding (observar onde trava).
2. "Como você chega hoje?" → gerar 3 sugestões → salvar uma e rejeitar outra.
3. Criar Meu Modelo com 3 fotos → ver se o resultado sai "com a sua cara".
4. Gerar um look de maquiagem e um plano de cabelo.
5. Testar a busca ⌘K e o sino de notificações.
6. Pedir "esqueci minha senha" (valida SMTP).
7. Configurações → exportar dados → excluir a conta de teste (valida service role/LGPD).
8. Perguntar: "o que você não entendeu?" e "o que te deu medo?".

---

## 10. Checklist de pré-lançamento (copiar/colar)

```text
[ ] SUPABASE_SERVICE_ROLE_KEY configurada na hospedagem
[ ] Exclusão de conta testada ponta a ponta (dados + storage + login)
[ ] SMTP configurado + templates PT-BR + redirect URLs (/auth, /redefinir-senha)
[ ] Cadastro, confirmação e recuperação de senha testados
[ ] Stripe: checkout, webhook, portal e cancelamento validados (se o Pass estiver ativo)
[ ] Cancelamento da assinatura incluído na exclusão de conta
[ ] Edge Functions de IA/imagem confirmadas no projeto correto
[ ] Conta do dono com role admin (libera /admin e funil)
[ ] Bucket studio-media criado (público); policy UPDATE em user-photos
[ ] Schema real versionado (9 tabelas + core.*) ou backup do banco exportado
[ ] CSP/HSTS decididos e configurados no domínio
[ ] Rate limit no feedback/edge functions
[ ] Monitoramento de erros configurado (logs do worker/Sentry)
[ ] Dados de teste removidos (contas teste.* + sugestões/lembretes/coleções E2E)
[ ] .env.example preenchido e secrets fora do Git
[ ] Build + tsc + vitest + regressão .e2e verdes
[ ] `npm run verificar:lancamento` com 0 FAIL (SMTP_TEST_EMAIL + APP_URL definidos)
[ ] Exclusão de conta validada com --criar-conta-teste + UI + --verificar-exclusao
[ ] Dados de teste limpos (--limpar --sim) e conferidos
[ ] Smoke mobile real (iPhone + Android)
[ ] Beta com 5 pessoas concluído (ou decisão de abrir sem)
[ ] Suporte e canal de comunicação prontos
[ ] Página/aviso de privacidade e contato LGPD publicados
[ ] Rollback ensaiado (build anterior + branch Lovable)
```

---

## 11. Plano de rollback

1. **App:** republicar o build anterior pelo Lovable (branch conectada) ou `wrangler deploy` de um artefato `.output` arquivado.
2. **Banco:** este ciclo **não criou migrations destrutivas**. Se houver migration nova, rollback = script compensatório (não `down` automático).
3. **Feature flag manual:** o modo simples já cobre esconder ferramentas; para desligar o Pass, remover/ocultar os botões de checkout até corrigir.
4. **Dados:** exclusões são definitivas (por design). Não há “lixeira” — comunicar antes de ações destrutivas.
5. **Critério de acionamento:** erro P0 em produção (login, geração, pagamento) por >15 min ou perda de dados.

---

## 12. Monitoramento pós-lançamento

| Sinal | Onde | Ação esperada |
|---|---|---|
| `tela_visualizada` por rota | `/admin` → Funil (7 dias) | detectar quedas de tráfego por área |
| `erro_tela` por rota | `/admin` | corrigir telas com mais erro |
| Funil: `profile_created → onboarding_completed → recommendation_saved → recommendation_approved → feedback_given → suggestion_exported → briefing_sent` | `/admin` | achar o maior vazamento |
| Toasts de erro (console) | sessão de suporte | transformar em ticket |
| Quotas/paywall | `/admin` + gateway | validar receita e limite |
| Tempo de geração | logs/console | meta de UX (hoje ~21 s em dev) |
| Suporte (💬) | WhatsApp/e-mail | P0/P1 em 24 h |

**Metas de saúde:** 0 erro de console por sessão; funil com queda < 30% entre onboarding e primeira sugestão; tempo até primeira sugestão < 3 min; 0 reclamação de "perdi meu trabalho".

---

## 13. Limpeza de dados de teste (antes do go-live)

**Contas conhecidas:**
- `teste.aura.1794127859111@example.com` (conta principal de E2E; nome "Aura Teste E2E")
- `teste.aura.20261108@example.com`
- possíveis contas descartáveis `teste.*@example.com` — auditar com:
  ```sql
  -- rodar como admin no dashboard/SQL editor
  select id, email, created_at from auth.users where email ilike 'teste.%@example.com' order by created_at;
  ```

**Dados E2E criados ao longo dos testes (na conta de teste):** sugestões “Frescor Descomplicado” e “Aconchego Natural”, coleções, plano de jornada, projeto de tatuagem, diário, lembretes (“Lembrete vencido E2E”, “Lembrete teste sino …”), várias sugestões duplicadas e designs de vitrine.

**Procedimento:**
1. Excluir as contas pela UI (Configurações → Excluir minha conta) — valida o próprio fluxo de exclusão e apaga dados/storage.
2. Para contas que não logam mais, excluir pelo dashboard de Auth (cascata nas tabelas + storage; conferir storage órfão).
3. Conferir buckets `user-photos` e `studio-media` por pastas de `user_id` sem conta.
4. Rodar `select count(*)` nas tabelas principais antes/depois e registrar.

---

## 14. Riscos e mitigações (resumo executivo)

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Excluir conta falhar por falta de service role | Alta | 🔴 LGPD | configurar env + testar antes do beta |
| E-mail de confirmação/recuperação não chegar | Alta | 🔴 ativação | SMTP próprio + testes com 3 provedores |
| Cobrança quebrada (checkout/webhook) | Média | 🔴 receita | validar em sandbox e live; monitorar |
| Deploy no projeto Supabase errado | Média | 🔴 dados | unificar projeto e revisar env antes do deploy |
| XSS por sessão em localStorage | Baixa | 🔴 conta | CSP, revisão de HTML perigoso, cookie httpOnly (roadmap) |
| Schema/RLS divergente em novo ambiente | Média | 🟠 operação | versionar schema e policies |
| Usuários não entenderem o produto | Média | 🟠 ativação | beta de 5 pessoas + guia/packs já prontos |
| Geração lenta gerar abandono | Média | 🟠 UX | progresso/cancelamento (P1) |
| Notificações dependerem de abrir o app | Alta | 🟡 retenção | push/e-mail (infra) |
| Dados de teste vazarem na vitrine | Baixa | 🟡 imagem | limpeza da seção 13 |

---

## 15. Decisões pendentes do dono

1. **SMTP:** qual provedor (Resend/SendGrid/SES) e endereço `from`?
2. **Stripe:** quem configura as Edge Functions/chaves/webhook e quando o Pass entra no ar? Até lá, esconder os botões de compra?
3. **Sessão:** aceitar localStorage com CSP ou priorizar cookies httpOnly num próximo ciclo?
4. **Schema:** importar o schema real para migrations versionadas agora ou só documentar o backup?
5. **Admin:** qual conta recebe a role `admin`?
6. **Beta:** 5 pessoas, quando, e quem dá suporte?
7. **Limpeza:** excluir as contas `teste.*` antes ou depois do beta?
8. **Legal:** publicar política de privacidade/contato LGPD e revisar os textos de consentimento com alguém jurídico?
9. **Escopo de lançamento:** público com todos os módulos ou beta com Estúdio + Sugestões + Meu Modelo + um módulo (maquiagem/cabelo)?
10. **Mensagem:** confirmar o que **não** prometer (RA, vídeo, push, Drive, simulador fotorrealista).

---

## 16. Anexos

### 16.1 Documentos
- Produto/uso: [AURA-ID-DOCUMENTO-GUIA.md](AURA-ID-DOCUMENTO-GUIA.md), [AURA-ID-GUIA-COMPLETO.md](AURA-ID-GUIA-COMPLETO.md)
- Teste profundo: [RELATORIO-TESTE-PROFUNDO.md](RELATORIO-TESTE-PROFUNDO.md), [RELATORIO-AUDITORIA.md](RELATORIO-AUDITORIA.md), `auditoria/00–06`
- Execução: [ETAPA-0-EXECUCAO.md](ETAPA-0-EXECUCAO.md), [ETAPA-1-ONDA-1.md](ETAPA-1-ONDA-1.md) … [ETAPA-1-ONDA-3.md](ETAPA-1-ONDA-3.md), [ETAPA-2-ONDA-1.md](ETAPA-2-ONDA-1.md) … [ETAPA-2-ONDA-3.md](ETAPA-2-ONDA-3.md)
- Estilo: [GUIA-DE-ESTILO-AURA.md](GUIA-DE-ESTILO-AURA.md)
- Evolução: [PLANO-EVOLUCAO-PROMPTS.md](PLANO-EVOLUCAO-PROMPTS.md), [PLANO-EXPANSAO.md](PLANO-EXPANSAO.md), [PLANO-IMAGEM-PRO.md](PLANO-IMAGEM-PRO.md), `roadmap.md`

### 16.2 Comandos de validação
```powershell
cd webapp-lovable
npx tsc --noEmit
npx vitest run
npm run build
# navegador (dev + Chrome headless CDP 9222):
cd ..
node .e2e/onda8-regressao.mjs   # 24 rotas / 120 checks (somente leitura)
node .e2e/onda5-validate.mjs    # contraste AA + foco + microcopy
node .e2e/onda4-validate.mjs    # design system de estados
```

### 16.2.b Verificação dos bloqueios de lançamento (novo)
```powershell
cd webapp-lovable
npm run verificar:lancamento                 # fases 1–8, somente leitura
npm run verificar:lancamento -- --criar-conta-teste
# → excluir pela UI em /settings (2 min)
npm run verificar:lancamento -- --verificar-exclusao
npm run verificar:lancamento -- --limpar     # dry-run; --sim apaga
```
Passo a passo, interpretação de cada FAIL e critérios de liberação em [COMO-VERIFICAR-BLOQUEIOS.md](COMO-VERIFICAR-BLOQUEIOS.md).

### 16.3 Rotas (resumo)
- **Públicas (4):** `/`, `/auth`, `/p/$slug`, `/redefinir-senha` (SSR padrão).
- **Autenticadas (61):** todas sob `_authenticated` com `ssr:false` + gate de consentimento/perfil.
- **Layouts (6):** shell + maquiagem + cabelo + roupas + tatuagem + DNA.
- Cobertura ao vivo anterior: 53 rotas (`crawl-results.json`).

### 16.4 O que mudou nesta rodada de prontidão
- `.env.example` criado com a matriz de variáveis.
- Headers `X-Content-Type-Options: nosniff` e `Referrer-Policy: strict-origin-when-cross-origin` aplicados no `server.ts`.
- Copy contraditória da vitrine profissional corrigida ("em breve testarem" → "aplicar em você").
- **Scripts de verificação dos bloqueios**: `scripts/verificar-lancamento.mjs` (fases 1–8) + `COMO-VERIFICAR-BLOQUEIOS.md`, com fluxo de exclusão de conta em conta descartável e limpeza de dados de teste.
- `tsc`, `vitest` (64/64) e build revalidados após as mudanças.

---

**Conclusão:** o Aura ID está pronto para encantar um grupo pequeno e cuidado. Antes de abrir para o público, feche os bloqueios de **service role, SMTP, Stripe, schema/segurança e limpeza de dados** — e faça o beta de 5 pessoas. O produto já tem a parte mais difícil: coerência, honestidade de estado e uma experiência que não envergonha.
