# 🧪 Relatório de Teste Profundo — Aura ID (web-aplicação)

**Data:** 08/11/2026 · **Ambiente testado:** build de desenvolvimento em `http://localhost:8080` (Vite 8 / TanStack Start) conectado ao backend real de produção (Supabase `aura-id`) · **Método:** navegação real automatizada em Chromium 156 (Playwright sobre CDP), criação de conta de teste do zero, execução de fluxos completos, medições de tempo, testes de rede/sessão/responsividade + auditoria estática paralela do código (3 frentes, 59 rotas lidas, evidências `arquivo:linha`) + verificação dos relatórios anteriores.

> **Transparência sobre custo e dados:** foi criada **uma conta de teste real** (`teste.aura.1794127859111@example.com`) no backend de produção e executada **uma geração de sugestões** (texto/estrutura, sem gerar imagens pagas). Nenhum pagamento, exclusão de conta, upload de foto pessoal real ou geração de imagem paga foi executado. Os dados de teste (3 sugestões, 1 plano de jornada, 1 projeto de tatuagem, 1 registro de diário, 2 coleções e 2 lembretes) permanecem na conta de teste e podem ser apagados em Configurações. A senha da conta de teste está no fim deste documento.

---

## 0. Veredito em 10 linhas

1. **O produto existe, é amplo e funciona**: 53 rotas autenticadas percorridas sem um único erro HTTP; cadastro, login, consentimento, onboarding, geração de sugestões, aprovação, exportação `.md`, coleções, comparação, jornada e tatuagem percorridos de ponta a ponta.
2. **A camada de confiança é o gargalo, não a falta de recurso**: a maioria dos problemas graves está em ações de saída (exportar/comparar que quebram em alguns tipos), em confirmações de exclusão inconsistentes e em mensagens que dizem “deu certo” quando não deu.
3. **O onboarding assusta antes de ensinar**: o primeiro passo mostra **“18 pendente(s)”**, e o seletor de trilhas pode virar um **loop de modal a cada navegação** para quem clica em “Agora não”.
4. **O menu promete controle e entrega rolagem horizontal**: 15–20 itens em uma faixa que rola no desktop e não tem menu no celular; escolher 4 trilhas (o texto diz “até 3”) duplica “Cabelo” e gera erro de chave no React.
5. **A percepção de velocidade é boa quando há spinner, mas o app não tem plano B**: com rede lenta o “Preparando…” aparece e pode ficar para sempre; offline ou sessão expirada não há aviso — o usuário é jogado para o login sem explicação.
6. **Ações destrutivas têm três tratamentos diferentes**: `Confirm` bonito (fotos, sugestões, conta, plano de jornada), exclusão imediata sem pergunta (coleção, lembrete, reflexão, registro de tatuagem) e `confirm()` nativo do navegador (design da vitrine).
7. **Duplo clique não é protegido em toda parte**: criar duas coleções com dois cliques rápidos funciona — e cria duas.
8. **A IA funciona, mas é lenta e opaca**: uma geração de sugestões levou **21 s** com botão “Compondo seus convites…” e nenhum progresso/estimativa/cancelar; o resultado chega direto no dashboard, sem confirmação.
9. **Há vazamentos de bastidor visíveis ao usuário**, inclusive na landing pública: “Provadores fotorrealistas…: **[FORA DO ESCOPO DOS CONECTORES LOVABLE]**” e rodapés iguais em 4 módulos.
10. **O que já está bom merece ser protegido**: gate de consentimento real, spinner global, tradução dos erros de login, botão de opinião compacto, confirmações ricas nas ações certas, avisos de permanência da tatuagem, privacidade explícita no diário e exportação de briefing com confirmação.

**Conclusão:** corrigir a fundação (etapa 0 do plano, §12) entrega mais valor do que qualquer recurso novo. Depois disso, os maiores ganhos são: assistente que guia, packs prontos, retomada/notificações e modo simples × completo.

---

## 1. O que foi testado, como e o que ficou de fora

### 1.1 Método
- **Conta nova real:** cadastro por e-mail/senha, sessão persistida, consentimento, escolha de trilhas, onboarding Rápido (6 passos), salvamento e entrada no Estúdio.
- **Navegação real:** 53 rotas autenticadas abertas uma a uma (lista no Anexo A), com medição de tempo, contagem de requisições ao Supabase, captura de erros de console/HTTP e leitura do conteúdo renderizado.
- **Fluxos completos:** geração de sugestões; dashboard e filtros; abrir pacote; salvar; aprovar; rejeitar; feedback; exportar `.md`; coleções (criar/apagar); comparar; exportação em lote; configurações (consentimentos, lembretes, exclusões com cancelamento); jornada (plano, passo, diário com foto, exclusão de plano); tatuagem (intenção, projeto, decisão, cuidados); trilhas; logout/login; login social (até a tela do Google).
- **Testes de estresse de interação:** duplo clique (coleção), cliques repetidos em filtros, campos vazios, tipos de arquivo inválidos, navegação com teclado (Tab/Enter/Escape), viewports 375/768/1440, rede lenta (3 s de latência), offline, expiração de sessão e segunda aba.
- **Auditoria estática:** 3 auditorias independentes (conta/navegação; módulos; qualidade técnica) — 59 rotas, 15 componentes e 24 libs lidas, com 30 + 58 + 69 achados. Os números completos estão em `auditoria/04-...md`, `05-...md` e `06-...md`.

### 1.2 O que **não** foi testado (e por quê)
| Item | Motivo | Risco para esta conclusão |
|---|---|---|
| Geração de imagem paga (referência, retrato, provador, copiar tatuagem, estética) | Consome créditos reais do dono | Fluxos de imagem foram avaliados por código e estados de UI; o sucesso visual não foi provado ao vivo nesta sessão |
| Checkout / pagamento (Pix, cartão, assinatura Pass/Profissional) | Chaves LIVE; cobrança real | Preço, estados e copy foram auditados por código; cobrança não foi exercitada |
| Exclusão de conta de verdade | Irreversível em produção | Só a confirmação e a lista de tabelas foram verificadas por código (e há falha grave ali — ver A-10/C1) |
| Upload de foto pessoal real / modelo / retrato | Privacidade e LGPD | Só o gate de consentimento e a mensagem de requisitos foram testados; upload de arquivo válido no diário foi testado com PNG sintético |
| E-mail (confirmação, recuperação de senha) | SMTP não configurado; o link de recuperação nem existe | Confirmado por código e por UI |
| Navegadores múltiplos e aparelhos físicos | Ambiente só tem Chromium; viewports emulados | Safari/Firefox/mobile real continuam não verificados |
| Build de produção | Auditoria paralela executou `npm run build` (sucesso) | Tempos de dev são piores que produção; números aqui são indicativos, não SLAs |

---

## 2. Números do teste ao vivo

### 2.1 Navegação — 53 rotas
- **Todas as 53 rotas renderizaram** (nenhum 404/500 de rota autenticada).
- **Tempo médio até a captura** (dev, 1,8 s de espera fixa incluída): **2.859 ms**; mínimo 2.537 ms; máximo 4.709 ms.
- **17 rotas ainda mostravam “Preparando…” após 1,8 s** — o conteúdo levou **mais de 1,8 s** e, em parte delas, **mais de 4 s** (dashboard, configurações, admin, estética, barba, modelo, retrato, profissionais, maquiagem/gerar, maquiagem/perfil, cabelo/gerar, roupas/gerar, roupas/armário, tatuagem, tatuagem/briefing, jornada/relatórios e DNA/preferências).
- **20 rotas não têm `<h1>`** — a hierarquia visual/semântica fica dependente de `h2`/texto solto (acessibilidade e orientação).

### 2.2 Tempo até o conteúdo (rotas pesadas, medido sem espera artificial)
| Rota | DOM pronto | Conteúdo pronto | Requisições Supabase |
|---|---|---|---|
| `/dashboard` | 0,9 s | **3,0 s** | 4 |
| `/settings` | 1,5 s | **3,4 s** | 6 |
| `/admin` | 1,4 s | **3,7 s** | 5 |
| `/estetica` | 1,7 s | **4,9 s** | 7 |
| `/barba` | 1,8 s | **3,6 s** | 8 |
| `/modelo` | 1,3 s | **3,6 s** | 9 |
| `/retrato` | 1,2 s | **2,5 s** | 5 |
| `/profissionais` | 0,7 s | **1,9 s** | 3 |
| `/tatuagem` | 1,2 s | **2,6 s** | 3 |
| `/tatuagem/briefing` | 1,0 s | **2,6 s** | 3 |
| `/jornada/relatorios` | 1,2 s | **4,0 s** | 3 |
| `/dna/preferencias` | 1,3 s | **2,4 s** | 5 |
| `/maquiagem/gerar` | 0,9 s | **2,1 s** | 6 |
| `/cabelo/gerar` | 0,7 s | **1,8 s** | 6 |
| `/roupas/gerar` | 0,9 s | **2,0 s** | 6 |
| `/collections` | 0,9 s | **1,9 s** | 5 |
| `/compare` | 0,8 s | **2,0 s** | 4 |
| `/export` | 0,9 s | **2,0 s** | 4 |
| `/guia` | 1,0 s | **2,1 s** | 3 |
| `/aura-pass` | 0,8 s | **1,9 s** | 3 |

**Leitura:** a interface **não congela mais** (o spinner global “Preparando…” funciona), mas cada navegação paga **3–9 idas ao Supabase em série** (o gate sozinho faz 2–3 verificações por navegação). Em conexão móvel média, isso vira 5–12 s de espera — o que explica a sensação de lentidão mesmo com spinner.

### 2.3 Ações cronometradas
| Ação | Tempo observado | Feedback durante | Feedback depois |
|---|---|---|---|
| Login com credenciais corretas | 0,6–1,1 s | botão “Um momento…” | vai para /studio, sem toast |
| Login com senha errada | 1,1 s | botão “Um momento…” | toast “E-mail ou senha incorretos. Confira e tente de novo.” (traduzido, bom) |
| Cadastro de conta nova | 0,7 s até criar sessão | botão “Um momento…” | redireciona; nenhum “conta criada” |
| Salvar consentimento + ir ao onboarding | 3,6 s | botão “Salvando…” | ✓ sem toast |
| Salvar onboarding | 1,6 s | botão | toast “Perfil salvo” ✓ |
| Gerar sugestões no Estúdio | **21 s** | botão “Compondo seus convites…” desabilitado, sem %/estimativa/cancelar | redireciona a /dashboard sem toast |
| Salvar sugestão / aprovar | 1,7–1,9 s | botão sem estado? | toast “Atualizado” ✓ |
| Exportar sugestão (.md) | <0,1 s | — | download imediato ✓ |
| Baixar todas | 0,08 s | — | `aura-id-plano.md` ✓ (com 1 pacote elegível) |
| Criar coleção | ~1,3 s | — | sem toast; coleção aparece |
| Salvar registro no diário | 3,1 s | botão | toast “Reflexão guardada.” ✓ |
| Logout | ~1,0 s | nada | vai para `/`, sem “Saindo…”/toast |
| Abrir Google OAuth | 7,1 s até a tela do Google | sem estado no botão | redireciona corretamente |

### 2.4 Rede e sessão
| Cenário | Resultado observado |
|---|---|
| **Rede lenta (3 s de latência, 200 kbps)** | “Preparando…” apareceu em **6,7 s**; após **60 s** o conteúdo do dashboard **ainda não havia carregado**. Sem timeout, sem erro, sem botão “tentar de novo”. |
| **Offline (após carregar o dashboard)** | clicar em um filtro **não mostrou nenhum erro**; requisições falharam com `ERR_ABORTED` e a tela continuou com dados antigos, como se estivesse tudo bem. |
| **Sessão expirada (token removido + navegação)** | redirecionamento **silencioso** para `/auth` (“Que bom te ver”), sem “sua sessão expirou” e sem preservar a tela de origem. |
| **Segunda aba aberta** | logout na aba 1 fez a aba 2 ir para `/auth` em ~4 s (bom), também sem aviso. |
| **Multi-dispositivo real** | não testado; a sessão é JWT do Supabase (persiste no navegador) e as trilhas são `localStorage` (não seguem a conta — ver A-06). |
| **Tempo de inatividade prolongado** | não testado por horas; a expiração de token foi simulada e o comportamento é o do item acima. |

### 2.5 Responsividade e teclado
- **375 px (celular):** sem overflow horizontal da página; **o menu não vira hambúrguer** — os links ficam numa faixa de **1.275 px** que rola dentro do header. Na prática, só “Trilhas” e “Sair” aparecem como botões; o resto exige rolagem lateral sem indicador.
- **768 px (tablet):** mesma faixa rolável; conteúdo em coluna única.
- **1440 px (desktop):** a navegação interna ainda tem ~1.735 px de largura para 1.152 px de espaço em uma das medições (com 2 trilhas) — itens ficam ocultos até rolar.
- **Botão de opinião:** 48×48 px no canto, sem sobrepor o CTA de cadastro em 375 px (a correção anterior funcionou).
- **Teclado:** Tab percorre os links do header (sem `aria-current`); Enter funciona no login; **Escape não fecha o modal de Trilhas**; o modal não tem `role="dialog"`, não prende o foco e não tem botão de fechar — só clique no fundo ou “Agora não”.
- **Formulários:** os `Label` visíveis **não estão associados** aos campos (`htmlFor` ausente) — `getByLabel("Altura")` retorna 0. Leitor de tela lê “campo de edição” sem nome. Switches de consentimento também não têm `aria-label` próprio (4 em Configurações; 1 em Modelo).

---

## 3. Mapa de telas e fluxos percorridos (visão de conjunto)

### 3.1 Portas de entrada
| Entrada | O que acontece | Observação |
|---|---|---|
| `/` (landing) | hero, princípios, CTAs “Entrar” e “Começar meu perfil” | **vaza nota interna de build no rodapé** (A-02); carregou em 21 s no primeiro acesso (compilação dev) |
| `/auth` | login, cadastro (toggle), Google | sem “esqueci minha senha”, sem termos/privacidade, sem requisitos de senha; validação nativa do navegador; senha exige 8 no HTML e a mensagem de erro fala em 6 |
| `/p/$slug` (micropágina) | perfil público do profissional | estado “não encontrado” claro; CTA “Enviar meu briefing” **não inicia envio** (A-03); “Ver profissionais perto de mim” leva a uma tela sem busca (A-04) |
| `/consent` | 3 chaves + termo de ciência + trilhas | chaves desligadas por padrão; “Continuar” desabilitado até marcar a ciência; a escolha de trilhas abre por cima |
| `/onboarding` | 6 passos (Rápido) ou 9 (Assistido) | autosave/retomada; 18 pendências no passo 1; labels sem associação; modo “Assistido” adiciona dicas/exemplos |
| `/studio` | humor + cartão + ocasião + intensidade + “Criar minhas sugestões” | gera em 21 s; desvios para Barba/Maquiagem perdem o contexto escolhido (F14) |
| `/dashboard` | acervo de sugestões com filtros | cards só aparecem depois do conteúdo; filtros sem contagem/`aria-pressed`; sem busca/ordenação; banner do guia só quando já há pacotes |
| `/guia` | 5 passos com exemplos | promete recursos que não existem em todas as telas (A-05) |

### 3.2 Criação e acervo
- **Estúdio → dashboard → pacote:** gerar (21 s) → cards com indicadores → abrir → salvar/aprovar/rejeitar/exportar/adaptar → feedback. Sem excluir, duplicar, compartilhar ou histórico por item.
- **Maquiagem / Cabelo / Roupas:** cada módulo tem wizard próprio, lista e detalhe; ações variam (ver matriz em §4.3).
- **Tatuagem:** 7 abas (Projetos, Intenção, Conceitos, Referências, Decisão, Briefing, Cuidados); salvar intenção leva direto a “Explorar conceitos”; exclusão de projeto tem confirmação rica; diário de cuidados exclui registro sem confirmação.
- **Jornada:** plano (intenção, duração, passos), diário visual (foto + reflexão + notas 1–5), antes/depois, relatórios; **clicar em “Criar plano” vazio cria um plano com o primeiro item selecionado e 0 passos** (L-07).
- **Estética:** medição/simulação/briefing em uma página, com avisos fortes; 4–5 chamadas de IA por sessão sem contador (F01).
- **DNA Visual:** resumo editável, preferências, permissões por módulo, versões, linha do tempo, redefinir/exportar JSON.
- **Modelo / Retrato:** bloqueados até consentimentos específicos; depois do “Autorizar”, Modelo pede 3–8 fotos e diz “a primeira geração é grátis” ao lado de “restam 2 de 2 grátis”.
- **Coleções / Comparar / Exportar:** coleção sem confirmação de exclusão; comparação só por seleção de cards; export funciona para pacotes `aura` e quebra para `outfit`/`hair_plan` (A-01/F03).
- **Profissionais / Vitrine / Aura Pass:** rede e assinatura; `/profissionais` não está no menu (A-04); Pass mostra preço e estados, mas copy de “5 imagens” não bate com a cota real (A-12).

### 3.3 Configurações e saída
- Consentimentos (4 switches salvam na hora; persistiu após reload), lembretes (adicionar vazio é no-op silencioso; criar com data funciona; “Feito/Remover”), exclusões (fotos/sugestões/conta com confirmação clara e irreversível), link para DNA (redefinir/exportar), link para Pass.
- **Não há** troca de senha, troca de e-mail, encerrar sessões, excluir conta com exportação prévia ou “esqueci minha senha”.
- **Feedback 💬** presente em todas as páginas (inclusive login), com tipos e contato opcional.

---

## 4. Comportamento dos elementos interativos

### 4.1 Inventário e comportamento
| Elemento | Onde | Comportamento testado | Problema encontrado |
|---|---|---|---|
| **Botão primário** (Criar, Salvar, Gerar) | todas | clique único inicia e desabilita em parte das telas; **duplo clique rápido não é bloqueado em todas** | criar coleção 2× = 2 coleções; “Salvar” pode ser clicado repetidamente (toasts empilhados) |
| **Botão de ícone** | header, cards, feedback | ícone-only sem `aria-label` em vários lugares | leitor de tela não anuncia; alvo de toque pequeno em alguns |
| **Menus suspensos (select)** | onboarding, tatuagem, jornada, admin | nativos, funcionam | rótulos visuais não associados; alguns selects sem opção vazia (ex.: projeto) |
| **Campos de texto** | todas | validação nativa (required/minLength) | mensagens do navegador, não do produto; sem explicação de formato; sem contador |
| **Áreas de texto** | diário, briefings, onboarding | aceitam texto livre; autosave só no onboarding | perda do conteúdo ao sair em quase todos os formulários (F32) |
| **Drag-and-drop** | uploads de foto | componente tem dropzone; testado por input de arquivo | aceita JPG/PNG/WebP até 10 MB com mensagem clara; **sem arrastar testado em mobile** |
| **Filtros** | dashboard, vitrine, listas | clique alterna estado; funciona | sem contagem, sem `aria-pressed`, sem “limpar filtros”; offline falha em silêncio |
| **Busca interna** | — | **não existe** | nenhuma tela tem busca global ou por item |
| **Abas** | módulos, DNA, profissionais, onboarding | navegação por abas funciona | sem `aria-controls`/painel; abas de roupas rolam sem indicador |
| **Modais de confirmação** | exclusões sensíveis | `Confirm` com descrição do que some | inconsistente: coleção/lembrete/reflexão excluem direto |
| **Mensagens de erro** | login, upload, IA | toasts em PT-BR, upload com limite claro | erros de rede/offline/sessão **não** têm mensagem; erros do gateway viram toast genérico |
| **Atalhos de teclado** | — | Tab/Enter/Escape nativos | nenhum atalho de produto (busca, salvar, novo); Escape não fecha o modal de trilhas |
| **Links para documentação** | guia | existe `/guia` e microcopy de ajuda | não há link contextual nas telas de erro; guia promete o que não existe |
| **Pop-ups de ajuda** | onboarding (HelpChat por campo) | presente | não testado a fundo (depende de IA); não há tour guiado |

### 4.2 Interações: simples, repetidas, prolongadas, combinadas
- **Simples:** fluxos principais funcionam (login, consentir, gerar, salvar, exportar, comparar, criar plano/diário).
- **Repetidas:** duplo clique cria duplicatas em coleções; cliques rápidos em filtros são ok; múltiplos toasts se acumulam e não são limpos.
- **Prolongadas (clique sustentado / long press):** **nenhum comportamento específico** implementado — não há menu de contexto, seleção múltipla ou “segure para…”.
- **Combinadas:** Ctrl/Cmd+clique não seleciona múltiplos; navegação por teclado funciona no básico; **Escape não fecha** o modal de trilhas; foco não fica preso no modal; modais Radix (ex.: exclusão) provavelmente tratam Escape/foco, mas o seletor de trilhas não.
- **Responsivas:** sem menu mobile; header rolável; conteúdo adapta colunas; botão de opinião não atrapalha mais o CTA.

### 4.3 Matriz de ações por área (o que existe de fato)
| Ação | Pacote | Maquiagem | Cabelo | Roupas | Tatuagem | Jornada | DNA | Coleções |
|---|---|---|---|---|---|---|---|---|
| Criar | ● | ● | ● | ● | ● | ● | ● | ● |
| Ver detalhe | ● | ● | ● | ● | ● | ● | ● | ◐ |
| Salvar/aprovar | ● | ● | ● | ● | ● | ◐ | ● | — |
| Rejeitar/feedback | ● | ● | ◐ | ● | ● | ◐ | — | — |
| Comparar | ○ (só via /compare) | ◐ link | ○ | ◐ via /compare | ◐ | ○ | ● | ○ |
| Colecionar | ○ | ○ | ○ | ○ | ● | ○ | ○ | — |
| Exportar | ● `.md` | ● `.md` | ● `.md` | ○ (quebrado no lote) | ● briefing `.md` | ● relatório `.md` | ● JSON | ○ |
| Duplicar/adaptar | ◐ “Adaptar” | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Histórico/versões | ○ | ◐ assinatura | ○ | ○ | ◐ versões | ○ | ● | ○ |
| Excluir | ○ | ○ | ● | ● | ◐ projeto (Confirm); registro sem | ● plano (Confirm); registro sem | ● escopos (Confirm) | ● **sem Confirm** |
| Restaurar | ○ | ○ | ○ | ○ | ○ | ○ | ● (sem Confirm) | ○ |
| Rascunho/retomada | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

---

## 5. Cenários de uso testados

### 5.1 Usuário que acerta
- Cria conta, entende o consentimento, marca ciência, escolhe 2 trilhas, completa onboarding rápido, gera 3 sugestões, aprova uma, exporta o `.md`, cria uma coleção, compara as 3, cria um plano de jornada e registra um diário com foto. **Tudo isso funciona** — com as ressalvas de tempo (21 s de geração), feedback de sucesso ausente em alguns pontos e exclusões sem confirmação.
- **Ponto alto:** a linguagem é acolhedora, os avisos de permanência da tatuagem são claros, o diário explica que fotos não vão para IA, e o briefing de tatuagem exige confirmação de exportação.

### 5.2 Usuário que erra
- **Campos vazios:** login e tatuagem usam validação nativa do navegador (mensagem em PT-BR do Chrome, não do produto); onboarding **não bloqueia** (cria “pendências”); “Criar plano” da jornada **cria plano mesmo vazio**; “Adicionar lembrete” vazio não faz nada e não avisa; criar coleção vazia não faz nada e não avisa.
- **Inputs fora do padrão:** altura 999 mostra aviso gentil (“Confere a altura? Está em centímetros”) — bom; arquivo inválido de foto mostra “Use JPG, PNG ou WebP de até 10 MB” — bom; e-mail inválido é barrado pelo navegador; senha de 6 caracteres é barrada pelo HTML (mas o erro do Supabase fala em 6 — inconsistência).
- **Sequências confusas:** clicar em “Criar plano” vazio e depois tentar adicionar um passo funciona, mas o plano já nasceu com nome de uma intenção que o usuário não escolheu; clicar em “Gerar conceitos” de tatuagem exige projeto, e o seletor vazio não oferece link direto para criar (o link “Nova intenção” existe ao lado).
- **Sem preencher obrigatórios:** o sistema varia entre bloquear (nativo), criar com default silencioso (jornada) e criar pendência (onboarding) — **três filosofias diferentes**.

### 5.3 Uso mínimo (60 s)
Abrir → Estúdio → clicar “Criar minhas sugestões” **sem escolher nada** → **funciona**: 3 sugestões genéricas foram geradas e apareceram no dashboard. Isso é ótimo para não travar, mas perigoso: o usuário não escolheu humor, cartão nem intensidade e recebeu um resultado “aleatório” sem aviso de que nada foi selecionado.

### 5.4 Uso intenso
- Não testado com dezenas de projetos; a lista de planos de jornada e a lista de tatuagens mostram contagem (“0 projetos · 0 versões”, “1 projetos”), sem busca/ordenação — com volume, a gestão fica difícil.
- Muitas abas: a segunda aba reflete logout; não há aviso de “sessão em outro dispositivo”.
- Sessões longas: não testadas por horas; expiração simulada é silenciosa.

### 5.5 Mudança de ideia no meio, interrupção e retomada
- **Onboarding:** retoma pelo último passo salvo (autosave 800 ms) — funciona; mas se a rede falhar, o autosave não avisa e o rascunho pode ser perdido.
- **Estúdio/jornada/tatuagem:** **não há rascunho**; sair no meio perde o que foi digitado (F32).
- **Geração em andamento:** se recarregar durante uma geração de referência, o estado “generating” pode bloquear novas gerações e a mensagem manda “descartar” sem botão (F30).
- **Trabalho antigo:** pacotes, planos e diários persistem na conta; versões só no DNA; não há “restaurar” em nenhum outro módulo.
- **Reorganização:** não há renomear/agrupar/duplicar/mover itens; a única forma de reorganizar é criar coleções (sem edição) ou apagar e refazer.

---

## 6. Feedback, fluidez e estados de interface

### 6.1 O que funciona
- Spinner global “Preparando…” com `role=status` após 300 ms — elimina a tela branca na navegação.
- Botão “Compondo seus convites…” durante a geração; upload inválido com mensagem clara; toasts em PT-BR; confirmações ricas em exclusões sensíveis; “Status atual: Nova → Salva → Aprovada” visível no pacote.
- Diálogos de exclusão com texto explícito (“Remove passos, reflexões, fotos, relatórios e lembretes deste plano. Não pode ser desfeito.”).

### 6.2 O que falta ou engana
- **Falsos sucessos:** “Salvar nota” vazio responde “Atualizado”; “Enviar feedback” sem nenhuma nota responde “Obrigada(o) — seu DNA Visual recebeu este sinal”; “Seu modelo pessoal está pronto” pode aparecer mesmo com falha das duas gerações (F05); Cabelo mostra sucesso sem checar erro (F16).
- **Falsos vazios:** `/collections`, `/compare` e `/export` ignoram erro e mostram “vazio” — usuário acha que não tem dados (A-18).
- **Silêncios:** offline, sessão expirada, “Adicionar” vazio, “Criar coleção” vazia, “Criar lembrete” vazio, “Agora não” do trilhas (que reabre depois).
- **Sem cancelar/retomar:** geração de IA sem cancelamento/timeout; nenhuma operação tem “tentar de novo” visível.
- **Sem diferenciação suficiente:** excluir coleção é 1 clique seco; excluir sugestões tem modal rico. O usuário aprende o oposto do que deveria.

### 6.3 Sensação de fluidez
- Com cache quente e rede boa: navegação 2–5 s com spinner — aceitável, mas não “instantâneo”.
- Com rede lenta: spinner aparece em 6,7 s e **não há limite** — a interface “congela em espera” sem dizer que falhou.
- A geração de 21 s é o pior momento de espera do produto; sem barra de progresso, estimativa ou opção de continuar navegando.

---

## 7. Consistência: vocabulário, rótulos, tom e padrões

### 7.1 Vocabulário (mesmo conceito, nomes diferentes)
| Conceito | Nomes encontrados | Risco |
|---|---|---|
| Resultado gerado pela IA | **sugestão, convite, pacote, plano, look, ideia** | o usuário não sabe se são a mesma coisa |
| Conjunto de módulos | **trilha, módulo, seção** | “trilha” só aparece no seletor e no botão |
| Fotos-base | **Meu Modelo, modelo pessoal, avatar, espelho, retrato** | confunde com “Aura Retrato” (edição de foto real) |
| Assinatura | **Pass, Aura Pass, assinatura, plano Profissional, 💎** | dois produtos e dois preços sem mapa |
| Estado do item | **Nova/Salva/Aprovada/Rejeitada; Em teste/Aprovado/Não funcionou…; 7 status de jornada** | três dicionários de status |
| Histórico | **versões, linha do tempo, histórico, diário, relatório** | o usuário não sabe onde procurar o que mudou |
| Briefing | **briefing, guia, documento, orientação** | ok em geral, mas o CTA público promete envio que não existe |

### 7.2 Rótulos e microcopy
- “Curiosa(o)”, “Corajosa(o)”, “Celebrando” — neutralização com “(o)” soa estranha e quebra a fluidez.
- “A verificação reprovar a edição” (erro de português) em Retrato.
- “Provadores fotorrealistas…: [FORA DO ESCOPO DOS CONECTORES LOVABLE]” na landing e rodapés — **vazamento de bastidor**.
- “1 projetos · 0 versões” (concordância) e “restam 5 de 5 grátis” repetido em cada variação.
- “Envie de 3 a 8 fotos” no Modelo x “duas imagens-base (rosto e corpo)” no guia x “restam 2 de 2 grátis” x “a primeira geração é grátis”.
- “Até 3 trilhas” x 4 permitidas.
- “Só o que você escolher aparece no menu” x itens fixos sempre visíveis (Estúdio, Sugestões, DNA, Comparar, Exportar, Configurações, Estética, Modelo, Retrato, Pass).
- Mistura de `<Link>` e `<Button>` para navegação, com estilos diferentes para o mesmo papel.

### 7.3 Padrões inconsistentes
- Fim de fluxo: Estúdio → dashboard; Maquiagem/Roupas → lista; Cabelo/Tatuagem → detalhe.
- Confirmação: 3 tratamentos (Confirm, `confirm()` nativo, nenhum).
- Salvamento: alguns com toast, outros silenciosos; alguns com erro tratado, outros não.
- Paywall: 7 frases diferentes e detecção por regex de mensagem de erro (F31).
- Acessibilidade: alguns `aria-label` corretos (botão de opinião, spinner) e muitos ausentes (switches, ícones, sliders, abas).

---

## 8. Acessibilidade (o que foi possível verificar)

| Item | Situação | Evidência |
|---|---|---|
| Labels de formulário | **não associados** (`htmlFor`/`id` ausentes) | `getByLabel("Altura")` = 0; onboarding.tsx:199,203-206 |
| Switches de consentimento | sem `aria-label` próprio; 4 em Configurações e 1 em Modelo | não anunciam o que controlam |
| Sliders de onboarding/notas | sem `id`/`aria-label` | F43 |
| Abas | sem `aria-controls`/painel | F43 |
| Modal de trilhas | sem `role=dialog`, sem foco preso, Escape não fecha | testado ao vivo |
| Contraste | accent 3,02:1 e branco sobre accent 3,06:1 — falha AA | cálculo da auditoria 06 |
| Imagens | falta alt em várias; ícones decorativos às vezes sem `aria-hidden` | auditoria 06 |
| Navegação por teclado | funciona no básico; sem atalhos; sem `aria-current` no menu | testado |
| Textos pequenos | avisos legais e rótulos de IA em 10–11 px | A-29/F42 |

---

## 9. Achados consolidados (priorizados)

> Fontes: **L** = observado ao vivo nesta sessão; **A/F/C** = auditorias estáticas com evidência `arquivo:linha` nos documentos `auditoria/04`, `05` e `06`. A lista abaixo é o **conjunto deduplicado**; os detalhes completos estão nesses três anexos.

### 🔴 Críticos (bloqueiam conclusão de tarefa, confiança ou dados)
| ID | Problema | Evidência | Impacto |
|---|---|---|---|
| **L-01** | Seletor de Trilhas vira **loop**: “Agora não” não salva dispensa; ao navegar para qualquer tela ele reabre por cima, bloqueando o uso até escolher trilhas | teste ao vivo 08/11; `TrilhaPicker.tsx:18-21,55`; `trilhas.ts:57-79`; `route.tsx:31-40` | usuário iniciante fica preso no modal; abandono |
| **L-02** | Trilhas permitem **4 seleções** (“até 3”) e a combinação Cabelo + Barbearia **duplica “Cabelo” no menu** (erro React de chave duplicada no console) | teste ao vivo; `TrilhaPicker.tsx:57`; `trilhas.ts:87-96` | menu inconsistente, quebra de renderização |
| **L-03** | **Sessão expirada / rede falha** redireciona para `/auth` sem explicar; offline, ações falham **em silêncio** | teste ao vivo; `_authenticated/route.tsx:10-19` | usuário acha que perdeu a conta/o app quebrou |
| **L-04** | **Rede lenta**: “Preparando…” fica indefinidamente; nenhuma chamada de IA tem timeout/abort/cancelar | teste ao vivo (60 s sem conteúdo); `stream-image.ts`; `ReferenceImage.tsx` | interface “congelada em espera”; desistência |
| **A-01/F03** | **Exportar/Comparar quebram** para `outfit` e `hair_plan`: “Baixar todas” e download individual não geram arquivo nem avisam; comparação mostra “undefined” | `export.tsx:9,22,34`; `aura.ts:108-115`; `clothing.ts:9-13`; `hair.ts:30-36`; `compare.tsx:43` | ação de saída central falha justamente nos módulos de roupa/cabelo |
| **A-02/F42** | Jargão interno visível, inclusive na **landing pública** e rodapés de 4 módulos | `index.tsx:64-66`; `maquiagem/route.tsx:26`; `cabelo/route.tsx:23`; `roupas/route.tsx:26`; `tatuagem/route.tsx:5` | primeira impressão amadora; contradiz o hero |
| **A-03** | CTA público “Enviar meu briefing” **não inicia envio**; deslogado cai em `/auth` e depois em `/studio` (perde a profissional) | `p.$slug.tsx:77`; `auth.tsx:42-46`; `EnviarBriefing.tsx` | funil público quebrado |
| **A-10/C1** | Exclusão de conta **não é transacional** e deixa fotos/tabelas de módulos para trás, embora a UI diga “remove tudo” | `settings.tsx:71-76,121`; `aura.functions.ts:157-169` | risco LGPD e conta parcialmente apagada |
| **F05** | Modelo mostra **sucesso falso** mesmo quando as gerações falham | `modelo.tsx:106-114` | usuário fica sem imagem e sem entender |
| **F06** | Envio de simulação/corpo a profissional sem consentimento específico, com copy contraditória (“só você vê” / “nada será enviado”) | `vitrine.tsx:76-81`; `EnviarBriefing.tsx:49-52`; `TattooPlanView.tsx:30` | dado sensível compartilhado sem base clara |
| **F09/L-05** | Exclusões **sem confirmação** de registros íntimos (diário de cicatrização, foto de referência, foto/reflexão da jornada) e de coleção/lembrete | `TattooPlanView.tsx:41`; `TattooPhotos.tsx:19`; `JourneyWorkspace.tsx:132,134`; testado: coleção some no 1º clique | perda irreversível com um clique |
| **L-06** | **Duplo clique cria duplicata** (2 coleções idênticas) | teste ao vivo; `collections.tsx` | acúmulo e confusão |
| **L-07** | “Criar plano” vazio na Jornada **cria plano** com intenção default e 0 passos | teste ao vivo; `jornada/objetivo` | plano fantasma + diário exige passo (F25) |
| **F01/F07** | Estética faz 4–5 chamadas de IA sem contador e “provar barba” consome a cota do Retrato | `estetica.tsx:63,77,87,102`; `estetica.functions.ts:70`; `barba.tsx:80` | custo invisível e paywall surpresa |
| **F25** | Jornada: plano sem passo não permite registrar foto (diário exige passo), embora a UI ofereça “registro livre” | `JourneyWorkspace.tsx:48,95,130-131` | beco sem saída no acervo principal do módulo |

### 🟠 Altos
| ID | Problema | Evidência |
|---|---|---|
| **A-04** | `/profissionais` órfã no menu; página sem busca/listagem; toasts mandam para aba invisível | `p.$slug.tsx:45,77`; `profissionais.tsx:171-380`; `EnviarBriefing.tsx:54` |
| **A-05** | Guia promete “Entendi assim”, contador de grátis e “usar meu modelo” em lugares onde não existem | `guia.tsx:24,30,31` |
| **A-06** | Gate trata falha de rede como logout; ciclo `/studio ↔ /auth` possível | `_authenticated/route.tsx:11-12`; `auth.tsx:42-46` |
| **A-07** | Sem “esqueci minha senha”/reenvio de confirmação; senha exige 8 mas mensagem fala 6 | `auth.tsx:11-19,84`; grep `resetPasswordForEmail` = 0 |
| **A-08/L-08** | Consentimento não oferece “Imagens de IA” no primeiro acesso; onboarding oferece Retrato que exige essa permissão (desligada) | `consent.tsx:19-24`; `onboarding.tsx:176-187` |
| **A-11** | “Editar preferências” abre wizard inteiro e termina em `/studio`; salvar perfil existente injeta 10 sinais no DNA | `settings.tsx:87`; `onboarding.tsx:110-121` |
| **A-12** | Aura Pass: “5 imagens” x 18 reais; sem “verificar novamente” após checkout; assinante pode ver oferta durante carregamento | `aura-pass.tsx:15,83,88`; `uso.functions.ts:11-18` |
| **A-13/A-14/A-15** | 4 nomes para o objeto central; Pass × Pro ambíguos; “retrato” com dois sentidos | várias (ver auditoria 04 §4) |
| **L-09** | Onboarding abre com **“18 pendente(s)”** no passo 1 e campos de barba/maquiagem para todos, sem contexto | teste ao vivo; `onboarding.tsx:174`; `onboarding.ts:129-155` |
| **L-10** | **Menu sem versão mobile**: 15–20 itens em faixa rolável (1.275 px), sem hambúrguer, sem `aria-current` | teste 375/768/1440; `route.tsx:46-64` |
| **L-11** | **Sem feedback de sucesso** em pontos-chave: salvar intenção de tatuagem, criar coleção, criar plano, consentimento, logout | teste ao vivo |
| **L-12** | **Salvar nota vazia** e **feedback sem notas** respondem como sucesso (“Atualizado” / “DNA recebeu este sinal”) | teste ao vivo; `package.$id.tsx` |
| **F11/F31** | Paywall por regex de string; 402 de texto vira toast sem preço/link em 6 telas | `ai.server.ts:22`; telas de geração; §11.4 auditoria 05 |
| **F14** | Desvios do Estúdio para Barba/Maquiagem perdem humor/ocasião/intensidade | `studio.tsx:37-39` |
| **F15** | Destino pós-geração diferente por módulo | maquiagem/roupas × cabelo/tatuagem × studio |
| **F16/A-18** | “Salvar”/“Não é para mim” sem checar erro; listas tratam erro como vazio | `cabelo/plano.$id.tsx:33-37`; `collections.tsx:19-20`; `compare.tsx:17-20`; `export.tsx:17` |
| **F19** | Look de maquiagem não pode ser excluído; sem exportar imagem | `maquiagem/look.$id.tsx:100-107` |
| **F20** | Assinatura de maquiagem edita **JSON cru**, sem validação, sem toast, com `insert` a cada edição | `maquiagem/assinatura.tsx:35-42,65-68` |
| **F21** | Preset de kit **gera na hora** sem prévia/confirmação; excluir kit sem confirmação | `maquiagem/kits.tsx:36-48` |
| **F23/F24** | Tatuagem: select vazio em 5 telas, briefing sem conceito sem link; vitrine fora da nav do módulo | `TattooPhotos.tsx:19`; `TattooPlanView.tsx:30,35`; `tatuagem/route.tsx:5` |
| **F26** | Mudar status de passo não dá feedback; não há remover passo nem apagar lembrete | `JourneyWorkspace.tsx:99,103` |
| **F27** | Roupas (lacunas/compra/missões) sem loading/erro; execuções empilham análises invisíveis | `lacunas.tsx:24-34`; `compra.tsx:26-32`; `missoes.tsx:22-32` |
| **F30** | Estado “generating” persistido bloqueia novas gerações; mensagem manda descartar sem botão | `ReferenceImage.tsx:328,239-240` |
| **F32** | Nenhum formulário de criação tem draft/autosave (só onboarding) | §11.3 auditoria 05 |
| **F33** | Colecionar/comparar só têm links em poucas telas de detalhe | `TattooPlanView.tsx:26`; `maquiagem/look.$id.tsx:106`; `package.$id.tsx:121-142` |
| **F34** | Profissionais: 4 abas para 2 personas; “Recebidos” não aparece quando vazio | `profissionais.tsx:197-202` |
| **F35** | Loader sem boundary local derruba o módulo inteiro em 1 falha | `tatuagem/route.tsx:4`; `journey/index.tsx:4` |
| **C2** | “Gerar novamente” apaga a referência anterior sem aviso | `ReferenceImage.tsx:169` |
| **A-21/C1** | Configurações sem troca de senha/e-mail/sessões/exportação clara | `settings.tsx:78-128` |
| **A-24** | Google sem estado de carregamento (clique duplo abre 2 tentativas); sem requisitos de senha; sem Termos/Privacidade | `auth.tsx:80-89` |
| **A-30** | Profissional não consegue despublicar perfil; “pausar” design não revoga URL pública | `profissionais.tsx:101-121,315-353` |

### 🟡 Médios (amostra representativa)
- Onboarding: autosave sem tratamento de erro; pendências não ressurgem fora do wizard; labels sem `htmlFor`; abas sem painel (A-19).
- Dashboard: banner do guia só com pacotes; filtros sem contagem; cards `outfit/hair` exibem `undefined` (A-20).
- DNA: “Restaurar” sem confirmação; “Isso está errado” grava `[]`; barba desligada por padrão (F36/F37).
- Modelo: fotos-fonte não entram em `photos` e não são gerenciáveis após reload (F38).
- Retrato: retry consome 2ª unidade de cota sem aviso; “Sua reação” começa em 4 e grava sinal falso (F39/F40).
- Roupas: “Usei hoje” sem consequência; evento de onboarding errado ao salvar perfil (F28); foto descartada em silêncio sem consent (F10).
- Estética: briefing não persiste; registros não editáveis; foto de medição órfã (F12/F13); “Trocar procedimento” não limpa simulação antiga (F47).
- Jornada: “Meu mês em imagens” não contém imagens (F46); status de passo sem feedback (F26).
- Acessibilidade: sliders/cards/abas sem semântica; contraste AA falho; textos de 10–11 px (F43; auditoria 06).
- Responsividade: header; tabela do DNA sem scroll; abas de roupas sem indicador (F44).
- Microcopy: “1 projetos”, “(o)”, “A verificação reprovar”, placeholders internos.
- Navegação: 404/erro mandam para landing mesmo logado (A-27); logout sem “Saindo…” (A-23).

### 🟢 Baixos / a preservar
- Spinner global, botão de opinião compacto e tradução de erros de login (correções anteriores confirmadas).
- Gate de consentimento real impede uso sem consentimento.
- Confirmações ricas nas ações certas; avisos de permanência da tatuagem; privacidade explícita no diário; exportação de briefing com confirmação; estados de checkout do Pass; `/p/$slug` com estados de carregamento/não encontrado.
- Toasts claros para upload inválido, erro de login, “Perfil salvo”, “Reflexão guardada”, “Lembrete criado”.
- 404 personalizado e claro.

---

## 10. O que está bom e deve ser preservado (não regredir)
1. **Consentimento como porta de entrada** e gate real (raro).
2. **Linguagem acolhedora e não julgadora** em consentimento, guia, tatuagem e diário.
3. **Confirmações ricas** de exclusão de fotos/sugestões/conta/plano — modelo a replicar.
4. **Privacidade declarada** no diário (“fotos não são analisadas por IA”, “nunca exportada”).
5. **Briefing de tatuagem com confirmação obrigatória** e exclusão do lote de exportação.
6. **Spinner global** e **estado de geração** no botão.
7. **Erros de login traduzidos** e mensagens de upload claras.
8. **404 personalizado**, estados vazios com próximo passo (“Abrir o Estúdio”, “Criar um plano”).
9. **Primeira geração gratuita** e chips de cota visíveis onde a ação acontece.

---

## 11. O que parece “travado” × o que é lento (diagnóstico honesto)
| Sintoma | É bug? | Explicação |
|---|---|---|
| Tela em branco ao navegar | **corrigido** (spinner) | router tem `defaultPendingComponent` |
| “Preparando…” por 20 s | **não é freeze** | gate + 3–9 consultas em série; spinner aparece, mas não há timeout |
| “Compondo…” por 21 s | **não é freeze** | geração de IA real; falta progresso/cancelar |
| Clicar em filtro offline e nada acontecer | **falha silenciosa** | erro ignorado e dados antigos mantidos |
| Sessão “sumiu” e voltou ao login | **falha de comunicação** | redirect sem aviso |
| Logout “demora” e não mostra nada | **falta de estado** | `signOut` + `nav` sem “Saindo…” |
| Modal de trilhas reaparecendo | **loop** | dispensa não é persistida |

---

## 12. PLANO DE CORREÇÃO EM ETAPAS

> **Status em 10/11/2026:** a **Etapa 0 (10 correções imediatas)** foi executada e validada com TypeScript (0 erros), build, 33 testes automatizados e 41 verificações em navegador real. A **Onda 1 da Etapa 1 (ativação)** entregou onboarding gentil, packs prontos, assistente guiado, menu mobile, dashboard útil no vazio, feedback de fim de fluxo e cotas de estética/barba. A **Onda 2 (confiança e retomada)** entregou rascunho/retomada universal, painel de conta, recuperação de senha, glossário/vocabulário, profissionais no menu com busca e cartões de paywall. A **Onda 3 (notificações, busca e modo simples)** entregou sino in-app, busca global ⌘K, modo simples × completo e 57 correções de acessibilidade/microcopy. A **Onda 1 da Etapa 2 (design system de estados)** unificou cabeçalhos, carregando, vazio, erro com retry, superfícies e foco em 49 arquivos, com 13 testes novos. A **Onda 2 da Etapa 2 (microcopy + contraste AA)** neutralizou gênero, padronizou ~70 erros, criou o guia de estilo, escureceu o `accent` para 5,37:1 e mediu contraste em navegador (0 pares abaixo de AA) e foco visível. A **Onda 3 da Etapa 2 (busca, versões e instrumentação)** ampliou o ⌘K para 6 fontes com busca sem acento e atalho `?`, adicionou duplicação/linha do tempo de sugestões em 5 tipos e instrumentou telas/erros com funil de 7 dias no admin, fechando a regressão de 24 rotas. Detalhes em [ETAPA-0-EXECUCAO.md](ETAPA-0-EXECUCAO.md), [ETAPA-1-ONDA-1.md](ETAPA-1-ONDA-1.md), [ETAPA-1-ONDA-2.md](ETAPA-1-ONDA-2.md), [ETAPA-1-ONDA-3.md](ETAPA-1-ONDA-3.md), [ETAPA-2-ONDA-1.md](ETAPA-2-ONDA-1.md), [ETAPA-2-ONDA-2.md](ETAPA-2-ONDA-2.md), [ETAPA-2-ONDA-3.md](ETAPA-2-ONDA-3.md) e [GUIA-DE-ESTILO-AURA.md](GUIA-DE-ESTILO-AURA.md). O **[RELATORIO-LANCAMENTO-AURA-ID.md](RELATORIO-LANCAMENTO-AURA-ID.md)** consolida o estado de prontidão para lançamento (24 áreas, 5 bloqueios, segurança, plano e checklist). O **[CORRECOES-USUARIO-REAL-2026-11-10.md](CORRECOES-USUARIO-REAL-2026-11-10.md)** registra as correções do teste real de 10/11 (tatuagem com texto/região errada, consentimento não reconhecido em Retrato/Modelo e varredura dos módulos). A Etapa 2 está concluída no que é executável sem infraestrutura externa; a rodada com 5 usuários reais (2.8) depende de recrutamento.

> Critério de prioridade: **P0** = impede concluir tarefa ou destrói confiança/dado; **P1** = atrapalha ativação, clareza e consistência; **P2** = polimento e acessibilidade. Cada item tem indicador qualitativo (Q) e quantitativo (Qt) e teste de validação (T).

### Etapa 0 — Correções imediatas (24–72 h | bloqueios críticos)
| # | Problema → Solução | Impacto / causa | Indicadores | Teste de validação |
|---|---|---|---|---|
| 0.1 | **Export/Compare com template por `kind`** (`packageToMarkdown` por tipo + fallback) e teste para outfit/hair | ação de saída quebra; template único assumiu `AuraPackage` | Q: “exportei e funcionou”; Qt: 0 falhas de download em 20 tentativas por tipo; tickets “não baixa” ↓ | T: criar look de roupa e plano de cabelo, exportar individual e “Baixar todas”; conferir `.md` |
| 0.2 | **Remover jargão de build** da landing e rodapés; substituir por frase de produto ou remover | primeira impressão; nota de dev vazada | Q: landing sem termos internos; Qt: 0 ocorrências de “conector Lovable” na UI | T: varrer `/`, `/maquiagem`, `/cabelo`, `/roupas`, `/tatuagem`, `/admin` |
| 0.3 | **Corrigir loop e limite das trilhas**: persistir dispensa (ou abrir só uma vez por login), máximo 3 com feedback, deduplicar links por rota; `aria`/Escape/foco no modal | onboarding travado; menu duplicado | Q: “consigo usar sem o modal voltar”; Qt: 0 erros de chave no console; 0 duplicatas no menu; 3/3 tentativas de 4ª trilha bloqueadas | T: “Agora não” → navegar 5 telas → modal não volta; selecionar 4 (bloqueia na 3ª); checar console |
| 0.4 | **Mensagens de sessão/offline/rede**: banner “sem conexão”, “sessão expirada, entre de novo”, retry nas consultas, timeout visível | usuário não entende o que houve | Q: usuários relatam entender; Qt: 0 telas mudas em teste offline; retorno ao login com mensagem em 100% dos casos | T: offline + clique; remover token + navegar; 3 s de latência + recarregar |
| 0.5 | **Confirmação única e obrigatória** para exclusões (coleção, lembrete, reflexão, registros de tatuagem/jornada); remover `confirm()` nativo | perda de dado; três padrões | Q: “nunca perdi algo sem querer”; Qt: 100% das exclusões com modal; 0 exclusões imediatas | T: percorrer matriz de 38 fluxos destrutivos (auditoria 06 §4) |
| 0.6 | **Falsos sucessos**: só mostrar sucesso após `error` nulo; feedback vazio/nota vazia não “salva”; modelo só confirma se as 2 gerações retornarem | confiança | Q: “o app não mente”; Qt: 0 toasts de sucesso em falha simulada | T: interceptar rede e falhar chamadas; conferir mensagem |
| 0.7 | **Duplo clique**: desabilitar botões durante submit em todas as criações (coleção, plano, lembrete) | duplicatas | Qt: 0 duplicatas em 10 duplo-cliques por ação | T: repetir os duplos cliques do teste |
| 0.8 | **Jornada vazia**: bloquear “Criar plano” sem intenção/nome **ou** explicar o default e permitir editar; permitir foto sem passo (registro livre) | plano fantasma/beco | Q: “meu plano faz sentido”; Qt: 0 planos sem passos criados por engano | T: criar vazio; tentar diário sem passo |
| 0.9 | **Exclusão de conta completa**: incluir todas as tabelas e Storage; transação/rollback; mensagem de erro em PT | risco LGPD | Qt: contagem pós-exclusão = 0 em todas as tabelas; auditoria de storage vazio | T: conta de teste descartável → excluir → conferir banco/storage |
| 0.10 | **CTA público do briefing**: rota de envio com profissional preservada + redirect pós-login para o destino | funil quebrado | Qt: 100% dos cliques chegam ao envio com profissional; Q: “cliente conseguiu pedir orçamento” | T: deslogado → clicar → criar conta → conferir profissional selecionado |

### Etapa 1 — Curto prazo (1–2 semanas | fluxo, mensagens e orientação)
| # | Correção | Impacto | Indicadores |
|---|---|---|---|
| 1.1 | **Onboarding mais gentil**: trocar “18 pendente(s)” por “faltam X para o primeiro resultado”; só pedir o essencial; perguntar apresentação antes de barba/maquiagem; “pular” com resumo de impacto | ativação; medo de formulário longo | Q: “não me senti perdido”; Qt: conclusão do onboarding ↑; tempo até 1º resultado ↓ |
| 1.2 | **Assistente “o que você quer hoje?”** com navegação guiada (botão ?) | iniciantes; primeiro resultado mais rápido | Qt: tempo cadastro→primeira geração ↓ 30%; abandono no onboarding ↓ |
| 1.3 | **Packs prontos** (“Casamento de dia”, “Entrevista”, “Primeira tatuagem”…) que pré-preenchem o Estúdio | síndrome da página em branco | Qt: nº de gerações por sessão ↑; 1º clique produtivo ↑ |
| 1.4 | **Rascunho/retomada em todos os formulários** (intenção de tatuagem, passos, diário, notas, retrato) | perda de trabalho | Q: “posso sair e voltar”; Qt: perda de formulário ↓ 90% |
| 1.5 | **Feedback de fim de fluxo padronizado**: sempre abrir o resultado gerado + toast + chip de status | usuário não sabe onde foi parar | Qt: “abriu meu resultado” = 100%; navegação de retorno ↓ |
| 1.6 | **Cota/paywall honesto**: cartão com preço/link em todas as telas com IA; adicionar `webapp.estetica.sim` a `LIMITES`; separar cota de barba da de retrato | custo invisível; surpresa | Q: “sabia quanto ia gastar”; Qt: cliques em “Pass” a partir do erro ↑; reclamações ↓ |
| 1.7 | **Configurações de conta**: nome, e-mail, troca de senha, encerrar sessões, exportar dados com rótulo claro; “esqueci minha senha” após SMTP | expectativa básica/LGPD | Qt: suporte de senha ↓; exportações ↑ |
| 1.8 | **Menu mobile** (hambúrguer/drawer) e `aria-current`; agrupar “módulo/ferramenta” | usabilidade no celular | Q: “acho tudo no celular”; Qt: cliques de navegação ↑ em 375 px |
| 1.9 | **Dashboard útil no vazio**: banner do guia/modelo também sem pacotes; filtros com contagem; busca/ordenação | primeiro acesso | Qt: clique no guia ↑; tempo até 1ª geração ↓ |
| 1.10 | **Vocabulário único** (sugestão, trilha, modelo, briefing, versão) + glossário aplicado | modelo mental | Q: usuários usam o mesmo termo; Qt: dúvidas recorrentes ↓ |
| 1.11 | **Acessibilidade de formulários**: `htmlFor`/`id`, `aria-label` nos switches/sliders, `aria-pressed` em filtros, foco/Escape em modais | inclusão | Qt: auditoria axe = 0 críticos; leitor de tela anuncia campos |
| 1.12 | **Profissionais no menu** + busca/listagem; estados vazios de “Recebidos” visíveis | rede inalcançável | Qt: briefings enviados ↑; profissionais cadastrados ↑ |

### Etapa 2 — Melhoria contínua (2–8 semanas | simplificação e consistência)
| # | Correção | Impacto | Indicadores |
|---|---|---|---|
| 2.1 | ✅ **Design system de estados**: componentes únicos de Loading, Empty, Error, Success, Confirm; toda tela usa ([execução](ETAPA-2-ONDA-1.md)) | consistência e velocidade de desenvolvimento | Qt: 0 telas com padrão próprio; bugs de feedback ↓ |
| 2.2 | ✅ **Revisão de microcopy** (tom, concordância, “(o)”, placeholders, 10–11 px), guia de estilo ([execução](ETAPA-2-ONDA-2.md), [guia](GUIA-DE-ESTILO-AURA.md)) | confiança e clareza | Q: clareza percebida ↑; Qt: tickets de dúvida ↓ |
| 2.3 | ✅ **Consistência visual**: cores/contraste AA (accent 3,0→5,37:1), ícones, espaçamentos, foco visível ([execução](ETAPA-2-ONDA-2.md)) | acessibilidade e polimento | Qt: contraste ≥4,5:1 medido em navegador; 0 pares abaixo |
| 2.4 | **Simplificação progressiva**: agrupar passos (Estética, onboarding), esconder avançados atrás de “Mais opções”, modo Simples × Completo | sobrecarga | Qt: conclusão de fluxos ↑; tempo por tarefa ↓ |
| 2.5 | ✅ **Busca global e atalhos** (⌘K): coleções, lembretes, briefings e profissionais + `?` ajuda ([execução](ETAPA-2-ONDA-3.md)) | produtividade | Qt: 6 fontes na busca; atalhos descobertos no rodapé |
| 2.6 | ✅ **Histórico/versões por item**: duplicar sugestão e linha do tempo do mesmo tipo, sem mudar schema ([execução](ETAPA-2-ONDA-3.md)) | experimentação segura | Qt: duplicação em 5 tipos; histórico em todos os detalhes |
| 2.7 | ✅ **Instrumentação**: `tela_visualizada` e `erro_tela` + funil de 7 dias no admin ([execução](ETAPA-2-ONDA-3.md)) | decidir com dados | Qt: funil e top eventos prontos para conta admin |
| 2.8 | 🟡 **Rodadas de teste**: regressão automatizada de 24 rotas/120 checks pronta ([execução](ETAPA-2-ONDA-3.md)); 5 usuários reais dependem de recrutamento | validar causa raiz sem regressão | Qt: 0 erro de console em 24 rotas; 120/120 checks |

**Ordem prática recomendada:** 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7 → 0.8 → 0.9 → 0.10; depois 1.1 + 1.2 + 1.3 (maior impacto em ativação); depois 1.4–1.12; por fim 2.x. Cada correção deve ser validada com o teste indicado **antes** de seguir para a próxima.

---

## 13. Indicadores globais para saber se o produto melhorou
**Qualitativos**
- Usuários descrevem o app como “fácil de entender”, “não me perdi”, “sabia o que ia acontecer”.
- Redução de dúvidas repetidas no canal 💬 sobre: exportar, onde está o resultado, cota, exclusão, login.
- Percepção de velocidade: “não trava” e “o botão responde”.
- Confiança em ações destrutivas: “pede confirmação antes de apagar”.

**Quantitativos**
- Taxa de conclusão: cadastro → consentimento → onboarding → primeira geração (meta: +30% no funil).
- Tempo até o primeiro resultado (meta: <5 min no onboarding rápido; <2 min com packs).
- Taxa de erro por fluxo (downloads falhos, salvar falho) → 0 nos P0.
- Nº de exclusões acidentais/reatendimentos; tickets de “perdi meu trabalho”.
- Uso de funcionalidades: exportação, briefing, jornada, comparação, Pass.
- NPS/CSAT por etapa e taxa de abandono no onboarding.
- Erros de console por sessão (meta: 0 chaves duplicadas e 0 requisições abortadas não tratadas).

---

## 14. Anexo A — rotas percorridas ao vivo (53)
`/studio`, `/dashboard`, `/guia`, `/settings`, `/collections`, `/compare`, `/export`, `/admin`, `/aura-pass`, `/estetica`, `/barba`, `/modelo`, `/retrato`, `/profissionais`, `/consent`, `/onboarding`, `/maquiagem`, `/maquiagem/gerar`, `/maquiagem/perfil`, `/maquiagem/kits`, `/maquiagem/manual`, `/maquiagem/assinatura`, `/cabelo`, `/cabelo/gerar`, `/cabelo/perfil`, `/cabelo/alertas`, `/roupas`, `/roupas/gerar`, `/roupas/perfil`, `/roupas/armario`, `/roupas/lacunas`, `/roupas/compra`, `/roupas/missoes`, `/tatuagem`, `/tatuagem/gerar`, `/tatuagem/briefing`, `/tatuagem/decisao`, `/tatuagem/referencias`, `/tatuagem/perfil`, `/tatuagem/vitrine`, `/tatuagem/cuidados`, `/jornada`, `/jornada/objetivo`, `/jornada/diario`, `/jornada/galeria`, `/jornada/linha-do-tempo`, `/jornada/relatorios`, `/dna`, `/dna/preferencias`, `/dna/permissoes`, `/dna/versoes`, `/dna/linha-do-tempo`, `/dna/redefinir`. Também: `/`, `/auth`, `/p/nao-existe-e2e`, `/rota-inexistente-e2e`, página de pacote real e inexistente.

## 15. Anexo B — evidências e artefatos
- Capturas de tela: `.e2e/shots/` (numeradas de 01 a 69; principais: `03-pos-cadastro`, `09-onboarding-inicio`, `11-pos-consent`, `17-studio-preenchido`, `20-dashboard-com-dados`, `21-pacote`, `22-pacote-acoes`, `29-settings`, `32-trilhas-4`, `34-pos-logout`, `49-auth-mobile`, `54-sessao-expirada`, `56-offline`, `57-rede-lenta`, `61-404`, `68-collection-duplo`).
- Resultados brutos de navegação: `.e2e/crawl-results.json` (53 rotas, tempos, erros de console/HTTP).
- Scripts de teste reproduzíveis: `.e2e/*.mjs`; harness: `.e2e/lib.mjs`; Chrome CDP: porta 9222.
- Auditorias estáticas: `webapp-lovable/auditoria/04-fluxos-conta-e-navegacao.md` (30 achados), `05-fluxos-modulos.md` (58), `06-qualidade-tecnica-e-ux.md` (69) + `00-DIAGNOSTICO-E-PLANO.md`.
- Comandos de qualidade executados pela auditoria: `tsc --noEmit` 0 erros; `vitest run` 33/33 testes verdes; `eslint` 5.059 problemas (5.028 de formatação); `npm run build` sucesso (~49 s).
- Conta de teste: `teste.aura.1794127859111@example.com` / senha guardada fora do repositório (não versionada). Dados de teste citados no topo; apagar em Configurações antes de excluir a conta.

## 16. Anexo C — limitações do próprio teste
1. Tempos medidos em build de desenvolvimento (Vite) com rede do ambiente; produção tende a ser mais rápida, mas o número de requisições em série é o mesmo.
2. Apenas Chromium 156; Safari/Firefox e aparelhos físicos não foram cobertos.
3. O foco foi UX e fluxo; segurança de banco (RLS), Edge Functions e cobrança real exigem acesso ao painel/SQL e ficaram fora.
4. Uma geração de sugestões foi executada; demais gerações de imagem não (custo real). Os achados de imagem vêm de código + estados de UI.
5. As contagens de achados das auditorias (30/58/69) se sobrepõem entre si e com esta lista; o consolidado desta seção é a referência para priorização.

---

*Documento produzido a partir de teste real no navegador + auditoria de código. Data: 08/11/2026. As evidências de linha vêm dos anexos de auditoria; as evidências de comportamento vêm dos testes E2E descritos no Anexo B.*
