# PLANO DE EXPANSÃO — Aura ID (2026-11-01)

> Especificação viva dos 3 grandes módulos aprovados em conversa. Cada um tem:
> premissa, modelo de dados, fluxo, MVP em fatias e monetização. Construir de
> baixo pra cima; cada fatia entrega valor sozinha.

---

## AS DUAS PREMISSAS-MESTRAS (valem para tudo daqui pra frente)

### PREMISSA 1 — SIMETRIA: "todo mundo busca simetria, mas não sabe"
A usuária não pede "simetria" — pede "rosto mais harmonioso", "boca mais cheia".
O profissional faz por intuição. **A Aura mede e nomeia.** Toda análise de foto
deve, quando fizer sentido, quantificar assimetrias (lábios, olhos, sobrancelhas,
linhas de expressão) e transformar a medida em linguagem de briefing
("lábio direito 8% menor → sugerir equilíbrio no preenchimento"). Isso é
diferencial defensável: ninguém no mercado entrega medida + simulação + briefing.

### PREMISSA 2 — PRIORIDADE PAGA: "distribuição é o produto"
Quem vende (lojas, marcas, profissionais) paga para aparecer primeiro:
- Loja/marca paga por prioridade nas sugestões de peças (ex.: C&A à frente)
- Profissional paga assinatura + créditos de IA para receber briefings e
  sugerir alterações
- Extensão: licenciar módulos como white-label (site da loja usando o motor)

---

## PROJETO A — REDE DE PROFISSIONAIS (pós-briefing)

**Gancho já entregue:** botão "💅 Briefing para o salão" gera o documento.

### Fatia A1 — Encontrar profissional (MVP, 1ª construível)
- Tabela `professionals`: id, user_id (auth), nome, profissão (enum: cabeleireira,
  maquiadora, tatuadora, esteticista, barbeiro), nome_do_salao, cep, lat, lng,
  raio_atendimento_km, whatsapp, instagram, bio, fotos[], verificado, ativo,
  created_at. RLS: pública leitura (ativos), dono escreve.
- Busca: a usuária informa CEP (ou geolocalização) + raio (5/10/25/50 km) →
  match por profissão ligada ao briefing (maquiagem→maquiadora etc.).
- Contato inicial: mensagem in-app com o briefing anexado (tabela
  `briefing_sends`: id, user_id, professional_id, package_id, texto_briefing,
  status: enviado/respondido/orcado/recusado).

### Fatia A2 — Orçamento e conversa
- `quotes`: briefing_send_id, professional_id, valor_estimado, prazo, obs,
  faz_o_pedido (bool), status.
- Painel da usuária: "Meus briefings enviados" com status de cada.

### Fatia A3 — Sugestão de alterações pelo profissional (o diferencial)
- Profissional responde com texto E/OU **aplicação por IA**: recebe a foto+
  briefing, escreve as alterações ("boca mais natural, volume 20% menor") →
  IA (Kontext, task `webapp.pro.adjust`) devolve a imagem ajustada + texto →
  usuária vê o antes/depois proposto pelo profissional.
- **Monetização**: cada aplicação por IA consome crédito do profissional
  (carteira de créditos; recarga via Stripe — mesmo motor do Pass).

### Fatia A4 — Assinatura do profissional
- Entitlement `pro` (mesmo core.entitlements): mensal R$ 49,90 (presença +
  briefings ilimitados de leitura) + créditos avulsos de IA.
- Micropágina pública `/p/{slug}` com portfólio, localização, avaliações.

---

## PROJETO B — GUARDA-ROUPA REAL (peças de verdade, lojas, patrocínio)

**Gancho já entregue:** botão "🔍 Buscar peça parecida" gera termos de busca.

### Fatia B1 — Descrição de compra rica (feito)
### Fatia B2 — Catálogo parceiro manual
- Tabela `products`: id, loja_id, titulo, descricao, categoria, cor, preco,
  url, imagem_url, tags[], prioridade (0=orgânico, 1=patrocinado), ativo.
- `partner_stores`: id, nome, logo, comissao_pct, prioridade, ativo.
- No look gerado: "Peças parecidas" → match por categoria+cor+tags → cards com
  preço/loja/link (utms de afiliado). Patrocinados primeiro (PREMISSA 2).

### Fatia B3 — Geração com peça real (padrão-ouro)
- A IA de vestido recebe a peça do catálogo como referência (Ideogram
  style_references / Kontext) → imagem da usuária COM a peça real → preço e
  link direto embaixo ("Vista na sua foto por R$ 129,90 na Loja X →").
### Fatia B4 — Descoberta automática
- Ingestão de feeds (Google Shopping API / afiliados: Awin, Lomadee, Amazon PA)
  → normalização → match. Meta: 0 esforço manual de catálogo.

---

## PROJETO C — PROCEDIMENTOS ESTÉTICOS (o mercado exponencial)

**Regra de ouro: NUNCA prescrever. A Aura mede, simula e informa; quem decide
é a usuária com um profissional. Disclaimer médico em toda tela.**

### Fatia C1 — Guia de captura + análise de simetria
- Escolha do procedimento (botox, preenchimento labial, peeling, harmonização...)
- A IA instrui a captura: ângulos (frontal, 3/4, perfil), distância, expressão
  neutra, luz — fotos padronizadas são requisito da medição.
- Visão (`webapp.aesthetic.analyze`): mede assimetrias por região (olhos,
  sobrancelhas, nariz, lábios, linhas frontais/nasais) e devolve
  {regiao: {assimetria_pct, observacao}} — PREMISSA 1 virando número.

### Fatia C2 — Simulação do procedimento
- Kontext sobre a foto frontal: "aplicar X na região Y com naturalidade,
  preservar identidade" → antes/depois lado a lado + medidas mudando
  ("assimetria labial: 8% → 2%").
- Disclaimer central: simulação ilustrativa, não garantia de resultado.

### Fatia C3 — Briefing do procedimento
- Documento para a avaliação profissional: procedimento desejado, medidas de
  simetria, fotos padronizadas anexadas, expectativa realista, perguntas ao
  profissional, contraindicações a relatar (alergias, gestação...).
- Conecta ao PROJETO A: encontrar profissionais de estética na região.

### Fatia C4 — Jornada pós-procedimento
- Diário de evolução (como o de tatuagem), lembretes de retorno, cuidados.

---

## ORDEM SUGERIDA (valor mais rápido primeiro)
1. **A1+A2** (rede com match e orçamento) — usa o briefing que já existe
2. **C1+C2** (simetria+simulação) — diferenciais de produto; vira case
3. **B2** (catálogo parceiro) — monetiza com lojas (PREMISSA 2)
4. **A3** (IA do profissional) — receita recorrente de crédito
5. B3/B4 e C3/C4 completam a experiência

## TÁTICA DE CONSTRUÇÃO (combinada com o Felipe)
Eu construo as fatias que couberem por sessão ("continua"); o que eu não
alcançar, ele gera o código com outra IA seguindo este documento e eu reviso,
ajusto e integro (padrão: dele o rascunho, minha a revisão de segurança/
arquitetura + typecheck + testes + deploy).
