# 🧪 Relatório de Auditoria Profunda — Aura ID (webapp)

**Data:** 08/11/2026 · **Ambiente:** localhost:8080 (dev) conectado ao backend de produção (Supabase aura-id) · **Método:** navegação real automatizada no navegador (conta do dono em modo leitura + conta de teste criada do zero), análise de código das rotas e histórico de E2E via API.

> ⚠️ Contexto da sessão: a rede até o Supabase estava **degradada** (chamadas de 500ms saltando para 5–23s). Isso não é bug do app, mas **revelou** os problemas de feedback abaixo — em internet ruim (celular, elevador, 3G) o usuário vê exatamente o que eu vi.

---

## 1. O QUE FOI TESTADO (e o que não)

### ✅ Testado no navegador
| Área | Caminhos percorridos |
|---|---|
| Primeiro acesso | Landing → /auth (login), toggle criar conta, cadastro real de conta nova, validação de senha curta |
| Sessão | Logout (conta do dono), redirecionamentos para /auth, persistência de sessão |
| Estúdio | Tela inicial inteira (modos de entrada, masculino/feminino, intensidade, CTAs) — leitura |
| Sugestões | Dashboard com 16 pacotes reais, filtros, banner do guia, chip 🛠️ do admin |
| Configurações | Consentimentos (chaves), lembretes, zona de exclusões ("Excluir minha conta" etc.) — leitura |
| Trilhas | Seletor com as 4 trilhas (inclusive 💈 Barbearia), adicionar Estilo, nav atualizando ao vivo |
| Tatuagem | /tatuagem e /tatuagem/vitrine (renderização completa, chips de estilo, estado vazio, chip de cota "✨ Pass ativo") |
| Profissionais | Abas (envios/recebidos/cadastro/vitrine), banner 💎 "Assinar R$ 49,90", vitrine do estúdio |
| Aura Pass | Página do plano com preço e CTA (sem clicar — checkout LIVE) |
| Feedback | Botão 💬 presente em TODAS as páginas, inclusive login |
| Redirecionamentos | URL protegida deslogado → /auth; /admin como admin (chip visível) |

### ⏭️ Não testado no navegador (e por quê — honestidade total)
- **Geração de imagem no Estúdio/Retrato/Modelo**: custa créditos fal reais; os caminhos de API já foram provados E2E em sessões anteriores (gateway 200 com idm-vton/kontext-multi). 
- **Finalização do consentimento/onboarding da conta teste**: a automação travou nos switches Radix (componente acessível só via toque/teclado real — ver A5).
- **Checkout até o pagamento**: chaves LIVE ativas; abrir seria inofensivo, pagar seria real. Já provado em modo teste (cs_test_) e as sessões live (cs_live_) foram verificadas via API.
- **Recuperação de senha**: o link "esqueci minha senha" NEM EXISTE ainda (ver A9) — e o SMTP não está configurado, então um e-mail de recuperação hoje não chegaria.
- Multi-dispositivo real, navegadores múltiplos (testado apenas Chromium), offline/timeout de sessão.

---

## 2. ACHADOS (por gravidade)

### 🔴 A1 — Telas "congelam" sem indicador de carregamento (CRÍTICO)
- **O que acontece:** rotas que carregam dados antes de aparecer (todas de `/tatuagem/*`, e a troca pós-login) ficam com a **tela anterior congelada** (navegação interna) ou **branca** (carga direta de URL) enquanto os dados chegam. Com a rede lenta de hoje: **23 segundos** de aparente travamento. Nenhum spinner.
- **Impacto:** usuário acha que o site quebrou; desiste; reclama no feedback. É o tipo de coisa que mata a primeira impressão de um produto novo.
- **Causa:** o roteador não tinha `defaultPendingComponent` (nenhum componente de "carregando"); e a função `tattooData` dispara 7 consultas + validação de sessão em série com a navegação.
- **Solução aplicada HOJE ✅:** `router.tsx` ganhou `defaultPendingComponent` (spinner "Preparando…" após 300ms) — uma linha de configuração que protege TODAS as rotas.
- **Indicador de sucesso:** nenhuma tela branca > 0,5s; feedback "Preparando…" visível em navegações lentas; queda de reclamações de "travado" no canal 💬.

### 🔴 A2 — Botão flutuante 💬 cobre botões do rodapé em telas estreitas (CRÍTICO mobile)
- **O que acontece:** em 454px de largura, o botão "Opinião" (pílula larga, canto inferior direito) sobrepõe o canto do CTA principal — no teste, **cobria "Primeira vez? Crie uma conta"** na tela de login. Um toque 2px fora = abre o feedback em vez de criar conta.
- **Impacto:** fricção exatamente no momento de maior intenção (cadastro).
- **Solução aplicada HOJE ✅:** botão virou **círculo compacto de 48px só com ícone** (mesma função, ⅓ do tamanho, sobreposição praticamente nula).
- **Indicador:** 0 sobreposição geometria em 360/414/454px; toque no CTA de cadastro funciona sempre.

### 🟠 A3 — Erros de autenticação em inglês cru (ALTO)
- **"Password should be at least 6 characters."** num app 100% PT-BR. Leigo interpreta como erro grave.
- **Solução aplicada HOJE ✅:** mapa de tradução em `auth.tsx` (senha curta, credenciais inválidas, e-mail não confirmado, conta já existe, limite de tentativas).
- **Indicador:** 0 mensagem em inglês no fluxo de entrada.

### 🟠 A4 — Logout sem feedback e demorado (ALTO)
- Sair não mostra nada por 10–20s (rede lenta) e no meio do caminho passa por uma tela branca em `/guia`. Parece travado.
- **Causa:** `signOut` + redirecionamento em cascata sem estado de "saindo…".
- **Proposta (curto prazo):** botão vira "Saindo…" com spinner; a correção A1 já ameniza a tela branca intermediária.

### 🟡 A5 — Switches de consentimento sem rótulo acessível (MÉDIO — acessibilidade)
- As chaves de permissão do `/consent` e `/settings` não têm `aria-label`; leitor de tela anuncia "chave, chave, chave". Também quebra automação/teste.
- **Proposta:** rótulos aria em cada chave (curto prazo).

### 🟡 A6 — Trilhas por navegador, não por conta (MÉDIO)
- As trilhas escolhidas ficam no `localStorage` do navegador: duas pessoas no mesmo celular compartilham trilhas; trocar de conta herda a escolha anterior.
- **Proposta:** salvar trilhas no perfil (`visual_profiles`) com fallback local (curto prazo).

### 🟡 A7 — Card de sugestão com indicadores vazios (MÉDIO — confiança)
- Um pacote antigo de Cabelo exibe "Custo: Manutenção: Reversibilidade: Adaptação:" sem valores (dado legado gerado antes do formato atual).
- **Proposta:** ocultar a linha do indicador quando vazia (imediato na próxima rodada); saneamento dos pacotes antigos.

### 🟢 A8 — Hidratação da primeira carga mostra só o botão 💬 (BAIXO)
- Por 1–4s a página tem apenas o botão de Opinião (dev; produção é mais rápida). A correção A1 não cobre a hidratação inicial, mas o impacto real é pequeno.
- **Proposta:** `Suspense` de shell no root (melhoria contínua).

### 🟢 A9 — Falta "Esqueci minha senha" (DÍVIDA CONHECIDA)
- Não existe link de recuperação. Implementar ANTES do SMTP configurado = fluxo quebrado (e-mail nunca chega).
- **Proposta:** configurar SMTP (Resend) → então adicionar `resetPasswordForEmail` + tela de nova senha (curto prazo, bloqueada por infra).

### ✅ B10 — O que se saiu MUITO bem (registrar pra manter o padrão)
- Trilhas com contagem dinâmica e a nova 💈 Barbearia visível de cara;
- Vitrine completa com filtros, estado vazio honesto e aviso de Meu Modelo;
- Configurações com copies destrutivas EXPLICITAS ("remove tudo — perfil, fotos…"), diferenciando ações irreversíveis;
- Consentimento em linguagem acolhedora, reversível e re-explicada em Configurações;
- Banner 💎 do Plano Profissional + chip "✨ Pass ativo" (a conta do dono está com Pass ativo — o batismo aconteceu 😉);
- Feedback 💬 em toda página, inclusive login — sua regra de produto funcionando.

---

## 3. PLANO DE CORREÇÃO EM ETAPAS

### Etapa 0 — Aplicadas HOJE nesta auditoria ✅
| # | Correção | Arquivo |
|---|---|---|
| 1 | Spinner global "Preparando…" (defaultPendingComponent + 300ms) | `src/router.tsx` |
| 2 | Botão 💬 compacto (círculo 48px, sem texto) | `src/components/FeedbackButton.tsx` |
| 3 | Erros de autenticação traduzidos PT-BR | `src/routes/auth.tsx` |

### Etapa 1 — Imediato (1 sessão, junto com o push geral)
1. **A4** logout com "Saindo…" + spinner no botão.
2. **A7** ocultar indicadores vazios no card do dashboard.
3. **A5** aria-labels nas chaves de consentimento/permissão.
4. Saneamento visual: pacotes legados sem indicadores (script leve no carregamento do dashboard ou migração de dados).

### Etapa 2 — Curto prazo (próximas 1–2 sessões)
5. **A6** trilhas sincronizadas com a conta (visual_profiles + fallback localStorage).
6. **A9** SMTP (Resend) → "Esqueci minha senha" completo → religar "Confirm email" no Supabase antes do lançamento público.
7. Onboarding: retomada no ponto exato após interrupção (hoje recarregar volta ao início das perguntas) e botão "pular por enquanto".
8. Microcopy única: padronizar "sugestões/convites/pacotes" → um só termo em todo o app (hoje variam); idem "projeto/plano/versão" na tatuagem.

### Etapa 3 — Melhoria contínua
9. Shell de carregamento na hidratação inicial (A8).
10. Revisão visual: espaçamentos das abas de Profissionais no mobile; contraste do texto muted em fundo âmbar.
11. Rodadas de teste após cada item (mesma suíte: navegação real + `npm test` + typecheck), com verificação de causa-raiz (a correção matou o sintoma E a causa?).
12. Métricas de acompanhamento: taxa de conclusão do cadastro→primeira sugestão; tempo até primeira geração; 💬 feedback por tema; conversão Pass/Profissional; quedas no meio do fluxo.

---

## 4. TEMPOS DE RESPOSTA OBSERVADOS (rede degradada de hoje)
| Ação | Tempo | Sensação |
|---|---|---|
| Troca de página simples | 4–9s | Lenta (sem spinner antes da correção A1) |
| Primeiro carregamento de /tatuagem (7 consultas) | 23s | "Quebrado" (antes da correção) |
| Consulta simples ao Supabase | 0,5s (normal) → 5–11s (degradado) | — |
| Logout completo | 10–20s | "Travado" |

**Conclusão de performance:** o app não tem gargalo próprio relevante; o ponto fraco é **ausência de feedback** (corrigido em A1) e a concentração de 7 consultas numa função (aceitável hoje; agrupar em 1 RPC se crescer).
