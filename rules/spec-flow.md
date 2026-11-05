---
description: Ao iniciar qualquer funcionalidade nova do PRD.
globs: ["docs/specs/**"]
alwaysApply: false
---

# Fluxo de spec
> leitor: agente

## Quando
Ao iniciar qualquer funcionalidade nova do PRD.

## Procedimento
1. Crie docs/specs/<NNN-nome-curto>/ com spec.md.
2. Antes de escrever a spec, liste as perguntas que o PRD não
   responde. Espere as respostas.
3. plan.md sai da spec e cita os ADRs que o restringem.
4. tasks.md sai do plano. Cada tarefa cita um CA-xx e cabe
   num commit.
5. Uma tarefa por vez. Ao terminar, siga rules/checks.md.

## Verificação
docs/specs/<NNN-nome-curto>/ tem spec.md, plan.md e tasks.md. Toda
tarefa de tasks.md cita um CA-xx que existe em spec.md, e plan.md
cita os ADRs que a restringem.

## Não faça
- Não crie pasta de spec fora do padrão NNN-nome-curto.

## Antes de declarar uma spec pronta
- Delegue ao subagente verificador-spec (agents/verificador-spec.md),
  passando o caminho da spec e o intervalo de commits de back e front. Commite
  antes: rodada com repositório sujo não vale.
- A rodada é gravada pelo hook em docs/specs/<NNN-nome>/verificacoes/rodada-N.md.
  Ninguém edita esses arquivos. Compare rodadas com
  `node hooks/comparar-rodadas.mjs docs/specs/<NNN-nome> <A> <B>`.
- Qualquer resultado diferente de PRONTA volta para as tarefas: quem corrige é
  o agente principal, nunca o verificador, nem quando a única falha for um teste
  quebrado.
- CA que só se prova em produção leva "(produção)" na spec. Com os demais
  atendidos, o veredito é PRONTA PARA PRODUÇÃO, e o PR de código de back e front
  pode ser aberto. Depois do deploy, o usuário grava a evidência em
  docs/specs/<NNN-nome>/evidencias/ e o verificador roda de novo.
- A spec só é pronta com a linha "Status: PRONTA" em spec.md, escrita com Edit
  depois do veredito PRONTA. Os hooks bloqueiam essa linha sem rodada aprovada
  para o código e a spec atuais, e não deixam encerrar o turno com todas as tarefas
  concluídas sem ela. Vale da spec 003 em diante.
