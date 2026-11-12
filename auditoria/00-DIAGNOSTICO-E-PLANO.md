# AURA ID — DIAGNÓSTICO, DECISÕES E PLANO DE SOCIEDADE
**Data:** 07/11/2026 · **Base:** webapp-lovable (código real, 70 arquivos de rota, 83 server functions, 8 migrações, 13 documentos de GTM, 4 planos de raiz, 8 planos Lovable, assets) · **Autoria:** auditoria em 4 frentes (produto/UX, backend/dados/IA, GTM, build) + leitura direta do Lead.

> Este documento é a fonte de decisão. Os anexos técnicos completos estão em auditoria/01-backend.md, auditoria/02-frontend.md e auditoria/03-gtm.md. Toda afirmação relevante cita arquivo:linha. O que não pôde ser verificado está marcado.

**Legenda de evidência:** [C] confirmado no repo · [I] inferido (precisa de runtime/remoto) · [A] ausente (procurei e não existe) · [NV] não verificável neste workspace.
**Confiança:** A alta · M média · B baixa.

---

## COMO LER: MÉTODO, O QUE FOI LIDO E LIMITES

**Lido integralmente ou por amostragem dirigida**
- Código: src/routes (63 páginas + 7 layouts), src/components (46 ui/ amostrados), src/lib (19 arquivos de server functions, 8.000+ linhas), src/integrations, server.ts, start.ts, drizzle/migrations/0000–0007, drizzle/schema.ts, supabase/config.toml, package.json, .env, vite/vitest/tsconfig.
- Documentos: AGENTS.md, README.md, PLANO-EXPANSAO.md, PLANO-IMAGEM-PRO.md, REMODELAGEM.md, roadmap.md, 8 .lovable/plan/*.md, 12 Notas/*.md + 13 Publicidade-Propaganda/*.md (13 únicos; o restante é duplicata byte-a-byte).
- Assets: kit de marca, persona "Lia", vídeo Gemini (metadados/inspeção visual). Nenhum é prova de uso real.

**Executado (evidência de runtime)**
- npx tsc --noEmit: 0 erros [C].
- npm run build: sucesso (nitro/Cloudflare, ~5,3 s no bundle Vite) [C].
- npx vitest run: 33 testes / 6 arquivos, todos verdes [C]. O runner exigiu sandbox elevado porque o Vite usa spawn no Windows (EPERM); não é falha do projeto.
- npx eslint .: 5.054 problemas (5.031 erros, 23 avisos), dos quais 5.025 são formatação Prettier auto-corrigível; só 7 erros substantivos (6 any, 1 prefer-const) [C].

**Não verificado (e por que isso importa)**
- Banco remoto oyfqecigqrceijoxggqw: RLS, FKs, buckets, triggers e policies das 9 tabelas sem migração [NV]. É o maior bloqueio de auditoria.
- Edge Functions ai-gateway e stripe-checkout/webhook: não estão neste repo [NV] — toda a quota real, consentimento no servidor, custo e ai_runs estão lá.
- Stripe live, conta de anúncios, hospedagem em produção, logs [NV].
- App mobile em ../AURA-ECOSSISTEMA (fora do workspace; consultado só para conferir billing/versão) [NV].

**O que isso significa:** o diagnóstico de produto, dados e UX é de alta confiança; o de segurança de banco e de receita real é de média confiança até os testes de §8.

---

## 0. VEREDITO EM 10 LINHAS (a conversa que teríamos hoje)

1. O produto existe de verdade e é amplo: 63 páginas, 6 módulos (maquiagem, cabelo, roupas, tatuagem, barba, estética), jornada, rede de profissionais, catálogo, assinatura — build e testes passam. Isso é raro e é ativo.
2. Ele ainda não está vendável com segurança: exclusão de conta incompleta, foto privada compartilhada com terceiro sem consentimento específico, 9 tabelas sem migração/RLS auditável, service_role ausente no .env, consentimento de IA furado em 6 rotas.
3. Não há como aprender: zero analytics, zero monitoramento de erro em produção, zero funil instrumentado. Sem isso, nenhuma decisão de GTM é falsificável.
4. A documentação de GTM está um ciclo atrás do produto: ela descreve pré-lançamento/lista de espera; o código já tem Stripe e 6 módulos. Preços, público e promessa se contradizem (R$ 19,90/49,90 no código × R$ 39,90/299,90 nos docs mobile × "preço não definido" no GTM).
5. O diferencial defensável não é "mais um app de beleza": é medir + simular + briefing para o profissional e a rede de profissionais — mas a estética é justamente o módulo com maior risco regulatório e está fora de todos os docs de campanha.
6. O gargalo é ativação, não aquisição: 4–7 passos até o primeiro valor, 5 mini-onboardings duplicados, menu que esconde módulos ("Agora não" nas trilhas), 9 superfícies de geração.
7. A decisão certa é congelar features por 6 semanas e fazer três coisas: blindar confiança, instrumentar o funil e rodar um beta fechado de 20–30 pessoas num nicho só.
8. Nicho inicial recomendado: mulheres 25–34 em transição/reposicionamento profissional (a escolha mais defensável de MQ2), com o caso de uso "entrevista/promoção/evento" e o output "briefing para o salão".
9. Receita: manter Pass R$ 19,90/mês (com anual) e Pro R$ 49,90/mês; não criar SKUs, créditos ou planos novos antes de 100 ativações e 20 pagantes.
10. Se a ferramenta fosse nossa, o próximo passo não é construir: é provar, com 30 pessoas reais e dados, que ela entrega valor em <10 minutos e que alguém paga. O resto é dispersão.

---

## 1. DIAGNÓSTICO

### 1.1 Mapa funcional e técnico (inventário com objetivo, usuário, criticidade e dependências)

**Camadas e números**

| Camada | O que existe | Números | Evidência |
|---|---|---|---|
| Interface | TanStack Start + React 19 + shadcn/Tailwind 4, PT-BR hard-coded | 63 páginas + 7 layouts; 60 autenticadas, 3 públicas | src/routes; src/routeTree.gen.ts |
| API interna | Server functions createServerFn com zod | 83 funções em 19 arquivos: 81 autenticadas, 2 públicas | src/lib/*.functions.ts |
| Dados | Supabase Postgres, RLS por auth.uid() | 46 tabelas nos tipos; 37 com migração; 9 sem migração; 2 tabelas core.* lidas por REST | types.ts; drizzle/migrations/* |
| IA | Gateway próprio (Edge Function) para texto/visão/imagem | 10 task_id (2 texto/visão + 8 imagem); sem timeout/retry no webapp | ai.server.ts:10,53,59; image-gateway.aura.server.ts |
| Storage | Bucket privado user-photos + público studio-media | 20+ createSignedUrl; policies RESTRICTIVE para tatuagem e referência | 0000:38-40, 0005:21, 0007:20 |
| Billing | Stripe Checkout + Portal; entitlement lido de core.entitlements | Pass R$ 19,90/mês; Pro R$ 49,90/mês | stripe.functions.ts:12-18 |
| Auth | Supabase Auth (e-mail/senha + Google) | Gate exige consent + perfil completo; ssr:false | _authenticated/route.tsx:8-24 |
| Observabilidade | audit_events (forjável pelo cliente), console.error, hooks do Lovable (só no preview) | 0 analytics, 0 Sentry/PostHog | aura.ts:89-93; lovable-error-reporting.ts:27-51 |
| Qualidade | Vitest + ESLint + Prettier | 33 testes; 5.054 problemas de lint (99% Prettier) | src/test/*; comandos executados |

**Módulos e fluxos (objetivo → usuário → criticidade → dependência)**

| Módulo/superfície | Objetivo | Usuário afetado | Estado | Criticidade | Dependências |
|---|---|---|---|---|---|
| /studio + /dashboard + /package/$id | Gerar pacotes integrados com 3 intensidades | Pessoa em exploração visual | Parcial: gera sem kind; redirects invisíveis; sem quota | P0 ativação | IA texto, packages, consent |
| Onboarding (/onboarding) | Perfil visual com autosave/retomada | Todo novo usuário | Pronto, porém 9 etapas e 5 perfis duplicados | P0 ativação | visual_profiles, ajuda IA |
| DNA Visual (/dna/*) | Resumo editável, permissões, versões, export | Usuário recorrente | Pronto e bem-feito; 6 telas | P1 | visual_dna, dna_versions, consents |
| Maquiagem (/maquiagem/*) | Looks, perfil de pele, assinatura, kits, manual | Público beleza | Parcial: sem quota, JSON cru como editor, manual quebra sem erro | P1 | packages kind=makeup_look, makeup_* |
| Cabelo (/cabelo/*) | Planos, alertas, guia de salão | Público beleza/transição | Parcial: status sem checar erro, alertas sem confirmação | P1 | hair_*, packages kind=hair_plan |
| Roupas (/roupas/*) | Looks, armário, lacunas, compra, missões | Público estilo | Parcial: 7 abas, estados sem erro, export quebra | P1 | style_*, wardrobe_items, style_analyses |
| Tatuagem (/tatuagem/*) + vitrine | Projetos, referências, briefing, stencil, estúdios | Público tatuagem | Parcial/robusto: 7 abas, confirm obrigatória no briefing; exclusões sem confirmar | P1 | tattoo_*, tattoo_designs (sem migração) |
| Barba (/barba) | Perfil, 6 estilos, provar, briefing | Público masculino | Parcial: DNA nunca usado por default; path fixo de foto | P2 | beard_profiles, packages |
| Estética (/estetica) | Medir simetria, simular, briefing, jornada | Público procedimentos | Parcial/risco: fora de docs; sem consent no handler; tabelas sem migração | P0 legal | IA visão/imagem, estetica_* |
| Jornada (/jornada/*) | Planos, reflexões, fotos, relatórios | Usuário de transformação | Parcial: plano pode nascer vazio; 3 telas de leitura | P2 | journey_* |
| Profissionais (/profissionais, /p/$slug) | Rede, briefing, orçamento, IA do profissional, vitrine | Cliente + profissional | Órfão na navegação; 2 personas; Pro paywall | P0 distribuição | professionals, briefing_* (sem migração) |
| Catálogo/admin (/admin) | CRUD parceiro + CSV | Admin (Felipe) | Funcional; jargão de build exposto | P2 | partner_stores, products (sem migração) |
| Aura Pass (/aura-pass) | Assinatura e portal | Pagante | Parcial: copy contradiz backend; sem retry de verificação | P0 receita | Stripe, core.entitlements |
| Auth/consent | Entrada e consentimento | Todos | Pronto (sem "esqueci senha" nem termos) | P1 | Supabase Auth |

**Contratos, eventos e extensibilidade**
- Contratos: 83 server functions com zod plano; erro por {error} (UI) ou throw (muitos). 81 autenticadas; 2 públicas (enviarFeedback, perfilProfissional). Só 2 usam service_role (deleteAccount, adminStats).
- Eventos: audit_events com ~28 nomes (ex.: package_generated, consent_changed, reference_generated, plan_exported); chamado de server e de ~40 pontos do navegador. Não é trilha de auditoria confiável (insert permitido ao próprio usuário, sem hash, sem retenção).
- Pontos de extensão reais: packages.kind (look, makeup_look, hair_plan, outfit, tattoo_plan, beard_plan), style_analyses.kind (gaps, purchase, missions), module_permissions, generated_references.slot, catálogos (product_catalog, hair_catalog, hair_rules, dress_code_rules), tasks do gateway.
- Dependências externas: Supabase (auth/db/storage/edge functions), gateway ai-gateway + fal.ai/FLUX/Kontext, Stripe, BrasilAPI (CEP), Google OAuth, Lovable (sync do repo/hosting). 12 ocorrências da URL do projeto hardcoded em 10 arquivos [C].
- Configuração: .env só tem URL e publishable key; faltam SUPABASE_SERVICE_ROLE_KEY e LOVABLE_API_KEY; supabase/config.toml aponta para o projeto antigo bdlvmiillyqtkcqxmcng [C]; drizzle/schema.ts vazio e snapshots "tables": {} [C].

### 1.2 Problemas priorizados (evidência → causa → impacto → consequência)

#### P0 — confiança, legal e integridade (resolver antes de vender)

| # | Problema | Evidência | Causa provável | Impacto | Consequência de não resolver |
|---|---|---|---|---|---|
| P0-1 | Exclusão de conta incompleta e não transacional: 26 tabelas apagadas em loop, 12 com vínculo de usuário ficam de fora (hair_profiles, hair_alerts, style_profiles, wardrobe_items, style_analyses, professionals, tattoo_designs, briefing_sends, briefing_suggestions, estetica_jornada, estetica_registro, feedback_aura); sem FK para auth.users; falha no meio deixa estado parcial | aura.functions.ts:152-169; drizzle/migrations/0000:8-17 | lista manual que cresceu sem manutenção | Violação de LGPD, dados órfãos, risco de reclamação/ANPD | Passivo legal e de reputação; "excluir tudo" é falso (settings.tsx:121) |
| P0-2 | Foto privada vira URL assinada de 30 dias e é enviada a terceiro sem consentimento específico, enquanto a UI diz "Só você vê" | EnviarBriefing.tsx:49-52; PhotoUploader.tsx:49; p.$slug.tsx:80 | compartilhamento tratado como detalhe de fluxo | Quebra de confiança e de base legal (finalidade específica) | Risco jurídico e viral negativo no nicho |
| P0-3 | 9 tabelas em uso sem migração/RLS versionada (profissionais, briefings, catálogo, vitrine, estética, feedback); addRegistro/atualizarJornada/excluirJornada não filtram dono | types.ts:17-101; estetica.functions.ts:166,186,195 | módulos entregues direto no remoto | Possível IDOR em diário íntimo + fotos; segurança não auditável | Incidente de privacidade e impossibilidade de reproduzir ambiente |
| P0-4 | service_role ausente no .env: deleteAccount e adminStats falham em runtime | client.server.ts:36-44; .env (4 linhas) | migração Lovable→aura-id não incluiu segredo | Exclusão de conta e admin quebram na prática | P0-1 fica pior: nem a exclusão parcial roda |
| P0-5 | Consentimento de IA/foto não verificado em 6 handlers de imagem que aceitam URL do cliente (estetica, retrato, modelo.gerarModelo, provarPeca, copiarDesign, sugerirComIA); única validação de host no arquivo morto | estetica.functions.ts:28-98; image-gateway.server.ts:7-14 (sem imports) | centralização no gateway | Se o gateway mudar, não há freio; URL arbitrária pode virar proxy de edição | Abuso de custo e de imagem de terceiros |
| P0-6 | Contagem de grátis contraditória (18 no backend, "5" na UI, "40" no plano) e Pass não é consultado em nenhum handler | uso.functions.ts:11-18; aura-pass.tsx:83,88; PLANO-IMAGEM-PRO.md:78; stripe.functions.ts | quota vive na UI + gateway | Suporte perde credibilidade; conversão e receita imprevisíveis | Reembolso, churn e reviews negativos |
| P0-7 | Zero analytics e zero monitoramento de erro em produção; lovable-error-reporting é no-op fora do preview | grep = 0; lovable-error-reporting.ts:27-51 | produto construído antes da instrumentação | Nenhuma decisão de funil, preço ou canal é falsificável | Crescimento por intuição = queima de caixa |
| P0-8 | Jargão de build na cara do usuário: "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" em 6 lugares, inclusive landing pública | index.tsx:65; maquiagem/route.tsx:26; cabelo/route.tsx:23; roupas/route.tsx:26; tatuagem/route.tsx:5; admin.tsx:23 | nota de desenvolvimento não removida | Primeira impressão amadora; contradiz o hero | Perda de conversão e de confiança |

#### P1 — ativação, clareza e receita

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| P1-1 | "Agora não" no seletor de trilhas esconde maquiagem/cabelo/roupas/tatuagem/jornada; /profissionais é inalcançável pelo menu | TrilhaPicker.tsx:55; trilhas.ts:93-96; EnviarBriefing.tsx:54 | Usuário não encontra o produto; ativação desaba |
| P1-2 | Estúdio gera pacotes sem kind → não aparecem nas abas do módulo; redirects invisíveis (barba/maquiagem) | aura.functions.ts:92-95; studio.tsx:38-39,94 | Sensação de "sumiu minha geração" |
| P1-3 | 5 mini-onboardings repetem o wizard principal; 9 etapas para mudar 1 toggle depois | onboarding.ts:67-114; maquiagem/perfil; cabelo/perfil; roupas/perfil; beard; tattoo | Tempo até valor alto; abandono |
| P1-4 | 9 superfícies de geração sem componente compartilhado; erros silenciosos; 6 ações destrutivas sem confirmação; 3 window.confirm | auditoria 02 §3.2/§3.4 | Inconsistência e perda de trabalho |
| P1-5 | Export "Baixar todas" quebra com look de roupa/plano de cabelo (template de AuraPackage); "Aprovar" registra look_saved | export.tsx:9,22; aura.ts:108-114; clothing.ts:9-13; hair.ts:30-36; maquiagem/look.$id.tsx:102 | Suporte e desconfiança |
| P1-6 | Preço duplicado: Pro R$ 49,90 tem paywall fora do /aura-pass; preço de guia hardcoded; sem "verificar novamente" após checkout | profissionais.tsx:180-193; guia.tsx:36; aura-pass.tsx:23-27,58-90 | Conversão e suporte |
| P1-7 | Promessas do guia que o app não cumpre globalmente ("Entendi assim" em tudo, contador em tudo, "usar meu modelo" em todo gerador) | guia.tsx:24,30,31 vs ReferenceImage/QuotaChip | Decepção e tickets |
| P1-8 | Header com ~20 alvos em scroll horizontal, contraste 3,06:1 no CTA accent, 14 textos de 10–11 px, exclusão de foto só no hover | route.tsx:47-64; styles.css:66-67; PhotoUploader.tsx:60 | Acessibilidade e mobile |
| P1-9 | Estética com 4 chamadas de IA por sessão sem quota visível e task fora de LIMITES | estetica.tsx:63,77,102; estetica.functions.ts:70; uso.functions.ts:11-18 | Custo e expectativa |
| P1-10 | /auth sem "esqueci senha", sem reenvio de confirmação; sem página de privacidade/termos | auth.tsx:63-81; grep = 0 | Suporte e LGPD |

#### P2 — oportunidade, dívida e manutenção

| # | Problema | Evidência | Observação |
|---|---|---|---|
| P2-1 | Documentação duplicada (~900 KB; 12 de 13 arquivos idênticos entre Notas/ e Publicidade-Propaganda/; FAROL 3×) | auditoria 03 §0 | Risco de editar a cópia errada |
| P2-2 | 12 ocorrências da URL do projeto hardcoded em 10 arquivos; config.toml divergente; drizzle.config aponta env inexistente | grep; supabase/config.toml:1; drizzle.config.ts:8 | Trocar de projeto exige 12 edições |
| P2-3 | drizzle/schema.ts vazio + snapshots vazios; migrações SQL manuais | schema.ts:1; meta/*.json | drizzle-kit generate pode propor DROP de tudo |
| P2-4 | Código morto: image-gateway.server.ts (Lovable/IA antiga), makeAvatar, 9 componentes ui/ sem uso, cron-auth.ts sem chamadas | grep = 0 imports | Confusão e superfície de risco |
| P2-5 | Sem testes de RLS/server functions/quota; 33 testes cobrem lógica pura e rotas | src/test/* | Regressões de segurança invisíveis |
| P2-6 | Sem índices em packages(user_id), photos(user_id), audit_events(created_at); sem CHECK de domínio | 0000 | Performance e integridade |
| P2-7 | audit_events forjável; feedback anônimo sem rate limit; adminStats reporta IA por chave errada | aura.ts:89-93; feedback.functions.ts:21-46; aura.functions.ts:192 | Auditoria e abuso |
| P2-8 | Prettier/Lint: 5.025 correções automáticas pendentes; 7 erros reais | eslint | Ruído que esconde regressão |

### 1.3 O que está pronto, parcial, ausente e quebrado (e o impacto por métrica)

**Pronto (usar como base, não reescrever):** consentimento e gate; onboarding com autosave/retomada; DNA Visual (resumo, correções, permissões, versões, exclusão granular); retrato com confirmação→edição→verificação→retry; modelo pessoal com consent próprio; briefing de tatuagem com confirmação obrigatória; configurações com exclusões granulares; Aura Pass com estados de sucesso/cancelamento; stencil determinístico no navegador.

**Parcial:** todos os 6 módulos (geram e salvam, mas sem quota/erro/estado consistente), rede de profissionais (funciona, mas órfã na navegação), catálogo/admin (funciona, sem parceiros), jornada (planos vazios), estética (funciona, sem consent/RLS versionada).

**Ausente:** analytics/funil; LP de campanha/waitlist; política de privacidade/termos; recuperação de senha; central de notificações/atividade; busca/filtro em listas; onboarding leve pós-cadastro; monitoramento de erro; testes de RLS/quota; termos de consentimento específicos para compartilhamento e dados sensíveis.

**Quebrado (alta confiança):** exclusão de conta incompleta; export em lote para outfit/hair; geração do Estúdio sem kind; menu "Agora não"; quota do Pass contraditória; manual de maquiagem que quebra sem erro; modelo com upsert sem policy de UPDATE [I].

| Métrica | O que mais machuca hoje | Efeito esperado |
|---|---|---|
| Ativação (primeiro valor) | 4–7 passos até o primeiro resultado; wizard longo; menu que esconde módulos; sem contador de limite | Usuário não chega ao "aha"; CAC sobe |
| Retenção | Sem notificação; geração do Estúdio não aparece no módulo; /profissionais invisível; jornada que não gera relatório | D7/D30 baixos; churn silencioso |
| Vendas | Copy contraditória; duas ofertas; sem prova; sem analytics de paywall | Conversão desconhecida; preço não testável |
| Suporte | "sumiu minha geração"; quota falsa; export quebrado; foto compartilhada | Tickets altos por usuário |
| Receita | Pass não aplicado no webapp [I]; sem trial/anual/cupom; sem evento de pagamento | MRR imprevisível |
| Manutenção | Schema sem fonte de verdade; 12 URLs hardcoded; duplicações; lint | Custo de mudança alto |

### 1.4 Riscos priorizados (impacto × esforço × retorno × urgência × dependência × risco)

Escala 1–5; quanto maior, pior para esforço/dependência/risco e melhor para impacto/retorno/urgência. Ordem = prioridade de execução.

| Ordem | Risco | Impacto | Esforço | Retorno | Urgência | Dependência | Risco | Total |
|---|---|---|---|---|---|---|---|---|
| 1 | Segurança: RLS não versionada / IDOR estética / consentimento de IA furado | 5 | 3 | 4 | 5 | 3 | 5 | 25 |
| 2 | LGPD: exclusão incompleta + foto compartilhada sem consentimento | 5 | 2 | 5 | 5 | 1 | 5 | 23 |
| 3 | Falta de analytics/funil → decisões cegas | 5 | 2 | 5 | 5 | 2 | 3 | 22 |
| 4 | Custo de IA sem freio (texto ilimitado, sem timeout, sem rate limit) | 4 | 2 | 4 | 5 | 2 | 4 | 21 |
| 5 | Regulatório estética/CFM + promessa de simulação | 4 | 3 | 2 | 3 | 4 | 5 | 21 |
| 6 | App mobile não publicado / fora do repo | 3 | 5 | 2 | 2 | 5 | 4 | 21 |
| 7 | Quota/preço inconsistentes e Pass não aplicado | 4 | 2 | 5 | 4 | 2 | 3 | 20 |
| 8 | Rede de profissionais órfã e sem supply | 4 | 3 | 4 | 3 | 3 | 3 | 20 |
| 9 | Ativação (menu/onboarding/kind) | 5 | 2 | 5 | 4 | 1 | 2 | 19 |
| 10 | Dependência de Lovable/Supabase antigo + URLs hardcoded | 3 | 2 | 3 | 3 | 2 | 3 | 16 |
| 11 | Copy/jargão + promessas não cumpridas | 4 | 1 | 4 | 4 | 1 | 1 | 15 |
| 12 | Documentação duplicada e planos vencidos | 2 | 1 | 3 | 2 | 1 | 1 | 10 |

**Critério de aceite global do diagnóstico:** toda afirmação P0 tem arquivo:linha; todo P0 tem teste de aceite em §2.1; toda divergência tem teste em §8; toda suposição tem validação em §9.

---

## 2. PRODUTO

### 2.1 Correções que impedem uso confiável (especificação executável)

> Cada item tem mudança, critério de aceite e evidência. São a base do Sprint 0.

**C1. Exclusão de conta atômica e completa**
- Mudança: mover a exclusão para uma função/RPC transacional (ou Edge Function) que (a) apague storage por prefixo {userId}/ em user-photos e studio-media; (b) apague todas as 38 tabelas com user_id (gerar a lista a partir de information_schema, não à mão); (c) apague auth.users; (d) se falhar, faça rollback e devolva erro claro. Remover a duplicação em settings.tsx:55-69.
- Aceite: criar 2 contas, gerar dados em todos os módulos, excluir A; select count(*) em cada tabela = 0; storage sem objetos; login de A falha; B intacto. Falha simulada no meio → nenhum dado perdido.
- Evidência: aura.functions.ts:152-169; types.ts (46 tabelas).

**C2. Consentimento específico para compartilhar foto com profissional**
- Mudança: antes de enviar briefing, mostrar "Sua foto será compartilhada com [nome] por 30 dias" com checkbox; gravar consent_share_professional=true, professional_id, expires_at; URL assinada de 24h (renovável) em vez de 30 dias; remover "Só você vê" onde não for verdade; botão "revogar compartilhamento".
- Aceite: envio sem checkbox bloqueado; registro em consents/auditoria; URL expira em 24h; revogação invalida; texto da UI coerente em PhotoUploader e p.$slug.
- Evidência: EnviarBriefing.tsx:49-52; profissionais.functions.ts:45-54.

**C3. Versionar as 9 tabelas ausentes + RLS testada**
- Mudança: supabase db dump --schema public → migração 0008; adicionar policies explícitas para professionals, briefing_sends, briefing_suggestions, tattoo_designs, partner_stores, products, feedback_aura, estetica_jornada, estetica_registro; teste SQL com 2 usuários provando isolamento (e leitura pública só do que é público).
- Aceite: supabase db diff = vazio; teste de 2 usuários passa; addRegistro/atualizarJornada/excluirJornada falham para não-dono mesmo se chamados direto; /p/{slug} só lê ativo/público.
- Evidência: types.ts:17-101; estetica.functions.ts:158-198.

**C4. Credenciais e ambiente coerentes**
- Mudança: SUPABASE_SERVICE_ROLE_KEY no cofre de secrets do hosting (nunca no repo); validação no boot que falha cedo; supabase/config.toml = projeto aura-id; extrair URL do projeto para SUPABASE_URL em todas as 12 ocorrências; remover image-gateway.server.ts e makeAvatar; migrar avatar para o gateway.
- Aceite: deleteAccount e adminStats funcionam no preview e em produção; generateAvatar funciona pelo gateway; grep por a URL hardcoded fora de .env = 0; supabase status aponta aura-id.

**C5. Consentimento central + validação de URL de imagem**
- Mudança: helper requireConsent(supabase, userId, scope) usado em todos os handlers de imagem/visão; validar imageUrl como signed URL do próprio storage (host + prefixo {userId}/) ou rejeitar; nunca repassar URL externa ao provedor; validar foto_url do briefing e imagem_url da vitrine.
- Aceite: chamar analisarSimetria com URL externa → 400; sem image_generation → 403; com consent → 200; teste unitário por handler.
- Evidência: estetica.functions.ts:28-98; retrato.functions.ts:48-84; modelo.functions.ts:33-54; catalogo.functions.ts:53-81; vitrine.functions.ts:105-137; profissionais.functions.ts:57-82.

**C6. Quota única, aplicada e visível**
- Mudança: fonte única de limites (tabela plan_limits ou config do gateway exposta por endpoint), com imagens por task, cota para texto, janela mensal, e Pass/Pro lidos de core.entitlements no servidor. A UI lê o mesmo endpoint. Substituir "5 imagens" por "X de Y grátis neste mês". Adicionar rate limit por usuário e timeout/AbortSignal nas chamadas.
- Aceite: usuário novo vê o mesmo número na UI e no 402; 6ª geração de referência bloqueia; 3 chamadas de texto em sequência não estouram o limite definido; Pass libera na hora; evento paywall_viewed registrado.
- Evidência: uso.functions.ts:11-18; aura-pass.tsx:83,88; PLANO-IMAGEM-PRO.md:78.

**C7. Instrumentação e observabilidade**
- Mudança: analytics privacy-first (PostHog Cloud UE ou tabela product_events com escrita server-side), 12 eventos canônicos; Sentry (ou similar) no cliente e no servidor; painel de funil; alerta de erro 5xx e de 402/429.
- Aceite: cada evento aparece no painel com user_id/anon id, rota e timestamp; erro forçado chega em <1 min; funil visit→signup→consent→onboarding→primeira geração→primeiro salvo→D7 visível.
- Evidência: grep de analytics = 0; lovable-error-reporting.ts:27-51.

**C8. Copy e confiança**
- Mudança: remover as 6 ocorrências de jargão; corrigir "5 gratuitas"; alinhar guia ao que existe; link para Termos/Privacidade (criar 2 páginas); "esqueci senha"/reenvio; confirmar 6 ações destrutivas; unificar "convite/ideia/plano" num glossário.
- Aceite: grep por "LOVABLE" na UI = 0; todo CTA primário com contraste ≥4,5:1; 0 ações destrutivas sem confirmação; guia 100% verdadeiro.

### 2.2 Eliminar redundâncias e simplificar navegação, configuração e linguagem

**Navegação (uma barra, três níveis)**
- Nível 1: Hoje (dashboard com próximo passo + último resultado), Criar (geração), Meus resultados (biblioteca/coleções/export), Profissionais, DNA, Conta. Máximo 6 itens; nada escondido.
- Nível 2: abas do módulo escolhido; "Ver todos os módulos" sempre visível no TrilhaPicker e no menu. Eliminar o "Agora não" sem saída (ou o botão passa a significar "mostrar todos").
- Nível 3: detalhe (plano/look/conceito) com um CTA primário ("usar este", "salvar", "compartilhar briefing") e um secundário ("ajustar").
- Remover o seletor de trilhas como gate: ele vira filtro opcional (default: tudo visível). Isso resolve P1-1 sem custo de produto.
- Aceite: usuário novo chega a qualquer módulo em ≤2 cliques; nenhuma tela sem próximo passo; 0 links duplicados no menu.

**Uma porta de criação**
- Consolidar as 9 superfícies em um fluxo "Criar": escolher módulo → 3 perguntas contextuais → cartão "Entendi assim" → gerar → 3 intensidades → salvar/compartilhar. As páginas de módulo passam a ser biblioteca + perfil, não geradores duplicados.
- Componente único GenerationShell (quota, estados, erro, retry, paywall) — hoje ReferenceImage é um god component de 329 linhas usado em 6 telas.
- Aceite: uma geração de cabelo feita em "Criar" aparece em "Meus resultados" com kind=hair_plan; quota visível em todas; erro com "tentar novamente" + código de suporte.

**Perfil progressivo (fim dos 5 mini-onboardings)**
- Onboarding inicial: 5 perguntas essenciais (apresentação, faixa de altura/tamanhos, tom de pele, orçamento, objetivo do momento) → primeiro resultado. O resto entra contextual, no primeiro uso de cada módulo, com prefill do que já existe.
- Aceite: primeiro resultado em ≤5 minutos; perfil de maquiagem/cabelo/roupas só pergunta o que falta; nenhuma pergunta repetida em 2 telas.

**Linguagem**
- Glossário único: "sugestão" (objeto), "plano" (módulos), "briefing" (documento para profissional), "DNA Visual" (resumo), "intensidade" (segura/intermediária/ousada).
- Substituir "pacote/convite/look/conceito/versão" por 2 termos no máximo; remover "Reversibilidade" do badge (explicar em texto).
- Aceite: revisão de copy com 5 usuários; nenhum termo interno de build.

### 2.3 Onboarding, primeiros resultados, templates, ajuda, importação/exportação, governança

**Fluxo de primeiros 5 minutos (novo)**
1. Cadastro/consentimento (1 tela, 3 switches, texto claro).
2. 5 perguntas essenciais (com "não sei" e sugestão).
3. Resultado imediato sem foto: "3 caminhos para [objetivo]" com uma imagem-conceito opcional.
4. Oferta de "meu modelo" (opcional) para ver em você.
5. Salvar/compartilhar: "briefing para o salão" ou "link de coleção".
- Métrica: TTFV ≤ 10 min e ≥70% completam o passo 3.

**Templates prontos (publicar dentro do app)**
- 8 modelos de 1 clique: Entrevista em 7 dias; Casamento ao ar livre; Transição capilar sem susto; Rotina de 10 minutos; Barba: 6 estilos; Primeira tatuagem pequena; Cápsula de 12 peças; Guarda-roupa de trabalho.
- Cada template: objetivo, perguntas pré-preenchidas, exemplo de saída, critério de sucesso. Usar como prova no beta.

**Ajuda contextual e documentação**
- 6 artigos: como tirar foto; como funciona a quota; como usar o briefing; privacidade e exclusão; o que é DNA; como cancelar.
- Ajuda por campo (já existe HelpChat) — manter e medir uso.
- Governança de conteúdo: prompts versionados em repo (+ changelog), safety_config revisado mensalmente, checklist de claims (SOL08 B.2) obrigatório antes de publicar copy, e revisão de privacidade a cada release.

**Importação/exportação**
- Já existe importador CSV de catálogo e export JSON/MD. Adicionar: export PDF do briefing; export CSV de uso (admin); "revogar compartilhamentos"; backup semanal do banco (Supabase PITR ou pg_dump agendado).
- Aceite: export de outfit/hair não quebra; export de tatuagem continua exigindo confirmação por briefing; JSON do titular inclui todas as tabelas (não 12).

**Padrões transversais (erro, permissão, convite, versão, recuperação)**
- <AsyncState> (loading/vazio/erro/sucesso) e <DestructiveConfirm> obrigatórios; toast padronizado com ação "desfazer" onde possível; códigos de erro amigáveis; log server-side de todo 5xx; versionamento de conteúdo (já em dna_versions e packages.context.brief_confirmado) estendido a templates; convites para profissionais com estado (enviado/aceito/expirado).

### 2.4 Exemplos práticos (para colocar no produto e no material de venda)

1. Automação simples — "meu domingo de 10 minutos": usuária define objetivo "semana de trabalho"; toda sexta o app gera 3 looks e 1 lembrete no app; ela salva 1. Aceite: 1 clique, <2 min, aparece em "Hoje".
2. Dashboard inicial: "Hoje" mostra 1 próximo passo, 1 resultado recente, 1 sugestão de 5 min, quota e link para o último briefing. Aceite: usuário novo entende o que fazer sem tutorial.
3. Caso por perfil: Ana, 29, entrevista em 5 dias: onboarding 5 perguntas → 3 caminhos → "briefing para o salão" com perguntas e o que evitar → export PDF. Aceite: TTFV < 10 min e briefing utilizável.
4. Modelo pronto para publicar: "Cápsula de 12 peças" com lista, custo por uso e link de catálogo; publicável como coleção compartilhável. Aceite: 1 link, sem dados pessoais, revogável.
5. Fluxo com permissões: DNA ligado → módulo de maquiagem desligado → gerar look não usa DNA; usuária liga → próximo look usa; auditoria mostra dna_used. Aceite: 3 estados testados com 2 usuários.
6. Cenário de erro controlado: gateway retorna 429 → UI mostra "muitas solicitações, tente em 2 min" + botão "tentar novamente" + não consome quota; evento registrado. Aceite: teste com mock; nenhum estado perdido.
7. Importação de dados: CSV de 50 peças → preview → importa 47, pula 3 duplicadas, mostra relatório; admin corrige 1 e reimporta. Aceite: idempotência por URL; relatório de erros.
8. Template de governança: checklist de release (prompts versionados, claims revisados, RLS testada, exclusão testada, analytics ok) assinado por você antes de cada deploy. Aceite: 1 página, usada em 2 releases.
9. Valor imediato sem configurar nada: "Teste sua próxima versão" — 3 imagens-conceito + 3 passos práticos, sem foto, sem perfil completo. Aceite: visitante logado vê resultado em <3 min.

**Critérios de aceite de produto (globais):** ativação rápida (≤10 min); menos suporte (todo erro com saída); retenção (notificação/lembrete e "hoje"); valor evidente em poucos minutos (resultado antes de perfil completo); decisão de compra óbvia (1 preço, 1 promessa, prova); previsível entre perfis (mesmo shell, mesmos estados); redução de tarefas manuais (templates/automações); segurança auditável (testes de RLS/exclusão); aumento de reuso (coleções/briefings/templates).

---

## 3. DISTRIBUIÇÃO E VENDAS

### 3.1 Público, proposta de valor, dores, objeções, nichos e fit

**Público inicial (decisão recomendada):** mulheres 25–34 anos, em transição ou reposicionamento profissional (nova função, entrevista, promoção, retorno ao mercado, mudança de cidade/área), classe B2/C1, renda domiciliar ~R$ 2,9–10 mil/mês [I, MQ2 l. 45,56], gasto atual com beleza/estilo R$ 80–500/mês [I]. Por quê: dor com prazo (evento), disposição a pagar, ciclo curto, alto volume de busca ("o que vestir na entrevista", "como mudar o cabelo sem me arrepender") e o produto já cobre cabelo+maquiagem+roupas+briefing.
**Nichos secundários (depois):** homens/barbearia (já implementado; canal barbeiro); noivas/formandas (evento); tatuagem consciente (intenção alta, mas ciclo longo e regulatório); profissionais de beleza (Pro, supply).

**Proposta de valor (uma frase):** "Teste sua próxima versão antes de mudar — com contexto, três intensidades e um briefing pronto para levar ao salão."
**Diferenciais reais:** (1) contexto + 3 intensidades + linguagem sem julgamento; (2) briefing que sai do app e vira ação no salão/estúdio; (3) rede de profissionais + vitrine; (4) medir+simular+briefing (estética) — poderoso, mas fora de campanha até revisão legal.
**Dores (VOC dos docs):** "quero mudar sem assustar", "tenho medo de cortar curto", "quero parecer profissional sem perder autenticidade", "não sei o que combina", "quero testar antes de decidir".
**Objeções e respostas:**
- "A IA vai dizer que preciso mudar?" → "Não medimos beleza; propomos experimentos que você pode ignorar."
- "Tenho medo de parecer outra pessoa." → "3 intensidades; você escolhe; a identidade é preservada."
- "Isso julga meu corpo?" → "Nunca; silhueta é conforto/comunicação, não correção."
- "Já uso Pinterest/consultoria." → "Pinterest não conhece seu orçamento/rotina; consultoria é cara e pontual. A Aura lembra de você e entrega briefing."
- "Preciso mandar foto?" → "Não para começar; foto é opcional e privada."
- "Vai substituir profissionais?" → "Não: conecta você a eles com briefing melhor."
- "É pago?" → "Grátis para começar; Pass para mais gerações; Pro para profissionais."
**Critérios de qualificação:** tem evento/prazo em ≤90 dias; já gastou com beleza/estilo; usa Instagram/Pinterest; dor declarada de "não sei o que combina"; aceita testar com foto opcional. **Sinais de fit:** salva 2+ resultados, compartilha briefing, volta em 7 dias.

### 3.2 Landing, demonstração, tutoriais, comparativos, depoimentos, FAQ, docs, templates, teste e ativação

**Landing (nova, 1 página, 1 CTA):**
- H1: "Teste sua próxima versão antes de mudar." Sub: "Cabelo, maquiagem e roupas com o seu contexto — em três intensidades e com briefing para o profissional."
- Prova: 3 antes/depois autorizados + 2 depoimentos reais do beta (nome, cidade, foto opcional).
- Como funciona em 3 passos com captura de tela real (não mockup de IA).
- Oferta: grátis com limite claro + Pass R$ 19,90/mês (anual R$ 149,90) + Pro R$ 49,90.
- FAQ com as 10 objeções acima; link para privacidade/termos.
- CTA primário: "Entrar no beta" (formulário de 4 campos) enquanto não houver analytics; depois "Começar grátis" direto para /auth.
- Não repetir promessas de AR/vídeo/ultra-realismo; não usar "fora do escopo".

**Demonstração:** vídeo de 90 s com uma usuária real (ou você) fazendo o fluxo de 5 min; demo guiada de 15 min para beta; "teste você mesma" com perfil de exemplo.

**Tutoriais/FAQ/docs:** 6 artigos + 4 vídeos curtos (foto, quota, briefing, privacidade); página de comparação honesta com Pinterest, consultoria de imagem, apps de beleza e ChatGPT; glossário.

**Templates de venda:** one-pager por persona (transição profissional, evento, barbearia); 3 cases; script de DM; e-mail de convite; roteiro de call de 15 min; checklist de onboarding concierge.

**Teste gratuito e ativação:** grátis com limite real e contador; sem cartão; "beta fundador" com 30 vagas e desconto anual (se decidir); onboarding concierge nos 10 primeiros.

### 3.3 Canais: hipótese, experimento, custo, prazo, indicador e critério de decisão

| Canal | Público | Hipótese | Experimento (30–60d) | Custo estimado | Prazo | Indicador de sucesso | Continuar / ajustar / parar |
|---|---|---|---|---|---|---|---|
| Recrutamento manual (DM/communities) | 25–34 em transição | 10 conversas geram 5 beta ativos | 50 DMs/semana em 3 comunidades (LinkedIn, grupos de carreira, Instagram) | R$ 0 (tempo) | 2 sem | 10 beta, 5 sessões, TTFV | Continuar se ≥30% aceitam; ajustar script |
| Instagram orgânico (Reels 15–30 s) | mesmo | Vídeo "3 caminhos para entrevista" gera salvamentos e cliques | 2 posts/semana por 6 semanas, 1 CTA para beta | R$ 0–300 (edição) | 6 sem | 1.000 views, 50 cliques, 10 cadastros | Continuar se CPA orgânico < R$ 30; parar se <10 cliques |
| SEO long-tail | busca ativa | "o que vestir em entrevista", "mudar cabelo sem arrepender" | 4 artigos + 2 templates; medir orgânico | R$ 0–500 | 60–90d | 500 visitas/mês, 20 cadastros | Continuar se conversão >3%; ajustar títulos |
| Indicação | beta | Usuária indica 1 amiga em 30d | Link de convite + recompensa (1 mês grátis) | R$ 0 (crédito) | 30d | ≥0,5 convite/usuária | Continuar se K-factor >0,3 |
| Parceria salão/estúdio | clientes do salão | Salão entrega briefing como serviço e indica | 3 salões em 1 cidade; cartaz/QR; treinamento 30 min | R$ 0–500 | 45d | 10 briefings/salão/mês | Continuar se ≥3 briefings/salão; parar se 0 |
| Profissionais (Pro) | cabeleireira/maquiadora | Profissional paga R$ 49,90 para responder com IA | 10 profissionais convidados; 1 mês grátis | R$ 0 | 60d | 3 pagantes Pro | Continuar se 3/10 convertem; ajustar oferta |
| Pinterest | mesmo | Inspiração visual converte para template | 20 pins/semana apontando para templates | R$ 0 | 60d | 200 cliques, 10 cadastros | Parar se <1% CTR |
| Meta Ads | lookalike beta | Só depois de LP com UTM + payment_success + D7 | Não rodar agora (gate MF4) | R$ 50–100/dia quando liberar | 60d+ | CAC ≤ R$ 30/ativada; D7 ≥25% | Não iniciar sem os 3 gates |

### 3.4 Métricas, painéis, metas e frequência

**Funil mínimo (12 eventos):** page_view, cta_clicked, signup, consent_granted, onboarding_completed, first_generation, first_saved, briefing_created, checkout_started, payment_success, pass_activated, d7_return.

**Definições:** ativada = completou onboarding e salvou 1 resultado em 24h; valor = resultado salvo/compartilhado; TTFV = signup → primeiro resultado salvo; D7 = retorno em 7 dias; churn = assinatura cancelada no mês; CAC = gasto total / ativadas; LTV = ARPU / churn mensal.

**Metas iniciais (beta):** ativação ≥40%; TTFV ≤10 min; D7 ≥25%; D30 ≥15%; free→pago ≥5% (20 pagantes/400 ativadas); CAC orgânico ≤R$ 30/ativada; suporte ≤1 ticket/10 usuárias; NPS ≥40. **Frequência:** diário (ativação/erros), semanal (funil/receita), mensal (coorte/churn).
**Painel simples:** 1 tela com funil, coortes D1/D7/D30, MRR, churn, top erros, uso por template, motivo de cancelamento (campo obrigatório no cancelamento).
**Métricas de comportamento que indicam valor real:** 2+ gerações/semana; salvou/compartilhou; usou briefing; ligou DNA; convidou alguém; voltou após 7 dias.

---

## 4. DECISÃO E GOVERNANÇA

### 4.1 Notas do web.plaud.ai: o que manter e o que descartar (com motivo)

As notas são transcrições/roteiros de uma gravação (Plaud) transformados em prompts de agentes de marketing, não evidência de mercado. São 13 documentos únicos (~900 KB), dos quais 12 estão duplicados byte-a-byte em duas pastas e o FAROL aparece 3×. Menos de 10% é decisão executável; o resto é produção de conteúdo/prompt.

**Manter (fortalece o objetivo):**
- MF4 como contrato de medição: 25 etapas de funil, 37 eventos, metas a preencher, gate "NÃO ENTRAR AINDA" em mídia paga. É o único doc com disciplina de dados.
- GTM §4.5 (objeções) e §11 (instrumentação) como backlog de produto/copy.
- SOL08 B.2 (claims permitidos/bloqueados) como checklist de compliance — inclusive o bloqueio de "captura gerada = prova".
- MQ2 como hipótese de nicho (25–34, transição profissional) — a mais defensável.
- ARQ como hipótese de monetização (faixas de preço, Pro, créditos) — não como plano vigente.
- Narrativa "Lia / Antes de Mudar Tudo" como norte criativo, sem alegar prova.

**Descartar (não fortalece; por quê):**
- Plano de lista de espera como estratégia principal — o produto existe e tem Stripe; esperar é atrasar receita. Motivo: estágio errado.
- Calendários de set/out e beta "até 07/11" — já venceram; publicar prova social falsa quebra confiança.
- Meta/Google/TikTok/LinkedIn desde a semana 1, CPL R$ 5–18, ROAS 3x — números sem fonte e sem pixel/LP/checkout rastreado. Rodar agora = queimar caixa.
- 14 módulos do FAROL, novelinhas, podcast, SEO em escala — custo altíssimo para um produto sem analytics; 1 módulo (quiz/vídeo curto) cobre o teste.
- "Preço não definido" — contradito pelo código (R$ 19,90/49,90). Manter só confunde venda.
- Três nomes concorrentes (Vera/VersaIA/Versa) — quebra SEO/ASO e marca.
- "Interface language: English" — o app é PT-BR hard-coded.
- Promessas de AR/vídeo/hiper-realismo — o próprio app declara fora do escopo; prometer gera reembolso.
- Curso/consultoria/infoproduto (R$ 297–697) — outro negócio; dilui foco.
- Pasta Publicidade-Propaganda/ inteira, exceto o ARQ — duplicata; risco de editar a cópia errada.
- Escassez "100 vagas" — sem mecânica real; se usar, precisa de verificação.

### 4.2 Limites e restrições que afetam o trabalho (reavaliar com você)

| # | Limite/restrição | Situação hoje | Impacto no plano | Suposição padrão | Alternativa | Custo/risco | Como validar | Decisão necessária |
|---|---|---|---|---|---|---|---|---|
| L1 | Orçamento de IA por usuária | desconhecido; texto sem cota; imagem 18 grátis | define preço e abuso | teto de R$ 8–12/usuária/mês no grátis | cota mensal + créditos | alto custo se texto livre | medir ai_runs custo real por task | você aprova teto? |
| L2 | Verba de mídia | docs divergem (R$ 0 / R$ 4.000 / R$ 100/dia) | sem verba, crescimento orgânico | R$ 0 por 60 dias | R$ 50/dia após gates | queimar caixa | 3 gates (LP+UTM, payment_success, D7) | confirma R$ 0 até gates? |
| L3 | Preço | 19,90 Pass, 49,90 Pro; docs 39,90/299,90 | receita e posicionamento | manter 19,90/49,90 + anual 149,90 | testar 29,90 após 100 ativações | confusão/reembolso | teste A/B com 200 visitantes | qual preço canônico? |
| L4 | Tempo/equipe | você + IA; sem designer/dev full-time | escopo do sprint | 6 semanas de sprint, 1 entrega/semana | contratar freelancer pontual | atraso | velocity real | quantas horas/semana? |
| L5 | Estética/CFM | módulo no ar, fora dos docs; ARQ menciona CRM-DF 34266 [I] | risco regulatório e de marca | fora de campanha até revisão | manter só para usuárias existentes | multa/reputação | parecer jurídico + revisão de claims | você é médico(a)? quer manter? |
| L6 | Retenção de fotos/dados | sem política; exclusão incompleta | LGPD | 12 meses para fotos, exclusão a pedido | 90 dias | passivo | revisão jurídica | prazo de retenção? |
| L7 | Hospedagem/plataforma | Lovable + Supabase próprio; config divergente | deploy e sync | manter Lovable para sync, sem force push (AGENTS) | deploy próprio (Netlify/Cloudflare) | perda de histórico | build/deploy de teste | manter Lovable? |
| L8 | Mobile | app v0.1.0 fora do repo, não publicado | prioridade e custo | web/PWA primeiro; mobile após 100 ativadas | publicar Android | 4–8 semanas | decisão por dados | mobile é prioridade agora? |
| L9 | Dependências externas | Supabase, Stripe, gateway/fal, BrasilAPI, Google | uptime e custo | manter, com fallback e timeout | trocar gateway | lock-in | teste de falha | aceita lock-in? |
| L10 | Escopo de produto | 6 módulos + rede + estética | foco | congelar features 6 semanas | nada | dispersão | revisão semanal | concorda com freeze? |

### 4.3 Recursos usados e transparência de dependências
- Foram usados apenas leitura de arquivos, execução local (build/test/lint) e auditoria por subagentes. Nenhum conector/MCP externo foi necessário; nenhum dado foi enviado a terceiros.
- Dependências externas críticas: Supabase (dados/auth/storage), Edge Functions ai-gateway e stripe-* (fora do repo), Stripe (billing), Lovable (sync/hosting), BrasilAPI (CEP), Google OAuth. Todas devem ter timeout, fallback e monitoramento; hoje não têm.
- Privacidade: nenhum dado de usuário real foi acessado; as conclusões sobre RLS são inferidas do código, não do banco.

---

## 5. PLANO PRÁTICO DE SOCIEDADE (30 / 60 / 90 DIAS)

> Formato de entrega pequena: objetivo → ação → responsável → critério de sucesso → risco principal → dependências → evidência → decisão após o teste. Você e eu dividimos execução; decisões de preço/nicho/verba são suas.

### Sprint 0 — Semana 1 (dias 1–7): Confiança + Instrumentação + Beta

| # | Objetivo | Ação | Responsável | Critério de sucesso | Risco | Dependências | Evidência a coletar | Decisão após |
|---|---|---|---|---|---|---|---|---|
| S0-1 | Blindar confiança | C1 (exclusão), C2 (consentimento de foto), C4 (secret/config), C8 (jargão/copy/confirmações) | Dev (eu) + você (aprovação) | Teste de exclusão 2 usuários; 0 "LOVABLE" na UI; consent gravado | quebrar fluxo existente | acesso ao Supabase remoto | vídeo do teste + logs | se ok, seguir; se não, corrigir antes de convidar |
| S0-2 | Instrumentar | C7: 12 eventos, painel, Sentry, definir "ativada" | Dev (eu) | Eventos visíveis em <24h; erro forçado alerta | ferramenta errada/privacidade | conta PostHog/Sentry | print do funil + alerta | se evento falhar, simplificar |
| S0-3 | Beta | Página "Entrar no beta" (4 campos), 50 DMs, 10 sessões concierge | Você (vendas) + eu (produto) | 10 inscritas, 5 sessões, 5 conclusões | recrutar pouco | lista/contatos | TTFV, gravações, objeções | se <5 concluem, ajustar onboarding |
| S0-4 | Fonte de verdade | C3 (migrações 9 tabelas), C5 (consent central), C6 (quota) | Dev (eu) | db diff vazio; testes RLS; 402 igual à UI | acesso DDL/permissões | Supabase admin | scripts + relatório | se RLS falhar, bloquear beta |

### 30 dias — Ativação e oferta única

| # | Entrega | Objetivo | Ação | Dono | Sucesso | Risco | Dependência | Evidência | Decisão |
|---|---|---|---|---|---|---|---|---|---|
| D30-1 | Navegação e fluxo "Criar" | TTFV ≤10 min | 2.2: menu de 6, "ver todos", porta única, perfil progressivo | Dev | 70% chegam ao 1º resultado; ≤2 cliques por módulo | regressão | S0 | funil por etapa | manter ou simplificar mais |
| D30-2 | Oferta única | conversão clara | 1 página de preço, 1 CTA, Pass + anual; Pro fora do funil principal | Você + eu | 10% dos beta clicam em preço; 3 pré-vendas | preço errado | L3 | cliques/checkout | ajustar preço |
| D30-3 | Stripe test → live | receita real | checkout testado, entitlement aplicado no gateway, recibo, cancelamento | Dev + você | 1 pagamento real de teste; reembolso ok | webhook | conta Stripe | logs + recibo | liberar live |
| D30-4 | Rede de profissionais v1 | supply mínimo | 5 profissionais reais em 1 cidade; perfil + vitrine + resposta | Você | 5 perfis, 3 briefings, 1 orçamento | supply | C2/C3 | briefings/orçamentos | manter cidade ou mudar |
| D30-5 | Docs/legal mínimo | confiança | Termos, Privacidade, política de retenção, claims | Você + jurídico | páginas publicadas | custo | L5/L6 | URLs | publicar |
| D30-6 | Qualidade | menos regressão | testes de RLS/server fn; Prettier; remover código morto | Dev | 20+ testes novos; lint 0 erros reais | tempo | S0 | CI verde | bloquear merge |

### 60 dias — Aquisição controlada e retenção

| # | Entrega | Objetivo | Ação | Dono | Sucesso | Risco | Dependência | Evidência | Decisão |
|---|---|---|---|---|---|---|---|---|---|
| D60-1 | Conteúdo orgânico | 100 ativadas | 2 Reels/semana + 4 artigos + 3 templates, 1 canal só | Você + eu | 500 visitas, 50 cadastros, 20 ativadas | tempo | D30 | UTMs/analytics | dobrar canal ou parar |
| D60-2 | Indicação | K-factor | convite + 1 mês grátis | Dev | ≥0,3 convite/usuária | abuso | D30 | convites aceitos | manter/ajustar |
| D60-3 | Profissionais Pro | receita B2B2C | 10 convidados, 1 mês grátis, 3 pagantes | Você | 3 Pro ativos | supply | D30 | MRR Pro | manter ou pausar |
| D60-4 | Retenção | D7 ≥25% | lembretes no app + e-mail semanal + "Hoje" | Dev + você | D7 25%; churn <10% | spam | analytics | coortes | ativar/desativar |
| D60-5 | Mobile/PWA | distribuição | PWA instalável + share sheet; decidir mobile nativo | Dev | 20 instalações PWA | escopo | L8 | instalações | decidir mobile |

### 90 dias — Decisão de escala

| # | Entrega | Objetivo | Ação | Dono | Sucesso | Risco | Dependência | Evidência | Decisão |
|---|---|---|---|---|---|---|---|---|---|
| D90-1 | Mídia paga teste | CAC validado | R$ 50/dia por 7 dias, 2 criativos, LP com UTM | Você + eu | CAC ≤R$ 30/ativada, D7 ≥25% | queima | D60 | CAC/coorte | escalar/parar |
| D90-2 | Pricing | maximizar receita | A/B 19,90 vs 29,90 (n=200) | Você | conversão × receita | amostra | D30 | MRR/conversão | fixar preço |
| D90-3 | Estética | decisão de risco | parecer jurídico + pausar campanha | Você | decisão documentada | regulatório | L5 | parecer | manter/vender/pausar |
| D90-4 | Valuation/ativos | opcionalidade | só com MRR/coortes reais; não conversar antes | Você | 3 meses de dados | distração | D90 | dashboard | conversar ou não |

---

## 6. TRÊS AÇÕES IMEDIATAS, INDICADORES 7/30/90 E O QUE NÃO FARÍAMOS

### 6.1 As três primeiras ações (próximas 72 h)

1. Publicar o "patch de confiança" (1–2 dias de dev): exclusão completa/transacional (C1), consentimento explícito de compartilhamento de foto (C2), secret/config (C4), remoção do jargão e das promessas falsas (C8), e confirmação nas 6 ações destrutivas. Aceite: teste de exclusão com 2 contas; 0 texto "LOVABLE" na UI; consentimento registrado; build/deploy ok. Sem isso, não convide ninguém.
2. Instrumentar o funil e a fonte única de quota/preço (2–3 dias): 12 eventos, painel, Sentry, endpoint de limites que a UI consome, cota de texto e timeout. Aceite: funil visível; 402 igual ao número exibido; erro forçado alerta em <1 min; "ativada" definida e medida.
3. Recrutar 10 pessoas do nicho e fazer 5 sessões concierge (2 dias): landing de beta de 4 campos, 50 DMs, roteiro de 15 min, gravação com consentimento, coleta de TTFV/objeções. Aceite: 10 inscritas, 5 sessões, 5 conclusões, 3 depoimentos autorizados; decisão: manter nicho ou trocar. Sem mídia paga.

### 6.2 Indicadores a observar

**Em 7 dias**
- Patch de confiança em produção (0 falhas no teste de exclusão); 0 jargão; 0 ação destrutiva sem confirmação.
- 12 eventos disparando; painel do funil no ar; 1 alerta de erro testado.
- 10 beta inscritas; 5 sessões; TTFV mediano; top 5 fricções observadas; 3 bugs P0 novos.
- Decisão: se TTFV >10 min, o gargalo é onboarding/navegação → priorizar D30-1.

**Em 30 dias**
- Ativação ≥40% (onboarding + 1 resultado salvo em 24h); TTFV ≤10 min; D7 ≥25% (se já houver base); 30 beta ativas.
- 1 pagamento real (teste) e entitlement aplicado; 5 profissionais cadastrados; 3 briefings enviados; 1 orçamento.
- Suporte ≤1 ticket/10 usuárias; 0 incidente de privacidade; 0 erro 5xx não monitorado.
- Decisão: se ativação <25%, congelar aquisição e corrigir produto; se ≥40%, preparar D60.

**Em 90 dias**
- 100 ativadas; D30 ≥15%; free→pago ≥5% (≥5 pagantes); MRR R$ 100–500 (beta) com meta de R$ 1.000 no mês 4.
- CAC orgânico ≤R$ 30/ativada; 1 canal com CPA validado; 3 cases reais; 10 profissionais/3 Pro.
- Churn <10%/mês; NPS ≥40; 0 passivo LGPD aberto.
- Decisão: escalar o canal vencedor, cortar o resto; decidir mobile e estética com dados.

### 6.3 O que NÃO faríamos (anti-dispersão, anti-retrabalho, anti-custo)

- Não construir novo módulo/recurso durante 6 semanas (inclui créditos, carteira, white-label, marketplace, B2B, curso).
- Não rodar mídia paga antes dos 3 gates (LP com UTM, payment_success rastreado, D7 documentado).
- Não publicar app nas lojas antes de 100 ativadas no web/PWA.
- Não abrir 14 canais: no máximo 2 por ciclo (1 orgânico + 1 parceria).
- Não criar novos planos/preços/SKUs antes de 100 ativações; não usar "preço não definido".
- Não usar estética em campanha até parecer jurídico; não prometer resultado médico.
- Não reescrever o stack (TanStack/Supabase funcionam); não migrar de banco; não trocar gateway sem teste de custo.
- Não produzir mais documentos de plano: 900 KB de docs e <10% executável; a partir de agora, 1 página de decisão por semana.
- Não aceitar prova social gerada por IA como depoimento; não usar "captura gerada = produto pronto" (claim bloqueado).
- Não fazer force push/rebase no repo conectado ao Lovable (AGENTS) e não misturar com o repo mobile.
- Não perseguir valuation antes de MRR/coortes; não conversar com comprador sem 3 meses de dados.
- Não importar catálogo em massa sem loja parceira real; não prometer prioridade paga sem contrato.

---

## 7. SE A FERRAMENTA FOSSE NOSSA: O QUE A TORNA INDISPENSÁVEL, DISTRIBUÍDA, VENDIDA E LUCRATIVA

**Indispensável (hábito semanal):** ela precisa ser o lugar onde a decisão de imagem acontece — não um gerador de imagens bonitas. O núcleo é memória + contexto + saída acionável: DNA que lembra rejeições/orçamento/rotina; 3 intensidades; briefing que a pessoa leva ao salão; histórico de decisões ("usei e funcionou"). O gatilho de retorno é o evento com prazo (entrevista, casamento, viagem, corte) + lembrete semanal no app. Meta: 2 usos/semana e 1 resultado salvo/compartilhado por uso.

**Distribuída:** resultado compartilhável (link de coleção/briefing), micropáginas de profissionais (/p/{slug}) como canal de aquisição orgânica, templates SEO ("o que vestir em entrevista"), rede de salões como canal físico (QR/cartaz), indicação com recompensa. Cada resultado carrega a marca e um CTA — sem expor dados privados.

**Vendida:** uma promessa, uma prova, um preço. Pass R$ 19,90/mês (anual R$ 149,90) para a pessoa; Pro R$ 49,90/mês para o profissional (que também traz clientes). Risco reverso de 7 dias; prova real de beta; FAQ que responde às objeções; comparação honesta. Vender "briefing melhor", não "IA mágica".

**Lucrativa (unit economics a validar):** custo de IA por ativa ≤ R$ 3–5; receita média por pagante ≥ R$ 19,90; margem bruta ≥70%; CAC ≤ R$ 30 (orgânico) e payback ≤3 meses. Alavancas: anual (caixa), Pro (ARPU maior), templates (custo de suporte menor), catálogo/afiliado só depois de receita. Sem créditos e sem marketplace até 100 pagantes.

**A tese de uma frase:** "A Aura ID é o lugar onde você testa a próxima versão de si mesma antes de gastar dinheiro e se arrepender — e sai com um briefing que o profissional entende."

---

## 8. DIVERGÊNCIAS ENTRE ARQUIVOS (fonte, impacto, teste que resolve)

| # | Tema | Fonte A | Fonte B | Por que importa | Teste que resolve |
|---|---|---|---|---|---|
| D1 | Estágio do produto | Docs GTM: pré-lançamento/lista de espera, sem app (GTM l. 11,18; EST l. 39) | Código: 63 páginas, Stripe, 6 módulos (EXP l. 123-127) | Estratégia e verba | abrir o app e fazer um fluxo ponta a ponta |
| D2 | Preço do Pass | "não definido" (GTM l. 216) | R$ 19,90 (código); R$ 39,90/299,90 (05-GTM mobile); faixa 19,90–49,90 (ARQ) | Conversão/reembolso | Stripe Dashboard: price IDs ativos e valor cobrado |
| D3 | Público inicial | 5 segmentos (GTM §2.1) | 25–34 transição (MQ2 l. 35); 18–45 (FAROL); homens (EXP E) | Criativo e LP | teste de 2 ângulos com a mesma LP; ativação por segmento |
| D4 | Mídia paga | "NÃO ENTRAR AINDA" (MF4 l. 784) | R$ 4.000/30d (EST); R$ 100/dia (FAROL) | Caixa | checar pixel/UTM/payment_success; só liberar com gates |
| D5 | Promessa central | "autoimagem gentil" (GTM l. 140) | "teste sua próxima versão" (FAROL l. 22) / "espelho inteligente" (GCD l. 740) | Mensagem | teste A/B de H1 com 200 visitantes; medir ativação |
| D6 | Grátis | 40 imagens (PLANO-IMAGEM-PRO.md:78) | 18 no código; "5" na UI | Suporte e custo | gerar 6 referências e 3 textos com usuário novo; ver 402 |
| D7 | "Produto completo E2E" | PLANO-EXPANSAO.md:123-127 | Sem testes de server function/RLS; C4 sem migração | Confiança no roadmap | E2E com 2 usuários; suíte de RLS |
| D8 | Tabela quotes (A2) | PLANO-EXPANSAO.md:44-45 | Orçamento em briefing_sends | Modelagem | select to_regclass('public.quotes'); descrever briefing_sends |
| D9 | partner_stores (logo/comissão) | PLANO-EXPANSAO.md:71 | Só id/nome/site/prioridade/ativo | Monetização | descrever partner_stores |
| D10 | Privacidade de tatuagem | AGENTS.md:23 "nenhuma imagem de tatuagem vai à IA" | copiarDesign envia foto do corpo | Claim e LGPD | interceptar chamada de copiarDesign |
| D11 | Engine "strict JSON schema" | AGENTS.md:17 | ai.server.ts:48-54 sem response_format | Qualidade | inspecionar payload do gateway |
| D12 | Projeto Supabase | .env aura-id | supabase/config.toml Lovable antigo | Ambiente errado | supabase status e comparar URL |
| D13 | Módulo estética | Docs GTM negam procedimento estético (GTM l. 656) | Módulo no ar (EXP Projeto C) | Regulatório/marca | parecer jurídico + decisão |
| D14 | Modelo de dados do feedback | feedback (pacote) | feedback_aura (anônimo) | Analytics | consultar as duas tabelas e mapear eventos |

---

## 9. SUPOSIÇÕES, LACUNAS E PERGUNTAS OBJETIVAS

| # | Suposição | Confiança | Impacto se errada | Como validar | Pergunta para você |
|---|---|---|---|---|---|
| S1 | O nicho 25–34 em transição profissional paga | M | alto (muda LP, criativo, preço) | 20 entrevistas + 30 beta; intenção de compra | Qual segmento você quer atacar primeiro? |
| S2 | R$ 19,90/mês é aceitável | M | alto (receita) | teste de preço com 200 visitantes; 3 pré-vendas | Mantemos 19,90 + anual 149,90? |
| S3 | A pessoa aceita enviar foto | M | alto (ativação) | medir % que ativa "meu modelo" | Foto é obrigatória em algum fluxo? |
| S4 | Profissionais pagam R$ 49,90 | B | médio (canal Pro) | 10 convites, 3 pagantes | Quer investir na rede agora? |
| S5 | Estética pode ser vendida sem risco | B | alto (jurídico) | parecer + revisão de claims | Você é médico(a) (CRM-DF 34266)? |
| S6 | Custo de IA cabe em R$ 8–12/usuária grátis | B | alto (margem) | instrumentar custo por task por 30 dias | Qual teto por usuária? |
| S7 | O beta gratuito converte ≥5% | B | médio | 30 beta + paywall | Aceita beta gratuito por 30 dias? |
| S8 | Lovable continua sendo o hosting | M | médio (deploy) | teste de deploy | Mantemos Lovable? |
| S9 | Mobile não é prioridade agora | M | alto (custo) | decisão por dados de PWA | Mobile agora ou depois de 100 ativadas? |
| S10 | Os docs GTM são hipóteses, não compromissos | A | baixo | leitura das datas/preços | Confirma que posso descartar os planos vencidos? |

**Lacunas que bloqueiam decisão (e como destravar):**
1. Acesso ao banco remoto (RLS/buckets/triggers) → supabase db dump + pg_policies; sem isso, não há como garantir segurança.
2. Custo real de IA por task → core.ai_runs com custo/tokens; sem isso, preço é chute.
3. Conta Stripe e status live → dashboard + price IDs; sem isso, "receita" é hipótese.
4. Lista de beta/contatos → 30 nomes do nicho; sem isso, não há teste de demanda.
5. Parecer jurídico (LGPD/foto/estética) → revisão de termos e claims; sem isso, não se deve vender estética.
6. Analytics → sem ele, todo o resto é opinião.
7. Definição de "vendida" → venda de ativo (valuation) ou SaaS recorrente? Muda toda a estratégia (ver §7 e D90-4).

---

## 10. ANEXOS E RASTREABILIDADE

**Anexos técnicos**
- auditoria/01-backend.md — 553 linhas: tabelas/RLS, 83 contratos, quotas, gateway, auditoria, segurança (R1–R11), erros 7.1–7.20, divergências 8.1–8.12.
- auditoria/02-frontend.md — 601 linhas: inventário de 63 telas, 8 fluxos, fricções F1–F10, duplicidades, acessibilidade, copy, status por tela, priorização P0–P3.
- auditoria/03-gtm.md — 349 linhas: mapa das 13 fontes, posicionamento, personas, oferta/preço, funil/canais, plano × executado, divergências D1–D11, descartes.

**Comandos e resultados**
- npx tsc --noEmit → exit 0 · npm run build → exit 0 · npx vitest run → 33/33 · npx eslint . → 5.054 problemas (5.025 Prettier; 7 erros reais).
- Observação: o runner de teste precisou de sandbox elevado por limitação de spawn do Vite no Windows; não é defeito do projeto.

**Arquivos-chave citados**
src/lib/aura.functions.ts, src/lib/uso.functions.ts, src/lib/stripe.functions.ts, src/lib/estetica.functions.ts, src/lib/profissionais.functions.ts, src/lib/references.functions.ts, src/lib/onboarding.functions.ts, src/routes/_authenticated/route.tsx, src/routes/index.tsx, src/components/TrilhaPicker.tsx, src/routes/_authenticated/export.tsx, src/integrations/supabase/client.server.ts, drizzle/migrations/0000–0007, .env, supabase/config.toml.

**Declaração de escopo:** este trabalho é diagnóstico e plano; nenhum arquivo de produto foi alterado. As correções propostas estão especificadas com critério de aceite para execução imediata mediante seu ok.
