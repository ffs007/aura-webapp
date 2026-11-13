# Auditoria GTM — Aura ID (webapp-lovable)

**Data:** 2026-11-07 · **Autor:** gtm-audit · **Escopo:** Notas/, Publicidade-Propaganda/, .lovable/plan/, PLANO-EXPANSAO.md, PLANO-IMAGEM-PRO.md, REMODELAGEM.md, roadmap.md, Assets/ × produto e código do webapp.

**Veredito em uma linha:** os documentos descrevem um **pré-lançamento de lista de espera, sem produto, sem preço e sem prova**; o repositório é um **produto funcional de 70 rotas com assinatura Stripe (R$ 19,90/mês) e Plano Profissional (R$ 49,90/mês)** — mas **sem analytics, sem landing page de campanha e sem nenhuma prova social**.

## Como ler esta auditoria

- **[CONFIRMADO]** = verificado no arquivo citado (documento ou código), com linha/seção.
- **[INFERIDO]** = dedução a partir de 2+ fontes; não é fato declarado em nenhuma delas.
- **Confiança:** A (alta) · M (média) · B (baixa).
- Citações curtas, literais; prompts internos de produção não são reproduzidos (fora do escopo).
- Todo número de linha refere-se ao arquivo na versão lida nesta data.

## 0. Mapa de fontes (aliases usados nas citações)

| Alias | Arquivo | Tamanho | Papel |
|---|---|---|---|
| **MF4** | Notas/APP---Aura-Visual-MF4 · PLANO DE LANÇAMENTO, FUNIL E VALUATION.md | 1.149 l. | Plano de 30 dias, funil, métricas do ativo e tese de valuation |
| **GTM** | Notas/APP---Aura-Visual-[GTM] - DIRETOR DE MARKETING 360 & GO-TO-MARKET _ v1.md | 982 l. | Estratégia 360, ICP, oferta, LP, canais, medição |
| **EST** | Notas/APP---Aura-Visual-[GTM] - ESTÚDIO EXECUTIVO DE CAMPANHAS MULTICANAL.md | 1.382 l. | Campanha multicanal unificada, peças, mídia, tracking |
| **FAROL** | Notas/APP---Aura-Visual-[EXECUTIVO] FAROL_COMMS v4.0 … (PLAUD/META/GOOGLE/TIKTOK/LINKEDIN).md | 1.165 l. | Big idea, 14 módulos de aquisição, tráfego pago, calendário |
| **GROWTH** | Notas/APP---Aura-Visual-GROWTH PERSUASIVO 360.md | 1.197 l. | Personas, oferta irresistível, garantia, escassez, canais |
| **GCD** | Notas/APP---Aura-Visual-Growth Creative Director.md | 3.145 l. | Extração de dor/benefício, big idea, objeções, claims sensíveis |
| **MQ1** | Notas/…MQ1 · O DESPACHANTE — 1 fala, 8 destinos.md | 918 l. | Distribuição editorial em 8 canais |
| **MQ2** | Notas/…MQ2 · CAPÍTULOS BREVES.md | 1.053 l. | Público escolhido (25–34, carreira) + motor de peças curtas |
| **PL2** | Notas/…PL2 · ESTRUTURA ANDROID.md | 1.940 l. | App Android (Expo/RN), telas do MVP, tabelas, RLS |
| **SOL08** | Notas/…SOL 08 — HISTORINHAS QUE LEVAM À FERRAMENTA.md | 998 l. | Série narrativa “Antes de Mudar Tudo” + claims permitidos/bloqueados |
| **VISUAL** | Notas/…CONTEÚDO VISUAL-CRIATIVO_ CARROSSEL / REEL / STORY.md | 779 l. | 3 rotas criativas: Aura ID, app de beleza, VersaIA |
| **MAESTRO** | Notas/…[Design] MAESTRO — Agente de Produção Audiovisual.md | 2.320 l. | Plano audiovisual, posicionamento, modos de uso |
| **ARQ** | Publicidade-Propaganda/…[Ativos] Arquiteto de Ativos Intelectuais — v2.0.md | 3.294 l. | **Único doc sem duplicata**; viabilidade, MVP 90 dias, roadmap e preços |
| **EXP** | PLANO-EXPANSAO.md | — | Estado real do produto (projetos A–E) e “Mercado” como último passo |
| **IMGPRO** | PLANO-IMAGEM-PRO.md | — | Correções de imagem PRO; privacidade de fotos no webapp |
| **REMOD** | REMODELAGEM.md | — | Trilhas/nav; barba “fora da navegação” |
| **ROADMAP** | roadmap.md | — | Checklist de tatuagem/jornada (com itens abertos) |
| **MVP-13/10** | .lovable/plan/aura-id-mvp-plan-2026-10-13.md | 4 KB | Plano do MVP inicial (15 itens da Fase 1) |
| **MAQ-13/10** | .lovable/plan/aura-id-módulo-maquiagem-mesclado-2026-10-13.md | 4,9 KB | Módulo maquiagem |
| **SUG-14/10** | .lovable/plan/aura-id-sugestões-masculinas-e-femininas-barba-e-imagens-2026-10-14.md | 8 KB | Gênero/barba/imagens |
| **CÓDIGO** | src/**, package.json, drizzle/**, supabase/config.toml, .env | — | Realidade do produto |
| **MOBILE** | ../AURA-ECOSSISTEMA (fora do workspace) | — | App React Native, funções Stripe/RevenueCat, docs/05-GTM |

**Duplicação (achado de método):** **Publicidade-Propaganda/** contém **12 dos 13 arquivos de Notas/ byte-a-byte idênticos** (MD5 conferido) + 1 cópia duplicada do FAROL ((1).md). Notas/ tem 12 arquivos; o 13º (…PL2 · ESTRUTURA ANDROID) existe **só** em Notas/. O único conteúdo exclusivo de Publicidade-Propaganda/ é o **ARQ**. [CONFIRMADO] Confiança: A.

---

## 1. Posicionamento e proposta de valor declarada

### 1.1 Frase-síntese e promessa (quem os docs dizem que o Aura ID é)

| Fonte | Citação curta | Leitura |
|---|---|---|
| MF4 §0 (l. 23) | “Um ecossistema de IA para autoimagem que ajuda a pessoa a experimentar, entender e construir sua presença visual com mais autoria, segurança e gentileza.” | Frase-mãe do corpus |
| GTM §3.2 (l. 145) | Categoria: “Plataforma/app de autoimagem e estilo pessoal com IA.” | Categoria declarada |
| GTM §3.3 (l. 154–155) | Slogan: **“Sua imagem, com contexto e gentileza.”** | Slogan escolhido |
| EST §1.1 (l. 17) | Nome de trabalho: “**Aura ID — sua autoimagem em construção**” | Naming alternativo |
| EST §1.1 (l. 36) | Promessa permitida: “Uma forma mais gentil e prática de experimentar caminhos de estilo antes de decidir.” | Promessa “publicável” |
| FAROL §1.2 (l. 22) | Big Idea: “**Teste sua próxima versão antes de mudar sua imagem no mundo real.**” | Big idea (15 palavras) |
| GROWTH §2 (l. 41) | “Descubra, teste e construa sua presença visual com IA antes de mudar de verdade…” | Promessa central |
| GCD §3.1 (l. 740) | “Aura ID é o espelho inteligente que ajuda você a explorar, testar e construir sua presença visual…” | Metáfora-mãe |
| MAESTRO (l. 38) | “Aura ID ajuda você a se ver com mais clareza, testar possibilidades sem pressão…” | Promessa emocional |

[CONFIRMADO] Confiança: A. Há **convergência alta** no guarda-chuva (“autoimagem com IA + contexto + gentileza + testar antes de decidir”), e **divergência no recorte de campanha** (§6).

### 1.2 Categoria mental e palavras-chave

- Categoria mental disputada nos docs: “**espelho inteligente de autoimagem**” (GCD l. 740; GROWTH l. 19: “consultoria de imagem com IA no bolso”). [CONFIRMADO] A
- Categoria publicada no próprio app (título da home): “Aura ID — Uma companhia gentil para sua identidade visual” — **src/routes/index.tsx:7**. [CONFIRMADO] A — **não é a mesma categoria** dos docs (companhia vs. plataforma/consultoria).
- Keywords de Search declaradas (GTM §9, l. 643–654): “ia para estilo pessoal”, “consultoria de imagem online”, “como mudar meu visual”, “app de maquiagem virtual”, “app para testar cabelo”, “[diagnóstico de estilo]”. [CONFIRMADO] A
- Keywords do EST (l. 815–866): “como mudar meu visual”, “mudar visual sem radicalizar”, “autoconhecimento visual”, “[dna visual]”, “[presença visual]”. [CONFIRMADO] A
- Negativas declaradas (GTM l. 656): “diagnóstico médico, dermatologista, **procedimento estético**…” — em **contradição direta** com o módulo de estética implementado (EXP, Projeto C). [CONFIRMADO] A → ver §6-D9.
- Termos proprietários alegados: “DNA Visual Evolutivo™”, “Navegador de Versões de Si Mesma™” (GROWTH l. 92–95, marcados [HIPÓTESE DE NOME]); “DNA Visual Unificado” (FAROL l. 11). [CONFIRMADO] A — todos como hipótese, nenhum registrado.

### 1.3 Diferenciais alegados

| Diferencial alegado | Fonte | Status declarado |
|---|---|---|
| DNA visual evolutivo que aprende preferências, rejeições, orçamento, rotina, cultura, fase de vida | MF4 §0 (l. 100–121); FAROL l. 11 | “proposta funcional” (SOL08 CL_AURA_003) |
| Três intensidades (segura / intermediária / ousada) | MF4 l. 144; GTM l. 150; MVP-13/10 item 7 | implementado: packages.kind + UI de comparação [CONFIRMADO] A |
| Contexto em vez de tendência (rotina, orçamento, manutenção, clima, profissão) | GTM §3.2; EST l. 27 | implementado no onboarding (**src/lib/onboarding.ts:101**) [CONFIRMADO] A |
| Briefing/ponte para profissionais (salão, tatuador) | MF4 l. 182; GROWTH l. 170 (hipótese) | implementado: /profissionais, /p/{slug}, briefing_sends (EXP Fatia A1) [CONFIRMADO] A |
| “Ninguém no mercado entrega medida + simulação + briefing” (simetria) | EXP — Premissa 1 | implementado (/estetica) [CONFIRMADO] A — **mas fora de qualquer doc de GTM** |
| Segurança emocional / sem ranking / sem julgamento | GTM l. 32; SOL08 l. 152–161; src/routes/index.tsx:19-22 | implementado (princípios na home + safety_config) [CONFIRMADO] A |

[INFERIDO] O diferencial mais defensável **não está nos docs** que a campanha usaria: a rede de profissionais + catálogo com prioridade paga (partner_stores.prioridade) + simetria. Confiança: A.

---

## 2. Personas, dores, objeções, casos de uso, provas e garantias

### 2.1 Segmentos declarados (e o quanto se contradizem)

| Segmento | Prioridade declarada | Fonte |
|---|---|---|
| Mulheres em mudança gradual de imagem/estilo | 5 | GTM §2.1 (l. 69) |
| Mulheres em reposicionamento profissional/pessoal | 5 | GTM §2.1 (l. 70) |
| Maquiagem prática (rotina/eventos) | 4 | GTM §2.1 (l. 71) |
| Eventos e momentos marcantes (noiva, formatura, foto) | 4 | GTM §2.1 (l. 72) |
| Tatuagem consciente | 3 | GTM §2.1 (l. 73) |
| Homens / barbearia | expansão futura | MF4 l. 52; PL2 l. 43 |
| Mulheres 25–34 em **transição profissional** (público único escolhido) | escolhido | MQ2 §3 (l. 35) |

- [CONFIRMADO] A: **GTM trata 5 segmentos em paralelo**; **MQ2 escolhe um só** (“mulheres de 25 a 34 anos em reposicionamento ou transição profissional”, l. 35) e o justifica por velocidade de evidência e custo de alcance (l. 37–40).
- [CONFIRMADO] A: **o produto já tem trilha masculina implementada** (EXP Projeto E, entregue 2026-11-02; **src/routes/_authenticated/barba.tsx**), enquanto GTM l. 79 exclui menores e trata B2B como pendência.
- Público inicial em todos os docs: “principalmente mulheres” (MF4 l. 25; EST l. 22; PL2 l. 42). [CONFIRMADO] A.

### 2.2 Dores e linguagem do cliente (VOC)

- Dores-núcleo (GTM §2.3 l. 86–101, literais do briefing): “Quero mudar, mas sem assustar.” · “Tenho medo de cortar o cabelo curto.” · “Quero parecer mais profissional, sem perder a autenticidade.” · “Não sei o que combina comigo.” · “Quero testar algo antes de decidir.” [CONFIRMADO] A
- Custo da inércia (FAROL l. 8): compra errada, tempo/dinheiro em tentativa e erro, chegar despreparada a eventos. [CONFIRMADO] A
- Atritos previstos (MF4 §5 l. 243–269): medo de mudança, privacidade de foto, recomendação genérica, “bonito na teoria e inviável na prática”, excesso de módulos, risco médico em tatuagem. [CONFIRMADO] A
- Fricção mensurável de público (MQ2 l. 45, 56): classe B2/C1/C2, renda domiciliar ~R$ 2,9–10 mil/mês [ESTIMADO]; gasto atual na categoria R$ 80–500/mês [ESTIMADO]. [CONFIRMADO] A — é a **única** estimativa de willingness-to-pay do corpus.

### 2.3 Objeções priorizadas

- GTM §4.5 (l. 220–229) lista 10 objeções com resposta publicável: “A IA vai dizer que eu preciso mudar?”, “Tenho medo de parecer outra pessoa.”, “Isso vai julgar meu corpo?”, “Já uso Pinterest…”, “Preciso mandar foto?”, “Vai substituir profissionais?”, “Vai ser pago?”. [CONFIRMADO] A
- GCD §2.5 (l. 660–682) lista 20+ objeções, incluindo “Já tentei app de beleza e ficou artificial”, “Já tentei consultoria de estilo e achei genérico”, “Não quero gastar mais comprando roupa”. [CONFIRMADO] A
- [INFERIDO] As objeções mais caras para o estágio atual são **privacidade de foto** e **“isso é só mais um app de beleza com IA”**; nenhuma das duas tem prova no produto (só princípios). Confiança: A.

### 2.4 Casos de uso e modos prometidos

- Modos citados: rápido, aprofundado, evento, transformação, teste rápido, offline parcial (MF4 l. 178; PL2 §2; MAESTRO l. 472–570). [CONFIRMADO] A
- [INFERIDO] No código existem módulos (maquiagem, cabelo, roupas, tatuagem, barba, estética, jornada) e **fluxos por ocasião**, mas **não existe seletor de “modo”** nomeado como nos docs (grep por “modo evento/transformação” em src não retorna recurso equivalente). Confiança: M.

### 2.5 Provas e garantias

- Todos os docs admitem **ausência total de prova**: GTM l. 18 (“Prova ausente: protótipo funcional, prints, app publicado, resultados…”), EST l. 39 (“Não há prova de usuários, app publicado, receita…”), GROWTH l. 9 (“[PROVA A CONSTRUIR]”), SOL08 l. 148 (“Captura de tela gerada é prova de produto pronto” = **claim bloqueado**). [CONFIRMADO] A
- Garantia/risco reverso: **só o GROWTH propõe** — “Teste por 7 dias. Se você não sentir mais clareza sobre pelo menos um caminho visual prático, cancele sem burocracia.” (l. 186), marcada [HIPÓTESE]. [CONFIRMADO] A
- [CONFIRMADO] A: **nenhum** doc define NPS, depoimento, case ou selo real; a única “prova” disponível seriam os assets visuais (Anexo A) — que são mockups/stock, não uso real.

---

## 3. Oferta e preços declarados × código

### 3.1 Tabela de oferta/preço

| Oferta | Valor declarado | Onde está declarado | Existe em código? | Veredito |
|---|---|---|---|---|
| Lista de interesse + mini-diagnóstico (pré-lançamento) | Gratuito | GTM §4.1–4.2 (l. 192–205); EST §1.1 (l. 35) | **Não.** Não há rota /aura-id, /lista-de-espera nem formulário de waitlist; a home manda para /auth (**src/routes/index.tsx:40**) | **Oferta inexistente no produto** |
| **Aura Pass** (assinatura individual) | **R$ 19,90/mês** | **src/lib/stripe.functions.ts:16**; **src/routes/_authenticated/aura-pass.tsx:80,89**; **guia.tsx:36** (“R$ 19,90/mês”) | **Sim** — UI + checkout Stripe + portal + webhook de entitlement | **Preço vivo no produto** |
| Aura Pass (faixa) | “R$ 19,90 a R$ 49,90/mês” | ARQ §14.1 (l. 1226) e §14 (l. 2491) | Parcial: 19,90 (Pass) e 49,90 (Pro) existem, mas como **produtos distintos** | Doc mistura dois SKUs |
| **Plano Profissional (Pro)** | **R$ 49,90/mês** | EXP l. 57 e l. 126; **stripe.functions.ts:18**; **profissionais.tsx:184,190** | **Sim** — paywall na página de profissionais | **Preço vivo no produto** |
| Aura Pass anual (mobile) | R$ 149,90/ano | MOBILE **GUIA-PUBLICACAO.md** Fase 2 | **Não no webapp**; produto Play a criar | Plano sem produto |
| “Aura Pass” bundle mobile | R$ 39,90/mês · R$ 299,90/ano | MOBILE **docs/05-GTM-MONETIZACAO.md** l. 58 | Não | **Conflito de preço** (§6-D1) |
| Pro mobile (web) | Solo R$ 89/mês · Studio R$ 199/mês | MOBILE 05-GTM l. 59 | Não | Conflito com Pro R$ 49,90 |
| Apps individuais (Color/Closet/Hair/Ink/Makeup/Barber) | R$ 29,90 vitalício; R$ 9,90–24,90/mês; créditos R$ 24,90 | MOBILE 05-GTM l. 52–60 | Não | Fora do escopo atual |
| Créditos de IA (profissional) | “consome crédito do profissional; recarga via Stripe — mesmo motor do Pass” | EXP Fatia A3 | Parcial: quota/paywall por tarefa existe (QuotaChip, “Aura Pass libera mais”), **carteira de créditos não** | Promessa sem billing |
| Curso/consultoria/infoproduto | R$ 297–697 (curso); R$ 497–2.500 (consultoria) | ARQ §14.1 (l. 1225, 1228); l. 2800 | Não | Outro negócio, não produto |
| Valuation / múltiplo / valor do ativo | **Nenhum número** | MF4 §17–19 (tese de venda); §9.4 (métricas) | — | Só tese, sem valuation |
| “Preço não definido” | — | GTM §4.4 (l. 216: “não deve haver tabela comercial pública ainda”); EST FAQ 7 (l. 1005); GCD l. 448–463; SUG-14/10 l. 38 (“sem inventar um preço por imagem”) | **Contradito pelo código** | Doc congelado |

[CONFIRMADO] A para a existência dos dois preços no código; **M** para a afirmação de que são cobrados de fato (o valor real mora no Stripe Price ID em env, não versionado — ver §5.2).

### 3.2 O que é “oferta real” hoje, no produto

1. **Grátis com quota**: “5 imagens por conta” antes do paywall — **aura-pass.tsx:88**; mensagens de quota em **QuotaChip.tsx:24-35**. [CONFIRMADO] A
2. **Pass** desbloqueia gerações/interpretação; **Pro** desbloqueia sugestões de IA ilimitadas na foto da cliente (**profissionais.tsx:184**). [CONFIRMADO] A
3. **2 testes grátis** por recurso em módulos específicos (tatuagem “copiar pra mim”, barba) — EXP Fatias D2/E3. [CONFIRMADO] A
4. Não há **trial**, **cupom**, **garantia de 7 dias**, **plano anual**, **beta fundadoras** ou **preço de lançamento** em código. [CONFIRMADO] A

---

## 4. Funil e lançamento: etapas, canais, experimentos, orçamento, prazos, metas

### 4.1 Funil declarado (versão GTM — a mais executável)

Descoberta (Reels/Shorts/anúncio) → Consideração (vídeo 60–90s/carrossel) → Conversão (lista + mini-diagnóstico) → Ativação (e-mail + diagnóstico) → Retenção (conteúdo/bastidores) → Indicação — GTM §6.1 (l. 266–271). [CONFIRMADO] A

- Caminho pago prioritário: “**Meta Ads vídeo → landing /aura-id proposta → cadastro → mini-diagnóstico → e-mail de acolhimento**” (GTM l. 273). [CONFIRMADO] A
- MF4 tem o funil mais completo (25 etapas, l. 170–198), incluindo checkout e renovação, com **“Meta numérica”** em quase toda linha — mas **nenhuma meta preenchida** ([DADO FALTANTE]). [CONFIRMADO] A
- Definição de “usuária ativada” está **em aberto**: “Usuária ativada = [DADO FALTANTE]” (MF4 l. 201). [CONFIRMADO] A

### 4.2 Canais declarados

| Canal | Papel declarado | Fonte |
|---|---|---|
| Meta Ads / Instagram / Facebook | Aquisição principal (55–60% da mídia) | GTM §8 (l. 355–395); EST l. 1158 |
| Google Search | Intenção ativa (25–30%) | GTM l. 784; EST l. 1159 |
| YouTube (orgânico + Ads) | Consideração / reserva (10–15%) | GTM l. 785; EST l. 1160 |
| TikTok Ads | Topo/meio em FAROL (15% do budget) | FAROL l. 62 |
| LinkedIn | Autoridade/B2B (FAROL Módulo 12; MQ2) | FAROL l. 657–752 |
| E-mail / WhatsApp / DM | Nutrição, ativação, inbound | GTM §9 (l. 684–753); EST §9 |
| Podcast / SEO / artigo / newsletter | Autoridade e reaproveitamento | FAROL l. 762–947; MQ1 l. 411 |
| **“PLAUD”** | **Não é canal** — é o gravador de voz usado para capturar a ideia original | ARQ l. 3197; título do FAROL (ruído) |

[CONFIRMADO] A. [INFERIDO] O mix declarado é coerente entre GTM/EST (Meta > Google > YouTube), mas o FAROL **acrescenta TikTok e LinkedIn sem orçamento nem LP**; e nenhum doc considera o canal que o produto realmente tem (rede de profissionais e micro-página /p/{slug}). Confiança: M.

### 4.3 Orçamento de mídia (nenhum é oficial)

| Fonte | Orçamento | Estrutura |
|---|---|---|
| GTM §10.1 (l. 771) | **Não informado** (“B = verba total”) | 50% mídia, 20% produção, 10% ferramentas, 10% operação, 10% reserva |
| EST §11 (l. 1155–1161) | **R$ 4.000 em 30 dias** (cenário proposto; alternativa R$ 3.000–6.000) | Meta 60% (R$ 2.400), Google 30% (R$ 1.200), YouTube 10% (R$ 400) |
| FAROL l. 60–62 | **R$ 100/dia** (base) | Meta topo R$ 25/dia, Meta meio R$ 20/dia, TikTok R$ 15/dia, etc. |
| GROWTH §4 | Nenhum; escassez “100 vagas” | — |
| MF4 §10 (l. 784) | **R$ 0** — “**NÃO ENTRAR AINDA**” em tráfego pago | — |

[CONFIRMADO] A. Três orçamentos incompatíveis + uma proibição explícita (§6-D3).

### 4.4 Prazos/calendários declarados (todos já vencidos ou em conflito)

| Fonte | Janela | Entrega-âncora |
|---|---|---|
| FAROL §3 (l. 981–1015) | **13/09/2026 → 12/10/2026** | Tráfego pago desde a Semana 1; quiz; remarketing; “Oferta beta/lista” em 10/10 |
| ARQ §13 (l. 1152–1211) | **13/09 → 11/12/2026** (4 fases) | Fase 1 LP+waitlist (13–27/09); Fase 3 beta 50–100 (28/10–26/11); Fase 4 pago (27/11–11/12) |
| MF4 §7 (l. 620–633) | **D1–D30** a partir de 13/09 | LP no D2, tracking no D4, 10 abordagens manuais no D6 |
| GROWTH §4 (l. 193) | **Beta até 2026-11-07 23h59** | 100 vagas fundadoras |
| MQ1 §9 (l. 449–457) | **14/09 → 23/09/2026** | LinkedIn → X → IG → Threads → YT → WhatsApp → FB → newsletter |
| EXP l. 123–126 | **≤ 2026-11-02** | Produto A–E completo; **“falta apenas MERCADO (Stripe live + Pro)”** |

[CONFIRMADO] A. Hoje é **2026-11-07**: o deadline de fundadoras expira hoje, os calendários de FAROL/MF4/MQ1 estão no passado e o EXP declara produto pronto com mercado pendente.

### 4.5 Métricas e metas

- MF4 §9.1 (l. 638–666): 20+ métricas obrigatórias com “onde grava / como exporta” — **a base mais séria do corpus** (visitantes, origem, CTA, cadastro, diagnóstico, upload, recomendação, D7/D30, MRR, churn, CAC, LTV, referral). [CONFIRMADO] A
- MF4 §9.2 (l. 669–705): 37 eventos mínimos (page_view, cta_clicked, lead_created, checkout_started, payment_success…). [CONFIRMADO] A
- FAROL §9 (l. 1154–1165): metas numéricas — **CPL quiz R$ 5–18** [VALIDAR_COM_EQUIPE], **CPA ativação R$ 25**, **ROAS 3x**, CTR Meta 1,5%, CTR Search 6%, conclusão quiz 15%, Hook Rate 35%. [CONFIRMADO] A
- GTM §10.3 (l. 793–797): cenários CPC R$ 4,00/2,50/1,50 e CVR de cadastro 4%/8%/12%; “Pagantes: PENDENTE”. [CONFIRMADO] A
- EST §11 (l. 1196): “Teto econômico: **pendente**, pois preço, margem e retenção não foram definidos.” [CONFIRMADO] A
- [CONFIRMADO] A: **nenhuma meta tem benchmark, fonte externa ou premissa de teste** — todas são “propostas/estimativas”.

### 4.6 Plano vs. executado (evidência no repositório)

| Item | Plano | Executado? | Evidência |
|---|---|---|---|
| Landing de campanha /aura-id + /aura-id/obrigada | GTM §7.2; EST LAND01 | **Não** | 0 rotas; home / é a LP do produto (index.tsx:25-69) |
| Lista de espera + formulário | GTM §6.4, §7.4 | **Não** | 0 matches p/ “lista de espera/waitlist” em src/ |
| Analytics GA4/PostHog/pixel | GTM §11.1; MF4 D4 | **Não** | 0 matches de gtag/GA4/posthog/fbq/analytics em src/; sem dependência em package.json |
| UTMs de entrada | EST §12; GTM §11.2 | **Não** (só UTM de saída de afiliado) | src/components/ReferenceImage.tsx:290 adiciona utm_source=aura-id ao link da loja |
| CRM/e-mail/WhatsApp de nutrição | GTM §9; EST §9 | **Não** | sem provedor de e-mail em package.json/src |
| Billing/checkout | MF4 l. 193–196; EXP | **Sim** (Stripe edge fn + entitlements) | ../AURA-ECOSSISTEMA/supabase/functions/{stripe-checkout,stripe-webhook,billing-webhook} |
| Tráfego pago | FAROL semana 1; EST R$ 4k | **Não** | nenhuma conta/pixel/UTM no repo |
| App nas lojas | PL2; MOBILE GUIA | **Não** | apps/aura/app.json versão 0.1.0; checklist de publicação todo desmarcado; sem RevenueCat instalado |
| Peças de conteúdo (14 módulos FAROL, novelinhas, podcast) | FAROL l. 56+ | **Não** | nenhum roteiro produzido no repo; só 1 vídeo stock (Anexo A) |

[CONFIRMADO] A. [INFERIDO] **Nada do plano de mídia foi executado**; o único “lançamento” real foi o do produto no GitHub (commits de 2026-11-02), não o de mercado. Confiança: A.

---

## 5. O que os documentos exigem e o produto ainda não tem

Legenda: ✅ existe · ⚠️ parcial · ❌ ausente · 🚫 não verificável neste repositório.

| Exigência dos docs | Fonte | Evidência no código | Veredito |
|---|---|---|---|
| LP de campanha /aura-id + página de obrigado | GTM §7.2 (l. 313–314); EST LAND01 | nenhuma rota aura-id; home / é LP do produto com CTA “Começar meu perfil” → /auth (index.tsx:40) | ❌ |
| Lista de espera/lead capture | GTM §6.4; MF4 D3 | 0 matches “waitlist/lista de espera”; cadastro é sign-up Supabase (/auth) | ❌ |
| GA4/PostHog + eventos lead_submit, checkout_started… | GTM §11.1; MF4 §9.2 | 0 libs de analytics; 0 eventos instrumentados | ❌ |
| Meta Pixel/CAPI + conversões Google Ads | GTM §14.3 (l. 948–949) | 0 scripts; sem gtag/fbq | ❌ |
| CRM/lista + sequência de e-mails | GTM §14.2 | sem provedor e-mail; sem tabela de leads | ❌ |
| Checkout funcional e **rastreado** | MF4 l. 824 | checkout existe (Stripe), **rastreamento não** | ⚠️ |
| Stripe **live** ativado | EXP l. 126, l. 208 | funções existem; chaves/price IDs só em env do projeto (oyfqecigqrceijoxggqw); EXP diz “por último, quando Felipe der o sinal” → **não ativado** | ⚠️/❌ [INFERIDO] A |
| App mobile publicado (Android/iOS) | PL2; MQ2; EST l. 47 | ../AURA-ECOSSISTEMA/apps/aura v0.1.0; GUIA-PUBLICACAO.md com todos os passos pendentes; sem RevenueCat/PostHog/Sentry nas deps | ❌ |
| Catálogo real de produtos/lojas parceiras | EXP Projeto B; GTM l. 119 | tabelas products/partner_stores + importador CSV existem; **sem seed de lojas parceiras** (só product_catalog/hair_catalog internos) | ⚠️ [INFERIDO] A |
| Profissionais reais na rede | EXP A1–A3; /p/{slug} | professionals + micropágina + briefing existem; **sem seed/parceiro real** no repo | ⚠️ [INFERIDO] A |
| Provas: prints, depoimentos, números, casos | GTM l. 18; GROWTH l. 122–132; SOL08 l. 148 | nenhum asset de uso real; hero da home é gradiente CSS com comentário “até existir hero.jpg” (index.tsx:44-47) | ❌ |
| Landing copy + FAQ integral dos docs | GTM §7.3–7.5; EST §8 | não implementadas (nenhuma dessas frases no código) | ❌ |
| Termos, privacidade e consentimento granular | GTM l. 837–840; PL2 §6 | **existe** /consent + consents + audit_events (AGENTS.md; src/routes/_authenticated/consent.tsx) | ✅ |
| Definição de ativação + exportação de coortes | MF4 §3, §9.1 | sem evento de ativação nem coorte; dados existem em tabelas mas sem export | ❌ |
| Dashboard de valuation | MF4 §6.5, §9.4 | existe /admin (stats), mas **sem MRR/CAC/churn/coortes** | ⚠️ |

[CONFIRMADO] A para os greps (0 matches) e para a lista de rotas (70 arquivos .tsx em src/routes). [INFERIDO] A para “Stripe live não ativado” (baseado em EXP + ausência de segredos).

### 5.2 Inconsistências técnicas que afetam o GTM

- **Projeto Supabase divergente:** supabase/config.toml:1 declara project_id = “bdlvmiillyqtkcqxmcng”, mas .env/.env.aura-id e src/lib/stripe.functions.ts:12-13 apontam para “oyfqecigqrceijoxggqw”. [CONFIRMADO] A → qualquer “validação em produção” pode estar olhando o projeto errado.
- **Preço como rótulo:** AURA_PASS_PRECO = “R$ 19,90/mês” é texto de UI; o **valor efetivamente cobrado** vem de STRIPE_PRICE_ID/STRIPE_PRICE_ID_PRO em env (stripe-checkout/index.ts:9,44-54). [CONFIRMADO] A → doc e código podem divergir sem ninguém perceber.
- **Paywall sem analytics:** erros 402 são tratados como paywall (ai.server.ts:22, catalogo.functions.ts:78), mas não há evento de “paywall visto”. [CONFIRMADO] A → taxa de conversão do funil pago é invisível.

---

## 6. Divergências internas entre documentos (e o teste/decisão que resolve)

> Critério: só entram divergências que **mudam execução** (preço, público, promessa, ordem, orçamento).

| # | Tema | Fonte A | Fonte B | Teste/decisão que resolve |
|---|---|---|---|---|
| **D1** | **Preço do Pass** | “Preço não definido / não deve haver tabela comercial” (GTM l. 216; EST l. 1005; GCD l. 451) **vs.** **R$ 19,90/mês** no código (stripe.functions.ts:16) **vs.** **R$ 39,90/mês · R$ 299,90/ano** no 05-GTM mobile **vs.** faixa “R$ 19,90–49,90” (ARQ l. 1226) | 4 valores para o mesmo nome de produto | **Decisão:** fixar **1 tabela canônica** (Pass 19,90 + anual 149,90; Pro 49,90) e usar o código como fonte; teste A/B de preço só com RevenueCat/Stripe price experiment após 100 instalações (MOBILE 05-GTM §8). |
| **D2** | **Público-alvo inicial** | “Mulheres em mudança gradual de imagem” prioridade 5 + 5 segmentos (GTM §2.1) | **“Mulheres 25–34 em transição profissional”** como público único (MQ2 l. 35); “aberto mulheres 18–45” (FAROL l. 60); homens/barbearia (EXP E1–E3) | Teste de 2 ângulos (mudança gradual × carreira) com o mesmo LP e medir ativação e intenção por segmento; **decidir por ativação, não por CPL**. |
| **D3** | **Tráfego pago: agora ou nunca** | MF4 §10 (l. 784): “**NÃO ENTRAR AINDA**” até ter ativação, D7, checkout rastreado e ≥ depoimentos | FAROL §3: mídia paga **desde a Semana 1** com CPL R$ 5–18 e ROAS 3x | **Decisão:** manter MF4 (não há pixel nem LP); liberar só quando os 3 gates existirem (payment_success, LP com UTM, D7 documentado). FAROL fica como “plano B pós-tracking”. |
| **D4** | **O que é o lançamento** | GTM/EST: **pré-lançamento + lista de espera** (sem app) | EXP: **produto completo A–E**, falta só “MERCADO”; ARQ: Fase 4 paga em 27/11–11/12 | **Decisão:** tratar como **beta fechado com produto real** (não waitlist): 20–50 usuárias, Stripe em test mode, ativação medida; só então “lista” para o app mobile. |
| **D5** | **Promessa central** | “Autoimagem gentil, com contexto” (GTM l. 140) / “espelho inteligente” (GCD l. 740) | “**Teste sua próxima versão antes de mudar**” (FAROL l. 22) / “consultoria de imagem com IA no bolso” (GROWTH l. 19) / “autoimagem 360” (MAESTRO l. 16) | Teste de mensagem (E2 do GTM): H1 emocional × H1 contextual; guardrail = intenção de diagnóstico, não clique. |
| **D6** | **Idioma/UX do MVP** | MVP-13/10 (“Interface language: **English** (can add Portuguese on request)”) | PT-BR hard-coded (AGENTS.md; todo src/); plano de tradução PT-BR (…tradução-pt-br…2026-10-13.md) | Já resolvido na prática (PT-BR); **remover o item “English”** da lista de requisitos. |
| **D7** | **Escopo: 4 módulos vs. 1** | MF4 l. 143–155 manda recortar para **1 tema** (estilo+armário) e adiar tatuagem | ARQ/Aura ID Studio: 4 apps + DNA; EXP implementou **6 trilhas** (maquiagem, cabelo, roupas, tatuagem, barba, estética) + rede + catálogo | **Decisão:** o produto já venceu o recorte; o GTM deve **vender o que existe** (barbearia, estética, rede) e não esconder. |
| **D8** | **Tatuagem: centro ou expansão** | MF4 l. 152: “tatuagem, preferencialmente como expansão futura”; l. 932: “**por que a tatuagem não é o centro do MVP**” | Tatuagem é o módulo mais industrializado: vitrine do estúdio, “copiar pra mim”, stencil, briefing (EXP D1–D4); ROADMAP aberto | **Decisão:** tatuagem vira **caso de aquisição** (provador + estúdio), não “centro do produto”; ajustar o texto de MVP. |
| **D9** | **Estética/procedimentos** | Negativas de Google: “procedimento estético, dermatologista, cirurgia” (GTM l. 656); “não substitui médico” (GTM l. 32) | EXP Projeto C: análise de simetria + simulação + briefing para procedimentos, com disclaimer | **Decisão:** manter módulo **fora de campanha** até revisão jurídica/CFM (o produto é de médico — ARQ l. 2791, CRM-DF 34266); não usar em anúncio. |
| **D10** | **Naming** | “Aura ID” (todos) | “Vera” (EST l. 18), “VersaIA” (VISUAL rota C), “Versa” (ARQ §14.2), “Aura Color” (MOBILE 05-GTM) | **Decisão:** Aura ID como marca-guarda-chuva; submarcas só depois de receita; congelar “Versa”/“VersaIA”. |
| **D11** | **Valuation** | MF4: tese de venda baseada em MRR/coortes/unit economics | Nenhum outro doc menciona valuation; GTM diz “sem preço/billing” | **Decisão:** só falar de valuation com **coorte D30 + MRR real**; hoje o número é indefinível. |

[CONFIRMADO] A para as duas fontes de cada linha; [INFERIDO] A para o custo de cada divergência.

---

## 7. O que descartar (e por quê)

### 7.1 Descartar sem dó

| Item | Por quê | Fonte |
|---|---|---|
| **Publicidade-Propaganda/ inteira, exceto o ARQ** | 12 arquivos idênticos byte-a-byte aos de Notas/ + 1 FAROL duplicado; risco de editar a cópia errada | MD5 conferido (§0) |
| **14 módulos do FAROL** (novelinhas, podcast, LinkedIn authority, SEO, trilhas, sound branding) | custo de produção altíssimo para um produto **sem analytics e sem LP**; 1 módulo (quiz) já cobre o teste | FAROL l. 54–947 |
| **Calendários com datas passadas** (FAROL 13/09–12/10; MQ1 14–23/09; beta 07/11) | prazo já venceu; publicar agora gera prova social falsa e expectativa quebrada | FAROL l. 981; MQ1 l. 449; GROWTH l. 193 |
| **“PLAUD” como canal** | é o gravador de voz da ideação; não é mídia | ARQ l. 3197; título FAROL |
| **ROAS 3x / CPL R$ 5–18 como meta** | sem pixel, sem LP e sem checkout rastreado; é número inventado ([VALIDAR_COM_EQUIPE]) | FAROL l. 1157–1165 |
| **Curso/consultoria/infoproduto (R$ 297–697 etc.)** | outro negócio (educação), dilui foco e exige produção de conteúdo; o ativo vendável é o app | ARQ l. 1225–1228, 2800 |
| **“Versa”/“VersaIA”/“Vera”** | 3 nomes concorrentes sem produto; quebra SEO/ASO e confunde LP | EST l. 18; VISUAL l. 456; ARQ §14.2 |
| **Escassez “100 vagas até 07/11”** | expirou hoje; se for usada, precisa de mecânica real e verificável | GROWTH l. 193–205 |
| **Specs que pedem “simulação hiper-realista/AR”** | o produto entrega kontext/img2img e o próprio webapp declara “fora do escopo” | index.tsx:65; IMGPRO P2 |
| **Item “Interface language: English”** | já é PT-BR hard-coded | MVP-13/10; AGENTS.md |

### 7.2 Manter, mas corrigir

- **MF4** é o único documento com **métricas exportáveis e critérios de corte** — usar como *contrato de medição*, trocando [DADO FALTANTE] por metas após 2 semanas de beta. [CONFIRMADO]
- **GTM §4.5 (objeções) e §11 (instrumentação)** são reaproveitáveis como **backlog de produto**, não como plano de mídia. [CONFIRMADO]
- **SOL08 B.2 (claims permitidos/bloqueados)** deve virar **checklist de compliance** de qualquer anúncio (é o mais próximo de uma política editorial real). [CONFIRMADO]
- **ARQ** (roadmap + preços) é útil como *hipótese de monetização*, não como plano vigente. [CONFIRMADO]

[INFERIDO] O corpus tem ~900 KB e 13 documentos únicos, mas **menos de 10% é decisão executável**: o resto é produção de conteúdo/prompt. Confiança: A.

---

## Anexo A — Assets/ (o que são)

| Arquivo | O que é | Uso provável |
|---|---|---|
| LogoFavcon/high-level-description-a-flat-vector-bra_…cover.png (2048×2048, 2,0 MB) | **Kit de marca**: monograma de dois arcos escuros com ponto lilás + wordmark “Aura ID”; favicons 16/32/180/512 px; formatos SVG/MONO/COLOR | Identidade visual base (hoje a home usa tipografia, sem logo) |
| LogoFavcon/Lia/*.png (7 arquivos, 768×1376 a 1440×2560) | **Persona-modelo “Lia”** em cenas verticais: elevador residencial, cafeteria brasileira, retrato “casual iPhone”; material de referência/storyboard da série “Antes de Mudar Tudo” (SOL08, CHAR_001 — Lia Moraes) | Criativos/UGC conceitual, não prova real |
| Videos_Propaganda/gemini_generated_video_fb6ec657.mp4 (3,4 MB) | Vídeo curto **gerado por Gemini** (nome do arquivo), sem edição/legenda no repo | Rascunho de criativo — insuficiente para anúncio |

[CONFIRMADO] A (dimensões/formato lidos; logo e Lia inspecionados visualmente). **Nenhum asset é prova de uso real** — são mockups/IA, o que colide com SOL08 l. 148 (“captura gerada ≠ produto pronto”).

---

## Anexo B — Método, limites e confiança

- **Leitura:** 13 documentos únicos (Notas 12 + ARQ), 4 planos de raiz, 8 planos .lovable/plan, e o código relevante (src/lib/stripe.functions.ts, aura-pass.tsx, index.tsx, profissionais.tsx, guia.tsx, package.json, drizzle/, supabase/config.toml, .env). Nos documentos grandes li cabeçalho, sumário, e as seções de oferta/preço/persona/funil/canais/métricas/valuation; o restante foi varrido por grep (R$, valuation, MRR, claims) — **prompts internos de produção não foram reproduzidos**.
- **Fora do workspace:** consultei ../AURA-ECOSSISTEMA apenas para realidade de billing/app (05-GTM, GUIA-PUBLICACAO, app.json, package.json, funções Stripe). Nada foi alterado lá.
- **Limitações:** (1) não há acesso a Stripe Dashboard/conta de anúncios — status live/contas é [INFERIDO]; (2) Publicidade-Propaganda/ é duplicata, então “13 arquivos” = 12 cópias + 1 único; (3) datas dos docs são de set/out/2026 e o dia da auditoria é 07/11/2026, então prazos vencidos são fato, não erro de leitura; (4) não avaliei qualidade dos prompts criativos (fora do escopo).
- **Confiança geral:** Alta para fatos de código e citações; Média para intenção estratégica dos autores; Baixa para qualquer número de mídia/valuation (todos são placeholders).
