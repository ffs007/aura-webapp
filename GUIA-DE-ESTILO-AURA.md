# ✍️ Guia de estilo do Aura ID — voz, texto e acessibilidade

**Versão:** 1.0 · **Data:** 10/11/2026 · **Vale para:** todo texto visível do app (`webapp-lovable`), de botões e erros a textos legais.

Este é o documento que responde "como escrevemos?" e "qual é o padrão visual mínimo?". Ele complementa o [glossário](src/lib/glossario.ts) e o [sistema de estados](ETAPA-2-ONDA-1.md).

---

## 1. Princípios de voz

1. **Gentil, não infantil.** Falamos como uma amiga que entende do assunto — sem "queridinha", sem piada em momento de erro.
2. **Direta, sem jargão.** Nada de "conector", "payload", "endpoint", "input". Se o termo não existe na vida da pessoa, não entra na tela.
3. **Honesta.** Nunca prometemos o que a versão não faz. Se algo depende de profissional ou de permissão, dizemos.
4. **Sem culpa.** O erro é do app, não de quem usa: "Não foi possível salvar" — nunca "Você preencheu errado".
5. **Curta.** Uma ideia por frase. Botão com no máximo 3 palavras quando der.

---

## 2. Pessoa e gênero

- Falamos **"você"**, nunca "o usuário", "o cliente" ou "a pessoa" na interface.
- **Neutralidade sempre que possível.** Eliminamos o "(a)" e as barras:
  - ❌ "você mesma(o)" · "segura(o)" · "sozinha(o)" · "pronta(o)" · "Obrigada(o)"
  - ✅ "você" · "com segurança" · "por conta própria" · "concluído" · "Tudo certo"
- Quando a concordância exigir, reescrevemos a frase em vez de usar "x", "@" ou "e".
- Substantivos femininos/masculinos de coisas continuam normais: "a sugestão", "o look", "a coleção".

---

## 3. Palavras canônicas (uma coisa = um nome)

| Conceito | Palavra única | Evitar |
|---|---|---|
| resultado da IA | **Sugestão** | pacote (na interface), convite (salvo no texto poético), recomendação |
| página com as 3 variações | **Sugestão** | pacote |
| pedido enviado a profissional | **Briefing** | orçamento, proposta |
| agrupamento de interesses no menu | **Trilha** | categoria, nicho |
| imagens-base da pessoa | **Meu Modelo** | avatar, persona |
| retoque em uma foto | **Aura Retrato** | editor, retrato IA |
| resumo editável de gosto | **DNA Visual** | perfil de gosto |
| plano de mudança ao longo do tempo | **Jornada** | projeto (só em tatuagem) |
| catálogo de designs de tatuagem | **Vitrine** | galeria, loja |
| agrupamento de sugestões salvas | **Coleção** | pasta, favoritos |
| assinatura | **Aura Pass** | plano premium, PRO |
| estado de uma sugestão | **Salva / Aprovada / Rejeitada** | "saved", "approved" |

Detalhes no [glossário](src/lib/glossario.ts), exibido em `/guia`.

---

## 4. Títulos, botões e capitalização

- **Título de página:** frase curta, sem ponto final, em caixa normal ("Suas sugestões", não "SUAS SUGESTÕES").
- **Subtítulo:** uma frase com ponto final.
- **Botão:** verbo no infinitivo ou imperativo curto — "Salvar", "Gerar looks", "Tentar novamente". Evite "OK" e "Enviar" solto.
- **Rótulo de campo:** o que a pessoa preenche, não o que o sistema quer ("Ocasião ou contexto", não "Input de ocasião").
- **Link:** o texto do link descreve o destino ("Abrir o guia"), nunca "clique aqui".
- **Números:** "1 projeto" / "2 projetos"; "1 versão" / "2 versões". Não use "(s)".
- **Datas:** formato curto brasileiro (`dd/mm, hh:mm`) via `fmtDateTime`; em contexto longo, "10 de novembro".

---

## 5. Erros, vazios e confirmações

| Situação | Fórmula | Exemplo |
|---|---|---|
| Erro de ação | "Não foi possível [ação]. Tente de novo." | "Não foi possível salvar o look. Tente de novo." |
| Erro de conexão | "Parece que a conexão caiu. Verifique sua internet — nada do que você fez foi perdido." | — |
| Consulta falhou | "Não foi possível carregar [coisa]." + botão **Tentar novamente** | `EstadoErro` |
| Nada aqui | Título curto + **o que fazer agora** | "Nenhum look ainda" + "Perfil de pele" + "Gerar looks" |
| Confirmação destrutiva | O que será apagado + o que **não** será | "A coleção será apagada; as sugestões continuam salvas." |
| Sucesso | Curto e específico | "Correção registrada — a IA não repetirá essa inferência." |

Nunca: "Erro!", "Falhou.", "Algo deu errado." sem o próximo passo.

---

## 6. Placeholders e textos de apoio

- Placeholder é **exemplo**, não instrução: "ex.: casamento de amiga, ao ar livre".
- Nunca use placeholder como rótulo (o rótulo some quando a pessoa digita).
- Texto de apoio (hint) começa minúsculo e explica o "porquê", não o "como": "Fotos bem iluminadas, sem filtro".
- Sem texto interno: `TODO`, `FIXME`, nomes de tabela, "lorem ipsum".

---

## 7. Acessibilidade de texto

1. **Tamanho mínimo:** 12 px (`text-xs`) para qualquer texto informativo. Textos legais e críticos **nunca** abaixo disso.
2. **Contraste AA:** texto normal ≥ **4,5:1**; texto grande (≥24 px ou ≥18,66 px em negrito) ≥ **3:1**. O time `--accent` foi escurecido para `oklch(0.52 0.11 40)` justamente para passar.
3. **Cor não é o único sinal:** link dentro de frase é **sublinhado**; estado ativo tem `aria-pressed`/`aria-current`, não só cor.
4. **Botão só com ícone/emoji** precisa de nome acessível (`aria-label` descritivo; `title` quando ajudam).
5. **Ícone decorativo** leva `aria-hidden`; ícone informativo leva rótulo.
6. **Foco visível:** todo elemento interativo mostra anel de 2 px (`Button` já tem; links/selects ganharam regra global no `styles.css`).
7. **Leitor de tela:** carregando tem `role="status"` + `aria-busy`; erro tem `role="alert"`; seções têm `aria-labelledby`.

---

## 8. Padrões visuais mínimos (2.3)

| Elemento | Padrão |
|---|---|
| `h1` | um por tela, via `CabecalhoPagina` (`text-4xl md:text-5xl`) |
| `h2` de seção | `TITULO_SECAO` (`text-3xl`) |
| título de cartão/item | `TITULO_ITEM` (`text-2xl`) |
| metadados | `META` (`text-xs text-muted-foreground`) |
| cartão | `rounded-2xl border bg-card p-6` (`CARTAO`) — `CARTAO_COMPACTO` para listas |
| grade de cartões | `GRADE_CARTOES` |
| foco em chip/filtro cru | `FOCO` de `@/lib/design` |
| cores | só tokens do tema (`accent`, `muted-foreground`, `destructive`, `ochre`, `sage`). Nada de `text-gray-*`, `text-amber-*`, `bg-white/60` |

> Dúvida entre "usar o token" ou "inventar um valor"? Use o token. Consistência ganha de criatividade pontual.

---

## 9. Checklist rápido antes de escrever uma tela

- [ ] O título diz o que a tela faz?
- [ ] Tem um `h1` só?
- [ ] Loading, vazio e erro têm componente do design system?
- [ ] O vazio tem próximo passo?
- [ ] O erro diz o que fazer e oferece "Tentar novamente" quando for consulta?
- [ ] Nenhum "(o)/(a)", jargão interno ou inglês vazando?
- [ ] Nenhum texto abaixo de 12 px?
- [ ] Botão só de ícone tem `aria-label`?
- [ ] Link em prosa está sublinhado?
- [ ] Cores só por token e contraste AA?
