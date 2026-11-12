# ✅ Etapa 2 — Onda 3 (Busca ampliada, histórico de versões e instrumentação) — Execução

**Data:** 10/11/2026 · **Base:** `webapp-lovable` · **Escopo:** itens **2.5** (busca global e atalhos), **2.6** (histórico/versões por item) e **2.7** (instrumentação de funil e erros por tela) da Etapa 2, mais a base do **2.8** (regressão automatizada).
**Status:** concluída e validada (TypeScript, 64 testes, build e regressão em navegador real).

---

## 1. Busca global ampliada e atalhos (2.5)

Antes a busca ⌘K cobria só páginas e sugestões. Agora:

| Fonte | O que busca | Destino |
|---|---|---|
| Páginas | 17 destinos fixos | rota direta |
| Suas sugestões | pacotes/looks/planos (30 buscados, 8 exibidos) | rota por `kind` |
| **Coleções** | nome da coleção | `/collections` |
| **Lembretes** | título e data | `/settings` |
| **Briefings** | título, mensagem e nome de quem atende | `/profissionais` |
| **Profissionais** | nome, salão e profissão (somente ativos) | `/p/<slug>` |

- Cada fonte falha em silêncio (se uma consulta cair, as outras continuam), tem ícone, contagem e limite próprio.
- **Busca sem acento**: `estetica` encontra “Estética” (helpers normalizam NFD e minúsculas).
- **Atalho `?`** (fora de campos de digitação) abre a ajuda guiada via evento `aura:ajuda`; o diálogo de busca mostra o rodapé **“Ctrl/Cmd K — busca · ? — ajuda · Esc — fechar”**.
- Estado vazio com ação **“Buscar no Estúdio”**.

Novo `src/lib/busca.ts` (puro e testável) + `src/test/busca.test.ts` com **15 testes** (acentos, caixa, espaços, parcial, múltiplos campos, imutabilidade, limites).

## 2. Histórico e versões por sugestão (2.6)

Sem alterar o schema: a “versão” de uma sugestão é outra linha em `packages` criada a partir dela; o histórico confiável é a linha do tempo do mesmo `kind`.

- `src/lib/duplicar.ts`:
  - `duplicarSugestao(p)` cria uma cópia com `status: "new"`, `note: null`, título `"… · cópia"`, mesmo `content/context/kind/entry_mode` e **lote próprio** (`batch_id` é `NOT NULL` no schema — em vez de migrar, a cópia recebe um UUID, fora do agrupamento original).
  - `listarVersoes(userId, kind)` devolve as últimas 8 do mesmo tipo.
- `src/components/HistoricoSugestao.tsx`: seção **“Histórico e versões”** com linha do tempo (título, data, status), ações **Abrir** e **Duplicar**, botão **“Duplicar esta sugestão”** no item atual, toast de confirmação, estados de carregando/vazio/erro com retry.
- Integrado em: sugestão genérica, look de maquiagem, plano de cabelo, look de roupa e plano de tatuagem.

## 3. Instrumentação de funil e erros por tela (2.7)

Aproveita a tabela `audit_events` que o `logEvent` já alimenta — sem tabela nova e sem PII.

- `src/lib/instrumentacao.ts` (`iniciarInstrumentacao()` idempotente, tolerante a SSR):
  - registra `tela_visualizada` por rota (pathname sem query string), dedupe de 5 s;
  - captura `window.onerror`, listener `error` e `unhandledrejection` como `erro_tela`, mensagem truncada em 200 chars, dedupe de 30 s, **nunca lança**;
  - `/auth` e `/consent` só contam quando já há sessão.
- `src/lib/instrumentacao.functions.ts`: server fn `funilInstrumentacao()` só para admin (RPC `has_role`), agrega 7 dias: contagem por evento, série diária e o funil canônico `profile_created → onboarding_completed → recommendation_saved → recommendation_approved → feedback_given → suggestion_exported → briefing_sent`, com % do passo anterior. Sem permissão, devolve `{ ok:false, motivo }` em vez de quebrar.
- `src/routes/__root.tsx`: liga a instrumentação uma vez.
- `src/routes/_authenticated/admin.tsx`: nova seção **“Funil (7 dias)”** com cards em PT (nome, contagem, %), top 5 eventos e tabela diária — `CarregandoInline` / `EstadoErro` com retry / `Aviso` quando indisponível.

## 4. Regressão automatizada (2.8, base)

`.e2e/onda8-regressao.mjs` — **somente leitura** (não cria/edita dados): varre **24 rotas** exigindo 1 `h1`, ausência de `undefined/NaN/null/[object Object]` visível, erro sempre com “Tentar novamente”, **zero `pageerror`/`console.error`**, e mede tempo até o `h1`; testa **responsivo 375×812** em 5 telas (overflow horizontal + menu mobile), **busca ⌘K** com as seções novas, **estado vazio de busca** e fecha diálogos ao final.

---

## 5. Validação executada

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **8 arquivos / 64 testes / 0 falhas** (15 novos da busca) |
| `npm run build` | **sucesso** |
| Regressão `.e2e/onda8-regressao.mjs` | **118/120 PASS** na 1ª passada; 2 falhas reais de responsivo em `/settings` 375 px (2 botões com `whitespace-nowrap` e rótulo longo) — corrigidas (rótulos curtos + quebra de linha). Confirmação pós-correção: **120/120 PASS**. |

Timings da regressão (dev server frio na 1ª passada; 2ª passada com o servidor aquecido): média **~6,8 s** até o `h1`; melhor `/studio` (6,55 s), pior `/tatuagem` (8,03 s) — valores de `vite dev`, não de produção. Na re-execução final: **120/120 PASS**, com o responsivo de `/settings` em 375×812 aprovado (15 px de folga), 0 `pageerror`/`console.error` nas 24 rotas.

**Capturas:** `.e2e/shots-onda8/01-dashboard.png`, `02-settings.png`, `03-jornada.png`, `04-busca.png`, `05-mobile-dashboard.png`.

---

## 6. Limitações e pendências

1. **Funil não é validável ao vivo nesta conta** — a conta de teste não tem role `admin`; a seção mostra “Funil indisponível para esta conta.” (comportamento correto). A agregação fica pronta para quando houver conta admin.
2. **Dados nascem vazios**: `tela_visualizada`/`erro_tela` só existem a partir das primeiras navegações após esta versão; o painel pode abrir sem série histórica.
3. **Briefings na busca** dependem de dados da conta; a conta de teste não tinha nenhum na validação (Coleções, Lembretes e Profissionais apareceram).
4. **Busca é substring normalizada**, não fuzzy: “cfg” não acha “Configurações”. Acento/caixa e navegação por teclado funcionam.
5. **Atalho `?`** vale dentro do shell autenticado (onde o componente de busca vive); nas páginas públicas o botão flutuante de ajuda continua.
6. **Duplicação** é uma cópia nova (não é “mesma linha versionada”) — decisão explícita para não alterar schema; “restaurar” continua existindo no DNA Visual (`/dna/versoes`).
7. **Sem commit/push**, conforme `AGENTS.md`.

---

## 7. Estado da Etapa 2

| Item | Situação |
|---|---|
| 2.1 Design system de estados | ✅ concluído (Onda 1) |
| 2.2 Microcopy + guia de estilo | ✅ concluído (Onda 2) |
| 2.3 Contraste AA + foco visível | ✅ concluído (Onda 2) |
| 2.4 Simplificação progressiva | ✅ parcialmente entregue nas Ondas 1/3 da Etapa 1 (modo simples, “Mais opções”, onboarding gentil) |
| 2.5 Busca global e atalhos | ✅ concluído (Onda 3) |
| 2.6 Histórico/versões por item | ✅ concluído (Onda 3) |
| 2.7 Instrumentação | ✅ base concluída (Onda 3) |
| 2.8 Rodadas de teste | 🟡 regressão automatizada pronta; **rodada com 5 usuários reais** depende de recrutamento e não foi executada |
