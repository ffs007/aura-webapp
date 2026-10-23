# Módulo "Jornada" — planos de transformação e memória visual

Esta parte vira um módulo novo do Aura ID, chamado **Jornada**. Ele reaproveita o que o app já tem: conta, consentimento, fotos privadas, sugestões de Maquiagem/Cabelo/Roupas/Tatuagens, DNA Visual, exportação, configurações, lembretes no app e admin. Ele não cria um app à parte.

## O que a pessoa poderá fazer
1. **Objetivo de transformação**: escolher entre confiança profissional, recuperar leveza, expressar criatividade, marcar nova fase, reduzir compras por impulso, usar melhor o que já tem e imagem coerente com a nova rotina. Também pode escrever um objetivo próprio.
2. **Montar o plano**: plano mensal ou trimestral, dividido em etapas por mês ou semana. As etapas podem ser "ajustar cabelo", "montar look de trabalho", "testar paleta de maquiagem", "planejar tatuagem", "revisar armário" ou "preparar fotos". A pessoa pode ligar uma etapa a uma sugestão já salva nos outros módulos. A IA pode sugerir um rascunho do plano, e a pessoa edita tudo.
3. **Quadro de status**: cada etapa ou sugestão fica em uma coluna: Em teste, Aprovado, Não funcionou, Quero adaptar, Talvez depois, Já implementado ou Não combina mais comigo. Não há porcentagem nem atraso em vermelho, para evitar cobrança.
4. **Diário visual**: fotos privadas, notas e reflexão. A reflexão traz notas de 1 a 5 para praticidade, manutenção e autoestima, mais uma nota sobre a reação das pessoas.
5. **Galeria antes/depois**: pares de fotos escolhidos pela própria pessoa, com foco em aprendizado e sem comparação de beleza.
6. **Relatórios de evolução** gerados por IA, como "Meu mês em imagens" e o relatório trimestral. Eles mostram escolhas favoritas, estilos que se repetem, cores mais usadas e mudanças que deram confiança. Ficam no app, com o rótulo "Gerado por IA", e podem ser baixados ou impressos.
7. **Linha do tempo** com planos, mudanças de status, fotos, reflexões e relatórios.
8. **Lembretes opcionais no app**: revisão do plano, preparação para evento, check-in de teste e relatório mensal.

## Privacidade e segurança
- Fotos e reflexões são privadas por padrão. Nada é compartilhado de forma automática.
- As notas emocionais nunca vão para relatórios exportados nem para o DNA Visual. Elas só são usadas no relatório da própria pessoa se ela marcar essa opção.
- As fotos não são enviadas à IA. A IA recebe só textos, status e notas.
- Exportar exige confirmação. A exclusão pode ser feita por foto, por plano ou da conta inteira.
- O DNA Visual só recebe sinais do módulo quando ele está ativo e não pausado.
- O admin ganha: eventos do módulo, uso de armazenamento, status dos conectores e erros. O admin não acessa fotos, notas ou reflexões.

## Fora desta etapa
Google Docs, Notion, Gmail, Telegram, Twilio, Google Calendar, BigQuery e CRM. Os relatórios ficam no app e os lembretes só aparecem dentro do app, como na escolha feita para Tatuagens.

## Detalhes técnicos
- Migração com as tabelas `journey_goals`, `journey_plans` (period monthly|quarterly, starts_on), `journey_steps` (plan_id, period_index, title, category, package_id nullable, status, status_history jsonb), `journey_reflections` (step_id/plan_id, note, emotional_note, practicality, maintenance, self_esteem, social_reception, include_in_report) e `journey_reports` (plan_id, kind month|quarter, content jsonb). Todas com RLS só para o dono e GRANTs.
- Colunas novas: `photos.journey_step_id` e `photos.pair_role` (before|after). Os lembretes reutilizam `reminders` com a nova coluna `journey_plan_id`.
- Eventos em `audit_events`: plan_created, status_updated, file_uploaded, reflection_added, report_generated, export_requested e data_deleted.
- `src/lib/journey.ts` (tipos, labels PT-BR e `journeyToMarkdown` sem notas emocionais) e `src/lib/journey.functions.ts` (`journeyData`, `saveGoal`, `savePlan`, `suggestPlan`, `setStepStatus`, `addReflection`, `generateReport`, `deleteJourney`). A IA passa por `callJson` com schema estrito.
- Rotas em `src/routes/_authenticated/jornada/`: index, objetivo, plano.$id (construtor + quadro), diario, galeria, relatorios, relatorio.$id e linha-do-tempo. Também: aba "Jornada" no menu, cartão no painel, inclusão em `deleteAccount` e no export, e seção no admin.
- Atualizar AGENTS.md e roadmap.md. Testes de `journeyToMarkdown` e das rotas. `bunx tsgo --noEmit`.
