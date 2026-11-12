# Auditoria de qualidade técnica, UX e acessibilidade — Aura ID (webapp)

> **Escopo:** `webapp-lovable` (`C:\Users\Felip\Desktop\APP Mobile AURA ID\webapp-lovable`) · TanStack Start + React 19 + Vite 8 + Supabase.
> **Data:** 2026-11-08 · **Idioma:** pt-BR · **Tarefa:** task-3 (auditoria de qualidade técnica, acessibilidade e estados).
> **Método:** (1) execução real de `tsc`, `vitest`, `eslint` e `npm run build` no workspace; (2) leitura do código-fonte do working tree; (3) cálculo de contraste WCAG a partir dos tokens de tema.
> **Marcadores:** `[CONFIRMADO]` = visto no código/output deste repo · `[INFERIDO]` = dedução a partir do código, sem verificação em runtime · `[AUSENTE]` = procurei e não existe.
> **Limites:** nenhum navegador foi usado; nenhum servidor foi iniciado (o dev server do Lead em `http://localhost:8080` foi deixado intacto); **nenhum arquivo de `src/` foi editado**. O working tree já continha 3 arquivos modificados antes desta auditoria (`src/router.tsx`, `src/routes/auth.tsx`, `src/components/FeedbackButton.tsx` — provavelmente de outro membro); a leitura abaixo reflete o working tree, não o `HEAD`.
> **Confiança:** alta nas evidências de código; média/baixa apenas onde marcado `[INFERIDO]`.

---

## 0. Sumário executivo (leia isto primeiro)

1. **A base de build está saudável, o lint não.** `tsc --noEmit` limpo (0 erros), 33/33 testes passando e build de produção concluído em ~49 s. Já o `eslint .` reprova com **5.059 problemas (5.035 erros + 24 avisos) em 148 arquivos** — 5.028 são `prettier/prettier` (formatação); 31 são problemas reais de código (hooks/refs/`any`/`prefer-const`). `[CONFIRMADO]` (alta)
2. **O gate de autenticação custa 3 idas à rede por navegação e não tem cache.** `_authenticated/route.tsx:10-19` faz `getUser()` + `consents` + `visual_profiles` em sequência **em toda troca de rota**, e o `QueryClient` não tem `defaultOptions` (`router.tsx:18`). Toda página paga esse pedágio antes do próprio fetch. `[CONFIRMADO]` (alta)
3. **A cobertura de estados de carregamento é boa, mas desigual.** `defaultPendingComponent` global (`router.tsx:25-26`), 54 referências a `Skeleton` (18 telas) e 161 `toast.*`; por outro lado logout, exclusão de conta, exportação de dados e upload de foto não têm estado visual nenhum. `[CONFIRMADO]` (alta)
4. **Nenhuma chamada de IA tem timeout, abort ou botão "cancelar".** `streamImage` aceita `AbortSignal`, mas o único chamador passa `undefined` (`ReferenceImage.tsx:163`); `ai.server.ts:33` e `uso.functions.ts:35` usam `fetch` sem sinal. Se o gateway pendurar, a tela fica em "Gerando…" indefinidamente e o crédito pode ser consumido. `[CONFIRMADO]` (alta)
5. **38 fluxos destrutivos mapeados:** 17 com `Confirm` (AlertDialog), 4 com `window.confirm` nativo e **16 sem nenhuma confirmação**; 1 sobrescrita é automática e silenciosa (`ReferenceImage.tsx:169` apaga a referência anterior ao gerar de novo). Nenhuma exclusão tem undo/soft-delete. `[CONFIRMADO]` (alta)
6. **A promessa "excluir sua conta remove tudo" (`settings.tsx:121`) é falsa para fotos de Estética, Retrato e Meu Modelo**: essas fotos vão só para o Storage (`estetica.tsx:50`, `retrato.tsx:52`, `modelo.tsx:65`) e nunca para a tabela `photos`, então nem `wipe("photos")` (`settings.tsx:55-69`) nem `deleteAccount` (`aura.functions.ts:157-161`) as alcançam. `[CONFIRMADO]` (alta) — risco LGPD.
7. **Acessibilidade: boa base, furos específicos.** 100 `aria-label`, 26 `<img>` (todas com `alt`), `html lang="pt-BR"` e Radix para modais; mas o modal de trilhas é um `<div>` sem `role="dialog"`/foco/Esc (`TrilhaPicker.tsx:20-24`), `Label` sem `htmlFor` em Estúdio/Onboarding (`studio.tsx:80-82`, `onboarding.tsx:203-206`), switches sem nome explícito no Catálogo (`CatalogManager.tsx:48-49`) e **contraste do accent = 3,02:1** (texto) e **3,06:1** (texto branco sobre accent) — abaixo de 4,5:1. `[CONFIRMADO]` (alta)
8. **Mobile é tratado só por breakpoints.** O hook `useIsMobile` existe mas só o `ui/sidebar` (código morto) o usa; o header do app é uma linha única com 10+ itens e `overflow-x-auto`, sem hambúrguer (`_authenticated/route.tsx:47-63`); a exclusão de foto do `PhotoUploader` só aparece no hover (`PhotoUploader.tsx:60`), inacessível no toque. `[CONFIRMADO]` (alta)
9. **Inglês e "placeholder interno" vazam para a tela.** `("[FORA DO ESCOPO DOS CONECTORES LOVABLE]")` aparece na **landing pública** (`index.tsx:65`) e nos rodapés de maquiagem/cabelo/roupas; "Revoke" (`modelo.tsx:134`); página de erro 500 inteira em inglês (`error-page.ts`); erros do middleware/"Supabase Admin" em inglês viram toast (`auth-middleware.ts:60-64`, `aura.functions.ts:167`). `[CONFIRMADO]` (alta)
10. **Não existe busca global, atalho de teclado, tour ou offline.** `cmdk`/`command.tsx`, `sidebar.tsx`, `carousel.tsx`, `pagination.tsx` estão no repo mas não são importados por nenhuma rota; `public/` só tem `robots.txt` (favicon referenciado em `__root.tsx:94` → 404) e não há service worker/manifest. `[CONFIRMADO]` (alta) para a ausência.

**Nota de leitura:** a numeração `A1…I8` é usada nas seções 3 e reaparece na lista priorizada (§5), para não duplicar evidência.

---

## 1. Comandos executados — resultados reais

Ambiente: Windows, **Node v24.16.0**, **npm 11.13.0**; dependências instaladas em `node_modules`; CWD `webapp-lovable`. Todos os comandos foram rodados a partir de `webapp-lovable`.

| # | Comando | Resultado | Resumo da saída | Tempo |
|---|---|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0** | 0 diagnósticos (`errors 0`) — nenhum erro de tipo no projeto | **48,8 s** |
| 2 | `npx vitest run` | **exit 0** | **6 arquivos / 33 testes / 0 falhas** — `journey` (1), `tattoo` (1), `catalogo-csv` (5), `stencil` (4), `onboarding` (5), `app-routing` (17); 20,16 s total (transform 6,80 s, setup 8,82 s, testes 202 ms, environment 48,18 s) | **20,2 s** |
| 3 | `npx eslint .` | **exit 1** | **5.059 problemas = 5.035 erros + 24 avisos**, em **148 arquivos**. Regras: `prettier/prettier` 5.028; `react-hooks/exhaustive-deps` 13 (aviso); `react-refresh/only-export-components` 11 (aviso); `@typescript-eslint/no-explicit-any` 5; `prefer-const` 2. **5.029 corrigíveis com `--fix`** (não executei correção, conforme instrução) | ~35 s |
| 4 | `npm run build` | **exit 0** | Build de produção completo. Fases: client **15,19 s** (2.227 módulos), SSR **13,68 s** (297 módulos), Nitro/Cloudflare **4,53 s** (2.265 módulos). Sem erros. Avisos: (a) "The plugin `vite-tsconfig-paths` is detected… can be removed"; (b) bloco `[PLUGIN_TIMINGS]` (vite-tsconfig-paths 56% / import-protection 34%); (c) `WARN inlineDynamicImports option is ignored because the codeSplitting option is specified` (nitro). Não houve aviso de chunk > 500 kB, mas o maior chunk cliente é `index-*.js` = **341,00 kB (104,78 kB gzip)**, `client-*.js` = **218,64 kB**, e no SSR `@tanstack/react-router` = **789,62 kB (168,75 kB gzip)** | **48,7 s** (parede) |

**Observações de ambiente/execução (sem mascarar nada):**
- Nenhum comando falhou por sandbox/spawn; nenhum exit inesperado.
- O build **reescreveu** `.output/`, `.wrangler/` e `node_modules/.nitro/` — todos **gitignored** (`.gitignore` contém `.output`, `.wrangler/`, `.tanstack/**`), portanto **nenhuma alteração de fonte**. `git status -- src` continua com os mesmos 3 arquivos pré-existentes; **não editei `src/`**.
- O dev server do Lead em `http://localhost:8080` **não foi iniciado nem parado** por mim; não usei navegador.

Evidência bruta disponível em: `.output/` (gerado), e logs completos do lint/vitest/build desta sessão (arquivos temporários do harness).

---

## 2. Panorama quantitativo do código auditado

| Métrica | Valor | Como obtido |
|---|---|---|
| Arquivos `src/**/*.tsx` / `*.ts` | 140 / 58 | `Get-ChildItem -Recurse` |
| Arquivos de rota (`src/routes/**/*.tsx`) | 70 | idem |
| `useQuery(` | 43 ocorrências | grep |
| Referências a `Skeleton` | 54 | grep |
| `toast.success/error/info` | 161 chamadas | grep |
| `aria-label` / `aria-describedby` | 100 / **1** | grep |
| `role="alert"` / `role="status"` | 14 / 5 | grep |
| `<img` | 26 (todas com `alt`) | grep |
| `placeholder=` | 70 | grep |
| `disabled=` | 78 | grep |
| `confirm(` nativo | 5 | grep |
| `window.print` | 5 | grep |
| Rotas com `loader`/prefetch | 9 (8 `jornada/*` + `tatuagem/route.tsx`) | grep `loader:` |
| `TODO`/`FIXME` em `src` | **0** | grep |
| Componentes UI shadcn mortos | `sidebar`, `command`, `carousel`, `pagination`, `menubar`, `navigation-menu`, `form`, `calendar`, `chart`, `table`, `drawer` (11) | grep de imports |

---

## 3. Achados por dimensão

### A. Carregamento e percepção de fluidez

**A1 — 🔴 Gate autenticado faz 3 round-trips antes de qualquer página.** `[CONFIRMADO]`
`src/routes/_authenticated/route.tsx:10-19`: `beforeLoad` → `supabase.auth.getUser()` (chamada de rede), depois `from("consents")`, depois `from("visual_profiles")`, **em série**, em toda navegação para qualquer rota `_authenticated`. Some-se: `QueryClient` sem `defaultOptions` (`src/router.tsx:18`, logo `staleTime: 0` → refetch a cada montagem) e `ssr: false` na rota-mãe (`route.tsx:9`). *Impacto:* em 4G cada clique no menu paga ~3 RTT antes de o componente começar a buscar dados; a sensação é de app "lento" mesmo com skeleton.
*Causa provável:* gate implementado no router (client-side, por navegação) em vez de cache/contexto de sessão ou `beforeLoad` com `queryClient.ensureQueryData` + `staleTime`.

**A2 — 🟠 Só 9 rotas pré-carregam dados; o resto busca depois de montar.** `[CONFIRMADO]`
Apenas `jornada/*` (7 rotas) e `tatuagem/route.tsx:4` usam `loader: … ensureQueryData`. As demais fazem `useQuery` no componente e mostram skeleton após o mount — ex.: `dashboard.tsx:28-37`, `cabelo/index.tsx:22`, `roupas/index.tsx:23`, `maquiagem/index.tsx:29`. *Impacto:* cascata gate → skeleton → conteúdo em vez de gate → conteúdo.

**A3 — 🟠 Operações longas sem progresso além do texto do botão.** `[CONFIRMADO]`
Gerações têm `disabled` + rótulo ("Montando…", "Pode levar até um minuto": `cabelo/gerar.tsx:63-64`, `maquiagem/gerar.tsx:87-88`, `studio.tsx:94-95`), mas **exportações e exclusões em lote não têm estado nenhum**: `export.tsx:29-34` (download instantâneo, ok) e `dna/redefinir.tsx:31-37` (`exportAll` faz 12 queries sequenciais e baixa o JSON **sem `busy`, sem barra, sem bloqueio de duplo clique**). *Impacto:* clique repetido multiplica as 12 requisições.

**A4 — 🟠 Logout, exclusão de conta e "descartar" sem feedback.** `[CONFIRMADO]`
`_authenticated/route.tsx:63`: `onClick={async () => { await supabase.auth.signOut(); nav({to:"/"}) }}` — sem `disabled`, sem spinner, sem toast de sucesso; erro de rede no `signOut` fica sem tratamento. `settings.tsx:71-76` (`deleteAll`) — sem `busy`, sem mensagem de sucesso; após apagar a conta o usuário cai na landing sem confirmação. *Impacto:* duplo clique em "Sair"/"Excluir conta" e ausência de confirmação do efeito.

**A5 — 🟠 Primeiro paint do app autenticado é client-only, sem shell de carregamento.** `[INFERIDO]`
`_authenticated/route.tsx:9` (`ssr: false`) + `__root.tsx:133-139` (root só injeta `<Outlet/>`). O `defaultPendingComponent` (`router.tsx:6-15`) só entra em cena **depois** da hidratação e de 300 ms (`defaultPendingMs: 300`). *Impacto:* em conexão lenta, HTML inicial tende a "tela em branco" até o bundle React/Supabase executar. *Verificação:* DevTools → Network throttling "Slow 4G" e abrir `/studio` direto.

**A6 — 🟡 Skeleton padrão bonito em 18 telas, mas estados de carregamento heterogêneos.** `[CONFIRMADO]`
Bons exemplos: `dashboard.tsx:37`, `dna/index.tsx:27`, `maquiagem/index.tsx:29`, `cabelo/index.tsx:22`. Fracos: `admin.tsx:36` (`<p>Carregando…</p>`), `retrato.tsx:122`, `ParceirosManager.tsx:190`, `FeedbackAdmin.tsx:22`, `WardrobeFitting.tsx:50`; e `estetica.tsx:126` — enquanto `permite === null` **nada** é renderizado entre o cabeçalho e o resto, causando "salto" de layout.

**A7 — 🟡 Upload de foto sem indicador de envio.** `[CONFIRMADO]`
`estetica.tsx:45-54`, `retrato.tsx:45-57`, `modelo.tsx:59-72`, `PhotoUploader.tsx:23-34`: `await storage.upload(...)` sem `busy`/`role="status"`/progresso. Em 4G a impressão é de clique morto (o único componente que acerta é `TattooPhotos.tsx:19`: `{busy && <p role="status">Enviando…</p>}`).

**A8 — 🟡 Modal de Trilhas reaparece a cada recarga e botão de opinião flutua sobre CTAs.** `[CONFIRMADO]`
`_authenticated/route.tsx:31-40`: se não houver trilhas salvas, o picker abre em toda montagem; "Agora não" (`TrilhaPicker.tsx:55`) **não persiste nada** (`trilhas.ts:63-81` só salva a escolha), então o modal bloqueante volta a cada reload. O `FeedbackButton` é `fixed bottom-4 right-4 z-40` (`FeedbackButton.tsx:45`) em **todas** as páginas, inclusive formulários longos — pode cobrir o CTA de rodapé no mobile.

---

### B. Erros e recuperação

**B1 — 🔴 Sessão expirada/offline é tratada como "não logado" e redireciona em silêncio.** `[CONFIRMADO]`
`_authenticated/route.tsx:11-12`: qualquer estado sem `data.user` (incluindo falha de rede do `getUser()`) → `throw redirect({ to: "/auth" })`, **sem toast explicando**, sem retry, sem distinguir "sessão expirou" de "você nunca entrou". Usuário que estava logado é jogado no login como se tivesse saído. *Causa provável:* gate trata `error` e "sem sessão" como o mesmo caso.
*Verificação:* com o app aberto, apagar o token no DevTools (Application → localStorage) e navegar; ou simular offline e clicar num link interno.

**B2 — 🔴 Nenhum timeout/abort/cancelamento nas chamadas de IA.** `[CONFIRMADO]`
`src/lib/stream-image.ts:10` — `signal?: AbortSignal` é opcional; o **único** chamador passa `undefined` (`ReferenceImage.tsx:163`), então não há `AbortController` em lugar nenhum do repo (grep: 0 `AbortController`). `ai.server.ts:33` e `uso.functions.ts:35` também fazem `fetch` sem sinal/timeout. O botão "Gerar" fica `disabled` e o spinner `busy` permanece até a resposta ou o erro — **não existe "cancelar"**. `stream-image.ts:102` só lança erro quando o stream termina; enquanto o stream não fecha, ninguém solta a UI. *Impacto:* travas de 2–5 min com crédito possivelmente consumido; sem forma de escapar a não ser recarregar (o que perde o preview).

**B3 — 🟠 Falha de rede em quota/assinatura é mascarada com dado otimista/errado.** `[CONFIRMADO]`
`QuotaChip.tsx:15-20`: `catch { setDados({ contagem: {}, pass: false }) }` → o chip passa a mostrar **"restam 5 de 5 grátis"** mesmo se a cota acabou (o `contagem` vazio faz `restam = limite`). `aura-pass.tsx:19-22`: erro em `passStatus()` → `setStatus({active:false,…})` → assinante ativo vê o **CTA de assinatura** de novo, sem mensagem de erro. *Impacto:* usuário decide comprar/gerar com informação falsa.

**B4 — 🟠 Erros técnicos em inglês chegam ao toast.** `[CONFIRMADO]`
`auth-middleware.ts:45,53,60,64,72,76,94-96` lançam mensagens em inglês ("Unauthorized: …", "Missing Supabase environment variable(s)…"). O padrão de UI propaga `e.message` cru: `ParceirosManager.tsx:201,217` (`toast.error(e instanceof Error ? e.message : …)`), `JornadaEstetica.tsx:113`, `profissionais.tsx:317`. Pior: `settings.tsx:73` faz `toast.error(r.error)` e `aura.functions.ts:167` devolve **`error.message` do Supabase Admin (inglês)** na exclusão de conta.

**B5 — 🟠 Página de erro fatal é 100% em inglês.** `[CONFIRMADO]`
`src/lib/error-page.ts:3` (`<html lang="en">`), `:6` ("This page didn't load"), `:21-25` ("Something went wrong on our end…", "Try again", "Go home"). Renderizada por `server.ts:32` e `:55` em qualquer 500 SSR/h3 — ou seja, no pior momento o produto troca de idioma.

**B6 — 🟠 Não há retry/offline explícito nas telas de erro.** `[CONFIRMADO]`
O `QueryClient` (`router.tsx:18`) usa o default do React Query (3 tentativas em queries), mas telas tratam erro com texto e pedido de recarregar: `dashboard.tsx:38` ("Recarregue a página"), `admin.tsx:37`, `FeedbackAdmin.tsx:23` (mostra `error.message` cru). Não há botão "Tentar de novo" por tela (só o do root, `__root.tsx:57-73`), não há detecção de `navigator.onLine` (grep: 0) e não há fila offline.

**B7 — 🟡 `p.$slug` transforma qualquer erro de rede em "perfil não encontrado".** `[CONFIRMADO]`
`p.$slug.tsx:36-38` — `catch { setEstado('erro') }` e a UI de erro (`:41-47`) diz "Este link pode ter mudado ou o perfil não está mais ativo". Perfil real pode existir e estar inacessível.

**B8 — 🟡 Só o root tem `errorComponent`; rotas com `useSuspenseQuery` não têm boundary próprio.** `[CONFIRMADO]`
`__root.tsx:103` é o único `errorComponent` do app (grep: 1). `JourneyWorkspace.tsx:16` e `TattooWorkspace.tsx:15` usam `useSuspenseQuery` sem `<Suspense>`/`errorComponent` de rota; uma suspensão/rejeição fora do loader derruba a árvore para a tela genérica "Esta página não carregou" (`__root.tsx:51`).

**B9 — 🟡 Mensagens de erro cruas e sem truncamento na UI.** `[CONFIRMADO]`
`ReferenceImage.tsx:242` renderiza `err || q.data?.error` (vindo de `stream-image.ts:34`/`:94`, que repassam **o corpo HTTP inteiro** da resposta). Um 502 do gateway pode aparecer como JSON/texto de proxy em inglês. `break-words` ajuda no layout, não no conteúdo.

**B10 — 🟡 Exportação de dados engole falhas parciais.** `[CONFIRMADO]`
`dna/redefinir.tsx:31-37`: para cada uma das 12 tabelas, `(await supabase.from(t).select("*")).data ?? []` — se uma tabela falhar, o JSON é gerado **incompleto sem aviso** (o usuário acredita que exportou tudo).

---

### C. Ações destrutivas — mapa completo

> Varredura: `grep -R "\.delete\(|\.remove\(|excluir|apagar|limpar|reset|revogar" src`. Foram identificados **38 fluxos destrutivos**: **17** usam o `Confirm` do projeto (AlertDialog), **4** usam `window.confirm` nativo, **16** não têm confirmação alguma e **1** é sobrescrita automática. **Nenhum** tem undo/soft-delete ou lixeira. Tabela completa no §4.

**C1 — 🔴 Exclusão de conta: promessa de "tudo" não é cumprida, e o fluxo não tem estado/feedback de sucesso.** `[CONFIRMADO]`
- Texto: `settings.tsx:121` "Excluir sua conta remove tudo — perfil, fotos, sugestões, feedback, DNA Visual e histórico."; `:122` `Confirm` com "Isso não pode ser desfeito."
- Implementação: `aura.functions.ts:152-169` — apaga `generated_references` e as fotos **da tabela `photos`** + 26 tabelas em loop sequencial **sem transação**, depois `auth.admin.deleteUser` (`:166`).
- Ficam para trás: fotos enviadas em **Estética** (`estetica.tsx:49-53` — upload no Storage, sem `insert` em `photos`), **Retrato** (`retrato.tsx:51-55`) e **Meu Modelo** (`modelo.tsx:64-71`, incl. `modelo-rosto.png`/`modelo-corpo.png` gerados em `:98-99`). `wipe("photos")` (`settings.tsx:60-63`) também só apaga caminhos de `photos`, então o usuário **não tem como excluir** essas imagens pela UI. *Impacto:* dado pessoal/biométrico permanece no Storage após exclusão de conta — risco direto de LGPD e de confiança.
- Fluxo de UI: `deleteAll()` (`settings.tsx:71-76`) não desabilita o botão, não mostra "excluindo…", não trata exceção de `del()` e não confirma sucesso.
- *Verificação:* criar conta de teste, enviar foto em `/estetica` e `/retrato`, excluir conta em `/settings`, conferir o bucket `user-photos` (pasta do `user_id`) via painel Supabase — os arquivos `estetica-*.png`/`retrato-*.png` continuam lá.

**C2 — 🔴 "Gerar novamente" apaga silenciosamente a referência anterior.** `[CONFIRMADO]`
`ReferenceImage.tsx:169`: após a nova imagem ser salva, `if (q.data?.id) await remove();` — `remove()` (`:117-122`) apaga o objeto no Storage, a linha em `photos` e o `generated_references` anterior. Não há confirmação, aviso de substituição, undo ou toast informando que a anterior foi descartada. *Impacto:* perda de um resultado que o usuário talvez quisesse manter (o botão diz "Gerar novamente", não "substituir").

**C3 — 🟠 16 exclusões sem confirmação.** `[CONFIRMADO]`
`settings.tsx:106` (lembrete, "Remover" direto), `modelo.tsx:153` (Excluir modelo), `modelo.tsx:136-139` (desligar o switch de consentimento **apaga o modelo na hora**), `modelo.tsx:176` (Descartar fotos), `retrato.tsx:155` (Excluir foto), `ReferenceImage.tsx:239` (ícone de lixeira), `PhotoUploader.tsx:60` (Excluir), `collections.tsx:48`, `maquiagem/kits.tsx:48`, `cabelo/alertas.tsx:30`, `JourneyWorkspace.tsx:132` (foto), `JourneyWorkspace.tsx:134` (reflexão), `JourneyWorkspace.tsx:58` (remover passo — não persistido), `tattoo/TattooPhotos.tsx:19` (foto individual), `tattoo/TattooPlanView.tsx:41` (diário), `dna/preferencias.tsx:40` (chip).
*Impacto:* clique acidental em telas de toque = perda de dado pessoal sem volta.

**C4 — 🟠 Exclusões sem tratamento de erro/feedback consistente.** `[CONFIRMADO]`
`collections.tsx:35` → `await supabase.from("collections").delete()...` **sem checar `error`** e sem toast; `maquiagem/kits.tsx:36` idem; `cabelo/alertas.tsx:30` idem (só `toast.success`); `roupas/look.$id.tsx:49` idem; `modelo.tsx:80-85` ignora erro do `storage.remove` e dá `toast.success("Modelo pessoal excluído.")` **mesmo se falhar**; `JourneyWorkspace.tsx:132/134` só mostra erro, não confirma sucesso; `settings.tsx:106` idem. *Impacto:* usuário acredita que apagou quando o dado pode continuar.

**C5 — 🟠 Aviso de irreversibilidade só existe em 3 de 38 fluxos.** `[CONFIRMADO]`
Só `settings.tsx:122` ("Isso não pode ser desfeito"), `JourneyWorkspace.tsx:35` ("Não pode ser desfeito") e `TattooWorkspace.tsx:22` ("Não pode ser desfeito") declaram irreversibilidade. Os demais `Confirm` dizem apenas "será apagado"/"serão removidos" — o usuário não sabe que não há recuperação.

**C6 — 🟡 `window.confirm` nativo em 4 pontos, inconsistente com o design.** `[CONFIRMADO]`
`ParceirosManager.tsx:201,217`, `profissionais.tsx:317`, `JornadaEstetica.tsx:113`. É bloqueante, sem estilo, com botões do navegador (rotulados pelo idioma do SO — pode vir em inglês), e **não** deixa claro se é definitivo.

**C7 — 🟡 Não existe undo/soft-delete/lixeira.** `[CONFIRMADO]` (grep: nenhuma coluna `deleted_at` usada no cliente; nenhuma tela de restauração). Todas as exclusões são hard delete de banco + Storage.

**C8 — 🟡 Sobrescritas de arquivo no Storage sem aviso.** `[CONFIRMADO]`
`modelo.tsx:98-99` (`upsert: true` em `modelo-rosto.png`/`modelo-corpo.png`) e `ReferenceImage.tsx:167` (novo `reference-${id}.png` por geração) — o usuário não é informado de que a base anterior foi trocada. `modelo.tsx:99` também usa `contentType: "image/jpeg"` para um blob PNG.

---

### D. Duplo clique / idempotência

**D1 — 🟢 Positivo: gerações bloqueiam duplo clique no cliente.** `[CONFIRMADO]`
`studio.tsx:94` (`disabled={busy}`), `cabelo/gerar.tsx:63`, `roupas/gerar.tsx:50`, `maquiagem/gerar.tsx:87`, `modelo.tsx:175`, `retrato.tsx:176`, `estetica.tsx:165,182,183`, `ReferenceImage.tsx:125` (ref `running`) e `:237` (`disabled={busy||interpretando||q.isLoading}`). O estado muda antes do `await`, então o clique duplo rápido é absorvido.

**D2 — 🟠 Idempotência só no cliente: sem chave de idempotência no servidor.** `[CONFIRMADO]`
`prepareReference` (`references.functions.ts:69-80`) **sempre** cria solicitação e dispara IA; `ReferenceImage.tsx:139` só consulta o status atual via `q.data` (cache da aba). Duas abas, refresh durante a geração ou retry após timeout = **duas execuções pagas**. Não há `idempotency_key`/`unique(user, slot, status)` no schema usado.

**D3 — 🟠 Retry automático de verificação custa 2 gerações por clique.** `[CONFIRMADO]`
`ReferenceImage.tsx:129-133` (`reprovado` → `runGeneration` de novo) e `retrato.tsx:115-119`. O toast informa (`ReferenceImage.tsx:131`, `retrato.tsx:117`), então não é silencioso, mas consome 2 créditos de uma ação. `estetica.tsx:70-91` piora: cada clique em "Simular" gera 1 imagem **e faz 1 nova medição** (`:87`) sem informar custo.

**D4 — 🟠 Ações de gravação sem `busy`/`disabled` (duplo envio possível).** `[CONFIRMADO]`
`settings.tsx:40-47` (toggle de consentimento: switch não desabilita durante o `update`), `settings.tsx:49-53` (Adicionar lembrete insere sem checar erro nem bloquear), `settings.tsx:55-76` (`wipe`/`deleteAll`), `dna/redefinir.tsx:18-24` (`run` chamado pelo `AlertDialogAction`, que fecha na hora), `dna/redefinir.tsx:31-37` (`exportAll`), `onboarding.tsx:110-121` (`finish`: "Salvar perfil" **sem `busy`** → duplo clique grava 2 upserts + evento duplicado), `collections.tsx:35`, `maquiagem/kits.tsx:36`, `cabelo/alertas.tsx:30`.

**D5 — 🟡 `Confirm` não espera a promise nem bloqueia o trigger.** `[CONFIRMADO]`
`Confirm.tsx:10`: `<AlertDialogAction onClick={onYes}>` — `onYes` costuma ser `async`, mas o dialog fecha imediatamente; falha só aparece como toast depois, e reabrir o dialog permite repetir. Não há prop `loading`/`pending` no componente.

---

### E. Acessibilidade

**E1 — 🟠 Switches sem nome acessível explícito; cartões de consentimento togglam ao clique em qualquer texto.** `[CONFIRMADO]`
- `CatalogManager.tsx:48-49`: dois `Switch` dentro de células de tabela, **sem `aria-label`**, sem `scope` nos `<th>` e sem associação — leitor de tela anuncia "switch" sem dizer de quê ("Pele sensível" ou "Ativo").
- `settings.tsx:88,92`, `consent.tsx:38-41`, `modelo.tsx:131-140`, `dna/permissoes.tsx:16-19`: o `Switch` está dentro de um `<label>` que envolve **todo o cartão**. O nome acessível vira o parágrafo inteiro e, como `button` é elemento rotulável, **clicar em qualquer ponto do texto dispara o toggle** — em telas de consentimento LGPD isso permite mudança acidental de permissão ao selecionar texto/rolar.
- *Verificação:* Tab até o switch (lê o texto inteiro) e depois clicar no parágrafo do cartão — o switch muda.

**E2 — 🟠 Modal de Trilhas sem semântica nem gestão de foco.** `[CONFIRMADO]`
`TrilhaPicker.tsx:20-24`: `<div className="fixed inset-0 z-50 …" onClick={onFechar}>` — **sem** `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, `Esc` ou retorno de foco; fundo clicável fecha, mas o foco permanece no body. Botões de seleção (`:36-50`) só indicam estado por cor/✓ (`aria-hidden` em `:49`), **sem `aria-pressed`**. Como o modal abre sozinho na primeira visita (`route.tsx:35`), é a primeira barreira de teclado do app.

**E3 — 🟠 `Label` sem `htmlFor` e inputs sem `id`.** `[CONFIRMADO]`
`studio.tsx:80-82` (três `Label` + `Input`/`Textarea` sem par), `onboarding.tsx:199` + `:203-206` (`Label` do campo e inputs/slider sem `id`), `ReferenceImage.tsx:212-213` (`<label className="text-xs">Texto exato<Input…>` — o label envolve só o input? aqui o texto está dentro do label, então associa; porém `:228` idem), `onboarding.tsx:184-187` (`ReferenceImage` sem rótulo de seção). *Impacto:* leitor de tela lê "edit text" sem nome; clicar no rótulo não foca o campo.

**E4 — 🟠 `Slider` sem rótulo/valor textual.** `[CONFIRMADO]`
`studio.tsx:81` ("Intensidade desejada", sem `aria-label` no `Slider`) e `onboarding.tsx:206` (`f.type === "slider"`, sem `aria-label`/`aria-valuetext`). Leitor de tela: "slider", sem contexto nem o que 1–5 significa.

**E5 — 🟠 Contraste insuficiente em dois tokens usados em texto (WCAG AA).** `[CONFIRMADO por cálculo]`
Tokens em `styles.css:66-67`: `--accent: oklch(0.66 0.11 40)`, `--accent-foreground: oklch(0.98 0.01 80)`. Convertendo OKLCH→sRGB e aplicando a fórmula de luminância relativa WCAG:
- `text-accent` sobre `background` (0.975 0.012 80) = **3,02:1**; sobre `card` = **3,15:1** → abaixo de **4,5:1** para texto normal (12–14 px), usado em links/labels: `index.tsx:34`, `dashboard.tsx:86`, `ReferenceImage.tsx:298`, `TattooWorkspace.tsx:22`, `p.$slug.tsx:52`.
- branco (`accent-foreground`) sobre `bg-accent` (botão `variant="accent"`) = **3,06:1** → reprova 4,5:1; usado em CTAs: `onboarding.tsx:169`, `cabelo/gerar.tsx:63`, `studio.tsx:94`.
- Para referência (ok): `foreground/background` 14,29:1; `muted-foreground/background` 5,67:1; `primary-foreground/primary` 11,58:1; `destructive/background` 4,95:1.

**E6 — 🟡 Botões só-ícone dependem de `title`.** `[CONFIRMADO]`
`JornadaEstetica.tsx:113`, `ParceirosManager.tsx:201,217` (lixeira, `title` apenas, sem `aria-label`); `profissionais.tsx:317` (🗑️ com `title`). `title` só entra no nome acessível como último recurso e não é anunciado de forma confiável em toque. O padrão correto existe: `ReferenceImage.tsx:238-239` usa `aria-label` + `title`.

**E7 — 🟡 Foco visível fraco/ausente fora do `<Button>`.** `[CONFIRMADO]`
`button.tsx:8` usa `focus-visible:ring-1` (fino, 1 px). Já os links do header (`route.tsx:51`), filtros do dashboard (`dashboard.tsx:79`), cards de onboarding (`onboarding.tsx:210,221`) e chips (`:229-231`) são `<button>/<Link>` sem classe de `focus-visible` — navegação por teclado sem indicador de foco nesses controles.

**E8 — 🟡 Diálogos sem `DialogDescription` e strings sr-only em inglês.** `[CONFIRMADO]`
`FeedbackButton.tsx:50-51`, `ReferenceImage.tsx:329`, `profissionais.tsx:355-358` abrem `DialogContent` só com `DialogTitle` → Radix emite aviso no console e o leitor de tela não tem descrição. Somam-se strings em inglês: `dialog.tsx:49` (`<span className="sr-only">Close</span>`), `sheet.tsx:66`, `carousel.tsx:226` ("Next slide"), `pagination.tsx:72` ("Next").

**E9 — 🟡 Padrões ARIA incompletos.** `[CONFIRMADO]`
`onboarding.tsx:141-144`: `role="tablist"` + `role="tab"`/`aria-selected` **sem `aria-controls`/`tabpanel`**; `dashboard.tsx:79` filtros e `studio.tsx:59,68` seletores sem `aria-pressed` (os cards de cor em `onboarding.tsx:221` têm — inconsistente).

**E10 — 🟢 Positivo: imagens com `alt` e hero acessível.** `[CONFIRMADO]`
26 `<img>` verificadas, todas com `alt` (ex.: `PhotoUploader.tsx:59`, `retrato.tsx:152,187`, `p.$slug`-related, `ReferenceImage.tsx:206,292,307`); hero CSS usa `role="img"` + `aria-label` (`index.tsx:46`); `BodyAvatar`/`ShapeIcon` usam `aria-hidden` (`onboarding.tsx:242`).

**E11 — 🟡 `html lang` correto no app, errado na página de erro.** `[CONFIRMADO]` `__root.tsx:108` (`pt-BR`) × `error-page.ts:3` (`en`).

---

### F. Responsividade

**F1 — 🟠 Header do app não colapsa no mobile.** `[CONFIRMADO]`
`_authenticated/route.tsx:47-63`: uma única linha com logo + nav (links das trilhas + Estúdio/Dashboard/DNA/Comparar/Exportar/Configurações) + botões "Estética", "Modelo", "Retrato", "Pass", "Trilhas", "Sair", todos `whitespace-nowrap`, dentro de `overflow-x-auto`. Em 360–390 px os últimos itens ficam fora da viewport inicial; rolagem horizontal não tem affordance. Sticky (`:46`) ocupa ~56–60 px fixos.

**F2 — 🟠 `useIsMobile` é código morto; não há adaptação mobile real.** `[CONFIRMADO]`
`src/hooks/use-mobile.tsx:5-18` é importado apenas por `src/components/ui/sidebar.tsx:69`, e **`ui/sidebar` não é importado por nenhuma rota** (grep de imports = 0). Portanto não existe menu mobile, sheet de navegação ou detecção de dispositivo em uso.

**F3 — 🟠 Alvos de toque abaixo de 44 px.** `[CONFIRMADO]`
`button.tsx:22-25`: `sm` = **32 px** (`h-8`), `default`/`icon` = **36 px** (`h-9`), `lg` = 44 px. `sm` é usado em ações frequentes e destrutivas (header `route.tsx:56-63`, `Confirm` do projeto, lixeiras, "Remover"). WCAG 2.5.5 (AAA) e Apple HIG pedem ≥44 px; mesmo o critério AA 2.5.8 (24 px) é atendido, mas o alvo real de toque fica pequeno em telas densas.

**F4 — 🟠 Exclusão por hover no `PhotoUploader` some no toque.** `[CONFIRMADO]`
`PhotoUploader.tsx:58-60`: botão `absolute inset-x-0 bottom-0 … opacity-0 group-hover:opacity-100`. Em dispositivo sem hover (mobile/tablet) o botão fica invisível e não há como excluir a foto; também é inalcançável por teclado (sem `focus-within`). Além disso não pede confirmação.

**F5 — 🟡 Títulos `text-5xl` fixos e `whitespace-nowrap` elevam risco de overflow.** `[CONFIRMADO]`
`text-5xl` (48 px) em quase toda tela: `settings.tsx:80`, `estetica.tsx:121`, `retrato.tsx:128`, `modelo.tsx:122`, `TattooWorkspace.tsx:22`, `p.$slug` (4xl). Com `whitespace-nowrap` (`button.tsx:8`, header, badges) palavras longas ("Configurações", "Exportação") podem estourar em 320 px.

**F6 — 🟡 Grades de fotos fixas em 4 colunas.** `[CONFIRMADO]` `PhotoUploader.tsx:56`, `modelo.tsx:166`, `TattooPhotos`/`JourneyWorkspace.tsx:132` usam `grid-cols-4` sem breakpoint → thumbs ~70 px em 360 px (pequenos para toque e difíceis de avaliar).

**F7 — 🟡 Tabela do admin pode estourar horizontalmente.** `[CONFIRMADO]` `CatalogManager.tsx:41-53`: wrapper tem `overflow-auto` para altura (`max-h-96`), mas a tabela tem 5 colunas com conteúdo livre e não há indicação de rolagem horizontal no mobile.

**F8 — 🟡 Elemento flutuante sobre conteúdo + ausência de safe-area.** `[CONFIRMADO]` `FeedbackButton.tsx:45`: `fixed bottom-4 right-4` sem `env(safe-area-inset-bottom)`, sobrepondo o canto inferior direito de todas as páginas (inclusive botões de salvar/rodapé) e a barra de gestos do iPhone.

---

### G. Atalhos de teclado, ajuda, tour e busca

**G1 — 🟡 Não há busca interna.** `[CONFIRMADO]` `cmdk` está nas dependências e `src/components/ui/command.tsx` existe (142 linhas), mas **nenhuma rota importa** `ui/command` (grep = 0). Não há campo de busca em telas como sugestões (43 useQuery) ou coleções.

**G2 — 🟡 Não há atalhos de teclado no produto.** `[CONFIRMADO]` O único listener de teclado é `ui/sidebar.tsx:96-106` (componente morto); nenhum `useHotkeys`, nenhuma paleta, nenhum "?". `onKeyDown` só existe em `dna/preferencias.tsx:35` (Enter em campo de chip) e no `ui/carousel` (não usado).

**G3 — 🟢 Ajuda/onboarding existe e é acessível.** `[CONFIRMADO]` `/guia` com 5 passos e CTAs (`guia.tsx:9-66`), chat de ajuda por campo (`HelpChat.tsx`, com `role` implícito e foco no input em `:19`), primeiro acesso guiado por `TrilhaPicker`, dicas contextuais nos geradores e `FeedbackButton` global. Não há tour com destaque de elementos nem documentação externa/FAQ (links só internos: `studio.tsx:89`, `dashboard.tsx:47`).

**G4 — 🟡 "Agora não" do Trilhas não é persistido** (ver A8) — o onboarding de trilhas pode virar loop de modal a cada reload.

**G5 — 🟡 Sem canal de suporte explícito além do widget de opinião e sem PWA/offline.** `[CONFIRMADO]` Não há página de ajuda/status/contato; o `FeedbackButton` é o único canal e não promete resposta (`FeedbackButton.tsx:74`, `:80`). Também `[AUSENTE]`: **favicon** (referenciado em `__root.tsx:94` como `/favicon.ico`, mas `public/` contém apenas `robots.txt`) e qualquer suporte a **PWA/offline** (sem `manifest.webmanifest`, sem service worker; grep = 0 em `src` e `public`).

---

### H. Segurança/privacidade visível ao usuário

**H1 — 🔴 Exclusão de conta incompleta** — ver **C1** (mesma evidência; não contar duas vezes na lista final).

**H2 — 🟠 Consentimento pode ser alterado com clique acidental** — ver **E1**.

**H3 — 🟠 "Pode mandar anônimo" é enganoso quando há sessão.** `[CONFIRMADO]`
`FeedbackButton.tsx:80` ("Pode mandar anônimo. Guardamos só o essencial.") × `feedback.functions.ts:30-43`: com `Authorization` presente, o envio **anexa `user_id`** (`:34-35`); o painel admin mostra "· logado" (`FeedbackAdmin.tsx:34`). O texto sugere anonimato que não existe para usuário autenticado.

**H4 — 🟡 Conteúdo sensível exibido em claro, sem modo privado.** `[INFERIDO]`
Notas emocionais (`JourneyWorkspace.tsx:134` "Nota privada: …") e diário de cicatrização (`TattooPlanView.tsx:41`) aparecem no corpo da página sem blur/ocultação, em telas possivelmente compartilhadas. Não é bug de segurança (só o dono vê), mas é risco de privacidade social.

**H5 — 🟠 Compartilhamento de briefing expõe foto por 30 dias e manda CEP a terceiro.** `[CONFIRMADO]`
`EnviarBriefing.tsx:33` envia o CEP do usuário a `https://brasilapi.com.br` (terceiro) sem aviso; `:49` cria **URL assinada de 30 dias** para a foto e `:52` envia ao profissional. A promessa de `p.$slug.tsx:80` ("só o que você enviar chega à profissional") não deixa claro o prazo/alcance do link.

**H6 — 🟡 Preferências de trilha sobrevivem ao logout entre contas no mesmo navegador.** `[CONFIRMADO]`
`trilhas.ts:61-77` usa `localStorage("aura.trilhas")` e **não limpa** em `SIGNED_OUT` (o root limpa só o `QueryClient`: `__root.tsx:127-128`). Em dispositivo compartilhado, a próxima conta herda as trilhas escolhidas pela anterior.

**H7 — 🟢 Positivo: exportação de tatuagem tem confirmação explícita e exclui dados privados.** `[CONFIRMADO]`
`TattooPlanView.tsx:30`: checkbox "Confirmo a exportação… Fotos, notas privadas e informações de saúde não serão incluídas" antes de habilitar "Baixar/Imprimir"; `export.tsx:19-20,38` exclui `tattoo_plan` do download em lote e exige revisão individual. Jornada também exige confirmação (`JourneyWorkspace.tsx:165`).

**H8 — 🟡 Não existem páginas de Política de Privacidade / Termos de Uso.** `[CONFIRMADO]` (grep `Política de Privacidade|Termos de Uso|LGPD|privacidade` em `src/**/*.tsx` → só títulos/`modelo.tsx:134`). O consentimento (`consent.tsx:35-47`) não linka documento legal — a base LGPD fica implícita no onboarding.

---

### I. Textos (idioma, placeholders internos, TODOs, truncamento)

**I1 — 🔴 Placeholder interno visível ao usuário, inclusive na landing pública.** `[CONFIRMADO]`
`("[FORA DO ESCOPO DOS CONECTORES LOVABLE]")` aparece em:
- `src/routes/index.tsx:65` — **landing pública**, no rodapé da seção de princípios;
- `src/routes/_authenticated/maquiagem/route.tsx:26`, `cabelo/route.tsx:23`, `roupas/route.tsx:26` — rodapé de todo módulo;
- `src/routes/_authenticated/admin.tsx:23,25` — painel admin.
*Impacto:* primeira impressão de protótipo inacabado/linguagem de fornecedor na vitrine do produto.

**I2 — 🟠 Inglês vazando para a UI.** `[CONFIRMADO]`
`modelo.tsx:134` ("Revoke" no meio do texto em PT-BR); `error-page.ts:3,6,21-25` (página 500); `dialog.tsx:49` e `sheet.tsx:66` (`sr-only "Close"`); `carousel.tsx:226` ("Next slide"); `pagination.tsx:72` ("Next"); OAuth em `auth.tsx:67,71` exibe `error.message` cru (o tradutor `ERROS_PT`/`traduzErro` em `auth.tsx:11-19` só cobre o formulário e-mail/senha); erros do middleware em `auth-middleware.ts` (B4).

**I3 — 🟠 URL de deploy interna em página pública.** `[CONFIRMADO]` `p.$slug.tsx:83`: "Perfil mantido pela própria profissional no Aura ID · **aura-webapp-dusky.vercel.app**" — domínio hardcoded (pode estar obsoleto/divergente do domínio real).

**I4 — 🟡 Erro de concordância visível.** `[CONFIRMADO]` `retrato.tsx:117`: `toast.info('A verificação reprovar a edição — gerando novamente…')` → "reprovou".

**I5 — 🟡 Copy "produto inacabado" repetitiva (mas honesta).** `[CONFIRMADO]`
12+ ocorrências de "ainda não conectado/em breve/depois": `export.tsx:40`, `cabelo/alertas.tsx:34`, `settings.tsx:110`, `maquiagem/manual.tsx:36`, `catalogManager:31`, `cabelo/plano.$id.tsx:108`, `ReferenceImage.tsx:286`, `profissionais.tsx:292`. Funciona como aviso, mas em landing/módulos pode reforçar impressão de MVP (ver I1).

**I6 — 🟡 Comentário de placeholder de asset dentro do JSX do hero.** `[CONFIRMADO]` `index.tsx:44-45`: comentário "Hero em CSS até existir src/assets/hero.jpg … (binário não veio no export do Lovable)" — não é exibido, mas confirma que a imagem principal é um placeholder de gradiente. Não há `TODO`/`FIXME` em `src` (grep = 0) — bom.

**I7 — 🟡 Mensagens de erro genéricas/"Erro." perdem contexto.** `[CONFIRMADO]` `ParceirosManager.tsx:201,217` e `profissionais.tsx:317` usam `e.message` ou `'Erro.'`; `settings.tsx:64-65` "Não foi possível excluir." sem dizer o quê; `dashboard.tsx:38` manda recarregar sem tentar de novo.

**I8 — 🟡 Truncamento/formatação de números monetários sem `Intl`.** `[CONFIRMADO]` `ReferenceImage.tsx:297,309`: `R$ ${p.preco.toFixed(2).replace('.', ',')}` — sem separador de milhar (R$ 1899,90) e formatação manual duplicada; preço do Pass é string hardcoded em dois lugares (`stripe.functions.ts:16` e `guia.tsx:36`), risco de divergência.

**I9 — 🟢 Idioma e datas consistentes.** `[CONFIRMADO]` `html lang="pt-BR"` (`__root.tsx:108`), datas `toLocaleDateString('pt-BR')` (`modelo.tsx`, Journey etc.), copy pt-BR em todo o app fora dos pontos I2.

---

## 4. Mapa completo das ações destrutivas (38 fluxos)

Legenda: **Confirmação** = AlertDialog do projeto (`Confirm`), nativo (`window.confirm`) ou ❌ nenhuma. **Aviso irreversível** = o texto diz explicitamente que não pode ser desfeito. **Feedback** = confirma sucesso/erro ao usuário.

| # | Ação | Evidência (arquivo:linha) | Confirmação | Aviso irreversível | Feedback | Reversível? |
|---|---|---|---|---|---|---|
| 1 | Excluir conta | `settings.tsx:122` → `:71-76`; `aura.functions.ts:152-169` | `Confirm` sim | **Sim** ("não pode ser desfeito") | ❌ nenhum sucesso; erro em toast | ❌ |
| 2 | Excluir todas as fotos | `settings.tsx:116` → `:55-69` | `Confirm` sim | "permanente" | ✅ "Excluído" / erro toast | ❌ |
| 3 | Excluir todas as sugestões | `settings.tsx:117` → `:55-69` | `Confirm` sim | "serão removidos" (sem "irreversível") | ✅ / erro | ❌ |
| 4 | Remover lembrete | `settings.tsx:106` | ❌ | ❌ | ❌ (só invalida) | ❌ |
| 5 | Excluir modelo pessoal | `modelo.tsx:153` → `:80-85` | ❌ | ❌ | ✅ toast (mesmo se falhar) | ❌ |
| 6 | Desligar consentimento → apaga modelo | `modelo.tsx:136-139` | ❌ | ❌ | só toast de erro | ❌ |
| 7 | Descartar fotos-fonte | `modelo.tsx:176` → `:74-78` | ❌ | ❌ | ❌ | ❌ |
| 8 | Excluir foto do Retrato | `retrato.tsx:155` → `:59-63` | ❌ | ❌ | ❌ | ❌ |
| 9 | Excluir referência gerada (ícone) | `ReferenceImage.tsx:239` → `:117-122` | ❌ | ❌ | só erro | ❌ |
| 10 | **Sobrescrever** referência ao gerar de novo | `ReferenceImage.tsx:169` | ❌ automático | ❌ | ❌ | ❌ |
| 11 | Excluir foto (PhotoUploader) | `PhotoUploader.tsx:60` → `:35-40` | ❌ (e invisível no toque, F4) | ❌ | ❌ | ❌ |
| 12 | Excluir coleção | `collections.tsx:48` → `:35` | ❌ | ❌ | ❌ (erro não checado) | ❌ |
| 13 | Excluir kit de confiança | `maquiagem/kits.tsx:48` → `:36` | ❌ | ❌ | ❌ | ❌ |
| 14 | Remover alerta capilar | `cabelo/alertas.tsx:30` | ❌ | ❌ | ✅ sucesso (erro não checado) | ❌ |
| 15 | Excluir perfil capilar | `cabelo/perfil.tsx:67` | `Confirm` sim | "serão apagados" | ✅/erro toast | ❌ |
| 16 | Excluir plano capilar | `cabelo/plano.$id.tsx:66` | `Confirm` sim | "serão apagados" | ✅/erro | ❌ |
| 17 | Excluir plano da Jornada | `JourneyWorkspace.tsx:35` | `Confirm` sim | **Sim** | ✅/erro | ❌ |
| 18 | Excluir foto da Jornada | `JourneyWorkspace.tsx:132` | ❌ | ❌ | só erro | ❌ |
| 19 | Excluir reflexão (nota íntima) | `JourneyWorkspace.tsx:134` | ❌ | ❌ | só erro | ❌ |
| 20 | Remover passo de plano (rascunho) | `JourneyWorkspace.tsx:58` | ❌ | ❌ | n/a (não persistido) | ✅ (antes de salvar) |
| 21 | Excluir relatório da Jornada | `JourneyWorkspace.tsx:165` | `Confirm` sim | "será removido" | ✅/erro | ❌ |
| 22 | Excluir projeto de tatuagem | `TattooWorkspace.tsx:22` | `Confirm` sim | **Sim** | ❌ `onYes` sem try/catch | ❌ |
| 23 | Excluir uma foto de tatuagem | `tattoo/TattooPhotos.tsx:19` | ❌ | ❌ | só erro | ❌ |
| 24 | Excluir todas as fotos de tatuagem | `tattoo/TattooPhotos.tsx:19` (fim) | `Confirm` sim | "Remove todas" | ❌ | ❌ |
| 25 | Excluir observação do diário | `tattoo/TattooPlanView.tsx:41` | ❌ | ❌ | só erro | ❌ |
| 26 | Excluir peça do armário | `roupas/armario.tsx:89` | `Confirm` sim | "serão apagadas" | ✅/erro | ❌ |
| 27 | Excluir look | `roupas/look.$id.tsx:60` → `:49` | `Confirm` sim | "será apagado" | ❌ (erro não checado) | ❌ |
| 28 | Excluir dados de alergia | `maquiagem/perfil.tsx:65` | `Confirm` sim | "serão apagados" | ✅/erro | ❌ |
| 29 | Redefinir DNA Visual | `dna/redefinir.tsx:50` → `:26-29` | `Confirm` sim | "Apaga… continuam" | ✅ "Feito" | ❌ |
| 30 | Excluir sinais do DNA | `dna/redefinir.tsx:51` | `Confirm` sim | "Remove todos" | ✅ | ❌ |
| 31 | Excluir histórico de versões | `dna/redefinir.tsx:52` | `Confirm` sim | "serão apagadas" | ✅ | ❌ |
| 32 | Excluir correções | `dna/redefinir.tsx:53` | `Confirm` sim | ❌ implícito | ✅ | ❌ |
| 33 | Excluir preferências | `dna/redefinir.tsx:54` | `Confirm` sim | "serão apagados" | ✅ | ❌ |
| 34 | Excluir loja parceira (admin) | `ParceirosManager.tsx:201` | `window.confirm` | ❌ | ✅/erro | ❌ |
| 35 | Excluir peça de loja (admin) | `ParceirosManager.tsx:217` | `window.confirm` | ❌ | ✅/erro | ❌ |
| 36 | Excluir design da vitrine | `profissionais.tsx:317` | `window.confirm` | ❌ | ✅/erro | ❌ |
| 37 | Excluir jornada estética completa | `JornadaEstetica.tsx:113` | `window.confirm` | ❌ | ✅/erro | ❌ |
| 38 | Remover chip de preferência (lista) | `dna/preferencias.tsx:40` | ❌ | n/a | n/a (estado local) | ✅ (antes de salvar) |

**Totais:** 17 com `Confirm` · 4 com `window.confirm` · 16 sem confirmação · 1 sobrescrita automática. **0 com undo.**

---

## 5. Lista final priorizada

> **Como ler:** "Verificação" é o teste de aceite sugerido ao Lead (manual/DevTools), e "causa provável" orienta a correção sem prescrever implementação.

### 🔴 Crítico (6)

| ID | Problema | Evidência | Impacto | Causa provável | Indicador de verificação |
|---|---|---|---|---|---|
| **C1** | Exclusão de conta promete apagar tudo, mas fotos de Estética/Retrato/Modelo continuam no Storage; fluxo não tem estado/feedback de sucesso | `settings.tsx:71-76,121`; `estetica.tsx:49-53`; `retrato.tsx:51-55`; `modelo.tsx:64-71,98-99`; `aura.functions.ts:157-169` | Dado pessoal permanece após exclusão (LGPD); usuário não confirma que conta foi apagada | `deleteAccount` só varre `photos`/`generated_references`; uploads de estética/retrato/modelo não criam linha em `photos` | Enviar foto em `/estetica` e `/retrato`, excluir conta, listar pasta do `user_id` no bucket `user-photos` — arquivos `estetica-*.png`/`retrato-*.png` permanecem |
| **B2** | Nenhuma chamada de IA/HTTP tem timeout, abort ou "cancelar" | `stream-image.ts:10,30,102`; `ReferenceImage.tsx:163` (signal `undefined`); `ai.server.ts:33`; `uso.functions.ts:35` | Trava indefinida em "Gerando…"; crédito pode ser consumido; única saída é recarregar | `fetch` sem `AbortSignal`/timeout e `AbortController` inexistente (grep 0) | DevTools → Network → "Offline"/bloquear `ai-gateway` e clicar "Gerar": spinner nunca termina e botão não tem cancelar |
| **B1** | Sessão expirada/offline → redirect silencioso para `/auth`, sem explicar nem tentar de novo | `_authenticated/route.tsx:11-12` | Usuário logado é deslogado sem mensagem; pode recriar conta por engano | `beforeLoad` trata qualquer `!data.user` (inclui erro de rede) como "não autenticado" | Com app aberto, limpar token do Supabase em localStorage e navegar: cai em `/auth` sem toast |
| **C2** | "Gerar novamente" apaga silenciosamente a referência anterior | `ReferenceImage.tsx:169` → `:117-122` | Perda de resultado salvo; botão não avisa que substitui | Chamada `remove()` incondicional após sucesso da nova geração | Gerar referência, tocar "Gerar novamente", conferir lista de `generated_references`/Storage: a anterior sumiu sem aviso |
| **A1** | Gate autenticado faz 3 round-trips por navegação, sem cache | `_authenticated/route.tsx:10-19`; `router.tsx:18` (QueryClient sem defaults) | Navegação percebida como lenta mesmo com skeleton; multiplica custo por clique | Gate na rota com `getUser()`+2 queries em série; `staleTime: 0` | DevTools Network: cada clique no menu gera ≥3 requests (auth/user, consents, visual_profiles) antes do fetch da tela |
| **I1** | Placeholder interno "[FORA DO ESCOPO DOS CONECTORES LOVABLE]" visível, inclusive na landing | `index.tsx:65`; `maquiagem/route.tsx:26`; `cabelo/route.tsx:23`; `roupas/route.tsx:26`; `admin.tsx:23,25` | Quebra de confiança na primeira dobra pública; linguagem de fornecedor no produto | Texto de auditoria de conectores deixado no JSX de marketing/rodapés | Abrir `http://localhost:8080/` e inspecionar o rodapé da seção "Nossos princípios" |

### 🟠 Alto (27)

| ID | Problema | Evidência | Impacto | Causa provável | Indicador de verificação |
|---|---|---|---|---|---|
| **A2** | Só 9 rotas pré-carregam dados; resto fetch após mount | `jornada/*` (loader), `tatuagem/route.tsx:4` × `dashboard.tsx:28`, `cabelo/index.tsx:22` | Cascata gate→skeleton→conteúdo a cada navegação | Falta `loader` + `ensureQueryData` na maioria das rotas | Network: `/dashboard` só começa o fetch de `packages` após JS montar |
| **A3** | Operações longas sem progresso (exportAll, wipe, exclusões) | `dna/redefinir.tsx:31-37`; `settings.tsx:55-76` | Duplo clique multiplica requisições; usuário não sabe se travou | Ausência de `busy`/progresso em handlers administrativos | Clicar 2× rápido em "Baixar (JSON)" e contar requests no Network |
| **A4** | Logout/exclusão sem estado visual nem confirmação de sucesso | `route.tsx:63`; `settings.tsx:71-76` | Ambiguidade se a ação aconteceu; duplo clique | `onClick` assíncrono sem `busy`/feedback | Clicar "Sair" com throttling e observar ausência de spinner/toast |
| **A5** | App autenticado é client-only, sem shell de loading no primeiro paint | `_authenticated/route.tsx:9`; `router.tsx:6-15,26` | Tela branca em rede lenta até hidratar | `ssr:false` + pending só após 300 ms de navegação | Slow 4G + abrir `/studio` direto; observar primeiro paint antes do spinner |
| **B3** | Falha de rede em quota/assinatura mostra dado otimista errado | `QuotaChip.tsx:15-20`; `aura-pass.tsx:19-22` | Assinante vê CTA de compra; cota esgotada aparece como "restam 5" | `catch` define estado "vazio/não assinante" em vez de erro | Bloquear `ai-gateway`/`stripe` no Network e abrir `/retrato`/`/aura-pass` |
| **B4** | Erros técnicos em inglês viram toast | `auth-middleware.ts:45-96`; `ParceirosManager.tsx:201,217`; `settings.tsx:73` + `aura.functions.ts:167` | Usuário recebe texto em inglês/técnico, sem ação clara | UI faz `toast.error(e.message)` de erros de servidor não traduzidos | Forçar 401 (token inválido) e executar ação que use server fn |
| **B5** | Página de erro 500 em inglês (`lang="en"`) | `error-page.ts:3,6,21-25`; `server.ts:32,55` | Pior momento do produto troca de idioma e de tom | Página de fallback nunca foi localizada | Forçar 500 SSR (ex.: renomear env no dev) e recarregar |
| **B6** | Telas de erro sem retry/offline explícito | `dashboard.tsx:38`; `admin.tsx:37`; `FeedbackAdmin.tsx:23`; grep `navigator.onLine` = 0 | Usuário precisa recarregar manualmente; perde contexto | Tratamento de erro por tela sem ação de recuperação | Desligar rede com `/dashboard` aberto e tentar novamente sem reload |
| **C3** | 16 exclusões sem confirmação (lista em §4) | ver §4 linhas 4-7, 9, 11-14, 18-20, 23, 25, 38 | Perda de dado pessoal por toque acidental | Componente `Confirm` não padronizado | Em `/modelo`, tocar "Excluir modelo" (1 toque apaga) |
| **C4** | Exclusões ignoram erro/feedback | `collections.tsx:35`; `kits.tsx:36`; `alertas.tsx:30`; `look.$id.tsx:49`; `modelo.tsx:80-85` | Usuário acha que apagou; dado pode permanecer | `error` do Supabase não verificado; toast incondicional | Simular falha de rede ao excluir coleção e conferir item de volta sem mensagem |
| **C5** | Aviso de irreversibilidade em só 3 de 38 fluxos | `settings.tsx:122`; `JourneyWorkspace.tsx:35`; `TattooWorkspace.tsx:22` | Usuário não sabe que não há recuperação | Copy padrão dos `Confirm` é fraca | Abrir cada `Confirm` e ler a descrição |
| **D2** | Sem idempotência no servidor; 2 abas/refresh podem gerar 2× | `references.functions.ts:69-80`; `ReferenceImage.tsx:139-140` | Cobrança dupla de créditos de IA | Chave de idempotência/schema de status não usada no servidor | Abrir 2 abas, gerar a mesma referência simultaneamente e comparar `ai_runs` |
| **D3** | Retry automático de verificação consome 2 execuções por clique | `ReferenceImage.tsx:129-133`; `retrato.tsx:115-119`; `estetica.tsx:70-91` | Custo dobrado (informado por toast, mas não consentido) | Recuperação de qualidade implementada como nova geração | Provocar reprovação (pedido ambíguo) e contar `ai_runs`/créditos |
| **D4** | Gravações sem `busy` (consentimento, perfil onboarding, export, deletes) | `settings.tsx:40-76`; `onboarding.tsx:110-121`; `dna/redefinir.tsx:18-37` | Duplo envio/estado inconsistente | Handlers sem estado de submissão | Duplo clique em "Salvar perfil" no resumo do onboarding e contar upserts/`audit_events` |
| **E1** | Switches sem nome acessível; cartão inteiro toggla consentimento | `CatalogManager.tsx:48-49`; `settings.tsx:88,92`; `consent.tsx:38-41`; `dna/permissoes.tsx:16-19`; `modelo.tsx:131-140` | Mudança acidental de consentimento (LGPD); leitor de tela confuso | `<label>` envolvendo o cartão + falta de `aria-label` | Clicar no texto do cartão de consentimento e ver o switch mudar |
| **E2** | Modal de Trilhas sem role/foco/Esc | `TrilhaPicker.tsx:20-24,36-50` | Armadilha de teclado/leitor de tela já no primeiro acesso | Modal custom sem Radix/sem gestão de foco | Abrir com Tab e Esc; foco não entra/sai e Esc não fecha |
| **E3** | `Label` sem `htmlFor` e inputs sem `id` | `studio.tsx:80-82`; `onboarding.tsx:199,203-206` | Campos sem nome para leitor de tela | Labels decorativos | axe/Lighthouse em `/studio` e `/onboarding` |
| **E4** | `Slider` sem rótulo/valor | `studio.tsx:81`; `onboarding.tsx:206` | Leitor de tela não sabe o que o slider controla | Falta `aria-label`/`aria-valuetext` | Navegar por teclado/leitor até o slider |
| **E5** | Contraste accent 3,02:1 e branco-sobre-accent 3,06:1 (falha AA) | `styles.css:66-67`; usos: `index.tsx:34`, `ReferenceImage.tsx:298`, `onboarding.tsx:169`, `cabelo/gerar.tsx:63` | Texto/CTA ilegível para baixa visão e em sol | Token de accent claro demais para texto | axe DevTools nos CTAs `variant="accent"` e links `text-accent` |
| **F1** | Header sem colapso mobile; 10+ itens em `overflow-x-auto` | `_authenticated/route.tsx:47-63` | Itens "Trilhas/Sair" fora da tela em 360 px; navegação escondida | Falta menu mobile/hambúrguer | Emular iPhone SE (375×667) em `/studio` e checar o header |
| **F2** | `useIsMobile` só usado por componente morto | `use-mobile.tsx:5`; `ui/sidebar.tsx:69`; imports de `ui/sidebar` = 0 | Nenhuma adaptação mobile real | Hook criado e não integrado | grep de imports e inspeção do mobile |
| **F3** | Alvos de toque 32–36 px | `button.tsx:22-25` usados em `route.tsx:56-63`, `Confirm.tsx:7`, ações de linha | Toque impreciso em ações pequenas (inclusive destrutivas) | Variantes `sm`/`icon` pequenas | Medir retângulo do botão no DevTools |
| **F4** | Excluir foto só no hover | `PhotoUploader.tsx:58-60` | Impossível excluir no celular; sem confirmação | Controle `opacity-0 group-hover` | Emular touch (sem hover) e tentar excluir foto |
| **H3** | "Pode mandar anônimo" mas envia `user_id` quando logado | `FeedbackButton.tsx:80`; `feedback.functions.ts:30-43`; `FeedbackAdmin.tsx:34` | Expectativa de anonimato violada | Texto não diferencia logado/deslogado | Enviar feedback logado e ver "· logado" no admin |
| **H5** | Briefing compartilha foto por URL assinada de 30 dias e envia CEP a terceiro | `EnviarBriefing.tsx:33,49-52`; `p.$slug.tsx:80` | Exposição prolongada de imagem; transferência a terceiro sem aviso | `createSignedUrl(…, 30 dias)` + BrasilAPI sem disclosure | Inspecionar request de busca de profissional e a validade da URL |
| **I2** | Inglês vazando (página 500, "Close"/"Next", "Revoke", erros OAuth) | `error-page.ts:3,6,21-25`; `dialog.tsx:49`; `sheet.tsx:66`; `carousel.tsx:226`; `pagination.tsx:72`; `modelo.tsx:134`; `auth.tsx:67,71` | Inconsistência de idioma em pontos críticos | Strings de biblioteca/erros externos não traduzidos | Abrir um Dialog com leitor de tela e forçar erro de login social |
| **I3** | URL de deploy interna em página pública | `p.$slug.tsx:83` | Exposição de infraestrutura/URL possivelmente obsoleta | Hardcode de ambiente de deploy | Abrir `/p/<slug>` e ler o rodapé |

### 🟡 Médio (32)

| ID | Problema | Evidência | Impacto | Causa provável | Indicador de verificação |
|---|---|---|---|---|---|
| **A6** | Estados de carregamento heterogêneos | `admin.tsx:36`; `retrato.tsx:122`; `ParceirosManager.tsx:190`; `FeedbackAdmin.tsx:22`; `estetica.tsx:126` | Sensação de inacabado; salto de layout | Skeleton não padronizado | Navegar com throttling nas telas citadas |
| **A7** | Upload de foto sem indicador | `estetica.tsx:45-54`; `retrato.tsx:45-57`; `modelo.tsx:59-72`; `PhotoUploader.tsx:23-34` | Clique "morto" em rede lenta | Falta `busy`/`role="status"` | Slow 3G + enviar foto |
| **A8** | Trilhas reaparece a cada reload + botão flutuante sobre CTAs | `route.tsx:31-40`; `TrilhaPicker.tsx:55`; `FeedbackButton.tsx:45` | Onboarding em loop; CTA coberto | "Agora não" não persiste; widget `fixed` sem safe-area | Recarregar `/studio` sem trilhas salvas; rolar formulário até o fim |
| **B7** | Erro de rede vira "perfil não encontrado" | `p.$slug.tsx:36-47` | Diagnóstico errado para o usuário/profissional | `catch` genérico | Abrir `/p/<slug>` offline |
| **B8** | Sem Suspense/error boundary próprios em rotas com `useSuspenseQuery` | `JourneyWorkspace.tsx:16`; `TattooWorkspace.tsx:15`; `__root.tsx:103` | Erro derruba para tela genérica | Boundary só no root | Forçar erro em `/jornada` |
| **B9** | Erro cru da IA exibido sem tratamento | `ReferenceImage.tsx:242`; `stream-image.ts:34,94` | JSON/texto de proxy pode aparecer em inglês | `res.text()` repassado à UI | Forçar 502 no gateway |
| **B10** | Export de dados engole falhas parciais | `dna/redefinir.tsx:31-37` | JSON incompleto apresentado como completo | Erros de query ignorados | Bloquear uma tabela e exportar |
| **C6** | `window.confirm` nativo em 4 pontos | `ParceirosManager.tsx:201,217`; `profissionais.tsx:317`; `JornadaEstetica.tsx:113` | Inconsistência visual/idioma; sem design de irreversibilidade | Uso de API nativa em vez de `Confirm` | Abrir ação de excluir loja no admin mobile |
| **C7** | Sem undo/soft-delete | grep `deleted_at` = 0 | Toda exclusão é definitiva | Modelo de dados hard delete | n/a (arquitetural) |
| **C8** | Sobrescritas de Storage sem aviso e `contentType` trocado | `modelo.tsx:98-99`; `ReferenceImage.tsx:167` | Base anterior trocada sem informar | `upsert: true` / novo arquivo | Regenerar modelo e comparar arquivo base |
| **D5** | `Confirm` não espera promise/bloqueia trigger | `Confirm.tsx:10` | Repetição do comando; erro só em toast | Componente sem estado `pending` | Clicar "Excluir" 2× rápido |
| **E6** | Botões só-ícone dependem de `title` | `JornadaEstetica.tsx:113`; `ParceirosManager.tsx:201,217`; `profissionais.tsx:317` | Nome acessível frágil em toque/leitor de tela | Falta `aria-label` | Inspecionar árvore de acessibilidade |
| **E7** | Foco visível fraco/ausente | `button.tsx:8`; `route.tsx:51`; `dashboard.tsx:79`; `onboarding.tsx:210,221,229-231` | Navegação por teclado sem indicador | Classes `focus-visible` ausentes | Tab pela tela com teclado |
| **E8** | Dialogs sem descrição; sr-only em inglês | `FeedbackButton.tsx:50-51`; `ReferenceImage.tsx:329`; `profissionais.tsx:355-358`; `dialog.tsx:49` | Aviso Radix no console; SR sem contexto | `DialogDescription` não usado | Console do navegador (warning do Radix) |
| **E9** | Padrões ARIA incompletos (tabs/filtros) | `onboarding.tsx:141-144`; `dashboard.tsx:79`; `studio.tsx:59,68` | Estado de seleção não anunciado | `aria-pressed`/`aria-controls` ausentes | axe em `/dashboard` e `/onboarding` |
| **E11** | `lang` errado na página de erro | `error-page.ts:3` × `__root.tsx:108` | Pronúncia errada do SR no erro | Fallback não localizado | Inspecionar HTML do 500 |
| **F5** | Títulos `text-5xl` fixos + `nowrap` | `settings.tsx:80`; `estetica.tsx:121`; `modelo.tsx:122`; `button.tsx:8` | Risco de overflow em 320 px | Tipografia sem breakpoint | Emular 320 px nas telas citadas |
| **F6** | Grades de foto fixas em 4 colunas | `PhotoUploader.tsx:56`; `modelo.tsx:166`; `JourneyWorkspace.tsx:132` | Thumbs pequenos/difíceis de tocar | `grid-cols-4` sem `sm:` | Emular 360 px e tentar excluir foto |
| **F7** | Tabela admin pode estourar | `CatalogManager.tsx:41-53` | Leitura difícil no mobile | Sem `min-w`/scroll horizontal explícito | Emular 360 px em `/admin` |
| **F8** | Flutuante sem safe-area | `FeedbackButton.tsx:45` | Sobreposição em iPhone/gestos | `bottom-4` fixo | iPhone com notch no DevTools |
| **G1** | Sem busca interna | `ui/command.tsx` (não importado) | Navegação/descoberta limitada com 43 queries | Command palette não integrada | grep de imports; não há campo de busca |
| **G2** | Sem atalhos de teclado | `ui/sidebar.tsx:96-106` (morto); grep hotkeys = 0 | Usuário avançado sem produtividade | Atalhos nunca implementados | Pressionar "?" ou Ctrl+K |
| **G4** | "Agora não" não persiste | `route.tsx:35`; `trilhas.ts:63-81` | Modal bloqueante recorrente | Só a escolha é salva | Recarregar 2× sem escolher trilha |
| **G5** | Sem página de suporte/status/FAQ | ausência (grep) | Usuário sem canal claro de ajuda | Ajuda só contextual + widget | Não há rota de ajuda além de `/guia` |
| **H4** | Notas sensíveis em claro, sem modo privado | `JourneyWorkspace.tsx:134`; `TattooPlanView.tsx:41` | Risco de privacidade social (tela compartilhada) | UI sem ocultação opcional | Abrir diário/reflexões e observar conteúdo aberto |
| **H6** | Preferências de trilha vazam entre contas no mesmo aparelho | `trilhas.ts:61-77`; `__root.tsx:127-128` | Herança de preferência de outra pessoa | `localStorage` não limpo no logout | Logar A, escolher trilha, sair, logar B |
| **H8** | Sem Política de Privacidade/Termos | grep = 0; `consent.tsx:35-47` | Transparência LGPD incompleta | Documento nunca criado/linkado | Procurar links legais no app |
| **I4** | Erro de concordância visível | `retrato.tsx:117` | Percepção de descuido | Typo | Acionar o retry do Retrato |
| **I5** | Copy "ainda não conectado/em breve" repetitiva | `export.tsx:40`; `settings.tsx:110`; `cabelo/alertas.tsx:34`; `maquiagem/manual.tsx:36`; `CatalogManager.tsx:31` | Impressão de MVP em pontos de conversão | Transparência de roadmap no lugar de UX de indisponível | Ler rodapés dos módulos/landing |
| **I6** | Comentário/placeholder de asset no hero | `index.tsx:44-45` | Imagem principal é gradiente (visual inferior ao resto) | Asset binário ausente no export | Abrir `/` |
| **I7** | Erros genéricos/"Erro." | `ParceirosManager.tsx:201,217`; `profissionais.tsx:317`; `settings.tsx:64-65`; `dashboard.tsx:38` | Sem orientação de recuperação | Fallback genérico | Testar ação com falha de rede |
| **I8** | Formatação monetária manual sem `Intl`; preço duplicado | `ReferenceImage.tsx:297,309`; `stripe.functions.ts:16`; `guia.tsx:36` | Valores como "R$ 1899,90"; risco de divergência de preço | `toFixed/replace` ad hoc | Ver card de peça e `/guia` |

### 🟢 Aceitável / pontos fortes (4)

| ID | Ponto forte | Evidência |
|---|---|---|
| **D1** | Gerações bloqueiam duplo clique no cliente (ref + `disabled`) | `studio.tsx:94`; `cabelo/gerar.tsx:63`; `roupas/gerar.tsx:50`; `maquiagem/gerar.tsx:87`; `modelo.tsx:175`; `retrato.tsx:176`; `estetica.tsx:165,182,183`; `ReferenceImage.tsx:125,237` |
| **E10** | Imagens com `alt`, hero com `role="img"`, ícones decorativos `aria-hidden` | 26 `<img>` verificadas; `index.tsx:46`; `onboarding.tsx:242` |
| **G3** | Onboarding/ajuda contextual existente (`/guia`, HelpChat, TrilhaPicker, dicas nos geradores) | `guia.tsx:9-66`; `HelpChat.tsx:19,41-64`; `dashboard.tsx:40-51`; `studio.tsx:89` |
| **H7** | Exportação de tatuagem com confirmação por briefing e exclusão de dados privados; jornada idem | `TattooPlanView.tsx:30`; `export.tsx:19-20,38`; `JourneyWorkspace.tsx:165` |

**Contagem final: 6 🔴 · 27 🟠 · 32 🟡 · 4 🟢 = 69 achados** (69 únicos; C1/H1 e E1/H2 são o mesmo problema citado em duas dimensões e contam uma vez).

---

## 6. Ordem de correção sugerida (só para priorização)

1. **Fechar exposição de dados:** C1 (exclusão de conta completa + `busy`/confirmação), H5 (prazo do link de foto), I1 (remover placeholder da landing).
2. **Parar travas e perda silenciosa:** B2 (timeout/abort/cancelar em IA), C2 (não sobrescrever sem confirmar), C3 (adicionar `Confirm` nos 16), C4 (checar `error` e dar feedback).
3. **Fluxo de sessão/erro:** B1 (mensagem de sessão expirada + retry), B3 (não mascarar falha de quota/pass), B4/B5/I2 (traduzir erros e página 500).
4. **Fluidez:** A1/A2 (cache de sessão + loaders), A3/A4 (busy nas operações longas), A5 (shell de loading).
5. **Acessibilidade:** E1–E5 (nomes, modal Radix, `htmlFor`, `aria-label` em sliders, contraste do accent), E6–E9.
6. **Mobile:** F1–F4 (menu mobile, alvos ≥44 px, excluir sem hover, remover `useIsMobile` morto).
7. **Polimento:** G1/G2/G4, I3–I8, H6/H8.

---

## 7. O que não foi verificado (limitações explícitas)

- **Runtime/visual:** nenhuma tela foi aberta em navegador; contraste foi calculado a partir dos tokens (`styles.css`), não medido em pixel renderizado. Itens de comportamento (`label` clicável, foco do modal, hover de toque) foram deduzidos do código e marcados com o teste de verificação.
- **Backend/RLS/Edge Functions:** fora do escopo desta tarefa (coberto por `01-backend.md`); este relatório só toca backend quando reflete erro visível ao usuário.
- **Responsividade real em dispositivos:** inferida por classes Tailwind/breakpoints; não houve emulação de dispositivo.
- **Testes de carga/memória:** não executados.
- **Acessibilidade automatizada (axe/Lighthouse):** não executada (exigiria navegador); as recomendações de verificação indicam onde rodar.
- **Build em CI limpo:** o build usou `node_modules` e caches locais (`node_modules/.nitro`, `.output`); tempos podem variar em CI.

---

## 8. Anexos

### 8.1 Artefatos gerados por esta auditoria
- Este arquivo: `webapp-lovable/auditoria/06-qualidade-tecnica-e-ux.md` (único arquivo criado).
- Nenhum arquivo de `src/` foi tocado; `.output/`, `.wrangler/`, `node_modules/.nitro/` foram regravados pelo build e são gitignored.

### 8.2 Arquivos-chave citados
`src/router.tsx` · `src/routes/__root.tsx` · `src/routes/_authenticated/route.tsx` · `src/lib/error-page.ts` · `src/server.ts` · `src/lib/stream-image.ts` · `src/lib/ai.server.ts` · `src/integrations/supabase/auth-middleware.ts` · `src/integrations/supabase/client.ts` · `src/components/ReferenceImage.tsx` · `src/components/Confirm.tsx` · `src/components/FeedbackButton.tsx` · `src/components/PhotoUploader.tsx` · `src/components/TrilhaPicker.tsx` · `src/components/QuotaChip.tsx` · `src/components/EnviarBriefing.tsx` · `src/routes/_authenticated/{settings,modelo,retrato,estetica,studio,dashboard,onboarding,export,admin,aura-pass,guia}.tsx` · `src/routes/index.tsx` · `src/routes/p.$slug.tsx` · `src/routes/auth.tsx` · `src/lib/trilhas.ts` · `src/lib/aura.functions.ts` · `src/lib/references.functions.ts` · `src/lib/uso.functions.ts` · `src/lib/feedback.functions.ts` · `src/components/ui/{button,dialog,sonner,switch}.tsx` · `src/styles.css` · `src/hooks/use-mobile.tsx`.

### 8.3 Como reproduzir os comandos
```powershell
cd "C:\Users\Felip\Desktop\APP Mobile AURA ID\webapp-lovable"
npx tsc --noEmit          # exit 0
npx vitest run            # 6 arquivos, 33 testes, exit 0
npx eslint .              # exit 1 — 5059 problemas (5035 erros, 24 avisos)
npm run build             # exit 0 — ~49 s
```

### 8.4 Cálculo de contraste (método)
Tokens OKLCH (`styles.css:52-93`) convertidos para sRGB (fórmula OKLab→linear sRGB→gamma) e luminância relativa WCAG 2.x; razão = `(L1+0.05)/(L2+0.05)`. Resultados principais: `accent/background` **3,02:1**; `accent/card` **3,15:1**; `accent-foreground/accent` **3,06:1**; `foreground/background` 14,29:1; `muted-foreground/card` 5,92:1; `primary-foreground/primary` 11,58:1. Limiares AA: 4,5:1 (texto normal) e 3:1 (texto grande/UI).
