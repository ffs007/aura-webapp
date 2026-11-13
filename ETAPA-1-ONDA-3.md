# ✅ Etapa 1 — Onda 3 (Notificações, Busca e Modo Simples) — Execução

**Data:** 09/11/2026 · **Base:** `webapp-lovable` · **Escopo:** terceira onda da Etapa 1 — notificações in-app, busca global, modo simples × completo e polimento de acessibilidade/microcopy.
**Status:** concluída e validada (TypeScript, build, 36 testes automatizados e 27 verificações em navegador real).

---

## 1. O que foi entregue

| Frente | O que mudou | Arquivos |
|---|---|---|
| **Notificações in-app** | Sino no header (desktop e mobile) com contador; Popover com **briefings respondidos/orçados/recusados** (nome da profissional, valor e prazo), **lembretes vencidos** e **revisão do DNA Visual** (≥5 sinais); cada item leva à tela certa; “Marcar todas como vistas” grava timestamp local; estado vazio “Tudo em dia”; atualiza ao abrir/focar a aba. | `src/components/Notificacoes.tsx`, `route.tsx` |
| **Busca global (⌘K)** | Botão “Buscar ⌘K” no desktop e ícone acessível no mobile; **Ctrl/Cmd+K** abre um CommandDialog com **Páginas** (17 destinos) e **Suas sugestões** (título → pacote/look/plano correspondente). Fecha ao navegar. | `src/components/BuscaGlobal.tsx`, `route.tsx` |
| **Modo simples × completo** | Preferência em Configurações (“Preferências de visualização”). No **simples** o menu mostra **Estúdio, Sugestões, Profissionais e Meu Modelo**; o resto (DNA, comparar, exportar, estética, retrato, pass, módulos) fica em **“Mais opções”**, no desktop e no drawer mobile. No completo, tudo como antes. | `useModoVisual.ts`, `settings.tsx`, `route.tsx`, `AppMenu.tsx` |
| **Acessibilidade e microcopy** | **57 correções pontuais**: 11 sliders com `aria-label` (agora no Thumb, onde o leitor de tela realmente anuncia); 25 controles com `aria-pressed`; 8 textos legais/críticos de 10–11 px para `text-xs`; 7 erros com `role="alert"`; plurais (“1 projeto”, “1 versão”, “1 passo”) e “A verificação **não aprovou** a edição”. | módulos de maquiagem/cabelo/roupas/tatuagem/jornada/DNA, estética, modelo, retrato, profissionais, collections, compare, export, package, guia e componentes |
| **Ajustes encontrados na validação** | (a) Em modo simples faltava **Meu Modelo** no menu — corrigido no desktop e no mobile; (b) o contador do sino usava a **data de vencimento** do lembrete como “quando”; agora usa `created_at`, então um lembrete criado depois de “marcar como vistas” volta a contar; (c) `aria-label` do slider estava no Root do Radix e não era anunciado — passou para o **Thumb**. | `Notificacoes.tsx`, `ui/slider.tsx`, `route.tsx`, `AppMenu.tsx` |

---

## 2. Validação executada

### 2.1 Estática
| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **6 arquivos / 36 testes / 0 falhas** |
| `npm run build` | **sucesso** |

### 2.2 Navegador real (Chromium via CDP, `localhost:8080`)
**27/27 verificações passaram.** Destaques:
- **Sino:** abre com “Marcar todas como vistas”; lembrete vencido criado no teste aparece como notificação, gera badge e some do badge após marcar; item linka para Configurações.
- **Busca:** botão abre o diálogo; buscar “maquiagem” encontra e navega; **Ctrl+K** abre; buscar “Aconchego” encontra a sugestão real do usuário e abre o pacote correto.
- **Modo simples:** ativar em Configurações toasta e reduz a nav a Estúdio/Sugestões/Profissionais + Meu Modelo; “Mais opções” revela DNA/Comparar/Exportar/Estética/Modelo/Retrato/Pass; no mobile (375 px) o drawer mostra Profissionais + Meu Modelo + “Mais opções”; voltar ao completo restaura a nav.
- **A11y:** sliders do pacote com `aria-label` real; imagens com `alt`; microcopy do Retrato corrigida.

Capturas: `.e2e/shots-onda3/` (01-notificacoes, 02-busca, 03-modo).

---

## 3. Limitações e pendências

1. **Notificações são in-app e por demanda**: não há push, e-mail nem WebSocket/Realtime; o sino atualiza ao montar, focar a aba e abrir o popover. Para “briefing respondido chega no celular” seria preciso SMTP/push + Edge Function.
2. **Lembretes por e-mail continuam bloqueados** pelo SMTP não configurado no ambiente.
3. **Busca global** cobre páginas e sugestões (pacotes/looks/planos). Não busca coleções, briefings, profissionais por nome nem conteúdo interno dos cards.
4. **Modo simples** é preferência **deste navegador** (localStorage), não da conta; trocar de dispositivo volta ao completo.
5. **Acessibilidade é uma varredura pontual**, não uma auditoria completa (contraste global, foco em todos os modais, leitores de tela reais seguem pendentes).
6. **Teste E2E de conta com SMTP + service role** continua pendente de ambiente (recuperação, troca de e-mail/senha e exclusão real).
7. **Sem commit/push**; alterações na working tree, conforme `AGENTS.md`.
8. Dados de teste: foram criados lembretes “Lembrete vencido E2E” e “Lembrete teste sino …” na conta de teste; o sino foi marcado como visto. Nada em produção de clientes reais.

---

## 4. Próximo passo

Com a Etapa 1 encerrada, o próximo bloco natural é a **Etapa 2 (melhoria contínua)**:
1. **Design system de estados** (Loading/Empty/Error/Success/Confirm únicos) e consistência visual (cores/ícones/espaçamentos/contraste).
2. **Busca global ampliada** (briefings, coleções, profissionais) + atalhos de teclado por tela.
3. **Notificações reais** (briefing respondido por e-mail/push) quando SMTP/infra estiverem disponíveis.
4. **Instrumentação de produto** (funil cadastro → consentimento → onboarding → 1ª geração → briefing → Pass; erros por tela).
5. **Rodadas de teste com 5 usuários** por lote, usando `onda1/onda2/onda3-validate.mjs` como regressão automatizada.
