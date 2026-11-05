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
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.

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

Liberado em 2026-10-19, SEMPRE com permissão explícita a cada ação
(nível "pedir antes" em rules/operacao.md): antes de executar, diga o
comando, onde ele age (repo/branch, projeto Vercel, projeto Supabase) e
o efeito; espere o "pode". Permissão vale para aquela ação, não para as
seguintes.

- Push: só da branch de trabalho. Nunca force push, nunca push direto
  na `main` (push na main aplica migration em produção pelo CI).
- GitHub: criar/alterar secrets e disparar workflows.
- Vercel: deploy de preview, variáveis de ambiente e configuração dos
  dois projetos. Deploy de produção só com pedido explícito para isso.
- Supabase remoto: schema SÓ via `prisma migrate deploy` (CI ou
  comando), nunca SQL avulso de schema; dados (usuários, memberships)
  e configuração de Auth com permissão a cada vez. Nunca `migrate
  reset`, `db reset`, DROP ou TRUNCATE no remoto.
- Segredos: nunca escreva valor de chave na resposta; passe de arquivo
  para comando sem imprimir (rules/secrets.md).
- O desenvolvimento continua no banco local.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está
  certa até que alguém mude a spec.
- Se uma regra de procedimento contrariar um ADR ou uma spec, PARE e
  avise. Não escolha um dos dois por conta própria.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo.