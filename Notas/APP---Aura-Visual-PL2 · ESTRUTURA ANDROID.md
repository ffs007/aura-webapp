# 09-13 Documento Técnico: Estrutura Android do Aura ID com Expo, IA e Supabase

# PL2 · ESTRUTURA ANDROID — Aura ID / App de Autoimagem, Estilo, Beleza e Tatuagem com IA
Se já existe um projeto Expo do PL1 para iOS/web, **este documento NÃO cria um projeto novo**: ele adapta o **mesmo projeto Expo/React Native/TypeScript** para Android, mantendo código-fonte único multiplataforma e marcando ajustes **“apenas Android”** quando necessário.
Se ainda não existe projeto, a recomendação é criar um projeto único Expo + React Native + TypeScript, já preparado para Android e reaproveitável no iOS.
---
## DECISÃO 0 — STACK RECOMENDADA
### Stack recomendada
**Expo + React Native + TypeScript + Supabase + React Native Paper / Material 3**
| Opção | Curva de aprendizado | Reaproveitamento | Android + iOS | Observação |
| --- | --- | --- | --- | --- |
| **Expo + React Native + TypeScript** | Baixa para quem já usa React/TypeScript | Alta | Excelente | Melhor escolha para operador solo, Supabase e código único |
| **Kotlin + Jetpack Compose** | Alta | Baixa | Android apenas | Só vale se houver nativo profundo, background pesado ou performance extrema |
| **Expo com módulos nativos pontuais** | Média | Alta | Boa | Caminho futuro se câmera/IA/AR exigirem algo além do Expo padrão |
### Recomendação
Usar **Expo + React Native + TypeScript**, com **Supabase** no backend, porque o operador já domina React, TypeScript e Supabase, não tem experiência em Kotlin e precisa de manutenção previsível.
### Por que não Kotlin agora
Não há exigência clara, na primeira versão, de:
- serviço nativo contínuo em segundo plano;
- Bluetooth baixo nível;
- widget Android com atualização frequente;
- gravação contínua em segundo plano;
- acesso a APIs específicas de fabricante;
- processamento de imagem pesado local;
- realidade aumentada em tempo real;
- vídeo com sobreposição ao vivo.
A parte complexa — IA, imagem, recomendações e simulações — deve ficar em **backend/API**, não no celular barato.
### Decisão conservadora para o MVP
A primeira versão Android deve ser um **MVP de autoimagem com recomendações textuais, plano visual e simulações controladas**, evitando prometer geração avançada em tempo real no aparelho.
Processamento pesado de IA, geração visual avançada e análise de imagem devem ficar no backend/API.
---
# 1. IDENTIDADE DO APP
## Identidade consolidada
| Campo | Definição |
| --- | --- |
| Nome recomendado para MVP | **Aura ID** |
| Alternativas citadas | Aura IA, Aura Style, Imagem Viva, Visual Me, Estética Viva, Imagem 360, Persona Visual, Musa, Vitrine Pessoal, Espelho Inteligente |
| Nome final | **[DADO FALTANTE]** — recomendação: manter **Aura ID** para consistência |
| Application ID recomendado | `com.auraid.app` |
| Alternativas citadas | `com.seudominio.auraia`, `com.dominio.imagemviva`, `com.[DADO_FALTANTE].imagemviva` |
| O que faz em uma linha | Ecossistema/app de IA para autoimagem que ajuda pessoas a experimentar, entender e construir sua presença visual com recomendações de estilo, beleza, maquiagem, cabelo, roupas, tatuagens e planos de transformação. |
| Usuário-alvo inicial | Principalmente mulheres interessadas em beleza, estilo, maquiagem, cabelo, guarda-roupa, tatuagem, reposicionamento pessoal/profissional e autoconhecimento visual. |
| Público secundário | Homens interessados em cabelo, barba, sobrancelha, pele e imagem profissional; pessoas não binárias; adolescentes; pessoas maduras; pessoas em transição de gênero; criadoras de conteúdo; noivas; formandas; pessoas em maternidade, separação, mudança de carreira, aposentadoria ou recomeço. |
| Plataforma inicial | Android com código compartilhado Expo/React Native; iOS reaproveitado no mesmo projeto. |
| Versão mínima Android recomendada | **Android 9 / API 28** como escolha conservadora. |
| Alternativa mais ampla citada | Android 8.0 / API 26, se a prioridade for alcance maior em aparelhos populares. |
| Decisão final sugerida | **Android 9 / API 28** para equilibrar alcance, segurança, WebView mais moderno, estabilidade e manipulação de fotos/dados sensíveis. |
| Domínio sensível? | Sim. Lida com fotos pessoais, rosto, corpo, pele, cabelo, tatuagens, cicatrizes, alergias, queloide, inseguranças, religião, gênero, estado emocional e possivelmente dados biométricos/íntimos. |
## Justificativa da versão mínima
O público pode usar aparelhos populares, com:
- 2 GB a 4 GB de RAM;
- armazenamento limitado;
- Android desatualizado;
- rede móvel instável;
- medo de conceder muitas permissões;
- telas pequenas e densidade baixa.
Android 8 amplia alcance, mas Android 9/API 28 é uma escolha mais segura para um app que manipula fotos pessoais e dados sensíveis.
**Decisão conservadora:** usar Android 9/API 28 salvo validação real do público.
## Dados sensíveis tratados pelo app
O app pode lidar com:
- fotos do rosto;
- fotos do corpo;
- fotos de perfil;
- fotos em ângulo;
- fotos de tatuagens;
- fotos de cicatrizes;
- pele sensível;
- acne;
- alergias;
- histórico químico capilar;
- pós-gestação;
- medidas corporais inferidas;
- preferências culturais;
- religião/valores;
- gênero;
- autoestima;
- inseguranças;
- estado emocional;
- intenção simbólica de tatuagem;
- dados de rotina;
- imagem profissional.
Mesmo que não seja um app médico formal, a postura deve ser tratar tudo isso como **dado sensível**.
## Dados faltantes críticos
- [DADO FALTANTE] Nome definitivo do app.
- [DADO FALTANTE] Domínio final para o `applicationId`.
- [DADO FALTANTE] País de lançamento inicial.
- [DADO FALTANTE] Perfil socioeconômico predominante.
- [DADO FALTANTE] Se adolescentes serão permitidos.
- [DADO FALTANTE] Se haverá revisão jurídica/LGPD antes da publicação.
- [DADO FALTANTE] Qual provedor de IA será usado.
- [DADO FALTANTE] Se fotos serão usadas apenas para inferência individual ou também para treinamento.
- [DADO FALTANTE] Se haverá revisão humana de fotos/respostas.
- [DADO FALTANTE] Se imagens serão armazenadas permanentemente ou apenas temporariamente.
- [DADO FALTANTE] Se haverá recomendação comercial, afiliados, marcas parceiras ou marketplace.
- [DADO FALTANTE] Política comercial: assinatura, créditos, compra avulsa ou gratuito.
- [DADO FALTANTE] Se haverá grande biblioteca de imagens offline.
- [DADO FALTANTE] Volume esperado de imagens.
---
# 2. TELAS DO MVP
Máximo de 6 telas na primeira versão.
## Telas principais consolidadas
| Tela | O que o usuário faz | Dados que aparecem | Ação principal | Precisa de login? |
| --- | --- | --- | --- | --- |
| **Login / Cadastro / Consentimento** | Entra com e-mail, senha ou magic link. Aceita termos, política de privacidade e consentimentos para dados sensíveis, fotos e IA. | Campos de login, aviso de privacidade, termos, consentimento, limites do app, aviso de que não substitui profissional. | Entrar ou criar conta. | Não |
| **Início / Plano Atual** | Escolhe por onde começar: maquiagem, cabelo, roupas/estilo, tatuagem, transformação geral ou modo emocional rápido. | Cards de módulos, modos rápidos, plano ativo, recomendações recentes, status offline. | Iniciar jornada ou abrir plano/recomendação. | Sim |
| **Perfil Visual / Diagnóstico Visual / DNA Visual** | Preenche preferências, objetivos, limites, rotina, orçamento, estilo, pele/cabelo e fotos opcionais. | Paleta preferida, cores rejeitadas, estilos, objetivos, ocasiões, orçamento, manutenção, alergias, pele, cabelo, restrições, fotos opcionais. | Salvar perfil visual/diagnóstico. | Sim |
| **Conversa Guiada / Formulário Inteligente** | Responde perguntas da IA em linguagem simples e acolhedora sobre intenção, rotina, contexto e fase de vida. | Perguntas, respostas parciais, modo rápido/aprofundado, estado offline, rascunho salvo. | Gerar recomendações. | Sim |
| **Recomendações / Looks / Briefings** | Visualiza propostas práticas: segura, intermediária e ousada; looks, maquiagem, cabelo, roupas, checklist e tatuagem textual. | Título, descrição, impacto visual, custo, manutenção, ousadia, reversibilidade, tempo de adaptação, receita prática, substituições e alertas. | Salvar, descartar, adaptar ou pedir variação. | Sim |
| **Galeria / Histórico / Coleções Salvas / Plano de Transformação** | Revisa recomendações salvas, descartadas, coleções, checklists e etapas de transformação. | Histórico, favoritos, feedback, plano ativo, status de teste, etapas concluídas, dados em cache. | Reabrir, comparar, registrar feedback ou marcar etapa. | Sim |
## Observações por tela
### Login / Cadastro / Consentimento
Deve explicar:
- uso de IA;
- uso de fotos;
- armazenamento em nuvem;
- dados sensíveis;
- limites do app;
- política de exclusão;
- que recomendações não substituem dermatologista, alergista, cabeleireiro, tatuador, consultor de imagem, psicólogo ou profissional habilitado.
Consentimentos separados recomendados:
- termos de uso;
- política de privacidade;
- uso de dados pessoais;
- uso de fotos;
- análise por IA;
- armazenamento em nuvem;
- notificações;
- eventual compartilhamento com profissional humano, se existir.
### Início / Plano Atual
Pode oferecer modos como:
- “Preciso de algo rápido”;
- “Quero explorar ideias”;
- “Tô cansada”;
- “Quero algo seguro”;
- “Quero ousar um pouco”;
- “Não sei o que combina comigo”;
- “Maquiagem”;
- “Cabelo”;
- “Roupas/estilo”;
- “Tatuagem”;
- “Transformação geral”.
### Perfil Visual / Diagnóstico Visual
Deve ter:
- autosave local;
- poucos campos obrigatórios;
- mensagens claras de erro;
- suporte offline;
- confirmação ao sair com dados não salvos;
- opção de continuar sem foto;
- linguagem não julgadora.
### Conversa Guiada
Deve preservar rascunho se:
- a internet cair;
- o app for fechado;
- o Android matar o app;
- a usuária tocar em voltar sem querer.
### Recomendações
Cada recomendação deve explicar:
- objetivo visual;
- ocasião;
- formalidade;
- clima;
- conforto;
- substituições;
- custo;
- manutenção;
- reversibilidade;
- nível de ousadia;
- tempo de adaptação;
- riscos de desconforto;
- alternativas acessíveis.
As recomendações devem ser apresentadas como **hipóteses, convites e testes**, nunca como correções obrigatórias.
### Galeria / Histórico / Plano
Permite marcar:
- salvo;
- descartado;
- em teste;
- aprovado;
- não funcionou;
- quero adaptar;
- talvez depois;
- já implementei;
- não combina mais comigo;
- registrar feedback pós-uso.
---
## FICA PARA DEPOIS
| Tela/Módulo | O que o usuário faz | Dados que aparecem | Ação principal | Motivo para V2 |
| --- | --- | --- | --- | --- |
| **Simulação Visual Avançada** | Faz upload de foto e recebe antes/depois visual. | Imagens geradas, variações, comparação lado a lado. | Gerar simulação. | IA visual pesada, privacidade e custo. |
| **Armário / Guarda-roupa Digital** | Cadastra peças próprias e combinações. | Fotos de roupas, categorias, cores, ocasiões. | Montar look. | Exige classificação, busca local e muitas imagens. |
| **Trilhas Educativas / Biblioteca** | Estuda imagem pessoal, beleza, maquiagem, tatuagem e estilo. | Aulas, glossário, microlições, exercícios. | Iniciar trilha. | Depende de produção editorial. |
| **Eventos Marcantes / Modo Evento Completo** | Planeja casamento, formatura, viagem, reunião, entrevista etc. | Cronograma, checklist, maquiagem, roupa, cabelo e acessórios. | Criar plano de evento. | Pode vir após MVP principal. |
| **Manual Personalizado de Maquiagem** | Consulta passo a passo detalhado. | Ordem de aplicação, ferramentas, produtos e faixas de preço. | Seguir tutorial. | Conteúdo extenso. |
| **Guia para Salão / Profissional** | Gera instrução técnica para cabeleireiro/tatuador/maquiador. | Fotos, técnica, frase pronta, resultado esperado. | Exportar guia. | Exige responsabilidade maior e UX específica. |
| **Feedback Pós-Uso Avançado** | Registra o que funcionou ou não. | “Base marcou linhas”, “batom saiu rápido”, “blush não durou”. | Refinar IA. | Pode começar simples no histórico. |
| **Plano de Transformação Mensal/Trimestral** | Segue jornada longa. | Mês 1, mês 2, progresso, etapas emocionais. | Concluir etapas. | Bom para retenção, não essencial no MVP. |
| **Missões Gamificadas** | Cumpre desafios graduais. | Missões, conquistas, feedback emocional. | Registrar missão. | Requer ciclo de engajamento. |
| **Comunidade** | Compartilha antes/depois, relatos e referências. | Posts, comentários, filtros, denúncias. | Publicar/participar. | Alto risco de moderação e toxicidade. |
| **Marketplace / Profissionais / Produtos** | Encontra produtos, tatuadores, cabeleireiros, maquiadores. | Portfólios, preços, agenda, avaliações, links. | Comprar/agendar. | Exige operação, pagamentos e responsabilidade jurídica. |
| **Administração / Curadoria** | Equipe gerencia prompts, categorias, denúncias e segurança. | Prompts, flags, métricas, moderação. | Moderar conteúdo. | Só se houver equipe. |
| **Agenda / Calendário** | Integra eventos do calendário. | Eventos, lembretes, planos visuais. | Criar alerta. | Permissão extra e complexidade. |
| **AR / Câmera em Tempo Real** | Visualiza tatuagem/look/maquiagem ao vivo. | Preview em tempo real. | Ajustar visual. | Pode exigir SDK pesado ou nativo. |
| **Web app completo** | Usa desktop/tablet para guias e coleções. | Biblioteca, planos, coleções. | Revisar e organizar. | Pode reaproveitar depois. |
---
# 3. PADRÃO VISUAL E COMPORTAMENTO DE SISTEMA
## Design
Usar **Material Design 3** com `react-native-paper`.
Diretrizes:
- interface leve;
- cores suaves;
- contraste adequado;
- cards simples;
- botões grandes;
- poucas sombras;
- gradientes discretos, se usados;
- sem blur pesado;
- sem animações complexas;
- sem carrosséis pesados;
- sem vídeos embutidos no MVP;
- listas com `FlatList`/virtualização;
- imagens sob demanda;
- texto acolhedor, claro e sem julgamento.
## Tema claro e escuro
Arquivos:
- `src/theme/lightTheme.ts`
- `src/theme/darkTheme.ts`
- `src/theme/theme.ts`
Regras:
- tema claro como padrão;
- tema escuro seguindo preferência do sistema;
- futuramente permitir alternância manual;
- alto contraste sempre que possível;
- não depender apenas de cor para indicar status;
- estados visuais claros: carregando, vazio, offline, erro, sucesso.
## Linguagem emocionalmente segura
Evitar:
- “Seu rosto precisa...”
- “Corrigir defeitos...”
- “Disfarçar problema...”
- “Melhorar imperfeição...”
- “Seu corpo não combina...”
Preferir:
- “Se você quiser explorar...”
- “Uma versão mais suave seria...”
- “Podemos testar aos poucos...”
- “Essa opção comunica...”
- “Você pode salvar e decidir depois...”
- “Essa alternativa pode funcionar se fizer sentido para você...”
## Safe area
Usar:
- `SafeAreaProvider`;
- `SafeAreaView`;
- cuidado com status bar;
- cuidado com notch;
- cuidado com barra de gestos Android;
- `KeyboardAvoidingView` ou equivalente em formulários.
Nenhum botão ou conteúdo importante deve ficar sob:
- status bar;
- notch;
- barra de navegação;
- teclado;
- área de gestos.
## Botão físico / gesto de voltar — apenas Android
| Tela/Situação | Comportamento do voltar Android |
| --- | --- |
| Login sem sessão | Fecha o app se não houver histórico. |
| Onboarding/Consentimento | Volta para etapa anterior ou fecha app se for primeira tela. |
| Início | Fecha o app ou envia para segundo plano. Pode pedir confirmação se houver operação pendente. |
| Perfil Visual com alterações não salvas | Exibe diálogo: “Você tem alterações não salvas. Deseja sair mesmo assim?” |
| Conversa Guiada com respostas não enviadas | Pede confirmação antes de sair. |
| Recomendações | Volta para Conversa Guiada ou Início. |
| Galeria / Histórico | Volta para Início. |
| Plano de Transformação | Volta para Início. |
| Tatuagem / Briefing com rascunho | Pede confirmação se houver alteração não salva. |
| Modal aberto | Fecha apenas o modal. |
| Upload/análise em andamento | Pede confirmação se houver risco de perda. |
## Acessibilidade
Obrigatório desde o MVP:
- botões com área mínima de toque de 48dp;
- `accessibilityLabel` em todo botão;
- `accessibilityHint` quando a ação não for óbvia;
- inputs com label claro;
- suporte a fonte ampliada;
- layout que não quebra com fonte grande;
- contraste mínimo adequado;
- suporte a leitor de tela;
- mensagens textuais para erro, sucesso e offline;
- não depender apenas de cor;
- evitar texto embutido em imagem;
- linguagem clara para usuárias ansiosas, inseguras ou pouco familiarizadas com tecnologia.
## Performance visual
Evitar:
- sombras exageradas;
- listas sem virtualização;
- imagens gigantes;
- animações complexas;
- transições caras;
- blur intenso;
- renderizar guias longos de uma vez;
- dependências pesadas.
Usar:
- `FlatList`;
- paginação;
- lazy loading;
- skeleton/loading leve;
- WebP/SVG para assets;
- imagens comprimidas;
- thumbnails;
- cache controlado.
---
# 4. ÁRVORE DE ARQUIVOS
Estrutura recomendada para projeto Expo/React Native com TypeScript.
```txt
app.json
```
Configuração Expo, nome do app, ícone, splash, Android package `com.auraid.app`, permissões e versionamento.
```txt
eas.json
```
Perfis de build EAS: development, preview e production.
```txt
package.json
```
Scripts, dependências, comandos de teste e build.
```txt
tsconfig.json
```
TypeScript estrito.
```txt
babel.config.js
```
Configuração Babel do Expo.
```txt
metro.config.js
```
Configuração Metro para assets, aliases ou SVG, se necessário.
```txt
.env.example
```
Variáveis esperadas sem valores reais.
```txt
.gitignore
```
Ignora `.env`, keystores, builds locais e arquivos sensíveis.
```txt
src/App.tsx
```
Entrada principal com providers de tema, Supabase, navegação e Safe Area.
```txt
src/navigation/AppNavigator.tsx
```
Decide entre fluxo autenticado e não autenticado.
```txt
src/navigation/AuthNavigator.tsx
```
Rotas de consentimento, login e cadastro.
```txt
src/navigation/MainNavigator.tsx
```
Rotas internas: Início, Perfil Visual, Conversa, Recomendações, Histórico, Detalhe, Tatuagem.
```txt
src/navigation/navigationTypes.ts
```
Tipos TypeScript das rotas e parâmetros.
```txt
src/navigation/androidBackHandler.ts
```
Tratamento específico do botão voltar no Android.
```txt
src/theme/lightTheme.ts
```
Tema claro Material 3.
```txt
src/theme/darkTheme.ts
```
Tema escuro Material 3.
```txt
src/theme/theme.ts
```
Exporta tema conforme preferência do sistema.
```txt
src/theme/spacing.ts
```
Espaçamentos padronizados.
```txt
src/theme/typography.ts
```
Escala de fonte e estilos de texto.
```txt
src/theme/accessibility.ts
```
Constantes de toque mínimo, contraste e acessibilidade.
```txt
src/components/AppButton.tsx
```
Botão padrão acessível, com loading e disabled.
```txt
src/components/AppTextInput.tsx
```
Campo de texto com label, erro e acessibilidade.
```txt
src/components/AppCard.tsx
```
Card leve para módulos, recomendações e planos.
```txt
src/components/ScreenContainer.tsx
```
Container padrão com safe area, padding e suporte a teclado.
```txt
src/components/ConfirmExitDialog.tsx
```
Modal para confirmar saída com alterações não salvas.
```txt
src/components/OfflineBanner.tsx
```
Faixa indicando ausência de conexão ou sincronização pendente.
```txt
src/components/LoadingState.tsx
```
Estado de carregamento reutilizável.
```txt
src/components/ErrorState.tsx
```
Estado de erro com botão de tentar novamente.
```txt
src/components/EmptyState.tsx
```
Estado vazio para histórico, recomendações e perfil incompleto.
```txt
src/components/ImpactIndicator.tsx
```
Indicadores de impacto, custo, manutenção, ousadia e reversibilidade.
```txt
src/components/PermissionExplanationCard.tsx
```
Explica por que uma permissão será solicitada antes do diálogo nativo.
```txt
src/components/ImagePickerButton.tsx
```
Botão para tirar/selecionar foto com permissão contextual.
```txt
src/features/auth/OnboardingConsentScreen.tsx
```
Tela de onboarding, privacidade, consentimentos e limites do app.
```txt
src/features/auth/LoginScreen.tsx
```
Tela de login/cadastro com Supabase Auth.
```txt
src/features/home/HomeScreen.tsx
```
Tela inicial com módulos, modos emocionais e plano atual.
```txt
src/features/profile/VisualProfileScreen.tsx
```
Tela do DNA Visual/Diagnóstico Visual.
```txt
src/features/profile/components/ObjectiveSelector.tsx
```
Seleciona objetivos: confiante, criativa, clássica, profissional etc.
```txt
src/features/profile/components/OccasionSelector.tsx
```
Seleciona ocasiões: trabalho, casamento, entrevista, viagem etc.
```txt
src/features/profile/components/SkinProfileForm.tsx
```
Campos opcionais de pele, alergias e sensibilidade.
```txt
src/features/profile/components/HairProfileForm.tsx
```
Campos de cabelo, rotina, histórico químico e manutenção.
```txt
src/features/profile/components/StylePreferencesForm.tsx
```
Preferências de estilo, orçamento e limites pessoais.
```txt
src/features/conversation/GuidedConversationScreen.tsx
```
Conversa/formulário guiado com autosave local.
```txt
src/features/recommendations/RecommendationsScreen.tsx
```
Lista de recomendações geradas.
```txt
src/features/recommendations/RecommendationDetailScreen.tsx
```
Detalhe da recomendação com lógica, alternativas e feedback.
```txt
src/features/recommendations/components/RecommendationCard.tsx
```
Card de recomendação.
```txt
src/features/recommendations/components/RecommendationStatusPicker.tsx
```
Marca recomendação como em teste, aprovada, descartada etc.
```txt
src/features/recommendations/components/SafetyAlertBox.tsx
```
Avisos de segurança: alergia, pele sensível, tatuagem, não diagnóstico médico.
```txt
src/features/history/HistoryScreen.tsx
```
Histórico/galeria de recomendações salvas e descartadas.
```txt
src/features/history/SavedCollectionsScreen.tsx
```
Coleções salvas e itens disponíveis offline.
```txt
src/features/history/SavedItemCard.tsx
```
Card para item salvo.
```txt
src/features/transformation/TransformationPlanScreen.tsx
```
Plano de transformação gradual.
```txt
src/features/transformation/TransformationStepCard.tsx
```
Card de etapa do plano.
```txt
src/features/transformation/ProgressTimeline.tsx
```
Linha do tempo do plano.
```txt
src/features/tattoo/TattooPlannerScreen.tsx
```
Planejamento de tatuagem: área do corpo, estilo, dor, orçamento e briefing.
```txt
src/features/tattoo/TattooBriefingScreen.tsx
```
Briefing para tatuador com recomendações.
```txt
src/features/tattoo/components/BodyAreaSelector.tsx
```
Seleciona área do corpo.
```txt
src/features/tattoo/components/TattooStyleSelector.tsx
```
Seleciona estilo: minimalista, old school, aquarela, fine line, blackwork etc.
```txt
src/services/supabase/supabaseClient.ts
```
Cliente Supabase com URL e anon key via ambiente.
```txt
src/services/supabase/types.ts
```
Tipos TypeScript das tabelas Supabase.
```txt
src/services/supabase/authService.ts
```
Login, logout, sessão e usuário atual.
```txt
src/services/supabase/profileService.ts
```
CRUD de perfil e perfil visual.
```txt
src/services/supabase/recommendationService.ts
```
CRUD de sessões guiadas, recomendações e feedback.
```txt
src/services/supabase/mediaService.ts
```
Upload, listagem e exclusão lógica de imagens.
```txt
src/services/supabase/tattooService.ts
```
CRUD de planos de tatuagem e briefings.
```txt
src/services/supabase/storage.ts
```
Funções para upload, URL assinada e exclusão no Supabase Storage.
```txt
src/services/ai/aiRecommendationService.ts
```
Chamada ao backend/API de IA sem expor segredo no app.
```txt
src/services/ai/aiPromptBuilders.ts
```
Constrói payloads/prompts estruturados para IA.
```txt
src/services/ai/safetyRules.ts
```
Regras para evitar diagnóstico médico, julgamento corporal e recomendações inseguras.
```txt
src/services/network/networkService.ts
```
Detecta conexão, tipo de rede e mudanças online/offline.
```txt
src/services/permissions/permissionService.ts
```
Centraliza câmera, galeria e notificações.
```txt
src/services/notifications/notificationService.ts
```
Lembretes locais/push opcionais.
```txt
src/services/storage/localCache.ts
```
Cache local com AsyncStorage.
```txt
src/services/storage/offlineQueue.ts
```
Fila de operações pendentes.
```txt
src/services/storage/cachePolicy.ts
```
Política de expiração e limpeza.
```txt
src/services/sync/syncService.ts
```
Sincronização cache/Supabase.
```txt
src/services/sync/conflictResolution.ts
```
Regras conservadoras de conflito.
```txt
src/services/logging/safeLogger.ts
```
Logs sem fotos, respostas sensíveis, tokens ou caminhos identificáveis.
```txt
src/hooks/useAuth.ts
```
Hook de sessão e autenticação.
```txt
src/hooks/useNetworkStatus.ts
```
Hook de online/offline.
```txt
src/hooks/useOfflineSync.ts
```
Processa fila offline ao voltar conexão.
```txt
src/hooks/useVisualProfile.ts
```
Leitura/escrita do DNA Visual com cache.
```txt
src/hooks/useGuidedConversation.ts
```
Estado da conversa guiada, autosave e payload para IA.
```txt
src/hooks/useRecommendations.ts
```
Listagem, criação, salvamento, descarte e feedback.
```txt
src/hooks/useMediaAssets.ts
```
Upload/listagem/exclusão de fotos e simulações.
```txt
src/hooks/useTattooPlans.ts
```
Cria, salva e sincroniza planos de tatuagem.
```txt
src/hooks/useSavedCollections.ts
```
Coleções salvas e snapshots offline.
```txt
src/hooks/useTransformationPlan.ts
```
Plano de transformação e etapas.
```txt
src/utils/validation.ts
```
Validações de formulários.
```txt
src/utils/date.ts
```
Formatação de datas.
```txt
src/utils/privacy.ts
```
Mascaramento de logs e limpeza de dados sensíveis.
```txt
src/utils/accessibility.ts
```
Helpers de labels, hints e foco acessível.
```txt
src/utils/imageCompression.ts
```
Compressão local de imagem antes de upload.
```txt
src/utils/errors.ts
```
Padronização de erros exibidos ao usuário.
```txt
src/constants/modules.ts
```
Módulos: maquiagem, cabelo, roupas/estilo, tatuagem, transformação geral.
```txt
src/constants/recommendationScales.ts
```
Escalas baixo/médio/alto, fácil/moderado/difícil.
```txt
src/constants/privacyCopy.ts
```
Textos curtos de consentimento e privacidade.
```txt
src/types/domain.ts
```
Tipos de domínio: perfil visual, recomendação, plano, status.
```txt
src/__tests__/LoginScreen.test.tsx
```
Teste básico de login.
```txt
src/__tests__/HomeScreen.test.tsx
```
Teste da tela inicial.
```txt
src/__tests__/OfflineBanner.test.tsx
```
Teste do banner offline.
```txt
src/__tests__/VisualProfileScreen.test.tsx
```
Teste de formulário e salvamento local.
```txt
src/__tests__/GuidedConversationScreen.test.tsx
```
Teste de rascunho da conversa guiada.
```txt
src/__tests__/RecommendationsScreen.test.tsx
```
Teste de recomendações mockadas e indicadores.
```txt
src/__tests__/offlineQueue.test.ts
```
Teste da fila offline.
```txt
src/__tests__/conflictResolution.test.ts
```
Teste das regras de conflito.
## Camadas
| Camada | Pastas |
| --- | --- |
| Apresentação | `features/`, `components/`, `navigation/`, `theme/` |
| Dados | `hooks/`, `services/supabase/`, `services/storage/`, `services/sync/` |
| Infra/config | `app.json`, `eas.json`, `.env.example`, `services/network/`, `services/permissions/`, `services/notifications/` |
| Testes | `src/__tests__/` |
---
# 5. DADOS E OFFLINE
## Entidades Supabase consolidadas
Modelo inicial conservador. Ajustar após definição jurídica/comercial.
---
## Tabela: `profiles`
Perfil básico do usuário.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | Igual a `auth.users.id` |
| `display_name` | text | Não | Nome exibido |
| `email` | text | Não | Pode vir do Auth; evitar duplicar se não precisar |
| `birth_year` | integer | Não | Evitar data completa no MVP |
| `gender_identity` | text | Não | Sensível; opcional |
| `city` | text | Não | Contexto/clima/cultura |
| `country` | text | Não | País |
| `region` | text | Não | Alternativa a cidade/país |
| `privacy_consent_at` | timestamp | Não | Aceite da política |
| `accepted_terms_at` | timestamp | Não | Aceite dos termos |
| `accepted_image_processing_at` | timestamp | Não | Consentimento para imagem |
| `accepted_sensitive_data_at` | timestamp | Não | Consentimento para dados sensíveis |
| `created_at` | timestamp | Sim | Default `now()` |
| `updated_at` | timestamp | Sim | Atualizado em alteração |
| `deleted_at` | timestamp | Não | Soft delete |
### RLS
- Usuário lê apenas seu próprio perfil.
- Usuário cria apenas perfil com `auth.uid() = id`.
- Usuário atualiza apenas seu próprio perfil.
- Não permitir leitura pública.
- Admin/service role apenas para suporte autorizado.
---
## Tabela: `visual_profiles`
DNA visual, preferências e diagnóstico visual.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK `profiles.id` |
| `preferred_colors` | jsonb | Não | Cores preferidas |
| `rejected_colors` | jsonb | Não | Cores rejeitadas |
| `favorite_styles` | jsonb | Não | Estilos favoritos |
| `rejected_styles` | jsonb | Não | Estilos rejeitados |
| `image_objectives` | jsonb | Não | Confiante, criativa, clássica, profissional etc. |
| `image_goals` | jsonb | Não | Objetivos pessoais/profissionais |
| `occasions` | jsonb | Não | Trabalho, festa, casamento, entrevista etc. |
| `social_contexts` | jsonb | Não | Contextos sociais |
| `professional_contexts` | jsonb | Não | Dress code/restrições |
| `body_areas_preferences` | jsonb | Não | Áreas que valoriza/prefere preservar |
| `comfort_priorities` | jsonb | Não | Conforto, mobilidade, discrição |
| `professional_restrictions` | text | Não | Restrições de trabalho |
| `skin_type` | text | Não | Oleosa, seca, mista, sensível etc. |
| `allergies` | jsonb | Não | Sensível |
| `makeup_skill_level` | text | Não | Iniciante/intermediário/avançado |
| `available_time_minutes` | integer | Não | Tempo disponível |
| `hair_type` | text | Não | Liso, ondulado, cacheado, crespo etc. |
| `hair_history` | jsonb | Não | Química, calor, descoloração, transição |
| `change_tolerance` | text | Não | baixa, média, alta |
| `maintenance_preference` | text | Não | baixa, média, alta |
| `budget_level` | text | Não | baixo, médio, alto |
| `budget_range` | text | Não | Alternativa textual |
| `boldness_level` | text | Não | baixo, médio, alto |
| `emotional_intention` | text | Não | Intenção emocional |
| `emotional_feedback` | jsonb | Não | Feedbacks subjetivos |
| `privacy_flags` | jsonb | Não | Preferências de uso de dados |
| `status` | text | Sim | `draft`, `ready`, `archived` |
| `version` | integer | Sim | Controle de conflito |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
### RLS
- Usuário lê apenas seu próprio DNA visual.
- Usuário escreve apenas seu próprio DNA visual.
- Não permitir leitura pública.
- Se houver equipe humana analisando dados, isso precisa aparecer na política de privacidade. **[DADO FALTANTE]**
---
## Tabela: `guided_sessions`
Sessões de conversa guiada/formulário inteligente.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `module` | text | Sim | maquiagem, cabelo, estilo, tatuagem, geral |
| `mode` | text | Sim | rápido ou aprofundado |
| `intention` | text | Não | Ex.: “quero parecer mais profissional sem perder autenticidade” |
| `answers` | jsonb | Não | Respostas estruturadas |
| `emotional_state` | text | Não | Sensível; opcional |
| `occasion` | text | Não | Contexto/evento |
| `status` | text | Sim | draft, submitted, completed |
| `version` | integer | Sim | Controle de conflito |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
### RLS
- Usuário acessa apenas suas sessões.
- Escrita apenas pelo dono.
- Service role pode processar para IA via backend seguro.
---
## Tabela: `recommendations`
Recomendações geradas por IA/manual/template.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `session_id` | uuid | Não | FK `guided_sessions.id` |
| `visual_profile_id` | uuid | Não | FK `visual_profiles.id` |
| `module` | text | Sim | maquiagem, cabelo, estilo, tatuagem, geral |
| `type` | text | Não | look, cabelo, maquiagem, estilo, compra, plano |
| `category` | text | Não | makeup, hair, style, event, general |
| `title` | text | Sim | Título curto |
| `summary` | text | Não | Resumo curto |
| `description` | text | Sim | Descrição acolhedora |
| `visual_message` | text | Não | O que comunica |
| `reasoning` | text | Não | Explicação da lógica |
| `occasion` | text | Não | Contexto |
| `formality_level` | text | Não | casual, médio, formal |
| `climate_version` | text | Não | verão, inverno, chuva etc. |
| `items` | jsonb | Não | Peças, acessórios, cores |
| `content` | jsonb | Não | Passos, produtos, alertas, checklist |
| `impact_level` | text | Não | baixo, médio, alto |
| `cost_level` | text | Não | baixo, médio, alto |
| `maintenance_level` | text | Não | baixa, média, alta |
| `boldness_level` | text | Não | baixa, média, alta |
| `reversibility_level` | text | Não | fácil, moderada, difícil |
| `adaptation_time` | text | Não | curto, médio, longo |
| `professional_validation_level` | text | Não | baixa, média, alta |
| `implementation_recipe` | jsonb | Não | Passos práticos |
| `accessible_alternatives` | jsonb | Não | Alternativas acessíveis |
| `alternatives` | jsonb | Não | Substituições |
| `risks` | jsonb | Não | Riscos de desconforto |
| `safety_notes` | jsonb | Não | Pele, alergia, tatuagem etc. |
| `source` | text | Sim | ai, manual, template |
| `ai_provider` | text | Não | Provedor usado |
| `status` | text | Sim | generated, saved, discarded, tested, em_teste, aprovado, nao_funcionou |
| `user_feedback` | jsonb | Não | Curtida, descarte, pós-uso |
| `version` | integer | Sim | Conflito/offline |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
### RLS
- Usuário lê apenas suas recomendações.
- Usuário salva/descarta/atualiza feedback apenas das próprias recomendações.
- Geração por IA ocorre no backend/API, não com chave secreta no app.
---
## Tabela: `media_assets`
Fotos, imagens e futuras simulações.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `session_id` | uuid | Não | FK |
| `visual_profile_id` | uuid | Não | FK |
| `recommendation_id` | uuid | Não | FK |
| `storage_path` | text | Sim | Caminho no Supabase Storage |
| `media_type` | text | Sim | photo, simulation |
| `image_type` | text | Não | rosto, corpo, tatuagem, referência, look |
| `photo_type` | text | Não | frente, perfil, 45 graus etc. |
| `module` | text | Não | cabelo, maquiagem, tatuagem etc. |
| `consent_scope` | text | Sim | análise, simulação, histórico, briefing |
| `sensitive_flag` | boolean | Sim | Default true |
| `is_simulation` | boolean | Sim | Diferencia simulação de foto real |
| `retention_policy` | text | Sim | Ex.: até exclusão pelo usuário |
| `processing_status` | text | Não | pending, processed, failed |
| `expires_at` | timestamp | Não | Expiração automática, se aplicável |
| `created_at` | timestamp | Sim |  |
| `deleted_at` | timestamp | Não | Soft delete |
### RLS
- Usuário acessa apenas suas próprias imagens.
- Storage bucket privado.
- URLs assinadas com expiração.
- Proibir acesso público.
- Exclusão deve remover ou invalidar arquivo real no Storage.
- Não logar caminhos completos associados à identidade.
---
## Tabela: `tattoo_plans`
Planos de tatuagem.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `body_area` | text | Sim | braço, costas, perna etc. |
| `style_preferences` | jsonb | Não | minimalista, old school, fine line etc. |
| `visibility_level` | text | Não | discreta, média, visível |
| `pain_tolerance` | text | Não | baixa, média, alta |
| `budget_range` | text | Não | orçamento aproximado |
| `symbolic_intention` | text | Não | significado desejado |
| `skin_notes` | text | Não | alergias, cicatrizes, queloide — sensível |
| `professional_restrictions` | text | Não | trabalho/família |
| `references` | jsonb | Não | Referências visuais |
| `briefing` | jsonb | Não | Pacote para tatuador |
| `status` | text | Sim | draft, generated, saved, discarded |
| `version` | integer | Sim | Controle de conflito |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
### RLS
- Usuário só lê/escreve seus planos.
- Não compartilhar com tatuador sem consentimento explícito.
---
## Tabela: `saved_collections`
Coleções salvas.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | Dono |
| `name` | text | Sim | Nome da coleção |
| `description` | text | Não | Descrição |
| `offline_enabled` | boolean | Sim | Se fica disponível offline |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
### RLS
- Usuário acessa apenas suas coleções.
---
## Tabela: `saved_items`
Itens dentro de coleções.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `collection_id` | uuid | Sim | FK |
| `user_id` | uuid | Sim | Dono |
| `item_type` | text | Sim | recommendation, checklist, reference, photo, plan |
| `item_ref_id` | uuid | Não | ID relacionado |
| `content_snapshot` | jsonb | Não | Snapshot para offline |
| `created_at` | timestamp | Sim |  |
### RLS
- Usuário acessa apenas seus itens.
---
## Tabela: `transformation_plans`
Planos de transformação.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | Dono |
| `title` | text | Sim | Ex.: “Transformação profissional em 6 meses” |
| `goal` | text | Sim | Objetivo |
| `duration_weeks` | integer | Sim | Duração |
| `status` | text | Sim | active, paused, completed, archived |
| `version` | integer | Sim | Controle de conflito |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
---
## Tabela: `transformation_steps`
Etapas do plano.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `plan_id` | uuid | Sim | FK |
| `user_id` | uuid | Sim | Dono |
| `week_number` | integer | Não | Semana |
| `month_number` | integer | Não | Mês |
| `title` | text | Sim | Título |
| `description` | text | Sim | Descrição |
| `checklist` | jsonb | Não | Itens |
| `completed_at` | timestamp | Não | Conclusão |
---
## Tabela: `user_events` / `feedback_events`
Eventos de uso e aprendizado.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `recommendation_id` | uuid | Não | Recomendação relacionada |
| `event_type` | text | Sim | like, save, discard, test_result, post_use_feedback |
| `target_type` | text | Não | recommendation, color, style, module |
| `target_id` | uuid | Não | ID relacionado |
| `feedback_text` | text | Não | Texto livre |
| `feedback_tags` | jsonb | Não | Tags estruturadas |
| `payload` | jsonb | Não | Dados mínimos |
| `created_at` | timestamp | Sim |  |
### RLS
- Usuário lê/cria seus próprios eventos.
- Eventos usados para personalização devem estar descritos na política de privacidade.
---
## Tabela: `journey_entries`
Registros de jornada visual.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `entry_type` | text | Sim | foto, nota, sensação, antes_depois |
| `title` | text | Não | Título |
| `notes` | text | Não | Reflexões |
| `mood` | text | Não | Sensível |
| `context` | text | Não | trabalho, evento, descanso etc. |
| `image_id` | uuid | Não | FK para `media_assets` |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
---
## Tabela: `notification_preferences`
Preferências de notificação.
| Coluna | Tipo | Obrigatória | Observação |
| --- | --- | --- | --- |
| `id` | uuid | Sim | PK |
| `user_id` | uuid | Sim | FK |
| `enabled` | boolean | Sim | Default false |
| `style_reminders` | boolean | Sim | Default false |
| `event_reminders` | boolean | Sim | Default false |
| `tattoo_care_reminders` | boolean | Sim | Default false |
| `push_token` | text | Não | Expo push token |
| `created_at` | timestamp | Sim |  |
| `updated_at` | timestamp | Sim |  |
---
## Cache no aparelho
### Biblioteca recomendada
Para MVP:
- `@react-native-async-storage/async-storage`
Se dados crescerem muito:
- `expo-sqlite`
### Usar AsyncStorage para
- sessão local controlada pelo Supabase;
- perfil básico;
- DNA Visual resumido;
- último diagnóstico visual;
- rascunho da conversa guiada;
- recomendações recentes;
- recomendações salvas;
- coleções favoritas;
- plano de transformação ativo;
- planos de tatuagem recentes;
- checklists;
- preferências de notificação;
- fila offline simples.
### Migrar para SQLite se
- houver muitas recomendações;
- galeria grande;
- armário virtual;
- muitas imagens/metadados;
- busca local;
- coleções muito extensas;
- histórico crescer demais.
## Dados sempre disponíveis offline
| Dado | Offline? | Motivo |
| --- | --- | --- |
| Sessão atual | Sim | Evitar logout indevido |
| Perfil básico | Sim | Abrir app sem travar |
| DNA Visual resumido | Sim | Consulta rápida |
| Último diagnóstico | Sim | Continuidade |
| Rascunho de conversa | Sim | Evitar perda |
| Últimas recomendações salvas | Sim | Consulta offline |
| Coleções salvas | Sim | Valor do app sem rede |
| Plano de transformação ativo | Sim | Continuidade |
| Planos de tatuagem recentes | Sim | Continuidade |
| Status de recomendação | Sim | Enfileirar alteração |
| Fotos originais | Não por padrão | Sensíveis e pesadas |
| Simulações visuais | Não por padrão | Sensíveis e pesadas |
| Upload de foto | Não | Exige conexão |
| Exclusão definitiva | Não | Exige confirmação do servidor |
| Geração por IA | Não | Depende de API |
## Comportamento sem internet
O app deve:
- mostrar `OfflineBanner`;
- permitir revisar histórico em cache;
- permitir abrir coleções salvas;
- permitir continuar rascunho de conversa;
- permitir preencher Perfil Visual;
- permitir salvar intenção e respostas localmente;
- permitir marcar checklist como concluído;
- permitir alterar status de recomendações;
- enfileirar ações simples;
- bloquear geração nova por IA;
- bloquear upload de foto;
- bloquear exclusão definitiva;
- não prometer IA offline;
- informar: “Será sincronizado quando a conexão voltar”.
## Fila offline
Pode enfileirar:
- atualizar perfil visual;
- salvar rascunho;
- alterar status de recomendação;
- salvar/descartar recomendação;
- registrar feedback;
- salvar plano de tatuagem;
- criar registro de jornada sem imagem;
- marcar etapa/checklist.
Não enfileirar no MVP:
- exclusão definitiva;
- upload grande;
- geração de IA;
- compartilhamento com profissional;
- alterações críticas sem confirmação do servidor.
## Resolução de conflito
| Caso | Estratégia |
| --- | --- |
| Feedback simples | Última escrita vence com `updated_at` e `version` |
| Status de recomendação | Última escrita vence |
| Checklist | Última escrita vence |
| DNA Visual / Perfil Visual | Se conflito, pedir escolha ou fazer merge por campo |
| Diagnóstico com alergias/pele sensível | Nunca sobrescrever silenciosamente |
| Rascunho de conversa | Manter local se mais recente; avisar divergência |
| Recomendações geradas | Não sobrescrever texto; criar nova versão |
| Plano de tatuagem | Preservar versões e avisar conflito |
| Fotos/simulações | Nunca sobrescrever; criar novo registro |
| Jornada/reflexões | Criar novo registro; evitar merge automático |
| Exclusões | Só online com confirmação |
## Política de limpeza de cache
- Manter últimas 20 recomendações em cache.
- Alternativa citada: últimas 30 recomendações.
- Manter últimos 10 planos de tatuagem.
- Manter últimos 20 registros de jornada sem imagem pesada.
- Manter rascunhos por até 30 dias.
- Permitir botão “Limpar dados temporários”.
- Não manter imagens localmente além do necessário para upload.
- Apagar imagens temporárias após upload ou falha final.
- Comprimir payloads quando possível.
- Limitar anexos grandes.
- [DADO FALTANTE] valor exato de N para diagnósticos salvos.
- [DADO FALTANTE] se imagens precisam estar disponíveis offline.
---
# 6. RECURSOS DO APARELHO E PERMISSÕES
| Recurso | Para que serve aqui | Permissão | Quando é pedida | O que o app faz se for negada |
| --- | --- | --- | --- | --- |
| Internet | Login, Supabase, IA, upload, sync. | Normal | Não pede diálogo. | Mostra modo offline e limita IA/upload. |
| Armazenamento interno do app | Cache, rascunhos, fila offline. | Gerenciado pelo app | Não pede permissão perigosa. | Se faltar espaço, mostra erro e sugere limpar cache. |
| Câmera | Tirar foto de rosto, corpo, cabelo, look, tatuagem ou referência. | Dangerous | Ao tocar em “Tirar foto”. | Oferece galeria ou formulário sem foto. |
| Galeria / Fotos | Selecionar imagem existente. | Dangerous conforme Android; usar seletor moderno quando possível. | Ao tocar em “Enviar foto”/“Escolher da galeria”. | Continua com entrada manual. |
| Notificações | Lembretes de plano, proposta em teste, evento, cuidado pós-tatuagem. | Dangerous no Android 13+ | Apenas ao ativar lembretes. | Lembretes ficam dentro do app. |
| Microfone | Responder formulário por voz. | Dangerous | Só se a função for implementada. | Mantém entrada por texto. |
| Localização | Marketplace futuro/profissionais próximos. | Dangerous | Não no MVP. Só V2, ao buscar por perto. | Busca manual por cidade/bairro. |
| Calendário | Integração futura com eventos. | Dangerous | Não no MVP. Só se V2 ativar agenda. | Usuária cadastra eventos manualmente. |
| Contatos | Não necessário. | Dangerous | Nunca no MVP. | Não se aplica. |
| Sensores | Não necessário. | Varia | Nunca no MVP. | Não se aplica. |
## Regras de permissão
- Não pedir permissões ao abrir o app.
- Pedir só no contexto da ação.
- Explicar antes do pedido nativo.
- Se negar, o app não quebra.
- Foto nunca deve ser obrigatória.
- Caminho textual deve funcionar sem câmera/galeria.
- Notificação deve ser opt-in.
- Localização, calendário, contatos e microfone ficam fora do MVP salvo necessidade real.
## Texto explicativo antes da foto
> Usaremos esta foto apenas para gerar sugestões visuais conforme sua autorização. Você pode continuar sem foto.
## Fotos e dados sensíveis
- Fotos de rosto/corpo/tatuagem/cicatriz/pele são sensíveis.
- Usar bucket privado.
- Usar HTTPS.
- Usar URL assinada com expiração.
- Não logar caminhos completos associados à usuária.
- Permitir exclusão.
- Informar retenção.
- Não enviar à IA sem consentimento explícito.
- Não usar para treinamento sem consentimento separado.
---
# 7. SEGUNDO PLANO E BATERIA
## Decisão para MVP
**NÃO USA SEGUNDO PLANO PESADO.**
Essa é a melhor decisão para Android popular, pois reduz:
- consumo de bateria;
- chance de o Android matar o app;
- bugs silenciosos;
- complexidade;
- manutenção.
## O que pode existir
| Função | Segundo plano? | Estratégia |
| --- | --- | --- |
| Sincronização | Leve | Ao abrir app, voltar para foreground, salvar algo ou conexão voltar |
| Notificações | Opcional | Expo Notifications para lembretes simples |
| Upload de foto | Não persistente no MVP | Upload com app aberto; se falhar, tentar novamente |
| IA | Não no aparelho | Backend/API sob demanda |
| Localização contínua | Não | Não usar |
| AR/câmera contínua | Não | Fica para depois |
## Regras de bateria
Não fazer:
- loop de sync a cada poucos segundos;
- sync a cada minuto;
- upload automático pesado;
- processamento de imagem em background;
- monitoramento contínuo;
- prometer lembretes vitais;
- prometer entrega garantida de notificação.
Fazer:
- sincronizar ao abrir app;
- sincronizar ao voltar para foreground;
- sincronizar quando conexão voltar;
- sincronizar após ação do usuário;
- permitir pull-to-refresh;
- avisar antes de upload grande em dados móveis;
- comprimir imagem antes do upload;
- mostrar progresso;
- permitir tentar novamente.
## Wi-Fi vs dados móveis
- Se imagem for grande e rede móvel, avisar.
- Permitir “Enviar mesmo assim”.
- Se rede estiver instável, informar risco de falha.
- Não baixar imagens grandes automaticamente.
## Notificações possíveis
- “Seu evento importante acontece em breve. Quer revisar o plano?”
- “Você marcou esta proposta como em teste. Quer registrar como se sentiu?”
- “A etapa de cuidado pós-tatuagem está chegando.”
- “Você salvou um plano para este evento. Quer revisar?”
## Limitações
- Android pode atrasar notificações em aparelhos com economia agressiva de bateria.
- Cuidados pós-tatuagem são lembretes auxiliares.
- Não substituir orientação profissional.
- Se algum dia houver alarme crítico de saúde, isso exigirá revisão de stack/requisitos.
---
# 8. FORMULÁRIO DE SEGURANÇA DE DADOS — PLAY CONSOLE
O conteúdo precisa bater exatamente com o código final.
## Dados coletados
| Tipo de dado | Como é coletado | Obrigatório? | Compartilhado? | Criptografado em trânsito? | Em repouso? | Exclusão |
| --- | --- | --- | --- | --- | --- | --- |
| E-mail | Login Supabase Auth | Sim | Supabase como provedor | Sim, HTTPS | Supabase | Pode solicitar exclusão |
| Nome/apelido | Cadastro/perfil | Opcional | Supabase | Sim | Supabase | Pode editar/excluir |
| Identidade de gênero | Perfil visual | Opcional e sensível | Supabase; IA se usado | Sim | Supabase | Pode editar/excluir |
| Cidade/país/região | Perfil/contexto | Opcional | Supabase | Sim | Supabase | Pode editar/excluir |
| Fotos de rosto/corpo/cabelo/tatuagem | Câmera/galeria | Opcional | Supabase Storage e possível IA [DADO FALTANTE] | Sim | Storage privado | Pode excluir |
| Dados de autoimagem | Formulários/conversa | Parcialmente necessários | Supabase e IA [DADO FALTANTE] | Sim | Supabase | Pode editar/excluir |
| Preferências visuais | DNA Visual | Opcional | Supabase e IA [DADO FALTANTE] | Sim | Supabase | Pode editar/excluir |
| Dados de pele | Formulário | Opcional e sensível | Supabase e IA se usado | Sim | Supabase | Pode editar/excluir |
| Alergias | Formulário | Opcional e sensível | Supabase e IA se usado | Sim | Supabase | Pode editar/excluir |
| Histórico capilar/químico | Formulário | Opcional e sensível | Supabase e IA se usado | Sim | Supabase | Pode editar/excluir |
| Inseguranças/estado emocional | Conversa guiada | Opcional e sensível | Supabase e IA [DADO FALTANTE] | Sim | Supabase | Pode excluir |
| Religião/valores/limites | Conversa guiada | Opcional e sensível | Supabase e IA [DADO FALTANTE] | Sim | Supabase | Pode excluir |
| Tatuagens/cicatrizes/queloide | Foto/formulário | Opcional e sensível | Supabase e IA [DADO FALTANTE] | Sim | Supabase | Pode excluir |
| Eventos de uso | Curtir, salvar, descartar, feedback | Sim para personalização | Supabase | Sim | Supabase | Pode solicitar exclusão |
| Push token | Se notificações ativadas | Opcional | Expo Notifications | Sim | Expo/Supabase | Pode revogar/desativar |
| Dados de crash | Se usar Sentry/Crashlytics | Opcional/técnico | Provedor de monitoramento [DADO FALTANTE] | Sim | Provedor | Conforme provedor |
| Analytics | Se implementado | [DADO FALTANTE] | Provedor [DADO FALTANTE] | Sim | Provedor | Conforme política |
| Localização | Não no MVP | Não | Não | N/A | N/A | N/A |
| Calendário | Não no MVP | Não | Não | N/A | N/A | N/A |
## Compartilhamento com terceiros
Possíveis provedores/subprocessadores:
- Supabase: autenticação, banco e storage.
- Provedor de IA: geração de recomendações e/ou simulação visual. **[DADO FALTANTE]**
- Expo Notifications: se notificações forem ativadas.
- Sentry/Crashlytics: se monitoramento de erro for usado. **[DADO FALTANTE]**
- Analytics: não usar no MVP se não for necessário. Se usar, declarar.
- Marcas/afiliados/marketplace: **[DADO FALTANTE]**
## Pontos sensíveis
O app pode coletar dados ligados a:
- rosto;
- corpo;
- estilo;
- gênero;
- religião;
- autoestima;
- inseguranças;
- estado emocional;
- tatuagens;
- cicatrizes;
- alergias;
- queloide;
- pele sensível;
- histórico capilar.
Isso exige:
- consentimento explícito;
- política de privacidade clara;
- opção de exclusão;
- cuidado com logs;
- RLS rigoroso;
- bucket privado;
- revisão jurídica/compliance antes da publicação, especialmente se menores forem aceitos.
## Uso para IA
Pontos críticos:
- [DADO FALTANTE] Qual provedor de IA será usado.
- [DADO FALTANTE] Fotos serão usadas apenas para resultado individual?
- [DADO FALTANTE] Fotos serão armazenadas depois?
- [DADO FALTANTE] Fotos/dados serão usados para treinar modelo?
- [DADO FALTANTE] Haverá revisão humana?
- [DADO FALTANTE] Em qual país/região os dados serão processados?
- [DADO FALTANTE] Haverá dados agregados para marcas/parceiros?
Opção conservadora para MVP:
> Fotos e respostas são usadas apenas para gerar recomendações da própria usuária, não são vendidas, não são usadas para treinamento de modelos sem consentimento explícito e podem ser excluídas pela usuária.
## Avisos de saúde/pele/tatuagem
Inserir no app e na política:
> As recomendações não substituem avaliação de dermatologista, alergista, cabeleireiro, tatuador, consultor de imagem ou profissional habilitado.
Para alergias, pele sensível, cicatrizes, queloide e tatuagem:
- sugerir teste de contato;
- sugerir validação profissional;
- não prometer diagnóstico;
- não usar esses dados para publicidade;
- não tratar como recomendação médica.
---
# 9. BUILD E ASSINATURA
## Configuração Expo
Exemplo `app.json` recomendado para Aura ID:
```json
{
  "expo": {
    "name": "Aura ID",
    "slug": "aura-id",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "auraid",
    "userInterfaceStyle": "automatic",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "bundleIdentifier": "com.auraid.app"
    },
    "android": {
      "package": "com.auraid.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": []
    }
  }
}
```
Adicionar permissões apenas quando a funcionalidade estiver implementada.
Exemplo futuro:
```json
"permissions": [
  "CAMERA",
  "READ_MEDIA_IMAGES",
  "POST_NOTIFICATIONS"
]
```
Se microfone não entrar, não declarar `RECORD_AUDIO`.
## Plugins possíveis
Adicionar apenas se usados:
```json
"plugins": [
  "expo-image-picker",
  "expo-camera",
  "expo-notifications"
]
```
## Variáveis de ambiente
Nunca colocar segredo no código.
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_ENV=
EXPO_PUBLIC_AI_API_BASE_URL=
AI_BACKEND_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
ANDROID_UPLOAD_KEYSTORE_PATH=
ANDROID_UPLOAD_KEYSTORE_PASSWORD=
ANDROID_KEY_ALIAS=
ANDROID_KEY_PASSWORD=
SENTRY_DSN=
```
Regras:
- `EXPO_PUBLIC_SUPABASE_URL` pode ir para o app.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` pode ir para o app com RLS correto.
- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o app.
- `AI_PROVIDER_API_KEY` nunca vai para o app.
- Chave secreta de IA fica em backend/Edge Function.
- `.env` real não entra no Git.
- keystore não entra no Git.
## EAS Build
Instalar/configurar:
```bash
npm install -g eas-cli
eas login
eas build:configure
```
Build Android production:
```bash
eas build --platform android --profile production
```
Saída esperada:
```txt
.aab
```
## `eas.json` sugerido
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```
## Chave de upload
Forma mais simples para operador solo:
```bash
eas credentials
```
Recomendação:
- usar EAS Credentials;
- ativar Google Play App Signing;
- guardar backup da chave de upload em gerenciador de senhas.
Variáveis/segredos:
```txt
ANDROID_UPLOAD_KEYSTORE_PATH
ANDROID_UPLOAD_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```
## Assinatura pela Play
Na Play Console:
1. Criar app.
2. Ativar **Play App Signing**.
3. Enviar `.aab`.
4. Google guarda a chave de assinatura final.
5. Sua chave local/EAS será a chave de upload.
Alerta:
- perder a chave de upload é recuperável via Play Console;
- perder a chave de assinatura sem guarda do Google pode exigir novo app com outro `applicationId`;
- não alterar `applicationId` depois da produção.
## Ambientes mínimos
| Ambiente | Uso | Supabase |
| --- | --- | --- |
| Desenvolvimento local | Testes rápidos | Projeto Supabase dev |
| Preview/teste interno | Testadores | Supabase staging ou dev controlado |
| Produção | Usuários reais | Supabase production |
| Variáveis: |  |  |
```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_ENV=preview
EXPO_PUBLIC_APP_ENV=production
```
## Versionamento
- `version`: versão visível, ex.: `1.0.0`
- `android.versionCode`: inteiro crescente, ex.: `1`, `2`, `3`
- Toda mudança de schema Supabase deve ter migração documentada.
- Antes de publicar build que depende de nova coluna, aplicar migração no banco.
- Não misturar dados reais com ambientes de teste.
## Checklist pré-publicação
- Ícone adaptativo conferido.
- Splash screen leve.
- Permissões declaradas batem com uso real.
- Política de privacidade publicada.
- Formulário de segurança de dados preenchido.
- Login testado.
- Fluxo principal testado.
- Offline testado.
- Botão voltar Android testado.
- Negar câmera/galeria/notificação não quebra app.
- Teste em rede 3G fraca.
- Teste em aparelho Android barato.
- Teste com fonte aumentada.
- Teste em tema escuro.
- Logs não exibem fotos, respostas sensíveis, prompts completos ou tokens.
- `.env` não commitado.
- Keystore não commitado.
- `.aab` gerado em profile production.
- Supabase RLS ativado.
- Data Safety coerente com o código.
---
# 10. TRILHA ATÉ PRODUÇÃO
## 1. Conta de desenvolvedor
Preparar:
- registrar conta pessoa física ou jurídica;
- pagar taxa;
- configurar dados fiscais;
- aceitar termos;
- ativar autenticação em duas etapas;
- garantir acesso ao e-mail cadastrado;
- conferir país/região;
- revisar políticas de segurança da conta.
Tempo típico: **1–2 dias**.
## 2. Ficha da loja
Preparar:
- nome do app;
- descrição curta;
- descrição longa;
- screenshots Android;
- ícone;
- splash/identidade visual;
- política de privacidade hospedada online;
- termos de uso;
- e-mail de suporte;
- classificação de conteúdo;
- declaração de segurança de dados;
- categoria/tags;
- idioma suportado;
- vídeo de apresentação, se aplicável;
- informações de acessibilidade, se houver.
Cuidados:
- não prometer AR se não existir;
- não prometer simulação visual se não estiver implementada;
- não prometer diagnóstico médico;
- não prometer marketplace/comunidade se não existir;
- garantir coerência entre ficha, política, Data Safety e código.
Tempo típico: **2–5 dias**.
## 3. Teste interno
Preparar:
- subir primeiro `.aab`;
- configurar testadores internos;
- testar instalação;
- validar login;
- validar Perfil Visual;
- validar Conversa Guiada;
- validar Recomendações;
- validar Histórico;
- validar Tatuagem, se entrar;
- validar offline;
- negar permissões;
- testar botão voltar;
- verificar crashes/ANRs;
- registrar bugs.
Tempo típico: **2–5 dias**.
## 4. Teste fechado
Preparar:
- público-alvo real;
- feedback estruturado;
- formulário com perguntas abertas e fechadas;
- canais de suporte;
- aparelhos baratos;
- versões diferentes de Android;
- rede ruim;
- validação da linguagem emocionalmente segura;
- clareza dos consentimentos;
- performance;
- estabilidade offline.
Tempo típico: **1–2 semanas**, podendo se estender.
## 5. Produção
Preparar:
- rollout gradual;
- monitoramento de crashes;
- monitoramento de ANRs;
- avaliação de consumo de bateria;
- acompanhamento de reviews;
- suporte com SLA;
- plano de hotfix;
- changelog;
- roadmap incremental;
- revisão periódica das políticas da Play Store.
Tempo típico: **1–3 dias** após envio, dependendo da revisão.
## Observação importante
Contas novas de desenvolvedor pessoa física podem estar sujeitas a período obrigatório de teste fechado com número mínimo de testadores antes da produção — **[CONFIRMAR NA CONSOLE]**, porque essa regra muda.
Documentar internamente:
- tipo de conta;
- país;
- exigências encontradas;
- volume mínimo de testadores;
- período obrigatório;
- restrições de publicação.
---
# 11. DESEMPENHO NO APARELHO REAL
Referência: aparelho Android popular, baixo custo, 2 GB a 4 GB de RAM, armazenamento limitado e rede instável.
## Metas
| Métrica | Meta inicial |
| --- | --- |
| Tempo até primeira tela útil | Menos de 4 segundos |
| Tamanho do download | Preferencialmente abaixo de 50 MB |
| Memória | Não causar fechamento em aparelho com 2 GB RAM |
| Feedback visual em rede lenta | Até 1 segundo |
| Operações críticas em rede | Idealmente 3–5 segundos |
| Upload de foto | Comprimir antes; mostrar progresso |
| Listas | Paginação/virtualização |
| Imagens | Thumbnails e carregamento sob demanda |
| Offline | Abrir dados salvos sem travar |
## O que medir
- tempo do toque no ícone até Login/Início;
- tempo de login;
- abertura da Home;
- abertura do Perfil Visual;
- preenchimento de formulário;
- geração de recomendação;
- salvar/descartar recomendação;
- upload de imagem;
- desligar/religar internet;
- sync da fila;
- consumo de memória em fluxo principal;
- comportamento com fonte ampliada;
- comportamento em tema escuro.
## Regras práticas
- Não iniciar IA, upload ou chamadas pesadas antes da primeira tela útil.
- Lazy loading para telas secundárias.
- Evitar dependências grandes.
- Usar WebP/SVG.
- Não carregar histórico inteiro.
- Paginar recomendações.
- Evitar salvar imagens grandes no cache.
- Não bloquear UI aguardando Supabase.
- Exibir loading/skeleton leve.
- Não manter arrays gigantes em estado global.
- Não usar animações pesadas.
- Comprimir imagens antes de upload.
- Usar `FlatList`.
- Testar em rede 3G fraca.
## Testes manuais obrigatórios antes de build production
 1. Abrir app recém-instalado.
 2. Medir tempo até Login/Início.
 3. Fazer login.
 4. Abrir Início.
 5. Preencher Perfil Visual.
 6. Começar Conversa Guiada.
 7. Desligar internet.
 8. Continuar rascunho.
 9. Religar internet.
10. Confirmar sync.
11. Gerar recomendação.
12. Salvar/descartar recomendação.
13. Abrir histórico/coleção offline.
14. Negar câmera.
15. Negar galeria.
16. Negar notificação.
17. Confirmar que app não quebra.
18. Testar botão voltar Android em todas as telas.
19. Aumentar fonte do sistema.
20. Alternar tema claro/escuro.
21. Testar em aparelho barato real.
---
# 12. SEQUÊNCIA DE PROMPTS PARA CLAUDE CODE
## 1. Estrutura base Expo/Android
**Prompt:**
Crie/adapte a estrutura base de um app Expo React Native com TypeScript chamado `Aura ID`, mantendo código-fonte único para Android e iOS. Configure `src/`, navegação, tema Material 3 com `react-native-paper`, `SafeAreaProvider`, TypeScript estrito e arquivos de ambiente com placeholders.
Se já existir projeto Expo do PL1, não crie projeto novo: adapte o projeto existente. Não implemente lógica de negócio ainda. Não inserir chaves reais de Supabase ou IA.
Arquivos esperados:
- `app.json`
- `eas.json`
- `package.json`
- `tsconfig.json`
- `babel.config.js`
- `metro.config.js`
- `.env.example`
- `.gitignore`
- `src/App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/theme/lightTheme.ts`
- `src/theme/darkTheme.ts`
- `src/theme/theme.ts`
- `src/components/LoadingState.tsx`
- `src/components/ErrorState.tsx`
- `src/components/OfflineBanner.tsx`
**Não alterar:**
- Nenhuma chave real.
- Nenhuma configuração sensível.
- Nenhum backend.
- Nenhuma regra RLS.
- Nenhum código nativo Kotlin.
**Verificação:**
O app abre no Android mostrando uma tela inicial vazia ou placeholder com tema Material, sem erro de build e sem warnings críticos.
---
## 2. Telas e navegação
**Prompt:**
Implemente as telas principais do MVP do Aura ID com dados mockados:
- `OnboardingConsentScreen`
- `LoginScreen`
- `HomeScreen`
- `VisualProfileScreen`
- `GuidedConversationScreen`
- `RecommendationsScreen`
- `RecommendationDetailScreen`
- `HistoryScreen`
- `SavedCollectionsScreen`
- `TransformationPlanScreen`
- `TattooPlannerScreen`
- `TattooBriefingScreen`
Configure `AuthNavigator`, `MainNavigator`, `AppNavigator` e comportamento do botão voltar no Android. Use componentes Material 3, acessibilidade básica, tema claro/escuro e textos acolhedores sem julgamento.
Arquivos:
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/MainNavigator.tsx`
- `src/navigation/androidBackHandler.ts`
- telas em `src/features/...`
- `src/components/AppButton.tsx`
- `src/components/AppTextInput.tsx`
- `src/components/AppCard.tsx`
- `src/components/ConfirmExitDialog.tsx`
- `src/components/ImpactIndicator.tsx`
**Não alterar:**
- Supabase.
- IA.
- Banco.
- Variáveis reais.
- Permissões nativas.
**Verificação:**
É possível navegar por todas as telas. O botão voltar Android volta corretamente e pede confirmação ao sair de formulário com alterações mockadas. Tema claro/escuro mantém contraste.
---
## 3. Supabase Auth, tipos e sessão
**Prompt:**
Integre Supabase no Aura ID usando variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Crie cliente, serviço de autenticação, tipos TypeScript iniciais e hooks para sessão. Implemente login/logout básico com Supabase Auth por e-mail/senha ou magic link.
Arquivos:
- `src/services/supabase/supabaseClient.ts`
- `src/services/supabase/types.ts`
- `src/services/supabase/authService.ts`
- `src/hooks/useAuth.ts`
- atualizar `src/features/auth/LoginScreen.tsx`
- atualizar `src/navigation/AppNavigator.tsx`
**Não alterar:**
- RLS existente.
- Chaves reais.
- Estrutura de tabelas sem confirmação.
- `SUPABASE_SERVICE_ROLE_KEY`.
- IA.
**Verificação:**
Login e logout funcionam no ambiente de teste. Sessão persiste. App troca de AuthNavigator para MainNavigator quando há sessão. Usuário não vê dados de outro usuário.
---
## 4. Dados reais: perfil, conversa, recomendações, histórico e tatuagem
**Prompt:**
Implemente serviços e hooks para:
- `profiles`
- `visual_profiles`
- `guided_sessions`
- `recommendations`
- `media_assets`
- `tattoo_plans`
- `saved_collections`
- `saved_items`
- `transformation_plans`
- `transformation_steps`
- `user_events`
Conecte Perfil Visual, Conversa Guiada, Recomendações, Histórico/Coleções, Plano de Transformação e Tatuagem ao Supabase. Use estados de loading, erro, vazio e sucesso. Não implementar IA real ainda; gerar recomendações mockadas salvas no banco para testar fluxo.
Arquivos:
- `src/services/supabase/profileService.ts`
- `src/services/supabase/recommendationService.ts`
- `src/services/supabase/mediaService.ts`
- `src/services/supabase/tattooService.ts`
- `src/hooks/useVisualProfile.ts`
- `src/hooks/useGuidedConversation.ts`
- `src/hooks/useRecommendations.ts`
- `src/hooks/useMediaAssets.ts`
- `src/hooks/useTattooPlans.ts`
- `src/hooks/useSavedCollections.ts`
- `src/hooks/useTransformationPlan.ts`
- atualizar telas relacionadas
**Não alterar:**
- Regras RLS.
- Chaves.
- Permissões nativas.
- Implementação de IA real.
- Schema sem autorização.
**Verificação:**
Usuária consegue preencher DNA Visual, criar sessão guiada, salvar recomendação mockada, abrir histórico, criar plano de tatuagem textual e ver dados persistidos no Supabase.
---
## 5. Cache local, offline e sincronização
**Prompt:**
Implemente cache local com AsyncStorage para:
- perfil básico;
- DNA Visual;
- rascunho de Conversa Guiada;
- últimas recomendações;
- coleções salvas;
- plano de transformação ativo;
- planos de tatuagem recentes;
- fila de operações pendentes.
Adicione detecção de rede, `OfflineBanner`, sincronização quando conexão voltar e resolução conservadora de conflitos.
Arquivos:
- `src/services/network/networkService.ts`
- `src/services/storage/localCache.ts`
- `src/services/storage/offlineQueue.ts`
- `src/services/storage/cachePolicy.ts`
- `src/services/sync/syncService.ts`
- `src/services/sync/conflictResolution.ts`
- `src/hooks/useNetworkStatus.ts`
- `src/hooks/useOfflineSync.ts`
- atualizar hooks de dados
**Não alterar:**
- Tipos do banco sem necessidade.
- RLS.
- Navegação principal.
- Não apagar dados remotos.
- Não sobrescrever conflitos sensíveis automaticamente.
**Verificação:**
Com internet desligada, o app mostra banner offline, preserva rascunho, permite consultar cache e sincroniza ações simples quando a rede volta.
---
## 6. Permissões, câmera, galeria, notificações e upload seguro
**Prompt:**
Implemente serviço centralizado de permissões para câmera, galeria e notificações. Pedir permissão apenas no primeiro uso contextual, com explicação antes. Se o usuário negar, mostrar alternativa e manter app funcional.
Depois, implemente upload opcional de fotos para Supabase Storage privado e tabela `media_assets`, com consentimento claro antes do upload, compressão local, caminho por usuário, URL assinada e exclusão lógica.
Arquivos:
- `src/services/permissions/permissionService.ts`
- `src/components/PermissionExplanationCard.tsx`
- `src/components/ImagePickerButton.tsx`
- `src/utils/imageCompression.ts`
- `src/services/supabase/mediaService.ts`
- `src/hooks/useMediaAssets.ts`
- atualizar `app.json` apenas com permissões realmente usadas
**Não alterar:**
- Fluxo principal de login.
- Tipos Supabase sem necessidade.
- IA real.
- Dados reais.
- Não tornar foto obrigatória.
- Não deixar bucket público.
- Não logar caminhos completos.
**Verificação:**
Negar câmera, galeria e notificação não quebra o app. Usuária pode continuar com recomendações textuais. Quando permitido, foto é comprimida, enviada para storage privado e registrada em `media_assets`.
---
## 7. Integração com backend de IA
**Prompt:**
Integre `aiRecommendationService.ts` chamando `AI_BACKEND_URL` ou `EXPO_PUBLIC_AI_API_BASE_URL` para gerar recomendações a partir de sessão guiada, DNA Visual e, opcionalmente, media asset autorizado. Não colocar chave secreta de IA no app.
A resposta deve criar recomendações estruturadas com:
- título;
- descrição;
- mensagem visual;
- impacto;
- custo;
- manutenção;
- ousadia;
- reversibilidade;
- tempo de adaptação;
- receita prática;
- alternativas acessíveis;
- riscos/cuidados;
- status inicial.
Aplicar regras de segurança: não diagnosticar pele, não julgar corpo, não prometer resultado médico, sugerir validação profissional para alergias, cicatrizes, queloide, pele sensível e tatuagem.
Arquivos:
- `src/services/ai/aiRecommendationService.ts`
- `src/services/ai/aiPromptBuilders.ts`
- `src/services/ai/safetyRules.ts`
- atualizar `useGuidedConversation`
- atualizar `useRecommendations`
- atualizar `RecommendationsScreen`
**Não alterar:**
- Segredos.
- Storage.
- RLS.
- Prompt de sistema do backend se estiver fora do app.
- Não enviar foto sem consentimento.
**Verificação:**
Com backend disponível, app gera recomendações reais. Com backend indisponível, mostra erro claro e permite tentar novamente sem perder respostas.
---
## 8. Notificações leves opcionais
**Prompt:**
Implemente `notificationService.ts` e preferências de notificação. Notificações devem ser opcionais, pedidas apenas quando a usuária ativar lembretes. Criar lembretes locais simples para:
- proposta em teste;
- evento salvo;
- cuidado pós-tatuagem;
- revisão de plano.
Se permissão for negada, mostrar lembretes apenas dentro do app.
Arquivos:
- `src/services/notifications/notificationService.ts`
- `src/hooks/useNotificationPreferences.ts`
- atualizar telas onde houver ativação de lembretes
**Não alterar:**
- Não implementar background pesado.
- Não criar loops de sync.
- Não prometer entrega crítica.
- Não pedir notificação no login.
**Verificação:**
Ao negar notificação, app continua funcionando. Ao permitir, lembrete local é agendado e preferência fica salva.
---
## 9. Testes, performance e build production
**Prompt:**
Adicione testes básicos com React Native Testing Library/Jest para:
- Login;
- Home;
- OfflineBanner;
- Perfil Visual;
- Conversa Guiada;
- Recomendações;
- fila offline;
- resolução de conflitos.
Revise performance para Android barato: lazy loading, evitar listas grandes, imagens otimizadas, logs mínimos, ausência de animações pesadas. Configure build production via EAS para gerar `.aab`. Criar checklist em `docs/android-release-checklist.md`.
Arquivos:
- `src/__tests__/LoginScreen.test.tsx`
- `src/__tests__/HomeScreen.test.tsx`
- `src/__tests__/OfflineBanner.test.tsx`
- `src/__tests__/VisualProfileScreen.test.tsx`
- `src/__tests__/GuidedConversationScreen.test.tsx`
- `src/__tests__/RecommendationsScreen.test.tsx`
- `src/__tests__/offlineQueue.test.ts`
- `src/__tests__/conflictResolution.test.ts`
- revisar `eas.json`
- revisar `app.json`
- `docs/android-release-checklist.md`
**Não alterar:**
- Chaves reais.
- Banco de produção.
- Políticas de privacidade sem revisão humana.
- Keystore.
- `applicationId` depois de produção.
**Verificação:**
`npm test` passa. `eas build --platform android --profile production` gera `.aab`. App abre em aparelho Android barato, login funciona, fluxo principal funciona, offline funciona, botão voltar funciona e negar permissões não quebra o app.
---
# RECOMENDAÇÃO FINAL DE MVP
Implementar primeiro:
 1. Login.
 2. Consentimento.
 3. Perfil Visual / Diagnóstico Visual.
 4. Conversa Guiada.
 5. Recomendações textuais com IA.
 6. Histórico/Coleções.
 7. Planejamento de tatuagem textual.
 8. Upload opcional de imagem.
 9. Cache/offline básico.
10. Exclusão de dados/imagens.
11. Notificações opcionais simples.
Deixar para depois:
- comunidade;
- marketplace;
- AR;
- agenda;
- microlições extensas;
- biblioteca editorial completa;
- integração com profissionais;
- geração avançada de imagem com a própria pessoa;
- armário virtual completo;
- análise visual em tempo real.
A versão inicial deve provar o núcleo do app:
**ajudar a usuária a tomar decisões visuais mais conscientes, com recomendações personalizadas, linguagem segura, privacidade forte e boa performance em Android barato.**