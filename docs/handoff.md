# Handoff — 2026-11-06

## Onde parei
Spec 004-solicitar-emprestimo: T1 e T2 concluídas (CA-01 a CA-06). Spec, plano e DDL aprovados pelo usuário. T3 ainda não autorizada.

## Commitado
Back: `daaf1f3` na branch `004-solicitar-emprestimo`, sem push. Raiz: spec, plano e tarefas na mesma branch, sem push. Front: sem mudança, ainda em `main`.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Dados: tenant, 12 equipamentos (9 disponíveis, 3 em manutenção), 6 memberships, 0 empréstimos. Nada aplicado sem commit.

## Publicado
Nada da 004. Produção continua como no fim da 003.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não editar o `spec.md` da 002: a 004 registra o trecho do CA-07 que substitui.
- Não implementar rate limit: desvio consciente registrado na spec.
- A fórmula de `due_at` da T3 precisa de `at time zone 'UTC'` e de teste com a sessão em outro fuso (plan.md).
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Com o "pode" do usuário, implemente só a T3 (`POST /v1/loans`) na branch `004-solicitar-emprestimo` do back.
