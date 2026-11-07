# Handoff — 2026-11-06

## Onde parei
Spec 004-solicitar-emprestimo: T1 a T11 concluídas. Rodada 1 com veredito PRONTA PARA PRODUÇÃO (CA-01 a CA-19 atendidos; CA-20 a CA-25 aguardam evidência). PRs abertos, aguardando P1 a P4 do usuário.

## Commitado
Back: PR #4; front: PR #2, branch `004-solicitar-emprestimo`, sem merge. Raiz: mesma branch, só local; `verificacoes/rodada-1.md` sem commit, entra na T12.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Dados: tenant, 12 equipamentos (9 disponíveis, 3 em manutenção), 6 memberships, 0 empréstimos. Nada aplicado sem commit.

## Publicado
Nada da 004 em produção: só as branches e os PRs no GitHub. Produção continua como no fim da 003.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não editar o `spec.md` da 002: a 004 registra o trecho do CA-07 que substitui.
- Não implementar rate limit: desvio consciente registrado na spec.
- Não remover o `at time zone 'UTC'` de `devolucaoSql`: o teste que grava a fórmula na coluna é o que protege isso.
- Campo anulável no contrato precisa de `.min(1)` antes do `.nullable()` (`common/pagination.ts`): um teste barra `type` em array.
- Adicionar arquivos pelo nome, nunca `git add docs`: levou por engano uma mudança da evidência da 003, já restaurada.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Quando o usuário trouxer as evidências de P1 a P4, rode o verificador de novo e, com PRONTA, faça a T12.
