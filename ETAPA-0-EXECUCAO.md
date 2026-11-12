# ✅ Etapa 0 — Execução das Correções Imediatas

**Data:** 08/11/2026 · **Base:** `webapp-lovable` · **Escopo:** as 10 correções imediatas do `RELATORIO-TESTE-PROFUNDO.md` (§12, Etapa 0).
**Status:** concluída e validada (TypeScript, build, testes automatizados e navegador real), com as limitações declaradas no fim.

---

## 1. O que foi corrigido (item por item)

| # | Correção | O que mudou | Arquivos principais |
|---|---|---|---|
| **0.1** | Exportação e comparação por tipo | `packageToMarkdown` agora roteia por `kind`: maquiagem → `lookToMarkdown`, cabelo → `planToMarkdown` + rotina/avisos, roupa → template próprio com os campos reais do `Outfit`, demais/legado → template genérico tolerante. Fallback duplo: conversor → genérico → aviso curto. `Baixar todas` e `Baixar` não quebram mais por item; `Indicators` e o comparador nunca exibem “undefined”; níveis vêm de `variations`, `versions` ou `proposals`. | `src/lib/aura.ts`, `src/routes/_authenticated/export.tsx`, `src/routes/_authenticated/compare.tsx`, `src/components/PackageView.tsx` |
| **0.2** | Jargão interno visível | Removidas **7 ocorrências visíveis** de `[FORA DO ESCOPO DOS CONECTORES LOVABLE]` / “conectores Lovable” (landing + rodapés de maquiagem, cabelo, roupas, tatuagem + admin) e 1 menção em comentário. Textos substituídos por “está no nosso roteiro e ainda não faz parte desta versão”, em PT-BR. | `src/routes/index.tsx`, `src/routes/_authenticated/{maquiagem,cabelo,roupas,tatuagem}/route.tsx`, `src/routes/_authenticated/admin.tsx` |
| **0.3** | Loop e limite das trilhas | “Agora não” passa a ser lembrado (não reabre a cada navegação); **máximo 3** com aviso ao tentar a 4ª; links deduplicados (fim do “Cabelo” duplicado e do erro de chave no React); modal migrado para `Dialog` acessível (foco, `aria-labelledby`, Escape, botão de fechar); `aria-pressed` nas opções; texto do menu corrigido. | `src/components/TrilhaPicker.tsx`, `src/lib/trilhas.ts`, `src/routes/_authenticated/route.tsx` |
| **0.4** | Sessão, rede e timeout visível | Sessão ausente redireciona com `motivo` e aviso “Entre para continuar de onde parou”; falha de rede não vira logout (usa sessão local; erros de consulta mostram tela de conexão com “Tentar novamente”); banner global “Sem conexão com a internet”; o “Preparando…” agora, após 12 s, explica a demora e oferece “Recarregar a página”. | `src/routes/_authenticated/route.tsx`, `src/routes/auth.tsx`, `src/routes/__root.tsx`, `src/router.tsx` |
| **0.5** | Confirmação de exclusões | Coleção e lembrete agora usam `Confirm` (antes sumiam no 1º clique); reflexão e foto do diário, registro do diário de cicatrização e foto de referência/corporal também. `confirm()` nativo de design da vitrine substituído por `Confirm` com descrição. | `collections.tsx`, `settings.tsx`, `journey/JourneyWorkspace.tsx`, `tattoo/TattooPlanView.tsx`, `tattoo/TattooPhotos.tsx`, `profissionais.tsx` |
| **0.6** | Falsos sucessos | “Salvar nota” com texto vazio avisa e não salva; “Enviar feedback” sem interação real não finge sucesso; Modelo só diz “pronto” se **as duas** gerações retornaram; Cabelo (salvar/rejeitar/alertas) checa `error` antes de comemorar; feedback avisa se o DNA não atualizou. | `package.$id.tsx`, `modelo.tsx`, `cabelo/plano.$id.tsx`, `cabelo/alertas.tsx` |
| **0.7** | Duplo clique | Criar coleção, criar plano e adicionar lembrete têm estado `busy`/guarda e botão desabilitado; ações do pacote também bloqueiam durante update. | `collections.tsx`, `JourneyWorkspace.tsx`, `settings.tsx`, `package.$id.tsx` |
| **0.8** | Jornada vazia | “Criar plano” exige intenção (cartão ou texto livre) e não cria mais plano fantasma; nome vazio usa a intenção explicitamente; upload de foto **sem passo** agora funciona e aparece em “Registros livres”; Antes/Depois continua exigindo passo. | `journey/JourneyWorkspace.tsx` |
| **0.9** | Exclusão de conta completa | `deleteAccount` apaga **36 tabelas** com `user_id` (confirmadas nos tipos/migrations) + casos sem `user_id` (via jornada/profissional) + **Storage** paginado/recursivo em `user-photos` e `studio-media` (fotos, modelo, avatar, jornada, estética, tattoo, armário, retrato, designs). Falhas são acumuladas: se algo falhar, o login **não** é apagado e a mensagem pede nova tentativa (PT-BR). Login só é removido no fim, com sucesso total. | `src/lib/aura.functions.ts` |
| **0.10** | CTA público de briefing | O botão “Enviar meu briefing” da micropágina grava `aura.destino` e leva para `/briefing/<slug>`; nova rota autenticada com formulário (título + mensagem 10–8000), envia sem pacote/foto, mostra estados de carregando/não encontrado/erro/enviando/sucesso e link “Ver meus envios”. Login, consentimento e onboarding agora retornam ao destino preservado. | `src/routes/p.$slug.tsx`, `src/routes/_authenticated/briefing.$slug.tsx`, `src/lib/profissionais.functions.ts`, `src/routes/auth.tsx`, `consent.tsx`, `onboarding.tsx`, `src/lib/navegacao.ts` |

---

## 2. Validação executada

### 2.1 Estática
| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **6 arquivos / 33 testes / 0 falhas** |
| `npm run build` | **sucesso** (client/SSR/Nitro; ~49 s) |
| `eslint` nos arquivos alterados | somente `prettier/prettier` (formatação pré-existente no repo) e avisos de hooks; **0 erros substantivos novos** |
| Busca por jargão interno no `src` | **0 ocorrências** |
| `routeTree.gen.ts` | regenerado com a rota `/briefing/$slug` |

### 2.2 Navegador real (Chromium 156 via CDP, localhost:8080)
**Roteiro principal — 27/27 verificações passaram:**
- landing sem jargão e com texto de roteiro;
- login e chegada ao app;
- “Agora não” não reabre; picker abre pelo botão; limite de 3 com aviso; 4ª bloqueada; Escape fecha; menu sem “Cabelo” duplicado;
- sessão removida → `/auth` com aviso “Entre para continuar de onde parou”;
- login com `redirect=/briefing/...` volta ao destino; rota trata profissional inexistente;
- banner de offline aparece e some ao reconectar;
- coleção: nome vazio avisa; duplo clique cria **uma**; excluir pede confirmação; cancelar mantém;
- lembrete vazio explica o que falta; remover pede confirmação;
- pacote: nota vazia avisa; feedback sem interação não finge sucesso;
- “Criar plano” vazio é bloqueado; registro visual sem passo é aceito;
- exportação em lote gera arquivo.

**Roteiro extra — 14/14 verificações passaram:**
- inserção de conteúdo sintético `outfit` e `hair_plan` na conta de teste e download individual/lote com conteúdo correto (valida a correção 0.1 de ponta a ponta);
- comparação sem “undefined”;
- exclusão de reflexão pede confirmação;
- `/maquiagem`, `/cabelo`, `/roupas`, `/tatuagem` e `/estetica` sem jargão interno;
- CTA real de profissional: **não havia profissional ativa publicada** no banco para clicar; a rota e o fluxo de destino foram validados com slug inexistente e por código (`href=/briefing/<slug>` + `aura.destino`).

Capturas: `.e2e/shots-etapa0/` (01-landing, 02-trilhas, 03-sessao, 04-briefing-nao-encontrado, 05-offline, 06-collections, 07-settings, 08-package, 09-jornada, 10-diario, 11-export).

---

## 3. Limitações desta rodada (honestidade)

1. **0.9 não foi exercitada de ponta a ponta no navegador** porque o ambiente local **não tem `SUPABASE_SERVICE_ROLE_KEY`** (só URL e chave pública). A função foi validada por TypeScript (nomes de tabelas conferem com os tipos gerados), revisão do fluxo e build — mas a exclusão real de uma conta precisa ser testada num ambiente com service role antes de produção. O teste de exclusão também não deve ser feito na conta principal: use uma conta descartável.
2. **Assinatura Stripe não é cancelada** pelo fluxo de exclusão; o vínculo local (`core.entitlements`) cai junto com o usuário, mas o cancelamento da cobrança exige a Edge Function de billing.
3. **0.4 cobre nível de rota** (spinner com timeout de 12 s, banner offline, erro de conexão com retry). Operações de IA já em andamento continuam sem botão “cancelar” (fica para a Etapa 1/2).
4. **Novo dado de teste:** a conta `teste.aura.1794127859111@example.com` ganhou a coleção “Validação Etapa 0” e um registro livre no diário durante a validação. Os pacotes sintéticos de exportação foram apagados ao fim do teste.
5. **Não houve commit/push** (respeitando o aviso do Lovable no `AGENTS.md`). As alterações estão na working tree para revisão.
6. Ainda fora desta etapa (Etapa 1): menu mobile, “esqueci minha senha”, busca, rascunho universal, painel de conta, unificação de vocabulário e paywall com cartão.

---

## 4. Próximo passo recomendado

**Etapa 1 do relatório** (1–2 semanas), nesta ordem de maior retorno:
1. Onboarding menos assustador (fim do “18 pendentes” no passo 1; perguntar apresentação antes de barba/maquiagem) + assistente “o que você quer hoje?”.
2. Packs prontos / biblioteca de começos.
3. Rascunho e retomada em todos os formulários + notificações de briefing.
4. Modo Simples × Completo + menu mobile.
5. Painel de conta (senha, e-mail, sessões, exportar dados) e “esqueci minha senha” após SMTP.

Cada correção deve ser validada com o teste indicado no plano antes de seguir — e o roteiro de 27 verificações desta etapa pode ser reaproveitado como regressão rápida.
