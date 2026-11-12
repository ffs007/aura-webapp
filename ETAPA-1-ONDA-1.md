# ✅ Etapa 1 — Onda 1 (Ativação) — Execução

**Data:** 08/11/2026 · **Base:** `webapp-lovable` · **Escopo:** primeira onda da Etapa 1 do `RELATORIO-TESTE-PROFUNDO.md` (§12). O foco é **ativação**: reduzir o susto do primeiro contato e encurtar o caminho até o primeiro resultado.
**Status:** concluída e validada (TypeScript, build, 36 testes automatizados e 31 verificações em navegador real).

---

## 1. O que foi entregue

| Item do plano | O que mudou | Arquivos |
|---|---|---|
| **1.1 Onboarding gentil** | O cabeçalho dos passos não mostra mais “N pendente(s)”; mostra “Passo X de Y · encorajamento” e, quando há campo pulado no passo, a linha “Você pode pular — a Aura sugere e você ajusta depois.” A contagem total ficou só no resumo (“Faltam X respostas — sem problema…”). A apresentação vem primeiro e os campos de **barba/maquiagem são condicionais** (feminino esconde barba; masculino esconde maquiagem; sem escolha, os dois aparecem), inclusive no cálculo de pendências. Labels ganharam `htmlFor`/`id`, cards `aria-pressed`, grupos com `aria-labelledby`. | `src/lib/onboarding.ts`, `src/routes/_authenticated/onboarding.tsx`, `src/test/onboarding.test.ts` |
| **1.3 Packs prontos** | Nova biblioteca de **12 começos** (casamento, entrevista, primeira tatuagem, barba, festa, mudança de fase, trabalho, viagem, maquiagem, cabelo, teste rápido, autoestima) em `src/lib/packs.ts` + grade “Comece por aqui” no Estúdio e no dashboard vazio. Cada card leva a um ponto de partida já preenchido e editável. | `src/lib/packs.ts`, `src/components/StartPacks.tsx`, `studio.tsx`, `dashboard.tsx` |
| **1.2 Assistente guiado** | Botão flutuante **“?”** (canto inferior esquerdo, 48 px, `aria-label`) abre “Ajuda guiada” com 5 atalhos em linguagem de gente: evento, cabelo, primeira tatuagem, “não sei por onde começar” e “só explorar” — cada um explica em uma frase o que acontece e leva direto. | `src/components/GuiaRapidoAjuda.tsx`, `src/routes/__root.tsx` |
| **1.5 Feedback de fim de fluxo (parcial)** | Estúdio agora confirma “Suas sugestões estão prontas.” antes de abrir o dashboard; tatuagem confirma “Conceitos prontos!” antes de abrir o conceito; maquiagem/roupas/cabelo já tinham toast + destino. Padrão: **nunca terminar uma geração em silêncio**. | `studio.tsx`, `TattooWorkspace.tsx` |
| **1.6 Cotas/paywall transparentes (parcial)** | `webapp.estetica.sim` entrou em `LIMITES` (2) e `/estetica` ganhou **chip de cota** “Estética: restam X de 2 grátis”; a prova de barba agora rotula que consome **“Retrato (prova de barba)”**. | `src/lib/uso.functions.ts`, `estetica.tsx`, `barba.tsx` |
| **1.8 Menu mobile** | Header vira dois modos: desktop mantém nav + atalhos; abaixo de `md` aparece **logo + Trilhas + hambúrguer**. O hambúrguer abre um **drawer** com **Criar**, **Meus módulos**, **Ferramentas** e **Conta** (Trilhas, Configurações, Sair com “Saindo…”), fecha ao navegar, mantém `aria-current` e área de toque de 44 px. Fim da faixa horizontal que escondia o menu no celular. | `src/routes/_authenticated/route.tsx`, `src/components/AppMenu.tsx` |
| **1.9 Dashboard útil no vazio** | Quem não tem sugestões agora vê **“Vamos começar?”**, os **packs** e o banner do guia/Meu Modelo. Quem tem sugestões ganha **contagem por filtro** (“todas (3)”, “novas (2)”…), `aria-pressed`, **busca por título/resumo**, **ordenação** (recentes/antigas/status) e mensagem de “nenhum resultado” com “Limpar busca e filtros”. | `src/routes/_authenticated/dashboard.tsx` |
| **1.11 Acessibilidade (parcial)** | Formulários do onboarding com labels associados; cards de opção com estado; menu mobile e ajuda com nomes acessíveis; filtros do dashboard com `aria-pressed`; chip de cota com rótulo. | arquivos acima |

---

## 2. Validação executada

### 2.1 Estática
| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **6 arquivos / 36 testes / 0 falhas** (inclui 8 do onboarding) |
| `npm run build` | **sucesso** |
| `git diff` | 41 arquivos alterados (Etapa 0 + Onda 1), 2 novos componentes + `lib/packs.ts` |

### 2.2 Navegador real (Chromium via CDP, `localhost:8080`)
**31/31 verificações passaram.** Destaques:
- **Dashboard com dados:** contagens nos filtros, `aria-pressed`, busca “Aconchego” filtra, busca inexistente explica e oferece limpar, ordenação presente.
- **Estúdio com pack:** faixa “Começando pelo pack”, ocasião “casamento” pré-preenchida e seção “Comece por aqui”.
- **Ajuda guiada:** botão “?” abre o diálogo e o atalho “Primeira tatuagem” leva a `/tatuagem/perfil`.
- **Mobile 375 px:** hambúrguer visível, nav desktop oculta, drawer com Criar/Ferramentas/Conta, fecha ao clicar.
- **Estética:** chip “Estética: restam 2 de 2 grátis”.
- **Conta nova (fluxo real):** consentimento → onboarding **sem “18 pendentes”**; escolher Feminino esconde “Barba”; escolher Masculino esconde “Maquiagem”; `getByLabel("Altura")` funciona; resumo → salvar → **dashboard vazio com “Vamos começar?” + packs + guia**; clicar no pack abre o Estúdio preenchido.

Capturas: `.e2e/shots-onda1/` (01-dashboard, 02-studio-pack, 03-ajuda, 04-menu-mobile, 05-estetica-quota, 06-dashboard-vazio, 07-studio-conta-nova).

---

## 3. Limitações e o que ficou para as próximas ondas

1. **Packs e ajuda usam `<a href>`** para navegação interna (decisão para não depender da tipagem de rotas). Funciona, mas causa recarga completa; numa próxima rodada vale trocar por `Link` para navegação instantânea.
2. **1.4 (rascunho/retomada universal), 1.7 (conta: senha/e-mail/sessões/exportar dados), 1.10 (vocabulário único), 1.12 (profissionais no menu + busca) e o restante de 1.11 (a11y global) não entraram nesta onda** — seguem no plano, na Onda 2.
3. **“Esqueci minha senha”** continua bloqueado por SMTP; entra junto com 1.7 quando o envio de e-mail existir.
4. **Cota de estética:** o limite foi adicionado no front (`LIMITES` + chip), mas o gateway/Edge Function precisa usar o mesmo `task_id` (`webapp.estetica.sim`) para a contagem refletir o consumo real — ponto a validar no ambiente com backend.
5. **Contas de teste:** foram criadas contas descartáveis `teste.onda1.*@example.com` durante a validação (onboarding + dashboard vazio). Elas não foram excluídas (o fluxo de exclusão depende de `SUPABASE_SERVICE_ROLE_KEY`, ausente no ambiente local).
6. **Nenhum commit/push** — alterações na working tree, conforme `AGENTS.md`.

---

## 4. Próxima onda recomendada (Onda 2 — confiança e retomada)

1. **1.4 Rascunho/retomada universal** — intenção de tatuagem, passos da jornada, diário, notas e descrição do retrato com autosave local + “continuar de onde parei”.
2. **1.7 Painel de conta** — nome, e-mail, troca de senha, encerrar sessões, exportar dados com rótulo claro; “esqueci minha senha” junto com SMTP.
3. **1.12 Profissionais no menu + busca/listagem** — ponto de entrada fixo, listagem/busca por região e estados vazios de “Recebidos”.
4. **1.10 Vocabulário único + glossário aplicado** — sugestão/pacote, trilha, modelo, briefing, versão; padronizar status e CTAs.
5. **Restante de 1.11** — revisão de acessibilidade nas telas de conta, configurações, módulos e modais.
6. **Restante de 1.5/1.6** — cartão de paywall com preço/link em todas as telas de IA; “abrir resultado” padronizado em maquiagem/roupas.

Cada item deve manter a rotina de validação desta onda: `tsc` + `vitest` + `build` + roteiro de navegador (o script `onda1-validate.mjs` pode ser reaproveitado como regressão).
