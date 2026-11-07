# Handoff — 2026-11-07

## Onde parei
Spec 004-solicitar-emprestimo concluída: T1 a T12 e P1 a P4, `Status: PRONTA`, rodada 2 com veredito PRONTA (CA-01 a CA-25).

## Commitado
Back: PR #4 mergeado em `main` (`ec3645a`). Front: PR #2 mergeado em `main` (`3055f55`). Raiz: branch `004-solicitar-emprestimo` com PR aberto para `master`; o merge é do usuário.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Tenant, 12 equipamentos e 6 memberships. Pode ter empréstimos do teste local do usuário. Nada aplicado sem commit.

## Publicado
Migration, API e telas da 004 em produção (2026-11-07). Conta de teste com papel `operacoes` e zero empréstimos depois da limpeza. Conta do Marcelo com zero.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não editar spec nem rodadas da 003 e da 004: mudança nova vai em spec nova.
- Não remover o `at time zone 'UTC'` de `devolucaoSql` nem o `.min(1)` dos campos anuláveis: há testes que protegem os dois.
- Adicionar arquivos pelo nome, nunca `git add docs`: levou por engano uma mudança da evidência da 003, já restaurada.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Spec 005, quando o usuário pedir: trocar as fotos TI-0001, TI-0004, TI-0006, TI-0007 e TI-0012, que descumprem o "Direito de imagem". O motivo está em docs/entrega/diario.md, no fim da spec 004.
