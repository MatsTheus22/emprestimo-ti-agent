---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente

## Autoridade

- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva
  a decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em docs/adr/. Se precisar contrariar, pare.
- Não responda por conta própria o que o PRD deixou ambíguo. Liste as
  perguntas e espere.
- Não escolha biblioteca que não esteja em docs/adr/. Proponha e espere.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual.
- Não gere scaffold automático de framework sem mostrar antes o que ele
  vai criar.
- Não escreva código de funcionalidade sem uma spec correspondente em
  docs/specs/.

## Ritmo

- Não escreva código antes de um plano aprovado. Escreva o plano,
  mostre e espere.
- "Pode implementar" NÃO autoriza o plano inteiro: execute UMA tarefa,
  rode os checks, mostre o resultado e pare.

## Produção

O agente nunca escreve em produção. Tudo que escreve no banco ou no
Storage do deploy é executado por mim, mesmo que eu diga "pode" no meio
de uma tarefa (nível "proibido" em rules/operacao.md). O agente prepara
o comando, eu rodo e devolvo a saída.

Proibido ao agente:
- Push na `main`/`master` e force push. Push na `main` do back aplica
  migration em produção pelo CI.
- Merge de PR (`gh pr merge`) e disparo de workflow (`gh workflow run`).
- `prisma migrate deploy`, seed ou upload apontando para o Supabase
  remoto; SQL no remoto; `migrate reset`, `db reset`, DROP ou TRUNCATE
  no remoto.
- Deploy de produção na Vercel.

Com permissão a cada ação (nível "pedir antes"): antes de executar, diga
o comando, onde ele age (repo/branch, projeto) e o efeito; espere o
"pode". Permissão vale para aquela ação, não para as seguintes.
- Push da branch de trabalho.
- GitHub: criar/alterar secrets.
- Vercel: deploy de preview, variáveis de ambiente e configuração.

Sempre:
- Segredos: nunca escreva valor de chave na resposta; passe de arquivo
  para comando sem imprimir (rules/secrets.md).
- O desenvolvimento continua no banco local.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está
  certa até que alguém mude a spec.
- Se uma regra de procedimento contrariar um ADR ou uma spec, PARE e
  avise. Não escolha um dos dois por conta própria.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo.