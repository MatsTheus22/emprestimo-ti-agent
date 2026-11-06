# Handoff — 2026-11-06

## Onde parei
Spec 003-dados-iniciais concluída: T1 a T8 e P1 a P4 marcadas, `Status: PRONTA`, rodada 2 com veredito PRONTA (CA-01 a CA-10). Validada e mergeada pelo usuário.

## Commitado
Back: PR #3 mergeado em `main` (`5668b04`). Agente: PR #4 mergeado em `master`; branch em `fb5e20e`. Front: não mudou. Local: raiz e `back/` ainda em `003-dados-iniciais`, sem `pull` das principais.

## Banco local
3 migrations, tenant, 6 usuários de demonstração e 12 equipamentos. Bucket local com as 12 fotos. Nada aplicado sem commit.

## Publicado em produção
Migration, 12 imagens, 12 equipamentos e a conta do professor (criada pelo usuário). Evidências: `docs/specs/003-dados-iniciais/evidencias/`.

## Não fazer
- Agente nunca escreve em produção nem faz merge (rules/restrictions.md).
- Não editar spec nem rodadas da 003: mudança nova vai em spec nova.
- No pooler, a `DATABASE_URL` precisa de `?pgbouncer=true&connection_limit=1`: sem isso, o script falhou em produção (causa provável).
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Atualize `master` e `main` e comece a `004-solicitar-emprestimo` pelas perguntas (rules/spec-flow.md), quando o usuário pedir.
