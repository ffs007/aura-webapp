# ✅ Etapa 1 — Onda 2 (Confiança e Retomada) — Execução

**Data:** 09/11/2026 · **Base:** `webapp-lovable` · **Escopo:** segunda onda da Etapa 1 do `RELATORIO-TESTE-PROFUNDO.md` (§12). O foco é **não perder trabalho, dar controle da conta e tornar a rede de profissionais alcançável**.
**Status:** concluída e validada (TypeScript, build, 36 testes automatizados e 29 verificações em navegador real).

---

## 1. O que foi entregue

| Item do plano | O que mudou | Arquivos |
|---|---|---|
| **1.4 Rascunho/retomada universal** | Novo hook `useRascunho` (localStorage com debounce de 700 ms, validade de 7 dias, chave por usuário). Formulários que perdiam tudo ao sair agora **salvam e retomam** automaticamente, com indicador “Rascunho salvo às HH:MM” e “Descartar rascunho”: intenção de **tatuagem**, **plano da jornada**, **reflexão do diário**, **notas/adaptação do pacote**, **descrição do retrato** e **campos do Estúdio**. Ao concluir a ação, o rascunho é limpo. | `src/hooks/useRascunho.ts`, `TattooWorkspace.tsx`, `JourneyWorkspace.tsx`, `package.$id.tsx`, `retrato.tsx`, `studio.tsx` |
| **1.7 Painel de conta** | Nova seção **“Conta”** em Configurações: nome (salvo no perfil), e-mail atual + troca com confirmação, troca de senha (mín. 8, confirmação e erros em PT-BR), **sair dos outros dispositivos** e **exportar meus dados em JSON** (23 tabelas, sem imagens), com aviso honesto do que está incluído. | `settings.tsx`, `aura.functions.ts` |
| **1.7 Recuperação de senha** | Link **“Esqueci minha senha”** no login, modo de recuperação com mensagem honesta (“Se este e-mail tiver conta, enviamos um link…”) e nova rota pública **`/redefinir-senha`**: com sessão de recuperação, define a nova senha; sem sessão, explica como abrir o link (expiração/SMTP). | `auth.tsx`, `src/routes/redefinir-senha.tsx` |
| **1.10 Vocabulário + glossário** | Novo `glossario.ts` com 12 termos canônicos; seção **“Glossário do Aura ID”** no `/guia`. Padronização visível: “Convites fresquinhos” → **“Sugestões novas”**, “pacotes visuais” → “sugestões visuais”, export `aura-id-plano.md` → **`aura-id-sugestoes.md`**, metas e eventos alinhados; “pacote” deixou de aparecer como sinônimo confuso ao usuário. | `src/lib/glossario.ts`, `guia.tsx`, `dashboard.tsx`, `export.tsx`, `package.$id.tsx`, `settings.tsx` |
| **1.12 Profissionais no menu e busca** | **Profissionais** entrou na navegação fixa (desktop e menu mobile). A página ganhou aba **“Buscar”** (busca por nome/salão + filtro de profissão, cards com “Ver perfil” e “Enviar briefing”, estados vazios com convite ao cadastro) e a aba **“Recebidos” agora aparece sempre**, com estado vazio explicativo e CTAs. Nova server fn `listarTodosProfissionais`. | `trilhas.ts`, `AppMenu.tsx`, `profissionais.tsx`, `profissionais.functions.ts` |
| **1.11 Acessibilidade (parte)** | `aria-label` explícito nos switches de consentimento (Configurações e Consentimento) e no “Autorizar meu modelo visual”; labels associados no painel de conta. | `settings.tsx`, `consent.tsx`, `modelo.tsx` |
| **1.6 Cotas/paywall (resto)** | Componente único **`PaywallCard`** (mensagem + preço + link do Aura Pass) integrado às telas de geração de **maquiagem, cabelo, roupas, tatuagem e estética**: erro de cota deixa de ser um toast solto e vira um cartão com próximo passo. | `components/PaywallCard.tsx`, `maquiagem/gerar.tsx`, `cabelo/gerar.tsx`, `roupas/gerar.tsx`, `tattoo/TattooWorkspace.tsx`, `estetica.tsx` |

---

## 2. Validação executada

### 2.1 Estática
| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** (routeTree regenerado com `/redefinir-senha`) |
| `npx vitest run` | **6 arquivos / 36 testes / 0 falhas** |
| `npm run build` | **sucesso** |

### 2.2 Navegador real (Chromium via CDP, `localhost:8080`)
**29/29 verificações passaram.** Destaques:
- **Rascunhos:** Estúdio, pacote (nota), tatuagem (intenção), jornada (nome do plano) e retrato (descrição) salvam, mostram o status e **restauram após sair e voltar**; “Descartar rascunho” limpa corretamente.
- **Conta:** seção Conta presente; salvar nome persiste após reload; troca de senha bloqueia menos de 8 caracteres; **exportar dados baixa JSON** com `dados`.
- **Recuperação:** modo “Recuperar acesso” abre; mensagem honesta após enviar; `/redefinir-senha` sem sessão orienta “Abra pelo link do e-mail”.
- **Profissionais:** aba Buscar com campo/select, aba Recebidos sempre visível com estado vazio explicativo, “Profissionais” na nav desktop.
- **Vocabulário:** glossário no guia; batch como “Sugestões novas”; export baixa `aura-id-sugestoes.md`.

Capturas: `.e2e/shots-onda2/` (01-pacote-rascunho, 02-retrato-rascunho, 03-conta, 04-recuperar, 05-profissionais, 06-vocabulario).

---

## 3. Limitações e pendências

1. **SMTP do Supabase não está configurado no ambiente**: a UI de recuperação é honesta, mas o e-mail com link pode não chegar. A troca de senha/e-mail em produção depende dessa configuração.
2. **Troca de senha não foi executada de ponta a ponta** (para não alterar a senha da conta de teste); foi validada a regra de bloqueio e os fluxos de UI. Recomenda-se testar em conta descartável com SMTP ativo.
3. **PaywallCard** não pôde ser disparado ao vivo porque a conta de teste não esgotou a cota; validação foi por código/build. Vale forçar cota esgotada em ambiente de teste.
4. **Aba Buscar de profissionais** não exibiu cards reais porque **não há profissionais ativos publicados** no banco no momento; busca, filtros, estados vazios e navegação foram validados.
5. **Rascunhos são locais do navegador** (localStorage, 7 dias), não sincronizam entre dispositivos — decisão consciente para esta onda.
6. **Sem commit/push**; alterações na working tree, conforme `AGENTS.md`.
7. Test data: o nome da conta de teste passou a “Aura Teste E2E” durante a validação; rascunhos de teste permanecem no navegador usado (o perfil de teste é descartado).
8. Ainda não entraram: notificações/sino de briefing, lembretes reais por e-mail, busca global, atalhos de teclado, revisão completa de contraste e o restante da acessibilidade de módulos.

---

## 4. Próximo passo recomendado (Onda 3 / fechamento da Etapa 1)

1. **Notificações e retomada de ciclo** — sino com briefing respondido/orçamento recebido, badge e link direto; lembretes reais por e-mail (junto com SMTP).
2. **Busca global e atalhos** (`⌘K`) por sugestões, planos, briefings e páginas.
3. **Modo Simples × Completo** para reduzir sobrecarga de quem começa.
4. **Revisão completa de acessibilidade** (contraste, foco, tabs, modais, sliders) e de microcopy.
5. **Teste ponta a ponta de conta** em ambiente com SMTP + service role: recuperação, troca de e-mail/senha e exclusão de conta.

Cada onda mantém a rotina: `tsc` + `vitest` + `build` + roteiro de navegador (`onda2-validate.mjs` serve de regressão).
