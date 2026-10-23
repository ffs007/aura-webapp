# Aura ID — Tatuagens integrado

## Objetivo
Adicionar **Tatuagens** ao mesmo Aura ID, em português brasileiro, preservando o visual e reutilizando conta, DNA Visual, sugestões, comparação, coleções, exportação e configurações.

**Escolha confirmada:** briefing e lembretes ficarão dentro do Aura ID nesta etapa. Não serão conectados Google Docs nem serviços de mensagens.

## 1. Intenção e projetos
- Incluir Tatuagens no menu, com lista de projetos e versões salvas.
- Criar perfil e formulário de intenção: região corporal, estilo, significado, tamanho em centímetros, visibilidade, orçamento em reais, restrições profissionais e planejamento de futuras tatuagens.
- Oferecer campos opcionais para tolerância à dor, sensibilidade da pele, tatuagens existentes, cicatrizes e desejo de cobertura, sem diagnóstico ou promessa de resultado.
- Permitir editar intenção, anotar versões e excluir projetos.

## 2. Referências e privacidade
- Permitir referências e fotos corporais opcionais; o planejamento também funcionará sem fotos.
- Exigir consentimento específico e registrado para fotos corporais, além da permissão geral de fotos. Separar autorização de armazenamento de eventual uso pela IA.
- Vincular fotos ao projeto, manter acesso privado e permitir exclusão individual ou de todas as fotos de tatuagem. Revogar consentimento impedirá novos envios e uso pela IA, sem impedir a exclusão.
- Não enviar fotos corporais à IA nesta etapa: usar a intenção e descrições fornecidas pela pessoa. As fotos ficam como referências privadas, sem prometer análise visual.
- Não incluir fotos nem notas sensíveis nos registros administrativos, no DNA Visual ou nas exportações por padrão.

## 3. Conceitos e comparação
- Gerar conceitos com três alternativas: **Discreta**, **Intermediária** e **Ousada**. A primeira corresponde à variação conservadora da especificação, sem sugerir ausência de risco.
- Cada alternativa terá significado, estilo, região, dimensões sugeridas, visibilidade, variações e questões para discutir com o tatuador.
- Incluir plano corporal de longo prazo, pontos de atenção e validação profissional obrigatória.
- Mostrar diagramas esquemáticos de posicionamento e descrições, claramente identificados como ilustrações, não como simulações realistas.
- Integrar salvar, rejeitar, comparar, colecionar, feedback e anotações aos fluxos compartilhados, garantindo que o conteúdo específico de tatuagem apareça corretamente.
- Identificar todos os resultados com **Gerado por IA** e usar DNA Visual somente quando autorizado, não pausado e permitido para tatuagem.

## 4. Decisão e briefing do tatuador
- Criar checklist “Antes de decidir”: teste temporário, referência impressa, teste no espelho, período de reflexão escolhido pela pessoa e consulta profissional.
- Gerar briefing com intenção, alternativas escolhidas, posição, tamanho, restrições, perguntas e verificação de escrita, símbolos e referências culturais.
- Solicitar confirmação antes de baixar ou imprimir, mostrando o que será incluído. Sem envio automático a tatuadores.
- Disponibilizar documento para download e uma versão para impressão, com opção de salvar como PDF pelo navegador.

## 5. Sessão, cuidados e lembretes
- Adicionar checklist pré-sessão e cuidados gerais pós-sessão, sempre subordinados às orientações do tatuador e de profissionais de saúde.
- Criar diário de cicatrização com data, observações e exclusão de registros; não avaliar imagens, diagnosticar nem recomendar medicamentos.
- Apresentar sinais de alerta que indiquem buscar atendimento profissional, sem tratar o app como acompanhamento médico.
- Permitir lembretes opcionais de preparação, acompanhamento e revisão de retoque, com datas escolhidas e conclusão/cancelamento no app. Sem notificações externas ou garantia de entrega com o app fechado.

## 6. Segurança e administração
- Bloquear sugestões de ódio, discriminação e extremismo; tratar símbolos e referências culturais com respeito e solicitar validação de significado e contexto.
- Ampliar a área administrativa existente para avisos de segurança de tatuagem, sinalizações de moderação e eventos de consentimento, geração, versão salva, exportação e exclusão, sem acesso a fotos corporais ou relatos íntimos.
- Mostrar estados reais de disponibilidade dos serviços utilizados; manter serviços não conectados claramente identificados.
- Incluir os novos dados na exclusão da conta e na gestão de dados da pessoa.

## Detalhes técnicos
- Reutilizar `packages` com `kind='tattoo_plan'`; definir `TattooPlan` e atualizar o esquema JSON estrito e os consumidores compartilhados juntos.
- A base de código já contém o modo `tattoo` e a permissão correspondente do DNA Visual; ampliar esses pontos, sem criar outra conta ou outro sistema de personalização.
- Criar páginas sob `src/routes/_authenticated/tatuagem/`, com layout e metadados próprios para projetos, intenção, geração, referências, detalhe, decisão, briefing e cuidados.
- Acrescentar somente os registros específicos necessários para perfil, projetos, consentimento corporal, diário e lembretes. Verificar o esquema real antes de definir a migração, com permissões explícitas e isolamento por usuário.
- Reutilizar o armazenamento privado e estender o envio de fotos para vínculo ao projeto e consentimento corporal validado no servidor.
- Usar funções autenticadas e o `callJson` existente para IA; preservar modelo, streaming e tratamento de erros. Recusas encerram a solicitação sem repetir ou substituir modelos.
- Manter referências corporais fora dos sinais automáticos do DNA Visual. Somente preferências não sensíveis e feedback autorizado poderão contribuir.
- Registrar as convenções de integração e manter uma lista enxuta de tarefas durante a implementação.

## Validação
- Testar com sessão autenticada: preencher intenção, gerar um conceito real, salvar, comparar, adicionar à coleção e abrir novamente o projeto.
- Verificar consentimento corporal, upload privado, exclusão e impedimento de acesso por outro usuário.
- Confirmar download não vazio, impressão legível, diário persistido e lembretes respeitando a permissão.
- Verificar pausa/permissões do DNA Visual, rejeição de conteúdo inadequado, mensagens de falha e ausência de dados sensíveis em auditoria.
- Conferir as telas em celular e computador, sem sobreposição de textos ou controles.

## Fora desta etapa
**Fora do escopo dos conectores Lovable:** realidade aumentada, movimento corporal, aplicação fotorrealista e geração avançada de imagens de tatuagem. Também ficam para depois Google Docs, mensagens externas, agenda e diretório de tatuadores.