# Plano Imagem & Edição PRO — gerado do feedback de 2026-10-27

Mapeamento ponto a ponto do feedback para a arquitetura real (webapp = conceitos/referências;
mobile/fal.ai = aplicação NA foto da pessoa). Prioridades: **P0 = esta semana · P1 = próximo
ciclo · P2 = exige modelo/técnica diferente ou infra nova**.

## Fase 0 — CAUSAS-RAIZ encontradas no código (corrigidas em 27/10)

| Sintoma relatado | Causa real | Status |
|---|---|---|
| Lettering virou borboleta | Molde de prompt mandava `sem texto nem logotipos` para TODAS as gerações → o próprio texto era proibido | ✅ Corrigido: brief estrutulado compila prompt próprio; regra "as palavras são o próprio objeto" |
| Ombro ignorado, imagem solta | Molde forçava `isolado em papel branco, sem corpo` para toda tatuagem | ✅ Corrigido: brief decide `no_corpo` (aplicada na região, com lateralidade) ou `isolado` |
| Usuário não sabe o que foi entendido | Não existia camada de interpretação | ✅ Cartão "Entendi assim" com confirmação/correção antes de gerar (item 2.6) |
| Descrição tratada como sugestão | `Proposta visual` era JSON despejado no prompt | ✅ Compilador determinístico por entidades + negativas explícitas (2.1, 2.3, 2.7) |
| Falta trilha de validação | — | P1 abaixo (verificação pós-geração) |

Arquivos: `src/lib/tattoo-brief.ts` (novo), `tattoo.functions.ts` (+interpretTattooRequest),
`references.functions.ts` (brief opcional → prompt compilado; brief salvo em packages.context
para auditoria), `ReferenceImage.tsx` (cartão de confirmação + edição de texto/local),
`TattooPlanView.tsx` (ativa fluxo tattoo). Typecheck 0 erros · 24/24 testes.

## P0 (restante desta semana)
- **Pós-geração com verificação (1.7, 2.5, 2.10, 2.11):** visão relê a imagem gerada contra o
  brief (texto correto? local? lateralidade? artefatos?) → score por atributo + regenerar
  automático 1x se atributo ESSENCIAL falhar; se persistir, sinalizar pendência na tela.
  Implementar como função no `ai-gateway` (mobile) e no `referenceRequest` (webapp) usando o
  próprio modelo de visão (gpt-image não lê; usar endpoint de visão do Lovable AI/FLUX kontext).
- **Padronização roupas/maquiagem/barba (1.3, 2.9):** replicar o padrão tattoo-brief para os
  4 módulos (briefs com atributos de variação: tecido, brilho, volume, tom, densidade).
- **Métricas de conformidade (2.10):** gravar score por atributo junto ao package (jsonb) e
  expor no painel de feedback (1 estrela = 1 clique, já existe rating).

## P1 (próximo ciclo)
- **Upload na própria página + validação de foto (3.1–3.6):** no webapp, componente de upload
  com preview/estados; avaliação de nitidez/luz/ângulo por visão com motivos em linguagem
  simples; veredito por finalidade (rosto/meio corpo/corpo inteiro/tatuagem/roupa).
- **Limitações declaradas (3.5) + modo de captura guiada (3.9):** checklist visual de
  enquadramento com exemplos; bloqueio preventivo quando a foto não comporta o uso.
- **Multi-referência (3.8):** 1 principal + auxiliares (ângulos/textura/luz).
- **Edição não destrutiva (4.9):** histórico de versões por referência (tabela já comportada
  por generated_references + path versionado).
- **Validação final automática (4.10):** mesma infra da verificação P0 aplicada ao resultado
  final; "humano opcional" = o próprio usuário aprova/rejeita com o comparador lado a lado
  (tela /compare já existe).

## P2 — limite do modelo atual / técnica diferente (honestidade técnica)
- **Consistência anatômica total (1.6: mãos, orelhas, nuca, articulações em pose):** nenhum
  modelo text→image garante; mitigação real = img2img com foto base (mobile fal.ai, strength
  0.65 já implementado) + verificação P0 reprovando membros duplicados.
- **Aplicação realista na foto da pessoa (4.3–4.8: caimento, deformação perspectiva, textura
  de pele):** é o projeto "Aura Retrato" (D3 do PLANO-REMODULARIZACAO): img2img/IP-Adapter no
  mobile com a foto do usuário — o webapp NÃO recebe fotos dos usuários hoje por decisão de
  privacidade; manter assim até consentimento 3.7 completo (retenção, exclusão, não-treino).
- **Consentimento granular (3.7):** terms + colunas de retenção por foto + flag "não treinar"
  já no escopo LGPD do account-delete; ativar quando foto entrar no webapp.
- **Variedade de biótipos (1.3):** parametrizar attrs do perfil (tom, idade, textura) no
  compilador — depende do onboarding rico (D2 mobile).

## Decisões do Felipe (27/10 — FECHADAS)
1. **Regeneração automática 1x** quando atributo essencial falhar ✅ IMPLEMENTADO (verificação pós-geração
   com visão: `visionCheck` em ai.server, `verifyReference` + veredito em references.functions,
   regen 1x + selo de pendências em ReferenceImage; degrada sem bloquear quando visão indisponível).
2. **Foto pessoal no webapp também** → pendente: pipeline "Aura Retrato webapp" (cofre de fotos e
   consentimentos já existem; falta edição img2img sobre a foto — mesma técnica fal.ai do mobile).

⚠️ Descoberta 27/10: `LOVABLE_API_KEY` NÃO existe localmente (só é injetada no hosting do Lovable) —
interpretação, geração e verificação de imagem no localhost só funcionam após copiar a chave para o
`.env` do webapp (via configurações do Lovable) OU testar no hosting após sincronizar.

## MIGRAÇÃO PARA O SUPABASE PRÓPRIO (27/10 — em curso, decisão definitiva)
O Lovable NÃO fornece a chave de IA → webapp migra para o Supabase `aura-id` do Felipe.
Um só cérebro: login, dados, fal.ai, assinaturas e LGPD no mesmo projeto.
- ✅ Fase A — Banco: 8 migrações drizzle do webapp aplicadas no aura-id (copiadas como
  `20261027xxxx__*.sql` no repo principal; tabelas webapp em `public.*`, mobile em schemas próprios,
  zero conflito; buckets user-photos etc. criados junto).
- ✅ Fase B — Gateway (27/10): tarefas `webapp.json` (texto genérico, instruções no params),
  `webapp.vision` (verificação) e `webapp.reference.render` (imagem fal.ai, prompt compilado,
  40 grátis/usuária) registradas e **deployadas**; ponte de consentimentos
  `public.consents → core.consents` (trigger, 20261027020000) aplicada no remoto.
- ✅ Fase C — Código webapp (27/10): `ai.server.ts` reescrito — callJson/visionCheck saem pelo
  gateway próprio com token lido da requisição (zero edição nos 8 arquivos chamadores);
  imagem: `image-gateway.aura.server.ts` (fal.ai, mesmas guardas de consentimento) ligado na rota
  /api/reference-image; `stream-image.ts` aceita URL além de b64; verificação usa URL assinada
  do storage. Typecheck 0 · 24/24. `image-gateway.server.ts` antigo ficou órfão (intocado —
  bloqueio do verificador; remover quando liberar).
- ⏳ Fase D — Felipe (cliques): trocar `.env` pelo pronto `.env.aura-id` (comando no chat);
  Google: adicionar callback `https://oyfqecigqrceijoxggqw.supabase.co/auth/v1/callback` AO MESMO
  cliente pe76… no Google Cloud + colar os mesmos códigos em aura-id → Auth → Providers → Google;
  aura-id → Auth → URL Configuration → add `http://localhost:8080/auth` e `:8081/auth`;
  desligar Confirm email no aura-id (conta dele, painel normal do supabase.com).
  Rollback: restaurar `.env` original (backup `.env.lovable-backup`).
