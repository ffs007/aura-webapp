# 🐞 Correções do teste como usuário real — 10/11/2026

**Relato:** duas falhas no uso real do app — (1) a tatuagem gerada saiu **escrita** e no **braço** em vez do antebraço pedido; (2) Retrato e Meu Modelo continuavam pedindo consentimento mesmo com as permissões **ligadas** em Configurações. Depois, varredura dos demais módulos (inclusive Guarda-roupa) no mesmo molde de usuário real.

**Resultado:** as duas causas-raiz foram encontradas e corrigidas; os módulos foram varridos em navegador real (51 rotas) sem erro de console; 49 controles de formulário ganharam nome acessível. Validação final: `tsc` 0, **77 testes**, build ok, varredura **15/15**.

---

## 1. Tatuagem saiu escrita e na região errada

### 1.1 Evidência

A imagem baixada do relato do usuário mostra uma pessoa com a palavra **“PRÉVIA”** tatuada no braço. O prompt antigo de tatuagem começava com:

> `"Fotografia realista de PRÉVIA de tatuagem aplicada em ..."` — `src/lib/tattoo-brief.ts` (antes da correção)

O modelo de imagem interpretou a palavra **PRÉVIA** como parte do desenho e a tatuou. O local também não era fixado o suficiente: o prompt pedia enquadramento fechado, mas não proibia deslocar para a região vizinha — e a própria verificação automática registrou *“Tatuagem não está no antebraço, mas sim no braço”*.

### 1.2 Cadeia de causas

| # | Causa | Efeito |
|---|---|---|
| 1 | Palavra “PRÉVIA” em caixa alta no meio da descrição da tatuagem | virou texto tatuado na imagem |
| 2 | Prompt não dizia “não mostrar o corpo inteiro” nem “não deslocar para região vizinha (antebraço ≠ braço)” | tatuagem no braço |
| 3 | Verificação só checava texto (quando lettering), local/lado e artefatos — **não** checava texto inesperado | imagem com “PRÉVIA” não foi reprovada por esse motivo |
| 4 | Segunda tentativa reusava **exatamente o mesmo prompt** | repetia o mesmo erro |
| 5 | Interpretador podia confundir “desenho de uma linha” com lettering | risco de gerar escrita |
| 6 | Erro do provedor vinha cru (`Provedor de imagem respondeu 403… TOP_UP`) | mensagem técnica vazando |
| 7 | Confirmação só permitia editar texto (lettering) e local | sem controle sobre lado/tamanho/estilo |

### 1.3 Correções aplicadas

- **Prompt de tatuagem reescrito** (`src/lib/tattoo-brief.ts:41-76`):
  - sem a palavra “PRÉVIA”;
  - enquadramento fechado **somente na região citada**, sem corpo/rosto inteiro;
  - proibição explícita de deslocar (“antebraço não é braço; braço não é antebraço; ombro não é braço”);
  - quando não é lettering: “a imagem não contém nenhuma palavra, letra, número, legenda ou assinatura escrita”;
  - local/estilo/elementos editáveis são sanitizados (pontuação/limite) para não virarem instrução.
- **Interpretador** (`src/lib/tattoo.functions.ts`): “linha”, “traço”, “fine line” e “desenho de uma linha” **não** acionam lettering; lettering exige texto explícito.
- **Verificação ampliada** (`src/lib/references.functions.ts`): agora checa texto inesperado (quando não lettering), elementos, estilo, tamanho, local/lado com exemplos de região vizinha e ajuste obrigatório do usuário.
- **Retry com correção**: a segunda tentativa recebe as falhas do verificador no prompt (`correcao`), em vez de repetir o mesmo texto.
- **Confirmação editável** (`ReferenceImage.tsx`): além de local, agora lado, tamanho e estilo.
- **Erro de provedor traduzido** (`src/lib/erros-imagem.ts`): “provedor sem créditos/bloqueado” vira mensagem honesta em PT-BR.
- **Testes novos** (`src/test/tattoo-prompt.test.ts`, 8 testes): ausência de “prévia”, fixação do local, proibição de texto, lettering com texto exato, prévia isolada, tradução do erro TOP_UP.

### 1.4 Validação e limite honesto

- Determinístico: testes passam e o prompt gerado não contém mais a palavra que virou tatuagem.
- **Não foi possível gerar uma nova imagem neste ambiente**: o provedor responde `403 — User is locked. Reason: TOP_UP` (conta do provedor de imagem sem créditos). Ou seja, **a correção do prompt está pronta, mas a prova visual final depende de repor os créditos do provedor**. O erro agora chega traduzido, sem detalhe técnico.

---

## 2. Consentimento ativo não reconhecido em Retrato/Modelo

### 2.1 Causa-raiz

`retrato.tsx`, `modelo.tsx` e `estetica.tsx` liam as permissões assim:

```ts
supabase.from('consents').select('photo_processing,image_generation').maybeSingle()
```

**Sem filtrar por `user_id`.** Para uma conta **admin** — e a conta do relato é admin (o botão “Abrir admin” aparece) — a política de RLS `"admin read consents"` libera a leitura de **todas as linhas** de consentimento, não só a própria. Com mais de uma linha visível, o `.maybeSingle()` falha; o código tratava o erro como “sem dados” e exibia **Fotos ❌ / Imagens de IA ❌**, mesmo com os switches ligados em Configurações.

### 2.2 Correções aplicadas

- `.eq('user_id', ...)` em todas as três leituras, com tratamento explícito de erro.
- Revalidação ao **voltar o foco** para a aba (idas e voltas Configurações → Retrato/Modelo não exigem recarregar).
- Nenhum outro ponto do app lê `consents` sem filtro (varredura confirmou 0).

### 2.3 Validação ao vivo

Na conta de teste (não-admin a leitura já funcionava; a correção é a mesma usada pelos admins):

- Configurações liga os dois switches e grava no banco (`photo_processing=true`, `image_generation=true`).
- **Meu Modelo:** `Fotos ✅`, `Imagens de IA ✅` e switch “Autorizar meu modelo visual” **habilitado e ligado** — evidência em [modelo-consentimento.png](../../.e2e/shots-usuario-real/modelo-consentimento.png).
- **Aura Retrato:** não mostra mais “Permissões necessárias” — evidência em [retrato-consentimento.png](../../.e2e/shots-usuario-real/retrato-consentimento.png).
- **Estética:** reconhece as permissões.
- Voltar de Configurações para o Retrato continua liberado.

---

## 3. Varredura como usuário real (todos os módulos)

Script novo: `.e2e/onda10-usuario-real.mjs` (login real, consentimento, 51 rotas, captura de `pageerror`/`console.error`, textos suspeitos, alertas, screenshots e interações seguras).

| Verificação | Resultado |
|---|---|
| Rotas visitadas (todos os módulos e abas) | **51** |
| Exatamente 1 `h1` por tela | todas |
| `pageerror` / `console.error` | **0** |
| “undefined” / “NaN” / “[object Object]” / erro cru de provedor visível | **0** |
| Alertas de erro sem saída | **0** |
| Guarda-roupa: formulário de peça acessível | ✅ (após correção de labels) |
| Diário da jornada: envio de foto | ✅ |
| Coleções: validação de nome vazio | ✅ (“Dê um nome à coleção.”) |
| Resultado final | **15 PASS · 0 FAIL · 1 INFO** |

Telas fotografadas: `.e2e/shots-usuario-real/` (`ok--dashboard.png`, `ok--jornada.png`, `ok--roupas-armario.png`, `ok--tatuagem-vitrine.png`).

**Achado real da varredura:** o formulário do Guarda-roupa tinha `<Label>` sem `htmlFor` e inputs sem `id`/`aria-label` — leitor de tela não anunciava “Nome/Cor/Tecido”. Corrigido no local e, por auditoria, **49 controles em 19 arquivos** ganharam nome acessível (maquiagem, cabelo, roupas, DNA, configurações, estúdio, profissionais, consentimento, comparar, jornada, parceiros, uploader de fotos).

---

## 4. Outros achados da auditoria de prompts (mesmo padrão do “PRÉVIA”)

Auditoria estática dos fluxos de imagem encontrou o padrão em outros lugares. Situação:

| Achado | Severidade | Status |
|---|---|---|
| Retrato repetia o mesmo prompt no retry | Alta | **Corrigido** — segunda tentativa recebe as falhas do verificador |
| Prompt de look ignorava tom de pele, olhos, cabelo, tamanhos e apresentação | Alta | **Corrigido** — `compileLookPrompt` agora recebe os atributos do perfil |
| Verificação de tatuagem não cobria elementos/estilo/tamanho/ajuste | Alta | **Corrigido** |
| Tokens em caixa alta em prompts (mesma classe do PRÉVIA) em retrato/estética/modelo/looks | Média | **Corrigido** — prompts em frase natural |
| Retrato/Estética/Modelo não validavam consentimento nem URL no servidor | Alta (privacidade) | **Corrigido** — gate de `photo_processing`/`image_generation` + só URL assinada do próprio `user-photos` |
| Vitrine “Copiar pra mim” usa “No text” (pode apagar lettering) e local do design, não do usuário | Alta | **Registrado** — próximo ciclo |
| Catálogo/Profissionais enviam texto livre ao gerador sem sanitização e sem gate de consentimento | Média/Alta | **Registrado** — próximo ciclo |
| Estética e Modelo sem verificação de identidade/texto pós-geração | Alta | **Registrado** — próximo ciclo (depende de créditos de visão) |
| Confirmação de tatuagem não permite editar elementos/restrições da intenção | Média | **Parcial** — lado/tamanho/estilo já editáveis; elementos/restrições ficam para o próximo ciclo |

---

## 5. Validação final

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npx vitest run` | **10 arquivos / 77 testes / 0 falhas** (13 novos: 8 de prompt/erro de imagem + 5 de URL do cofre) |
| `npm run build` | **sucesso** |
| Varredura de usuário real | **15/15 PASS**, 51 rotas, 0 erro de console |

**Arquivos principais alterados:** `src/lib/tattoo-brief.ts`, `tattoo.functions.ts`, `references.functions.ts`, `retrato.functions.ts`, `estetica.functions.ts`, `modelo.functions.ts`, `erros-imagem.ts`, `seguranca-imagem.ts`, `stream-image.ts`, `image-gateway.aura.server.ts`, `components/ReferenceImage.tsx`, `routes/_authenticated/retrato.tsx`, `modelo.tsx`, `estetica.tsx`, `roupas/armario.tsx` + 19 arquivos de acessibilidade, e novos testes.

---

## 6. Próximos passos

1. **Repor os créditos do provedor de imagem** (fal.ai/TOP_UP) e refazer uma geração de tatuagem para ver a prova visual: mesma intenção “linha no antebraço esquerdo” deve sair sem texto e na região certa.
2. Repetir a varredura após o deploy (script `onda10` roda com dev server + Chrome CDP).
3. Decidir sobre os itens “Registrado” da seção 4 (vitrine, catálogo/profissionais, verificação de estética/modelo).
4. Dados de teste: a varredura não criou linhas; só ligou switches de consentimento da conta de teste.
5. Sem commit/push, conforme `AGENTS.md`.
