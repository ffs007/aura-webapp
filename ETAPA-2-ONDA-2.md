# ✅ Etapa 2 — Onda 2 (Microcopy e contraste AA) — Execução

**Data:** 10/11/2026 · **Base:** `webapp-lovable` · **Escopo:** itens **2.2** (revisão de microcopy + guia de estilo) e **2.3** (consistência visual: contraste AA, foco visível, cores hard-coded) da Etapa 2.
**Status:** concluída e validada (TypeScript, testes, build e navegador real com contraste medido).

---

## 1. O que foi entregue

### 1.1 Guia de estilo

Novo [`GUIA-DE-ESTILO-AURA.md`](GUIA-DE-ESTILO-AURA.md): voz e tom, pessoa/gênero neutro, palavras canônicas, títulos/botões, fórmulas de erro/vazio/confirmação, placeholders, acessibilidade de texto e padrões visuais mínimos.

### 1.2 Paleta acessível (a mudança que destravou o AA)

O token `--accent` (usado em links, rótulos, ícones e no botão de destaque) estava em **3,02:1** sobre o fundo — reprovava AA para texto normal. Foi escurecido de `oklch(0.66 0.11 40)` para **`oklch(0.52 0.11 40)`**; o `--ring` acompanhou.

| Par | Antes | Depois | AA (4,5:1) |
|---|---|---|---|
| accent (texto) / background | 3,02 | **5,37** | ✅ |
| accent (texto) / card | 3,15 | **5,61** | ✅ |
| accent (texto) / secondary | 2,64 | **4,69** | ✅ |
| accent-foreground / accent (botão) | 3,06 | **5,45** | ✅ |
| muted-foreground / background | 5,67 | 5,67 | ✅ |
| foreground / secondary | 12,48 | 12,48 | ✅ |
| destructive / background | 4,95 | 4,95 | ✅ |

### 1.3 Foco visível

- `styles.css`: regra global de `outline` de 2 px para `a`, `summary`, `[tabindex]` e `select` (elementos que não usam o componente `Button`).
- `Button`: anel passou de `ring-1` para **`ring-2` com offset** — alvo maior e mais visível.
- Token `FOCO` aplicado a **~40 chips/filtros** que usavam `<button>` cru em módulos, DNA, configurações, onboarding, jornada, busca/notificações e shell.
- `dialog.tsx`/`sheet.tsx`: botão fechar tinha `sr-only "Close"` em inglês → **"Fechar"**.

### 1.4 Microcopy

| Frente | Resultado |
|---|---|
| **Gênero neutro** | Removidos "Curiosa(o)", "Corajosa(o)", "Obrigada(o)", "Pronta(o)", "segura(o)", "Cabeleireira(o)", "Maquiadora(o)", "Tatuadora(o)", "Aberta(o)" — reescritos para "Curiosidade", "Coragem", "Tudo certo", "Topo algo grande", "Cabelo/Maquiagem/Tatuagem", "Aceito mudanças permanentes" |
| **Erros padronizados** | ~70 mensagens convertidas para "Não foi possível X. Tente de novo."; `e.message` cru removido de catches (sem inglês/técnico vazando) |
| **Placeholders** | Exemplos técnicos viraram exemplos humanos ("ex.: tenho medo de exagerar; uso só os produtos do dia a dia") |
| **Texto < 12 px** | **0** ocorrências restantes de `text-[10px]`/`text-[11px]` (eram 5 telas: onboarding, notificações, jornada) |
| **Concordância** | "1 projeto/2 projetos", "1 versão/2 versões", "resta 1 de N", "peça/peças", "dia/dias" corrigidos |
| **Aria em ícones** | Botões só-ícone/emoji (sino, busca, pausar, excluir, stencil, escalas 1–5) com nome acessível; 40+ ícones decorativos com `aria-hidden` |
| **Links em prosa** | Todos sublinhados (exceto back-links e chips com borda/emoji como pista não cromática) |

### 1.5 Cores hard-coded

**0** ocorrências de `text-amber-*`, `text-emerald-*`, `text-gray-*`, `text-slate-*`, `bg-white/*` e `text-white` sobre fundo claro. Substituídas por tokens (`accent`, `muted-foreground`, `ochre`, `sage`) e pelos componentes `Aviso`/`Badge`. Exceção intencional: o gráfico de assimetria da estética usa `bg-ochre` (token) para o alerta.

---

## 2. Validação executada

### 2.1 Estática

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **7 arquivos / 49 testes / 0 falhas** |
| `npm run build` | **sucesso** |

### 2.2 Navegador real — contraste medido (não "no olho")

Script `.e2e/onda5-validate.mjs` converte as cores computadas (incluindo `oklch`) para sRGB, compõe o fundo efetivo (alpha sobre ancestrais/body) e calcula o ratio WCAG.

| Bloco | Resultado |
|---|---|
| **A. Contraste AA** — 10 telas | **10/10 PASS**, 0 pares abaixo do mínimo. Ex.: dashboard 56 textos/16 grupos; settings 85/12; guia 87/11. Fundos compostos sobre o body creme. |
| **B. Foco visível** — `/dashboard` via Tab | **PASS**: 12/12 paradas fora do body, 12/12 com anel visível |
| **C. Microcopy** | **1 FAIL real encontrado e corrigido**: "Curiosa(o)/Corajosa(o)" vinha de `lib/aura.ts` (fora dos escopos) — corrigido para "Curiosidade/Coragem"; também `lib/onboarding.ts` ("segura(o)", "Pronta(o)"). |
| **D. Regressão Onda 4** — 16 telas | **PASS**: 1 `h1` por tela, nenhum erro sem "Tentar novamente" |
| **E. Capturas** | `.e2e/shots-onda5/01-dashboard.png`, `02-contraste.png`, `03-foco.png`, `04-microcopy.png` |

> Primeira passada: **55/56** (única falha = microcopy acima). O achado foi corrigido na hora e a reexecução completa fechou em **56/56 PASS** (contraste 10/10, foco 12/12+12/12, microcopy 10/10, regressão 32/32).

---

## 3. Débitos conscientes

1. **`border`/`input` têm contraste 1,3:1** com o fundo — nunca foram o único indicador de campo (sempre há rótulo e diferença de superfície); subir para 3:1 deixaria a interface pesada. Decisão registrada.
2. **Nome do evento em inglês no `/admin`** (superfície interna de administração) foi mantido.
3. **Placeholder de CSV do catálogo** mantém cabeçalhos de exemplo em inglês (formato de planilha real, intencional).
4. **Foco de `select`/links** é global via CSS; componentes shadcn continuam com o anel próprio (sem duplicação visual).
5. **Sem commit/push**, conforme `AGENTS.md`.

---

## 4. Próximo passo

- **2.5 Busca global ampliada** (briefings, coleções, profissionais, lembretes) + atalhos de teclado com descoberta (`?`).
- **2.6 Histórico/versões por item**: duplicar, comparar e recuperar versões sem alterar schema.
- **2.7 Instrumentação**: funil e erros por tela sobre `audit_events`.
- **2.8 Regressão automatizada** dos caminhos principais.
