# Auditoria de produto/frontend — Aura ID (webapp)

> Escopo: `C:\Users\Felip\Desktop\APP Mobile AURA ID\webapp-lovable` · data da leitura: 2026-11-07
> Método: leitura integral dos arquivos listados na tarefa (rotas, componentes fora de `ui/`, `lib/trilhas.ts`, `lib/onboarding.ts`, `lib/aura.ts`, `styles.css`, `routeTree.gen.ts`). Amostra de `ui/`: `button`, `dialog`, `alert-dialog`, `sonner`, `sidebar`.
> Nenhum build/teste foi executado (fora do meu escopo). Não houve execução do app: nada aqui descreve comportamento observado em runtime, apenas o que o código determina.
>
> **Legenda**: [C] = CONFIRMADO no código · [I] = INFERIDO do código (exige confirmação em runtime) · [A] = AUSENTE (não existe no código). Confiança: alta / média / baixa.
> Se algo não está citado, é porque não foi lido — não porque está correto.

---

## 0. Números do produto (contagem verificada em `src/routes/**/*.tsx`)

- **63 páginas** + **7 layouts/root** (`__root.tsx`, `_authenticated/route.tsx`, e os 5 `route.tsx` de módulo) + **1 rota de API de imagem** (`src/routes/api/reference-image.ts`). Fonte: glob de `src/routes` (70 arquivos `.tsx`) e conferência em `src/routeTree.gen.ts`.
- **60 páginas autenticadas**, **3 públicas** (`/`, `/auth`, `/p/$slug`) [C].
- **9 superfícies distintas de geração por IA** e **5 "mini-onboardings"** de perfil por módulo (ambos detalhados em §3.2).
- **Até 14 links de menu** (6 fixos + 8 de trilhas) + **6 botões** (Estética, Modelo, Retrato, Pass, Trilhas, Sair) → **~20 alvos de clique** numa barra com `overflow-x-auto` (`src/routes/_authenticated/route.tsx:47-64`) [C].
- **9 componentes `ui/` sem uso fora de `ui/`**: `sidebar`, `chart`, `carousel`, `command`, `menubar`, `navigation-menu`, `breadcrumb`, `pagination`, `calendar` (grep por import fora de `src/components/ui` retornou **zero**) [C]. O app não usa sidebar; a navegação é um header horizontal.

---

## 1. Inventário de telas

### 1.1 Públicas / root

| Rota | Título | Objetivo | Alvo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|---|
| `/` | "Um jeito mais gentil de se tornar quem você quer mostrar" | Conversão para cadastro | Visitante | 4 princípios, hero em CSS, 2 CTAs ("Começar meu perfil", "Nossos princípios") | estático, sem loading/erro | nenhum | público | `src/routes/index.tsx:25-68` |
| `/auth` | "Que bom te ver" / "Comece com calma" | Login/cadastro | Visitante | Google OAuth, e-mail+senha, toggle entrar/criar | busy no submit, toast de erro | `supabase.auth` | público | `src/routes/auth.tsx:24-81` |
| `/p/$slug` | "${nome} · AURA ID · REDE DE PROFISSIONAIS" | Landing pública da profissional | Cliente vinda de link social | nome/verificado, bio, Instagram/WhatsApp, "como funciona" 3 passos, CTA briefing | carregando / ok / vazio / erro ( estado 'erro' separado de 'vazio') | `perfilProfissional` | público | `src/routes/p.$slug.tsx:31-85` |
| `/` 404 / erro | "Página não encontrada" / "Esta página não carregou" | Fallback global | Todos | botões "Tentar novamente" e "Voltar ao início" | — | — | global | `src/routes/__root.tsx:19-77` |

Notas de root:
- `FeedbackButton` é montado no root, então aparece **inclusive em `/` e `/auth`** (`src/routes/__root.tsx:138`; comentário confirma em `src/components/FeedbackButton.tsx:19`).
- `Toaster` fixo em `top-center` (`src/routes/__root.tsx:137`) e o botão de opinião fixo em `bottom-4 right-4 z-40` (`src/components/FeedbackButton.tsx:45`).
- Metadata/SEO só existe em rotas; `/estetica`, `/aura-pass`, `/guia`, `/retrato`, `/modelo`, `/profissionais` têm apenas `title` sem `description`/OG (`src/routes/_authenticated/estetica.tsx:13`, `aura-pass.tsx:9`, `guia.tsx:5`, `retrato.tsx:14`, `modelo.tsx:14`, `profissionais.tsx:17`) [C].

### 1.2 Shell autenticado

| Item | Descrição | Evidência |
|---|---|---|
| Gate | `beforeLoad`: exige sessão → `/auth`; exige linha em `consents` → `/consent`; exige `visual_profiles.completed` → `/onboarding`; `ssr:false` | `src/routes/_authenticated/route.tsx:8-24` |
| Nav | `LINKS_FIXOS` = Estúdio, Sugestões, DNA Visual, Comparar, Exportar, Configurações + links das trilhas | `src/lib/trilhas.ts:84-96` |
| Header | marca + nav (`overflow-x-auto`) + 4 botões de módulo (Estética, Modelo, Retrato, Pass) + botão Trilhas + Sair | `src/routes/_authenticated/route.tsx:46-65` |
| Trilhas | 4 trilhas; usuário escolhe 1–3; sem escolha → modal obrigatório no primeiro load | `src/lib/trilhas.ts:17-57`, `src/components/TrilhaPicker.tsx:11-65` |
| Estado loading | não há skeleton de shell; conteúdo entra direto | [A] |
| Estado erro de shell | erro do beforeLoad cai no `ErrorComponent` do root | `src/routes/__root.tsx:41-77` |

### 1.3 DNA Visual (`/dna`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| `/dna` (index) | "DNA Visual" | Retrato editável do estilo | banner de revisão se ≥10 sinais; botão Gerar/Atualizar; 17 campos editáveis ("Editar" / "Isso está errado"); notas por módulo | skeleton; vazio ("ainda não foi gerado"); personalização desligada; pausado; erro | `consents`, `visual_dna`, `dna_corrections`, `dna_versions`, `audit_events` | sim (fixo) | `src/routes/_authenticated/dna/index.tsx:21-147` |
| `/dna/preferencias` | "Cores"/"Estilos"/"Objetivos"/"Corpo e mudanças"/"Vida real" | Editar preferências granulares | chips com seletor de cor, textareas, slider de tolerância; botão único salvar | skeleton; erro só por toast | `preferences` | sim | `src/routes/_authenticated/dna/preferencias.tsx:50-101` |
| `/dna/linha-do-tempo` | (sem h1) lista de sinais | Ver o que alimentou o DNA | filtros por módulo (Todos/Maquiagem/Cabelo/Roupas/Tatuagem/Outros); lista vertical | skeleton; vazio; erro | `audit_events` | sim | `src/routes/_authenticated/dna/linha-do-tempo.tsx:23-60` |
| `/dna/permissoes` | "Permissões" (h2 "Por módulo") | Controlar uso do DNA | 2 switches globais + 7 switches por módulo | skeleton; erro; disabled em cascata | `consents` | sim | `src/routes/_authenticated/dna/permissoes.tsx:23-53` |
| `/dna/versoes` | "Comparação" (h2) | Histórico + comparar 2 versões | checkbox (máx. 2), "Ver", "Restaurar", tabela de comparação | skeleton; vazio; sem estado de erro | `dna_versions` | sim | `src/routes/_authenticated/dna/versoes.tsx:19-79` |
| `/dna/redefinir` | "Exportar meus dados"/"Redefinir" | Exportar JSON e apagar partes | download JSON de 12 tabelas; 5 `Confirm` | sem loading/progresso; erros por toast | 12 tabelas | sim | `src/routes/_authenticated/dna/redefinir.tsx:14-61` |

### 1.4 Maquiagem (`/maquiagem`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| layout | "Maquiagem" | — | 6 abas + rodapé com disclaimer | — | — | sim (trilha Visual) | `src/routes/_authenticated/maquiagem/route.tsx:13-28` |
| `/maquiagem` | "Meus looks" (h2 "Nenhum look ainda") | Listar looks | cards com título/invitation/indicadores; filtros todos/novos/salvos/aprovados/rejeitados | skeleton (2); vazio com 2 CTAs; erro | `packages kind='makeup_look'` | sim | `src/routes/_authenticated/maquiagem/index.tsx:19-58` |
| `/maquiagem/gerar` | (sem h1) "Escolha um modo" | Gerar looks | 10 modos, toggle Rápido/Detalhado, ocasião, intensidade, luz, humor, fotos (só no detalhado) | busy no CTA; aviso se perfil de pele vazio; sem erro persistente | `makeup_profiles`; `generateMakeupLooks` | sim | `src/routes/_authenticated/maquiagem/gerar.tsx:24-91` |
| `/maquiagem/perfil` | "Perfil de pele" (h2s) | Perfil de pele/alergias | tipo de pele, alergias, ingredientes, condições, produtos, acabamento, 2 sliders, orçamento, referências; "Excluir dados de alergia" | skeleton; sem validação; erro por toast | `makeup_profiles` | sim | `src/routes/_authenticated/maquiagem/perfil.tsx:27-77` |
| `/maquiagem/assinatura` | (h2 nome da assinatura) | Assinatura pessoal | gera/atualiza; histórico; "Editar" abre **textarea de JSON cru** | skeleton; vazio explicativo; erro por toast | `makeup_signatures` | sim | `src/routes/_authenticated/maquiagem/assinatura.tsx:20-75` |
| `/maquiagem/kits` | (h3 nome do kit) | Kits de confiança | 6 presets + campo livre; lista de kits com itens/preços/total; "Excluir" **sem confirmação** | skeleton; vazio; erro por toast | `confidence_kits` | sim | `src/routes/_authenticated/maquiagem/kits.tsx:21-60` |
| `/maquiagem/manual` | "Meu manual de maquiagem" | Manual imprimível | assinatura + kits + looks salvos; Baixar .md / Imprimir | skeleton; vazio; **sem tratamento de erro** (`q.data!`) | `makeup_signatures`, `confidence_kits`, `packages` | sim | `src/routes/_authenticated/maquiagem/manual.tsx:15-49` |
| `/maquiagem/look/$id` | título do look | Detalhe e reação | 3 variações com checklist/produtos/ordem, ajustes, riscos, 5 ações de status, notas, "Depois de usar" (2 sliders + reflexão) | skeleton; "não existe mais"; erro por toast | `packages`, `feedback`, `visual_dna` | via lista | `src/routes/_authenticated/maquiagem/look.$id.tsx:22-119` |

### 1.5 Cabelo (`/cabelo`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| layout | "Cabelo" | — | 4 abas + disclaimer | — | — | sim (trilhas Cabelo/Barbearia) | `src/routes/_authenticated/cabelo/route.tsx:10-25` |
| `/cabelo` | "Meus planos" (h2 "Nenhum plano ainda") | Listar planos + alertas vencidos | banner "Lembretes para agora"; cards com objetivo/data/status | skeleton; vazio com 2 CTAs; erro | `packages kind='hair_plan'`, `hair_alerts` | sim | `src/routes/_authenticated/cabelo/index.tsx:16-55` |
| `/cabelo/gerar` | "Qual é o seu objetivo?" | Gerar plano | 10 objetivos, 5 humores, campo livre; aviso de perfil vazio | busy; erro por toast | `hair_profiles`, `generateHairPlan` | sim | `src/routes/_authenticated/cabelo/gerar.tsx:22-66` |
| `/cabelo/perfil` | (h2s) | Perfil capilar | textura, comprimento, 4 níveis de química/dano, 2 sliders, imagem desejada, **checkbox "modo barbearia"**, 2 `PhotoUploader` | skeleton; sem validação | `hair_profiles`, `photos` | sim | `src/routes/_authenticated/cabelo/perfil.tsx:26-72` |
| `/cabelo/alertas` | (sem h1) | Lembretes de manutenção | 4 tipos, ativar/feito/desativar; "por e-mail ainda não conectado" | lista direta; erros por toast | `hair_alerts` | sim | `src/routes/_authenticated/cabelo/alertas.tsx:15-47` |
| `/cabelo/plano/$id` | título do plano | Plano completo | 3 propostas, timeline, guia de salão (frases/perguntas/evitar), rotina, 5 ações, "Como foi?" (1–5) | skeleton; "não encontrado"; **status salvo sem checar erro** | `packages` | via lista | `src/routes/_authenticated/cabelo/plano.$id.tsx:21-123` |

### 1.6 Roupas (`/roupas`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| layout | "Roupas" | — | **7 abas** com `overflow-x-auto` + disclaimer | — | — | sim (trilha Estilo) | `src/routes/_authenticated/roupas/route.tsx:13-28` |
| `/roupas` | "Meus looks" (h2 "Nenhum look ainda") | Listar looks | banner "N looks em teste"; filtros pelos 6 status de `OUTFIT_STATUS`; cards com cores | skeleton; vazio com 2 CTAs; erro | `packages kind='outfit'` | sim | `src/routes/_authenticated/roupas/index.tsx:17-53` |
| `/roupas/gerar` | (sem h1) | Gerar looks | 9 ocasiões, 4 climas, 5 humores, campo livre; aviso de guarda-roupa vazio | busy; erro por toast | `wardrobe_items`, `generateOutfits` | sim | `src/routes/_authenticated/roupas/gerar.tsx:22-52` |
| `/roupas/perfil` | (sem h1) | Perfil de estilo | 9 campos de texto puro | skeleton; sem validação | `style_profiles` | sim | `src/routes/_authenticated/roupas/perfil.tsx:31-52` |
| `/roupas/armario` | "Adicionar peça" (h2) | Guarda-roupa | 7 categorias, nome/cor/tecido, formalidade, foto opcional; grid; "Usei hoje"; "Excluir" com `Confirm` | skeleton; vazio; foto bloqueada sem consentimento | `wardrobe_items`, `photos` | sim | `src/routes/_authenticated/roupas/armario.tsx:24-97` |
| `/roupas/lacunas` | "Peças-chave que faltam" | Análise de lacunas + cápsula | botão analisar, cards de peças com "N combinações", cápsula | skeleton; vazio explicativo; **sem estado de erro** | `style_analyses kind='gaps'` | sim | `src/routes/_authenticated/roupas/lacunas.tsx:20-54` |
| `/roupas/compra` | "O que você está pensando em comprar?" | Checklist pré-compra | peça/preço/motivo; lista de análises com veredito/parecidas/custo por uso | vazio; validação mínima; erro por toast | `style_analyses kind='purchase'` | sim | `src/routes/_authenticated/roupas/compra.tsx:21-62` |
| `/roupas/missoes` | (sem h1) | Missões semanais | botão criar; cards com 3 missões; "Concluí" | **sem skeleton e sem erro** | `style_analyses kind='missions'` | sim | `src/routes/_authenticated/roupas/missoes.tsx:18-41` |
| `/roupas/look/$id` | título do look | Detalhe do look | 3 versões com peças (`seu`/`ideia`), calçado/bolsa/acessórios, variações de clima, 5 botões de status, 2 escalas + reflexão, "Excluir" | skeleton; "não encontrado" | `packages`, `feedback` | via lista | `src/routes/_authenticated/roupas/look.$id.tsx:24-89` |

### 1.7 Tatuagem (`/tatuagem`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| layout | — | — | 7 links de aba + rodapé com disclaimer dinâmico; **loader + `useSuspenseQuery`** | erro de rede = boundary da seção | `tattooData` | sim (trilha Estilo) | `src/routes/_authenticated/tatuagem/route.tsx:4-5` |
| `/tatuagem` | "Tatuagens" | Projetos | contadores "N projetos · N versões", grid de projetos com 4 ações + `Confirm` de exclusão | vazio ("primeiro projeto começa com uma intenção") | `tattoo_projects`, `packages` | sim | `src/components/tattoo/TattooWorkspace.tsx:20-23` |
| `/tatuagem/perfil` | "Sua intenção" | Criar/editar intenção | nome, região, estilo, visibilidade, tamanho, orçamento, 4 textos + seção "Só se quiser contar" (dor, pele, tatuagens, cicatriz) | submit busy; erro por toast; **sem validação além de required** | `tattoo_projects` | sim | `TattooWorkspace.tsx:24-30` |
| `/tatuagem/gerar` | "Explorar conceitos" | Gerar 3 conceitos | seletor de projeto, resumo, botão gerar, erro inline `role=alert` | erro inline + busy | `generateTattoo` | sim | `TattooWorkspace.tsx:31-34` |
| `/tatuagem/referencias` | "Referências privadas" | Fotos privadas | consent de foto corporal (switch), 2 tipos (desenho/corporal), upload com limite 10 MB, grid | consent gate; erro de load | `photos`, `tattoo_profiles` | sim | `src/components/tattoo/TattooPhotos.tsx:14-19` |
| `/tatuagem/decisao` | "Antes de decidir" | Checklist de decisão | 6 itens + data de revisão | vazio se nenhum projeto | `tattoo_projects.checkpoints` | sim | `src/components/tattoo/TattooPlanView.tsx:32-35` |
| `/tatuagem/briefing` | "Briefing do tatuador" | Exportar briefing | seletor versão/alternativa, markdown renderizado, **checkbox obrigatório de confirmação**, baixar/imprimir/marcar escolhida | sem projeto = "Gere um conceito primeiro" | `packages` | sim | `TattooPlanView.tsx:28-30` |
| `/tatuagem/cuidados` | "Cuidados e diário" | Pré/pós + diário | alerta de saúde em vermelho, 4+4 checkboxes, diário (data+texto), exclusão de registro **sem confirmação** | vazio se nenhum projeto | `tattoo_care_logs`, `checkpoints` | sim | `TattooPlanView.tsx:37-41` |
| `/tatuagem/plano/$id` | título do conceito | Detalhe do conceito | 3 conceitos (Discreta/Intermediária/Ousada) com `PlacementDiagram` SVG, `ReferenceImage`, 4 ações, status | "versão não existe mais" | `packages kind='tattoo_plan'` | via dashboard | `TattooPlanView.tsx:21-26` |
| `/tatuagem/vitrine` | "🖤 Vitrine dos estúdios" | Marketplace de designs | filtros por estilo, grid, "Copiar pra mim" (exige modelo-corpo), "Quero essa — enviar pro estúdio", `QuotaChip`, paywall | carregando; vazio; paywall | `vitrine`, `modelo-corpo.png` | sim (trilha Estilo) | `src/routes/_authenticated/tatuagem/vitrine.tsx:19-156` |

### 1.8 Jornada (`/jornada`)

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| `/jornada` | "Jornada" | Planos de transformação | 6 abas (nav própria), cards por plano com contadores e `Confirm` | vazio ("não há jeito certo de começar") | `journey_*` | sim (trilha Estilo) | `src/components/journey/JourneyWorkspace.tsx:20-37` |
| `/jornada/objetivo` | "Sua intenção de transformação" | Criar plano | 7 objetivos, 2 textos, duração, início, nome; "Sugerir rascunho com IA"; passos editáveis com categoria/período/ligação a sugestão | busy por ação; erros por toast | `journey_goals/plans/steps`, `suggestPlan` | sim | `JourneyWorkspace.tsx:40-64` |
| `/jornada/plano/$id` | título do plano | Executar plano | construtor por período, quadro de experimentos (7 status), reflexão, relatório, lembretes | "plano não encontrado" | `journey_*` | via home | `JourneyWorkspace.tsx:85-106` |
| `/jornada/diario` | "Diário visual" | Fotos + reflexões privadas | seletor de plano/passo, marcar antes/depois, upload (exige consent), grid, exclusão | gate de consent; vazio | `photos kind='journey'` | sim | `JourneyWorkspace.tsx:113-137` |
| `/jornada/galeria` | "Antes e depois" | Comparar pares | pares before/after por passo | vazio explicativo | `photos` | sim | `JourneyWorkspace.tsx:139-147` |
| `/jornada/relatorios` | "Relatórios de evolução" | Listar relatórios | cards | vazio explicativo | `journey_reports` | sim | `JourneyWorkspace.tsx:149-155` |
| `/jornada/relatorio/$id` | título do relatório | Ler/exportar | 6 blocos, **checkbox "entendo que o arquivo sai do app"**, baixar/imprimir/excluir | "não encontrado" | `journey_reports` | via lista | `JourneyWorkspace.tsx:157-167` |
| `/jornada/linha-do-tempo` | "Linha do tempo" | Histórico | eventos agregados de 5 fontes | vazio | várias | sim | `JourneyWorkspace.tsx:169-180` |

### 1.9 Telas transversais / singleton

| Rota | Título | Objetivo | Mostra / ações | Estados | Dados | Menu? | Evidência |
|---|---|---|---|---|---|---|---|
| `/consent` | "Antes de começarmos" | Consentimento LGPD | 3 switches + 1 checkbox de termos; exige checkbox para continuar | busy; erro por toast | `consents` | gate | `src/routes/_authenticated/consent.tsx:15-50` |
| `/onboarding` | "Seu perfil visual" (etapas) | Perfil inicial | toggle Rápido/Assistido (5 vs 9 etapas), progresso, "espelho" SVG, "Convites de caimento", `ReferenceImage`, help-chat por campo, resumo com pendências | carregando; autosave 800 ms; pulos; sem erro de carregamento | `visual_profiles.data`, `photos` | gate | `src/routes/_authenticated/onboarding.tsx:26-192` |
| `/studio` | "Como você chega hoje?" | Porta de entrada de geração | `PresentationChoice`, 5 humores, 9 modos, ocasião, intensidade, "algo mais", cartão "Meu Modelo", link do guia | busy; erro por toast | `visual_profiles`, `generatePackages` | sim (fixo) | `src/routes/_authenticated/studio.tsx:21-98` |
| `/dashboard` | "Suas sugestões" / "Convites fresquinhos" | Listar pacotes | banner do guia + Modelo, filtro por status, grid de cards (roteia por `kind`) | skeleton 4; erro; vazio | `packages` | sim (fixo) | `src/routes/_authenticated/dashboard.tsx:22-97` |
| `/package/$id` | título do pacote | Detalhe do pacote genérico | 3 variações + `ReferenceImage`, indicadores, alerta de permanência, 5 ações de status, notas, "Adaptar", feedback duplo | skeleton; "não existe mais"; desvio para módulo por `kind` | `packages`, `feedback`, `visual_dna` | via dashboard | `src/routes/_authenticated/package.$id.tsx:22-155` |
| `/collections` | "Coleções" | Agrupar salvas | criar por nome, chips de pacotes salvos/aprovados, "Excluir" **sem confirmação** | vazio 2×; sem erro | `collections`, `packages` | sim (trilha Visual) | `src/routes/_authenticated/collections.tsx:15-58` |
| `/compare` | "Comparar" | Lado a lado | checkboxes (máx. 3), grid com indicadores/variações | vazio; **sem skeleton e sem erro** | `packages` | sim (fixo) | `src/routes/_authenticated/compare.tsx:15-55` |
| `/export` | "Central de exportação" | Baixar planos | "Baixar todas (N)", "Imprimir", lista individual, seção de briefings de tatuagem, nota "Google Docs não conectado" | vazio | `packages` | sim (fixo) | `src/routes/_authenticated/export.tsx:16-42` |
| `/settings` | "Configurações e dados" | Consentimentos e dados | link Aura Pass, 4 switches, lembretes manuais, 2 `Confirm` de wipe, `Confirm` de excluir conta, link admin | sem skeleton; erros por toast | `consents`, `reminders`, `has_role` | sim (fixo) | `src/routes/_authenticated/settings.tsx:19-127` |
| `/modelo` | "Meu Modelo" | Criar modelo pessoal | requisitos ✅/❌, consent próprio (LGPD), 3–8 fotos, selects de base rosto/corpo, gerar/regenerar/excluir, `QuotaChip`, paywall | `…` de permissões; erro inline `role=alert` | storage `modelo-rosto/corpo.png` | botão do header | `src/routes/_authenticated/modelo.tsx:20-196` |
| `/retrato` | "Aura Retrato" | Editar 1 foto por pedido | foto, pedido livre, "Entender meu pedido" → lista de ajustes confirmáveis, "Confirmar e editar", verificação automática com 1 retry, `QuotaChip`, paywall | carregando; erro; pendências | `interpretRetrato/editarRetrato/verificarRetrato` | botão do header | `src/routes/_authenticated/retrato.tsx:18-212` |
| `/estetica` | "Estética & simetria" | Medir simetria + briefing | 5 procedimentos, guia de captura, upload, medir, simular, antes/depois, re-leitura, briefing, `EnviarBriefing`, `JornadaEstetica` | gate de permissões; `err` inline; **sem `QuotaChip`** | `estetica_*`, `ai_runs` | botão do header | `src/routes/_authenticated/estetica.tsx:19-234` |
| `/barba` | "Barba" | Perfil + plano + provador | perfil (8 campos), gerar plano, 6 presets de prova, `QuotaChip`, `EnviarBriefing`, lista de planos | `temRosto` gate; erro/paywall | `beard_profiles`, `packages kind='beard_plan'` | trilha Barbearia | `src/routes/_authenticated/barba.tsx:28-94` |
| `/aura-pass` | "Aura Pass" | Assinatura | pendências de checkout (success/cancel), preço, 4 bullets, assinar/gerenciar | ativo/inativo; poll 3× no sucesso; erro inline | `entitlements` | botão do header + settings | `src/routes/_authenticated/aura-pass.tsx:13-96` |
| `/profissionais` | "Profissionais" | Rede (cliente + pro) | 4 abas: Meus envios, Recebidos, Vitrine do estúdio (publicar/stencil), Cadastro; paywall do Plano Pro | vazio em todas; erros por toast | `professionals`, `briefings`, `studio_designs` | **ÓRFÃ** | `src/routes/_authenticated/profissionais.tsx:28-380` |
| `/guia` | "Guia rápido" | Tutorial 5 passos | 5 cards com CTA | estático | — | via dashboard/studio | `src/routes/_authenticated/guia.tsx:42-65` |
| `/admin` | "Admin" | Operação | totais, auditoria de consentimento, eventos, status de conectores, catálogo, parceiros, feedback, aviso de tatuagem, termos bloqueados | carregando; não-admin; erro | `adminStats`, `safety_config` | via settings/dashboard (se admin) | `src/routes/_authenticated/admin.tsx:28-71` |

### 1.10 Matriz de alcançabilidade (menu × órfã)

- **No menu fixo**: `/studio`, `/dashboard`, `/dna`, `/compare`, `/export`, `/settings` (`src/lib/trilhas.ts:84-91`).
- **No menu só se a trilha for escolhida**: `/maquiagem`, `/collections` (Visual); `/cabelo` (Cabelo/Barbearia); `/roupas`, `/tatuagem`, `/tatuagem/vitrine`, `/jornada` (Estilo); `/barba` (Barbearia) (`src/lib/trilhas.ts:23-56`).
- **Só no header, como botão**: `/estetica`, `/modelo`, `/retrato`, `/aura-pass` (`src/routes/_authenticated/route.tsx:56-59`).
- **Órfãs de navegação principal** [C]:
  - `/profissionais` — **único link interno** vem de `/p/$slug` (`src/routes/p.$slug.tsx:45`, `77`). Grep por `to="/profissionais"` em `src` retorna só esse arquivo. Quem envia um briefing (em `/estetica`, `/barba`, `/package/$id`, `/tatuagem/vitrine`) recebe toast "a resposta aparece em Profissionais → Meus envios" (`src/components/EnviarBriefing.tsx:54`) e **não tem caminho para chegar lá**.
  - `/package/$id` — alcançável só por `/dashboard` (`src/routes/_authenticated/dashboard.tsx:83`) e por `/barba` (`src/routes/_authenticated/barba.tsx:94`); link manual do tipo `/package/x` cai em tela de desvio para 4 kinds (`src/routes/_authenticated/package.$id.tsx:48-51`).
  - `/guia` — só de `/dashboard` (banner, `dashboard.tsx:47`) e `/studio` (`studio.tsx:89`).
  - `/consent` e `/onboarding` — só por redirect do gate e, para re-edição, `/settings` (`settings.tsx:87`) e `/package/$id` (`package.$id.tsx:106`).
  - `/admin` — só por `/settings` (`settings.tsx:125`) e card do dashboard (`dashboard.tsx:68`), ambos condicionais a admin.

---

## 2. Fluxos principais ponta a ponta

> Convenção: "passos" = telas/decisões distintas; "ponto de abandono" = onde o usuário pode parar sem saber que pode continuar; "sem próximo passo" = tela onde a ação seguinte não é visível.

### 2.1 Onboarding → perfil → geração → pacote → coleção/export

**Caminho real (7–13 passos)** [C]:
1. `/` → CTA "Começar meu perfil" (`src/routes/index.tsx:40`).
2. `/auth` → login/cadastro (`auth.tsx:37-46`). Sem confirmação de e-mail o usuário fica em "Confira sua caixa de entrada" e **não há tela de "reenviar e-mail"** [A].
3. Redirect do gate para `/consent` (`_authenticated/route.tsx:13-15`).
4. `/consent`: 3 switches + checkbox de termos → "Continuar" (`consent.tsx:36-48`).
5. Redirect para `/onboarding` (`consent.tsx:29` + `_authenticated/route.tsx:16-19`).
6. `/onboarding`: 5 etapas (rápido) ou 9 (assistido), com autosave de 800 ms (`onboarding.tsx:61-68`) e "pular e retomar" por campo (`onboarding.tsx:76-80`).
7. Resumo → "Salvar perfil"/"Salvar mesmo assim" → **navega para `/studio`** (`onboarding.tsx:110-121`).
8. `/studio`: escolher humor + modo + ocasião → "Criar minhas sugestões" (`studio.tsx:94`).
9. Espera de até ~1 min (aviso em `studio.tsx:95`) → `/dashboard?batch=…` (`studio.tsx:44`).
10. `/dashboard`: cards → `/package/$id` (`dashboard.tsx:83`).
11. `/package/$id`: ler, "Salvar" / "Aprovar" (`package.$id.tsx:124-127`).
12. `/collections`: criar coleção e marcar chips (`collections.tsx:42,51`).
13. `/export`: "Baixar todas" (`export.tsx:29`).

**Pontos de abandono**
- **Passo 6–7**: o wizard tem 5 etapas mínimas com 3–6 campos cada e um texto de ajuda por campo; nada indica quanto falta além da barra (`onboarding.tsx:148-149`). "Ver resumo" só aparece na última etapa ("Próximo" muda de rótulo, `onboarding.tsx:169`).
- **Passo 9→10**: o dashboard **não mostra o banner do guia no estado vazio** — o `return` do vazio acontece em `dashboard.tsx:54-60`, **antes** do banner `guia` (montado em `dashboard.tsx:40-51` e usado em `dashboard.tsx:65`). Quem nunca gerou nada vê "Nada por aqui ainda" com **um único CTA** (Abrir o Estúdio), sem guia e sem Meu Modelo.
- **Passo 10→11**: cards do dashboard mostram título/invitation/indicadores, mas **nenhuma ação primária** ("abrir", "salvar") — o card inteiro é o link (`dashboard.tsx:83`); não há como salvar direto da lista.
- **Passo 12**: "Coleções" está no menu apenas se a trilha **Visual** foi escolhida (`src/lib/trilhas.ts:23-27`). Quem escolheu Estilo nunca vê Coleções; a exportação existe, a coleção não.
- **Passo 13**: `/export` só exporta `saved|approved` (`export.tsx:18`); pacotes `new` somem sem aviso.

**Onde o usuário não sabe o próximo passo**
- `/onboarding` termina em `/studio` sem explicar que gerar consome IA/créditos (não há `QuotaChip` em `studio.tsx`; o chip existe só em `ReferenceImage`, `modelo`, `retrato`, `barba`, `vitrine`).
- `/dashboard` filtrado por `batch` mantém o título "Convites fresquinhos" e o botão "Ver todas" (`dashboard.tsx:73,76`) — mas se o filtro não retorna nada, a mensagem é "Nenhuma sugestão neste filtro." (`dashboard.tsx:94`) **sem botão para limpar o filtro** (o "Ver todas" está no topo, fora do fluxo de leitura) [C].
- `/package/$id`: 5 ações de status lado a lado sem hierarquia visual — "Salvar", "Aprovar — vou testar", "Bonito, mas não prático", "Não é para mim", "Exportar" (`package.$id.tsx:123-128`). Não há indicação de qual é o caminho recomendado.

### 2.2 DNA (versões / correções / permissões)

**Caminho**: `/dna` → "Gerar meu DNA Visual" (1 chamada de IA, `dna/index.tsx:40-47`) → 17 cards editáveis → "Editar"/"Isso está errado" → `/dna/versoes` (restaurar/comparar) → `/dna/permissoes` (pausar/módulo) → `/dna/redefinir` (apagar).

**Passos**: 2 mínimos (gerar → editar) até 6 se for conferir tudo. **Sem custo/limite exposto**: `synthesizeDna` (`src/lib/aura.functions.ts:123-150`) é IA sem `QuotaChip` e sem aviso.

**Fricções específicas**
- **Duplicação de campos**: `/dna` edita `visual_dna.summary` (`dna/index.tsx:54`), `/dna/preferencias` edita `preferences` (`dna/preferencias.tsx:62`) com **os mesmos nomes de campo** (cores/estilos preferidos e rejeitados aparecem nos dois: `dna/index.tsx:99-101` vs `dna/preferencias.tsx:76-81`; tipos em `src/lib/aura.ts:66-84`). O usuário não sabe qual é a fonte da verdade.
- **Restaurar sem confirmação**: `/dna/versoes` "Restaurar" sobrescreve o DNA atual direto (`dna/versoes.tsx:52` → `restore`, `dna/versoes.tsx:26-33`), enquanto `/dna/redefinir` usa `Confirm` para tudo (`dna/redefinir.tsx:50-54`). Mesmo risco, tratamento oposto.
- **"Isso está errado" em campo de lista grava array vazio** (`dna/index.tsx:120`) — apaga a lista inteira de uma vez, sem desfazer.
- **Sem transação**: salvar correção faz update + insert + insert + 2 `logEvent` sequenciais (`dna/index.tsx:54-59`); se um falhar, o DNA já mudou e a correção não foi registrada.
- **Default inconsistente por módulo**: barba só fica ligada se `perms['beard'] === true`; os demais só ficam desligados se `!== false` (`dna/permissoes.tsx:49`). Resultado: **barba vem desligada por padrão** e a tela não explica isso.
- **Gate de revisão**: o banner "muita coisa mudou" só aparece em `/dna` (`dna/route.tsx:30-34`); não há badge no menu.

### 2.3 Estética (simetria → briefing → jornada)

**Caminho (5–8 passos)** [C]:
1. Header "✨ Estética" (`_authenticated/route.tsx:56`) → `/estetica`.
2. Gate de permissão: exige `photo_processing` **e** `image_generation` (`estetica.tsx:38-39`); se faltar, cartão com link para Settings (`estetica.tsx:126-131`).
3. Escolher 1 de 5 procedimentos (`estetica.tsx:133-142`).
4. Ler guia de captura (`estetica.tsx:151-154`) → upload (validação PNG/JPG ≤5 MB, `estetica.tsx:45-54`).
5. "Medir simetria" → IA de visão (`estetica.tsx:56-68`).
6. Opcional: "Simular procedimento na minha foto" (2ª IA) → salva no cofre → **re-mede automaticamente com uma 3ª chamada** (`estetica.tsx:70-93`, re-leitura em `:87`).
7. "Gerar briefing de avaliação" (4ª IA) → copiar/baixar/inline `EnviarBriefing` (`estetica.tsx:95-106, 215-226`).
8. `JornadaEstetica`: criar jornada pós-procedimento com data de retorno, registros e fotos (`src/components/JornadaEstetica.tsx:36-70`).

**Pontos de abandono**
- **Custo invisível**: `simularProcedimento` usa `task_id: 'webapp.estetica.sim'` (`src/lib/estetica.functions.ts:70`), que **não está em `LIMITES`** (`src/lib/uso.functions.ts:11-18`). `/estetica` **não importa `QuotaChip`** (grep) → nenhum contador, nenhum aviso de que a simulação consome geração. Só descobre no paywall (`estetica.functions.ts:75`).
- O botão "Simular" aparece **antes** do briefing (`estetica.tsx:182`) e o "Gerar briefing" ao lado (`:183`) — duas ações de custo distinto sem rótulo de custo.
- **Briefing não persiste**: `briefTxt` é estado de componente (`estetica.tsx:30`); recarregar perde o briefing e não há histórico.
- **Jornada usa `confirm()` nativo** (`JornadaEstetica.tsx:113`) enquanto o resto do app usa `AlertDialog` (`src/components/Confirm.tsx:4-14`).
- **Sem próximo passo**: depois do briefing + envio, a tela fica no mesmo estado; não há indicação de acompanhar a resposta (e `/profissionais` não está no menu).

### 2.4 Profissionais (busca → briefing → orçamento → IA)

**Caminho (6–9 passos)** [C]:
1. Entrada: por `/p/$slug` (público, `p.$slug.tsx:77`) **ou** por `EnviarBriefing` embutido em `/estetica` (`estetica.tsx:223`), `/barba` (`barba.tsx:90`), `/package/$id` via `ReferenceImage` (`ReferenceImage.tsx:270-279`), `/tatuagem/vitrine` (`vitrine.tsx:80`).
2. CEP + raio + profissão → "Buscar" (valida 8 dígitos; geocodifica **no navegador** via BrasilAPI, `EnviarBriefing.tsx:26-40`).
3. Lista de profissionais com distância → "Enviar briefing" (`EnviarBriefing.tsx:76-87`).
4. No envio, se houver foto, é gerada **URL assinada de 30 dias** e enviada (`EnviarBriefing.tsx:49-52`).
5. Profissional: `/profissionais` → aba "Recebidos" (só aparece se houver recebidos, `profissionais.tsx:199`) → ler briefing → "💰 Faço — enviar orçamento" ou "✖ Não faço" (`profissionais.tsx:235-251`).
6. Opcional: "Aplicar com IA e enviar" sobre a foto da cliente (3 grátis, depois Plano Pro, `profissionais.tsx:221-222`).
7. Cliente: "Meus envios" (`profissionais.tsx:257-286`).

**Pontos de abandono**
- **Passo 4 é irreversível e sem consentimento específico**: a foto privada do cofre vira link de 30 dias enviado a terceiro. A UI afirma o contrário em dois lugares: "Só você vê" (`PhotoUploader.tsx:49`) e "Seus dados e fotos ficam privados — só o que você enviar chega à profissional" (`p.$slug.tsx:80`). Não há checkbox de compartilhamento antes de enviar (`EnviarBriefing.tsx:44-56`).
- **Passo 5 é órfão**: nada no app leva a `/profissionais` (ver §1.10). O toast promete o caminho (`EnviarBriefing.tsx:54`), a navegação não entrega.
- **Busca depende de CEP**: quem não sabe o CEP do salão não tem alternativa (nem cidade, nem "usar minha localização"). `EnviarBriefing.tsx:30` só aceita 8 dígitos.
- **Duas personas numa página**: 4 abas com 2 papéis (cliente/profissional) sem separação (`profissionais.tsx:47,197-202`); "Sou profissional — cadastrar" fica ao lado de "Meus envios".
- **Orçamento sem retorno ao cliente fora da página**: nenhuma notificação/e-mail/badge (`profissionais.tsx:269-270` só mostra se o cliente abrir a aba).
- **Vitrine publica em bucket público** `studio-media` (`profissionais.tsx:108-110`) — divergente do cofre privado do resto do app.

### 2.5 Roupas (perfil → look → provador → catálogo → compra)

**Caminho (6–10 passos)** [C]:
1. Menu "Roupas" (trilha Estilo) → `/roupas` → vazio com 2 CTAs: Guarda-roupa e Gerar (`roupas/index.tsx:29-32`).
2. `/roupas/perfil` (9 campos de texto, 1 botão) (`roupas/perfil.tsx:44-51`).
3. `/roupas/armario`: cadastrar peças (categoria, nome, cor, tecido, formalidade, foto opcional) (`roupas/armario.tsx:65-78`).
4. `/roupas/gerar`: ocasião + clima + humor → looks (`roupas/gerar.tsx:46-51`).
5. `/roupas/look/$id`: 3 versões com peças marcadas "seu"/"ideia" (`roupas/look.$id.tsx:70`).
6. Status: 5 botões — aprovado/em teste/talvez depois/já usei/não funcionou (`roupas/look.$id.tsx:59`).
7. `ReferenceImage` no look: marcar "Usar meu modelo pessoal", gerar imagem, "💚 Gostei — e agora?" → "🔍 Buscar peça parecida" → catálogo → "Provar em mim" (`ReferenceImage.tsx:236,249,257,301`).
8. `/roupas/lacunas`: análise de lacunas/cápsula (IA sem chip) (`lacunas.tsx:25-29`).
9. `/roupas/compra`: checklist pré-compra (IA sem chip) (`compra.tsx:27-32`).
10. Link "Ver na loja ↗" com `utm_source=aura-id` (`ReferenceImage.tsx:290`).

**Pontos de abandono**
- **Passo 3 é o gargalo**: cadastro 100% manual, um formulário lateral fixo, sem importação, sem sugestão, repetindo 7 categorias (`roupas/armario.tsx:65-78`). Sem peças, o look não marca "seu" e o provador cai no fallback.
- **Provador exige imagem já gerada** (`ReferenceImage.tsx:81-82`): se ainda não gerou, a mensagem é "Gere o visual primeiro — ou crie seu Meu Modelo".
- **Status duplicado/divergente**: `OUTFIT_STATUS` (novo/aprovado/em teste/não funcionou/talvez depois/já usei, `src/lib/clothing.ts:5`) ≠ `STATUS_LABEL` global (nova/salva/aprovada/rejeitada, `src/lib/aura.ts:37`) ≠ `STEP_STATUSES` da Jornada (7 valores, `src/lib/journey.ts:9-12`). **Três vocabulários de status** no mesmo produto; `/export` e `/collections` filtram por `saved|approved` (`export.tsx:18`, `collections.tsx:21`) e um look "approved" de roupa **passa** nesse filtro.
- **Passo 8/9 sem chip de uso e sem erro**: `lacunas.tsx:24` e `missoes.tsx:22` não tratam estado de erro; `missoes.tsx` nem `isLoading`.
- **Sem próximo passo**: `/roupas/lacunas` diz "compre só se fizer sentido" mas não liga a peça sugerida ao catálogo nem a `/roupas/compra`.

### 2.6 Tatuagem (projetos → briefing → referências → vitrine → copiar → stencil)

**Caminho (8–13 passos)** [C]:
1. Menu "Tatuagens" (trilha Estilo) → `/tatuagem` → "Nova intenção" (`TattooWorkspace.tsx:22`).
2. `/tatuagem/perfil`: 8 campos + seção privada; submit salva e **redireciona para /tatuagem/gerar?projeto=id** (`TattooWorkspace.tsx:28`).
3. `/tatuagem/gerar`: "Gerar conceitos" → `/tatuagem/plano/$id` (`TattooWorkspace.tsx:33`).
4. `/tatuagem/plano/$id`: 3 conceitos + diagrama + `ReferenceImage tattoo` (`TattooPlanView.tsx:26`).
5. `/tatuagem/referencias`: consent corporal + upload privado (`TattooPhotos.tsx:17-18`).
6. `/tatuagem/decisao`: 6 checkpoints + data de revisão (`TattooPlanView.tsx:32-35`).
7. `/tatuagem/briefing`: checkbox obrigatório → baixar/imprimir/marcar escolhida (`TattooPlanView.tsx:30`).
8. `/tatuagem/cuidados`: checklists + diário privado (`TattooPlanView.tsx:37-41`).
9. `/tatuagem/vitrine`: filtro → "Copiar pra mim" (exige `modelo-corpo.png`) → simulação → "Quero essa — enviar pro estúdio" (`vitrine.tsx:48-83`).
10. Profissional publica design e gera **stencil** no navegador (`profissionais.tsx:63-94, 354-378`).

**Pontos de abandono**
- **Passo 2→3 sem escolha**: "Nova intenção" e "Explorar conceitos" e todas as outras 6 abas mostram um `ProjectSelect` começando em vazio (`TattooWorkspace.tsx:16-19`). Entrar direto em `/tatuagem/decisao` ou `/briefing` sem projeto = **tela vazia sem CTA** (só "Não decidir agora também é uma escolha").
- **Seletor repetido em 6 telas**: `ProjectSelect` aparece em perfil, gerar, referencias, decisao, cuidados (`TattooWorkspace.tsx:18,25,32,35,38` + `TattooPhotos.tsx:19`) e ainda um "Nova intenção" redundante (`TattooWorkspace.tsx:34`).
- **Layout suspende tudo**: `loader` + `useSuspenseQuery` no layout (`tatuagem/route.tsx:4`) → qualquer falha de rede derruba as 7 abas de uma vez, sem retry.
- **Passo 9 depende de foto do corpo** que o usuário pode não ter: erro só por toast (`vitrine.tsx:51`).
- **Briefing de tatuagem no `/export`**: `/export` exclui `tattoo_plan` do lote e manda "revisar briefing" (`export.tsx:38-39`) — correto por privacidade, mas exige um segundo fluxo.

### 2.7 Jornada

**Caminho (5–9 passos)** [C]:
1. Menu "Jornada" (trilha Estilo) → `/jornada` → "Novo plano" (`JourneyWorkspace.tsx:33`).
2. `/jornada/objetivo`: 7 objetivos + 2 textos + duração/início/nome (`JourneyWorkspace.tsx:51-55`).
3. "Sugerir rascunho com IA" (opcional) (`JourneyWorkspace.tsx:47`) ou adicionar passos manualmente (categoria + período + ligação a uma sugestão) (`JourneyWorkspace.tsx:56-59`).
4. "Criar plano" → `/jornada/plano/$id` (`JourneyWorkspace.tsx:48`).
5. Quadro de experimentos (7 colunas de status) → "Refletir" (`JourneyWorkspace.tsx:98-100`).
6. Reflexão: nota, 3 escalas 1–5, recepção social, nota emocional + switch "usar no relatório" (`JourneyWorkspace.tsx:70-83`).
7. `/jornada/diario`: fotos antes/depois (exige consent) (`JourneyWorkspace.tsx:118-132`).
8. "Gerar 'Meu mês em imagens'" (`JourneyWorkspace.tsx:95`) → `/jornada/relatorio/$id`.
9. Relatório: checkbox de saída de dados → baixar/imprimir (`JourneyWorkspace.tsx:165`).

**Pontos de abandono**
- **Passo 2 tem 7 botões + 2 textos + 3 campos** antes de qualquer coisa acontecer; o plano pode ser criado com 0 passos (`JourneyWorkspace.tsx:60,62`) → plano vazio que não gera relatório ("Gerar relatório" fica `disabled` sem passos, `JourneyWorkspace.tsx:95`).
- **Passo 4→5**: o plano criado não aparece em `/jornada/relatorios` nem na galeria até haver dados.
- **Sem próximo passo**: as 3 telas de resultado (galeria, relatórios, linha do tempo) são de leitura e ficam vazias até o usuário criar fotos/reflexões manualmente — nada sugere "adicione uma foto" dentro delas além do link.
- **Lembrete é manual e local**: só dentro do app (`JourneyWorkspace.tsx:101`), sem notificação.

### 2.8 Aura Pass / checkout

**Caminho (3–4 passos)** [C]:
1. Paywall em contextos de imagem: `ReferenceImage` (`ReferenceImage.tsx:323-327`), `modelo` (`modelo.tsx:188-194`), `retrato` (`retrato.tsx:202-208`), `barba` (`barba.tsx:83`), `vitrine` (`vitrine.tsx:148-154`).
2. `/aura-pass` (header "✦ Pass" `route.tsx:59`, ou Settings `settings.tsx:83`) → "Assinar · R$ 19,90/mês" (`aura-pass.tsx:89`).
3. `createCheckout` → `window.location.href` para Stripe (`aura-pass.tsx:32-33`).
4. Retorno `?checkout=success` → poll de 3 tentativas (3 s, 4 s, 5 s) (`aura-pass.tsx:23-27`) + texto "deve aparecer como ativo aqui em alguns segundos" (`aura-pass.tsx:60`).

**Fricções**
- **Contagem de grátis contraditória**: `/aura-pass` promete "as 5 gratuitas" e "5 imagens por conta" (`aura-pass.tsx:83, 88`), mas `LIMITES` concede **5+5+2+2+2+2 = 18** por tarefa (`src/lib/uso.functions.ts:11-18`), e `/estetica` usa uma tarefa fora dessa tabela (`estetica.functions.ts:70`). A frase é falsa para o usuário e perigosa para o suporte.
- **Sem "verificar novamente"**: se o webhook atrasar mais que ~12 s, a tela fica no estado inativo com o botão "Assinar" de novo (`aura-pass.tsx:77-90`) — sem refresh manual, sem link para o portal antes de "ativo" (`gerenciar` só existe no bloco ativo, `aura-pass.tsx:74`).
- **Duas ofertas, um checkout**: o Plano Profissional (R$ 49,90) tem paywall próprio em `/profissionais` (`profissionais.tsx:182-186`) e **não é listado em `/aura-pass`** (`aura-pass.tsx:13-96`), embora a tela se chame "Aura Pass" e o paywall diga "gerencie em Aura Pass" (`profissionais.tsx:180`).
- **Preço duplicado em texto**: `guia.tsx:36` escreve "R$ 19,90/mês" hardcoded em vez de `AURA_PASS_PRECO` (`src/lib/stripe.functions.ts:16`).

---

## 3. Fricções concretas

### 3.1 Navegação e arquitetura de informação

| # | Fricção | Evidência | Tipo |
|---|---|---|---|
| F1 | **"Agora não" no seletor de trilhas esconde os módulos principais.** O menu passa a ser só `LINKS_FIXOS` (Estúdio, Sugestões, DNA, Comparar, Exportar, Configurações): maquiagem, cabelo, roupas, tatuagem e jornada **não têm nenhum outro ponto de entrada** no header. | `src/components/TrilhaPicker.tsx:55`; `src/lib/trilhas.ts:93-96`; `src/routes/_authenticated/route.tsx:42,49-55` | [C] alta |
| F2 | **Header com ~20 alvos** (6 fixos + até 8 de trilhas + 6 botões) em uma linha `overflow-x-auto` sem sombra/indicador de scroll; em 360–390 px o usuário vê só os primeiros itens e "Sair". | `route.tsx:47-64` | [C] alta |
| F3 | **Menu de trilhas e comentário do código se contradizem**: "Barba fica fora (composição feminina, decisão D1)" ao lado de uma trilha Barbearia que inclui `/barba`. | `src/lib/trilhas.ts:83` vs `:47-56` | [C] alta |
| F4 | **/profissionais é inalcançável pelo app**, com toasts prometendo o caminho ("a resposta aparece em Profissionais → Meus envios"). | `src/components/EnviarBriefing.tsx:54`; `profissionais.tsx` sem links de entrada; único link em `p.$slug.tsx:45` | [C] alta |
| F5 | **Duas famílias de navegação**: seções de 1º nível (header) × abas internas (DNA 6, Maquiagem 6, Cabelo 4, Roupas 7, Tatuagem 7, Jornada 6) — todas com estilos diferentes: DNA/Maquiagem/Cabelo usam pills com `activeProps` (`dna/route.tsx:35-39`, `maquiagem/route.tsx:20-24`), Tatuagem usa links de texto sublinhados (`tatuagem/route.tsx:5`), Jornada usa pills sem borda (`JourneyWorkspace.tsx:22`). | respectivos arquivos | [C] alta |
| F6 | **Gate reconsulta 2 tabelas em toda navegação** (`consents` + `visual_profiles`) e roda com `ssr:false` → 2 round-trips antes de renderizar cada página. | `_authenticated/route.tsx:8-24` | [C] alta |
| F7 | **Consentimento não revalida versão**: grava `terms_version: "v2"` mas o gate só verifica se a linha existe — quem consentiu na v1 nunca é reavaliado. | `consent.tsx:24` vs `_authenticated/route.tsx:14` | [C] alta |
| F8 | **Estética, Modelo, Retrato existem só como botões** e não nas trilhas — quem chega por link direto não entende onde está no produto (sem breadcrumb; `breadcrumb.tsx` não é usado). | `route.tsx:56-58`; grep de import de `ui/breadcrumb` = zero | [C] alta |
| F9 | **Não há sidebar** apesar do componente existir; numa tela de 7 abas (Roupas) o usuário rola horizontalmente para saber o que existe. | `src/components/ui/sidebar.tsx` sem import; `roupas/route.tsx:20` | [C] alta |
| F10 | **Título de aba vazio em 6 telas**: `/jornada/linha-do-tempo`, `/cabelo/alertas`, `/maquiagem/gerar`, `/roupas/gerar`, `/roupas/perfil`, `/roupas/missoes` não têm `h1` (só h2/h3) — quebra hierarquia de heading e leitor de tela. | `jornada/linha-do-tempo` via `JourneyWorkspace.tsx:179`; `cabelo/alertas.tsx:32-46`; `maquiagem/gerar.tsx:49-90`; `roupas/gerar.tsx:42-52`; `roupas/perfil.tsx:44-51`; `roupas/missoes.tsx:30-40` | [C] alta |

### 3.2 Duplicidades

1. **Nove telas de geração** [C]: `/studio` (`studio.tsx:37-49`), `/maquiagem/gerar` (`maquiagem/gerar.tsx:39-47`), `/cabelo/gerar` (`cabelo/gerar.tsx:33-41`), `/roupas/gerar` (`roupas/gerar.tsx:34-41`), `/tatuagem/gerar` (`TattooWorkspace.tsx:33`), `/barba` (`barba.tsx:69`), `/estetica` (`estetica.tsx:63,77,102`), `/retrato` (`retrato.tsx:68,81`), `/modelo` (`modelo.tsx:91`). Todas repetem o mesmo padrão visual (botão accent + "Pode levar até um minuto") sem componente compartilhado.
2. **Geração genérica x geração de módulo produzem coisas diferentes** [C]: `/studio` deixa escolher "Cabelo", "Roupas e estilo", "Planejamento de tatuagem" (`src/lib/aura.ts:9-13`) e gera pacotes com `entry_mode` mas **sem `kind`** (`src/lib/aura.functions.ts:92-95`). As listas dos módulos filtram por `kind` (`cabelo/index.tsx:18`, `roupas/index.tsx:20`, `maquiagem/index.tsx:24`). Consequência: o usuário gera "Cabelo" no Estúdio e **o plano não aparece na aba Cabelo** — aparece só em Sugestões. Confiança alta na leitura; impacta diretamente a retenção.
3. **Redirecionamento invisível no Estúdio** [C]: `generate()` desvia `beard`→`/barba` e `makeup`→`/maquiagem/gerar` (`studio.tsx:38-39`), mas o rótulo do botão só menciona maquiagem (`studio.tsx:94`). Quem escolhe "Barba" clica em "Criar minhas sugestões" e é jogado em outra tela sem explicação.
4. **Cinco perfis que repetem o onboarding** [C]: `/onboarding` já coleta tom de pele, subtom, cor/textura de cabelo, tamanhos, orçamento, profissão, dress code, clima (`src/lib/onboarding.ts:67-114`) e depois: `makeup_profiles` pede pele/alergias/tempo/orçamento de novo (`maquiagem/perfil.tsx:22-25`); `hair_profiles` pede textura de novo (`cabelo/perfil.tsx:23-24`); `style_profiles` pede profissão/rotina/clima/orçamento de novo (`roupas/perfil.tsx:18-28`); `beard_profiles` pede 8 campos (`barba.tsx:17`); `tattoo_projects.intention` pede 15 (`src/lib/tattoo.ts:9-10`). Único prefill automático encontrado: textura de cabelo no fim do onboarding (`onboarding.tsx:117-118`).
5. **Dois lugares para editar as mesmas preferências** (DNA Resumo × DNA Preferências) — ver §2.2.
6. **Dois lugares de feedback por item**: sliders "Depois de experimentar" na página do pacote (`package.$id.tsx:144-152`) **e** o botão global de opinião (`FeedbackButton.tsx:22-91`), com modelos de dados diferentes (`feedback` table vs `feedback_anonymous` via `enviarFeedback`) — o usuário não sabe a diferença.
7. **Modo barbearia em dois lugares**: checkbox em `/cabelo/perfil` (`cabelo/perfil.tsx:66`) e página dedicada `/barba` (`barba.tsx:28-94`), mais `beard_preference` no onboarding (`src/lib/onboarding.ts:71`).
8. **Dois checkouts de assinatura** (Pass e Pro) com botões diferentes em telas diferentes — ver §2.8.
9. **Código morto de feature**: `makeAvatar`/avatarUrl/avBusy em `/onboarding` nunca são chamados nem renderizados (`onboarding.tsx:36-37, 123-132`; grep confirma 1 ocorrência só da definição).
10. **Link duplicado no menu**: as trilhas *Cabelo* e *Barbearia* listam ambos `/cabelo` (`src/lib/trilhas.ts:28-33` e `:47-56`) e `linksVisiveis` faz `flatMap` sem deduplicar (`src/lib/trilhas.ts:93-96`) — quem escolhe as duas vê **"Cabelo" duas vezes** no header.
11. **9 componentes `ui/` mortos** — ver §0.

### 3.3 Jargão e texto

- **Jargão interno vazando para o usuário**: ver §4.1 (o pior item do produto).
- Jargão de produto repetido em toda parte: "convites" (`dashboard.tsx:74`, `index.tsx:37`), "DNA Visual", "sinais", "packs"/"pacotes" (código) × "sugestões" (UI) × "convites" (marketing) — três nomes para o mesmo objeto; "look"/"plano"/"conceito"/"versão"/"projeto" para objetos de módulos diferentes sem glossário.
- Termos técnicos na UI: "Reversibilidade", "Manutenção: baixa" em badge (`PackageView.tsx:8-12`); "assimetria_pct" aparece como "%" sem explicar a escala além de uma linha (`estetica.tsx:171`); "stencil" (`profissionais.tsx:358`); "bucket"/"cofre" misturados ("cofre privado" na UI, `modelo.tsx:134`).
- **Textos longos**: parágrafos de 60–90 palavras em cabeçalhos de módulo (`tatuagem/TattooWorkspace.tsx:22`; `cabelo/route.tsx:15`; `maquiagem/route.tsx:18`; `modelo.tsx:123`; `p.$slug.tsx:69-81`). O guia tem 5 cards com ~70 palavras cada (`guia.tsx:9-39`).
- **Erro de português**: "A verificação reprovar a edição" (`retrato.tsx:117`) — deveria ser "reprovou".
- **Mistura de registro**: "Xingar pode, ajudar mais ainda" no canal de opinião (`FeedbackButton.tsx:69`) vs tom cerimonial do resto.
- **Instrução que não existe na tela**: `profissionais.tsx:260` manda clicar em "💚 Gostei — e agora?" e escolher "Briefing para o salão" — o botão existe, mas só dentro do `ReferenceImage` de uma página de detalhe (`ReferenceImage.tsx:249,256`), nunca em `/profissionais`.

### 3.4 Estados vazios, validação e erro

- **Estados vazios fracos / sem CTA**:
  - `/jornada/decisao` e `/jornada/cuidados` sem projeto: só um parágrafo e um select (`TattooPlanView.tsx:35,41`).
  - `/tatuagem/briefing` sem conceito: "Gere um conceito primeiro." em texto puro, sem link (`TattooPlanView.tsx:30`).
  - `/collections`: "Nenhuma coleção ainda." sem orientação (`collections.tsx:43`).
  - `/maquiagem/kits`: "Nenhum kit ainda." sem preset em destaque (`kits.tsx:42`).
  - `/compare`: "Ainda não há sugestões. Crie algumas." (bom) mas sem skeleton enquanto carrega (`compare.tsx:29`).
  - `/export`: "Salve ou aprove uma sugestão primeiro." sem link (`export.tsx:39`).
  - `/profissionais` aba Recebidos: boa explicação (`profissionais.tsx:206`), mas a aba **não aparece** se vazia (`:199`) — o profissional novo nunca descobre a existência da aba.
- **Sem estado de erro (só toast ou nada)**: `roupas/lacunas.tsx:24`, `roupas/missoes.tsx:22`, `compare.tsx:17-20`, `maquiagem/manual.tsx:16-28` (usa `q.data!` e quebra a renderização se falhar), `admin.tsx:31` (erro tratado), `profissionais.tsx:126-127` (erro vira lista vazia silenciosa).
- **Validação ausente/fraca** [C]:
  - `/maquiagem/perfil`: zero campo obrigatório; salva perfil totalmente vazio (`maquiagem/perfil.tsx:38-44`).
  - `/cabelo/perfil`: idem (`cabelo/perfil.tsx:33-38`).
  - `/roupas/perfil`: idem, 9 campos opcionais (`roupas/perfil.tsx:37-42`).
  - `/dna/preferencias`: salva qualquer estado, inclusive tudo vazio (`dna/preferencias.tsx:60-69`).
  - `/settings` "Adicionar" lembrete: `if (!title || !due) return;` — **retorno silencioso**, sem mensagem (`settings.tsx:50`).
  - `/collections` criar: `if (!name.trim()) return;` — silencioso (`collections.tsx:24`).
  - `/tatuagem/perfil`: só `required` HTML; sem faixa real de tamanho/orçamento além de min/max (`TattooWorkspace.tsx:29`).
  - `/onboarding`: validações são **avisos gentis** por design (`src/lib/onboarding.ts:132-144`), o que é coerente — mas não há limite de sanidade em `weight_kg` sem altura (`onboarding.ts:137`).
- **Confirmação de ação destrutiva inconsistente** [C]:
  - Com `Confirm` (bom): excluir conta/dados (`settings.tsx:116-122`), plano de cabelo (`cabelo/plano.$id.tsx:66`), look de roupa (`roupas/look.$id.tsx:60`), peça do armário (`roupas/armario.tsx:89`), projeto de tatuagem (`TattooWorkspace.tsx:22`), plano de jornada (`JourneyWorkspace.tsx:35`), relatório (`JourneyWorkspace.tsx:165`), perfil capilar (`cabelo/perfil.tsx:67`), dados de alergia (`maquiagem/perfil.tsx:65`), 5 ações do DNA (`dna/redefinir.tsx:50-54`).
  - **Sem confirmação**: excluir coleção (`collections.tsx:48`), excluir kit (`maquiagem/kits.tsx:36`), restaurar versão do DNA (`dna/versoes.tsx:52`), desativar alerta (`cabelo/alertas.tsx:41`), excluir registro do diário de tatuagem (`TattooPlanView.tsx:41`), "Desmarcar"/status que sobrescrevem estado (`package.$id.tsx:126`).
  - **`window.confirm()` nativo** (3 lugares): `JornadaEstetica.tsx:113`, `profissionais.tsx:317`, `ParceirosManager.tsx:201,217`.
- **Mensagens de erro**: mistura de "Não foi possível X." (padrão, correto) com detalhes crus de exceção (`profissionais.tsx:45,120,166` repassam `e.message`), `toast.error(msg)` com mensagem técnica do gateway (`ReferenceImage.tsx:91`), e `err || q.data?.error` expondo erro de servidor na UI (`ReferenceImage.tsx:242`).
- **Ações repetidas**: em `/package/$id` os botões de status não têm estado `disabled` — clicar 3× "Aprovar" dispara 3 updates + 3 eventos de log (`package.$id.tsx:124-127`); `/cabelo/plano/$id` idem (`cabelo/plano.$id.tsx:62-63`).

### 3.5 Acessibilidade básica

| Item | Achado | Evidência |
|---|---|---|
| **Contraste de CTA primário (accent)** | `--accent` sobre `--accent-foreground` = **3,06:1**; `--accent` sobre `--background` = **3,02:1**; sobre `--secondary` = **2,64:1**. Abaixo do mínimo AA (4,5:1) para texto normal. Todos os CTAs `variant="accent"` ("Criar minhas sugestões", "Gerar looks", "Salvar perfil" etc.) usam esse par. | cálculo a partir de `src/styles.css:66-67`; uso em `src/components/ui/button.tsx:18`; `--muted-foreground` mede 5,67:1 (ok) |
| Rótulo de campo | `Label` sem `htmlFor` em vários pontos: `package.$id.tsx:132,137,147-149`; `cabelo/plano.$id.tsx:117-119`; `maquiagem/gerar.tsx:73-79` | [C] |
| Controles sem semântica | Cards de opção do onboarding são `<button>` sem `aria-pressed`/`role=radio` (só o campo de cores tem `aria-pressed`, `onboarding.tsx:221`); mesmos padrões em `studio.tsx:58-60,67-71`, `maquiagem/gerar.tsx:58-62`, `cabelo/gerar.tsx:50-54`, `roupas/gerar.tsx:32` | [C] |
| Slider sem label | `<Slider>` sem `aria-label`/`id` (`maquiagem/gerar.tsx:74`; `studio.tsx:81`) — os do perfil têm `Label` visual mas não associado | [C] |
| Foco visível | `Button` tem `focus-visible:ring-1` (`button.tsx:8`) mas há **47 usos de `<button>` cru fora de `ui/`** (grep `<button` em `src`, sem `ui/`), a maioria sem `focus-visible` (ex.: `onboarding.tsx:210`, `TrilhaPicker.tsx:36`, `misoes`/`lacunas` chips, `dashboard.tsx:79`, `compare.tsx:32`) | [C] |
| Tabelas sem scroll | `dna/versoes.tsx:66` (`<table className="w-full">`), `CatalogManager.tsx:42` — estouram no mobile | [C] |
| Exclusão por hover | "Excluir" da foto só aparece com `opacity-0 group-hover:opacity-100` (`PhotoUploader.tsx:60`) → **inacessível em toque** | [C] alta |
| Navegação sem `aria-current` | `JourneyWorkspace.tsx:22`, `tatuagem/route.tsx:5` (links ativos só por cor) | [C] |
| Imagens | Maioria tem `alt` bom; `alt` genérico repetido "Sua foto" (`PhotoUploader.tsx:59`), "Referência ampliada" ok. Hero da landing é `div` com `role="img" aria-label` (correto, `index.tsx:46`) | [C] |
| Toaster / feedback assíncrono | Sem `aria-live` próprio além do sonner; loadings de IA só por texto do botão | [C] |
| Texto muito pequeno | **14 usos de 10–11 px** fora de `ui/` (grep `text-[10px]`/`text-[11px]`): rodapés legais, `AiLabel` (`PackageView.tsx:18`), avisos de privacidade (`p.$slug.tsx:80`), dica do onboarding (`onboarding.tsx:284`) | [C] |

### 3.6 Responsividade / mobile

- Header horizontal com scroll (F2) — o pior item de mobile.
- `compare.tsx:38` usa `gridTemplateColumns: repeat(n, minmax(0,1fr))` inline → **3 colunas em 360 px** com texto.
- `/onboarding` `grid lg:grid-cols-[1fr_300px]` (`onboarding.tsx:151`) — no mobile o "espelho" SVG desce depois de 5–6 campos; ok, mas duplica altura.
- Abas de 7 itens com `overflow-x-auto` sem fade (`roupas/route.tsx:20`); demais usam `flex-wrap` (consistência invertida).
- `FeedbackButton` fixo `bottom-4 right-4 z-40` sobrepõe conteúdo e botões de ação no rodapé das telas de detalhe (`FeedbackButton.tsx:45`) — nas telas longas de pacote ele cobre o canto do último card.
- `/tatuagem/vitrine` grid 1→2→3 colunas ok (`vitrine.tsx:109`); `/estetica` formulários ok (`sm:grid-cols-4`, `JornadaEstetica.tsx:79`).
- `/profissionais` e `/admin` são densos mas usam `sm:grid-cols-2`; `/admin` com tabela de catálogo em `max-h-96 overflow-auto` (ok).
- Sem `viewport-fit`/safe-area; `viewport` meta é padrão (`__root.tsx:83`).

---

## 4. Conteúdo e copy

### 4.1 O que promete × o que entrega

| Promessa | Onde | Entrega real | Veredito |
|---|---|---|---|
| "Um jeito mais gentil de se tornar quem você quer mostrar" + "versões segura, intermediária e ousada" | `src/routes/index.tsx:35-37` | Os pacotes têm exatamente 3 variações safe/intermediate/bold (`src/lib/aura.functions.ts:41`) | **entrega** |
| "Provadores fotorrealistas, simulação de penteados, RA ao vivo…: **[FORA DO ESCOPO DOS CONECTORES LOVABLE]**" | `index.tsx:65` | Texto interno de build exposto **na landing pública**, logo abaixo do hero que promete exatamente "provadores"/"simulação" | **quebrado** |
| "Cinco passos e você domina o Aura ID" | `guia.tsx:47-48` | Guia existe, mas §4.2 | parcial |
| "Em tudo, a IA primeiro mostra o cartão **'Entendi assim'** — você corrige e confirma antes de gerar" | `guia.tsx:24` | Só existe em `ReferenceImage` (imagem, `ReferenceImage.tsx:208-234`) e em `/retrato` ("Vou aplicar na sua foto — confirme", `retrato.tsx:170-183`). `/studio`, `/maquiagem/gerar`, `/cabelo/gerar`, `/roupas/gerar`, `/tatuagem/gerar`, `/barba` geram direto sem confirmação | **não entrega** |
| "O contador embaixo mostra quantas grátis ainda restam" | `guia.tsx:31` | `QuotaChip` só em `ReferenceImage.tsx:243`, `modelo.tsx:187`, `retrato.tsx:200`, `barba.tsx:80`, `vitrine.tsx:91`. Ausente das 6 telas de geração de texto e de `/estetica` | **não entrega** |
| "Todo gerador mostra a caixinha **'Usar meu modelo pessoal'**" | `guia.tsx:30` | Checkbox só em `ReferenceImage.tsx:236`, e só quando `tattoo||look` — não no `/studio` nem nos geradores | **não entrega** |
| "Cada geração tem checagem automática (texto certo, alvo certo, é você mesmo)" | `guia.tsx:31` | Verificação existe só para imagem com brief (`ReferenceImage.tsx:171-179`) e retrato (`retrato.tsx:96-101`), com 1 retry automático (`ReferenceImage.tsx:124-135`). Gerações de texto não têm verificação | parcial |
| "5 imagens por conta" / "as 5 gratuitas" | `aura-pass.tsx:83,88` | `LIMITES` = 18 no total, por tarefa (`uso.functions.ts:11-18`); `/estetica` usa tarefa fora da tabela | **contradiz o código** |
| "Grátis para começar. Suas informações ficam públicas apenas para as buscas (nome, profissão, salão, contato)" | `profissionais.tsx:329` | Coerente com a página pública `p.$slug.tsx:51-64` | entrega |
| "Seus dados e fotos ficam privados — só o que você enviar chega à profissional" | `p.$slug.tsx:80` | Falso no fluxo de briefing: a foto do cofre é convertida em URL assinada de 30 dias e enviada (`EnviarBriefing.tsx:49-52`), e a UI de upload afirma "Só você vê" (`PhotoUploader.tsx:49`). Não há consentimento específico para compartilhar com terceiro | **risco legal/confiança** |
| "A primeira geração é grátis (rosto + corpo)" | `modelo.tsx:178` | `LIMITES['webapp.modelo.render'] = 2` (`uso.functions.ts:15`) — confere com "2 imagens" | entrega |
| "Você pode desligar tudo quando quiser" / "excluir a qualquer momento" | `index.tsx:22`; `consent.tsx:35` | **Excluir conta não apaga 7 tabelas de módulos**: `hair_profiles`, `hair_alerts`, `style_profiles`, `wardrobe_items`, `style_analyses`, `estetica_jornada`, `estetica_registro` estão fora da lista de exclusão (`aura.functions.ts:162`). Os dados sobrevivem à exclusão de conta | **quebrado (LGPD)** |

### 4.2 Jargão de build exposto ao usuário — o item mais grave de copy

"Aura ID" publica **"\[FORA DO ESCOPO DOS CONECTORES LOVABLE\]"** para o usuário final em 6 lugares [C]:

1. `src/routes/index.tsx:65` — **landing pública**, texto pequeno mas visível.
2. `src/routes/_authenticated/maquiagem/route.tsx:26` — rodapé de todas as 6 abas de Maquiagem.
3. `src/routes/_authenticated/cabelo/route.tsx:23` — rodapé de todas as 4 abas de Cabelo.
4. `src/routes/_authenticated/roupas/route.tsx:26` — rodapé de todas as 7 abas de Roupas.
5. `src/routes/_authenticated/tatuagem/route.tsx:5` — rodapé de todas as 7 abas de Tatuagem ("Fora do escopo dos conectores Lovable: …").
6. `src/routes/_authenticated/admin.tsx:23,25` — painel admin (menos grave).

Impacto: o usuário lê que o produto **não faz** o que o hero promete, com o nome do fornecedor de build. É o achado de maior prioridade da auditoria de copy.

### 4.3 Promessa de IA sem aviso de custo/limite

- **Gerações de texto sem qualquer contador/aviso**: `/studio` (`generatePackages`, 3–5 pacotes por chamada — `aura.functions.ts:41`), `/dna` (`synthesizeDna`), `/maquiagem/gerar`, `/cabelo/gerar`, `/roupas/gerar`, `/roupas/lacunas`, `/roupas/compra`, `/roupas/missoes`, `/tatuagem/gerar`, `/maquiagem/assinatura`, `/maquiagem/kits`, `/jornada/objetivo` ("Sugerir rascunho"), `/onboarding` (help-chat por campo + avatar), `/estetica` (4 chamadas por sessão).
- **Único aviso de custo explícito no produto** está em Configurações: "Cada geração usa créditos de IA" (`settings.tsx:88`) e no checkbox do `ReferenceImage`: "Usa créditos de IA" (`ReferenceImage.tsx:207`).
- **Cancelamento/erro sem explicação de limite**: mensagens de paywall são detectadas por regex em string de erro (`/gratuitas|Aura Pass/i`, `ReferenceImage.tsx:90,184`; `barba.tsx:58`; `modelo.tsx:94`; `retrato.tsx:84`; `vitrine.tsx:61`) — acoplamento frágil: se o backend mudar a mensagem, o paywall some e o usuário vê só um erro.

### 4.4 Disclaimers médicos/estéticos (cobertura)

| Domínio | Disclaimer | Evidência | Cobertura |
|---|---|---|---|
| Estética | "mede e informa — não diagnostica, não prescreve e não promete resultados" (3 ocorrências) + aviso da simulação | `estetica.tsx:17,123,211,224` | boa |
| Cabelo | química/descoloração exigem validação profissional | `src/lib/hair.ts:42`; exibido em `cabelo/route.tsx:23` e `cabelo/plano.$id.tsx:108` | boa (mas contaminado pelo "fora do escopo") |
| Maquiagem | "não substitui orientação dermatológica" | `src/lib/makeup.ts:34`; `maquiagem/route.tsx:26`, `manual.tsx:40` | boa |
| Tatuagem | permanência + validação profissional; checklist pré/pós; alerta de infecção | `src/lib/tattoo.ts:5-8`; `TattooPlanView.tsx:41` | boa |
| Jornada / relatórios | "notas emocionais e fotos não incluídas" | `src/lib/journey.ts:26`; `JourneyWorkspace.tsx:165` | boa |
| Barba | "não diagnosticam a pele nem prometem crescimento" | `barba.tsx:69` | ok |
| **Roupas** | só nota de "silhuetas não são correção de corpo" | `src/lib/clothing.ts:19` — **sem disclaimer de imagem corporal gerada** | fraca |
| **Retrato / Modelo** | "não é resultado profissional garantido" | `retrato.tsx:188` | ok |
| **Simulação de tatuagem no corpo** | "simulação no seu corpo · gerada por IA" | `vitrine.tsx:136` | ok |

### 4.5 Privacidade explicada

- Explicada em 4 lugares: `consent.tsx:35` (o que podemos usar), `settings.tsx:88` (custos + permissões), `dna/permissoes.tsx:41` (DNA só com 3 condições), `modelo.tsx:134` (consentimento específico LGPD do modelo pessoal) — **boa qualidade de redação** onde existe.
- **Contradições e lacunas**:
  - "Só você vê" (`PhotoUploader.tsx:49`) × envio de URL assinada de 30 dias a terceiro (`EnviarBriefing.tsx:49-52`; `vitrine.tsx:76`).
  - "Excluir sua conta remove tudo — perfil, fotos, sugestões, feedback, DNA Visual e histórico" (`settings.tsx:121`) × 7 tabelas fora da exclusão (`aura.functions.ts:162`).
  - Export JSON diz que "as fotos em si não entram no arquivo — só as referências" (`dna/redefinir.tsx:43`) — correto.
  - Não há link para política de privacidade/termos em lugar nenhum; o único "termo" é o checkbox do `/consent` (`consent.tsx:44-47`). [A] alta relevância para LGPD.

### 4.6 Tom

- Tom global coerente: acolhedor, sem julgamento, "convites, não regras" (`index.tsx:19-22`, `src/lib/aura.ts:26-32`). É o ativo mais forte do produto.
- **Inconsistência de tom**: telas de marketplace usam emoji/pressa ("🖤 Vitrine dos estúdios", "Copiar pra mim", "💎 Plano Profissional") enquanto o núcleo é cerimonial; `profissionais.tsx` mistura "cliente", "usuária", "profissional" e "estúdio".
- **Copy de botão que promete demais**: "Gerar meu modelo" exige 3 fotos e 2 chamadas de IA; "Copiar pra mim" na verdade **gera uma simulação**, não copia (`vitrine.tsx:131`).

---

## 5. Status por tela (pronto / parcial / ausente / quebrado)

### 5.1 Pronto (uso real, bem acabado)
| Tela | Por quê | Evidência |
|---|---|---|
| `/consent` | Escopo claro, gate real, termo obrigatório | `consent.tsx:15-50` |
| `/onboarding` | Autosave, retomada, pendências não bloqueantes, resumo editável, ajuda por campo | `onboarding.tsx:44-121, 245-288` |
| `/dna/permissoes` | Modelo de consentimento em 3 camadas, disabled em cascata | `dna/permissoes.tsx:39-53` |
| `/dna/redefinir` | Export completo + 5 exclusões granulares com `Confirm` | `dna/redefinir.tsx:31-61` |
| `/cabelo/plano/$id` | Conteúdo denso e útil (guia de salão, frases, perguntas) | `cabelo/plano.$id.tsx:99-114` |
| `/tatuagem/briefing` | Único fluxo com confirmação obrigatória de exportação | `TattooPlanView.tsx:30` |
| `/retrato` | Ciclo pedido→confirmação→edição→verificação→retry, com paywall honesto | `retrato.tsx:65-120, 169-208` |
| `/modelo` | Requisitos visíveis, consent próprio, quota e paywall | `modelo.tsx:124-193` |
| `/settings` | Exclusões granulares, lembretes, link de assinatura, aviso "e-mail não conectado" | `settings.tsx:78-127` |
| `/aura-pass` | Estados success/cancel/ativo/inativo, portal de cobrança | `aura-pass.tsx:50-95` |

### 5.2 Parcial
| Tela | Falta | Evidência |
|---|---|---|
| `/studio` | Redirecionamentos invisíveis; sem quota; sem confirmação; 9 modos que levam a 4 destinos diferentes | `studio.tsx:37-49,94` |
| `/dashboard` | Banner do guia só sem estado vazio; filtro de batch sem escape; sem ação no card | `dashboard.tsx:54-65,94` |
| `/maquiagem` (todas) | Sem quota nas 10 gerações; assinatura editável como JSON; manual sem erro | `maquiagem/assinatura.tsx:65-67`; `manual.tsx:28` |
| `/cabelo` (todas) | Status sem checar erro; sem quota; alertas sem confirmação | `cabelo/plano.$id.tsx:33-37`; `alertas.tsx:41` |
| `/roupas` (todas) | 3 status divergentes; lacunas/missões sem erro nem quota; export quebrado (abaixo) | `clothing.ts:5`; `lacunas.tsx:24` |
| `/tatuagem` (todas) | 7 abas com selector repetido; suspense no layout; exclusões sem confirmação | `tatuagem/route.tsx:4`; `TattooPlanView.tsx:41` |
| `/jornada` (todas) | Plano pode nascer vazio; 3 telas de leitura; sem notificação | `JourneyWorkspace.tsx:60,95` |
| `/estetica` | Sem quota apesar de 4 IAs; briefing não persiste; `confirm()` nativo | `estetica.tsx:63,77,102`; `JornadaEstetica.tsx:113` |
| `/barba` | Provador exige arquivo em path fixo; sem seletor de foto | `barba.tsx:42,49` |
| `/profissionais` | Órfã, 2 personas, `confirm()`, bucket público | `profissionais.tsx:47,108,317` |
| `/collections` | Exclusão sem confirmar; sem erro no toggle | `collections.tsx:29-37,48` |
| `/compare` | Sem loading/erro; grid quebrado no mobile | `compare.tsx:17-20,38` |
| `/guia` | Promete 3 recursos que não existem (§4.1); preço hardcoded | `guia.tsx:24,30,31,36` |
| `/admin` | Funcional, mas expõe jargão de build | `admin.tsx:23,25` |
| `/onboarding` | Código morto de avatar; 9 etapas para mudar 1 toggle depois | `onboarding.tsx:123-132`; `settings.tsx:87` |

### 5.3 Ausente
- **Onboarding pós-cadastro leve**: não existe editor de perfil fora do wizard de 9 etapas [A] (`settings.tsx:87` e `package.$id.tsx:106` apontam para `/onboarding`).
- **Central de notificações/atividade**: 0 telas; respostas de profissionais e lembretes dependem de o usuário abrir a aba certa [A].
- **Política de privacidade / termos**: 0 telas e 0 links [A] (só o checkbox em `consent.tsx:44`).
- **Recuperação de senha** ("esqueci minha senha"): não existe em `/auth` [A] (`auth.tsx:63-81`).
- **Reenvio de confirmação de e-mail**: não existe [A] (`auth.tsx:45`).
- **Busca/filtro em listas longas** (pacotes, looks, planos): não existe; só filtro por status [A] (`dashboard.tsx:78-80`).
- **Confirmação de e-mail alterado / troca de senha**: não existe em `/settings` [A].
- **Estado de erro de rede global/offline**: só o `ErrorComponent` do root [C] (`__root.tsx:41`).
- **Onboarding de trilhas sem opção "ver tudo"**: o picker não tem "mostrar todos os módulos", só 4 trilhas [A] (`TrilhaPicker.tsx:32-53`).

### 5.4 Quebrado (defeito funcional, alta confiança)
| Defeito | Evidência | Confiança |
|---|---|---|
| **`/export` "Baixar todas" quebra com looks de roupa/planos de cabelo**: `packageToMarkdown` do `aura.ts` acessa `c.steps.map` e `c.event_checklist.length`, campos que `Outfit`/`HairPlan` não têm; o `/export` inclui esses kinds no lote (`saved\|approved`) | `src/lib/aura.ts:113-114`; `src/lib/clothing.ts:9-13`; `src/lib/hair.ts:30-36`; `export.tsx:9,18` | [I] alta — depende do conteúdo real gravado; a rota não tem fallback |
| **Exclusão de conta deixa dados de 7 módulos** | `src/lib/aura.functions.ts:162` (lista) vs `src/lib/jornada...`/`estetica.functions.ts:124`/`roupas/armario.tsx:50`/`cabelo/perfil.tsx:34` | [C] alta |
| **Geração de módulo no Estúdio não aparece no módulo** (sem `kind`) | `src/lib/aura.functions.ts:92-95` vs `cabelo/index.tsx:18`, `roupas/index.tsx:20` | [C] alta |
| **`/maquiagem/manual` quebra se a query falhar** (`q.data!` sem guarda de erro) | `maquiagem/manual.tsx:16-28` | [I] alta |
| **"Aprovar — vou testar" do look registra evento `look_saved`** (analytics e DNA com sinal errado) | `maquiagem/look.$id.tsx:102` | [C] alta |
| **"Agora não" no Trilhas remove módulos do menu** | `TrilhaPicker.tsx:55` + `trilhas.ts:93-96` | [C] alta |
| **Botão "Criar minhas sugestões" com modo Barba navega sem avisar** | `studio.tsx:38,94` | [C] alta |
| **"Restaurar" versão do DNA sem confirmação** (sobrescreve o atual) | `dna/versoes.tsx:52` | [C] alta |
| **`/dna/preferencias` "Duração" da Jornada com cast de tipo errado** — `setPeriod(e.target.value as 'monthly')` grava valor arbitrário em estado tipado | `JourneyWorkspace.tsx:55` | [C] alta (runtime funciona; tipo mente) |
| **Contagem de grátis do Pass contradiz o backend** | `aura-pass.tsx:83,88` vs `uso.functions.ts:11-18` | [C] alta |

### 5.5 Impacto por métrica

| Métrica | Telas que mais machucam | Por quê |
|---|---|---|
| **Ativação** (1º valor) | `/consent` → `/onboarding` → `/studio` → `/dashboard` | 4–7 passos antes do primeiro resultado; dashboard vazio sem guia; sem quota para saber que existe limite; 5 etapas mínimas de wizard |
| **Retenção** | `/dashboard`, `/jornada`, `/profissionais`, módulos | módulos sem notificação; respostas de profissionais invisíveis (órfão); planos de jornada que não geram relatório; geração do Estúdio que não aparece no módulo |
| **Suporte** | `/aura-pass`, `/estetica`, `/export`, `/profissionais`, `/tatuagem` | contagem de grátis falsa; custo de IA invisível gera "sumiu minha geração"; export quebrado; foto privada compartilhada sem consentimento; 7 abas com seletor de projeto repetido |
| **Confiança/legal** | `/p/$slug`, `photo (todas)`, `/settings` | "só você vê" vs URL de 30 dias para terceiro; exclusão de conta incompleta; sem política de privacidade; jargão de build exposto |

---

## 6. Anexos

### 6.1 Bússola de priorização (sugestão, não escopo)

| Prioridade | Item | Evidência-chave | Esforço |
|---|---|---|---|
| P0 | Remover "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" de toda a UI do usuário | `index.tsx:65`, `maquiagem/route.tsx:26`, `cabelo/route.tsx:23`, `roupas/route.tsx:26`, `tatuagem/route.tsx:5` | baixo |
| P0 | Corrigir exclusão de conta (7 tabelas faltando) | `aura.functions.ts:162` | baixo |
| P0 | Consentimento explícito antes de compartilhar foto com profissional; parar de dizer "só você vê" | `EnviarBriefing.tsx:49-52`; `PhotoUploader.tsx:49`; `p.$slug.tsx:80` | médio |
| P1 | "Ver todos os módulos" no TrilhaPicker + entrada de `/profissionais` no menu | `TrilhaPicker.tsx:32-53`; `route.tsx:49-55` | baixo |
| P1 | Contador de geração (ou aviso de custo) em todas as 9 telas de IA; unificar a frase de grátis com `LIMITES` | `uso.functions.ts:11-18`; `aura-pass.tsx:83` | médio |
| P1 | Gravar `kind` no `generatePackages` ou remover módulos duplicados do Estúdio | `aura.functions.ts:92-95`; `studio.tsx:67-71` | médio |
| P1 | Consertar `packageToMarkdown` para Outfit/HairPlan (ou excluir do lote) | `aura.ts:103-118`; `export.tsx:9` | baixo |
| P2 | Confirmar todas as ações destrutivas (6 telas listadas em §3.4) | `collections.tsx:48`, `kits.tsx:36`, `dna/versoes.tsx:52`, `alertas.tsx:41`, `TattooPlanView.tsx:41` | baixo |
| P2 | Contraste do CTA accent (3,06:1) | `styles.css:66-67` | baixo |
| P2 | Header responsivo (menu drawer / agrupamento) | `route.tsx:47-64` | médio |
| P3 | Unificar vocabulário de status (3 dicionários) | `aura.ts:37`, `clothing.ts:5`, `journey.ts:9` | médio |
| P3 | Remover código morto (9 `ui/`, `makeAvatar`) | §0, §3.2 | baixo |

### 6.2 Componentes compartilhados e onde são usados

| Componente | Usado em | Observação |
|---|---|---|
| `ReferenceImage` (329 linhas) | `onboarding` (avatar), `package.$id` (3 variações), `maquiagem/look`, `cabelo/plano`, `roupas/look`, `tatuagem/plano` | concentra "Entendi assim", quota, paywall, guias, catálogo e provador — **god component**; qualquer mudança afeta 6 telas |
| `QuotaChip` | `ReferenceImage` (indireto), `modelo`, `retrato`, `barba`, `vitrine` | ausente em `studio`, `maquiagem/gerar`, `cabelo/gerar`, `roupas/gerar`, `tatuagem/gerar`, `estetica` |
| `Confirm` | 17 usos em 10 arquivos (grep `<Confirm`) | 6 fluxos destrutivos não usam |
| `PresentationChoice` | `studio`, `maquiagem/gerar`, `cabelo/gerar`, `roupas/gerar`, `barba`, `package.$id` | bom padrão único |
| `GenerationPresentation` | `maquiagem/gerar`, `cabelo/gerar`, `roupas/gerar`, `package.$id` | busca `visual_profiles` sem `user_id` (`GenerationPresentation.tsx:5`) — depende de RLS |
| `EnviarBriefing` | `estetica`, `barba`, `ReferenceImage` | único ponto de compartilhamento de foto com terceiro |
| `PhotoUploader` | `maquiagem/gerar`, `cabelo/perfil` (2×) | exclusão só por hover |
| `TrilhaPicker` | shell | sem opção "ver tudo" |
| `FeedbackButton` | root (todas as páginas) | canal único de opinião |

### 6.3 O que eu não cobri (transparência)

- **Não executei o app** (sem build, sem testes): toda afirmação de comportamento vem de leitura de código. Os itens marcados [I] precisam de confirmação em runtime.
- **Não auditei** `src/lib/*.functions.ts` integralmente (só os arquivos citados: `aura.functions`, `uso.functions`, `estetica.functions`, `stripe.functions`, `onboarding.functions`), `src/integrations/**`, migrations/SQL, Edge Functions, nem `ui/` além da amostra exigida. Prompts/políticas de IA (`ai.server.ts`) não foram revisados como texto de produto.
- **Contraste** foi calculado convertendo os tokens OKLCH de `styles.css` para sRGB e aplicando a fórmula WCAG (relativa ao fundo declarado); não foi medido com ferramenta no navegador, então valores de estado/opacidade (ex.: `/50`) não estão incluídos.
- **Contagem de rotas** conferida em `src/routeTree.gen.ts`; não validei comportamento de roteamento em runtime (params opcionais, loaders).


