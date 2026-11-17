# 🎨 Prompts de Identidade Visual — Aura ID
### Prontos para copiar e colar numa IA de criação visual (Ideogram, GPT Image, Midjourney etc.)

**Como usar (importante):**
1. Cole primeiro o **PROMPT 0 (Briefing Mestre)** no chat — ele fixa o contexto da marca.
2. Depois cole UM prompt por vez, **no mesmo chat** (mantém coerência entre peças).
3. Traga os resultados pra gente implementar (eu preparo os arquivos e aplico no app).

---

## PROMPT 0 — Briefing Mestre (cole primeiro, sempre)

> Você é um designer de identidade visual sênior. Vamos construir a identidade do **Aura ID**, um app/webapp brasileiro de consultoria de imagem pessoal com IA, voltado principalmente a mulheres (25–45 anos, Brasil, classes B/C), com uma trilha masculina (barbearia). Personalidade da marca: **acolhedora, ética, sofisticada-sem-esnobe, empoderadora** — o lema interno é "sugestões, nunca julgamentos". Estética atual do produto: fundo marfim quente (#FAF5EE), vinho profundo (#4A2036) como cor primária, terracota cobre (#B85C38) como destaque, tipografia serifada elegante (Cormorant Garamond) para títulos e sans humanista (Karla) para corpo. Tom visual: luz suave e dourada, texturas naturais (linho, pele, papel), nada de neon, nada de clichê tech (robôs, circuitos, azul-corporativo). Evite genérico: nada de rostos perfeitos de banco de imagem, nada de gradiente roxo-azul de IA. Todas as peças devem funcionar em fundo claro e escuro e respeitar contraste WCAG AA (≥4.5:1 para texto). Confirme que entendeu e aguarde meus pedidos, um por vez.

---

## PROMPT 1 — Logotipo principal

> Crie **3 alternativas de logotipo** para o Aura ID (mesma marca do briefing acima). Requisitos: (1) símbolo + logotipo (wordmark "Aura ID") e versão só-símbolo; (2) o símbolo deve traduzir **identidade + transformação gentil** — explore metáforas como espelho abstrato, auréola de luz, fio/traço contínuo que desenha um rosto de perfil, ou íris/olho estilizado; traço fino e elegante, remetendo a fine line tattoo e caligrafia; (3) paleta: vinho #4A2036 e terracota #B85C38 sobre marfim #FAF5EE, com opção dourado-quente #C9A227 como detalhe; (4) proporções: símbolo quadrado 1:1, lockup horizontal 3:1, versão vertical 1:2; (5) deve permanecer **legível reduzido a 24px de altura** e funcionar em uma única cor. Entregue: as 3 alternativas em mockup no header de um app (fundo claro e escuro), close do símbolo em 512px, e explique em 3 linhas o conceito de cada alternativa.

## PROMPT 2 — Versões monocromáticas e negativa

> Usando a alternativa que eu escolher do logotipo (vou colar a imagem aqui), gere o **kit de versões**: (1) monocromática vinho sobre marfim; (2) monocromática marfim sobre vinho (negativa); (3) preto sobre branco puro; (4) branca sobre preto; (5) traço (outline) 1px; (6) marca d'água com 8% de opacidade sobre foto. Mostre cada versão em 512px com margem de segurança igual à altura do símbolo em volta (delimitada com linha guia). Nenhuma versão pode perder legibilidade ou proporção — o símbolo nunca estica, nunca muda de peso de traço.

## PROMPT 3 — Favicon legível em 16×16

> Do símbolo escolhido, derive o **favicon**: versões em 16×16, 32×32 e 180×180 (apple-touch). Regras: simplificar radicalmente o símbolo mantendo reconhecimento imediato; fundo sólido vinho #4A2036 com símbolo em marfim (ou o inverso se testar melhor contraste); sem texto (wordmark ilegível nesse tamanho); cantos levemente arredondados (raio ~15%); contraste mínimo 3:1 contra fundos brancos e escuros de navegador. Entregue preview simulando aba de navegador em tema claro e escuro, lado a lado com outros favicons, para eu julgar destaque e legibilidade.

## PROMPT 4 — Paleta de cores completa com códigos

> Formalize a **paleta do Aura ID** a partir das sementes: marfim #FAF5EE (fundo claro), vinho #4A2036 (primária), terracota #B85C38 (destaque), dourado-quente #C9A227 (detalhe). Entregue tabela com códigos **HEX + RGB + OKLCH** de: (1) primária e variações 700/500/300; (2) secundária (terracota) 700/500/300; (3) neutros: 6 tons de marfim/areia para superfícies (background, card, secondary, border) + 4 tons de texto (foreground, muted, subtle, disabled) para tema claro; (4) os mesmos neutros adaptados para **tema escuro** (superfícies vinho-café escuras, texto marfim); (5) semânticas: sucesso (verde-sálvia), alerta (âmbar-mel), erro (terracota-vermelho), informação (azul-petróleo suave) — todas harmônicas com a paleta, nada de cores puras saturadas; (6) para cada cor de texto sobre cada superfície, indique a taxa de contraste e garanta ≥4.5:1 (AA) nos pares usados para texto. Formato: tabela + swatches em grade + exemplo de um card do app usando o sistema.

## PROMPT 5 — Tipografia (títulos e corpo)

> Proponha o **sistema tipográfico do Aura ID** mantendo a dupla atual como base: Cormorant Garamond (títulos, serifada elegante) e Karla (corpo, humanista). Entregue: (1) 2 fontes alternativas gratuitas (Google Fonts) para cada papel, caso precisemos substituir — com justificativa de personalidade e legibilidade; (2) escala tipográfica responsiva (mobile/desktop) em rem para: display 64/80, h1 48/60, h2 32/40, h3 24/28, corpo 16, apoio 14, rótulo 12 — com peso, entrelinha e letter-spacing de cada nível; (3) regras: itálico do display apenas no "ID" do logotipo e frases de destaque; nunca usar serifada em botões/chips; números tabulares em contagens; (4) specimen de uma frase-símbolo ("Sugestões, nunca julgamentos.") aplicada nos 6 níveis. Saída: prancha tipográfica única, limpa.

## PROMPT 6 — Ícones dos módulos (claro e escuro)

> Crie o **conjunto de ícones do Aura ID** em estilo unificado: traço fino contínuo (1.5px em grid 24), cantos suaves, remetendo a fine line, com um único detalhe em terracota por ícone. Ícones necessários (12): ✨ Maquiagem (batom abstrato/brilho), 👗 Roupas (cabide minimalista), 💇 Cabelo (onda de fio), 💈 Barba (navio de barbear estilizado), 🎬 Estúdio (claquete suave), 🗂️ Sugestões (cartas empilhadas), 👤 Meu Modelo (silhueta de perfil), 📸 Retrato (moldura com brilho), 🖤 Vitrine (vitrine/loja), 🌱 Jornada (broto), 🧬 DNA (dupla hélice suave), ⚙️ Configurações. Entregue cada ícone em: traço vinho sobre marfim, marfim sobre vinho (tema escuro) e versão monocromática; grid 24×24 e 48×48; área de toque segura marcada; e uma linha de 1 a 5 pixels do detalhe terracota escolhido por ícone. Todos devem ser reconhecíveis a 16px.

## PROMPT 7 — Ilustrações de onboarding e estados vazios

> Crie **6 ilustrações** no mesmo estilo: linha fina vinho + aquarela suave em tons terracota/areia/dourado, fundo transparente, sem rostos detalhados (silhuetas ou mãos apenas), proporção 4:3, entrega em 1200×900. Cenas: (1) onboarding passo 1 — mulher de perfil diante de espelho suave, com traço de luz aureolando o rosto; (2) onboarding — mão escolhendo entre 3 cartas de sugestão; (3) estado vazio "nada por aqui ainda" — poltrona vazia elegante com planta; (4) estado vazio de busca — lupa pousada sobre linhas de texto esmaecidas; (5) jornada pós-procedimento — linha do tempo com broto crescer em 3 estágios; (6) trilha barbearia masculina — cadeira de barbeiro clássica redesenhada em traço fino. Mesma mão, mesma luz, mesma paleta do briefing. Entregue também variação em tema escuro das duas primeiras.

## PROMPT 8 — Banners discretos e imagens de apoio

> Crie **peças de superfície** para o app, sempre discretas (ocupam no máximo 20% da área, nunca competem com conteúdo): (1) banner do guia rápido (1200×300) — traço de fio contínuo desenhando caminho com nós, terracota sobre marfim; (2) banner do Aura Pass (1200×300) — estrela de quatro pontas fina com brilho dourado, elegante e nada infantil; (3) textura de fundo sutil para o tema claro (linho/papel, 8% de presença) e para o escuro (veludo vinho, 6%), tileáveis em 512×512; (4) 4 imagens de apoio para cards de módulo (Maquiagem/Roupas/Cabelo/Barba) em still-life fotográfico ou ilustrado — paleta da marca, luz quente lateral, 800×1000 verticais. Nada de texto embutido nas imagens (texto o app desenha por cima).

## PROMPT 9 — Diretrizes mínimas de aplicação

> Compile as decisões em **1 página de diretrizes de uso da marca Aura ID**: (1) área de segurança do logotipo (altura do símbolo em todos os lados) e tamanhos mínimos (24px digital / 8mm impresso); (2) aplicações certas: header do app, splash, micropágina de profissional, embalagem de stencil; (3) **uso indevido** (monte exemplos visuais do que NÃO fazer): esticar, rotacionar, aplicar sombra/gradiente, colocar sobre foto ocupada sem overlay, trocar as cores por fora da paleta, usar o wordmark em corpo de texto; (4) regras claro/escuro: qual versão da marca usar em cada tema e sobre fotos (sempre com overlay vinho a 40%); (5) voz do texto junto à marca: frases curtas, tom acolhedor, nunca julgamento, nunca "perfect skin". Formato: prancha única A4, bilingue não — só português.

---

**Depois de gerar:** traga as imagens de volta que eu preparo os arquivos finais (SVG/PNG nos tamanhos certos), troco o favicon, aplico o logo no header/splash e instalo os ícones no app — tudo em uma sessão.
