# Handoff — 2026-11-05

## Onde parei
Prática SDD (enunciado HTML, fora do git; é verdade absoluta). Etapa 0 mergeada. Etapas 1 e 2 commitadas, aguardando aprovação do usuário.
Decisões do usuário: docs/entrega/diario.md. Fonte de imagens é Pixabay, com `sharp` (ADR-003).

## Commitado
Agente, branch `etapa-1-verificador`: agents/, hooks/, .claude/, regras. Raiz fica nesta branch: os hooks só existem nela até o merge.
Agente, branch `etapa-2-imagens` (worktree em .claude/worktrees/): skill, ADR-003, creditos.json.
As imagens finais ficam em `saida/final` da worktree, ignoradas pelo git. Não remova a worktree antes do envio.

## Banco local
2 migrations. 6 usuários em @dev.local (senha em `DEMO_SEED_PASSWORD`).

## Publicado em produção
Só login: https://emprestimo-ti-front.vercel.app e https://emprestimo-ti-back.vercel.app/v1/health. Nada novo da prática.

## Não fazer
- Agente nunca escreve em produção nem faz merge (rules/restrictions.md).
- Nunca gravar a senha padrão da turma em arquivo versionado. Não usar `prisma migrate dev`.
- Testes nunca no Supabase local; Testcontainers.
- Não documentar a reorganização do `.git` no ENTREGA.md (pedido do usuário).
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Reinicie a sessão e rode a prova do verificador com erro plantado na spec 002-login, em commits próprios.
