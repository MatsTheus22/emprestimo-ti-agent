# Handoff — 2026-11-06

## Onde parei
Spec 004-solicitar-emprestimo: T1 a T4 concluídas (CA-01 a CA-06, CA-08 a CA-12, CA-14, CA-15). Spec, plano e DDL aprovados pelo usuário. T5 ainda não autorizada.

## Commitado
Back: `29e0a9c` na branch `004-solicitar-emprestimo`, sem push. Raiz: spec, plano e tarefas na mesma branch, sem push. Front: sem mudança, ainda em `main`.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Dados: tenant, 12 equipamentos (9 disponíveis, 3 em manutenção), 6 memberships, 0 empréstimos. Nada aplicado sem commit.

## Publicado
Nada da 004. Produção continua como no fim da 003.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não editar o `spec.md` da 002: a 004 registra o trecho do CA-07 que substitui.
- Não implementar rate limit: desvio consciente registrado na spec.
- Não remover o `at time zone 'UTC'` de `devolucaoSql`: o teste que grava a fórmula na coluna é o que protege isso.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Com o "pode" do usuário, implemente só a T5 (script `limpar:emprestimos-teste`) na branch `004-solicitar-emprestimo` do back.
