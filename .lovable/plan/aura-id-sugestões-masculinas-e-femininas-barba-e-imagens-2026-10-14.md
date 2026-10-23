# Aura ID — sugestões masculinas e femininas, Barba e imagens

## Objetivo
Personalizar o mesmo Aura ID com duas estruturas de sugestões — masculina e feminina —, acrescentar a área **Barba** e permitir gerar imagens das combinações dos cartões enviados, com adaptações nas demais áreas visuais.

## 1. Preferência no perfil
- Incluir a escolha **Masculino / Feminino** no perfil inicial e no resumo editável, conforme sua escolha.
- Usar essa preferência como ponto de partida e permitir trocá-la antes de gerar uma sugestão, sem alterar o perfil permanentemente.
- Não deduzir a preferência pelo nome, corpo ou fotos. Quem já tem conta poderá escolher sem refazer o cadastro.
- Oferecer controles explícitos para maquiagem, barba e acessórios que a pessoa usa ou não quer receber. A preferência não bloqueará o acesso a nenhuma área.

## 2. Duas estruturas realmente diferentes
Hoje, os cartões compartilhados exibem sempre os mesmos campos, incluindo Maquiagem. Eles passarão a mostrar apenas as categorias pertinentes à escolha e às preferências pessoais.
- **Masculina:** roupas, cabelo, barba quando aplicável, acessórios escolhidos e visibilidade de tatuagens quando relevante; maquiagem apenas se solicitada.
- **Feminina:** roupas, cabelo, maquiagem quando desejada, acessórios escolhidos e visibilidade de tatuagens quando relevante.
- Não sugerir automaticamente bolsa compacta, maquiagem ou qualquer item rejeitado. Acessórios devem partir do que você usa, não de um estereótipo.
- Substituir instruções vagas, como “manter a textura habitual”, por ações concretas compatíveis com comprimento, textura e rotina informados; pedir o dado necessário em vez de inventá-lo.
- Aplicar a mesma lógica ao Studio, Roupas, Cabelo, Maquiagem, Barba e às sugestões de passos da Jornada.
- Preservar sugestões antigas. Oferecer **Adaptar às minhas preferências**, criando uma nova versão sem apagar o original; não apenas esconder um texto incompatível.

## 3. Nova área Barba
Criar **Barba** no menu e nas opções do Studio, integrada à mesma conta e biblioteca.
- **Perfil:** sem barba ou com barba, comprimento, densidade percebida, bigode, estilo desejado, sensibilidade informada, tempo e orçamento disponíveis.
- **Sugestões:** três alternativas graduais, com desenho proposto, comprimento, contornos, relação com o cabelo e nível de manutenção.
- **Rotina e guia de barbearia:** cuidados básicos, frequência sugerida, o que pedir e perguntas para o profissional.
- Salvar, comparar, adicionar a coleções e exportar pelos mecanismos compartilhados.
- Não prometer crescimento, tratar características como defeitos, diagnosticar problemas de pele nem recomendar medicamentos. Sem barba também é uma escolha válida.
- Integrar ao DNA Visual apenas mediante consentimento, pausa e permissão específica respeitados.

## 4. Imagens nos cartões do anexo
Adicionar **Gerar imagem** em cada alternativa — Segura, Intermediária e Ousada —, com geração individual sob demanda, nunca automática para todos os cartões.
- Mostrar uma **pessoa adulta fictícia baseada no perfil**, como você escolheu: apresentação selecionada, tom de pele, cabelo, barba quando informada e proporções aproximadas a partir dos dados disponíveis.
- Representar a combinação específica do cartão: peças, cores, acessórios e proposta de cabelo/barba ou maquiagem relevante.
- Não enviar fotos pessoais à IA nem prometer reprodução exata de medidas, caimento ou identidade. Numeração de roupa não determina uma anatomia exata.
- Exibir progresso e prévia quando disponível, imagem ampliada, **Gerar novamente**, download e exclusão; impedir pedidos duplicados enquanto uma geração está em andamento.
- Manter a imagem associada à alternativa original e recuperá-la ao reabrir a sugestão.
- Identificar como **Gerado por IA** e **Referência visual — não é prova virtual**. Uma nova geração pode variar a aparência da pessoa fictícia.
- Avisar antes da primeira geração que imagens consomem créditos de IA, sem inventar um preço por imagem.

## 5. Adaptação nas outras abas
| Área | Imagem proposta |
| --- | --- |
| Roupas | Combinação completa na pessoa fictícia, a partir das peças descritas; sem garantir reprodução exata de marcas ou itens. |
| Cabelo | Referência de corte, cor e finalização em enquadramento adequado; não é simulação do resultado na pessoa real. |
| Barba | Referência de barba e bigode, com rosto fictício e enquadramento próximo. |
| Maquiagem | Referência do look em rosto fictício, somente quando a pessoa escolher essa categoria. |
| Tatuagens | Ilustração do conceito isolado, sem aplicação fotorrealista no corpo e sem usar fotos corporais; manter as confirmações de briefing. |
| Jornada | Reutilizar referências de sugestões vinculadas aos passos, sem apresentar imagens sintéticas como fotos de evolução ou alterar o diário. |

Não adicionar geração de imagens a telas sem uma proposta visual concreta, como permissões ou configurações.

## 6. Privacidade e compatibilidade
- Imagens privadas, acessíveis apenas pelo dono, com consentimento explícito para geração e armazenamento e possibilidade de exclusão individual ou junto da conta.
- Usar somente os atributos necessários à imagem; excluir notas emocionais, intenções privadas de tatuagem e dados sensíveis dos pedidos.
- Manter o visual editorial e o português brasileiro do Aura ID; não criar outro aplicativo nem duplicar bibliotecas.
- Não alterar o conteúdo de sugestões antigas silenciosamente nem gerar novas imagens ao abrir uma página.

## Detalhes técnicos
- Salvar apresentação e preferências em `visual_profiles.data`, seguindo o formulário existente; registrar a escolha efetiva também no contexto de cada nova sugestão.
- Atualizar tipos, schemas de geração, instruções e exportação em conjunto, incluindo Barba e compatibilidade com conteúdos antigos sem esses campos.
- Implementar Barba sob as páginas autenticadas, com perfil próprio e planos em `packages` com `kind='beard_plan'`, reaproveitando comparação, coleções e exportações.
- Criar um fluxo compartilhado de imagens pelo Lovable AI, mantendo o modelo de imagens já utilizado pelo retrato e os modelos de texto existentes. O mesmo serviço oferece modalidades diferentes para texto e imagem.
- Usar uma rota autenticada para transmitir a geração, verificar propriedade e consentimentos no servidor e manter as chaves fora do navegador. Reutilizar esse fluxo no botão de retrato, sem duplicar a lógica.
- Guardar arquivos no armazenamento privado e associar cada referência ao usuário, pacote e alternativa por identificadores estáveis; não persistir links temporários como referência definitiva.
- Aplicar migrações com permissões e acesso apenas do dono para os novos dados; atualizar exclusão da conta e controles de DNA. Não editar arquivos gerados manualmente.
- Tratar falta de créditos, indisponibilidade, recusas e bloqueios com mensagens claras, sem tentativas automáticas em casos terminais ou troca de modelo.

## Validação de entrega
- Testar as duas estruturas, mudança pontual de preferência, maquiagem desativada, barba ausente e rejeição explícita de bolsas.
- Testar um plano de Barba completo: preencher, gerar, salvar e reabrir.
- Testar geração real de uma imagem por fluxo visual implementado, recuperação após recarregar, download e exclusão, sempre com sessão autenticada.
- Conferir cartões antigos, comparação, coleções, exportação, consentimento negado e isolamento entre contas.
- Conferir as telas em celular e computador, sem cortes ou sobreposição, e manter títulos e descrições próprios nas novas páginas.
- Se um serviço bloquear uma verificação real, informar exatamente o que ficou pendente, sem declarar o fluxo validado.