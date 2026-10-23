# REMODELAGEM DO WEBAPP — Aura ID (2026-10-22)

> Estado após a primeira intervenção: trilhas implementadas (mesma D1 do mobile). Este doc guia o restante da remodelagem com base nos arquivos reais deste projeto.

## ✅ Feito nesta rodada (não validado por build — rodar `npm i` antes)

1. **`src/lib/trilhas.ts` (novo)** — trilhas do webapp: ✨ Visual (Maquiagem, Coleções) · 💇🏾‍♀️ Cabelo (Cabelo) · 👗 Estilo (Roupas, Tatuagens, Jornada). Persistência em `localStorage` (`aura.trilhas`). **Barba fora da navegação** (composição feminina; rota continua acessível por URL).
2. **`src/components/TrilhaPicker.tsx` (novo)** — seletor 1–3 trilhas, aberto no primeiro acesso e reaberto pelo botão "Trilhas" do header.
3. **`src/routes/_authenticated/route.tsx`** — navegação de 13 links fixos → filtrada pelas trilhas (antes: Estúdio, Sugestões, DNA, Comparar, Exportar, Configurações sempre; módulos só das trilhas ativas). Fim da "confusão de 13 opções".

**Validação pendente:** `npm i && npm run build && npm test` (toolchain não instalada nesta máquina ainda; mudanças seguem as convenções existentes — shadcn Button, `cn`, TanStack Link).

## Próximos passos (ordem recomendada)

### 1. Validar e rodar local (30 min)
```bash
npm i          # ou bun i (bun.lock presente)
npm run dev    # conferir picker de trilhas + nav filtrada
npm test       # suite existente (src/test/onboarding.test.ts etc.)
```

### 2. Onboarding expresso (o "formulário longo")
- Alvo: `src/routes/_authenticated/onboarding.tsx` (288 linhas) + `src/lib/onboarding.ts`.
- Aplicar D2 do plano mobile: 5 perguntas essenciais primeiro ("começar rápido"), prontuário completo vindo por etapas contextuais depois ("Aura DNA+").
- Os perfis por módulo (`cabelo/perfil.tsx`, `maquiagem/perfil.tsx`, `roupas/perfil.tsx`, `tatuagem/perfil.tsx`) viram o refinamento contextual — cada um pergunta só o seu pedaço, no primeiro uso.

### 3. Unificar a tubulação de imagem
- Existe `src/lib/image-gateway.server.ts` (geração atual — a "amadora") e `src/lib/stream-image.ts`.
- O backend mobile ganhou rota nova: `supabase/functions/ai-gateway` com `media: 'image'` (fal.ai FLUX, style guide editorial, quota por entitlement `pass`, biótipo no prompt, auditoria em `core.ai_runs`, guarda de egress host-suffix). Arquivo: `AURA-ECOSSISTEMA/supabase/functions/ai-gateway/image.ts`.
- Migração: trocar as chamadas do webapp para a MESMA rota (prompt-cards v002), mantendo o webapp como consumidor. Assim mobile e web geram com o mesmo motor e o mesmo biótipo do DNA.
- Env necessário no Supabase: `IMAGE_PROVIDER_API_KEY` (fal.ai), opcionais `IMAGE_MODEL`, `IMAGE_BASE_URL`, `IMAGE_PRICE_USD_PER_IMAGE`.

### 4. Barba (decisão D1)
- Rota e lógica (`src/routes/_authenticated/barba.tsx`, `src/lib/beard.functions.ts`) permanecem no código, fora da navegação. Se confirmar aposentadoria definitiva, mover para pasta `_legado` na próxima curadoria.

### 5. Deploy
- Lovable: manter sincronizado via GitHub próprio deste projeto (NÃO misturar com o repo do mobile). Domínio próprio sugerido antes do lançamento público (ex.: `auraid.app`).
