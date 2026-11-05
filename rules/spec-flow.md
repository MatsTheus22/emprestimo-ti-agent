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
  passando o caminho da spec e o intervalo de commits.
- A spec só é pronta com "Veredito: PRONTA". Qualquer outro resultado
  volta para as tarefas — quem corrige é o agente principal, nunca o
  verificador.