# Handoff — 2026-11-07

## Onde parei
Spec 004-solicitar-emprestimo: T1 a T11 e P1 a P4 concluídas. Rodada 2 com veredito PRONTA (CA-01 a CA-25), spec declarada pronta. Falta só o push da raiz e o PR do agente (T12), pedindo antes.

## Commitado
Back: PR #4 mergeado em `main` (`ec3645a`); front: PR #2 mergeado em `main` (`3055f55`). Raiz: branch `004-solicitar-emprestimo`, só local. `docs/adr/001-stack.md` tem mudança do usuário, sem commit: não incluir nos commits do agente.

## Banco local
Migration `20261106112807_loans_open_index_read_only_grants` aplicada. Tenant, 12 equipamentos e 6 memberships. Pode ter empréstimos do teste local do usuário. Nada aplicado sem commit.

## Publicado
Migration, API e telas da 004 em produção (2026-11-07). Conta de teste criada, com zero empréstimos depois da limpeza. Conta do Marcelo com zero.

## Não fazer
- Não aplicar nada em produção nem fazer merge: é do usuário (rules/restrictions.md).
- Não remover o `at time zone 'UTC'` de `devolucaoSql` nem o `.min(1)` dos campos anuláveis: há testes que protegem os dois.
- Adicionar arquivos pelo nome, nunca `git add docs`: levou por engano uma mudança da evidência da 003, já restaurada.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Em aberto, decisão do usuário
Fotos que parecem violar os critérios da skill (TI-0001, TI-0004, TI-0006, TI-0007, TI-0012). Região do Supabase no ADR-001 §9.

## Próximo passo
Com o "pode" do usuário, faça o push da raiz e abra o PR para `master`; o merge é dele.
