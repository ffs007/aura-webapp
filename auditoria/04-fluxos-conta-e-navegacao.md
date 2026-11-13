# 04 — Fluxos de conta e navegação (auditoria estática)

**Data:** 08/11/2026 · **Método:** leitura estática do código real em `webapp-lovable/src` (TanStack Start + React 19), sem navegador e sem iniciar servidor. O Lead está testando ao vivo em `http://localhost:8080`; aqui só se afirma o que o código permite afirmar.
**Escopo:** `src/routes/index.tsx`, `auth.tsx`, `p.$slug.tsx`, `__root.tsx`, `_authenticated/route.tsx`, `consent.tsx`, `onboarding.tsx` (+ `components/onboarding/*`), `dashboard.tsx`, `studio.tsx`, `package.$id.tsx`, `collections.tsx`, `compare.tsx`, `export.tsx`, `settings.tsx`, `admin.tsx`, `guia.tsx`, `aura-pass.tsx`, `profissionais.tsx` e a navegação global (header, trilhas, chips de cota, botão de feedback). Componentes compartilhados lidos quando a rota depende deles: `TrilhaPicker.tsx`, `Confirm.tsx`, `FeedbackButton.tsx`, `QuotaChip.tsx`, `PackageView.tsx`, `EnviarBriefing.tsx`, `PresentationChoice.tsx`, `ReferenceImage.tsx` (trechos), `lib/trilhas.ts`, `lib/aura.ts`, `lib/uso.functions.ts`, `lib/stripe.functions.ts`, `lib/referencias.functions.ts`, `lib/aura.functions.ts`, `lib/manual.ts`, `lib/clothing.ts`, `lib/hair.ts`, `router.tsx`.
**Documentos verificados:** `AGENTS.md`, `auditoria/00-DIAGNOSTICO-E-PLANO.md`, `auditoria/02-frontend.md`, `RELATORIO-AUDITORIA.md`, `AURA-ID-GUIA-COMPLETO.md`. A seção §0 registra o que desses documentos continua verdadeiro, o que mudou e o que é exagero/impreciso — para não repetir nem contradizer sem prova.

**Limites desta auditoria (não verificável no código):** aparência real (sobreposição, contraste renderizado), tempo de rede, foco de leitor de tela, comportamento do Stripe/checkout, entrega de e-mail do Supabase, efeito real de RLS/policies (só o frontend foi lido), estado exato de `consents.image_generation` no banco. Nesses pontos o texto diz explicitamente "não verificável no código".

---

## 0. Verificação dos documentos anteriores (o que continua, o que mudou)

| Afirmação anterior | Status hoje no código | Evidência |
|---|---|---|
| Spinner global "Preparando…" criado | **Verdadeiro** — `defaultPendingComponent` + 300 ms | `src/router.tsx:5-15,25-26` |
| Botão 💬 compacto (círculo 48 px) | **Verdadeiro** — `size-12 rounded-full`, só ícone, `aria-label` | `src/components/FeedbackButton.tsx:41-48` |
| Erros de autenticação traduzidos | **Parcial** — senha/e-mail/limite traduzidos; OAuth/Google ainda mostra `error.message` cru | `src/routes/auth.tsx:11-19` vs `:67,71` |
| Logout com "Saindo…" + spinner | **Não aplicado** — `Sair` faz `await signOut()` e navega sem estado visual | `src/routes/_authenticated/route.tsx:63` |
| Switches sem rótulo acessível (A5) | **Parcial** — não há `aria-label`, mas os switches estão dentro de `<label>` (nome acessível implícito = texto inteiro do card). Não verificável em leitor de tela | `consent.tsx:38-42`; `settings.tsx:88-94`; `components/ui/switch.tsx:6-23` |
| Trilhas em `localStorage`, não na conta | **Verdadeiro** | `src/lib/trilhas.ts:61-81` |
| Indicadores vazios em pacote legado (A7) | **Pior que o relatado**: em cards de `outfit`/`hair_plan` o componente imprime `Custo: undefined` etc. | `PackageView.tsx:8-11`; `clothing.ts:9-13`; `hair.ts:30-36` |
| "Esqueci minha senha" ausente (A9) | **Verdadeiro** — zero `resetPasswordForEmail` no frontend | grep = 0; `auth.tsx:82-89` |
| Onboarding "recarregar volta ao início" | **Desatualizado** — agora retoma em `_last_step` | `onboarding.tsx:44-51,60-68` |
| Export "Baixar todas" quebra com outfit/plano de cabelo | **Verdadeiro** — `basicMd` lê `c.variations.flatMap`, campos que `Outfit`/`HairPlan` não têm | `export.tsx:9,22`; `aura.ts:108-115`; `clothing.ts:9-13`; `hair.ts:30-36` |
| /profissionais órfã, com toasts prometendo o caminho | **Verdadeiro** — único link interno vem de `/p/$slug` | `p.$slug.tsx:45,77`; `EnviarBriefing.tsx:54`; `tatuagem/vitrine.tsx:81` |
| Exclusão de conta apaga 26 tabelas; 12 de módulos ficam de fora | **Verdadeiro** — lista em `aura.functions.ts:162` não inclui `hair_*`, `style_*`, `wardrobe_items`, `style_analyses`, `professionals`, `tattoo_designs`, `briefing_*`, `estetica_*` | `aura.functions.ts:152-168` |
| "5 imagens grátis" contradiz o backend | **Verdadeiro** — `LIMITES` soma 18 por tarefa (5+5+2+2+2+2) | `aura-pass.tsx:83,88`; `uso.functions.ts:11-18` |

---

## 1. Mapa de alcançabilidade (entradas reais por rota)

| Rota | Entradas internas no código | Órfã? |
|---|---|---|
| `/` | URL direta; marca do `/auth` (`auth.tsx:77`) | pública |
| `/auth` | `index.tsx:30,40`; redirect do gate (`_authenticated/route.tsx:12`); CTAs de `/p/$slug` (`p.$slug.tsx:45,77,78`) que, deslogados, caem no gate | pública |
| `/p/$slug` | Link externo (bio do Instagram); nenhum link interno para ela | pública |
| `/consent` | redirect do gate quando não há linha em `consents` (`route.tsx:13-15`); URL direta | gate |
| `/onboarding` | redirect do gate (`route.tsx:16-19`); `/settings:87`; `/package/$id:106` | gate |
| `/studio` | header (link/marca) `route.tsx:48,50-55`; `/dashboard:58`; `/compare:29`; `/auth:43-44`; `/p/$slug:78`; fim do onboarding `onboarding.tsx:120` | fixa |
| `/dashboard` | menu fixo (`trilhas.ts:86`); `/studio:44`; `/package/$id:46,68,90`; `/collections:44`; `/export:39` | fixa |
| `/package/$id` | `/dashboard:83` (cards sem `kind`); `/barba:94`; `/jornada/plano/$id` (`JourneyWorkspace.tsx:99`) | via lista |
| `/collections` | trilha Visual (`trilhas.ts:23-26`); card do Estúdio (`studio.tsx:72`) | condicional |
| `/compare` | menu fixo (`trilhas.ts:88`) | fixa |
| `/export` | menu fixo (`trilhas.ts:89`) | fixa |
| `/settings` | menu fixo (`trilhas.ts:90`); `/aura-pass:94`; `/modelo:126-127`; `/guia:20` | fixa |
| `/aura-pass` | header `route.tsx:59`; `/settings:83`; `/guia:38`; `/modelo:192`; `/profissionais:180`; paywalls de módulos | via header |
| `/profissionais` | **apenas** `/p/$slug:45,77` | **sim — órfã** |
| `/admin` | `/settings:125` (só admin); `/dashboard:66-70` (só admin) | condicional |
| `/guia` | `/dashboard:47` (só quando **há pacotes**); `/studio:89` | condicional |
| `/dna/*` | menu fixo (`trilhas.ts:87`); `/settings:95`; `/consent:35` cita | fixa |

Não há link interno quebrado: todos os `to="/..."` do código existem em `routeTree.gen.ts` (verificação por script sobre 49 destinos). O problema não é link morto — é **recurso alcançável por um caminho único e não anunciado** (`/profissionais`) e **promessas de navegação em texto sem link** (`"Profissionais → Meus envios"`).

---

## 2. Fichas por rota

### 2.1 Públicas

#### `/` — Landing
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Converter visitante para cadastro. |
| **Como se chega** | URL direta; marca "Aura ID" no `/auth` (`auth.tsx:77`). |
| **Estados** | Estático: sem carregando/erro/vazio/sucesso. Nenhum dado consultado (`index.tsx:25-70`). |
| **Interativos** | "Entrar" (`:30`), "Começar meu perfil" (`:40`), "Nossos princípios" (âncora `#principios`, `:41`). Nada mais — sem FAQ, sem preço, sem "como funciona", sem login social direto. |
| **Validação/erros** | Nenhuma. |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | Só há dois caminhos para `/auth`; ambas as CTAs levam ao mesmo destino. Não há link para `/p/*`, termos ou privacidade. |
| **Feedback/ajuda** | Botão 💬 global (montado no root, `__root.tsx:138`). Sem links de ajuda. |
| **Microcopy problemática** | Rodapé com jargão de build: "…: [FORA DO ESCOPO DOS CONECTORES LOVABLE]." (`index.tsx:64-66`) — visível na landing pública. |

#### `/auth` — login / cadastro / social
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Entrar ou criar conta (e-mail+senha ou Google). |
| **Como se chega** | Ver §1. |
| **Estados** | Sem estado de página (não há loading/erro/sucesso de tela). `busy` só no submit de e-mail ("Um momento…", `:85`). Google **não tem estado de busy** (`:80`). Deslogado: mostra formulário; logado: `onAuthStateChange`/`getSession` navega para `/studio` (`:42-46`). |
| **Interativos** | "Continuar com o Google" (`:80`), e-mail (`:83`), senha (`:84`), submit (`:85`), "Primeira vez? Crie uma conta"/"Já tem conta? Entre" (`:87-89`), marca → `/` (`:77`). |
| **Validação/erros** | `required`, `type=email`, `minLength={8}` (`:84`) — porém o mapa de erros fala em **6 caracteres** (`:12`): quem digita 6–7 recebe validação nativa do navegador (idioma do SO) sem explicação. Erros de e-mail/senha: toast traduzido (`:11-19,55`). Google: `error.message` cru, potencialmente em inglês (`:67,71`). Cadastro sem sessão: toast "Confira sua caixa de entrada…" (`:56`). |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | **Não existe "Esqueci minha senha"** (grep `resetPasswordForEmail` = 0) nem **"reenviar e-mail de confirmação"** — quem não recebe o e-mail de confirmação fica sem saída (`:56`). Não há links de Termos/Privacidade. |
| **Feedback/ajuda** | Toaster global (top-center, `__root.tsx:137`) + 💬. |
| **Atalhos** | Nenhum. |

#### `/p/$slug` — micropágina pública da profissional
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Apresentar a profissional e levar a cliente para o app/enviar briefing. |
| **Como se chega** | Link externo (bio/Instagram). Nenhum link interno aponta para ela. |
| **Estados** | `carregando` (spinner, `:40`); `ok` (`:49-85`); `vazio`/`erro` colapsados na mesma tela "Perfil não encontrado" (`:41-47`) — o estado `erro` é setado (`:37`) mas nunca diferenciado do vazio. |
| **Interativos** | Instagram e WhatsApp (links externos, `:62-63`); "Enviar meu briefing" → `/profissionais` (`:77`); "Criar meu visual primeiro" → `/studio` (`:78`). |
| **Validação/erros** | Nenhuma validação de entrada. Texto legal em `text-[10px]` (`:80`). Rodapé expõe URL de produção hardcoded "aura-webapp-dusky.vercel.app" (`:83`). |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | A página **não tem header, footer, link para `/` nem para login**. No estado "perfil não encontrado", a única saída é "Ver profissionais perto de mim" → `/profissionais` (órfã) ou `/auth`. O CTA "Enviar meu briefing" **não inicia envio nem preserva a profissional**: leva para a rede e, deslogado, o gate manda para `/auth`, que após login manda para `/studio` (`auth.tsx:43-44`) — o destino intencional é perdido. |
| **Feedback/ajuda** | 💬 global. |
| **Promessa × entrega** | "Seus dados e fotos ficam privados — só o que você enviar chega à profissional" (`:80`) convive com o envio de URL assinada de 30 dias no `EnviarBriefing` (`EnviarBriefing.tsx:49-52`). |

### 2.2 Portão de conta e onboarding

#### `/consent` — "Antes de começarmos"
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Coletar consentimentos LGPD e aceite dos termos antes de qualquer tela do app. |
| **Como se chega** | Redirect automático do gate quando não existe linha em `consents` (`_authenticated/route.tsx:13-15`); URL direta. |
| **Estados** | Sem carregando (dados do usuário já vêm do gate); sem estado de erro de tela; `busy` desabilita "Continuar" (`:48`); erro de gravação só por toast (`:26`). |
| **Interativos** | 3 switches (`photo_processing`, `personalization`, `reminders`) com cartão clicável (`:37-42`); checkbox de termos obrigatório (`:44-47`); "Continuar" (`:48`); nav global inteira visível (header do layout). |
| **Validação/erros** | "Continuar" fica `disabled` até o checkbox; erro genérico "Não foi possível salvar suas escolhas. Tente novamente." (`:26`). Não há mensagem sobre o que muda se tudo ficar desligado. |
| **Destrutivas** | Nenhuma (tudo reversível em `/settings`). |
| **Saídas / dead ends** | **Laço de navegação**: o header está montado e todos os seus links são bloqueados pelo gate, que redireciona de volta para `/consent` — clicar em "Estúdio", "Sugestões" etc. **não avança** (ver §5.2). A única saída real é o botão "Sair" do header (`_authenticated/route.tsx:63`). Não há "não concordo / excluir conta". |
| **Gap de consentimento** | A tela oferece **3 permissões** (`aura.ts:39-43`), mas `/settings` expõe **4** — inclui "Imagens geradas por IA" (`settings.tsx:88`). Quem quiser usar Retrato/Modelo não consegue habilitar a permissão na tela de consentimento; precisa descobrir `/settings` depois. |
| **Feedback/ajuda** | Texto explicativo ("pode mudar em Configurações ou DNA…", `:35`), sem links. 💬 global. |

#### `/onboarding` — perfil visual (5 ou 9 etapas)
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Coletar perfil visual e liberar o app (o gate exige `visual_profiles.completed`). |
| **Como se chega** | Redirect do gate (`route.tsx:16-19`); `/settings:87`; `/package/$id:106`. |
| **Estados** | Carregando: "Carregando seu progresso…" (`:134`); retomada em `_last_step` (`:44-51`); autosave de 800 ms (`:60-68`); resumo com pendências (`:250-255`); **não há estado de erro de carregamento** (se o select falhar, abre perfil em branco) nem de erro no autosave (upsert sem checar `error`, `:65`). |
| **Interativos** | Abas "Rápido/Assistido" (`:141-144`); campos texto/número/área/slider/cards/cores (`:194-235`); "Usar sugestão" (`:229`); "Não sei · pular e retomar depois" (`:230`); HelpChat por campo (`:231`); Voltar/Próximo/Ver resumo (`:168-169`); "Salvar perfil"/"Salvar mesmo assim" (`:169`); chips de pendência (`:253`); "Editar passo" (`:260`); aside com "Seu espelho" (BodyAvatar, `:176-178`), "Convites de caimento" (`:181-182`) e "Retrato por IA (opcional)" (ReferenceImage, `:184-187`); no resumo, `WardrobeFitting` (`:274`). |
| **Validação/erros** | Validações são avisos gentis (`warns`, `:107,227`); nada obrigatório (pendências não bloqueiam salvar, `:252`). Erro de salvar perfil → toast (`:113`). "Pular" avisa por toast (`:79`) mas **não cria lembrete em nenhum outro lugar** — o campo pendente só reaparece se o usuário reabrir `/onboarding` manualmente. |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | Sem "pular tudo" / "fazer depois"; "Voltar" desabilitado na etapa 1 (`:168`). Salvar sempre navega para `/studio` (`:120`), mesmo quando a pessoa entrou por `/settings` ou `/package/$id` para ajustar uma preferência. Enquanto não salvar, o header inteiro cai no mesmo laço de redirect do gate. |
| **Efeito colateral** | Se o perfil já existia, salvar de novo injeta `signals_since_review: 10` no DNA (`:115`), disparando artificialmente o banner "Muita coisa mudou desde a última revisão" (`dna/route.tsx:30-34`). |
| **Acessibilidade** | `Label` sem `htmlFor` e `Input` sem `id` no mesmo bloco (`:199,203-206`); cards de opção são `<button>` sem `aria-pressed` (`:210`), só o campo de cores tem (`:221`); abas com `role="tab"` sem `role="tabpanel"`/`aria-controls` (`:141-144`). |
| **Código morto** | `avatarUrl`/`avBusy`/`makeAvatar` existem mas nunca são renderizados nem chamados (`:36-37,55-57,123-132`) — o "Retrato por IA" do onboarding não aparece mesmo quando existe avatar salvo. |

#### Navegação global (header + trilhas + feedback + cotas) — componente `_authenticated/route.tsx`
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Dar acesso a todas as áreas do app autenticado. |
| **Composição** | Marca → `/studio` (`:48`); `<nav>` com 6 links fixos + links das trilhas (`trilhas.ts:84-96`); 4 botões "✨ Estética", "👤 Modelo", "📸 Retrato", "✦ Pass" (`:56-59`); botão "Trilhas · N" (`:60-62`); "Sair" (`:63`); `overflow-x-auto` (`:47`). |
| **Alvos no header** | 6 fixos + até 8 links de trilha (combinação `estilo` 4 + `visual` 2 + `barbearia` 2) + 5 botões + marca + sair ≈ **20 alvos** numa linha com scroll horizontal sem indicador (`:47-64`). |
| **Estados** | Sem skeleton de shell; o gate consulta `consents` + `visual_profiles` a cada navegação (`:13-19`, `ssr:false`); loading de rota coberto só pelo spinner global de 300 ms (`router.tsx:25-26`). |
| **Trilhas** | Modal próprio (`TrilhaPicker.tsx`), aberto quando `lerTrilhas()` volta vazio (`:33-35`). "Agora não" fecha sem escolher (`TrilhaPicker.tsx:55`); com zero trilhas o menu mostra só os 6 fixos — **maquiagem, cabelo, roupas, tatuagem e jornada ficam sem ponto de entrada** (`trilhas.ts:93-96`). Texto diz "escolha até 3" (`TrilhaPicker.tsx:27-29`) mas o `toggle` não impõe limite (`:18`). |
| **Cotação/quota** | `QuotaChip` aparece em 5 lugares (`barba.tsx:80`, `modelo.tsx:187`, `retrato.tsx:200`, `tatuagem/vitrine.tsx:91`, `ReferenceImage.tsx:243`); **ausente** em `/studio`, `/maquiagem/gerar`, `/cabelo/gerar`, `/roupas/gerar`, `/tatuagem/gerar` e `/estetica`. |
| **Notificações** | **Não existe sino/central de notificações** (grep `Bell`/`notifica` = 0). "Lembretes" existem só como lista dentro de `/settings` (`:97-112`). |
| **Busca e atalhos** | Nenhuma busca global, nenhuma paleta de comandos, nenhum atalho de teclado (único `onKeyDown`: Enter para adicionar cor em `dna/preferencias.tsx:35`). |
| **Acessibilidade** | Links ativos só por classe de cor (`activeProps`, `:51`) sem `aria-current`; `<nav>` sem `aria-label`; botões e links com a mesma aparência e semânticas diferentes; emojis fazem parte do nome acessível ("✨ Estética", "✦ Pass"). |
| **Deletion/logout** | "Sair" sem confirmação, sem estado "saindo…" e sem feedback (`:63`) — regressão conhecida (A4) não corrigida. |

### 2.3 Criação e acervo

#### `/studio` — porta de criação
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Definir humor, modo de entrada, ocasião e intensidade → gerar sugestões. |
| **Como se chega** | Ver §1 (menu fixo, pós-login, pós-onboarding). |
| **Estados** | `busy` no CTA com texto "Compondo seus convites…" (`:94`) + dica "Isso pode levar até um minuto" (`:95`); erro só por toast (`:43,46`); sem vazio (formulário); sem estado sem permissão; sem contador de cota/aviso de custo (`:42,93-95`). |
| **Interativos** | `PresentationChoice` (Masculino/Feminino, `:53`); 5 humores (`:58-60`); 9 modos de entrada (`:67-71`); card "Coleções salvas" (`:72-74`); ocasião (`:80`); slider de intensidade (`:81`); "Algo mais para hoje?" (`:82`); card "👤 Criar meu modelo" (`:88`); link do guia (`:89`); "Criar minhas sugestões" (`:94`). |
| **Validação/erros** | Nenhum campo obrigatório; ocasião opcional; sem validação de tamanho. Erro de geração → toast genérico ("Algo deu errado ao criar suas sugestões.", `:46`) ou `r.error` cru do servidor (`:43`). |
| **Destrutivas** | Nenhuma. |
| **Saídas / loops** | Sucesso: navega para `/dashboard?batch=…` (`:44`). "Barba" e "Maquiagem" são **redirecionamentos invisíveis** (`:38-39`); o rótulo do botão só se adapta para maquiagem ("Ir para o gerador de maquiagem"), **não para barba** — quem escolhe Barba clica "Criar minhas sugestões" e cai em `/barba` (`:94`). |
| **Alternativas** | Modelo/guia no próprio Estúdio; trilhas no header; card de Coleções. |
| **Feedback/ajuda** | Link para `/guia` (`:89`); 💬 global; sem dica contextual de cota. |

#### `/dashboard` — "Suas sugestões"
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Listar pacotes gerados e abrir o detalhe. |
| **Como se chega** | Menu fixo; `/studio:44`; voltas de `/package`. |
| **Estados** | Skeleton 4 cards (`:37`); erro de consulta com texto e "Recarregue a página" (sem botão de retry, `:38`); vazio "Nada por aqui ainda" (`:54-60`); vazio de filtro (`:94`); "sucesso" = grade. |
| **Interativos** | Banner guia/modelo (`:40-51`); chip admin (`:66-70`); "Ver todas" quando `?batch` (`:76`); 5 filtros de status (`:78-80`); cards clicáveis (`:82-93`). |
| **Validação/erros** | Filtros sem contagem e sem `aria-pressed` (`:79`); filtro com 0 resultados tem mensagem (`:94`). |
| **Destrutivas** | Nenhuma na tela. |
| **Dead ends** | **O banner "Primeira vez? Comece pelo guia — e crie seu Meu Modelo" só aparece quando já existem pacotes**, porque o retorno de vazio acontece antes (`:54-60` vs `:65`) — justamente o usuário que nunca gerou não vê guia nem Modelo; o vazio oferece só "Abrir o Estúdio". |
| **Bug de indicadores** | Cards de `outfit`/`hair_plan` renderizam `Custo: undefined`, `Manutenção: undefined`, `Reversibilidade: undefined`, `Adaptação:` vazio (`PackageView.tsx:8-11`; tipos em `clothing.ts:9-13` e `hair.ts:30-36`). |
| **Alternativas** | Cada `kind` roteia para sua tela de módulo (`:83`); pacote genérico vai para `/package/$id`. |
| **Feedback/ajuda** | Banner do guia; 💬 global; nenhuma dica contextual além do banner. |

#### `/package/$id` — detalhe da sugestão
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Ler a sugestão, reagir (salvar/aprovar/rejeitar), anotar, adaptar, dar feedback. |
| **Como se chega** | `/dashboard:83`; `/barba` (fora do escopo). URL manual de pacote de módulo cai em aviso de desvio (`:48-51`). |
| **Estados** | Skeleton (`:44`); erro (`:45`); "não existe mais" com link (`:46`); desvio por `kind` (`:48-51`); alerta de permanência (`:99-104`). |
| **Interativos** | "← Sugestões" (`:90`); "Salvar" (`:124`); "Aprovar — vou testar" (`:125`); "Bonito, mas não prático"/"Desmarcar" (`:126`); "Não é para mim" (`:127`); "Exportar" (`:128`); "Salvar nota" (`:134`); `GenerationPresentation` + "Adaptar às minhas preferências" (`:138-140`); "Rever estrutura e preferências" → `/onboarding` (`:106`); sliders de feedback + "Enviar feedback" (`:148-152`); imagens `ReferenceImage`/`Variations` (dependem do estado). |
| **Validação/erros** | Atualização de status sem `disabled` e sem confirmação — 3 cliques = 3 updates + 3 eventos (`:54-61,124-127`); erro → toast (`:56`). Feedback valida só por banco (`:72-74`). |
| **Destrutivas** | "Não é para mim" e "Bonito, mas não prático" mudam estado sem confirmação; são reversíveis, mas "Aprovar/Rejeitar" não avisa consequência (alimenta DNA). |
| **Saídas / loops** | "Rever estrutura e preferências" leva ao wizard inteiro; ao salvar, o usuário é jogado em `/studio`, não volta ao pacote (`onboarding.tsx:120`). |
| **Feedback/ajuda** | Duas captações de feedback no mesmo lugar: sliders (tabela `feedback`) e o 💬 global (tabela anônima) — sem explicar a diferença (`:144-152`; `FeedbackButton.tsx:22-91`). |

#### `/collections` — Coleções
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Agrupar sugestões salvas/aprovadas. |
| **Como se chega** | Trilha Visual (`trilhas.ts:23-26`); card do Estúdio (`studio.tsx:72`). |
| **Estados** | Sem skeleton; **erro de consulta é engolido** (`(await …).data ?? []`, `:19-20`) → falha de rede aparece como "Nenhuma coleção ainda" (`:43`); vazio com link para sugestões (`:44`). |
| **Interativos** | Campo "Nome da nova coleção" (`:42`); "Criar" (`:42`); "Excluir" por coleção (`:48`); chips de pacotes para marcar/desmarcar (`:50-52`). |
| **Validação/erros** | **Criar com nome vazio retorna silenciosamente** (`:24`); erro de criação tem toast (`:26`); `toggle` e `remove` não checam erro (`:31,35`) — clique "não faz nada" sem aviso. |
| **Destrutivas** | "Excluir" coleção **sem confirmação** (`:48`) — apaga o agrupamento, não os pacotes; ainda assim é irreversível. |
| **Saídas / dead ends** | Sem "voltar"; sem renomear; sem contagem de itens; sem ordenação. |
| **Feedback/ajuda** | Sem ajuda contextual; 💬 global. |

#### `/compare` — Comparar
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Comparar até 3 sugestões lado a lado. |
| **Como se chega** | Menu fixo (`trilhas.ts:88`). |
| **Estados** | Sem skeleton e **sem estado de erro** (`.data ?? []`, `:17-20`); vazio com link (`:29`); sem estado de sucesso explícito (grade). |
| **Interativos** | Chips com checkbox para selecionar (`:30-36`); link "Abrir" em cada coluna (`:49`). |
| **Validação/erros** | 4ª seleção é **silenciosamente ignorada** (`:23`), sem mensagem; sem limite visual. |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | "Abrir" sempre vai para `/package/$id` (`:49`), mesmo para `outfit`/`hair_plan`/`tattoo_plan`, que exibem aviso de desvio em vez do detalhe (`package.$id.tsx:48-51`) — a comparação se perde ao abrir. |
| **Layout** | Grade com `gridTemplateColumns: repeat(n, minmax(0,1fr))` inline (`:38`) → 3 colunas estreitas em 360 px. |
| **Feedback/ajuda** | Nenhuma explicação de que rejeitadas não aparecem (`:21`). |

#### `/export` — Central de exportação
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Baixar sugestões salvas/aprovadas e imprimir. |
| **Como se chega** | Menu fixo (`trilhas.ts:89`). |
| **Estados** | Sem skeleton e **sem estado de erro** (`.data ?? []`, `:17`); vazio com dica (`:39`); sem estado de progresso de download. |
| **Interativos** | "Baixar todas (N)" (`:29`); "Imprimir esta página" (`:29`); "Baixar" individual (`:34`); links "revisar briefing" de tatuagem (`:38`). |
| **Validação/erros** | Nenhuma validação; erro de download não é tratado (`:22,34`). |
| **🔴 Bug crítico** | `packageToMarkdown` só trata `makeup_look`; `outfit` e `hair_plan` caem em `basicMd`, que faz `c.variations.flatMap(...)` (`aura.ts:108-115`) — campo inexistente nesses tipos (`clothing.ts:9-13`, `hair.ts:30-36`) → **exceção em runtime**; "Baixar todas" e o "Baixar" do item simplesmente não geram arquivo (e não há toast). |
| **Destrutivas** | Nenhuma. |
| **Saídas / dead ends** | "Baixar todas" exclui tatuagem por design (`:19-20`), mas o rótulo "todas" não diz isso; a seção de tatuagem aparece **abaixo** da lista (`:38`). |
| **Feedback/ajuda** | Nota sobre Google Docs não conectado (`:40`); 💬 global. |

### 2.4 Conta, plano, rede e ajuda

#### `/settings` — Configurações e dados
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Consentimentos, lembretes e exclusões de dados. |
| **Como se chega** | Menu fixo; `/aura-pass:94`; `/modelo:126-127`; `/guia:20`. |
| **Estados** | Sem skeleton (a página renderiza com switches desligados até a query chegar — `c` é `undefined`, `:38,88-94`); erro de query não tratado (`:27-37`); erros por toast (`:42,58,65,73`). |
| **Interativos** | Link "Aura Pass" (`:83`); link "Editar estrutura masculina/feminina e preferências" → `/onboarding` (`:87`); switch "Imagens geradas por IA" (`:88`); 3 switches de consentimento (`:89-94`); link DNA Permissões (`:95`); campo de lembrete + data + "Adicionar" (`:100`); "Feito/Desfazer" e "Remover" por lembrete (`:105-106`); 2 `Confirm` de wipe (`:116-117`); link "Redefinir ou exportar DNA Visual" (`:118`); `Confirm` "Excluir minha conta" (`:122`); link admin se admin (`:125`). |
| **Validação/erros** | "Adicionar" lembrete **retorna silenciosamente** se título/data vazios (`:50`) e **ignora erro de insert** (`:51-52`); "Remover" lembrete sem confirmação (`:106`); exclusões com `Confirm` descrevem consequência (`:116-117,122`). |
| **Destrutivas** | Wipe de fotos/sugestões e exclusão de conta com `AlertDialog` (`Confirm.tsx:4-13`) — bom. Porém: `wipe("packages")` **também apaga `generated_references`** antes de decidir o escopo (`:56-59`), e `deleteAccount` pode falhar no meio deixando estado parcial (`aura.functions.ts:152-168`); erro final mostra `error.message` cru (`:167`) → toast em inglês possível. |
| **Lacuna de conta** | **Não existe seção de conta**: nome, e-mail, troca de senha, "sair de todos os aparelhos", download completo dos dados (o link rotulado "Redefinir ou exportar DNA Visual" é o único caminho e fica em `/dna/redefinir`). Também não há botão "Sair" aqui (só no header). |
| **Saídas / dead ends** | Link "Editar estrutura…" abre o wizard inteiro (5–9 etapas) e ao terminar vai para `/studio` (`onboarding.tsx:120`), não volta para Configurações. |
| **Feedback/ajuda** | Texto "Cada geração usa créditos de IA" (`:88`) — único aviso de custo do app fora dos paywalls; 💬 global. |

#### `/aura-pass` — assinatura Pass
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Assinar/gerenciar o Aura Pass (R$ 19,90/mês). |
| **Como se chega** | Header (`route.tsx:59`), `/settings:83`, `/guia:38`, `/modelo:192`, paywalls de módulo, `/profissionais:180`. |
| **Estados** | `status` começa `null` e a tela renderiza a **oferta de venda como se o usuário não fosse assinante** (`:15,76`); falha em `passStatus` cai em `{ active:false }` sem aviso (`:19-21`) → assinante pode ver upsell e até reabrir checkout. `checkout=success`/`cancel` (`:58-65`); `busy` no botão (`:74,89`); erro inline `role="alert"` (`:93`). |
| **Interativos** | "Gerenciar assinatura" (só se ativo, `:74`); "Assinar · R$ 19,90/mês" (`:89`); "Voltar para Configurações" (`:94`). |
| **Validação/erros** | Não há validação de formulário (só redirect ao Stripe). Erro de checkout mostra `e.message` (`:35`) que pode ser técnico. |
| **Destrutivas** | Cancelamento é feito no portal Stripe (externo, `:42`) — sem confirmação/desfazer dentro do app. |
| **Saídas / loops** | Após `?checkout=success` tenta `passStatus` 3 vezes (3/4/5 s) e **não tem botão "verificar novamente"** (`:23-27,58-61`) — se a ativação demorar, a tela continua parecendo inativa e oferece "Assinar" de novo. |
| **Copy contraditória** | "as 5 gratuitas" (`:83`) e "5 imagens por conta" (`:88`) vs `LIMITES` = 18 no total por tarefa (`uso.functions.ts:11-18`). |
| **Feedback/ajuda** | Nenhum link de suporte/FAQ; 💬 global. |

#### `/profissionais` — rede (cliente + profissional)
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Ver envios, responder briefings recebidos, publicar vitrine, cadastrar perfil profissional. |
| **Como se chega** | **Somente** por `/p/$slug:45,77` (órfã no app). |
| **Estados** | Banner 💎/paywall Pro (`:179-195`); "Carregando…" textual só em envios (`:259`); erros de carregamento viram lista vazia (`:126-127`); abas: envios (`:257-286`), recebidos (`:204-255`), vitrine (`:288-325`), cadastro (`:327-353`); estado sem permissão = cadastro/aba Pro. |
| **Interativos** | Botão "Assinar" Pro (`:185,193`); abas (`:198-201`); "Ler o briefing"/"Ver briefing" (`:213,268`); "Aplicar com IA e enviar" (`:221`); campo de sugestão (`:219`); orçamento/prazo/observação (`:238-241`); "💰 Faço — enviar orçamento" (`:243`); "✖ Não faço este pedido" (`:244`); campos de vitrine + upload (`:295-303`); pausar/reativar (⏸️/▶️), stencil (🖨️), excluir (🗑️) por design (`:315-317`); campos de cadastro (`:331-341`); "Salvar meu perfil" (`:341`); "Copiar"/"Ver minha página" (`:347-349`); modal de stencil com limiar/fundo/baixar (`:354-378`). |
| **Validação/erros** | CEP: "CEP: 8 números." (`:158`) e "Não achamos as coordenadas desse CEP." (`:162`); falha no `fetch` de CEP cai no catch genérico (`:166`). Orçamento aceita texto inválido: botão habilita com `!respostaForm.valor` e `Number("abc") || undefined` envia sem valor (`:132,243`). **Não há pré-carga do perfil já cadastrado** — quem já é profissional reabre a aba e vê formulário vazio (`:122,327-353`). |
| **Destrutivas** | Excluir design usa `confirm()` nativo (`:317`) — único lugar do fluxo de conta com confirm de navegador, diferente do `Confirm` estilizado; pausar design sem confirmação (reversível na UI, **mas a imagem continua pública**: upload em bucket público + `getPublicUrl` em `:108-115`, e pausar só troca `ativo` em `:315`). **Não há como despublicar/desativar o perfil profissional.** |
| **Dead ends / loops** | Aba "Recebidos" **só aparece se `recebidos.length > 0`** (`:199`) → profissional novo nunca descobre a aba. Texto de "Meus envios" vazio manda clicar em "💚 Gostei — e agora?" → "Briefing para o salão" (`:260`) — botão que só existe dentro de `ReferenceImage` (`ReferenceImage.tsx:249,256`), nunca nesta página. "Gerencie em Aura Pass" para o **Plano Profissional** (`:180`) manda para a página do Pass (R$ 19,90), não do Pro. Copy "sugestões grátis" (`:183,191,222`) colide com "sugestões" = pacotes do app. |
| **Feedback/ajuda** | Sem ajuda contextual; 💬 global. |

#### `/admin` — painel operacional
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Ver totais/eventos, catálogo, parceiros, feedback, segurança. |
| **Como se chega** | `/settings:125` e `/dashboard:66-70`, ambos condicionais a admin. |
| **Estados** | "Carregando…" textual (`:36`); erro (`:37`); **sem permissão**: "Esta área é só para administradores." (`:38`) sem ação/saída; sucesso = seções. |
| **Interativos** | Textarea + "Salvar aviso" de tatuagem (`:64`); textarea + "Salvar" de termos bloqueados (`:67-68`); componentes `CatalogManager`, `ParceirosManager`, `FeedbackAdmin` (`:61-63`). |
| **Validação/erros** | Botão "Salvar aviso" desabilitado se vazio (`:64`); toasts de erro/sucesso (`:43-44,64`). |
| **Destrutivas** | Exclusões dentro dos managers (fora do escopo desta ficha; 2 usam `window.confirm`, ver `02-frontend` §3.4). |
| **Dead ends** | Nenhum link de volta; só header. |
| **Jargão** | "Status dos conectores" exibe "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" 2× (`:23,25`) e nomes de evento crus em inglês na lista (`:57`). |

#### `/guia` — Guia rápido (5 passos)
| Campo | Registro verificado |
|---|---|
| **Objetivo** | Tutorial de primeiros passos. |
| **Como se chega** | `/dashboard:47` (só com pacotes) e `/studio:89`. |
| **Estados** | Estático (sem loading/erro/vazio). |
| **Interativos** | 5 CTAs de passo: "Criar meu modelo" → `/modelo` (`:14`), "Abrir Configurações" (`:20`), "Ir para o Estúdio" (`:26`), "Experimentar o Retrato" (`:32`), "Conhecer o Aura Pass" (`:38`); link final para `/studio` (`:63`). |
| **Validação/erros** | Nenhuma. |
| **Destrutivas** | Nenhuma. |
| **Promessa × entrega** | Três afirmações não se sustentam globalmente: "Em tudo, a IA primeiro mostra o cartão 'Entendi assim'" (`:24`) — só existe em `ReferenceImage.tsx:209,226` e `/retrato`; "todo gerador mostra a caixinha 'Usar meu modelo pessoal'" (`:30`) — só em `ReferenceImage.tsx:236`, condicionada a tattoo/look; "O contador embaixo mostra quantas grátis ainda restam" (`:31`) — `QuotaChip` só em 5 superfícies, ausente de todos os geradores de texto. |
| **Feedback/ajuda** | O próprio guia é a ajuda; não há FAQ, contato ou chat fora do onboarding. |

---

## 3. Inventário transversal de ações destrutivas (quem confirma o quê)

| Ação | Tela | Confirma? | Reversível? | Avisa consequência? | Evidência |
|---|---|---|---|---|---|
| Excluir minha conta | `/settings` | ✅ `AlertDialog` | ❌ | ✅ "remove tudo" (mas a frase é falsa: 12 tabelas ficam) | `settings.tsx:120-123`; `aura.functions.ts:162` |
| Excluir todas as fotos / referências | `/settings` | ✅ | ❌ | ✅ | `settings.tsx:116` |
| Excluir todas as sugestões | `/settings` | ✅ | ❌ | ✅ (diz "pacotes") | `settings.tsx:117` |
| Excluir coleção | `/collections` | ❌ | ❌ | ❌ | `collections.tsx:48` |
| Remover lembrete | `/settings` | ❌ | ❌ | ❌ | `settings.tsx:106` |
| Remover marcação de lembrete | `/settings` | ❌ | ✅ | — | `settings.tsx:105` |
| Excluir design da vitrine | `/profissionais` | ⚠️ `confirm()` nativo | ❌ | ⚠️ só o título | `profissionais.tsx:317` |
| Pausar/reativar design | `/profissionais` | ❌ | ✅ | — | `profissionais.tsx:315` |
| Excluir modelo pessoal | `/modelo` | ❌ | ❌ (perde o ativo pago) | ❌ | `modelo.tsx:153` |
| Excluir referência/retrato | `ReferenceImage` (inclui onboarding) | ❌ | ❌ | ❌ | `ReferenceImage.tsx:239` |
| Aprovar/rejeitar/"não é para mim" | `/package/$id` | ❌ (sem `disabled`) | ✅ status trocável, mas dispara log/DNA | ❌ | `package.$id.tsx:124-127` |
| Cancelar assinatura | `/aura-pass` (portal Stripe) | ⚠️ externo | ⚠️ | — | `aura-pass.tsx:42-47` |

**Padrão observado:** confirmação existe onde o time já sofreu com o erro (dados de conta), e falta justamente em objetos que o usuário cria com esforço (coleção, design, modelo). Três tecnologias de confirmação diferentes (`Confirm` estilizado, `confirm()` nativo, nenhuma) na mesma jornada de conta.

---

## 4. Consistência de vocabulário

| Termo/conceito | Onde aparece | Variações encontradas | Risco de confusão |
|---|---|---|---|
| Objeto gerado por IA (pacote visual) | Landing, estúdio, dashboard, detalhe, export, settings, guia, consent | **"sugestão"** (`index.tsx:19`; `dashboard.tsx:16,74`; `export.tsx:28`; `settings.tsx:117`), **"convite(s)"** (`index.tsx:19`; `dashboard.tsx:57,73`; `studio.tsx:56,94`; `onboarding.tsx:181,276`; `consent.tsx:46`), **"pacote"** (`dashboard.tsx:16`; `package.$id.tsx:18`; `settings.tsx:117` desc; código `packages`), **"plano"** (`export.tsx:12,40` "planos"; `/cabelo` "planos"; `/tatuagem` "plano"), **"look"** (maquiagem/roupas), **"conceito"** (tatuagem) | Alto. O usuário salva uma "sugestão", vê "convites fresquinhos", exporta "planos" e, em Configurações, apaga "pacotes". São 4 nomes para o objeto central. `AURA-ID-GUIA-COMPLETO.md:118` já elege "sugestão" como padrão — o app não segue. |
| Assinatura | Header, `/aura-pass`, `/settings`, `/profissionais`, `/guia` | **"Pass"** (`route.tsx:59`), **"Aura Pass"** (`aura-pass.tsx:54`), **"Assinatura"** (`aura-pass.tsx:53`; `settings.tsx:82`), **"Plano Profissional"** (`profissionais.tsx:180-191`), **"plano"** genérico | Alto. Duas assinaturas (Pass R$19,90 e Pro R$49,90) com vocabulário intercambiável; `/aura-pass` não menciona o Pro, e `/profissionais` manda "gerenciar" o Pro no Pass (`:180`). |
| Trilha × módulo | Header/`TrilhaPicker` × guia e telas de módulo | "trilha" (`trilhas.ts`), "módulo" (`guia.tsx:24`; `settings.tsx:95`; `dna/permissoes`), "menu" (`TrilhaPicker.tsx:28`) | Médio. O usuário escolhe "trilhas" mas nunca vê "módulos" no menu; "Permissões por módulo" (settings) não tem relação visível com trilhas. |
| Modelo / retrato / avatar / espelho | `/onboarding`, `/modelo`, `/retrato`, dashboard, guia | **"Meu Modelo"** (`modelo.tsx:122`; `dashboard.tsx:43,48`; `guia.tsx:11`; `studio.tsx:86`), **"modelo pessoal"** (`ReferenceImage.tsx:236`), **"Retrato"** (`route.tsx:58`; `retrato.tsx`), **"Retrato por IA"** (`onboarding.tsx:185`), **"avatar"** (`onboarding.tsx:22` meta; `avatarUrl`/`generateAvatar`), **"espelho"** (`onboarding.tsx:176-178`), **"boneco"** (comentário de `WardrobeFitting.tsx:12`) | Alto. **"Retrato" tem dois sentidos**: o produto Aura Retrato (edita foto real) e o "Retrato por IA" do onboarding (pessoa fictícia/avatar). "Espelho" e "avatar" não aparecem em nenhum menu. |
| Profissional × parceiro | `/p/$slug`, `/profissionais`, admin, `EnviarBriefing` | "profissional" (todo o fluxo), "REDE DE PROFISSIONAIS" (`p.$slug.tsx:52`), "parceiro/Parceiros" (`admin.tsx:62`; `ParceirosManager` — lojas), "cliente" (`profissionais.tsx:218,241`) | Médio. "Parceiro" é loja no admin, mas o público pode ler como "profissional parceiro". |
| Briefing × envio | `/profissionais`, `EnviarBriefing`, tatuagem | "briefing", "envio", "briefing recebido", "orçamento", "sugestão do profissional" | Médio. "Sugestão" de novo: em `/profissionais` significa imagem editada pela IA, e não pacote. |
| "Agora não" / "Não sei · pular" | Trilhas e onboarding | dois rótulos para a mesma ideia de adiar | Baixo/médio: ambas as ações adiam, mas uma esconde módulos e a outra cria pendência invisível. |

---

## 5. Consistência de padrões de interação

### 5.1 Mesmo problema, soluções diferentes
| Situação | Telas | Padrões | Evidência |
|---|---|---|---|
| Loading inicial | `/dashboard`, `/package` (skeleton) · `/admin`, `/profissionais` (texto "Carregando…") · `/p/$slug` (spinner) · `/collections`, `/compare`, `/export` (nada) · rotas (spinner global 300 ms) | 5 padrões | `dashboard.tsx:37`; `package.$id.tsx:44`; `admin.tsx:36`; `profissionais.tsx:259`; `p.$slug.tsx:40`; `router.tsx:25-26` |
| Erro de carregamento | `/dashboard`, `/package`, `/admin` (texto + ação implícita) · `/collections`, `/compare`, `/export` (erro vira vazio) · `/p/$slug` (vira "não encontrado") · `/aura-pass` (vira "não assinante") | 4 padrões, sendo 2 silenciosos | `dashboard.tsx:38`; `package.$id.tsx:45`; `admin.tsx:37`; `collections.tsx:19-20`; `compare.tsx:17-20`; `export.tsx:17`; `aura-pass.tsx:19-21`; `p.$slug.tsx:41-47` |
| Vazio com próximo passo | `/dashboard` (CTA), `/compare` (link), `/collections` (link), `/export` (texto sem link), `/admin` (sem ação), `/profissionais` (instrução sem link) | Inconsistente | `dashboard.tsx:54-60`; `compare.tsx:29`; `collections.tsx:44`; `export.tsx:39`; `profissionais.tsx:206,260` |
| Erro de escrita | toasts em quase tudo; inline `role="alert"` em `/profissionais`, `/aura-pass`, `/modelo`, `/retrato`; silêncio em `/collections`, `/compare`, `/export`, `settings.addReminder` | 4 padrões | `collections.tsx:24,31,35`; `settings.tsx:50-52`; `auth.tsx:55`; `profissionais.tsx:340`; `aura-pass.tsx:93` |
| CTA principal | "Criar minhas sugestões" (accent, rodapé, `/studio:94`), "Assinar" (default, meio da página, `aura-pass.tsx:89`), "Salvar perfil" (accent, rodapé, `onboarding.tsx:169`), "Novo plano" (topo direito, `JourneyWorkspace.tsx:33`), "Criar" (input inline, `collections.tsx:42`) | Posição e hierarquia variam sem regra | — |
| Ação de status | `/package` 5 botões soltos; `/dashboard` filtro; `/cabelo/plano` 5 botões; `/roupas/look` 5 botões | Rótulos e ordem diferentes entre módulos (pormenor em `05`) | `package.$id.tsx:124-128` |
| Feedback por item | `feedback` (sliders no pacote) × `feedback_anonymous` (botão 💬) | Dois modelos, sem explicação | `package.$id.tsx:144-152`; `FeedbackButton.tsx:22-91` |

### 5.2 Loops e dead ends confirmados no código
1. **Laço do gate em `/consent` e `/onboarding`.** O layout completo (header + menu) é renderizado dentro de `/_authenticated` e o `beforeLoad` redireciona qualquer rota que não seja a tela pendente de volta para ela (`_authenticated/route.tsx:13-19`). Resultado: em `/consent`, clicar em "Estúdio/Sugestões/DNA/Comparar/Exportar/Configurações/Estética/Modelo/Retrato/Pass/trilhas" **volta para `/consent`** (ou para `/onboarding`, depois do consentimento). A única saída é "Sair". Mesmo efeito na `/onboarding` (`:16-19`).
2. **Laço de sessão em falha de rede.** O gate usa `auth.getUser()` e trata "erro/usuário nulo" como deslogado (`:11-12`). `/auth` usa `getSession()` (cache local) e, se houver sessão, navega para `/studio` (`auth.tsx:42-46`). Se `getUser` falhar por rede e `getSession` devolver sessão local, o ciclo `/studio → /auth → /studio` é determinístico no código. Não verificável em navegador sem simular falha de rede; o comportamento do Supabase JS (se `getUser` rejeita ou devolve `error`) define o loop.
3. **Deep link perdido.** Qualquer URL protegida acessada deslogada vira `/auth` sem `redirect` (`route.tsx:12`) e o login sempre manda para `/studio` (`auth.tsx:43-44`). Vale para o CTA "Enviar meu briefing" de `/p/$slug` e para qualquer link compartilhado de `/package/$id`.
4. **Contexto perdido ao editar preferências.** `/package/$id:106` e `/settings:87` entram em `/onboarding`; o fim do onboarding navega para `/studio` (`onboarding.tsx:120`), nunca de volta à origem.
5. **Pendências do onboarding sem retorno.** "Não sei · pular e retomar depois" grava `_pending` (`onboarding.tsx:76-80`); nada no app (dashboard, header, settings) lembra o usuário — só o próprio onboarding mostra os chips.
6. **"Agora não" nas trilhas.** Sem trilhas, o menu perde 5 módulos e o único caminho alternativo são cartões internos do Estúdio (`studio.tsx:72`) e links de módulo em telas de detalhe. `/profissionais` não tem nem isso.

---

## 6. Microcopy

| Problema | Evidência | Impacto |
|---|---|---|
| **Jargão de build exposto ao usuário** — "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" em maiúsculas na landing e rodapés; "Fora do escopo dos conectores Lovable" na tatuagem | `index.tsx:65`; `admin.tsx:23,25`; `maquiagem/route.tsx:26`; `cabelo/route.tsx:23`; `roupas/route.tsx:26`; `tatuagem/route.tsx:5` | Primeira impressão amadora; contradiz o hero |
| URL de produção hardcoded na página pública | `p.$slug.tsx:83` ("aura-webapp-dusky.vercel.app") | Vaza infraestrutura e pode divergir do domínio atual |
| Texto que manda para caminho que não existe/não é clicável | `EnviarBriefing.tsx:54` e `tatuagem/vitrine.tsx:81` ("a resposta aparece em Profissionais → Meus envios"); `profissionais.tsx:260` (manda clicar em botão que não está na página) | Usuário procura uma navegação que não existe |
| Promessa de busca inexistente | `p.$slug.tsx:45` "Ver profissionais perto de mim" → `/profissionais`, que **não tem busca/listagem**; a busca por CEP só existe dentro do briefing (`EnviarBriefing.tsx:59-73`) | Quebra de expectativa no CTA público |
| Copy de quota contraditória | `aura-pass.tsx:83,88` "5 gratuitas / 5 imagens por conta" × `uso.functions.ts:11-18` (18 por tarefa) | Credibilidade e suporte |
| Números sem explicação | `profissionais.tsx:183,191,222` "3 sugestões grátis" (sem indicar por conta/serviço); `guia.tsx:36` preço fixo no texto | Ambiguidade |
| Status em minúsculas e inglês técnico no admin | `dashboard.tsx:20` filtros "todas/novas/salvas"; `aura.ts:37` rótulos minúsculos; `admin.tsx:57` eventos `recommendation_approved` | Inconsistência de tom (admin é tolerável) |
| Textos legais e rótulos de IA minúsculos (10–11 px) | `p.$slug.tsx:80`; `onboarding.tsx:284`; `FeedbackButton.tsx:80`; `PackageView.tsx:18` (`AiLabel` `text-[10px]`) | Leitura difícil no celular |
| Placeholders bons, mas nem sempre | Bons: `studio.tsx:80,82`; `profissionais.tsx:295,219`; `maquiagem` etc. Fracos: `auth.tsx` sem requisito de senha; `settings.tsx:100` "ex.: Marcar corte de cabelo" ok | — |
| Registro de voz inconsistente | "Xingar pode, ajudar mais ainda" (`FeedbackButton.tsx:68`) vs tom cerimonial do consentimento (`consent.tsx:35`) | Marca oscila entre "próxima" e "institucional" |
| Erros crus de servidor na UI | `auth.tsx:67,71` (OAuth); `profissionais.tsx:45,120,137,166` (`e.message`); `aura-pass.tsx:35`; `settings.tsx:73` via `deleteAccount` (`aura.functions.ts:167`) | Erros em inglês/técnicos em app 100% PT-BR |
| Frases longas em cabeçalhos (60–90 palavras) | `guia.tsx:12,18,24,30`; `p.$slug.tsx:80`; `consent.tsx:35` | Baixa leitura em mobile |
| Capitalização e pontuação | "Guia rápido · Aura ID" (`guia.tsx:5`) vs meta de outras rotas; "Sua opinião — de graça e valiosa" (`FeedbackButton.tsx:51`); "✦ Pass" (`route.tsx:59`) | Menor |

---

## 7. Onboarding, tutoriais e ajuda — o que existe de fato

| Recurso | Existe? | Onde | Cobertura |
|---|---|---|---|
| Wizard de perfil (onboarding) | ✅ | `/onboarding`, 5 (rápido) ou 9 (assistido) etapas, autosave/retomada | Boa intenção; sem saída, sem erro de carregamento, pendências sem retorno |
| Ajuda contextual de IA por campo | ✅ | `HelpChat` em cada campo do onboarding (`onboarding.tsx:231`; `components/onboarding/HelpChat.tsx:11-68`) | Só no onboarding. Fora dele, nenhum chat de ajuda |
| Dicas por campo (modo assistido) | ✅ | `onboarding.tsx:202` (hint + exemplo), `:158` (`step.tip`) | Só no onboarding |
| Guia rápido de 5 passos | ✅ | `/guia` | **Só alcançável com pacotes** (`dashboard.tsx:47,54`) ou pelo Estúdio (`studio.tsx:89`); 3 de 5 passos contêm promessas não cumpridas |
| Banner de primeira vez | ⚠️ | `dashboard.tsx:40-51` | Justamente ausente no estado vazio |
| Dica contextual nos geradores | ❌ | — | Nenhum tooltip/dica persistente em `/studio`, `/dashboard`, `/aura-pass` |
| FAQ / central de ajuda / docs | ❌ | — | Nenhum link de documentação no app (o único "guia" é `/guia`) |
| Chat de suporte | ❌ | — | Não existe; só o canal de opinião 💬 (assíncrono) |
| Tour de interface (v1) | ❌ | — | Nenhuma marcação de `data-tour`, driver.js etc. |
| Termos de uso / política de privacidade | ❌ | — | Nenhum link; o único "termo" é o checkbox do `/consent` (`consent.tsx:44-47`), sem documento para abrir |
| Central de novidades/roadmap | ❌ | — | Nenhuma |
| Notificações / sino | ❌ | — | Nenhuma; lembretes só listados em `/settings:97-112` |
| Atalhos de teclado | ❌ | — | Único `onKeyDown` é Enter para adicionar cor no DNA (`dna/preferencias.tsx:35`) |

**Conclusão da seção:** o produto tem **um** tutorial real (guia) e **uma** ajuda contextual real (HelpChat no onboarding). Fora do onboarding, toda a ajuda é o botão de opinião. O guia, que deveria ser a espinha dorsal, é escondido do usuário novo e promete recursos que só existem em uma minoria das telas.

---

## 8. Acessibilidade de conta e navegação (só o que o código permite afirmar)

| Item | Achado | Evidência |
|---|---|---|
| Navegação principal | `<nav>` sem `aria-label`; links ativos sem `aria-current` (só classe de cor) | `_authenticated/route.tsx:49-55` |
| Header em mobile | 16–20 alvos em `overflow-x-auto` sem gradiente/indicador de scroll | `route.tsx:46-47` |
| Modal de trilhas | `<div class="fixed inset-0">` sem `role="dialog"`, `aria-modal`, rótulo, trap de foco, Enter/Escape; opções sem `aria-pressed` | `TrilhaPicker.tsx:21-52` |
| Seletor Rápido/Assistido | `role="tab"`/`aria-selected` corretos, mas sem `role="tabpanel"`/`aria-controls` e sem navegação por setas | `onboarding.tsx:141-144` |
| Rótulos de campo no onboarding | `Label` sem `htmlFor`, `Input` sem `id` (nome acessível não associado no código) | `onboarding.tsx:199,203-206` |
| Switches de consentimento | Sem `aria-label`; dependem do `<label>` que envolve o card (nome longo). Não verificável em leitor de tela | `consent.tsx:38-42`; `settings.tsx:88-94`; `components/ui/switch.tsx:6-23` |
| Botões só com ícone | Dependem de `title` (profissionais: pausar/reativar/stencil/excluir) — nome acessível frágil; `FeedbackButton` tem `aria-label` correto | `profissionais.tsx:315-317`; `FeedbackButton.tsx:44` |
| Loading global | `role="status"` + `aria-label="Carregando"` (bom) | `router.tsx:7-13` |
| Alertas/erros | Mistura `role="alert"` (bom) com toasts e texto puro; erros de `collections/compare/export` não são anunciados porque não existem | `aura-pass.tsx:93`; `profissionais.tsx:302,340`; `collections.tsx:19` |
| Foco no login | Inputs com `Label htmlFor` corretos; sem `autoFocus`; sem gerenciamento de foco após toast | `auth.tsx:83-84` |
| Foco no onboarding | Sem `autoFocus`/foco gerenciado na troca de etapa; usuário de teclado pode "perder" a posição | `onboarding.tsx:156-166` |
| Textos pequenos | 10–11 px em avisos legais e `AiLabel` | `p.$slug.tsx:80`; `PackageView.tsx:18`; `FeedbackButton.tsx:80`; `onboarding.tsx:284` |
| Contraste | Já medido em `02-frontend.md` §3.5 (accent ~3,06:1) — **não reverificado aqui** (cálculo de cor fora do escopo desta rodada) | `src/styles.css:66-67` |
| Idioma | `<html lang="pt-BR">` correto | `__root.tsx:108` |

---

## 9. ACHADOS PRIORIZADOS

> Gravidade: 🔴 crítico (quebra fluxo/promessa central) · 🟠 alto (perda de confiança, dado, conversão ou conta) · 🟡 médio (fricção/consistência) · 🟢 baixo (polimento).

### 🔴 Críticos

| # | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|
| **A-01** | A "Central de exportação" falha em runtime para `outfit` e `hair_plan`: `basicMd` lê `c.variations.flatMap`, campo que esses tipos não têm. "Baixar todas" e o "Baixar" individual não geram arquivo e não mostram erro. | `export.tsx:9,22,34`; `aura.ts:108-115`; `clothing.ts:9-13`; `hair.ts:30-36` (o módulo Cabelo já tem `planToMarkdown` próprio, usado em `cabelo/plano.$id.tsx:39`, mas o export central não o chama) | Usuário salva look/plano, vai exportar e "nada acontece" — quebra a promessa de organizar/levar o plano; ticket garantido. | `packageToMarkdown` assumiu um único formato (`AuraPackage`); os módulos criaram JSONs paralelos e o export só foi adaptado para maquiagem. |
| **A-02** | Jargão de fornecedor de build exposto ao usuário final em 7 pontos, incluindo a landing pública e rodapés de 4 módulos. | `index.tsx:64-66`; `maquiagem/route.tsx:26`; `cabelo/route.tsx:23`; `roupas/route.tsx:26`; `tatuagem/route.tsx:5`; `admin.tsx:23,25` | Primeira impressão amadora; o rodapé diz que o produto não faz o que o hero promete. | Nota de desenvolvimento nunca removida (e reapareceu na reescrita dos rodapés). |
| **A-03** | O CTA público "Enviar meu briefing" não inicia envio nem preserva a profissional: leva para `/profissionais`; deslogado cai em `/auth` e, após login, em `/studio`. O envio real só existe dentro do `ReferenceImage` de um pacote já gerado. | `p.$slug.tsx:77,80`; `_authenticated/route.tsx:12`; `auth.tsx:43-44`; `EnviarBriefing.tsx:16` (componente) montado apenas em `ReferenceImage.tsx:270-279`, que só existe dentro de um pacote com imagem gerada | Funil público (link da bio) quebra no clique; cliente não envia briefing e não entende por quê. | CTA escrito como se a página pública tivesse formulário; ausência de `redirect` no login. |
| **A-04** | `/profissionais` é órfã na navegação (único link interno vem de `/p/$slug`), e a página pública promete "Ver profissionais perto de mim" para uma tela que **não tem busca/listagem**. Toasts mandam para "Profissionais → Meus envios" sem link. | `p.$slug.tsx:45,77`; `profissionais.tsx:171-380` (sem busca/listagem); `EnviarBriefing.tsx:54`; `tatuagem/vitrine.tsx:81` | A rede de profissionais — P0 de distribuição nos docs — é inalcançável para quem chega pelo app; profissional novo também não acha a aba "Recebidos" (`:199`). | Feature entregue sem ponto de entrada no menu; copy de navegação em toasts sem link. |

### 🟠 Altos

| # | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|
| **A-05** | Guia promete três recursos que não existem globalmente: "Entendi assim" em tudo, contador de grátis em tudo e "usar meu modelo" em todo gerador. | `guia.tsx:24,30,31`; realidade: `ReferenceImage.tsx:209,226,236,243`; `QuotaChip` em 5 arquivos (grep) | A "ajuda" ensina um produto que não é o que o usuário vê; tickets e desconfiança. | Guia escrito sobre o app mobile/roadmap, não sobre o webapp atual. |
| **A-06** | Gate trata falha de rede como "deslogado" e `/auth` redireciona quem tem sessão local para `/studio` → ciclo `/studio ↔ /auth` possível, sem tela de erro. | `_authenticated/route.tsx:11-12`; `auth.tsx:42-46`; `__root.tsx:123-131` | Em rede degradada (cenário já documentado no relatório anterior) o app pode entrar em loop de redirecionamento e parecer quebrado. Não verificável sem simular falha. | `getUser()` chamado a cada navegação sem `try/catch` nem estado "erro de conexão"; login sem verificação de destino. |
| **A-07** | Conta sem recuperação: não existe "Esqueci minha senha" nem reenvio de confirmação de e-mail; erros do Google aparecem crus; senha exige 8 no HTML mas a mensagem fala em 6. | `auth.tsx:11-19,56,67,71,84`; grep `resetPasswordForEmail` = 0 | Usuário que esquece a senha ou não recebe o e-mail fica permanentemente fora da conta. | Dívida conhecida (A9) bloqueada por SMTP; campo de senha endurecido sem atualizar a mensagem. |
| **A-08** | Consentimento não oferece "Imagens geradas por IA"; o onboarding exibe "Retrato por IA" que exige `photo_processing` (desligado por padrão) e o erro manda para Configurações sem link; o checkbox do componente fala só em "sem enviar minhas fotos", escondendo o requisito. | `consent.tsx:19-24`; `aura.ts:39-43`; `onboarding.tsx:184-187`; `ReferenceImage.tsx:207`; `references.functions.ts:72-74`; `settings.tsx:88` | Recurso opcional do onboarding falha para o usuário padrão, com instrução incompleta → abandono. | Permissão `image_generation` foi adicionada só em Settings; copy do componente e da tela de consentimento não acompanharam. |
| **A-09** | Confirmação de ação destrutiva inconsistente: coleção sem confirmar, lembrete sem confirmar, modelo pessoal sem confirmar, design com `confirm()` nativo, status do pacote sem `disabled`/confirm. | `collections.tsx:48`; `settings.tsx:106`; `modelo.tsx:153`; `profissionais.tsx:317`; `package.$id.tsx:124-127` | Perda acidental de trabalho (modelo pago, coleção, design) e sobrescrita de status por duplo clique. | Cada tela implementou a própria solução; `Confirm.tsx` não é padrão obrigatório. |
| **A-10** | Exclusão de conta não é transacional (apaga `consents`/`visual_profiles` antes de excluir o usuário) e a lista de tabelas não cobre 12 tabelas de módulos, embora a UI diga "remove tudo"; erro final vaza mensagem crua. | `settings.tsx:120-123`; `aura.functions.ts:152-168` (lista em `:162`, `error.message` em `:167`) | Risco LGPD (dados sobrevivem) e conta parcialmente apagada se uma etapa falhar; erro em inglês possível. | Lista manual de tabelas que cresceu sem manutenção; ausência de transação (limitação do PostgREST). |
| **A-11** | Perda de contexto: "Editar estrutura e preferências" (`/settings`) e "Rever estrutura e preferências" (`/package`) abrem o wizard inteiro (5–9 etapas) e terminam sempre em `/studio`; salvar perfil existente injeta 10 sinais no DNA. | `settings.tsx:87`; `package.$id.tsx:106`; `onboarding.tsx:110-121` (nav `:120`; sinais `:115`) | Usuário sai do meio da tarefa, volta para outra tela e recebe banner falso "muita coisa mudou". | Onboarding foi desenhado como fluxo único (primeiro acesso), não como editor de preferências. |
| **A-12** | Aura Pass: copy "5 imagens" contradiz o backend (18 por tarefa); sem botão "verificar novamente" após checkout (poll 3×); assinante pode ver a oferta e até reabrir checkout enquanto o status carrega/falha. | `aura-pass.tsx:15,19-27,58-61,76,83,88,89`; `uso.functions.ts:11-18` | Risco de cobrança duplicada percebida e de upsell para quem já paga. | Quota descrita por marketing e não pelo código; estado `null`/erro renderizado como "não assinante". |

### 🟡 Médios

| # | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|
| **A-13** | Quatro nomes para o objeto central (sugestão/convite/pacote/plano) em telas do mesmo fluxo. | `index.tsx:19`; `dashboard.tsx:16,57,73`; `studio.tsx:56,94`; `package.$id.tsx:18`; `export.tsx:12,28,40`; `settings.tsx:117` | Custo cognitivo e sensação de produto inacabado. | Copy escrita por telas diferentes sem glossário aplicado. |
| **A-14** | Ambiguidade Pass × Plano Profissional × assinatura: dois produtos, dois preços, `/aura-pass` não menciona o Pro e profissionais manda gerenciar o Pro no Pass. | `route.tsx:59`; `aura-pass.tsx:54`; `profissionais.tsx:180,190`; `stripe.functions.ts:15-18` | Confusão sobre o que se compra e onde cancelar. | Venda do Pro embutida em `/profissionais`, fora do fluxo de assinatura. |
| **A-15** | "Retrato" tem dois sentidos (Aura Retrato edita foto real × "Retrato por IA" do onboarding) e "modelo/avatar/espelho" nomeiam o mesmo boneco sem aparecer no menu. | `route.tsx:58`; `onboarding.tsx:176,185`; `modelo.tsx:122`; `guia.tsx:11-12` | Usuário não entende o que cada item cria e para que serve. | Vocabulário do guia de produto não foi reconciliado com as telas. |
| **A-16** | Header com ~20 alvos numa linha de scroll horizontal, sem `aria-label`/`aria-current` e misturando `<Link>` e `<Button>` para o mesmo papel. | `_authenticated/route.tsx:46-64`; `trilhas.ts:84-96` | Navegação difícil no celular; leitor de tela não anuncia página atual. | Menu cresceu por acréscimo (4 botões de módulo + trilhas). |
| **A-17** | Seletor de trilhas: modal sem semântica/foco/Escape; limite "até 3" não aplicado (permite 4); "Agora não" esconde 5 módulos do menu. | `TrilhaPicker.tsx:18,21-25,27-29,54-61`; `trilhas.ts:93-96` | Escolha sem acessibilidade e usuário pode ficar sem os módulos que pagou/quer. | Componente próprio em vez de `Dialog`; regra de negócio só no texto. |
| **A-18** | Erros silenciosos: `/collections`, `/compare`, `/export` ignoram `error` e mostram "vazio"; criar coleção e adicionar lembrete retornam sem mensagem; `toggle`/`remove` de coleção não checam erro. | `collections.tsx:19-20,24,31,35`; `compare.tsx:17-20`; `export.tsx:17`; `settings.tsx:49-53` | Usuário acha que não tem dados / que a ação funcionou quando não funcionou. | Padrão `(await ...).data ?? []` e `if (!x) return` copiado entre telas. |
| **A-19** | Onboarding: autosave sem checagem de erro; pendências não ressurgem fora do onboarding; `Label` sem `htmlFor`; abas sem painel; código morto do "Retrato por IA" (avatar nunca renderizado). | `onboarding.tsx:61-68,76-80,123-132,199,203-206` | Perda silenciosa de rascunho e acessibilidade fraca no primeiro contato. | Fluxo grande, sem componente de campo compartilhado com `id`. |
| **A-20** | Dashboard: banner de guia/Modelo só aparece com pacotes; filtros sem contagem/`aria-pressed`; sem busca/ordenação; cards de `outfit`/`hair_plan` exibem `undefined`. | `dashboard.tsx:40-60,78-80,90`; `PackageView.tsx:8-11` | O usuário que mais precisa do guia não o vê; indicadores quebrados minam confiança. | Estado vazio com retorno antecipado antes do banner; `Indicators` só tipado para `AuraPackage`. |
| **A-21** | Configurações não têm gestão de conta: sem nome, e-mail, troca de senha, encerrar sessões ou exportar dados com rótulo claro. | `settings.tsx:78-128`; `dna/redefinir.tsx:43` (export real) | Usuário não consegue trocar senha nem achar o próprio dado; expectativa LGPD. | Settings nasceu como painel de consentimento/exclusão, não de conta. |
| **A-22** | `/p/$slug`: URL de produção hardcoded, título genérico ("Profissional · Aura ID"), estado erro indistinguível de vazio, sem header/footer e promessa de privacidade que o briefing contradiz (URL assinada de 30 dias + foto). | `p.$slug.tsx:12,41-47,80,83`; `EnviarBriefing.tsx:49-52` | Página pública amadora e promessa de privacidade arriscada. | Micropágina entregue como página isolada, sem layout público. |

### 🟢 Baixos

| # | Problema | Evidência | Impacto | Causa provável |
|---|---|---|---|---|
| **A-23** | Logout sem estado "Saindo…", sem feedback e sem confirmação. | `_authenticated/route.tsx:63` | Sensação de travado em rede lenta (A4 do relatório anterior não corrigido). | Correção proposta nunca aplicada. |
| **A-24** | "Continuar com o Google" sem estado de carregamento (clique duplo abre duas tentativas); sem requisitos de senha visíveis; sem links de Termos/Privacidade. | `auth.tsx:80,84,82-89` | Fricção/ruído no cadastro; lacuna legal de superfície. | Botão OAuth não compartilha o `busy` do formulário. |
| **A-25** | Nenhuma central de notificações/atividade e nenhum lembrete fora de `/settings`; sem busca global/atalhos. | grep `Bell` / `notifica` = 0; `settings.tsx:97-112` | Recursos "de retorno" invisíveis. | Escopo de notificações nunca entrou no webapp. |
| **A-26** | Admin exibe nomes de eventos crus em inglês e jargão de conectores; sem busca/filtro na lista. | `admin.tsx:57,23,25` | Baixo (público interno). | Painel técnico sem camada de apresentação. |
| **A-27** | 404 e boundary de erro mandam para `/` (landing), inclusive logado; a landing logada ainda oferece "Entrar" e faz salto por `/auth` até `/studio`. | `__root.tsx:29-34,67-72`; `index.tsx:30,40`; `auth.tsx:42-46` | Um clique extra e perda de contexto ao recuperar de erro. | Fallbacks globais sem consciência de sessão. |
| **A-28** | Rótulos de status em minúsculas e emojis como prefixo de status ("📤 Enviado", "💰 Orçado", "✖ Recusado"). | `aura.ts:37`; `dashboard.tsx:20,86`; `profissionais.tsx:169,211` | Polimento/tom. | Sem guia de estilo de status. |
| **A-29** | Textos legais e rótulos de IA em 10–11 px. | `p.$slug.tsx:80`; `FeedbackButton.tsx:80`; `PackageView.tsx:18`; `onboarding.tsx:284` | Legibilidade no celular. | Uso de `text-[10px]` como atalho. |
| **A-30** | `/profissionais` não permite despublicar/desativar o perfil público, e "pausar" um design não revoga a imagem do bucket público (a URL de `studio-media` continua acessível). | `profissionais.tsx:101-121,315,327-353` | Usuário não consegue sair da rede e acredita que pausar esconde o design. | Feature de cadastro sem ciclo de vida (criar/editar/despublicar) e sem política de retenção do bucket. |

**Contagem:** 🔴 4 · 🟠 8 · 🟡 10 · 🟢 8 = **30 achados**.

---

## 10. O que está bom e deve ser preservado

- **Gate de consentimento/perfil** realmente impede uso sem consentimento (`_authenticated/route.tsx:8-24`) — raro e correto.
- **Exclusões sensíveis com `Confirm` estilizado e descrição explícita** (`settings.tsx:116-122`; `Confirm.tsx:4-13`).
- **Onboarding com autosave e retomada por `_last_step`** (`onboarding.tsx:44-51,60-68`) e modo Rápido/Assistido com aviso "Trocar não apaga nada" (`:146`).
- **Banner de revisão do DNA** com contagem de sinais e link (`dna/route.tsx:30-34`).
- **Feedback 💬 em todas as páginas, com `aria-label` e tipos** (`FeedbackButton.tsx:41-88`; `__root.tsx:138`).
- **Spinner global "Preparando…"** com `role=status` (`router.tsx:5-15`).
- **Estados de sucesso/cancelamento do checkout** do Pass (`aura-pass.tsx:58-65`).
- **`/p/$slug` com estados carregando/não encontrado** e contatos externos funcionais (`p.$slug.tsx:34-64`).
- **Vocabulário acolhedor e não julgador** no consentimento e no guia.

---

## 11. Não verificado / não verificável no código

1. Se a falha de `getUser` produz o loop A-06 no runtime (depende do cliente Supabase e da rede).
2. Nomes acessíveis reais dos switches e do seletor de trilhas em leitor de tela.
3. Se o Stripe Checkout do Pass aplica Pix (a UI promete "Pix ou cartão", `aura-pass.tsx:88`).
4. Se a conta de teste tem `image_generation` ligada por padrão no banco (define o alcance de A-08).
5. Efeito visual real do header em 360 px, sobreposições do botão 💬 e contraste renderizado.
6. Se `passStatus`/`proStatus` e os handlers de IA consultam o entitlement (backend, fora deste escopo; `00-DIAGNOSTICO-E-PLANO.md` P0-6 sugere que não).
7. Se o e-mail de confirmação está ligado no Supabase hoje (define se A-07 é bloqueante na prática).
8. Tempos de resposta e comportamento em rede degradada.
