# Aura ID — Tradução PT-BR + Módulo Visual DNA (mesclado)

Daqui em diante, cada novo documento é tratado como uma parte do mesmo app Aura ID: as funções são mescladas, as repetidas são unificadas e nada é duplicado.

## Parte 1 — Traduzir todo o app para Português (Brasil)
- Todos os textos de todas as telas: página inicial, entrada, consentimento, perfil, Estúdio, sugestões, detalhe, comparar, coleções, Visual DNA, exportar, configurações, admin, avisos e mensagens de erro.
- Títulos e descrições das páginas (o que aparece nas abas e ao compartilhar links) em PT-BR.
- A IA passa a responder em PT-BR por padrão (ou no idioma em que a pessoa escrever o perfil).
- Datas e valores no formato brasileiro (ex.: 13/10/2026, R$).
- O nome "Visual DNA" fica como **DNA Visual**.

## Parte 2 — Mesclar o módulo DNA Visual (sem duplicar)

O que já existe e será reaproveitado: entrada, consentimento, perfil inicial, feedback, sinais do DNA, exclusão de dados, eventos de auditoria e admin.

O que é novo:
1. **Painel do DNA Visual**: um resumo editável e explicado, gerado pela IA só com dados autorizados. Cobre:
   - cores preferidas e rejeitadas, estilos favoritos e rejeitados;
   - tolerância à manutenção, conforto com o orçamento, objetivos de imagem profissional e social, conforto emocional;
   - áreas do corpo a valorizar ou preservar (só se a pessoa informar), tolerância a mudanças permanentes;
   - "funciona na vida real" e "bonito na teoria, mas não uso";
   - perfis de prontidão para mudança e de praticidade, limites para as recomendações e notas por módulo.
   - Aviso fixo: "não é diagnóstico nem verdade objetiva; sua identidade é fluida".
2. **Editor de preferências**: perfil reorganizado em seções, com seletores de cores (preferidas e rejeitadas) e referências de estilo.
3. **"Isso está errado"**: em cada inferência da IA, a pessoa corrige ou remove. A correção fica registrada e a IA nunca repete o que foi corrigido.
4. **Linha do tempo de sinais**: curtidas, itens salvos, rejeições, "bonito mas não prático", correções e feedback, separados por módulo (maquiagem, cabelo, roupas, tatuagem).
5. **Central de permissões entre módulos**: ligar, desligar ou **pausar** o uso do DNA, no geral e por módulo. As sugestões só usam o DNA quando autorizado.
6. **Histórico de versões**: cada nova síntese ou edição grande cria uma versão. Dá para ver, comparar e restaurar.
7. **Redefinir e excluir**: redefinir só o DNA (mantendo o perfil), excluir sinais, excluir tudo e pedir uma exportação dos dados (download em JSON).
8. **Lembrete no app**: depois de muitas mudanças (por exemplo, 10 sinais novos ou um perfil editado), aparece um convite para revisar o DNA.
9. **Admin**: inclui os novos eventos no visualizador de consentimento e auditoria; continua sem dados que identifiquem as pessoas.

A navegação fica unificada: o menu "DNA Visual" abre abas para Resumo, Preferências, Linha do tempo, Permissões, Versões e Redefinir.

## Detalhes técnicos
- Sem biblioteca de idiomas: os textos são trocados direto nos componentes (o app é só PT-BR). O `lang` vira `pt-BR` e os formatos de data usam `pt-BR`.
- Migração:
  - `consents` ganha `dna_paused bool` e `module_permissions jsonb` (makeup, hair, clothing, tattoo, professional).
  - Novas tabelas, todas restritas ao dono: `dna_versions` (id, user_id, summary jsonb, source, created_at), `dna_corrections` (id, user_id, field, original, correction, created_at) e `preferences` (user_id pk, colors_liked[], colors_rejected[], styles_liked[], styles_rejected[], body_highlight, body_preserve, permanent_tolerance int).
  - `visual_dna` ganha `summary jsonb` e `signals_since_review int`.
  - `feedback` ganha `module text`.
- Nova função no servidor, `synthesizeDna` (com login), que usa o mesmo modelo de IA e saída estruturada. Ela lê o perfil, as preferências, os sinais, os pacotes salvos e rejeitados e as correções, grava `summary` e cria uma versão.
- `generatePackages` passa a respeitar a pausa e as permissões por módulo, e injeta os limites e correções do DNA.
- Novos eventos: `profile_created`, `consent_changed`, `cross_module_enabled`, `inference_corrected`, `version_created`, `reset_requested` e `data_deleted`, que unificam os nomes já usados.
- Rotas: `/dna` vira um layout com as abas `/dna` (resumo), `/dna/preferencias`, `/dna/linha-do-tempo`, `/dna/permissoes`, `/dna/versoes` e `/dna/redefinir`.
- Fica para depois: BigQuery, Google Docs e Notion.
