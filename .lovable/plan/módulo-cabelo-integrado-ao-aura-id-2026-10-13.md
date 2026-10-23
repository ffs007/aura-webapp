# Módulo Cabelo — integrado ao Aura ID

Mesma estrutura do módulo Maquiagem: uma nova seção "Cabelo" dentro do app, reaproveitando conta, consentimentos, fotos privadas, DNA Visual, comparar, coleções, feedback, exportação, configurações e admin. Nada de app paralelo.

## O que a pessoa vai ver
- **Cabelo (início)**: cartões de decisão com planos salvos, alertas ativos e atalho para gerar novo plano.
- **Perfil capilar**: textura, comprimento, histórico químico, dano por calor, descoloração, sensibilidade do couro cabeludo, tolerância a manutenção, habilidade, imagem desejada.
- **Objetivo**: corte, cor, mudança sutil, ousada, gradual, recuperação, transição para o natural, rotina de finalização, guia de salão, modo barbearia/grooming masculino.
- **Fotos e referências** (opcional, com consentimento): frente/lado/trás + inspirações; apagáveis a qualquer momento.
- **Plano gerado por IA**: três propostas (segura, intermediária, ousada), sempre com caminho gradual antes do radical. Cada uma: descrição de corte/cor, mensagem visual, manutenção, custo estimado em R$, tempo de adaptação, reversibilidade, alerta de procedimento químico/alta manutenção e "precisa de validação profissional".
- **Linha do tempo conceitual**: 30 dias, 3 meses, 6 meses.
- **Guia de salão**: explicação técnica + frases prontas para falar com o profissional; versão para imprimir/baixar no app.
- **Rotina de finalização / cronograma capilar simplificado**.
- **Alertas** (opt-in): hidratação, corte, tratamento, manutenção de cor — exibidos dentro do app.
- **Feedback** após salão ou teste de rotina (usa o feedback já existente).
- Aviso fixo: química, descoloração, sensibilidade e dano exigem validação profissional; sem garantia de resultado. Linguagem acolhedora para quem tem medo de mudar.

## Admin
- Catálogo de técnicas/cuidados e regras de segurança (ex.: descoloração + química prévia → alerta) em tabelas internas, editáveis no admin já existente.
- Contagens de eventos (perfil, plano gerado, guia exportado, lembrete ativado, validação profissional sugerida, feedback).

## Fora do escopo dos conectores Lovable
Simulação realista de cabelo, geração fotorrealista de cortes/cores, previsão de crescimento, correção por vídeo em tempo real — exibidos com esse rótulo.

## Conectores opcionais (não incluídos agora)
Google Docs (guia), Sheets/Airtable (catálogo), Gmail/Telegram/Twilio (lembretes externos), Calendly, Notion, BigQuery. O guia e os alertas funcionam dentro do app; podemos conectar depois.

## Detalhes técnicos
- Tabelas novas com RLS por usuário: `hair_profiles`, `hair_alerts`, `hair_catalog`, `hair_rules` (catálogo/regras: leitura autenticada, escrita só admin). Seed inicial do catálogo e regras na migração.
- Planos capilares como linhas em `packages` com `kind='hair_plan'` (tipo `HairPlan` em `src/lib/hair.ts`), para reaproveitar comparar/coleções/exportação/feedback.
- Fotos no bucket privado existente com metadados de tipo (frente/lado/trás/referência).
- `src/lib/hair.functions.ts`: geração autenticada via `callJson` (schema estrito), respeitando consentimento de personalização, pausa do DNA e permissões por módulo (adicionar módulo "cabelo").
- Rotas em `src/routes/_authenticated/cabelo/` (layout + abas: início, perfil, gerar, plano.$id, guia, rotina, alertas). Eventos registrados na tabela de eventos/auditoria existente.
- Atualizar navegação, admin e AGENTS.md.
