# Auditoria de fluxos por módulo — Aura ID (webapp)

**Data da leitura:** 08/11/2026 · **Alvo:** `webapp-lovable` (TanStack Start + React 19 + Tailwind + Supabase) · **Escopo:** task-2 — módulos de criação e jornada.
**Método:** auditoria **estática** do código real (sem navegador, sem servidor, sem build). Nada aqui descreve comportamento observado em runtime; descreve o que o código determina e o que depende de runtime fica marcado.
**Fontes lidas integralmente:** os 46 arquivos de rota de `src/routes/_authenticated/{maquiagem,cabelo,roupas,tatuagem,jornada,dna}`, `barba.tsx`, `estetica.tsx`, `retrato.tsx`, `modelo.tsx`, `studio.tsx`, `package.$id.tsx`, `collections.tsx`, `compare.tsx`, `export.tsx`, `profissionais.tsx`, `_authenticated/route.tsx`; os componentes `tattoo/{TattooWorkspace,TattooPlanView,TattooPhotos}`, `journey/JourneyWorkspace`, `PackageView`, `PhotoUploader`, `GenerationPresentation`, `PresentationChoice`, `ReferenceImage`, `TrilhaPicker`, `QuotaChip`, `Confirm`, `EnviarBriefing`, `JornadaEstetica`; e as libs `aura.ts`, `trilhas.ts`, `presentation.ts`, `makeup.ts`, `hair.ts`, `clothing.ts`, `tattoo.ts`, `journey.ts`, `usage` (`uso.functions.ts`), `ai.server.ts`, `stripe.functions.ts` e as server functions dos módulos (`makeup`, `hair`, `clothing`, `tattoo`, `beard`, `estetica`, `journey`, `aura`, `references`, `modelo`, `retrato`, `vitrine`, `catalogo`).
**Relação com `02-frontend.md`:** li o documento inteiro e **não repito** a análise de inventário/estado por tela. O que trago é (a) fluxo de criação passo a passo por módulo com campos, ações e confirmações; (b) verificação das afirmações de 02 (seção 5.1); (c) achados novos não cobertos lá. Onde 02 está correto, marco "confere".

**Legenda de evidência:** [C] confirmado no código · [I] inferido (depende de runtime/dados) · [A] ausente (procurei e não existe) · [NV] não verificável neste workspace (gateway/Edge Functions, RLS, banco remoto).

**Limites deste documento (declarados):** (1) as 9 tabelas de módulo sem migração (`hair_*`, `style_*`, `wardrobe_items`, `style_analyses`, `tattoo_designs`, `estetica_*`, `briefing_*`) não têm RLS auditável aqui — toda conclusão de isolamento é [NV]; (2) a **cota real** é aplicada no Edge Function `ai-gateway` (fora do repo) e só o *contador* está no webapp — não sei se o gateway conta texto, falha ou retry [NV]; (3) `style_analyses.done`, `tattoo_projects.checkpoints`, `packages.context.brief_confirmado` existem no código; a coluna `done` de `style_analyses` não pude confirmar no schema [NV]; (4) não executei build/lint (tarefa-3).

---

## 0. Números e cobertura

| Item | Número | Evidência |
|---|---|---|
| Arquivos de rota lidos | 59 (48 dos 6 módulos + 11 transversais do escopo) | árvore `src/routes/_authenticated` |
| Abas de módulo | Maquiagem 6 · Cabelo 4 · Roupas 7 · Tatuagem 7 (+Vitrine fora da nav) · Jornada 6 · DNA 6 | `maquiagem/route.tsx:8-11`, `cabelo/route.tsx:8`, `roupas/route.tsx:8-11`, `tatuagem/route.tsx:5`, `JourneyWorkspace.tsx:21`, `dna/route.tsx:9-16` |
| Superfícies de geração de **texto** | 13 (studio, dna, makeup look/assinatura/kit, hair plan, outfits, gaps, purchase, missions, tattoo plan, journey suggest/report) | `callJson` em `makeup.functions` (3×), `hair.functions`, `clothing.functions` (4×), `tattoo.functions:40`, `journey.functions:63,117`, `aura.functions:87,143` |
| Superfícies de geração de **imagem** | 7 tasks: 6 em `LIMITES` + `webapp.estetica.sim` fora da tabela | `uso.functions.ts:11-18`; `estetica.functions.ts:70` |
| Ações destrutivas no escopo | 11 sem confirmação · 14 com `Confirm` · 2 `window.confirm` (jornada estética, design da vitrine) | §13 F09 e matriz §14.1 |
| Entradas de navegação dos módulos | 7 por trilha (maquiagem, coleções, cabelo, roupas, tatuagem, vitrine, jornada, barba) + DNA fixo + 3 só como botão do header (estética, modelo, retrato); `/profissionais` sem nenhuma entrada | `trilhas.ts:23-56,84-91`; `route.tsx:56-59` |

---

## 1. Mapa de navegação dos módulos (o que existe, por onde entra)

| Módulo | Entradas possíveis | Abas / telas | Observação de alcance |
|---|---|---|---|
| Maquiagem | Trilha **Visual** (`trilhas.ts:24`) → `/maquiagem` + CTA dos vazios; Estúdio desvia p/ `/maquiagem/gerar` (`studio.tsx:39`) | Looks · Gerar · Perfil de pele · Assinatura · Kits · Manual (`maquiagem/route.tsx:9-10`) | módulo inteiro invisível se o usuário não escolheu a trilha Visual (ou clicou "Agora não") |
| Cabelo | Trilhas **Cabelo** (`trilhas.ts:33`) e **Barbearia** (`:54`) | Planos · Novo plano · Perfil capilar · Alertas (`cabelo/route.tsx:8`) | duplicado em duas trilhas → pode aparecer 2× no header (`linksVisiveis` sem dedupe, `trilhas.ts:93-96`) |
| Roupas | Trilha **Estilo** (`trilhas.ts:41`) | Looks · Gerar · Guarda-roupa · Perfil de estilo · Peças-chave e cápsula · Compra consciente · Missões (`roupas/route.tsx:8-11`) | 7 abas com rolagem horizontal; nenhuma outra entrada |
| Tatuagem | Trilha **Estilo** (`trilhas.ts:42`), card do dashboard, `/export` (briefing), `/tatuagem/vitrine` (fora da nav do módulo) | Projetos · Intenção · Conceitos · Referências · Decisão · Briefing · Cuidados (`tatuagem/route.tsx:5`) + Vitrine | **Vitrine só é alcançável pelo header (trilha Estilo)**; não há link no módulo (`tatuagem/route.tsx:5`) |
| Jornada | Trilha **Estilo** (`trilhas.ts:44`) | Início · Objetivo e plano · Diário visual · Antes e depois · Relatórios · Linha do tempo + Plano/Relatório por id (`JourneyWorkspace.tsx:21`) | 6 telas de leitura; 2 detalhes |
| DNA Visual | Fixo no menu (`trilhas.ts:87`) | Resumo · Preferências · Linha do tempo · Permissões · Versões · Redefinir (`dna/route.tsx:9-16`) | bem alcançável; banner de revisão só dentro do módulo (`dna/route.tsx:30-34`) |
| Barba | Trilha **Barbearia** (`trilhas.ts:53`) | página única (perfil + provador + briefing + planos) (`barba.tsx:69-94`) | não tem layout/abas; planos abrem em `/package/$id` (fora do módulo) |
| Estética | Apenas botão do header (`route.tsx:56`) | página única (medir → simular → briefing → jornada) (`estetica.tsx:117-233`) | fora de todas as trilhas; módulo "órfão" de trilha |
| Retrato / Modelo | Botões do header (`route.tsx:57-58`) | página única cada | não constam de trilha nem de aba |
| Profissionais | **Nenhum link no menu**; único link em `/p/$slug` (`p.$slug.tsx:45`) | 4 abas internas (Meus envios · Recebidos · Vitrine do estúdio · Cadastro) (`profissionais.tsx:197-202`) | órfão: toasts de briefing mandam para lá (`EnviarBriefing.tsx:54`, `vitrine.tsx:81`) |

**Consequência para a auditoria de fluxo:** qualquer módulo pode não existir para o usuário dependendo de uma escolha feita uma única vez em `TrilhaPicker` (com a saída "Agora não" em `TrilhaPicker.tsx:55`). Dentro do escopo, isso atinge maquiagem, cabelo, roupas, tatuagem e jornada — cinco dos nove fluxos analisados.

---

## 2. Módulo Maquiagem (`/maquiagem/*`)

### 2.1 Mapa de telas

| Rota | Papel | Estados implementados | Evidência |
|---|---|---|---|
| `/maquiagem` | Biblioteca de looks | skeleton 2 cards · erro · vazio com 2 CTAs · filtro por status | `maquiagem/index.tsx:29,30,32-38,42` |
| `/maquiagem/gerar` | Gerador (texto) | busy no CTA · aviso de perfil vazio · **sem estado de erro persistente** (só toast) | `maquiagem/gerar.tsx:39-47,52-54,87-88` |
| `/maquiagem/perfil` | Perfil de pele/alergias | skeleton · sem vazio (form sempre) · erro só por toast | `maquiagem/perfil.tsx:38-44,53` |
| `/maquiagem/assinatura` | Assinatura pessoal | skeleton · vazio explicativo · erro só por toast | `maquiagem/assinatura.tsx:44,51` |
| `/maquiagem/kits` | Kits de confiança | skeleton · vazio "Nenhum kit ainda." · erro só por toast | `maquiagem/kits.tsx:42` |
| `/maquiagem/manual` | Manual imprimível | skeleton · vazio · **sem tratamento de erro** (`q.data!`) | `maquiagem/manual.tsx:27-29` |
| `/maquiagem/look/$id` | Detalhe + reação | skeleton · "não existe mais" · erro só por toast | `maquiagem/look.$id.tsx:31-32` |

### 2.2 Fluxo de criação (começo → meio → fim)

1. **Começo:** `/maquiagem` vazio oferece **"Perfil de pele"** e **"Gerar looks"** (`index.tsx:36`) — a ordem sugerida é perfil antes de gerar.
2. **Perfil (2 min declarados no header do vazio, `index.tsx:35`):** 6 chips de pele + 5 de acabamento + 2 sliders + 5 textareas/inputs; **nenhum obrigatório**; "Salvar perfil de pele" faz `upsert` e dispara toast (`perfil.tsx:38-44`). Existe "Excluir dados de alergia" com confirmação (`perfil.tsx:65`).
3. **Geração:** escolher **modo** (10 cartões: `makeup.ts:1-12`), **Rápido/Detalhado** (`gerar.tsx:66-69`), ocasião, intensidade (slider 1–5), luz, humor e "Algo mais?" (só no Detalhado: `gerar.tsx:75-81`); fotos de rosto opcionais dentro do Detalhado (`gerar.tsx:83`).
4. **Fim:** "Gerar looks" (`gerar.tsx:87`) → `generateMakeupLooks` cria **3 looks** por chamada (`makeup.functions.ts:69,79-82`) → toast "Looks prontos!" e **volta para a lista** (`gerar.tsx:44-45`). O usuário **não vê o resultado gerado**: cai na lista e tem de reconhecer o card.
5. **Iteração:** abrir look → 3 variações com checklist/ordem (`look.$id.tsx:72-85`) → status (§2.5) → feedback "Depois de usar" (`look.$id.tsx:111-119`) que pode alimentar o DNA.

**O que o usuário vê em cada etapa:** no passo 3, um formulário de uma tela com 10 cartões e um slider, sem prévia do que vai ser gerado e **sem contador de uso**; no passo 4, apenas um toast e a lista.

### 2.3 Campos

| Campo | Obrigatório? | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Modo | sim (default `5min`) | lista fixa | — | `gerar.tsx:28,59` |
| Ocasião | não | `max(300)` no server | gera mesmo assim | `gerar.tsx:73`; `makeup.functions.ts:59` |
| Intensidade | sim (default 2) | 1–5 no server | — | `gerar.tsx:31,74`; `makeup.functions.ts:59` |
| Luz / humor / "Algo mais" | não | `max(30/40/800)` | gera mesmo assim | `gerar.tsx:77-79`; `makeup.functions.ts:60` |
| Perfil de pele | **não bloqueia** — só aviso | nenhuma | sugestões "menos seguras" | `gerar.tsx:52-54`; `makeup.functions.ts:48` |
| Fotos do rosto | não | nenhuma (aceita qualquer `image/*`) | `fotos_de_rosto: 0` | `gerar.tsx:83`; `makeup.functions.ts:74` |
| Perfil (campos) | nenhum | nenhuma | salva perfil vazio | `perfil.tsx:38-44` |
| Look: nota/feedback | não | nenhuma | feedback parcial aceito | `look.$id.tsx:44-58` |
| Assinatura: edição | — | **JSON cru** parseado | "Formato inválido." | `assinatura.tsx:35-42,65-68` |

### 2.4 Cotas e custos

| Ação | Consome | Contador visível? | Evidência |
|---|---|---|---|
| Gerar looks (3 por chamada) | texto/IA — **sem cota client-side** | **não** | `gerar.tsx:87`; `uso.functions.ts:11-18` não tem task de texto |
| Gerar assinatura | texto | não | `assinatura.tsx:50` |
| Criar kit | texto | não | `kits.tsx:41` |
| Gerar imagem de referência (por variação) | `webapp.reference.render` (5) | sim, dentro do `ReferenceImage` | `ReferenceImage.tsx:243`; `uso.functions.ts:12` |
| Briefing de salão via imagem | `pos_geracao_guia` (texto) | não | `ReferenceImage.tsx:47` |

Mensagem no 402 de texto: "Você usou suas gerações gratuitas. O Aura Pass libera mais." (`ai.server.ts:22`) chega **apenas como toast** (`gerar.tsx:43`), sem cartão de paywall e sem link — diferente das telas de imagem (ver §11.4).

### 2.5 Ações disponíveis

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Gerar looks | botão accent | — | gera novo lote | toast "Looks prontos!" + volta à lista | `gerar.tsx:39-46,87` |
| Salvar look | botão "Salvar" | — | sim (status pode ser trocado) | toast "Atualizado" + status na tela | `look.$id.tsx:101,108` |
| Aprovar | "Aprovar — vou testar" | — | sim | toast; **registra evento `look_saved`** (não `look_approved`) | `look.$id.tsx:102` |
| Rejeitar | "Não é para mim" | — | sim | toast | `look.$id.tsx:104` |
| Rejeição suave | "Bonito, mas não prático" / "Desmarcar" | — | sim | toast | `look.$id.tsx:103` |
| Comparar | link "Comparar" → `/compare` | — | — | — | `look.$id.tsx:106` |
| Exportar | baixa `.md` via `lookToMarkdown` | — | — | download | `look.$id.tsx:105` |
| Nota | textarea + "Salvar nota" | — | sim | toast | `look.$id.tsx:109` |
| Feedback | 2 sliders + texto + "Enviar feedback" | — | não (insere) | toast + sinal no DNA | `look.$id.tsx:44-58,118` |
| **Apagar look** | **[A] não existe** | — | — | — | grep `delete` em `look.$id.tsx` = 0 |
| Colecionar | **[A] não existe no detalhe** (só em `/collections`) | — | — | — | `look.$id.tsx:100-107` |
| Duplicar/adaptar | **[A]** | — | — | — | idem |
| Histórico/versões | **[A]** (só a lista de looks) | — | — | — | `index.tsx:43-56` |
| Restaurar | **[A]** | — | — | — | — |
| Assinatura: atualizar | botão "Gerar minha assinatura"/"Atualizar assinatura" | — | insere nova linha (histórico cresce) | sem toast de sucesso na edição | `assinatura.tsx:28-34,35-42,50` |
| Kit: excluir | botão "Excluir" no card | **não** | não | nenhum (sem toast) | `kits.tsx:36,48` |
| Kit: criar | 6 presets + campo livre | **não** (clique gera na hora) | — | só lista atualiza | `kits.tsx:40-41` |
| Manual: baixar/imprimir | botões, desabilitados se vazio | — | — | download/print | `manual.tsx:33-36` |

### 2.6 Dead ends e loops

- **Fim de geração sem prévia:** o destino é `/maquiagem` (`gerar.tsx:45`), não o look recém-criado — o usuário precisa descobrir qual dos cards é o novo (ordenados por `created_at`, `index.tsx:24`).
- **"Detalhado" esconde campos:** luz, humor, "Algo mais?" e fotos somem no modo Rápido (`gerar.tsx:75-83`) sem indicar que existem; quem começa no Rápido nunca os vê.
- **Perfil vazio não bloqueia e o banner some ao salvar vazio:** o aviso usa `select("user_id")` (`gerar.tsx:37`) — basta existir a linha, então salvar o formulário 100% vazio **silencia o aviso** embora o perfil continue vazio.
- **Assinatura é um beco de edição:** "Editar" abre `Textarea` com JSON (só `name`, `essence`, `finish`) (`assinatura.tsx:65-68`); não há validação de campos obrigatórios e `saveEdit` faz **insert de uma nova assinatura** (`:38`) — o "Histórico" (`:71-73`) lista nomes antigos sem ação de ver/restaurar; e **não há toast de sucesso** no caminho feliz.
- **Kits sem confirmação e sem excluir com confirmação:** clicar em "Kit bolsa" já dispara uma geração de texto (`kits.tsx:40`), e "Excluir" apaga direto (`:36,48`).
- **Manual quebra:** `const d = q.data!` sem check de erro (`manual.tsx:28`) — erro de rede vira tela em branco.
- **Loop de status:** `update()` recria o card e o toast "Atualizado" mas não mostra qual ação foi feita; 4 botões lado a lado sem hierarquia (`look.$id.tsx:100-107`).

---

## 3. Módulo Cabelo (`/cabelo/*`)

### 3.1 Mapa de telas

| Rota | Papel | Estados | Evidência |
|---|---|---|---|
| `/cabelo` | Lista de planos + banner de alertas vencidos | skeleton · erro · vazio 2 CTAs · **sem filtros** | `cabelo/index.tsx:22-23,28-38` |
| `/cabelo/gerar` | Gerador (texto) | busy · aviso de perfil vazio · erro só toast | `cabelo/gerar.tsx:33-41,46` |
| `/cabelo/perfil` | Perfil capilar | skeleton · sem vazio · erro toast · exclusão com `Confirm` | `cabelo/perfil.tsx:45,67` |
| `/cabelo/alertas` | Lembretes | lista direta, **sem loading e sem erro** | `cabelo/alertas.tsx:18,32-46` |
| `/cabelo/plano/$id` | Plano completo | skeleton · "não encontrado" · **status sem checar erro** | `cabelo/plano.$id.tsx:29-37` |

### 3.2 Fluxo de criação

1. **Começo:** `/cabelo` vazio → "Perfil capilar" (outline) e "Criar plano" (accent) (`index.tsx:37`), com a promessa "leva dois minutos" (`:36`).
2. **Perfil:** textura, comprimento, 4 níveis (química/descoloração/calor/couro), 2 sliders, imagem desejada, **checkbox "modo barbearia"** (`perfil.tsx:53-66`) + 2 `PhotoUploader` (fotos e inspirações, `:69-70`). Nada obrigatório.
3. **Geração:** 10 objetivos (`hair.ts:1-12`), humor, texto livre; aviso se perfil vazio (`gerar.tsx:46-60`); CTA "Gerar plano" (`:63`).
4. **Fim:** redireciona para **o plano** (`gerar.tsx:39`) — diferente de maquiagem, que volta à lista. O plano mostra 3 propostas + timeline + guia de salão + rotina + "Como foi?" (`plano.$id.tsx:72-121`).
5. **Briefing:** imagem por proposta (`ReferenceImage look`, `plano.$id.tsx:92`) → "💚 Gostei — e agora?" → "Briefing para o salão" (`ReferenceImage.tsx:256`) → `EnviarBriefing`.

### 3.3 Campos e validações

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Objetivo | sim (default `gradual`) | lista de 10 | — | `gerar.tsx:26` |
| Humor | sim (default `curious`) | lista | — | `gerar.tsx:28` |
| Desejo livre | não | `max(800)` | gera | `gerar.tsx:59`; `hair.functions.ts:41` |
| Perfil capilar | **não bloqueia** (aviso) | nenhuma | `perfil_capilar: "não preenchido"` | `gerar.tsx:46`; `hair.functions.ts:60` |
| Perfil: todos os campos | nenhum | nenhuma | salva vazio | `cabelo/perfil.tsx:33-38` |
| Alerta: data | gerada automaticamente | — | — | `alertas.tsx:21-26` |
| Feedback do plano | nota 1–5 obrigatória | `if (!rating)` | toast "Escolha uma nota." | `plano.$id.tsx:43-48` |

### 3.4 Cotas

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| Gerar plano (texto) | sem cota client-side | **não** | `gerar.tsx:63`; `uso.functions.ts:11-18` |
| Imagem de referência | `webapp.reference.render` (5) | sim (dentro do `ReferenceImage`) | `plano.$id.tsx:92`; `uso.functions.ts:12` |
| Briefing/guia pós-geração | texto | não | `ReferenceImage.tsx:47` |

### 3.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Salvar plano | "Salvar" | — | sim | toast "Plano salvo" | `plano.$id.tsx:62` |
| Rejeitar | "Não é para mim" | — | sim | toast "Ideia descartada — vamos evitar algo parecido" | `plano.$id.tsx:36,63` |
| **Erro do status é engolido** | — | — | — | toast de sucesso mesmo se o `update` falhar | `plano.$id.tsx:33-37` |
| Baixar guia | "Baixar guia de salão" `.md` | — | — | download | `plano.$id.tsx:64` |
| Imprimir | `window.print()` | — | — | print | `plano.$id.tsx:65` |
| Excluir plano | `Confirm` | **sim** | não | toast + volta à lista | `plano.$id.tsx:66,49-52` |
| Feedback | 1–5 + texto | — | não | toast | `plano.$id.tsx:116-121` |
| Ativar alerta | "Ativar" | — | sim (desativar) | toast "Alerta ativado" | `alertas.tsx:21-26` |
| Alerta "Feito" | recalcula `next_at` | — | sim | **nenhum feedback** e **sem checar erro** | `alertas.tsx:27-29` |
| Desativar alerta | "Desativar" | **não** | não | toast "Alerta removido"; **sem checar erro** | `alertas.tsx:30,41` |
| Excluir perfil | `Confirm` | sim | não | toast | `cabelo/perfil.tsx:67,39-44` |
| Comparar/colecionar/duplicar | **[A]** no módulo (só `/compare` global) | — | — | — | `cabelo/plano.$id.tsx:61-67` |

### 3.6 Dead ends e loops

- **Lista sem filtro:** 6+ planos ficam em ordem cronológica sem filtro por status (`index.tsx:40-52`), ao contrário de maquiagem (`index.tsx:42`) e roupas (`index.tsx:38`).
- **"Feito" silencioso:** o botão mais usado do módulo (`alertas.tsx:41`) não dá feedback e não trata erro — o usuário não sabe se reagendou.
- **Modo barbearia duplicado:** o mesmo conceito existe como checkbox em `/cabelo/perfil:66`, página `/barba` e `beard_preference` no onboarding; o objetivo "Modo barbearia" (`hair.ts:11`) também está na lista de 10 — três portas.
- **Plano não tem histórico de versões:** "Salvar" sobrescreve `status`; não há como voltar ao estado anterior de rejeitado→salvo.
- **Briefing de salão a partir da imagem** exige gerar imagem (custo) antes — o guia de salão em texto já existe e é grátis (`plano.$id.tsx:103-109`), mas não oferece "enviar briefing" direto.
- **Alertas por e-mail inexistentes:** texto admite "ainda não estão conectados" (`alertas.tsx:34`) — promessa do guia §3.4 fora do app.

---

## 4. Módulo Roupas (`/roupas/*`)

### 4.1 Mapa de telas

| Rota | Papel | Estados | Evidência |
|---|---|---|---|
| `/roupas` | Looks | skeleton · erro · vazio 2 CTAs · filtro 6 status + banner "em teste" | `roupas/index.tsx:23-38` |
| `/roupas/gerar` | Gerador | busy · aviso de guarda-roupa vazio | `roupas/gerar.tsx:34-41,45` |
| `/roupas/perfil` | Perfil de estilo | skeleton · sem vazio/validação | `roupas/perfil.tsx:37-43` |
| `/roupas/armario` | Guarda-roupa | skeleton da lista · vazio · gate de consent de foto | `roupas/armario.tsx:30-31,75,81` |
| `/roupas/lacunas` | Análise de lacunas/cápsula | botão busy · vazio · **sem estado de erro** | `roupas/lacunas.tsx:25-34` |
| `/roupas/compra` | Checklist pré-compra | **sem loading e sem erro na lista** | `roupas/compra.tsx:26,44` |
| `/roupas/missoes` | Missões semanais | **sem loading e sem erro** | `roupas/missoes.tsx:22-32` |
| `/roupas/look/$id` | Detalhe + status | skeleton · "não encontrado" | `roupas/look.$id.tsx:34-35` |

### 4.2 Fluxo de criação

1. **Começo:** vazio oferece "Guarda-roupa" e "Gerar looks" (`index.tsx:31`), mas o guarda-roupa é 100% manual e é o gargalo: 7 categorias + nome/cor/tecido/formalidade + foto opcional (`armario.tsx:65-77`), sem importação.
2. **Perfil:** 9 inputs de texto livre (`perfil.tsx:18-28`), nenhum obrigatório.
3. **Geração:** ocasião (9), clima (4), humor, "Algo mais?" (`gerar.tsx:46-49`); aviso se guarda-roupa vazio (`:45`); CTA (`:50`).
4. **Fim:** toast + **volta para a lista** (`gerar.tsx:39`); usuário abre o card (`index.tsx:43`).
5. **Dentro do look:** 3 versões com peças marcadas **"seu"** (do armário) ou **"ideia"** (`look.$id.tsx:70`), calçado/bolsa/acessórios, variações de clima (`:74-80`); 5 status (`:58-60`); feedback (`:81-87`).
6. **Ramificações:** `ReferenceImage look` → imagem + "💚 Gostei" → guia "Buscar peça parecida" (`ReferenceImage.tsx:257`) → catálogo parceiro → "Provar em mim" (`:301-304`) → "Ver na loja" com UTM (`:309`).
7. **Análises paralelas:** lacunas/cápsula (`lacunas.tsx:24-50`) e compra consciente (`compra.tsx:44-60`), cada uma uma chamada de IA.

### 4.3 Campos e validações

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Ocasião | sim (default "Trabalho") | lista de 9 | — | `gerar.tsx:25` |
| Clima | sim (default "Ameno") | lista 4 | — | `gerar.tsx:26` |
| Humor / extra | não | `max(600)` | gera | `gerar.tsx:48-49` |
| Guarda-roupa | **não bloqueia** | contagem `=== 0` para avisar | looks com `from_wardrobe=false` | `gerar.tsx:31,45` |
| Peça: nome | **sim** | toast "Dê um nome à peça." | não insere | `armario.tsx:43` |
| Peça: categoria/cor/tecido/formalidade | não (defaults) | nenhuma | insere | `armario.tsx:22` |
| Peça: foto | não | **sem consent → ignorada em silêncio** | texto "ative o processamento" só aparece no uploader | `armario.tsx:45,75` |
| Perfil de estilo | nenhum | nenhuma | salva vazio | `roupas/perfil.tsx:37-42` |
| Compra: peça | sim (`length<2`) | toast "Descreva a peça." | não chama IA | `compra.tsx:28` |
| Compra: preço/motivo | não | `max(40/400)` | — | `compra.tsx:39-40` |
| Missões | — | — | — | `missoes.tsx:23-27` |

### 4.4 Cotas

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| Gerar looks (texto, 3 por vez) | sem cota client-side | não | `gerar.tsx:50`; `uso.functions.ts:11-18` |
| Analisar guarda-roupa (texto) | sem cota | não | `lacunas.tsx:27` |
| Checklist de compra (texto) | sem cota | não | `compra.tsx:30` |
| Missões (texto) | sem cota | não | `missoes.tsx:25` |
| Imagem de referência do look | `webapp.reference.render` (5) | sim (no `ReferenceImage`) | `ReferenceImage.tsx:243` |
| Provador "Provar em mim" | `webapp.tryon.render` (2) | sim (o mesmo chip soma reference+tryon) | `ReferenceImage.tsx:243`; `catalogo.functions.ts:73` |

### 4.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Gerar looks | accent | — | gera novo lote | toast + lista | `gerar.tsx:34-40` |
| Status (5) | botões "aprovado/em teste/talvez depois/já usei/não funcionou" | — | sim | toast `Marcado como "..."` | `look.$id.tsx:38-42,58-60` |
| Excluir look | `Confirm` | sim | não | sem toast (navega) | `look.$id.tsx:49,60` |
| Feedback | 2 escalas + texto | — | não | toast | `look.$id.tsx:43-48,81-87` |
| Exportar look | **[A] não existe** no detalhe | — | — | — | `look.$id.tsx` |
| Comparar | **[A]** no detalhe (só `/compare` global) | — | — | — | idem |
| Armário: adicionar | botão "Adicionar" | — | não (sem editar) | toast "Peça adicionada" | `armario.tsx:42-54,77` |
| Armário: "Usei hoje" | incrementa `times_used` | — | não | **nenhum** | `armario.tsx:60,89` |
| Armário: excluir | `Confirm` | sim | não | **nenhum toast** | `armario.tsx:55-59,89` |
| Lacunas: analisar | "Analisar meu guarda-roupa"/"Analisar de novo" | **não** | — | "Última análise: data" | `lacunas.tsx:25-33` |
| Compra: analisar | "Fazer checklist" | **não** | — | card na lista | `compra.tsx:27-32` |
| Missões: criar | "Criar missões da semana"/"Novas missões" | **não** | — | lista | `missoes.tsx:23-32` |
| Missões: concluir | toggle único "Concluí as missões" | — | sim ("Reabrir") | **nenhum** | `missoes.tsx:28,32` |
| Apagar análise (lacunas/compra/missões) | **[A]** | — | — | — | nenhum delete nas 3 telas |

### 4.6 Dead ends e loops

- **Foto descartada em silêncio:** no armário, se o consent de fotos estiver desligado, `add()` aceita o arquivo no input mas não envia nem avisa (`armario.tsx:45`) — a peça é salva **sem** foto e o usuário acha que enviou.
- **Lacunas/compra/missões não têm erro:** `try/catch` só faz toast (`lacunas.tsx:25-29`, `compra.tsx:27-32`, `missoes.tsx:23-27`); se a IA cair, a tela fica igual e o usuário clica de novo (custo repetido).
- **Análises se acumulam sem histórico:** cada execução insere uma linha em `style_analyses` (`clothing.functions.ts:90,105,119`), mas a UI mostra **só a última** (`lacunas.tsx:24` `limit(1)`) ou as 20 últimas sem exclusão (`compra.tsx:26`) — o histórico cresce e é invisível.
- **Missões têm um único estado:** `done` é da análise inteira (`missoes.tsx:28,32`); não há marcar missão individual, embora o card pareça uma lista.
- **`from_wardrobe` sem verdade:** se o guarda-roupa está vazio, todas as peças saem como "ideia" e o look não aproveita nada — o aviso existe (`gerar.tsx:45`) mas não impede.
- **"Usei hoje" sem consequência visível:** incrementa o contador (`armario.tsx:60`) e nada mais muda na tela (a peça não entra em relatório/uso no look).
- **Perfil loga evento errado:** salvar o perfil de estilo dispara `onboarding_completed` (`roupas/perfil.tsx:40`), poluindo o funil de ativação.
- **Sem exportar:** nenhum `.md` de look de roupa; `/export` quebra nesse kind (F03, §13).

---

## 5. Módulo Tatuagem (`/tatuagem/*`)

### 5.1 Mapa de telas

| Rota | Papel | Estados | Evidência |
|---|---|---|---|
| layout | — | **loader + `useSuspenseQuery`**: falha de rede derruba as 7 abas; sem retry | `tatuagem/route.tsx:4`; `TattooWorkspace.tsx:14-15` |
| `/tatuagem` | Projetos + lista de versões | vazio ("Seu primeiro projeto começa com uma intenção.") · contadores · `Confirm` de exclusão | `TattooWorkspace.tsx:20-23` |
| `/tatuagem/perfil` | Nova/editar intenção | submit busy · erro por toast com `e.message` cru · fora do fluxo da busca não há seletor de projeto | `TattooWorkspace.tsx:24-30` |
| `/tatuagem/gerar` | Gerar 3 conceitos | busy · erro inline `role="alert"` | `TattooWorkspace.tsx:31-35` |
| `/tatuagem/referencias` | Fotos privadas | gate de consent (2 níveis) · erro de load `role="alert"` | `TattooPhotos.tsx:14-20` |
| `/tatuagem/decisao` | 6 checkpoints + data | sem projeto: só texto + select vazio | `TattooPlanView.tsx:32-36` |
| `/tatuagem/briefing` | Exportar briefing | **checkbox obrigatório** · sem projeto: "Gere um conceito primeiro." sem link | `TattooPlanView.tsx:28-31` |
| `/tatuagem/cuidados` | Cuidados + diário + lembretes | sem projeto: só texto + select; saúde em vermelho | `TattooPlanView.tsx:37-42` |
| `/tatuagem/plano/$id` | Conceito detalhado | "Esta versão não existe mais." | `TattooPlanView.tsx:21-27` |
| `/tatuagem/vitrine` | Marketplace | loading spinner · vazio · paywall · toast de erro | `vitrine.tsx:106-107,148-154` |

### 5.2 Fluxo de criação (começo → meio → fim)

1. **Começo:** `/tatuagem` → "Nova intenção" (`TattooWorkspace.tsx:22`).
2. **Intenção:** nome (obrigatório), região, estilo, visibilidade, tamanho (cm), orçamento (R$), significado; opcionais de referência/restrições/futuro; seção privada "Só se quiser contar" (dor, pele, tatuagens, cicatriz) (`:29`). **Submit salva e redireciona para `/tatuagem/gerar?projeto=id`** (`:28`) — único módulo que encadeia automaticamente.
3. **Conceitos:** seletor de projeto + resumo + "Gerar conceitos" (`:34`); 3 conceitos Discreta/Intermediária/Ousada com diagrama SVG esquemático, imagem, tamanho, estilo/visibilidade, significado e perguntas (`:26`).
4. **Fim:** redireciona para `/tatuagem/plano/$id` (`:33`). A partir do detalhe: Briefing, Decisão, Cuidados (3 CTAs, `:26`).
5. **Reação:** notas privadas + "Sua reação" com **select 1–5 default 4** + reflexão + "Salvar feedback" (`:26`) → DNA recebe **apenas a nota** quando autorizado.
6. **Ramificação vitrine:** `/tatuagem/vitrine` → filtro por estilo → "Copiar pra mim" (exige `modelo-corpo.png`) → prova → "Quero essa — enviar pro estúdio" (`vitrine.tsx:129-140`).

### 5.3 Campos e validações

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Nome do projeto | **sim** (`required`) | `min(1) max(120)` | navegador bloqueia | `TattooWorkspace.tsx:29`; `tattoo.functions.ts:8` |
| Região / estilo / visibilidade | sim (defaults) | listas fixas | — | `TattooWorkspace.tsx:29` |
| Tamanho (cm) | **sim** (`required`) | 1–100 | navegador bloqueia | idem |
| Orçamento (R$) | **sim** (`required`) | 0–100.000 | navegador bloqueia | idem |
| Significado/intenção | não (`required` ausente) | `max(1000)` | IA gera com pouco contexto | `:29`; `tattoo.functions.ts:8` |
| Referência/restrições/futuro | não | `max(500–1000)` | — | idem |
| Seção privada (4 campos) | não | `max(300–800)` | — | idem |
| Conceito: seletor | **sim** (default `''`) | — | botão desabilitado | `TattooWorkspace.tsx:34` |
| Referência: foto | não | JPG/PNG/WebP ≤10 MB + consent corporal p/ foto de corpo | toast de erro / input desabilitado | `TattooPhotos.tsx:17-19` |
| Decisão: checkpoints/data | não | — | — | `TattooPlanView.tsx:35` |
| Briefing: confirmação | **sim** | checkbox | botões desabilitados | `TattooPlanView.tsx:30` |
| Cuidados: registro | sim (nota **ou** foto) | `min(3)` texto / ambos vazios → toast | botão desabilitado | `TattooPlanView.tsx:41` |
| Vitrine: copiar | precisa de `modelo-corpo.png` | toast + banner | — | `vitrine.tsx:48-53,92-96` |

### 5.4 Cotas

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| Gerar 3 conceitos (texto) | sem cota client-side | não | `TattooWorkspace.tsx:34`; `uso.functions.ts:11-18` |
| Imagem de referência (tatuagem) | `webapp.reference.render` (5) | sim, no `ReferenceImage` (`tattoo`) | `ReferenceImage.tsx:243` |
| Lettering/composição | `webapp.ink.render` (5) | sim (mesmo chip) | `ReferenceImage.tsx:243`; `ReferenceImage.tsx:148` |
| "Copiar pra mim" (vitrine) | `webapp.ink.tryon` (2) | sim, chip próprio | `vitrine.tsx:91`; `vitrine.functions.ts:126` |
| Briefing/guia pós-geração | texto | não | `ReferenceImage.tsx:47` |
| Briefing do tatuador (markdown) | nenhuma IA (determinístico) | n/a | `tattoo.ts:13-15` |

### 5.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Criar/editar intenção | form | — | sim | toast só em erro; sucesso navega | `TattooWorkspace.tsx:28` |
| Gerar conceitos | botão | — | gera nova versão | navega ao detalhe | `TattooWorkspace.tsx:33` |
| Salvar versão | "Salvar versão" | — | sim | toast "Salvo." | `TattooPlanView.tsx:26,25` |
| Rejeitar | "Não é para mim" | — | sim | toast | idem |
| Guardar escolha | "Guardar escolha" (briefing) | **não** | sim (sobrescreve `selected_level`) | toast "Alternativa registrada." | `TattooPlanView.tsx:30` |
| Exportar briefing | "Baixar briefing"/"Imprimir" | **checkbox obrigatório** | não (arquivo sai) | download/print | idem |
| Comparar / Coleções | links | — | — | — | `TattooPlanView.tsx:26` |
| Notas privadas | textarea + "Salvar nota" | — | sim | toast | idem |
| Feedback | select + texto | — | não | toast com `dna_used` | idem |
| Excluir projeto | `Confirm` | **sim** | não (apaga versões/fotos/diário/lembretes) | lista atualiza | `TattooWorkspace.tsx:22` |
| Excluir foto de referência | "Excluir foto" | **não** | não | toast em erro | `TattooPhotos.tsx:19` |
| Excluir todas as fotos | `Confirm` | sim | não | — | idem |
| Excluir registro do diário | "Excluir registro" | **não** | não | nenhum | `TattooPlanView.tsx:41` |
| Lembrete: criar / concluir / cancelar | inline | — | sim | lista atualiza | `TattooPlanView.tsx:41` |
| Apagar versão individual | **[A]** (só projeto inteiro) | — | — | — | `TattooPlanView.tsx:26` |
| Duplicar / restaurar versão | **[A]** | — | — | — | — |
| Histórico | **[A]** (lista de versões no projeto; sem diff) | — | — | — | `TattooWorkspace.tsx:22` |
| Vitrine: publicar/pausar/excluir | /profissionais | `confirm()` nativo (excluir) | sim (pausar) | toast | `profissionais.tsx:315-317` |
| Vitrine: copiar/enviar | botões no card | — | prova não persiste | toast | `vitrine.tsx:129-140` |

### 5.6 Dead ends e loops

- **`ProjectSelect` começa vazio em 5 telas** (`TattooPhotos.tsx:19`, `TattooPlanView.tsx:30,35,41`) e não há CTA de "criar" ao lado; em `/tatuagem/decisao` e `/cuidados` o usuário vê apenas um select e uma frase.
- **`/tatuagem/briefing` sem conceito:** "Gere um conceito primeiro." em texto puro, sem link (`TattooPlanView.tsx:30`).
- **Layout suspende as 7 abas:** qualquer erro em `tattooData` (que também consulta `safety_config` e `reminders`) derruba tudo (`tatuagem/route.tsx:4`; `tattoo.functions.ts:14-25`) — e não há botão "tentar de novo" no módulo.
- **Vitrine fora da nav do módulo:** quem está em `/tatuagem` não vê a vitrine; ela só existe no header quando a trilha Estilo foi escolhida (`trilhas.ts:43`) — e `/tatuagem/route.tsx:5` não a lista.
- **Prova da vitrine é efêmera:** `provas` é estado local (`vitrine.tsx:28`); recarregar perde a simulação e o botão "Quero essa" desaparece.
- **Envio da prova a terceiro:** "Quero essa" salva a simulação no cofre e gera **URL assinada de 30 dias** incluída no briefing (`vitrine.tsx:76-80`) — enquanto `/tatuagem/briefing` afirma "Nada será enviado a terceiros" (`TattooPlanView.tsx:30`). Duas promessas opostas no mesmo módulo.
- **Nota involuntária:** o select de reação começa em 4 (`TattooPlanView.tsx:22`); quem não escolhe registra 4 estrelas.
- **Consent corporal em dois níveis** (geral + `body_photo_consent`) é bem-feito (`TattooPhotos.tsx:17-19`), mas o switch fica **desabilitado sem explicação** quando falta a permissão geral (só um parágrafo acima).

---

## 6. Módulo Barba (`/barba`)

### 6.1 Mapa (página única, sem abas)

| Bloco | Papel | Estados | Evidência |
|---|---|---|---|
| "Seu perfil" | 8 campos | botões desabilitados sem "Barba hoje"; toast de erro | `barba.tsx:17,69` |
| "Gerar plano de barba" | texto → `/package/$id` | busy "Criando propostas…" | `barba.tsx:69` |
| "🪞 Provar na sua cara" | 6 estilos prontos | gate `modelo-rosto.png`; erro `role="alert"`; paywall | `barba.tsx:20-27,42,73-83` |
| "💌 Levar ao barbeiro" | briefing determinístico | só aparece com `presence` | `barba.tsx:86-92` |
| "Seus planos" | lista de `beard_plan` | **sem vazio, sem erro, sem excluir** | `barba.tsx:94` |

### 6.2 Fluxo

1. **Perfil:** `PresentationChoice` + "Barba hoje" (Sem barba / Com barba / Quero explorar) + 7 campos de texto (comprimento, densidade, bigode, estilo, sensibilidade, tempo, orçamento) (`barba.tsx:17,69`).
2. **Salvar perfil** (outline) e **Gerar plano de barba** (accent), ambos `disabled` até escolher "Barba hoje" (`:69`). O gerar **salva o perfil antes** de gerar (`:69` `await save()`), depois navega para `/package/$id`.
3. **Provar:** só com `modelo-rosto.png` no cofre; 6 presets com prompt fixo; uma chamada `webapp.retrato.edit` por clique (`:52`); mostra a prova (uma por vez, estado) e o paywall.
4. **Briefing:** texto montado **sem IA** a partir do perfil (`:64-68`), enviado por `EnviarBriefing` com a **foto do modelo** (não a foto real) e profissão fixa "barbeiro" (`:90`).
5. **Fim:** planos ficam em `/barba` como links para o detalhe genérico (`:94`).

### 6.3 Campos

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Barba hoje | **sim** (gate) | 3 opções | botões desabilitados sem mensagem | `barba.tsx:69` |
| 7 campos de perfil | **não** | `maxLength 300` | perfil salva incompleto; IA recebe vazio | `barba.tsx:17,69`; `beard.functions.ts:11,15` |
| Prova de estilo | prec. foto de rosto | arquivo fixo | toast "Crie seu 👤 Meu Modelo" | `barba.tsx:42,46,49` |
| Briefing | prec. `presence` | — | bloco inteiro oculto | `barba.tsx:86` |

### 6.4 Cotas

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| Gerar plano (texto) | sem cota client-side | não | `barba.tsx:69` |
| Provar 6 estilos | **`webapp.retrato.edit` (2)** — a mesma cota do Retrato | sim, mas **sem rótulo** ("restam 2 de 2 grátis") | `barba.tsx:80`; `uso.functions.ts:14` |
| Briefing determinístico | zero IA | n/a | `barba.tsx:64` |

**Consequência:** testar 2 dos 6 estilos esgota o "Retrato" do usuário sem que a tela diga isso; e o inverso também vale (quem usou Retrato não consegue provar barba).

### 6.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Salvar perfil | "Salvar perfil" | — | sim | toast "Perfil salvo." | `barba.tsx:69` |
| Gerar plano | accent | — | cria novo | navega ao pacote | `barba.tsx:69` |
| Provar estilo | 6 botões | — | sim (nova prova) | spinner + imagem | `barba.tsx:74-79` |
| Baixar/salvar prova | **[A]** (não há download) | — | — | — | `barba.tsx:81` |
| Briefing ao barbeiro | `EnviarBriefing` | — | não | toast (promete `/profissionais`) | `barba.tsx:90`; `EnviarBriefing.tsx:54` |
| Abrir plano | link | — | — | — | `barba.tsx:94` |
| Excluir plano | **[A]** (nem no `/barba`, nem no `/package/$id`) | — | — | — | `barba.tsx:94`; `package.$id.tsx:121-142` |
| Comparar/exportar | via `/compare` e `/export` (globais), sem link no módulo | — | — | — | `barba.tsx` |

### 6.6 Dead ends e loops

- **Planos sem gestão:** cada "Gerar plano" empilha um novo `beard_plan` e a lista (`barba.tsx:94`) só abre o detalhe — sem excluir, sem status real ("salvo"/"proposta" fixos pelo `status`), sem data. O acervo de barba cresce irrecuperável.
- **"Barba hoje" obrigatório sem mensagem:** os botões ficam desabilitados (`:69`) e nada explica por quê (não há `aria-describedby`/texto).
- **Prova não persiste:** imagem em estado (`:39,54`); sair da página perde a prova e a cota já foi gasta.
- **Acoplamento de cota não dito:** chip usa `webapp.retrato.edit` (`:80`) — ver §6.4.
- **Briefing só para barbeiro:** `profissaoFixa="barbeiro"` (`:90`) e o texto é de barbearia; não há opção de enviar a outro profissional.
- **Modo barbearia em 3 lugares** (checkbox no cabelo, página `/barba`, `beard_preference` no onboarding) — mesma sobreposição já vista em §3.6.

---

## 7. Módulo Estética (`/estetica`)

### 7.1 Mapa (página única)

| Bloco | Papel | Estados | Evidência |
|---|---|---|---|
| Header + disclaimer | contexto legal | `permite === null` → "Carregando…" | `estetica.tsx:14,17,123` |
| Gate de permissão | exige fotos + imagens IA | cartão com link p/ Configurações | `estetica.tsx:38-39,126-131` |
| Procedimentos (5) | escolha | grid de botões | `estetica.tsx:133-142` |
| Guia de captura | instrução por procedimento | — | `estetica.tsx:151-154` |
| Upload | foto privada | validação tipo/tamanho por `setErr` | `estetica.tsx:45-54,156-167` |
| "Medir simetria" | IA de visão | busy + erro inline `role="alert"` | `estetica.tsx:56-68,165` |
| Resultado | barras por região | — | `estetica.tsx:169-186` |
| "Simular procedimento" | IA de imagem + re-leitura | busy | `estetica.tsx:70-93,182` |
| Antes/depois | 2 imagens + delta | — | `estetica.tsx:188-213` |
| Briefing | IA de texto | busy | `estetica.tsx:95-106,183,215-226` |
| Jornada pós-procedimento | diário/fotos/retorno | vazio, erro | `JornadaEstetica.tsx:23-153` |

### 7.2 Fluxo (5–8 passos, 4–5 chamadas de IA)

1. Header "✨ Estética" → página.
2. Gate **no cliente**: lê `consents.photo_processing` e `image_generation` (`estetica.tsx:36-41`). Faltando, mostra cartão com link (`:126-131`).
3. Escolhe 1 de 5 procedimentos (`estetica.functions.ts:15-21`).
4. Lê guia de captura → sobe foto (PNG/JPG ≤5 MB) — validação local, `setErr` (`estetica.tsx:45-54`).
5. "Medir simetria" → `analisarSimetria` (visão) (`:56-68`).
6. Opcional: "Simular procedimento na minha foto" → `simularProcedimento` (imagem) → salva no cofre → **re-mede automaticamente** com uma 3ª chamada (`:70-93`).
7. Opcional: "Gerar briefing de avaliação" (texto) → copiar/baixar `.md` (`:95-106,219-222`).
8. `EnviarBriefing` com a foto privada (`:223`) e/ou `JornadaEstetica` (`:232`).

### 7.3 Campos e validações

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Procedimento | sim | 5 opções | seções ocultas | `estetica.tsx:144` |
| Foto | sim | PNG/JPG ≤5 MB (só cliente) | `setErr` | `estetica.tsx:47-48` |
| Medição | prec. foto+procedimento | — | botão só aparece com foto | `estetica.tsx:162-166` |
| Simulação | prec. análise | — | botão só aparece com análise | `estetica.tsx:182` |
| Briefing | prec. análise | — | botão só aparece com análise | `estetica.tsx:183` |
| Jornada: procedimento/data | sim (defaults) | — | data default hoje | `JornadaEstetica.tsx:27-29,83` |
| Registro: texto **ou** foto | sim (um dos dois) | toast "Escreva algo ou anexe uma foto." | não salva | `JornadaEstetica.tsx:54` |

### 7.4 Cotas (o ponto mais crítico do módulo)

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| Medir simetria (`simetria`) | **não está em `LIMITES`** | **não** | `estetica.functions.ts:39`; `uso.functions.ts:11-18` |
| Simular (`webapp.estetica.sim`) | **não está em `LIMITES`** | **não** | `estetica.functions.ts:70`; `uso.functions.ts:11-18` |
| Re-leitura automática | consome outra medição | **não** | `estetica.tsx:87` |
| Briefing (`briefing_estetico`) | texto, sem cota | não | `estetica.functions.ts:93` |
| Total por sessão | 1 medir + 1 simular + 1 re-medir + 1 briefing = **4; 5 se refizer** | — | `estetica.tsx:63,77,87,102` |
| `/estetica` importa `QuotaChip`? | **não** | — | grep: 0 ocorrências em `estetica.tsx` |

O paywall só aparece quando o gateway devolve 402, como mensagem de erro (`estetica.functions.ts:75`) dentro de `err` — sem cartão, sem preço, sem link para `/aura-pass` (`estetica.tsx:228`).

### 7.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Trocar procedimento | ghost | — | sim (limpa foto/análise/briefing, **não a simulação**) | — | `estetica.tsx:148` |
| Medir | botão | — | sim | barras + resumo + limitações | `estetica.tsx:169-186` |
| Simular | botão | **não** | sim | antes/depois + delta | `estetica.tsx:182,188-213` |
| Briefing | botão | — | sim | texto inline | `estetica.tsx:183,215-226` |
| Copiar/Baixar briefing | botões | — | — | toast "Copiado!" / download | `estetica.tsx:220-221` |
| Enviar a profissional | `EnviarBriefing` | **não** | não | toast promete `/profissionais` | `estetica.tsx:223` |
| Jornada: criar | "Começar jornada" | — | sim | toast "Jornada começada!" | `JornadaEstetica.tsx:41-49` |
| Jornada: data de retorno | input date inline | — | sim | `.then(carregar)`; erro toast "Não salvou." | `JornadaEstetica.tsx:109` |
| Jornada: concluir | "Concluir" | — | sim | lista | `JornadaEstetica.tsx:110` |
| Jornada: registrar | "Registrar" | — | não (sem excluir registro) | toast em erro; sem toast de sucesso | `JornadaEstetica.tsx:51-70,143` |
| Jornada: excluir | ícone lixeira | **`confirm()` nativo** | não | lista | `JornadaEstetica.tsx:113` |
| Apagar foto enviada p/ medição | **[A]** | — | — | — | `estetica.tsx:45-54` |
| Histórico de análises | **[A]** (estado em memória) | — | — | — | `estetica.tsx:28-30` |

### 7.6 Dead ends e loops

- **Custo invisível:** a tela não tem contador, preço ou aviso; o usuário descobre o limite no 402 e o texto não leva ao Pass (`estetica.tsx:228`).
- **Briefing não persiste:** `briefTxt` é estado (`estetica.tsx:30`); recarregar perde o briefing e não há histórico.
- **Foto fica órfã:** a foto de medição é enviada ao cofre (`:49-52`) e nunca aparece em nenhuma galeria nem pode ser excluída ali; só em Configurações (`settings.tsx:116`) ou `/dna/redefinir` (que não cobre fotos).
- **Dois "jornada":** `🌱 Jornada pós-procedimento` aqui (`JornadaEstetica.tsx:73-77`) x módulo `/jornada` ("Jornada") com 6 abas — mesmo nome, dados e significados diferentes.
- **Registros não apagáveis:** `addRegistro` existe (`estetica.functions.ts:158`) mas não há `deleteRegistro`; só a jornada inteira pode ser excluída — perde-se tudo para corrigir um registro.
- **Sem consent no servidor:** os handlers `analisarSimetria`/`simularProcedimento` só exigem autenticação (`estetica.functions.ts:28-31,59-62`); o gate de permissões é só de UI. [C] no código; eficácia de RLS [NV].
- **Sem confirmação do envio:** `EnviarBriefing` dispara direto, sem checkbox — e a foto vai junto (ver §11.3).

---

## 8. Módulo Jornada (`/jornada/*`)

### 8.1 Mapa de telas

| Rota | Papel | Estados | Evidência |
|---|---|---|---|
| `/jornada` | Planos | vazio com frase | `JourneyWorkspace.tsx:30-37` |
| `/jornada/objetivo` | Criar plano | busy ("ai"/"save") | `JourneyWorkspace.tsx:40-64` |
| `/jornada/plano/$id` | Executar plano | "Plano não encontrado." | `JourneyWorkspace.tsx:85-106` |
| `/jornada/diario` | Fotos + reflexões | gate de consent; vazio | `JourneyWorkspace.tsx:113-137` |
| `/jornada/galeria` | Antes/depois | vazio com link | `JourneyWorkspace.tsx:139-147` |
| `/jornada/relatorios` | Lista | vazio com instrução | `JourneyWorkspace.tsx:149-155` |
| `/jornada/relatorio/$id` | Ler/exportar | "Relatório não encontrado." | `JourneyWorkspace.tsx:157-167` |
| `/jornada/linha-do-tempo` | Histórico agregado | vazio | `JourneyWorkspace.tsx:169-180` |

Todas as rotas usam `loader` + `ensureQueryData` (`jornada/index.tsx:4` etc.) e `useJourney` = `useSuspenseQuery` (`JourneyWorkspace.tsx:15-16`): **não há skeleton nem retry por página**; erro cai no boundary da seção.

### 8.2 Fluxo

1. `/jornada` → "Novo plano" (`:33`).
2. **Objetivo e plano:** 7 objetivos + "com suas palavras" + "por que agora?" (privado) (`:52-54`); duração (mensal 4 semanas / trimestral 3 meses), início (obrigatório, default hoje), nome opcional (`:55`).
3. **Passos:** "Sugerir rascunho com IA" (`:56`) **ou** "Adicionar passo" (título, área, período, sugestão salva opcional) (`:58-59`); aviso "Rascunho gerado por IA — edite à vontade." (`:57`).
4. **Criar plano** (`:62`) → `/jornada/plano/$id` (`:48`). Nota: passos com título vazio são **descartados em silêncio** (`steps.filter(s => s.title.trim())`, `:48`), podendo criar plano com 0 passos.
5. **Executar:** construtor por período (`:96`), quadro de experimentos com 7 status (`:99`), "Refletir" abre `ReflectionForm` (`:70-83`), lembretes (`:101-104`), "Gerar 'Meu mês em imagens'" (`:95`).
6. **Registrar:** `/jornada/diario` — escolher plano, passo, marcar antes/depois/free, upload (exige consent) (`:125-131`), reflexões listadas (`:133-134`).
7. **Fechar:** relatório com 6 blocos + checkbox "Entendo que o arquivo sai do app" → baixar/imprimir/excluir (`:157-167`).

### 8.3 Campos

| Campo | Obrigatório | Validação | Se faltar | Evidência |
|---|---|---|---|---|
| Objetivo | sim (default 1º) | lista | — | `JourneyWorkspace.tsx:43` |
| "Com suas palavras"/"Por que agora?" | não | `max(300/1000)` | usa objetivo padrão | `:53-54` |
| Início | **sim** (`required`) | data | navegador bloqueia | `:55` |
| Nome do plano | não | `max(120)` | vira `custom || goal` | `:48,55` |
| Passos | **não** (0 permitido) | título `max(160)`, categoria enum, período 1–4/1–3 | plano vazio | `:48`; `journey.functions.ts:38` |
| Reflexão | não | `max(2000)` / escalas 1–5 opcionais | pode salvar reflexão vazia | `JourneyWorkspace.tsx:72-74` |
| Foto do diário | exige **passo selecionado** | JPG/PNG/WebP ≤10 MB + consent | input desabilitado | `:131` |
| Lembrete | título + data (`required`) | — | botão bloqueado | `:103` |
| Relatório | prec. plano com ≥1 passo | — | botão `disabled` sem explicação | `:95` |

### 8.4 Cotas

| Ação | Cota | Visível? | Evidência |
|---|---|---|---|
| "Sugerir rascunho com IA" (texto) | sem cota client-side | não | `:56`; `journey.functions.ts:56` |
| "Gerar relatório" (texto) | sem cota | não | `:93`; `journey.functions.ts:95` |
| Nenhuma imagem gerada | — | — | fotos são upload direto |

### 8.5 Ações

| Ação | Como | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Criar plano | submit | — | não | navega | `JourneyWorkspace.tsx:48,62` |
| Adicionar passo | form inline | — | **não há remover** | lista atualiza | `:97`; `journey.functions.ts:50` |
| Mudar status | `select` por passo | **não** | sim (histórico em `status_history`) | **nenhum toast** | `JourneyWorkspace.tsx:99`; `journey.functions.ts:71-74` |
| Refletir | botão → form | — | não (insere) | toast "Reflexão guardada." | `JourneyWorkspace.tsx:74` |
| Criar lembrete | form | — | **não há apagar** | toast "Lembrete criado." | `:103`; `journey.functions.ts:125` |
| Gerar relatório | botão | — | insere novo | toast em erro; navega | `:93` |
| Baixar/imprimir relatório | botões | **checkbox obrigatório** | — | download/print | `:165` |
| Excluir relatório | `Confirm` | **sim** | não | navega | `:165` |
| Excluir plano | `Confirm` | **sim** | não (apaga passos/reflexões/fotos/relatórios) | lista | `:35` |
| Excluir foto do diário | "Excluir" no card | **não** | não | lista | `:132` |
| Excluir reflexão | "Excluir" | **não** | não | lista | `:134` |
| Editar plano (título/duração) | **[A]** | — | — | — | `JourneyWorkspace.tsx:85-106` |
| Duplicar/restaurar | **[A]** | — | — | — | — |
| Comparar versões | **[A]** (não há versão de plano) | — | — | — | — |

### 8.6 Dead ends e loops

- **Plano com 0 passos:** permitido (`:48`), e então o diário não aceita foto (exige passo, `:131`), o relatório fica `disabled` (`:95`) — o plano vira um beco sem saída, e a única saída é excluí-lo (`:35`).
- **"Registro livre" contraditório:** o select oferece "Registro livre" (`:130`), mas o upload exige `step` (`:131`). Quem quer registrar sem passo não consegue — e o texto sugere que sim.
- **Sem apagar passo/lembrete:** `addStep` e `addJourneyReminder` existem; não há remoção (`journey.functions.ts:50,125`) — erros de digitação e lembretes obsoletos ficam para sempre.
- **Status muda em silêncio:** trocar o status de um passo não dá toast nem confirmação (`:99`) — ação irreversível-não-confirmada em conteúdo que afeta relatório.
- **"Meu mês em imagens" sem imagens:** o relatório é só texto; o prompt diz que "fotos não foram analisadas" (`journey.functions.ts:116`), mas o nome do botão promete imagens (`JourneyWorkspace.tsx:95`).
- **Exclusões sem confirmação** no diário e nas reflexões (`:132,134`) vs. `Confirm` no plano/relatório — mesmo módulo, dois padrões.
- **Foto sem passo some:** `deleteJourneyPlan` apaga fotos **só** ligadas a passos (`journey.functions.ts:140`); fotos `journey_step_id = null` (que o formulário não cria, mas o backend aceita) ficariam órfãs.
- **Lembretes só no app:** texto explícito (`:101`) — coerente com o consentimento, mas contradiz a promessa de retorno do guia §3.4.

---

## 9. DNA Visual (`/dna/*`)

### 9.1 Mapa de telas

| Rota | Papel | Estados | Evidência |
|---|---|---|---|
| `/dna` | Resumo editável | skeleton · erro · personalização desligada · pausado · "ainda não foi gerado" · banner de revisão (≥10 sinais) | `dna/index.tsx:65-89`; `dna/route.tsx:30-34` |
| `/dna/preferencias` | Editar preferências | skeleton · erro só toast | `dna/preferencias.tsx:60-71` |
| `/dna/linha-do-tempo` | Sinais que formaram o DNA | skeleton · erro · vazio · filtros por módulo | `dna/linha-do-tempo.tsx:33-44` |
| `/dna/permissoes` | Consentimento em camadas | skeleton · "não encontramos seus consentimentos" · disabled em cascata | `dna/permissoes.tsx:27-29,49` |
| `/dna/versoes` | Histórico + comparar 2 | skeleton · vazio · **sem estado de erro** | `dna/versoes.tsx:35-37` |
| `/dna/redefinir` | Exportar e apagar partes | sem loading/progresso | `dna/redefinir.tsx:31-37` |

### 9.2 Fluxo e ações

1. **Gerar/atualizar:** 1 chamada de texto, **sem cota/aviso** (`dna/index.tsx:40-47,81`).
2. **Editar 17 campos:** "Editar" → textarea → "Salvar" grava `visual_dna`, insere `dna_corrections`, insere `dna_versions` e 2 eventos, **em sequência sem transação** (`dna/index.tsx:49-63`).
3. **"Isso está errado":** em campo de lista grava `[]` — apaga a lista inteira (`:120`); em `module_notes`, esvazia só a chave (`:138`), mas **não há "Editar" para notas por módulo** (só excluir) — assimetria.
4. **Permissões:** 2 switches globais + 7 por módulo; "barba" é o único que usa `=== true` (desligada por padrão), os outros `!== false` (ligados) (`dna/permissoes.tsx:49`), sem explicação na tela.
5. **Versões:** lista 50, checkbox com `sel.slice(-1)` (só mantém as duas últimas), "Ver" e **"Restaurar" sem confirmação** (`dna/versoes.tsx:49-52`); comparar em tabela sem `overflow` (`:66`).
6. **Redefinir:** exporta JSON de 12 tabelas (`dna/redefinir.tsx:32-35`) e oferece 5 `Confirm` granulares (`:50-54`).

### 9.3 Ações por tipo

| Ação | Existe? | Confirmação | Reversível | Feedback | Evidência |
|---|---|---|---|---|---|
| Gerar resumo | sim | — | cria versão | toast | `dna/index.tsx:40-47` |
| Editar campo | sim | — | cria versão | toast "Correção registrada…" | `:49-63` |
| Corrigir inferência | sim | — | não (lista vira []) | toast | `:120` |
| Pausar/retomar | sim | — | sim | sem toast | `dna/permissoes.tsx:44-45` |
| Permissão por módulo | sim | — | sim | sem toast | `:47-51` |
| Comparar versões | sim (2) | — | — | tabela | `dna/versoes.tsx:63-77` |
| Restaurar versão | sim | **não** | não (sobrescreve o atual) | toast "Versão restaurada" | `:26-33,52` |
| Exportar JSON | sim | — | — | download | `dna/redefinir.tsx:31-37` |
| Excluir DNA/sinais/versões/correções/preferências | sim (5) | **sim** (`Confirm`) | não | toast "Feito" | `:50-54` |

### 9.4 Dead ends

- **Duas telas editam as mesmas preferências:** "Cores preferidas/rejeitadas" e "Estilos" aparecem no Resumo (`DNA_FIELDS`, `aura.ts:66-84`) e em Preferências (`dna/preferencias.tsx:76-81`) — o usuário não sabe qual é a fonte da verdade (já apontado em 02; confere).
- **"Restaurar" é irreversível sem aviso:** o DNA atual é sobrescrito e a versão anterior vira histórico — mas não há confirmação, ao contrário de todas as 5 exclusões de `redefinir` (`:50-54`).
- **Versões sem erro:** se `dna_versions` falhar, a tela mostra "Nenhuma versão ainda" (`:37`) em vez de erro.
- **Preferências salva qualquer vazio** (`:60-69`), inclusive apagando tudo com um clique (o upsert grava o estado atual) — sem `Confirm`.

---

## 10. Telas transversais do escopo

### 10.1 Aura Retrato (`/retrato`)

| Item | Detalhe | Evidência |
|---|---|---|
| Gate | 2 permissões com ✅/❌ por link para Configurações | `retrato.tsx:36-43,130-134` |
| Fluxo | upload (PNG/JPG ≤5 MB) → pedido livre → "Entender meu pedido" → lista de ajustes + pendências → "Confirmar e editar" → edição → verificação automática → **1 retry automático** | `retrato.tsx:45-120,160-197` |
| Cota | `webapp.retrato.edit` (2), visível | `:200`; `uso.functions.ts:14` |
| Paywall | cartão com preço e link | `:202-208` |
| Ações | excluir **foto enviada** (sem confirmação), mudar pedido, baixar/gerenciar **resultado** | `:59-63,155` |
| Produto do resultado | **não há download nem galeria**: `resultado` é estado (`:29`); o arquivo fica em `user-photos` (`:91-92`) e nunca é listado | [C] |
| Retry | consome 1 unidade extra **sem avisar antes**; texto diz "após 2 tentativas" só no fim | `:112-120,195` |
| Erros | inline `role="alert"`; paywall por regex | `:199,84` |

**Becos:** refresh perde o resultado e não há como recuperá-lo; a foto-fonte é gerenciável, o resultado não; o "Excluir foto" apaga só a entrada (`:61`) — os resultados e as simulações ficam no cofre sem nenhuma UI de gestão.

### 10.2 Meu Modelo (`/modelo`)

| Item | Detalhe | Evidência |
|---|---|---|
| Consent próprio | switch LGPD `personal_model`; desligar exclui as imagens | `modelo.tsx:131-140` |
| Requisitos | fotos ≥3 (máx. 8), seletores de base rosto/corpo | `:61,171-172,175` |
| Geração | 2 chamadas `webapp.modelo.render` (rosto+corpo) | `:87-104`; `modelo.functions.ts:43` |
| Cota | 2, visível | `:187` |
| Paywall | "Sua geração grátis do modelo já foi usada" | `:188-194` |
| Ações | gerar, regenerar, excluir modelo, descartar fotos-fontes | `:74-78,152-153,176` |
| **Falso sucesso** | `gerarModeloPessoal` ignora o retorno de `gerarUm` e **sempre** mostra "Seu modelo pessoal está pronto." | `:106-114` (o toast em `:112` roda mesmo com `ok=false`) |
| Fotos-fonte | `modelo-src-*.png` não entram em `photos`; após reload não há lista nem exclusão | `:64-71`; `carregarModelo` só lê `modelo-*` (`:34-44`) |

### 10.3 Estúdio (`/studio`)

| Item | Detalhe | Evidência |
|---|---|---|
| Campos | humor, modo (9), ocasião, intensidade, "Algo mais?" | `studio.tsx:54-82` |
| Desvios silenciosos | `beard`→`/barba` e `makeup`→`/maquiagem/gerar` **sem passar os inputs**; rótulo do botão só muda para makeup | `:37-39,94` |
| Geração | 3–5 pacotes por chamada, **sem cota** | `aura.functions.ts:41,92-95` |
| Fim | `/dashboard?batch=…` | `studio.tsx:44` |
| Kind | pacotes gravados **sem `kind`** → não aparecem em Roupas/Cabelo/Maquiagem | `aura.functions.ts:92-95` vs `cabelo/index.tsx:18`, `roupas/index.tsx:20`, `maquiagem/index.tsx:24` |

### 10.4 Pacote genérico (`/package/$id`)

- Serve de detalhe para pacotes do Estúdio **e** para planos de barba (`barba.tsx:94`).
- Redireciona por `kind` para 4 módulos (`package.$id.tsx:48-51`).
- Ações: Salvar / Aprovar — vou testar / Bonito mas não prático / Não é para mim / Exportar `.md` / Salvar nota / Adaptar (gera novo lote) / Feedback (`:121-142`). **Sem excluir, sem coleções, sem comparar, sem apagar.**
- `Indicators` espera `cost/maintenance/reversibility/adaptation_time` (`PackageView.tsx:5-14`) — presentes nos pacotes genéricos, **ausentes** em `Outfit`/`HairPlan` (F04).

### 10.5 Coleções, Comparar, Exportar

| Tela | O que faz | Fricção | Evidência |
|---|---|---|---|
| `/collections` | criar coleção, marcar pacotes `saved/approved` em chips, excluir coleção | excluir **sem confirmação** e **sem checar erro**; `toggle` não trata erro; "nenhuma coleção" sem CTA | `collections.tsx:29-37,43,48` |
| `/compare` | até 3 pacotes lado a lado | **sem skeleton e sem erro**; colunas inline (mobile); `Indicators` mostra `undefined` para outfit/hair; tattoo usa texto "Discreta" no badge | `compare.tsx:17-23,38,43-47` |
| `/export` | "Baixar todas (N)" + individual + briefings de tatuagem | **quebra para outfit/hair** (`c.variations.flatMap`, `c.event_checklist.length`); só `saved/approved`; print da página inteira | `export.tsx:9,18-24,29`; `aura.ts:108-114` |

### 10.6 Profissionais (`/profissionais`) — lado criador

- 4 abas com 2 personas (cliente e profissional) na mesma tela (`profissionais.tsx:197-202`); "Recebidos" só aparece se houver recebidos (`:199`).
- Cliente: "Meus envios" com status, briefing, orçamento e proposta visual (`:257-286`).
- Profissional: responder com valor/prazo/observação (`:235-251`), "✨ Aplicar com IA e enviar" (3 grátis → Plano Pro R$49,90) (`:218-222`), publicar vitrine com imagem em bucket **público** `studio-media` (`:108-110`), pausar/reativar, **stencil no navegador** (`:63-94,354-378`), excluir design com `confirm()` (`:317`).
- Cadastro: nome, profissão, CEP → BrasilAPI → slug/link público (`:154-167,342-351`).

Becos: cadastro não permite editar depois de salvo na mesma sessão (campos não são recarregados do servidor — só `meuLink` fica); "Recebidos" some quando vazio; o "Aplicar com IA" depende de `boto.foto_url` (foto enviada pela cliente) — se a cliente não anexou foto, o bloco inteiro não aparece (`:214`).

---

## 11. Análise transversal entre módulos

### 11.1 Consistência de padrões

| Padrão | O que existe | Onde quebra |
|---|---|---|
| Layout do módulo | header h1 + subtítulo + abas + `Outlet` + rodapé de disclaimer | barba, estética, retrato, modelo, studio, package são páginas soltas sem layout/abas |
| Abas | pills com `activeProps` e `border-b` | Roupas usa `overflow-x-auto` (`roupas/route.tsx:20`), tatuagem usa **links de texto sem pill** (`tatuagem/route.tsx:5`), jornada usa pills com `bg-secondary` (`JourneyWorkspace.tsx:22`), roupas/DNA/maquiagem com `flex-wrap` — 4 estilos |
| Geração | botão accent + "Pode levar até um minuto" | o texto varia: "Pode levar até um minuto" (maquiagem/cabelo/roupas), "Isso pode levar até um minuto" (studio), "Preparando os conceitos…" (tatuagem), "Criando propostas…" (barba), "Montando briefing…" (estética) |
| Pós-geração | toast + navegação | maquiagem/roupas → **lista**; cabelo/tatuagem/barba → **detalhe**; studio → dashboard; jornada → plano; estética fica na página |
| Prévia do resultado | imagem por variação via `ReferenceImage` | maquiagem/cabelo/roupas/tatuagem sim; barba só a prova; estética sim; jornada não tem imagem gerada |
| Cards de lista | título + invitation + indicadores | maquiagem `Indicators` (`index.tsx:52`), roupas só cores (`roupas/index.tsx:47`), cabelo nada (`cabelo/index.tsx:45-49`), tatuagem status textual (`:22`), jornada contadores |
| Confirmação de exclusão | `Confirm` (AlertDialog) | **sem**: kit, alerta "Desativar", coleção, foto/registro de tatuagem, foto/reflexão da jornada, foto da vitrine, design da vitrine (usa `confirm()`), jornada estética (usa `confirm()`) |
| "Salvar" | botão que muda `status` | 4 significados: status do objeto, persistir perfil, adicionar item, salvar nota |
| Excluir vs Desativar vs Descartar vs Cancelar | verbos misturados | "Excluir" (kit, alerta), "Desativar" (alerta), "Descartar fotos" (modelo), "Cancelar" (lembrete de tatuagem), "Desmarcar" (bonito não prático) |
| Uso de "rascunho" | "Rascunho gerado por IA" (jornada `:57`) | único lugar; guia promete "briefings têm rascunho local" — **não existe** [A] |
| Uso de "versão" | versão de conceito de tatuagem, versão de DNA, "versões" = pacotes de tatuagem | 3 significados no mesmo produto |
| Uso de "plano" | plano de cabelo, plano de barba, plano de jornada, "plano para o longo prazo" (tatuagem), Plano Profissional (R$49,90) | 5 significados |
| Uso de "look" | look de maquiagem, look de roupa, "design" na vitrine | 2 objetos com o mesmo nome e 1 com nome próprio |
| Uso de "histórico" | "Histórico" da assinatura de maquiagem, "Versões" do DNA, "Linha do tempo" da jornada, "Meus envios" | 4 nomes para histórico; módulos de look/plano não têm nenhum |
| Rótulo "Comparar" | `/compare` global; "Comparação" dentro de DNA/versões; comparar propostas lado a lado em cada plano | mesma palavra para 2 telas diferentes |
| Paywall | cartão âmbar com preço | 6 telas de texto não têm cartão; estética não tem cota; textos do cartão variam (7 frases, §11.4) |

### 11.2 Vocabulário divergente (mesmo conceito, nomes diferentes) e rótulos iguais para coisas diferentes

| Conceito | Nomes usados | Evidência |
|---|---|---|
| Objeto gerado | "sugestão" (dashboard, /etc), "pacote" (código/`PackageView`), "convite" (studio/dashboard/guia), "look", "plano", "conceito", "versão", "kit", "assinatura", "relatório" | `aura.ts:47-57`; `dashboard.tsx:74`; `studio.tsx:94`; `guia.tsx` |
| Documento para profissional | "briefing" (todos), "guia de salão" (cabelo), "briefing de barbearia", "briefing de avaliação" (estética), "briefing do tatuador" | `hair.ts:44`; `barba.tsx:67`; `estetica.functions.ts:91`; `tattoo.ts:13` |
| Imagem gerada | "referência visual", "simulação", "prova", "imagem-base", "modelo", "edição" | `ReferenceImage.tsx:206`; `vitrine.tsx:136`; `modelo.tsx:123`; `retrato.tsx:188` |
| Unidade de limite | "grátis", "gerações gratuitas", "testes grátis", "provas grátis", "créditos de IA", "simulações grátis", "restam X de N" | `QuotaChip.tsx:31-32`; `ReferenceImage.tsx:207,324`; `vitrine.tsx:150`; `barba.tsx:83`; `modelo.tsx:190`; `retrato.tsx:204`; `settings.tsx:88` |
| Estado de um item | "novo/em teste/não funcionou/talvez depois/já usei" (roupas) × "nova/salva/aprovada/rejeitada" (aura) × 7 da jornada × "nova/salva/rejeitada" (tatuagem inline) | `clothing.ts:5`; `aura.ts:37`; `journey.ts:9-12`; `TattooPlanView.tsx:26` |
| "Plano" | cabelo, barba, jornada, plano de longo prazo de tatuagem, Plano Profissional | §11.1 |
| "Coleções" | agrupamento de pacotes (global) vs "Coleções salvas" no Estúdio (link) | `collections.tsx`; `studio.tsx:72-74` |
| "Jornada" | módulo de transformação (6 abas) vs "🌱 Jornada pós-procedimento" da estética | `JourneyWorkspace.tsx`; `JornadaEstetica.tsx:73-77` |
| "Duplicar/adaptar" | "Adaptar esta ideia" (pacote), "Regenerar modelo", "Analisar de novo", "Novas missões", "Atualizar assinatura" | `package.$id.tsx:136-140`; `modelo.tsx:152`; `lacunas.tsx:33`; `missoes.tsx:32`; `assinatura.tsx:50` |

### 11.3 Perda de trabalho e retomada (sair no meio, voltar depois)

| Situação | O que acontece | Evidência | Preservado? |
|---|---|---|---|
| Sair de `/maquiagem/gerar` no meio | estado local; nada gravado | `gerar.tsx:28-34` | **não** |
| Sair de `/cabelo/gerar`, `/roupas/gerar`, `/studio` | idem | respectivos `useState` | **não** |
| Sair de `/tatuagem/perfil` com intenção preenchida | idem; só grava no submit | `TattooWorkspace.tsx:26-29` | **não** |
| Sair de `/jornada/objetivo` com passos montados | idem; plano só nasce no submit | `JourneyWorkspace.tsx:45-49` | **não** |
| Sair de `/retrato` após "Entender meu pedido" | `ajustes`/`duvidas` em estado | `retrato.tsx:26-27` | **não** |
| Sair de `/estetica` após briefing | `briefTxt` em estado | `estetica.tsx:30` | **não** |
| Sair de `/package/$id` com nota digitada | só grava ao clicar "Salvar nota" | `package.$id.tsx:133-134` | **não** |
| Sair de `/jornada/diario` com reflexão digitada | só grava no submit | `JourneyWorkspace.tsx:72-74` | **não** |
| Recarregar durante geração de imagem | `ReferenceImage` avisa "Solicitação em andamento… descarte" e bloqueia nova geração | `ReferenceImage.tsx:328`; `references.functions.ts:107-110` | **sim, com trava** |
| Recarregar durante geração de texto | nada registrado; pode gerar de novo (duplicando custo e resultados) | `studio.tsx:37-49` etc. | **não** |
| Voltar dias depois | listas existem para looks/planos (com `created_at`), mas **sem busca, sem ordenação visível, sem filtro** em cabelo e tatuagem | `cabelo/index.tsx:40-52`; `TattooWorkspace.tsx:22` | **parcial** |
| Trabalho em rascunho | nenhum formulário de módulo tem autosave/draft (só onboarding tem, fora do escopo) | onboarding é o único com autosave | **não** |

**Frases do produto que prometem preservação e não se cumprem:** guia §8 "briefings têm rascunho local" [A]; guia §8 "recarregar no meio de uma geração mostra aviso" — verdadeiro **só** em `ReferenceImage` [C parcial].

### 11.4 Cotas e paywall (clareza de preço, o que é grátis e o que acontece quando acaba)

| Item | Estado real | Problema |
|---|---|---|
| Fonte de limites | `LIMITES` com 6 tasks de imagem (`uso.functions.ts:11-18`) = 5+5+2+2+2+2 = **18 unidade-tarefas**, não "5 imagens" | números não batem com o guia §2.7 ("5 · 5 · 2 · 1 rodada=2 · 2 · 2 · 2 · 3") — estética e "sugestão do profissional" não estão na tabela |
| Contador | `QuotaChip` só em 5 lugares (`ReferenceImage`, `modelo`, `retrato`, `barba`, `vitrine`) | ausente em 6 telas de geração de texto e em `/estetica` |
| Enforcement | no `ai-gateway` (fora do repo) | [NV]; o contador conta apenas `ai_runs.status=completed` (`uso.functions.ts:33`) — falhas/retries podem divergir do que o gateway cobra [I] |
| Estética | task `webapp.estetica.sim` **fora** de `LIMITES` (`estetica.functions.ts:70`) | nenhum contador; só descobre no 402 |
| Barba | usa cota do **Retrato** (`webapp.retrato.edit`, `barba.tsx:80`) | prova de barba consome Retrato sem rótulo |
| 402 em texto | aparece como toast ("Você usou suas gerações gratuitas…", `ai.server.ts:22`) | sem cartão, sem preço, sem link (`gerar.tsx:43`; `TattooWorkspace.tsx:33`; `journey.functions.ts` erros) |
| Detecção de paywall | regex `/gratuitas|Aura Pass/i` em 6 pontos (`ReferenceImage.tsx:184`, `barba.tsx:58`, `modelo.tsx:94`, `retrato.tsx:84`, `vitrine.tsx:61`, `catalogo.functions.ts:78`) | se o backend mudar a frase, o paywall vira erro genérico |
| Preço | `AURA_PASS_PRECO = "R$ 19,90/mês"` e `AURA_PRO_PRECO = "R$ 49,90/mês"` (`stripe.functions.ts:16,18`); `guia.tsx:36` duplica o preço em texto | duas ofertas, um só checkout por oferta; `/aura-pass` não lista o Pro |
| Copy do cartão | 7 frases diferentes ("Suas edições gratuitas acabaram ✨", "Sua geração grátis do modelo já foi usada ✨", "Seus testes grátis acabaram ✨", "Suas simulações grátis acabaram ✨", "Suas gerações gratuitas acabaram ✨", "Suas provas grátis acabaram", "Você já usou suas simulações gratuitas") | vocabulário e preço ("Pix ou cartão", `retrato.tsx:205`, `vitrine.tsx:151`) não verificados no checkout real [NV] |
| O que é grátis | nunca explicado antes da 1ª geração; só no chip depois | usuário não sabe o limite ao começar |

### 11.5 Acessibilidade de formulários e responsividade (o que o código permite afirmar)

| Item | Achado | Evidência |
|---|---|---|
| Sliders sem rótulo associado | `<Slider>` sem `id`/`aria-label`; `Label` sem `htmlFor` | `maquiagem/gerar.tsx:74`; `maquiagem/perfil.tsx:70-71`; `cabelo/perfil.tsx:63-64`; `roupas/armario.tsx:73`; `dna/preferencias.tsx:92`; `package.$id.tsx:148-149` |
| Cards de opção sem semântica | `<button>` sem `aria-pressed`/`role=radio` (só `PresentationChoice` tem `aria-pressed`) | `maquiagem/gerar.tsx:59`; `cabelo/gerar.tsx:51`; `roupas/gerar.tsx:32`; `studio.tsx:59,68`; `estetica.tsx:136`; `armario.tsx:67` |
| Abas sem `aria-current` | estado só por cor | `maquiagem/route.tsx:22`; `cabelo/route.tsx:19`; `roupas/route.tsx:22`; `dna/route.tsx:37`; `JourneyWorkspace.tsx:22` |
| `Label` sem associação | `Label` + `Input` irmãos (sem `htmlFor`/`id`) | `maquiagem/gerar.tsx:73-79`; `cabelo/perfil.tsx:65`; `roupas/armario.tsx:68-74`; `roupas/compra.tsx:37-40` |
| Bom exemplo | `Tattoo`/`Journey` usam `<label>` envolvendo o controle e `aria-label` em selects; `role="alert"`/`role="status"` pontuais | `TattooWorkspace.tsx:27-29`; `JourneyWorkspace.tsx:58-59`; `estetica.tsx:228`; `retrato.tsx:199` |
| Exclusão inacessível no toque | "Excluir" de foto aparece só no hover | `PhotoUploader.tsx:60` |
| Texto 10–11 px | badges, avisos, chips ("Patrocinado", "restam…", notas legais) | `vitrine.tsx:115`; `ReferenceImage.tsx:295,315`; `JornadaEstetica.tsx:122`; `PackageView.tsx:18` |
| Tabelas sem scroll | comparação de versões do DNA | `dna/versoes.tsx:66` |
| Responsividade — abas | 7 abas de Roupas com `overflow-x-auto` sem indicador; demais `flex-wrap` | `roupas/route.tsx:20` vs `maquiagem/route.tsx:20` |
| Responsividade — grade | `compare` com `gridTemplateColumns: repeat(n,1fr)` inline (3 colunas em 360 px) | `compare.tsx:38` |
| Responsividade — cards | listas 2 colunas em telas pequenas usam `md:grid-cols-2` (ok); diário 2→4 ok | `maquiagem/index.tsx:43`; `JourneyWorkspace.tsx:132` |
| Header | ~20 alvos em `overflow-x-auto`, sem drawer | `route.tsx:47-64` |

**O que não é verificável:** contraste real (herdo o cálculo de 02: accent 3,06:1), foco por teclado, zoom 200%, leitores de tela — depende de runtime/navegador [NV].

---

## 12. Verificação das afirmações existentes (02-frontend e Guia Completo)

> Objetivo: não repetir a análise anterior, mas **conferir** o que ela afirma sobre estes módulos e corrigir o que a leitura direta mostrou diferente.

| # | Afirmação (origem) | Veredito | Evidência / correção |
|---|---|---|---|
| 1 | "9 superfícies de geração" (02 §3.2) | **confere, subestimado** | há 12 superfícies de texto + 9 de imagem só no escopo de módulos (§0) |
| 2 | "5 mini-onboardings de perfil" (02 §3.2) | confere | makeup `perfil`, hair `perfil`, style `perfil`, beard, tattoo intention |
| 3 | "Gerações de texto sem contador/aviso" (02 §4.3) | confere | `uso.functions.ts:11-18` só tem imagens; `QuotaChip` ausente em 6 telas |
| 4 | "Estética sem QuotaChip" (02 §2.3) | confere + agravante | task `webapp.estetica.sim` **fora** de `LIMITES` (`estetica.functions.ts:70`) e 4–5 chamadas por sessão |
| 5 | "`/export` quebra com outfit/hair" (02 §5.4, [I]) | **confere [C]** | `packageToMarkdown` usa `c.variations.flatMap` (`aura.ts:108`) e `c.event_checklist.length` (`:114`); `Outfit` não tem `variations` (`clothing.ts:9-13`) e `HairPlan` não tem `variations` (`hair.ts:30-36`) |
| 6 | "Aprovar do look registra `look_saved`" (02 §5.4) | confere | `maquiagem/look.$id.tsx:102`; e o mesmo erro existe em roupas: `outfit_saved` para 4 status (`clothing.functions.ts:130`) |
| 7 | "Restaurar versão do DNA sem confirmação" (02 §5.4) | confere | `dna/versoes.tsx:52` |
| 8 | "Barba usa path fixo `modelo-rosto.png`" (02 §5.2) | confere | `barba.tsx:42,49` |
| 9 | "`confirm()` nativo em JornadaEstetica" (02 §2.3) | confere | `JornadaEstetica.tsx:113` |
| 10 | "Tatuagem: `ProjectSelect` repetido em 6 telas" (02 §2.6) | confere | `TattooWorkspace.tsx:18,25,32`; `TattooPhotos.tsx:19`; `TattooPlanView.tsx:30,35,41` |
| 11 | "Jornada: plano pode nascer vazio" (02 §2.7) | confere + agravante | além do relatório bloqueado, **o diário exige passo** (`JourneyWorkspace.tsx:131`) |
| 12 | "Compare sem skeleton/erro e grid quebrado" (02 §5.2) | confere + novo | também mostra `Custo: undefined` para outfit/hair (`compare.tsx:43`) |
| 13 | "Manual de maquiagem quebra (`q.data!`)" (02 §5.4) | confere | `maquiagem/manual.tsx:28` |
| 14 | "Tatuagem: export exige confirmação por briefing e sai do lote" (02 §2.6) | confere | `TattooPlanView.tsx:30`; `export.tsx:19,38` |
| 15 | "Quota do guia: 5/5/2/2/2/2/2/3" (Guia §2.7) | **incorreto no código** | `LIMITES` tem só 6 tasks (imagens); estética (2) e sugestão do profissional (3) não existem na tabela — logo não há contador coerente. `AURA-PASS` continua dizendo "5 imagens" (`aura-pass.tsx:83,88`, fora do escopo desta tarefa) |
| 16 | "O chip fica sempre visível onde a ação acontece" (Guia §2.7) | **falso** | ausente em studio, maquiagem/gerar, cabelo/gerar, roupas/gerar, roupas/lacunas/compra/missões, tatuagem/gerar, journey, dna, estética |
| 17 | "Em tudo a IA mostra 'Entendi assim'" (Guia §3.2 / 02 §4.1) | **parcial: só imagem com brief** | `ReferenceImage.tsx:208-234` (tattoo/look) e `retrato.tsx:169-183`; nenhum gerador de texto |
| 18 | "Todo gerador mostra 'Usar meu modelo pessoal'" (Guia §3.2) | **falso** | só quando `tattoo || look` (`ReferenceImage.tsx:236`); ausente em barba (que usa o modelo direto) e nos textos |
| 19 | "Recarregar no meio de uma geração mostra aviso de solicitação em andamento" (Guia §8) | **parcial** | só `ReferenceImage.tsx:328`/`references.functions.ts:107-110`; gerações de texto não têm estado |
| 20 | "Briefings têm rascunho local" (Guia §8) | **ausente [A]** | `EnviarBriefing.tsx` não persiste nada; nenhum `localStorage`/tabela de rascunho de briefing no código |
| 21 | "Aprovar/rejeitar é reversível pelo card" (Guia §8) | **parcial** | os botões sobrescrevem o status sem desfazer/confirmar (`maquiagem/look.$id.tsx:101-104`; `cabelo/plano.$id.tsx:62-63`; `roupas/look.$id.tsx:59`) |
| 22 | "Cada geração virou cards com Custo/Manutenção/Reversibilidade/Adaptação" (Guia §2.5) | **parcial** | `Indicators` só em pacotes genéricos/maquiagem; roupas mostra cores, cabelo mostra título/invitação, tatuagem mostra status textual |
| 23 | "Excluir conta remove TUDO — perfil, fotos, sugestões, feedback, DNA e histórico" (settings, citado em 02 §4.5) | **pior do que 02 diz** | `aura.functions.ts:162` cobre as tabelas de maquiagem/jornada/tatuagem/beard, mas **não** `hair_profiles`, `hair_alerts`, `style_profiles`, `wardrobe_items`, `style_analyses`, `estetica_jornada`, `estetica_registro`, `tattoo_designs`, `professionals`, `briefing_sends`, `briefing_suggestions` → os módulos Cabelo, Roupas, Estética e a rede sobrevivem à exclusão de conta [C]; `estetica_registro` nem tem `user_id` (liga-se por `jornada_id`), então não cairia em um delete genérico por `user_id` |
| 24 | "Exclusões sem confirmação: coleção, kit, DNA restaurar, alerta, diário de tatuagem" (02 §3.4) | confere + amplia | somam-se: foto de referência de tatuagem, foto/reflexão da jornada, jornada estética (`confirm()` nativo), design da vitrine (`confirm()` nativo) |

---

## 13. ACHADOS PRIORIZADOS

> Legenda: 🔴 = P0 (bloqueia confiança/uso correto) · 🟠 = P1 (ativação/clareza) · 🟡 = P2 (polimento) · 🟢 = ponto forte a preservar.
> "Causa provável" é hipótese de engenharia de produto, não certeza.

### 🔴 P0 — confiança, privacidade, dinheiro e perda de dados

| ID | Módulo | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|---|
| **F01** | Estética | 4–5 chamadas de IA por sessão (medir, simular, re-medir, briefing) sem nenhum contador, aviso ou preço; a task da simulação **não está em `LIMITES`** | `estetica.tsx:63,77,87,102`; `estetica.functions.ts:70`; `uso.functions.ts:11-18` | Usuário gasta "simulações" que não vê; paywall surpresa; custo de IA sem freio de produto | módulo posterior ao desenho de cotas; a quota foi implementada só para `reference/ink/retrato/modelo/tryon` |
| **F02** | Estética | Handlers de IA e da jornada estética **não filtram dono** e o consentimento de fotos/IA é checado **só no cliente**; `addRegistro`/`atualizarJornada`/`excluirJornada` operam por `id` | `estetica.functions.ts:28-47,59-81,158-198`; `estetica.tsx:36-41` | Risco de IDOR em diário íntimo/simulação de rosto e de processar foto sem consent (falha de finalidade LGPD) — eficácia depende de RLS [NV] | confiança no RLS de tabelas sem migração + gate implementado na UI |
| **F03** | Roupas / Cabelo / Export | **"Baixar todas" e o download individual quebram** para `outfit` e `hair_plan`: `packageToMarkdown` acessa `c.variations` e `c.event_checklist`, campos que esses conteúdos nunca têm | `export.tsx:9,18-24`; `aura.ts:108-114`; `clothing.ts:9-17`; `hair.ts:30-36` | Erro em ação de saída; usuário acha que perdeu o conteúdo; suporte | template único assumindo `AuraPackage`; módulos criaram tipos próprios |
| **F04** | Roupas / Cabelo / Comparar | `/compare` renderiza "Custo: undefined", "Reversibilidade: undefined" etc. ao comparar outfit/hair: `Indicators` espera campos que esses planos não têm | `compare.tsx:43`; `PackageView.tsx:5-14`; `clothing.ts:9-17`; `hair.ts:30-36` | Comparação inútil e visualmente quebrada (é a ação de decisão principal) | mesma causa de F03 |
| **F05** | Meu Modelo | Após "Gerar meu modelo", o toast **"Seu modelo pessoal está pronto."** aparece mesmo quando as duas gerações falharam (o retorno de `gerarUm` é ignorado) | `modelo.tsx:106-114` (toast em `:112`) | Usuário é informado de um sucesso que não existe; fica sem imagem e sem entender o motivo | fluxo sequencial sem checagem de resultado |
| **F06** | Tatuagem / Vitrine / Briefing | "Quero essa" cria **URL assinada de 30 dias** de uma simulação da cliente **no próprio corpo** e envia a um terceiro, sem consentimento específico; enquanto o briefing do módulo diz "Nada será enviado a terceiros" | `vitrine.tsx:76-81`; `EnviarBriefing.tsx:49-52`; `TattooPlanView.tsx:30`; `PhotoUploader.tsx:49` ("Só você vê") | Quebra de confiança e de base legal (dado sensível — corpo/tatuagem); contradição de copy no mesmo módulo | compartilhamento tratado como detalhe do fluxo (mesmo padrão P0-2 do diagnóstico) |
| **F07** | Barba | O chip de cota do provador usa **`webapp.retrato.edit`** (2) sem dizer que é a cota do Retrato; testar 2 dos 6 estilos esgota o Retrato e vice-versa | `barba.tsx:80`; `uso.functions.ts:14`; `retrato.tsx:200` | Consumo cruzado invisível entre módulos; paywall inesperado no Retrato | reuso da task do retrato para o "provar barba" |
| **F08** | Aura Retrato | O **resultado** da edição não tem download, galeria, histórico nem exclusão — é estado (`resultado`) e um arquivo no cofre; refresh perde e não há como recuperar | `retrato.tsx:29,87-104,185-191`; `:59-63` apaga só a fonte | Usuário perde o produto principal da tela e o cofre acumula arquivos órfãos (privacidade/limpeza) | resultado tratado como preview, não como artefato |
| **F09** | Tatuagem / Jornada | Exclusões **sem confirmação** de conteúdo íntimo: registro do diário de cicatrização (`Excluir registro`), foto de referência corporal, foto do diário visual, reflexão | `TattooPlanView.tsx:41`; `TattooPhotos.tsx:19`; `JourneyWorkspace.tsx:132,134` | Perda irreversível de dado sensível com um clique; contraste com `Confirm` no resto do app | confirmação aplicada só em "objetos", não em "registros" |
| **F10** | Roupas / Guarda-roupa | Com o consentimento de fotos desligado, a foto escolhida é **silenciosamente ignorada**: a peça é salva sem imagem e sem aviso | `roupas/armario.tsx:45,75` | Usuário acredita que enviou a foto; acervo sem imagem; retrabalho | falta `else` com feedback quando `!consent.data` |

### 🟠 P1 — ativação, clareza e consistência

| ID | Módulo | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|---|
| **F11** | 6 telas de texto + estética | 402 de texto vira **toast sem cartão, sem preço e sem link** para `/aura-pass`; nenhuma dessas telas tem contador | `ai.server.ts:22`; `maquiagem/gerar.tsx:43`; `cabelo/gerar.tsx:37`; `roupas/gerar.tsx:38`; `TattooWorkspace.tsx:33`; `journey.functions.ts` (erros); `estetica.tsx:228` | Usuário lê "acabaram" e não tem próximo passo → churn silencioso | paywall implementado por tela (imagem) e não por shell |
| **F12** | Estética | O briefing gerado **não persiste**: `briefTxt` é estado; recarregar perde e não há histórico | `estetica.tsx:30,104,215` | Trabalho perdido na saída; o guia promete histórico | persistência só na imagem de referência, não no briefing |
| **F13** | Estética | Registros da jornada não podem ser editados nem apagados (só a jornada inteira); a foto de medição fica órfã no cofre (sem galeria/exclusão) | `estetica.functions.ts:158-198`; `estetica.tsx:49-52` | Erro de registro obriga apagar tudo; cofre cresce sem controle | backend só tem `add`/`update jornada` |
| **F14** | Estúdio | Desvio `barba`/`maquiagem` **descarta humor, ocasião, intensidade, "algo mais" e apresentação** escolhidos | `studio.tsx:37-39` | Usuário preenche e cai em tela em branco; repete o trabalho | `nav()` sem query/estado |
| **F15** | Todos | Destino pós-geração inconsistente: maquiagem/roupas → lista; cabelo/tatuagem/barba → detalhe; studio → dashboard | `maquiagem/gerar.tsx:45`; `roupas/gerar.tsx:39`; `cabelo/gerar.tsx:39`; `TattooWorkspace.tsx:33` | Não se aprende o padrão entre módulos; "sumiu minha geração" | cada módulo implementou seu próprio fim |
| **F16** | Cabelo | "Salvar"/"Não é para mim" **não checam erro** e mostram sucesso mesmo se o update falhar; "Feito"/"Desativar" dos alertas idem | `cabelo/plano.$id.tsx:33-37`; `cabelo/alertas.tsx:27-30` | Falso sucesso → perda de estado e desconfiança | `await` sem `error` |
| **F17** | Todos | "Salvar" com 4 significados e **3 dicionários de status** (4 do aura, 6 de roupas, 7 da jornada) | `aura.ts:37`; `clothing.ts:5`; `journey.ts:9-12`; `TattooPlanView.tsx:26` | Usuário não sabe o que o botão faz nem o que cada estado significa | evolução modular sem glossário |
| **F18** | Todos | Matriz de ações divergente: excluir existe em roupas/cabelo/tatuagem-projeto, **não** em look de maquiagem nem em versão de tatuagem; histórico só no DNA; duplicar só "adaptar" em pacote | §14.1 | Funcionalidade "some" conforme o módulo; treinamento impossível | cada módulo define suas ações |
| **F19** | Maquiagem | Look não pode ser excluído; não há exportar imagem; "Exportar" só gera `.md` | `maquiagem/look.$id.tsx:100-107` | Acervo cresce para sempre; usuário não leva a imagem | falta CRUD no módulo |
| **F20** | Maquiagem / Assinatura | Edição por **textarea de JSON cru**, sem validação de campos, **sem toast de sucesso** e com `insert` (não update) a cada edição | `maquiagem/assinatura.tsx:35-42,65-68` | Usuário precisa saber JSON; histórico infla; silêncio no sucesso | atalho de "edição" |
| **F21** | Maquiagem / Kits | Clicar num preset **gera na hora** (sem confirmação nem prévia) e "Excluir" apaga sem confirmação | `maquiagem/kits.tsx:40-41,36,48` | Gasto acidental; perda acidental | presets como ação primária |
| **F22** | Barba | Planos de barba não têm gestão (sem excluir, sem data, status binário fixo); prova não pode ser baixada/persistida; "Barba hoje" obrigatório sem mensagem | `barba.tsx:69,81,94` | Acervo inutilizável; beco sem saída no plano | módulo de página única sem CRUD |
| **F23** | Tatuagem | `ProjectSelect` vazio em 5 telas e briefing sem conceito com texto morto ("Gere um conceito primeiro.") sem link | `TattooPhotos.tsx:19`; `TattooPlanView.tsx:30,35,41` | Beco sem saída a partir de link direto/aba | seletor repetido como único acesso |
| **F24** | Tatuagem | Vitrine **não está na nav do módulo** (7 links) e depende da trilha Estilo para aparecer no header | `tatuagem/route.tsx:5`; `trilhas.ts:43` | A funcionalidade de marketplace fica invisível para quem entra em Tatuagens | vitrine entregue como página avulsa |
| **F25** | Jornada | Plano pode nascer com 0 passos; o diário **exige passo** para aceitar foto, mas a UI oferece "Registro livre"; resultado: plano beco sem saída | `JourneyWorkspace.tsx:48,95,130-131` | Usuário cria plano e não consegue registrar nada | teste de "passo opcional" sem revisar dependências |
| **F26** | Jornada | Mudar status de passo não dá feedback; não há remover passo nem apagar lembrete | `JourneyWorkspace.tsx:99,103`; `journey.functions.ts:50,125` | Ações invisíveis/irreversíveis em conteúdo que alimenta relatório | só `add` no backend |
| **F27** | Roupas | Lacunas/compra/missões **sem estado de erro/loading**; cada execução empilha análise no banco mas a UI mostra só a última ou lista sem exclusão | `lacunas.tsx:24-34`; `compra.tsx:26-32`; `missoes.tsx:22-32`; `clothing.functions.ts:90,105,119` | Cliques repetidos (custo), histórico invisível e não limpável | telas escritas no estilo "one-shot" |
| **F28** | Roupas | Salvar perfil loga `onboarding_completed` (evento errado); "Usei hoje" não tem consequência visível | `roupas/perfil.tsx:40`; `armario.tsx:60,89` | Funil de ativação contaminado; ação sem valor percebido | reaproveitamento de evento |
| **F29** | Maquiagem / Cabelo | Banner "perfil vazio" checa **existência da linha**, não conteúdo: salvar perfil vazio silencia o aviso | `maquiagem/gerar.tsx:37,52-54`; `cabelo/gerar.tsx:31,46` | Sugestões piores sem aviso; promessa do módulo quebrada | query `select("user_id")` |
| **F30** | ReferenceImage (6 telas) | Quando `generated_references.status='generating'` sobrevive a um reload, novas gerações são bloqueadas; a mensagem manda "descarte" mas **não há botão** — o único caminho é um ícone de lixeira sem rótulo e sem confirmação | `ReferenceImage.tsx:328,239-240`; `references.functions.ts:107-110` | Usuário fica sem conseguir gerar imagem e sem saber como sair | estado de máquina exposto na UI sem ação correspondente |
| **F31** | Todos | Paywall detectado por **regex em string de erro** em 6 pontos + 7 frases diferentes para o mesmo limite + preço duplicado em texto (`guia.tsx:36`) | §11.4 | Se a mensagem do gateway mudar, o paywall desaparece; usuário vê ofertas diferentes | sem tipo de erro/preço único |
| **F32** | Todos | Nenhum formulário de criação tem **draft/autosave**: sair no meio perde intenção de tatuagem, passos da jornada, pedido do retrato, notas, campos de geração | §11.3 | Retrabalho e abandono; contradiz o guia | só o onboarding tem autosave |
| **F33** | Todos | "Colecionar" só existe em `/collections` (sem link no detalhe, exceto plano de tatuagem); "Comparar" só tem link no detalhe de look de maquiagem e no plano de tatuagem — ausente em pacote, cabelo, roupas e barba | `TattooPlanView.tsx:26`; `maquiagem/look.$id.tsx:106`; `package.$id.tsx:121-142` | Ações globais ficam escondidas | telas de detalhe não receberam os links |
| **F34** | Profissionais | 4 abas com 2 personas; "Recebidos" **não aparece** quando vazio; toasts de briefing mandam para tela invisível no menu | `profissionais.tsx:197-202`; `:199`; `EnviarBriefing.tsx:54`; `vitrine.tsx:81` | Profissional novo nunca descobre a aba; cliente não acha a resposta | rede sem IA de navegação |
| **F35** | Tatuagem / Jornada | `loader` + `useSuspenseQuery` sem boundary local: qualquer falha em `tattooData`/`journeyData` derruba **todas as abas** e não há retry | `tatuagem/route.tsx:4`; `journey/index.tsx:4`; `JourneyWorkspace.tsx:15-16` | Módulo inteiro indisponível por 1 query; sem recuperação | estado de carregamento "tudo ou nada" |

### 🟡 P2 — polimento, acessibilidade e copy

| ID | Módulo | Problema | Evidência | Impacto |
|---|---|---|---|---|
| **F36** | DNA | "Restaurar" sem confirmação; "Isso está errado" em lista grava `[]`; versões sem estado de erro; preferências aceita tudo vazio | `dna/versoes.tsx:26-33,52`; `dna/index.tsx:120`; `dna/versoes.tsx:35-37`; `dna/preferencias.tsx:60-69` | Perda de configuração de 1 clique; erro confundido com "vazio" |
| **F37** | DNA | "Barba" vem **desligada por padrão** (`=== true`) e a tela não explica; os demais módulos vêm ligados | `dna/permissoes.tsx:49`; `beard.functions.ts:14` | DNA de barba nunca é usado por default |
| **F38** | Modelo | Fotos-fonte (`modelo-src-*`) não entram em `photos` e não são gerenciáveis após reload | `modelo.tsx:64-71`; `modelo.tsx:34-44` | Cofre acumula imagens sem UI; risco de privacidade |
| **F39** | Retrato | Retry automático consome **2ª unidade** da cota sem aviso prévio | `retrato.tsx:112-120`; `:195` | Usuário vê "restam 0" sem entender |
| **F40** | Tatuagem | "Sua reação" começa com nota 4; quem não escolhe grava 4 no DNA | `TattooPlanView.tsx:22,26` | Sinal de preferência falso |
| **F41** | Maquiagem / Roupas | "Aprovar" registra `look_saved`; em roupas 4 status registram `outfit_saved` | `maquiagem/look.$id.tsx:102`; `clothing.functions.ts:130` | DNA/analytics com sinal trocado |
| **F42** | Todos | Copy: "A verificação reprovar a edição" (erro de português), jargão "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" nos rodapés de maquiagem/cabelo/roupas/tatuagem, 10–11 px em avisos | `retrato.tsx:117`; `maquiagem/route.tsx:26`; `cabelo/route.tsx:23`; `roupas/route.tsx:26`; `tatuagem/route.tsx:5`; `vitrine.tsx:115` | Primeira impressão amadora; contradiz o hero |
| **F43** | Formulários | Sliders sem `id`/`aria-label`; `Label` sem `htmlFor`; cards de opção sem `aria-pressed`; abas sem `aria-current` | §11.5 | Barreira para leitor de tela e teclado |
| **F44** | Responsividade | `compare` com colunas inline; tabela do DNA sem scroll; abas de Roupas com `overflow-x-auto` sem indicador; header com ~20 alvos | `compare.tsx:38`; `dna/versoes.tsx:66`; `roupas/route.tsx:20`; `route.tsx:47-64` | Uso ruim em 360 px (mobile) |
| **F45** | Cotas | Contador lê só `ai_runs.status=completed`; falhas/retries/custo podem divergir do gateway | `uso.functions.ts:33` | Contador pode mentir [I/NV] |
| **F46** | Jornada | "Meu mês em imagens" não contém imagens (só texto; prompt diz que fotos não foram analisadas) | `JourneyWorkspace.tsx:95`; `journey.functions.ts:116` | Expectativa frustrada no output principal |
| **F47** | Estética | "Trocar procedimento" limpa foto/análise/briefing mas **não** `simImg`/`reMedida` | `estetica.tsx:148` | Antes/depois antigo pode reaparecer com nova medição |
| **F48** | Barba | Briefing só existe para barbeiro (`profissaoFixa`), sem escolha de profissional | `barba.tsx:90` | Quem quer cabeleireiro/esteticista não tem caminho |
| **F49** | DNA | As mesmas preferências (cores/estilos) existem no Resumo e em Preferências, sem indicar a fonte da verdade | `dna/index.tsx:99-101`; `dna/preferencias.tsx:76-81` | Edição no lugar errado é sobrescrita |
| **F50** | Tatuagem | "Guardar escolha" grava `selected_level` no projeto sem confirmação e sem indicar onde isso é usado | `TattooPlanView.tsx:30` | Ação sem consequência visível |

### 🟢 Pontos fortes a preservar no escopo

| ID | Ponto | Evidência |
|---|---|---|
| **G01** | Tatuagem é o único fluxo com **confirmação obrigatória de exportação** e exclusão do lote em `/export` | `TattooPlanView.tsx:30`; `export.tsx:19,38` |
| **G02** | Consentimento de foto corporal em **2 níveis** com texto explícito e revogação | `TattooPhotos.tsx:17-19`; `tattoo.functions.ts:62-68` |
| **G03** | Briefing de barba **determinístico** (zero IA/custo) e prova sobre o modelo pessoal | `barba.tsx:64-68` |
| **G04** | Estética: medição sem julgamento, disclaimer em 3 pontos e **re-leitura** antes/depois com delta | `estetica.tsx:171-183,188-213`; `estetica.functions.ts:26` |
| **G05** | Relatório de jornada com **checkbox de saída de dados** e promessa explícita de excluir notas emocionais/fotos | `JourneyWorkspace.tsx:165`; `journey.ts:26`; `journey.functions.ts:116` |
| **G06** | Exclusões granulares do DNA com `Confirm` (5 escopos) e export JSON | `dna/redefinir.tsx:31-54` |
| **G07** | `QuotaChip` mostra "Pass ativo" e "grátis esgotado" com link de gestão — bom padrão quando usado | `QuotaChip.tsx:24,31-35` |
| **G08** | Jornada: nota emocional privada com switch "usar no relatório" e texto "nunca exportada" | `JourneyWorkspace.tsx:79-80` |

---

## 14. Anexos

### 14.1 Matriz de ações por módulo (o que o usuário pode fazer em cada lugar)

Legenda: **●** existe e funciona · **◐** existe parcial/condicionado · **○** não existe · **!** destrutivo sem confirmação

| Ação | Maquiagem | Cabelo | Roupas | Tatuagem | Barba | Estética | Jornada | DNA |
|---|---|---|---|---|---|---|---|---|
| Gerar novo (texto) | ● `gerar.tsx:87` | ● `gerar.tsx:63` | ● `gerar.tsx:50` | ● `TattooWorkspace.tsx:34` | ● `barba.tsx:69` | ● (medir/simular/briefing) | ● (sugerir, relatório) | ● `dna/index.tsx:81` |
| Prévia visual do resultado | ● `look.$id.tsx:80` | ● `plano.$id.tsx:92` | ● `look.$id.tsx:69` | ● `TattooPlanView.tsx:26` | ◐ só a prova | ● | ○ (sem imagem) | ○ |
| Salvar | ● `look.$id.tsx:101` | ● `plano.$id.tsx:62` | ● status `look.$id.tsx:59` | ● `TattooPlanView.tsx:26` | ○ (só perfil) | ○ | ● (reflexão/foto) | ● (edição) |
| Aprovar / rejeitar | ● 3 variações de reação | ◐ salvar/rejeitar | ● 5 status | ● salvar/rejeitar | ○ | ○ | ◐ 7 status | ○ |
| Comparar | ● link `look.$id.tsx:106` | ○ | ◐ via `/compare` | ● `TattooPlanView.tsx:26` | ○ | ○ | ○ | ● `dna/versoes.tsx` |
| Colecionar | ○ | ○ | ○ | ● link | ○ | ○ | ○ | ○ |
| Exportar documento | ● `.md` `look.$id.tsx:105` | ● guia `.md` + print | ○ | ● briefing `.md` (confirm.) | ○ | ● `.md` copiar/baixar | ● relatório `.md` | ● JSON |
| Exportar imagem | ○ | ○ | ○ | ◐ download da referência | ○ | ○ | ○ | ○ |
| Enviar a profissional | ◐ via imagem | ◐ via imagem | ◐ via imagem | ● briefing | ● briefing | ● briefing | ○ | ○ |
| Duplicar / adaptar | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Histórico / versões | ◐ assinatura | ○ | ○ | ◐ lista de versões | ○ | ○ | ○ | ● versões + restaurar |
| Apagar item | ○ | ● plano (Confirm) | ● look (Confirm) | ◐ projeto (Confirm); registro `!`; foto `!` | ○ | ◐ jornada (`confirm()`) | ● plano/relatório (Confirm); foto/reflexão `!` | ● 5 escopos (Confirm) |
| Restaurar | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● sem confirmação |
| Rascunho / retomada | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

**Leitura:** nenhum módulo oferece o conjunto completo; o único com histórico é o DNA; o único com "colecionar" linkado é a tatuagem; "duplicar" não existe em nenhum módulo (só "Adaptar" em pacote genérico, `package.$id.tsx:136-140`).

### 14.2 Matriz de cotas (o que é cobrado, o que é mostrado, onde a ação fica)

| task_id | Limite (`LIMITES`) | Ação que usa | Telas | Chip? | Evidência |
|---|---|---|---|---|---|
| `webapp.reference.render` | 5 | imagem de referência de look/tatuagem | 6 detalhes via `ReferenceImage` | sim | `uso.functions.ts:12`; `ReferenceImage.tsx:243` |
| `webapp.ink.render` | 5 | lettering/composição de tatuagem | `ReferenceImage` (tattoo) | sim | `ReferenceImage.tsx:148,243` |
| `webapp.retrato.edit` | 2 | Aura Retrato **e prova de barba** | `/retrato`, `/barba` | sim (barba sem rótulo) | `retrato.tsx:200`; `barba.tsx:80` |
| `webapp.modelo.render` | 2 | Meu Modelo (rosto+corpo = 1 rodada) | `/modelo` | sim | `modelo.tsx:187` |
| `webapp.tryon.render` | 2 | provador de roupa (catálogo) | `ReferenceImage` (look) | sim | `ReferenceImage.tsx:243`; `catalogo.functions.ts:73` |
| `webapp.ink.tryon` | 2 | "Copiar pra mim" da vitrine | `/tatuagem/vitrine` | sim | `vitrine.tsx:91`; `vitrine.functions.ts:126` |
| `webapp.estetica.sim` | **ausente** | simulação estética | `/estetica` | **não** | `estetica.functions.ts:70` |
| `webapp.json` (texto) | **ausente** | 13 superfícies de texto | todas | **não** | `ai.server.ts:53` |
| `webapp.vision` | **ausente** | medição de simetria, verificação de imagem | `/estetica`, `ReferenceImage`, `/retrato` | **não** | `ai.server.ts:59` |
| `pos_geracao_guia`, `tattoo_brief`, `look_brief`, `briefing_estetico`, `journey_report`, `journey_plan` | **ausentes** | guias/briefings/relatórios | várias | **não** | `ai.server.ts` / functions |

### 14.3 Cobertura, arquivos e limites

**Lido integralmente:** `maquiagem/{route,index,gerar,perfil,assinatura,kits,manual,look.$id}`, `cabelo/{route,index,gerar,perfil,alertas,plano.$id}`, `roupas/{route,index,gerar,perfil,armario,lacunas,compra,missoes,look.$id}`, `tatuagem/{route,index,gerar,briefing,decisao,referencias,perfil,plano.$id,cuidados,vitrine}`, `jornada/{index,objetivo,diario,galeria,linha-do-tempo,relatorios,plano.$id,relatorio.$id}`, `dna/{route,index,preferencias,permissoes,versoes,linha-do-tempo,redefinir}`, `barba.tsx`, `estetica.tsx`, `retrato.tsx`, `modelo.tsx`, `studio.tsx`, `package.$id.tsx`, `collections.tsx`, `compare.tsx`, `export.tsx`, `profissionais.tsx`, `_authenticated/route.tsx`; componentes `tattoo/*`, `journey/JourneyWorkspace`, `PackageView`, `PhotoUploader`, `GenerationPresentation`, `PresentationChoice`, `ReferenceImage`, `TrilhaPicker`, `QuotaChip`, `Confirm`, `EnviarBriefing`, `JornadaEstetica`; libs `aura.ts`, `trilhas.ts`, `presentation.ts`, `makeup.ts`, `hair.ts`, `clothing.ts`, `tattoo.ts`, `journey.ts`, `uso.functions.ts`, `ai.server.ts`, `stripe.functions.ts`, `makeup.functions.ts`, `hair.functions.ts`, `clothing.functions.ts`, `tattoo.functions.ts`, `beard.functions.ts`, `estetica.functions.ts`, `journey.functions.ts`, `aura.functions.ts`, `references.functions.ts`, `modelo.functions.ts`, `retrato.functions.ts`, `vitrine.functions.ts`, `catalogo.functions.ts`.
**Não lido / fora do escopo:** `onboarding*`, `dashboard`, `auth`, `p/$slug`, `settings`, `aura-pass`, `admin`, `guia`, `consent` (cobertos pela task-1); `src/components/ui/*` (amostra); Edge Functions `ai-gateway`/`stripe-*` (não estão no repo); migrations/RLS; `src/lib/tattoo-brief.ts`, `stencil.ts`, `stream-image.ts` (lidos só por referência de uso).

**Não verificável neste workspace [NV]:** contagem/limite real do gateway e se ele conta falhas/retries; RLS das 9 tabelas sem migração (estética, vitrine, briefings, profissionais); existência da coluna `style_analyses.done`; conteúdo histórico gravado (se algum `outfit` antigo tiver `variations`, F03 muda); comportamento de `Slider`/`Switch` shadcn com teclado; contraste real no navegador; se o checkout cobra "Pix ou cartão" como o copy diz; comportamento de `useSuspenseQuery` sob erro de rede (boundary do root).

### 14.4 Resumo executivo — o que corrigir primeiro (esforço × impacto)

| Ordem | Correção | Resolve | Esforço |
|---|---|---|---|
| 1 | `packageToMarkdown` com template por `kind` + fallback (ou excluir outfit/hair do lote) | F03, F04 | baixo |
| 2 | Checar retorno de `gerarUm` no modelo e não mostrar sucesso falso | F05 | baixo |
| 3 | `Confirm` em todas as exclusões de registros íntimos (tatuagem/jornada) | F09 | baixo |
| 4 | Mostrar a cota/aviso de custo antes da 1ª ação de IA em estética e nas 6 telas de texto + cartão de paywall com link | F01, F07, F11, F31 | médio |
| 5 | Adicionar `webapp.estetica.sim` a `LIMITES` e `QuotaChip` em `/estetica`; rotular a cota do barba como "Retrato" ou separar a task | F01, F07 | baixo |
| 6 | Persistir o briefing da estética (rascunho em `estetica_jornada` ou coluna nova) e oferecer histórico | F12 | médio |
| 7 | Botão de download/galeria/exclusão para o resultado do Retrato | F08 | baixo |
| 8 | Feedback de erro real em cabelo (status/alertas) e checagem de consent no upload do armário | F10, F16 | baixo |
| 9 | Consentimento específico antes de enviar foto/simulação a profissional (checkbox + registro) e corrigir a copy "só você vê"/"nada será enviado" | F06 | médio |
| 10 | Padronizar pós-geração (sempre abrir o detalhe gerado), glossário de status e links de comparar/colecionar nos detalhes | F15, F17, F18, F33 | médio |

**Conclusão do escopo:** os módulos **geram bem** (prompts cuidadosos, disclaimers fortes, consentimentos específicos em tatuagem/modelo, verificação de imagem em referência/retrato). O que os impede de serem confiáveis como *fluxo* é a camada de gestão e de comunicação: cada módulo inventou seu fim de fluxo, suas ações e seu dicionário; os custos de IA de texto e de estética são invisíveis; e as ações destrutivas têm três tratamentos (Confirm, `confirm()` nativo, nenhum). Os 10 P0 são corrigíveis sem redesenho — e 5 deles em menos de um dia de trabalho (F03, F04, F05, F09, F10).

---

*Documento produzido por leitura estática. Nenhum arquivo de `webapp-lovable/src` foi modificado. Este é o único arquivo escrito por esta auditoria.*




