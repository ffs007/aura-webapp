# 📖 Aura ID — Documento-Guia Completo
### Do primeiro acesso ao uso maduro: o que a ferramenta resolve, como o usuário descobre, percorre e recombina tudo o que ela oferece

**Versão:** 2.0 · **Data:** 08/11/2026 · **Base:** web-aplicação Aura ID (TanStack Start + Supabase) testada ao vivo em 08/11/2026 e auditada no código-fonte. Este documento substitui a versão anterior do guia (`AURA-ID-GUIA-COMPLETO.md`) porque corrige promessas que não correspondem ao que a ferramenta faz hoje e aprofunda os fluxos, as variações por perfil e os usos não lineares.

---

## 1. QUE PROBLEMAS A FERRAMENTA RESOLVE — E POR QUE A IDEIA FUNCIONA

### 1.1 Problemas diretos (o uso para o qual a ferramenta foi desenhada)

O Aura ID parte de uma dificuldade muito concreta e muito comum: **a pessoa sabe que quer mudar algo na própria imagem, mas não sabe o que, nem como explicar, nem como testar antes de gastar dinheiro e tempo**. A ferramenta ataca esse problema em cinco frentes.

1. **“Não sei o que combina comigo.”**
   O Estúdio cruza humor, ocasião, intensidade e as respostas do perfil visual para gerar *convites* — sugestões de maquiagem, cabelo, roupa, barba e tatuagem — em três graus: **segura, intermediária e ousada**. Não é um catálogo genérico: cada card traz uma justificativa, um passo a passo, pontos de atenção e quatro indicadores de decisão (custo, manutenção, reversibilidade e tempo de adaptação).

2. **“Quero ver em mim antes de decidir.”**
   O **Meu Modelo** cria duas imagens-base privadas (rosto e corpo) a partir de fotos do usuário; a partir daí, maquiagem, cabelo, roupa e tatuagem podem ser simulados “com a sua cara”. O **Aura Retrato** aplica uma edição diretamente sobre uma foto real. O **Provador** (quando há catálogo de loja parceira) veste a peça real no corpo do modelo. O **Copiar pra mim** da vitrine de tatuagem aplica o design no corpo da pessoa.

3. **“Não sei explicar para o profissional o que eu quero.”**
   Qualquer resultado pode virar um **briefing**: um documento com a intenção, as perguntas certas, a faixa de orçamento e espaço para o profissional responder. Em tatuagem, o briefing é uma etapa própria do projeto; em estética, ele acompanha as medições; em maquiagem/cabelo/roupa, o envio é feito a partir de uma imagem de referência gerada.

4. **“Tenho medo de errar numa escolha permanente ou cara.”**
   A ferramenta oferece medição de simetria com números (nunca notas de rosto/corpo), simulação antes/depois e, para tatuagem, uma etapa **“Antes de decidir”** com checklist de reflexão e data de revisão. Os avisos de permanência aparecem em três pontos diferentes do módulo de tatuagem.

5. **“Quem é da área se perde no WhatsApp, sem ferramenta.”**
   O profissional pode receber briefings com foto, responder com orçamento (valor e prazo), publicar uma **vitrine de designs**, gerar versão **stencil** para impressão e divulgar uma **micropágina pública** (`/p/nome`) para a bio do Instagram.

### 1.2 Problemas indiretos — a Bricolagem

O conceito que dá alma à ferramenta é a **Bricolagem**: o usuário não consome um produto fechado, ele **monta combinações com as peças que já tem dentro do app**. O “estoque de peças” é formado por:

- **inputs:** perfil visual, DNA Visual (aprendizado), fotos privadas, humor, ocasião, orçamento, restrições, catálogo de loja, intenções de tatuagem, registros de diário;
- **processamento:** templates de sugestão, regras de segurança, apresentação (segura/intermediária/ousada), IA de texto e de imagem;
- **outputs:** cards de sugestão, imagens de referência, briefings, planos de cuidado, relatórios de evolução, coleções, documentos `.md`, JSON de DNA, stencils.

A Bricolagem acontece quando o usuário **recombina** esses elementos para um objetivo que não estava previsto: o look de um casamento vira a base do look de trabalho; a intenção de tatuagem vira briefing e depois diário de cicatrização; o histórico de reações vira DNA e melhora a próxima geração; a campanha de uma estação vira coleção e depois template para a próxima.

**Três exemplos concretos de Bricolagem:**

- **Notas soltas → manual estruturado.** Uma pessoa anota referências de maquiagem em um caderno, tira fotos de looks que gosta e registra o que funcionou no dia a dia. No Aura ID, ela transforma essas anotações em respostas de perfil, gera sugestões, aprova as que fazem sentido, registra o resultado no diário da Jornada e exporta um documento com passo a passo — o caderno virou um manual pessoal consultável.
- **Campanha inteira reaproveitada.** Uma profissional de beleza atendeu dez noivas no último ano. Ela guarda as sugestões aprovadas em coleções por estação, mantém um “briefing mestre” de noiva e reaproveita os componentes (cabelo, maquiagem, cronograma, orçamento) para a próxima temporada, mudando apenas o que é específico de cada cliente.
- **Biblioteca viva de prompts e fluxos.** Um estúdio de tatuagem mantém uma vitrine com designs por estilo, uma coleção de briefings que deram certo e um caderno de cuidados que se atualiza. Cada novo projeto entra nessa biblioteca e a biblioteca inteira melhora o próximo projeto — o conhecimento tácito da equipe vira ativo organizado.

### 1.3 Por que isso funciona (a lógica do produto)

1. **Reduz o custo de começar** — o usuário não precisa saber termos técnicos nem descrever um look do zero; escolhe humor, cartão e intensidade.
2. **Torna o abstrato visível** — indicadores, imagens de referência, simulações e antes/depois transformam “acho que ficaria bom” em algo comparável.
3. **Cria continuidade** — DNA Visual, coleções, versões, jornada e histórico fazem o aprendizado acumular em vez de se perder.
4. **Conecta a decisão à execução** — o briefing é a ponte entre “gostei” e “vou fazer”, com o profissional no circuito.
5. **Respeita o ritmo** — tudo é reversível por padrão, quase tudo tem confirmação, e o discurso é de convite, não de regra.

---

## 2. A JORNADA DE DESCOBERTA — DO PRIMEIRO CLIQUE AO USO RECORRENTE

### 2.1 Primeiro contato: a porta de entrada

O usuário chega por um link (bio de uma profissional, indicação, publicação) e cai na **landing**. Ela apresenta a promessa em uma frase (“Um jeito mais gentil de se tornar quem você quer mostrar”), quatro princípios (convites não regras; sem ranking nem julgamento; contexto em primeiro lugar; seus dados, sua decisão) e dois caminhos: **Entrar** ou **Começar meu perfil**.

A landing é uma página de leitura, não de cadastro imediato: quem já tem conta entra; quem não tem é conduzido ao cadastro. O botão de opinião fica disponível em todas as telas, inclusive no login — um detalhe importante para quem chega desconfiado.

### 2.2 Cadastro e login

- **Duas portas:** **Continuar com o Google** (OAuth, leva à tela do Google) ou **e-mail + senha**.
- **Criar conta** é um toggle na mesma tela: “Primeira vez? Crie uma conta”. O título muda para “Comece com calma” e o botão para “Criar conta”.
- **Erros comuns** são traduzidos para linguagem de gente (“E-mail ou senha incorretos…”, “A senha precisa ter pelo menos 6 caracteres”, “Muitas tentativas…”). A validação de formato é a nativa do navegador (campo de e-mail, senha mínima de 8 caracteres no HTML).
- **Recuperação de senha:** hoje **não existe** link de “esqueci minha senha” nem reenvio de confirmação. O e-mail de confirmação do Supabase também não está configurado no ambiente atual. Isso significa que, na prática, quem esquece a senha fica sem caminho de volta — uma dívida conhecida e priorizada no plano de correção.
- **Sessão:** é persistida no navegador. Em outro dispositivo, o login é independente; **as trilhas escolhidas, porém, ficam presas ao navegador** (não seguem a conta), então trocar de aparelho pode reproduzir a escolha de trilhas do zero.
- **Login social:** o botão do Google não mostra estado de carregamento; um clique duplo pode abrir duas tentativas. A sessão criada é a mesma do login por e-mail.

### 2.3 Consentimento — a conversa de confiança

Antes de qualquer uso, o usuário passa por **“Antes de começarmos”**. Três chaves, **todas desligadas por padrão**:

1. **Processamento de fotos e referências** — permite enviar fotos; elas ficam privadas e podem ser excluídas.
2. **Personalização entre módulos (DNA Visual)** — permite que reações e feedback formem o DNA Visual usado em maquiagem, cabelo, roupas e tatuagem.
3. **Lembretes no app** — lembretes gentis, sem mensagens externas.

Além disso, é obrigatório marcar uma **ciência**: “Entendo que as sugestões são convites gerados por IA, não aconselhamento profissional, e que mudanças permanentes (tatuagens, químicas) devem ser validadas com um profissional.” O botão “Continuar” fica desabilitado até esse aceite.

**O que o usuário precisa saber (e a tela não conta de imediato):** existe uma quarta permissão, **“Imagens geradas por IA”**, que só aparece em **Configurações**. Ela é indispensável para Meu Modelo, Aura Retrato, provador e referências visuais. Quem não liga essa chave encontra telas que dizem “Requisitos: Fotos ✅ / Imagens de IA ❌” e um caminho para Configurações — o que funciona, mas chega tarde. A recomendação é ligar as duas chaves (fotos e imagens) no primeiro acesso se quiser experimentar os recursos visuais.

### 2.4 Trilhas — o menu que se adapta (ou deveria)

Logo depois do consentimento, o usuário escolhe **trilhas** — conjuntos de módulos que passam a aparecer no menu:

| Trilha | Ícone | Módulos que traz |
|---|---|---|
| Visual | ✨ | Maquiagem, Coleções |
| Cabelo | 💇🏾‍♀️ | Cabelo |
| Estilo | 👗 | Roupas, Tatuagens, Vitrine, Jornada |
| Barbearia | 💈 | Barba, Cabelo |

A regra anunciada é **“escolha até 3; só o que você escolher aparece no menu”**, e a escolha pode ser refeita no botão **Trilhas** a qualquer momento.

**O que realmente acontece hoje:** o seletor aceita **4 trilhas**; o menu sempre mostra itens fixos (Estúdio, Sugestões, DNA Visual, Comparar, Exportar, Configurações, Estética, Modelo, Retrato, Pass) além dos módulos das trilhas; escolher Cabelo **e** Barbearia duplica “Cabelo” no menu; e quem clica em **“Agora não”** vê o modal de trilhas **reabrir a cada navegação**, porque a dispensa não é salva. São falhas que atrapalham justamente o primeiro contato — estão no topo do plano de correção, e o usuário pode contorná-las escolhendo as trilhas de uma vez (é a única forma de o modal não voltar).

### 2.5 Onboarding — o perfil visual em dois ritmos

O onboarding pode ser feito em **dois modos**, alternáveis no topo:

- **Rápido (6 passos):** objetivos, corpo, tamanhos, cores, cabelo e limites práticos. Campos não preenchidos recebem sugestões inteligentes (“Retangular”, “M”, “40”, “Neutro”…), e alguns ficam marcados como pendentes.
- **Assistido (9 passos):** os mesmos 6 + contexto de vida (profissão, dress code, clima), gostos e restrições, e rotina/limites pessoais (opcional). Cada campo ganha dica e exemplo.

Em ambos os modos:
- **Cada campo pode ser pulado** com “Não sei · pular e retomar depois”; ele vira uma pendência e o resumo oferece um atalho para voltar (“Pendências (não impedem salvar)”).
- **O progresso é salvo automaticamente** após uma pausa curta e o usuário retoma no último passo salvo ao voltar.
- **O resumo** mostra tudo o que foi respondido, permite editar qualquer passo, exibe avisos gentis de coerência (altura/peso/calçado) e oferece “Salvar mesmo assim” quando há pendências.
- **O lado direito da tela** tem o “Seu espelho” (avatar ilustrado), “Convites de caimento” (dicas de caimento a partir das respostas) e um bloco de Retrato por IA (opcional).
- **Cada campo tem um HelpChat** para conversar com a IA e decidir a resposta.

**Atrito real no primeiro contato:** o cabeçalho do passo 1 anuncia **“18 pendente(s)”**, um número que assusta e mistura pendências de todos os passos. O formulário pergunta “Barba nas combinações” para todo mundo, mesmo sem saber ainda a apresentação. As etiquetas visíveis dos campos não estão tecnicamente associadas aos campos (leitor de tela e automação não conseguem lê-las). Nada disso impede o uso, mas cobra um preço de confiança no momento mais frágil.

### 2.6 O Estúdio — a porta de criação

Depois do onboarding, a tela inicial do uso é o **Estúdio**. Ele é organizado como uma conversa:

1. **“Como você chega hoje?”** — cinco tons: Com delicadeza · Curiosa(o) · Corajosa(o) · Pouca energia · Celebrando.
2. **“O que você quer explorar?”** — cartões: Transformação geral · Modo evento · Teste rápido · Imagem profissional · Maquiagem · Cabelo · Barba · Roupas e estilo · Planejamento de tatuagem.
3. **Ocasião ou contexto (opcional)** — texto livre com exemplo (“emprego novo mês que vem”).
4. **Intensidade desejada** — controle de sutil a marcante.
5. **Algo mais para hoje?** — texto livre para restrições (“só tenho 10 minutos de manhã”).
6. **Estrutura da sugestão** — preferência masculina/feminina.
7. **Criar minhas sugestões** — gera três convites (segura, intermediária, ousada).

Há também um convite ao **Meu Modelo** no meio da tela, um link para o **guia rápido** para quem é primeira vez e uma faixa de **Coleções salvas**.

**Como cada perfil usa o Estúdio:**
- **Iniciante:** escolhe um tom, um cartão, deixa o resto vazio e gera. Funciona — inclusive se clicar em “Criar minhas sugestões” sem escolher nada (o app gera um pacote genérico, sem avisar que nada foi selecionado).
- **Intermediário:** combina humor + cartão + ocasião + restrição e volta para gerar variações.
- **Avançado:** usa o Estúdio como ponto de partida e desvia para módulos específicos (Maquiagem, Cabelo etc.) — mas hoje o desvio **perde** humor, ocasião e intensidade escolhidos, então o avançado precisa refazer as escolhas no módulo.

### 2.7 Dicas contextuais, guia, ajuda e “biblioteca de templates”

O que existe hoje:
- **Guia rápido (`/guia`)**: cinco passos com exemplos (“Comece pelo Meu Modelo”, “Ligue suas permissões”, “Explore como quiser”, “Gere COM você”, “Quando amar o resultado”). É uma boa porta de leitura, mas promete recursos que não existem em todas as telas (contador de grátis em tudo, “usar meu modelo” em todo gerador).
- **Banner no dashboard**: aparece quando já há pacotes, mandando para o guia e para o Meu Modelo. Quem está no vazio (o iniciante) não o vê — o contrário do que seria útil.
- **HelpChat por campo no onboarding**: conversa curta com IA para ajudar a responder.
- **Textos de apoio nas telas**: cada módulo tem subtítulo, avisos e “o que acontece se…”.

O que **não** existe: tour guiado interativo, central de ajuda com busca, pop-ups de ajuda por elemento, biblioteca de templates pronta para usar, exemplos pré-preenchidos, atalhos de teclado de produto e busca global. A “biblioteca” mais próxima são as **Coleções** (agrupamentos criados pelo próprio usuário), o **Guia** e a **Vitrine** (designs de tatuagem). Na prática, o usuário constrói o próprio acervo de referências com o tempo.

### 2.8 Como as peças se conectam (o modelo mental)

O jeito mais simples de entender o Aura ID é pensar em **quatro camadas**:

1. **Quem eu sou** — perfil visual, DNA Visual, Meu Modelo.
2. **O que eu quero agora** — humor, ocasião, intensidade, intenção de tatuagem, objetivo de jornada.
3. **O que a Aura devolve** — sugestões, referências visuais, planos, briefings, relatórios.
4. **O que eu faço com isso** — salvar, aprovar/rejeitar, colecionar, comparar, exportar, enviar a um profissional, registrar no diário.

O aprendizado circula: cada reação alimenta o DNA (se permitido), e o DNA melhora as próximas devoluções. O usuário conecta as peças aos poucos: primeiro acha um resultado que gosta; depois descobre que pode guardar, comparar e exportar; depois entende que pode pedir a um profissional; por fim começa a montar os próprios padrões (coleções, briefings mestres, diários).

---

## 3. TUDO O QUE O USUÁRIO PODE FAZER — PASSO A PASSO

> Legenda de perfis: **Iniciante** = primeira semana, usa o caminho mais curto; **Intermediário** = já tem perfil e modelo, compara e organiza; **Avançado** = usa módulos combinados, briefing e jornada, experimenta variações.
> Onde a ação **não existe**, isso é dito com honestidade e indicado o contorno possível.

### 3.1 Criar

#### 3.1.1 Sugestões gerais (Estúdio)
- **Caminho típico:** Estúdio → “Como você chega hoje?” → “O que você quer explorar?” → (opcional) ocasião, intensidade, “algo mais” → **Criar minhas sugestões** → aguardar ~20 s → dashboard com três cards.
- **Alternativas:** o mesmo Estúdio é alcançável pelo logo, pelo menu “Estúdio” e por qualquer retorno ao início; o dashboard também abre o Estúdio no estado vazio.
- **Iniciante:** um tom + um cartão; ignora os campos opcionais.
- **Intermediário:** combina tom + ocasião + intensidade e gera de novo para comparar variações.
- **Avançado:** usa o campo “Algo mais para hoje?” para restrições reais (tempo, orçamento, o que odeia) e volta ao Estúdio depois de aprovar/rejeitar para “ensinar” o DNA.
- **Limitações:** não há progresso percentual, estimativa, cancelamento nem “continuar navegando”; se nada for escolhido, gera um pacote genérico sem aviso; o resultado não abre um card específico — vai para o dashboard.

#### 3.1.2 Pacotes por módulo (Maquiagem, Cabelo, Roupas, Barba, Tatuagem)
- **Caminho típico:** menu do módulo → perfil do módulo (se vazio) → tela de gerar → preencher campos → gerar → detalhe do resultado.
- **Maquiagem:** perfil de maquiagem (ocasião, intensidade, restrições), geração de look, detalhe do look com passo a passo, “Salvar”, exportar `.md`, comparar e enviar referência.
- **Cabelo:** perfil capilar (textura, cor, histórico, química), geração de plano, detalhe do plano com fases, alertas de manutenção, exportar.
- **Roupas:** perfil de estilo, geração de look, armário (peças), lacunas/cápsula, compra (o que comprar), missões de estilo, detalhe do look.
- **Barba:** perfil (comprimento, densidade, bigode, sensibilidade, tempo, orçamento) → plano determinístico (sem custo de IA) → briefing para barbeiro e prova visual de 6 estilos sobre o modelo.
- **Tatuagem:** intenção (nome, região, estilo, visibilidade, tamanho, orçamento, significado, restrições privadas) → explorar conceitos (Discreta/Intermediária/Ousada) → referências privadas → decisão (checklist + data de revisão) → briefing (com confirmação de exportação) → cuidados/diário.
- **Variações por perfil:** iniciante usa o perfil mínimo e uma geração; intermediário preenche restrições e compara dois resultados; avançado encadeia módulos (ex.: maquiagem + cabelo + roupa no mesmo dia) e usa o briefing para o profissional.
- **Limitações:** não há duplicar/renomear/agrupar; rascunho só no onboarding; alguns módulos não têm exclusão (look de maquiagem) e outros têm (cabelo, roupas, tatuagem).

#### 3.1.3 Meu Modelo (a base de tudo)
- **Caminho típico:** 👤 Modelo → “Autorizar meu modelo visual” (permissão específica) → enviar **3 a 8 fotos** (rosto e corpo, bem iluminadas) → **Gerar meu modelo** → duas imagens-base privadas.
- **Pré-requisitos:** Fotos ✅ e Imagens de IA ✅ em Configurações (o app mostra os requisitos e o caminho).
- **Cotas:** “restam 2 de 2 grátis”; a primeira geração é gratuita (rosto + corpo); regenerar faz parte do Aura Pass.
- **Alternativas:** o Estúdio, o onboarding e os detalhes de pacote convidam para o Modelo; a qualquer momento dá para **Descartar fotos** (apaga as fotos-fonte).
- **Limitações:** as fotos-fonte não entram na galeria de fotos gerenciável; “Gerar novamente” pode consumir cota sem aviso; após o resultado, não há histórico.

#### 3.1.4 Aura Retrato (editar a própria foto)
- **Caminho:** 📸 Retrato → enviar foto → descrever o que quer testar (maquiagem, cabelo, o que imaginar) → gerar edição sobre a foto real.
- **Pré-requisitos:** Fotos ✅ + Imagens de IA ✅; sem eles, a tela mostra “Requisitos” e um link para Configurações.
- **Limitações:** o resultado é um estado da tela (sem galeria/histórico); recarregar perde o resultado; o retry pode consumir uma segunda unidade de cota sem avisar.

#### 3.1.5 Jornada (plano de transformação)
- **Caminho:** 🌱 Jornada → **Novo plano** → intenção (7 cartões: confiança profissional, leveza, criatividade, nova fase, reduzir compras, usar o que tem, imagem coerente) → “com suas palavras” (opcional) → “por que agora?” (opcional, privado) → duração (mensal/trimestral) → data de início → nome → passos (6 sugestões + “Outro passo” + adicionar) → **Criar plano**.
- **Detalhe:** hoje “Criar plano” sem preencher nada **cria** um plano com a primeira intenção e a duração mensal, sem aviso. O plano pode nascer com 0 passos, e o diário exige um passo — então o usuário pode ficar sem conseguir registrar foto até adicionar um passo.
- **Depois:** o plano vira uma página com construtor de passos por semana, quadro de experimentos (Em teste/Aprovado/Não funcionou/Quero adaptar/Talvez depois/Já implementado/Não combina mais comigo), lembretes e botões de revisão/check-in/relatório.

#### 3.1.6 Estética (medição, simulação e briefing)
- **Caminho:** ✨ Estética → enviar foto → medir simetria (números, sem julgamento) → escolher procedimento e simular → comparar antes/depois com delta → gerar briefing para o profissional.
- **Limitações:** 4–5 chamadas de IA por sessão sem contador; o briefing não persiste ao recarregar; registros da jornada não podem ser editados/apagados individualmente.

#### 3.1.7 Profissional (design, vitrine, micropágina)
- **Caminho:** Profissionais → cadastro/perfil profissional → publicar design na vitrine (imagem, título, estilo, tamanho, local) → micropágina `/p/nome` → receber briefings e responder com orçamento.
- **Limitações:** a página de profissionais é órfã no menu (não há link fixo); não há busca/listagem; não é possível despublicar o perfil; pausar um design não revoga a URL pública da imagem.

### 3.2 Ver, abrir e navegar

- **Dashboard de sugestões:** filtros **Todas · Novas · Salvas · Aprovadas · Rejeitadas**; cada card mostra título, resumo, indicadores e status. Clicar abre o pacote completo.
- **Detalhe de pacote:** três variações (Segura/Intermediária/Ousada), “por que pode funcionar”, custo, manutenção, reversibilidade, adaptação, passo a passo, pontos de atenção, “Sua resposta” (Salvar/Aprovar/Bonito mas não prático/Não é para mim), Exportar, notas pessoais, “Estrutura da sugestão” (Masculino/Feminino) e “Depois de experimentar” (notas 1–5 para DNA).
- **Abas por módulo:** cada módulo tem sua navegação interna (ex.: Tatuagem tem Projetos, Intenção, Conceitos, Referências, Decisão, Briefing, Cuidados). DNA tem Resumo, Preferências, Permissões, Versões, Linha do tempo.
- **Modos de visualização:** **não há seletor de modo** (lista/grade/painel/linha do tempo). O modo é fixo por tela: cards no dashboard, grades em coleções, abas e listas nos módulos, linha do tempo em DNA/Jornada, formulário no onboarding. Quem prefere outro formato não consegue alternar.
- **Busca, favoritos e atalhos:** **não existem** hoje. O caminho mais próximo é filtrar por status no dashboard e manter coleções. Navegação por teclado funciona no básico (Tab/Enter), mas não há atalhos de produto e o modal de trilhas não fecha com Escape.

### 3.3 Editar, organizar, renomear, agrupar

- **Editar:** o que é editável varia. Onboarding pode ser refeito inteiro (e termina em `/studio`); perfil de módulo pode ser atualizado; preferências do DNA são editáveis; notas pessoais do pacote podem ser salvas; intenção de tatuagem pode ser editada; plano de jornada pode receber passos.
- **Renomear:** **não existe** de forma geral (planos, coleções, pacotes e projetos não têm “renomear”); o nome nasce na criação.
- **Agrupar:** a única forma é **Coleções** (nome + sugestões salvas/aprovadas). Não há pastas, tags ou hierarquia.
- **Reordenar:** não há arrastar para reordenar; listas são ordenadas por criação/atualização.
- **Excluir:** depende do módulo (ver matriz em §3.8); em geral há confirmação para objetos importantes e ausência de confirmação para registros íntimos/coleções — inconsistência conhecida.
- **Duplicar:** **não existe** nenhum “duplicar” no produto. O mais próximo é **“Adaptar esta ideia”** no pacote (leva ao onboarding para gerar uma variação) e gerar de novo a partir do mesmo perfil. O usuário avançado contorna criando uma nova coleção e mantendo os originais.

### 3.4 Testar, comparar e decidir

- **Testar na vida real:** o pacote tem passo a passo, pontos de atenção e “Depois de experimentar” (notas de praticidade, manutenção, autoestima, recepção das pessoas e nota emocional privada). A Jornada registra a experiência com foto e reflexão.
- **Comparar:** `/compare` permite escolher **até três sugestões** e ver lado a lado (título, custo, manutenção, reversibilidade, adaptação, três níveis e “Abrir”). Não há comparação de imagens lado a lado com zoom, nem exportação da comparação.
- **Decidir:** a tatuagem tem a etapa “Antes de decidir” com 6 checklists (tatuagem temporária, referência impressa, posição no espelho, período de reflexão, consulta a tatuador, validação de escrita/símbolo/cultura) e data de revisão. A estética tem antes/depois com delta numérico e avisos.
- **Perfis:** iniciante compara dois cards e decide pelo indicador de reversibilidade; intermediário usa o diário para registrar o teste; avançado combina briefing + decisão + retorno profissional.

### 3.5 Salvar, exportar, compartilhar

- **Salvar:** “Salvar” no pacote, “Salvar nota”, salvar perfil de módulo, salvar intenção, salvar plano, salvar reflexão. O status muda (Nova → Salva → Aprovada) e o DNA recebe o sinal (quando permitido).
- **Exportar documento:** `/export` centraliza sugestões **salvas e aprovadas** e gera um `.md` (“Baixar todas”, “Imprimir esta página” e “Baixar” por item). Também é possível exportar `.md` no detalhe de cada módulo e exportar o DNA em JSON. A exportação de roupa/cabelo tem falha conhecida (não gera arquivo) e está no topo do plano de correção.
- **Exportar imagem:** **não há** botão geral de download da imagem gerada; o Retrato não guarda o resultado em galeria.
- **Compartilhar:** **não há** botões de compartilhamento social nem link público de pacote. O compartilhamento acontece por **briefing** (link seguro com foto, 30 dias) ou pela **micropágina** do profissional. A copy de privacidade precisa ser lida com atenção: o briefing envia a foto/URL assinada ao profissional escolhido.
- **Imprimir:** a página de exportação tem “Imprimir esta página”; stencils de tatuagem têm fluxo de impressão próprio.
- **Perfis:** iniciante exporta o `.md` e imprime; intermediário leva o `.md`/briefing ao profissional; avançado organiza coleções por contexto e mantém um “arquivo morto” do que não usa mais.

### 3.6 Compartilhar com a rede (briefing e profissional)

- **Pelo pacote:** a partir de uma imagem de referência gerada, o usuário pode abrir **Enviar briefing** → escolher profissional/CEP/raio/profissão → enviar com foto. O profissional responde com orçamento (valor + prazo) ou recusa; também pode responder com uma sugestão aplicada por IA na foto da cliente.
- **Pela tatuagem:** o briefing é uma etapa do projeto, com confirmação obrigatória de exportação; o “Quero essa” da vitrine envia o design ao estúdio (exige atenção ao consentimento — ver limite no §10).
- **Pelo profissional:** recebe na aba “Recebidos” (que hoje não aparece quando vazia), responde, publica designs e compartilha a micropágina `/p/nome` na bio.
- **Perfis:** iniciante envia o primeiro briefing e espera; intermediário compara orçamentos e negocia; avançado mantém um “briefing mestre” e reaproveita respostas.

### 3.7 Restaurar, versões e histórico

- **DNA Visual** é o único lugar com **versões** e **restauração** (com confirmação), além de exportar JSON e redefinir por escopos.
- **Jornada** tem diário, linha do tempo, relatórios e antes/depois.
- **Tatuagem** tem versões de conceito (lista) e diário de cuidados.
- **Demais módulos não têm histórico nem “desfazer”**. Sobrescrever status ou apagar é definitivo.

### 3.8 Apagar (o que cada exclusão faz)

| O que se apaga | Onde | Confirmação? | O que some |
|---|---|---|---|
| Todas as fotos | Configurações | Sim, modal | Fotos e referências enviadas |
| Todas as sugestões | Configurações | Sim, modal | Pacotes gerados |
| Minha conta | Configurações | Sim, modal | Deveria remover tudo (há falha de abrangência — ver §10) |
| Plano de jornada | Jornada | Sim, modal | Passos, reflexões, fotos, relatórios, lembretes |
| Projeto de tatuagem | Tatuagem | Sim, modal | Versões, fotos, diário e lembretes do projeto |
| Coleção | Coleções | **Não** | A coleção e seus agrupamentos |
| Lembrete | Configurações/Jornada | **Não** | O lembrete |
| Reflexão / foto / registro do diário | Jornada/Tatuagem | **Não** | O registro imediatamente |
| Design da vitrine | Profissionais | `confirm()` nativo do navegador | O design (a URL pública pode continuar acessível) |
| Perfil visual / DNA | DNA | Sim, por escopo | Aprendizado e configurações |

**Regra prática para o usuário:** antes de apagar algo que não tem confirmação, exporte ou copie o que precisa; não existe “lixeira” nem “desfazer”.

### 3.9 Produtividade, atalhos e “clonagem”

O que **não** existe hoje: favoritos, clones de projetos, modelos de fluxo reutilizáveis, atalhos de teclado de produto, busca, comandos rápidos, múltipla seleção.

O que existe para acelerar:
- **Reaproveitar o perfil** — o perfil visual e o DNA fazem as gerações seguintes já saírem personalizadas.
- **“Adaptar esta ideia”** — gera uma variação a partir de um pacote.
- **Coleções** — agrupam o que é reaproveitável por contexto.
- **Duplicar informalmente:** gerar de novo a partir do mesmo perfil e comparar os resultados (não é clone real).
- **Briefing mestre (workaround):** manter um documento próprio com o texto do briefing padrão e adaptar por cliente.
- **Fluxo “estação”:** criar uma coleção por estação/campanha e ir atualizando-a.

### 3.10 Perfis e preferências de navegação

| Perfil | Como tende a navegar | O que mais usa | O que sente falta |
|---|---|---|---|
| **Iniciante** | Menu fixo, Estúdio, dashboard; evita módulos | Estúdio, Meu Modelo, guia | Orientação, menos opções, exemplos |
| **Intermediário** | Trilhas escolhidas, dashboard, comparar, coleções | Filtros, comparar, exportar, Retrato | Busca, renomear, rascunho, consistência |
| **Avançado** | Atalhos diretos por URL, módulos encadeados, briefing, jornada | Tatuagem/Estética, briefing, DNA, exportação | Versões por item, modelos reutilizáveis, automação, colaboração |

---

## 4. A EXPERIÊNCIA TÍPICA EM QUATRO ESTÁGIOS

### 4.1 Experimentação — “quero testar sem compromisso”
A pessoa entra por um link, cria a conta, lê o consentimento e escolhe trilhas. Ainda sem fotos, gera as primeiras sugestões (com pessoas fictícias), aprova uma e rejeita outra. O medo é baixo: tudo é grátis dentro da cota e quase tudo é reversível. O objetivo dessa fase é **ver o primeiro resultado com utilidade em menos de 10 minutos**. Hoje o caminho tem atritos (18 pendências, modal de trilhas) e o resultado leva ~21 s — mas a proposta aparece.

### 4.2 Consolidação — “isso funciona para mim”
A pessoa cria o **Meu Modelo**, liga as permissões de imagem, passa a usar as sugestões com a própria cara, elege trilhas fixas, começa a aprovar/rejeitar com critério (o DNA afina), usa o **Retrato** para decidir um cabelo, manda o primeiro **briefing** e recebe um orçamento. Aqui nasce a confiança: ela viu o resultado acontecer e o profissional respondeu.

### 4.3 Expansão — “vou usar isso para mais coisas”
A pessoa descobre o **Provador** com o catálogo de uma loja parceira, copia um design da **Vitrine** para o próprio corpo, cria uma **Jornada** para acompanhar um procedimento, marca retorno e registra fotos semanais. Se for profissional, cadastra o perfil, publica designs, assina um plano e divulga a micropágina. O Aura deixa de ser “um app de sugestões” e passa a ser **um conjunto de ferramentas conectadas**.

### 4.4 Maturidade — “o Aura é meu hub de imagem e conhecimento”
O uso vira recorrente: entra uma vez por semana, gera duas ou três sugestões, revisa coleções, responde/atualiza briefings, olha o retorno da jornada, atualiza o DNA. O histórico de decisões (o que funcionou), os diários de procedimento, as coleções por fase da vida e o DNA viram **memória pessoal organizada**. O profissional maduro usa a vitrine como funil, a micropágina como cartão de visita e o briefing como proposta comercial.

---

## 5. OBJETIVOS QUE A FERRAMENTA AJUDA A ALCANÇAR

### 5.1 Objetivos diretos
- Gerar textos/descrições de looks e planos.
- Estruturar ideias soltas em um plano coerente.
- Criar fluxos de prompts (perfil → estúdio → sugestão → briefing).
- Organizar informação (coleções, diário, versões do DNA).
- Documentar processos (briefing, manual de maquiagem, plano de cuidado, relatório de evolução).

### 5.2 Objetivos estratégicos
- **Ganhar tempo** — decide antes de gastar com salão, loja ou estúdio.
- **Reduzir esforço mental** — o app propõe, o usuário só escolhe.
- **Criar padrões reaproveitáveis** — coleções, DNA, briefings que se repetem.
- **Aumentar consistência de resultados** — o mesmo perfil/DNA orienta todas as gerações.
- **Registrar conhecimento tácito** — diários, decisões, feedbacks e o “porquê” de cada escolha.

### 5.3 Objetivos indiretos
- Melhorar a qualidade da comunicação interna de uma equipe de estúdio/salão.
- Facilitar o treinamento de novos membros (a vitrine e os briefings viram material de estudo).
- Criar trilhas de aprendizado a partir de fluxos de conteúdo (coleções por técnica, por estilo).
- Transformar conhecimento fragmentado (WhatsApp, caderno, memória) em **ativos organizados e consultáveis**.

---

## 6. EXEMPLOS PRÁTICOS EM DIFERENTES SITUAÇÕES

### 6.1 Beleza e imagem (o território nativo do produto)
- **Casamento:** Estúdio → Modo evento + Meu Modelo → look com cabelo e maquiagem → briefing para o salão → vestido do catálogo provado no corpo → link da loja.
- **Primeira tatuagem:** Intenção → 3 conceitos → referências privadas → decisão com checklist → briefing com simulação para o estúdio → diário de cuidados.
- **Rotina masculina:** Trilha Barbearia → perfil de barba → plano sem custo de IA → provar 6 estilos no modelo → briefing para o barbeiro.
- **Estética consciente:** medição de simetria → simulação → antes/depois com delta → briefing com medições → Jornada com fotos e retorno.
- **Salão/estúdio (negócio):** vitrine com designs → recebe briefings com simulação → responde orçamento → aplica sugestão por IA na foto da cliente → stencil → sessão.
- **Loja de roupa (parceira):** importa catálogo → cliente prova a peça no corpo → clica “ver na loja” → destaque patrocinado.

### 6.2 A mesma estrutura aplicada a outros contextos (como o modelo de “inputs → templates → outputs” se transfere)
O Aura ID é hoje uma ferramenta de identidade visual/beleza. Mas a arquitetura que ele usa — **coletar contexto → aplicar templates e regras → gerar saídas estruturadas → organizar em coleções/versões → compartilhar com um especialista** — é a mesma de vários outros domínios. Estes exemplos mostram como a lógica pode ser adaptada (sem afirmar que já existem como módulos):

- **Educação:** inputs = objetivos de aprendizagem, nível da turma, tempo disponível; templates = plano de aula, rubrica, lista de exercícios; outputs = plano de aula, material de estudo, trilha de revisão; o “briefing” vira um pedido de mentoria/revisão. A Bricolagem aparece quando o professor recombina atividades de aulas anteriores para uma turma nova.
- **Marketing:** inputs = público, oferta, orçamento, tom de voz; templates = campanha, calendário editorial, roteiro de anúncio; outputs = campanha em três intensidades (institucional, promocional, ousada); coleções por trimestre; “briefing” para agência/designer. É o caso da “campanha inteira reaproveitada” do §1.2.
- **Produto:** inputs = hipótese, persona, restrições; templates = especificação, critérios de aceite, roteiro de teste; outputs = documento de feature, plano de validação, checklist de lançamento; versões e comparação de alternativas são o equivalente ao DNA/tatuagem.
- **Pesquisa:** inputs = pergunta, fontes, método; templates = protocolo, roteiro de entrevista, matriz de síntese; outputs = relatório, mapa de evidências, próximos passos; diário de campo equivale à Jornada.
- **Atendimento ao cliente:** inputs = histórico do cliente, tom, política; templates = resposta padrão, escalonamento, follow-up; outputs = resposta, plano de retenção, registro de aprendizado; o “briefing” é o encaminhamento ao especialista.
- **Operações:** inputs = processo atual, gargalos, metas; templates = POP, checklist, plano de melhoria; outputs = procedimento documentado, treinamento, indicadores; coleções por área; versionamento do processo.

Em todos, o padrão se repete: **um estoque de peças reutilizáveis + combinações criativas + saídas sob medida**. É exatamente o conceito de Bricolagem do §1.2 — e é isso que torna a ferramenta versátil mesmo quando o conteúdo muda.

---

## 7. BOAS PRÁTICAS DE USO

### 7.1 Para tirar o máximo proveito
1. **Comece simples e evolua.** Faça o onboarding rápido, gere um resultado antes de preencher tudo. O refinamento vem depois.
2. **Crie o Meu Modelo cedo.** É o maior multiplicador de qualidade: sem ele, as imagens são de pessoas fictícias.
3. **Ligue as permissões certas.** Fotos + Imagens de IA no primeiro acesso (ou em Configurações) evitam a frustração de chegar ao Retrato/Modelo e não poder usar.
4. **Nomeie bem.** Dê nome ao plano de tatuagem (“Primeira fine line — antebraço”), ao plano da jornada (“Retorno estético — dez/2026”) e à coleção (“Casamento — mar/2027”). Nomes específicos viram memória.
5. **Documente o propósito de cada template/coleção.** Uma coleção sem critério vira depósito; um nome + uma frase de objetivo resolve.
6. **Teste com exemplos reais.** Preencha “Algo mais para hoje?” com restrições concretas (“10 min de manhã”, “odeio glitter”, “orçamento R$ 200”). As sugestões melhoram.
7. **Use o “Depois de experimentar”.** Avaliar praticidade, manutenção, autoestima e recepção das pessoas alimenta o DNA e o próximo resultado.
8. **Use versões para não perder experimentos.** No DNA, restaure com consciência; nos outros módulos, guarde o que importa em coleções antes de apagar/regenerar.
9. **Combine entradas em um mesmo fluxo.** Texto (intenção), listas (referências), restrições (orçamento/tempo) e fotos (modelo/referência) juntos geram resultados muito melhores do que um campo só.
10. **Separe fluxos por contexto.** Uma coleção para trabalho, outra para eventos, outra para tatuagem — evita misturar critérios.
11. **Revise periodicamente.** A cada estação/trimestre, olhe as coleções, apague o que não representa mais você e atualize o DNA.
12. **Exporte o que não pode perder.** O `.md` e o JSON do DNA são a cópia de segurança mais próxima de um backup.

### 7.2 Governança para equipes/estúdios
1. **Convenção de nomenclatura:** `estilo-local-tamanho` para designs; `cliente-tipo-data` para briefings; `estação-ano` para coleções.
2. **Templates “mestre”:** mantenha um design/briefing/coleção de referência para cada serviço e derive os demais dele.
3. **Registro de decisões:** dentro do projeto (notas do pacote, diário do plano), registre *por que* aquela escolha foi feita — não só o resultado.
4. **Notas explicativas:** em fluxos complexos (jornada de procedimento, plano de tatuagem), escreva em linguagem simples o que cada etapa significa para quem herdar o projeto.
5. **Revisão de acesso:** combine quem pode publicar na vitrine, quem responde briefing e quem apaga conteúdo. Hoje o app não tem papéis/permissões de equipe — a convenção precisa ser combinada fora dele.
6. **Privacidade como hábito:** fotos só entram pelo Meu Modelo/Referências; briefings expõem apenas o que você envia, com link temporário; antes de compartilhar, revise o que está no documento.

---

## 8. COBERTURA EXAUSTIVA: FLUXOS LINEARES, NÃO LINEARES, INTERRUPÇÕES E RETOMADAS

### 8.1 Fluxos lineares (do início ao fim)
- **Primeiro acesso:** landing → cadastro → consentimento (+trilhas) → onboarding → Estúdio → geração → dashboard → pacote → salvar/aprovar → exportar.
- **Tatuagem:** intenção → conceitos → referências → decisão → briefing → cuidados → diário.
- **Jornada:** plano → passos → diário → antes/depois → relatórios → retorno.
- **Estética:** foto → medição → simulação → antes/depois → briefing → jornada.
- **Profissional:** cadastro → vitrine → micropágina → recebimento de briefing → orçamento → execução.
- **Assinatura:** Pass → checkout → confirmação.

### 8.2 Fluxos não lineares (saltos, retomadas, ajustes)
- **Pular direto para um módulo:** o usuário logado pode abrir qualquer URL do módulo mesmo sem a trilha correspondente (o menu filtra, a URL não). Isso é útil para avançados e confuso para iniciantes (não há aviso de “este módulo não está na sua trilha”).
- **Voltar para ajustar o perfil:** “Rever estrutura e preferências” / “Editar estrutura e preferências” abrem o wizard inteiro e, ao terminar, levam a `/studio` — o usuário perde o contexto de onde saiu.
- **Mudar o objetivo no meio:** é possível criar uma nova intenção/plano sem apagar o anterior; a Jornada permite múltiplos planos; a tatuagem permite múltiplos projetos; a comparação e as coleções ajudam a não perder o fio.
- **Atualizar um template (coleção/briefing):** não há edição de coleção (só criar/excluir); o briefing é gerado novamente; o DNA tem versões e restauração.
- **Retomar trabalho antigo:** pacotes, planos e diários persistem na conta; versões só no DNA; rascunho só no onboarding. Demais formulários perdem o conteúdo ao sair.
- **Uso em “modo caos”:** alternar Estúdio → Tatuagem → Jornada → DNA funciona (cada módulo mantém seu estado), mas a ausência de rascunho e de busca aumenta o retrabalho.

### 8.3 Interrupções e retomadas
- **Interromper o onboarding:** ao voltar, retoma no último passo salvo (autosave a cada ~800 ms). Se a rede falhar no autosave, não há aviso.
- **Interromper a geração:** não há cancelar; se recarregar, pode ficar um estado “gerando” que bloqueia novas tentativas (com mensagem para descartar, mas sem botão correspondente).
- **Interromper o preenchimento de intenção/passos/diário/notas:** perde o que não foi salvo (não há rascunho).
- **Retomar em outro dia:** pacotes, planos, diários, coleções e versões do DNA estão lá; o que estava “em andamento” em formulários, não.
- **Sessão expirada durante a retomada:** o app redireciona ao login sem explicar; depois de entrar de novo, o usuário precisa reencontrar a tela (não há “voltar para onde eu estava”).

### 8.4 Versões e histórico
- **DNA Visual:** cada mudança gera uma versão; é possível ver a linha do tempo e restaurar (com confirmação). É o único histórico completo.
- **Tatuagem:** lista de versões de conceito por projeto.
- **Maquiagem:** “assinatura” mantém histórico de edições (edição em JSON cru, sem validação).
- **Demais módulos:** sem versões; “gerar de novo” substitui o resultado anterior na referência visual sem aviso (quando aplicável).

### 8.5 Como a ferramenta apoia a flexibilidade (e onde não apoia)
Apoia: perfil e DNA permanentes, múltiplos projetos/planos, coleções, comparação, exportação, briefing, versões do DNA, confirmação de ações críticas em várias telas, linguagem de “convite” que reduz a pressão de acertar.
Não apoia: edição/renomeação geral, duplicação, rascunho universal, undo/lixeira, versões por item, reorganização arrastando, colaboração em tempo real, papéis de equipe, busca.

---

## 9. GLOSSÁRIO E MODELO MENTAL

### 9.1 Termos canônicos (como deveriam ser usados)
| Termo | Significado único | Observação |
|---|---|---|
| **Sugestão** | resultado gerado pela IA (3 níveis: segura/intermediária/ousada) | hoje aparece também como “convite”, “pacote”, “plano”, “look” — sugerir padronizar em “sugestão” |
| **Pacote** | a página que reúne as 3 variações de uma sugestão | usado no detalhe e no export |
| **Briefing** | documento para levar/enviar ao profissional | em tatuagem/estética é etapa; em maquiagem/cabelo/roupa sai da referência |
| **Trilha** | conjunto de módulos escolhido para o menu | não confundir com “módulo” |
| **Meu Modelo** | imagens-base privadas do usuário | “avatar”/“espelho” são o mesmo conceito |
| **Aura Retrato** | edição sobre foto real | não confundir com “Retrato por IA” do onboarding |
| **DNA Visual** | aprendizado editável das reações | tem versões, permissões e redefinição |
| **Jornada** | acompanhamento pós-procedimento/transformação | diário, passos, antes/depois, relatórios |
| **Vitrine** | designs publicados por estúdios | não é catálogo de loja |
| **Aura Pass** | assinatura que libera mais imagens | distinto do “Plano Profissional” |
| **Coleção** | agrupamento de sugestões | única forma de organizar |
| **Status** | estado do item (Nova/Salva/Aprovada/Rejeitada; etc.) | cada módulo tem seu dicionário — padronizar |

### 9.2 Incoerências atuais que confundem o modelo mental
- **“Sugestão”, “convite”, “pacote”, “plano” e “look”** usados para o mesmo objeto em telas do mesmo fluxo.
- **“Trilha”** vs. “módulo” vs. “seção”; menu que promete esconder o que não foi escolhido mas mantém itens fixos.
- **“Modelo”, “avatar”, “espelho” e “retrato”** com dois sentidos (base x edição).
- **“Pass” e “Profissional”** como dois produtos de assinatura sem uma página que explique a diferença.
- **Três dicionários de status** (pacote, roupas, jornada) e **três tratamentos de confirmação**.
- **“Até 3 trilhas”** x 4 permitidas; **“só o que escolher aparece”** x itens fixos.

### 9.3 Modelo mental em uma frase
**“Eu conto quem sou e o que quero agora; a Aura devolve convites visuais; eu guardo, comparo e levo o que faz sentido para a vida real ou para um profissional — e cada reação ensina a próxima rodada.”**

---

## 10. O QUE A FERRAMENTA AINDA NÃO FAZ (leitura honesta)

Tudo abaixo foi checado contra o código em **10/11/2026**. O que já foi entregue saiu da lista; ficou só o que ainda não existe.

**Conexão e notificações**
- Sem app nativo nem modo offline completo: o app roda no navegador e precisa de internet (há aviso honesto quando a conexão cai).
- Notificações são **in-app**; sem push, e-mail ou SMS — os lembretes não chegam com o app fechado.
- E-mails transacionais (confirmação, recuperação de senha) dependem do **SMTP** configurado no ambiente; quando não está, a própria tela avisa.

**Pagamento**
- **Aura Pass:** a interface mostra preço e estados, mas o checkout/cancelamento precisa de validação de ponta a ponta no ambiente (Stripe via Edge Function).
- Geração de imagem é paga por créditos; o limite aparece nos chips de cota, mas não existe uma "carteira" detalhada.

**Organização e compartilhamento**
- Sem compartilhamento público de uma sugestão: o caminho é briefing para profissional ou exportação `.md`.
- Sem favoritos/arrastar/lixeira: organização é por **coleções** e **status**. Histórico e duplicação existem.
- Histórico = linha do tempo de sugestões do mesmo tipo (abrir/duplicar); não é versionamento da mesma linha.
- Sem colaboração/equipe, comentários ou biblioteca compartilhada.

**Criação**
- Sem cancelar geração em andamento nem barra de progresso/estimativa (a geração leva de ~20 a ~60 s).
- Sem realidade aumentada, vídeo ao vivo, simulador fotorrealista de cabelo/roupa ou tatuagem em movimento — a interface diz isso explicitamente.
- Google Docs/Drive, Sheets/Airtable e exportação automática **não conectados**.
- Planos de barba, looks de maquiagem e lembretes da jornada ainda não têm exclusão na UI; o Aura Retrato não tem galeria/download do resultado.
- Restaurar uma versão do DNA Visual não pede confirmação.

**Acessibilidade**
- Contraste AA medido em 10 telas e foco visível em todo o app; auditoria axe completa e teste com leitor de tela real ainda pendentes.

> **Já resolvido** (não está mais nesta lista): recuperação de senha, busca ⌘K, rascunhos, modo simples × completo, menu mobile, notificações in-app, exportação por tipo, exclusão de conta completa e histórico de versões. Para a leitura consolidada, ver [`RELATORIO-LANCAMENTO-AURA-ID.md`](RELATORIO-LANCAMENTO-AURA-ID.md).

---
## 11. SÍNTESE FINAL — COMO EXPLICAR O AURA ID EM 30 SEGUNDOS

O Aura ID é uma **companhia gentil para a sua identidade visual**: você conta quem é, o que quer agora e quais são seus limites; ele devolve **convites visuais** em três intensidades, com custo, manutenção, reversibilidade e um passo a passo; você guarda, compara, testa e, quando quiser, transforma em **briefing** para um profissional. Com o tempo, o **DNA Visual** aprende, o **Meu Modelo** personaliza, as **coleções** organizam e a **Jornada** acompanha. A ferramenta não decide por você e não dá notas — ela **recombina peças** (perfil, fotos, humor, referências, briefings) para que cada pessoa monte o próprio sistema de imagem, no próprio ritmo.

---

*Documento descritivo produzido a partir do teste ao vivo de 08/11/2026, atualizado em 10/11/2026 (Etapas 0–2) e da auditoria do código. Onde a ferramenta não faz o que o texto promete, isso foi dito explicitamente para preservar a confiança de quem lê.*
