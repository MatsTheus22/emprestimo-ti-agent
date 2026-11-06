# Handoff — 2026-11-06

## Onde parei
Spec 004-solicitar-emprestimo: T1 a T9 concluídas (CA-01 a CA-15, CA-17 a CA-19). Spec, plano e DDL aprovados pelo usuário. T10 ainda não autorizada.

## Commitado
Back: `3b9296b` e front: `96fa8f9`, na branch `004-solicitar-emprestimo`, sem push. Raiz: spec, plano, tarefas, hook e layout na mesma branch, sem push.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Dados: tenant, 12 equipamentos (9 disponíveis, 3 em manutenção), 6 memberships, 0 empréstimos. Nada aplicado sem commit.

## Publicado
Nada da 004. Produção continua como no fim da 003.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não editar o `spec.md` da 002: a 004 registra o trecho do CA-07 que substitui.
- Não implementar rate limit: desvio consciente registrado na spec.
- Não remover o `at time zone 'UTC'` de `devolucaoSql`: o teste que grava a fórmula na coluna é o que protege isso.
- Campo anulável no contrato precisa de `.min(1)` antes do `.nullable()` (`common/pagination.ts`): um teste barra `type` em array.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Com o "pode" do usuário, implemente só a T10 (tela Meus empréstimos) na branch `004-solicitar-emprestimo` do front.
