# Roteiro do beta fechado (5 pessoas)

Objetivo: validar o produto com **5 pessoas reais** antes de abrir venda, com apoio próximo e coleta estruturada. Duração: 3–5 dias. Critério de saída: nenhum erro P0, ativação ≥ 60%, pelo menos 3 feedbacks úteis.

## 1. Antes de convidar (checklist de 20 min)

- [ ] Domínio no ar (apex como principal na Vercel) e `/api/health` 200
- [ ] Monitor externo batendo no health (UptimeRobot/Better Stack)
- [ ] `npm run smoke:producao` sem FAIL
- [ ] Teste de pagamento concluído e reembolsado (`ROTEIRO-TESTE-PAGAMENTO.md`)
- [ ] Caixas `suporte@` e `privacidade@auraid.app.br` criadas
- [ ] Dados legais completos (razão social, CNPJ, endereço, contatos)
- [ ] Limites de uso justo ativos no gateway (Pass 50/mês, 12/dia)
- [ ] `/admin` → Custo de IA e Erros de tela em zero/baixo
- [ ] Contas de teste antigas (`teste.*`) removidas

## 2. Quem convidar (5 perfis)

| # | Perfil | Por quê |
| --- | --- | --- |
| 1 | Usuária que já testa looks no espelho | fluxo principal (roupas/maquiagem) |
| 2 | Pessoa que odeia decidir roupa | valida a promessa "sem regras" |
| 3 | Alguém com tatuagem planejada | valida briefing + prévia ancorada |
| 4 | Profissional (salaão/barbeiro) | valida Plano Pro e briefing |
| 5 | Pessoa cética/impaciente | encontra fricção que ninguém admite |

Prefira pessoas que **vão reclamar** — crítica é o ativo.

## 3. Convite (modelo de mensagem)

> Oi! Estou abrindo o Aura ID em beta fechado com um grupo pequeno e queria você. É uma ferramenta de identidade visual (roupas, maquiagem, cabelo, tatuagem) que dá sugestões a partir do seu contexto — sem nota de beleza, sem julgamento. Leva ~20 min para configurar + explorar. Pode ser que algo quebre: é beta, e é exatamente por isso que quero você. Se topar, te mando o link e a senha de acesso. O que você achar de bom, ruim ou confuso me conta pelo botão 💬 dentro do app.

Envie o link `https://auraid.app.br` + credenciais iniciais (ou convide por e-mail, se habilitado).

## 4. Sessão guiada (20–30 min por pessoa)

1. **Entrada (3 min):** cadastro, consentimento, onboarding. Observar onde trava (sem ajudar na primeira tentativa).
2. **Primeiro resultado (5 min):** Estúdio → gerar sugestão. Cronometrar até a primeira sugestão vista.
3. **Módulo de interesse (7 min):** roupas, maquiagem ou tatuagem — deixa a pessoa escolher.
4. **Exportar/compartilhar (3 min):** baixar ou copiar uma sugestão.
5. **Pagamento (2 min):** mostrar `/aura-pass` e perguntar se o preço/oferta faz sentido (não vender ainda).
6. **Feedback (5 min):** botão 💬 → crítica/sugestão; depois 3 perguntas: *o que quase te fez desistir? o que você contaria para uma amiga? o que você esperava e não achou?*

Anote: tempo por etapa, onde travou, frases literais.

## 5. O que medir (sem invadir privacidade)

No `/admin`:
- **Funil 7 dias:** quantos criaram perfil, salvaram e aprovaram sugestão.
- **Erros de tela 24 h:** qualquer grupo novo = investigar no mesmo dia.
- **Custo de IA:** custo/dia e top contas (esperado: centavos por pessoa).

Planilha simples por participante: ativou? (sim/não) · tempo até 1º resultado · gerou imagem? · exportou? · usou tatuagem? · satisfação 1–5 · usaria de novo? · P0/P1 encontrados.

## 6. Rotina diária (10 min)

1. `/admin`: erros novos + custo + funil.
2. `/api/health` (ou monitor): 200.
3. Ler feedbacks do dia e responder no canal.
4. Corrigir P0 no mesmo dia; P1 no dia seguinte; registrar P2/P3 para depois.
5. Se erro P0 em login/geração/pagamento por mais de 15 min: comunicar no grupo e, se necessário, rollback na Vercel.

## 7. Critérios de saída do beta

- [ ] 5/5 concluíram onboarding
- [ ] ≥ 3 geraram e exportaram uma sugestão
- [ ] 0 bloqueios de pagamento abertos
- [ ] 0 erros P0 em aberto
- [ ] ≥ 3 feedbacks acionáveis implementados ou priorizados
- [ ] Custo de IA dentro do esperado (≤ US$ 0,5 por pessoa no período)

## 8. Depois do beta

1. Implementar os P1 mais citados.
2. Rodar o teste de pagamento com um cartão de cliente real (com consentimento) ou manter o seu.
3. Abrir venda para lista de espera (10–20 pessoas), mantendo monitor e suporte.
4. Só então considerar tráfego pago.

## 9. Mensagem de encerramento

> Obrigado por testar o Aura ID nessa fase. O que você me contou mudou X/Y/Z (cite algo concreto). Seus dados podem ser excluídos a qualquer momento em Configurações; se quiser continuar usando, sua conta fica ativa (e o beta ganha 30 dias de Aura Pass).
