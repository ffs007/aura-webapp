# Aura ID — Módulo Maquiagem (mesclado)

Esta parte vira o módulo **Maquiagem** do mesmo app. Nada de telas ou cadastros paralelos: tudo aproveita o que já existe.

## O que é reaproveitado (sem duplicar)
- Entrada, consentimento e fotos privadas: a mesma permissão de fotos vale para fotos do rosto, com aviso extra antes do envio.
- Comparar, coleções, feedback, exportação, lembretes no app, auditoria e admin.
- DNA Visual: o feedback de maquiagem alimenta o DNA só se a personalização estiver ligada, sem pausa e com o módulo Maquiagem liberado.
- O "Estúdio" continua sendo a porta de entrada. Ao escolher **Maquiagem**, abre o fluxo específico.

## O que é novo

1. **Perfil de pele e alergias** (aba própria em Maquiagem):
   - tipo de pele, histórico de alergias, ingredientes a evitar e produtos que já usa;
   - acabamento preferido, nível de habilidade, tempo disponível, orçamento e referências.
   - A pessoa pode excluir os dados de alergia separadamente.
2. **Seletor de modos de maquiagem**: 5 minutos, 30 minutos, entrevista online, foto profissional, viagem, calor, evento à noite, iniciante, pele sensível e câmera do celular.
   - Cada um tem versão **rápida** (poucos campos) e **detalhada**: ocasião, intensidade, luz do ambiente (natural, escritório, noite, tela) e foto opcional.
3. **Gerador de looks**: propostas segura, intermediária e ousada, cada uma com:
   - checklist de categorias de produto, com faixa de preço em R$ vinda do catálogo interno;
   - ordem de aplicação passo a passo;
   - custo, nível de habilidade, tempo, reversibilidade e como adaptar;
   - "ajustes se algo der errado", com linguagem de ajuste e nunca de "corrigir defeitos".
   - Ingredientes a evitar e alergias são respeitados sempre.
   - Para pele sensível, alergias ou alguma condição de pele, aparece o pedido para validar com um profissional.
4. **Assinatura pessoal de maquiagem**: um resumo editável do "seu jeito", gerado pela IA a partir dos looks aprovados, do feedback e do DNA (se autorizado). Guarda histórico.
5. **Kits de confiança**: pequenos kits gerados e salvos, como "kit bolsa", "kit 5 minutos" e "kit reunião", com lista de itens, ordem de uso e custo estimado.
6. **Manual de maquiagem**: um manual completo, mostrado no app e pronto para imprimir ou baixar (Markdown/PDF via impressão), com assinatura, kits e looks salvos. O Google Docs fica marcado como "ainda não conectado".
7. **Catálogo interno de produtos**: categorias e faixas de preço, gerenciadas pelo admin (criar, editar, desativar). Começa com um catálogo-base. Google Sheets e Airtable ficam como conexões futuras.
8. **Avisos fixos**:
   - "As recomendações de maquiagem e cuidados com a pele são informativas."
   - Linguagem inclusiva para todos os tons de pele, idades, rotinas e níveis de habilidade.
9. **Fora do escopo**, marcado como [FORA DO ESCOPO DOS CONECTORES LOVABLE]: realidade aumentada em tempo real, correção por vídeo ao vivo, simulação facial de alta fidelidade e orientação de aplicação na tela em tempo real.

## Navegação
O menu ganha **Maquiagem**, com as abas Looks, Gerar, Perfil de pele, Assinatura, Kits e Manual.
- Os looks gerados também aparecem em Sugestões, Comparar e Coleções, com o rótulo "Maquiagem".
- O modo "Maquiagem" do Estúdio leva direto para o gerador de maquiagem.

## Detalhes técnicos
- Migração:
  - `makeup_profiles` (user_id pk, skin_type, allergies, avoid_ingredients[], products_used[], finish, skill, time_minutes, budget, references, updated_at);
  - `makeup_signatures` (id, user_id, summary jsonb, created_at);
  - `confidence_kits` (id, user_id, name, content jsonb, created_at);
  - `product_catalog` (id, category, name, price_min, price_max, finish, tags[], sensitive_safe bool, active bool), com leitura para quem está logado e escrita só para o admin.
  - Todas as tabelas do usuário são restritas ao dono.
  - `packages` ganha `kind text default 'look'` e `module text` para separar looks de maquiagem dos pacotes integrados, mantendo uma tabela só.
- O catálogo-base entra na própria migração.
- Novas funções no servidor (com login), usando `callJson`:
  - `generateMakeupLooks`: esquema próprio com variações, checklist, passos, indicadores e ajustes. Lê o perfil de pele, o catálogo, o DNA autorizado e as correções.
  - `generateSignature`
  - `generateKit`
- Eventos: consent_granted, photo_uploaded, photo_deleted, look_generated, look_saved, look_rejected, feedback_submitted e manual_exported. Eles unificam os nomes que já existem (consent_changed, recommendation_*), mantendo os dois no visualizador.
- Rotas: `_authenticated/maquiagem/` (layout com as abas index, gerar, perfil, assinatura, kits, manual) e `_authenticated/maquiagem/look.$id`.
- O admin ganha o gerenciador do catálogo.
- Fica para depois: Notion, BigQuery e Shopify/WooCommerce.
