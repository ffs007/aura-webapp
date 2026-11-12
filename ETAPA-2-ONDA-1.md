# ✅ Etapa 2 — Onda 1 (Design system de estados e consistência visual) — Execução

**Data:** 10/11/2026 · **Base:** `webapp-lovable` · **Escopo:** primeiro bloco da Etapa 2 — um único sistema de estados (carregando, vazio, erro), tipografia, superfícies e foco visual aplicado ao app inteiro.
**Status:** concluída e validada (TypeScript, build, testes automatizados e navegador real).

---

## 1. O que foi entregue

### 1.1 Componentes únicos de estado

Novo módulo `src/components/estados/index.tsx`:

| Componente | Para quê | Garantias que ele embute |
|---|---|---|
| `CabecalhoPagina` | Cabeçalho de qualquer tela | **um único `h1`**, tamanho único (`text-4xl md:text-5xl`), descrição, ações alinhadas, linha "antes" (voltar/etiquetas) e conteúdo extra (chips/filtros) |
| `Secao` | Seção com título | `h2` padrão (`text-3xl`) ligado por `aria-labelledby` |
| `EsqueletoLista` | Lista carregando | `role="status"`, `aria-busy`, `aria-label="Carregando conteúdo"`, mesma forma da lista real |
| `EsqueletoDetalhe` / `EsqueletoCartao` | Detalhe carregando | forma de cartão em vez de "pisca" genérico |
| `CarregandoInline` / `CarregandoPagina` | Esperas curtas e telas sem forma | rodinha + rótulo PT-BR, anunciada por leitor de tela |
| `EstadoVazio` | Nada aqui / primeiro uso | ícone escondido de leitores de tela, título `h2`, descrição, **ação para sair do vazio** |
| `EstadoErro` | Consulta falhou | `role="alert"`, ícone, mensagem honesta, **"Tentar novamente"** com estado "Tentando…" e variante `semConexao` |
| `Aviso` | Dica, pendência, confirmação parcial | quatro tons: `info`, `sucesso`, `atencao`, `neutro` |
| `Cartao` / `Meta` | Superfície e metadados | `rounded-2xl border bg-card p-6` e `text-xs text-muted-foreground` |

### 1.2 Tokens visuais

Novo `src/lib/design.ts` — a gramática que as telas passaram a compartilhar:

| Token | Valor | Uso |
|---|---|---|
| `CARTAO` | `rounded-2xl border bg-card p-6` | cartão de conteúdo |
| `CARTAO_COMPACTO` | `rounded-2xl border bg-card p-5` | listas e blocos secundários |
| `CARTAO_CLICAVEL` | `CARTAO` + `block transition hover:shadow-soft` | sugestões, looks, planos |
| `CARTAO_DESTAQUE` / `CARTAO_NEUTRO` | destaque `accent` / superfície neutra | convite, dica, área desligada |
| `TITULO_PAGINA` | `text-4xl md:text-5xl` | sempre dentro de `CabecalhoPagina` |
| `TITULO_SECAO` | `text-3xl` | `h2` de seção |
| `TITULO_ITEM` | `text-2xl` | título de item/cartão |
| `META` / `ROTULO_CATEGORIA` | metadados / caixa alta | datas, status, categorias |
| `GRADE_CARTOES` / `PILHA_PAGINA` | grade de cartões / ritmo vertical | consistência de layout |
| `FOCO` | anel de foco em 2 px | controles que não usam o `Button` |

### 1.3 Adoção

| Métrica | Antes | Depois |
|---|---|---|
| Telas/blocos usando `CabecalhoPagina` | 0 | **55** |
| Blocos com `EstadoVazio` | 0 componentes compartilhados | **52** |
| Blocos com `EstadoErro` + retry | 0 | **31** |
| Blocos com esqueleto padronizado | ~20 avulsos (`h-40`/`h-48`/`h-96` aleatórios) | **32** (`EsqueletoLista`/`EsqueletoDetalhe`) + 22 `Carregando*` |
| Avisos com tom semântico (`Aviso`) | 0 | **41** |
| Arquivos importando o sistema | 0 | **49** |
| `h1` literais fora do componente | ~30 telas | **0** (exceto o 404 global, tela sem cabeçalho de app) |
| Classes `rounded-2xl border bg-card p-*` soltas | dezenas | **4** — todas justificadas (linhas compactas e cartão de peça com foto sangrando) |

---

## 2. Regras adotadas (o que passa a ser "certo")

1. **Um `h1` por tela.** Layouts de módulo (maquiagem, cabelo, roupas, DNA) fornecem o `h1` das abas; telas de detalhe fornecem o próprio e o layout **não duplica** o título (corrigido nesta onda).
2. **Carregando tem forma.** Lista reserva cartões, detalhe reserva um bloco; "Carregando…" solto no meio da tela deixou de existir.
3. **Erro tem saída.** Todo erro de consulta mostra "Tentar novamente" e recarrega; nunca é um beco de texto vermelho.
4. **Vazio tem ação.** Todo estado vazio leva a um próximo passo concreto (criar, cadastrar, abrir o guia).
5. **Sucesso/falha de ação é toast; estado de tela é componente.** Spinner dentro do botão continua sendo feedback de ação — não é estado de página.
6. **Cartão é cartão.** Superfícies usam `rounded-2xl`, o mesmo respiro e a mesma sombra de hover em todo o app.
7. **Foco visível.** Chips e filtros que não usam `Button` ganharam o anel `FOCO`.

---

## 3. Telas migradas por área

| Área | O que mudou |
|---|---|
| **Núcleo** (`dashboard`, `studio`, `collections`, `guia`, `compare`, `export`, `package/$id`, `__root`) | cabeçalhos, esqueletos, erro com retry (export/compare ganharam estado de erro que não existia), vazios com ação, cartões tokenizados, 404/erro global com `Button` do design system |
| **Módulos de criação** (maquiagem, cabelo, roupas, tatuagem, barba, estética, retrato, modelo, `ReferenceImage`) — 30 arquivos | `CabecalhoPagina` nos layouts e telas, 7 listas com esqueleto, 8 detalhes com esqueleto, 7 erros com retry, 12 vazios com ação, paywalls duplicados unificados no `PaywallCard` |
| **Tatuagem real** (`components/tattoo/*`) — 3 arquivos (fora dos escopos paralelos, fechado pelo Lead) | 5 telas com `h1` único, erro de consulta com retry, vazios com ação, aviso de saúde com tom âmbar, cartões tokenizados |
| **Conta, DNA e profissionais** — 15 arquivos | loading/erro/vazio inexistentes em DNA (preferências, permissões, versões, linha do tempo), Configurações, Admin e Consentimento; `h1` único; títulos de seção padronizados |
| **Jornada, transversais e rotas públicas** — 17 arquivos | `JourneyWorkspace` com 8 `CabecalhoPagina` e vazios com ação; notificações, busca global, ajuda, uploader de fotos, profissionais e vitrine alinhados; auth/landing/briefing público com avisos e retry |

---

## 4. Lacunas encontradas durante a migração (e corrigidas)

1. **`h1` duplicado nos detalhes de módulo.** Em `/maquiagem/look/:id`, `/cabelo/plano/:id` e `/roupas/look/:id`, o layout do módulo e a tela de detalhe renderizavam dois `h1`. Agora o layout se esconde em rotas de detalhe e a tela fornece o único `h1`.
2. **Erro de consulta em Tatuagem sem retry.** `TattooPhotos` mostrava texto vermelho sem saída; virou `EstadoErro` com "Tentar novamente".
3. **`h1` gigante e cartões `rounded-lg` na Tatuagem.** Três componentes legados mantinham `text-5xl` fora do sistema; padronizados.
4. **Paywall com cor fora da paleta.** `PaywallCard` usava `amber-500`; agora usa o tom âmbar do próprio tema (`ochre`) via `Aviso`, mantendo preço e link.
5. **Radius divergente.** Lembretes em Configurações, dicas do onboarding e cartões da vitrine de tatuagem usavam `rounded-xl`; alinhados a `rounded-2xl`.
6. **Vazio sem ação.** `compare`, `export`, `collections` e `cabelo/maquiagem` tinham vazios sem saída; todos agora apontam para o próximo passo.

---

## 5. Validação executada

### 5.1 Estática

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **7 arquivos / 49 testes / 0 falhas** (13 novos testes do design system) |
| `npm run build` | **sucesso** |

### 5.2 Testes automatizados novos

`src/test/estados.test.tsx` cobre: `h1` único e acessível no cabeçalho, ligação `aria-labelledby` da seção, vazio com ação e ícone escondido, erro com `role="alert"` + callback de retry + estado "Tentando…" + variante sem conexão, esqueletos com `role="status"`/`aria-busy`, carregamentos com rótulo e avisos com tom.

### 5.3 Navegador real (Chromium via CDP, `localhost:8080`)

**43/43 verificações passaram** em 16 telas:

| Verificação | Resultado |
|---|---|
| **Cabeçalho** — 15 rotas + um `/package/<id>` real | **1 `h1` por tela** em todas; `fontSize` idêntico = **48 px** (`text-4xl md:text-5xl` a 1440×900); nenhum redirect de sessão/consent |
| **Erro morto** | nenhuma tela visitada mostrou "Não foi possível/Não conseguimos" sem botão "Tentar novamente" |
| **Loading** — `/studio → /dashboard` com latência CDP de 2 s | esqueleto com `role="status"` + `aria-busy` apareceu e, restaurada a rede, o conteúdo carregou |
| **Erro + retry** | falha HTTP injetada na consulta de pacotes exibiu o `EstadoErro` com "Tentar novamente"; o clique recuperou o conteúdo. O cenário **offline puro** foi registrado à parte: o boundary global mostra "Parece que a conexão caiu" + retry (o React Query pausa consultas offline por padrão) |
| **Vazio de busca** | termo inexistente exibiu o `EstadoVazio` com "Limpar busca e filtros"; o clique limpou o campo |
| **Visual** | cartões de lista com `border-radius: 24px` (rounded-2xl); 5 screenshots em `.e2e/shots-onda4/` |

Capturas: `.e2e/shots-onda4/01-dashboard.png`, `02-erro-retry.png`, `03-loading.png`, `04-vazio.png`, `05-export.png`.

---

## 6. Limitações e pendências (honestas)

1. **Erros de ação continuam `role="alert"`.** Erros de formulário/mutação (ex.: "Não foi possível salvar") permanecem como alerta inline com toast — correto — e não recebem "Tentar novamente" porque a própria ação é o retry.
2. **Jornada sem erro inline.** `JourneyWorkspace` carrega por `loader`/`useSuspenseQuery`; falhas caem no error boundary global (que já oferece "Tentar novamente"). Não inventamos um erro local.
3. **Consultas que nunca tiveram loading/erro** (kits, assinatura de maquiagem, planos de barba, compra/missões) continuam sem esses estados: adicionar branches mudaria comportamento e ficou para a próxima onda.
4. **Exceções visuais conscientes:** cartão de peça do armário (foto sangrando), miniatura de foto privada, cartões "bespoke" de auth (`rounded-[2rem]`) e hero da landing (`bg-card/70` com blur). Não são inconsistências acidentais.
5. **Validação de navegador limitada a uma conta de teste** (dados reais de produção de teste). Estados vazios genuínos de conta nova não foram recriados neste lote; o vazio validado ao vivo foi o de busca sem resultado.
6. **O cenário offline puro** não chega ao `EstadoErro` do dashboard porque o React Query pausa consultas quando não há rede — o app mostra o boundary global de conexão (com retry). O caminho `EstadoErro` + retry foi validado com falha HTTP injetada.
7. **Sem commit/push**, conforme `AGENTS.md`.

---

## 7. Próximo passo (dentro da Etapa 2)

1. **2.2 Microcopy** — revisão de tom, concordância, placeholders e textos de 10–11 px; guia de estilo.
2. **2.3 Contraste/AA** — auditoria de contraste nos tons `muted`/`accent` e foco visível nos modais.
3. **2.5 Busca ampliada** — briefings, coleções e profissionais no ⌘K.
4. **2.7 Instrumentação** — funil e erros por tela para medir o efeito desta onda.
