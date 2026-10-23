# Onboarding assistido e progressivo (mesclado ao perfil inicial do Aura ID)

Reformular a tela atual "Vamos conhecer seu contexto" em vez de criar um formulário novo. Tudo continua salvo no mesmo perfil visual, e os módulos Roupas/Cabelo/Maquiagem passam a reaproveitar esses dados.

## O que muda para a pessoa

1. **Modo Rápido e modo Assistido** (substituem "Rápido/Profundo"): o Rápido faz menos perguntas e já vem com respostas sugeridas; o Assistido guia campo a campo, com dicas. Um botão no topo troca de modo a qualquer momento, sem perder nada.
2. **Novas perguntas de características**: formato do corpo, tamanhos (blusa, calça, calçado), altura, peso (opcional), cor dos olhos, cor e textura do cabelo, tom de pele e subtom.
   - Cada campo tem explicação curta, exemplo e valor sugerido, sem termos técnicos.
   - Respostas por **cartões ilustrados clicáveis** (ex.: formato do corpo: retangular, triângulo, triângulo invertido, oval, ampulheta), chips de cor para olhos/cabelo/pele, e sempre "Não sei" e "Pular".
   - Linguagem neutra: nenhum formato é "melhor"; peso é opcional e nunca usado para julgar.
3. **Pular e retomar**: campo pulado fica marcado como pendente; ao final aparece um lembrete gentil (não bloqueia). Ao voltar, a pessoa retoma exatamente do passo onde parou (rascunho salvo automaticamente).
4. **Validação gentil**: se altura/peso ou tamanhos parecerem incoerentes, aparece "Confere este valor?" com sugestão de ajuste — o envio nunca é impedido.
5. **Assistente de dúvidas (chat)**: um botão "Precisa de ajuda?" em cada passo abre um chat curto. Responde em até 2 frases, sempre com um exemplo e botões clicáveis (ex.: "Usar sugestão", "Pular e retomar depois"). A conversa não é guardada.
6. **Avatar espelho**: ilustração estilizada ao lado do formulário que muda na hora (menos de 1 segundo) a cada resposta — formato, altura, tons de pele, olhos e cabelo. Abaixo, 2–3 dicas de caimento e proporção que mudam junto ("com esse formato, experimente…"), sempre como convite.
   - Opcional: usar a foto já enviada (com consentimento de fotos) como referência, ou gerar com IA um retrato ilustrado a partir das respostas (sob demanda, com rótulo "Gerado por IA").
7. **Progresso sempre visível** com barra, dicas do passo e mensagens de incentivo.
8. **Resumo final editável**: lista de escolhas, pendências e primeiras sugestões; cada item pode ser editado ali mesmo antes de salvar e seguir para o Estúdio.
9. **Passo a passo das sugestões**: as sugestões do resumo aparecem em etapas animadas (peça a peça, mostrando combinação e proporção sobre o avatar ilustrado).

## Limites (mantidos do app)

- Avatar fotorrealista atualizado em tempo real e prova virtual com caimento real: **Fora do escopo dos conectores Lovable**. O espelho em tempo real é uma ilustração; a versão por IA é gerada só quando a pessoa pede.
- Fotos continuam opcionais e só com consentimento; nada é enviado à IA sem ele.

## Detalhes técnicos

- `src/routes/_authenticated/onboarding.tsx` reescrito; componentes novos em `src/components/onboarding/` (Stepper, ChoiceCards, ColorChips, BodyAvatar SVG, HelpChat, Summary).
- Definição dos campos (rótulo, dica, exemplo, padrão, opções, regras de coerência) em `src/lib/onboarding.ts`; testes unitários das regras de pendência/coerência.
- Dados em `visual_profiles.data` (jsonb), com `pending: string[]`, `last_step`, `mode`; autosave com debounce. Sem nova tabela. `mode` passa a aceitar `quick|assisted` (mapear `deep` → `assisted`).
- Prefill: Roupas/Cabelo/Maquiagem leem tamanhos, textura, tom de pele quando o perfil próprio estiver vazio.
- Chat: server route de streaming (`/api/onboarding-help`) com Lovable AI, resposta estruturada `{ answer, example, actions[] }`, limite de 2 frases aplicado no prompt e cortado no código; uma conversa, sem persistência; AI Elements no visual.
- Avatar por IA: server function de geração de imagem sob demanda, salva no bucket privado `user-photos` como `kind='avatar'`, excluível.
- Animações com CSS/transições do Tailwind.
- Atualizar AGENTS.md e roadmap.md.
