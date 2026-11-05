# Handoff — 2026-11-05

## Onde parei
Prática SDD (enunciado HTML, fora do git; é verdade absoluta). Etapas 0 e 2 mergeadas. Etapa 1 pronta, com a prova do verificador feita; aguardando merge do usuário.
Decisões do usuário: docs/entrega/diario.md. Fonte de imagens é Pixabay, com `sharp` (ADR-003).

## Commitado
Agente, branch `etapa-1-verificador`: verificador, hooks, regras, rodadas da 002-login. Raiz fica nesta branch até o merge: os hooks só existem nela.
Back, branch `prova-verificador`: erro plantado `af46491` e reversão `43a325a`. Nunca mergear: só precisa estar no GitHub, para os hashes do ENTREGA.md.
As 12 imagens finais ficam em `saida/final` da worktree `.claude/worktrees/agent-a6fb...`, ignoradas pelo git. Não remova a worktree antes do envio.

## Banco local
2 migrations. 6 usuários em @dev.local (senha em `DEMO_SEED_PASSWORD`).

## Publicado em produção
Só login: https://emprestimo-ti-front.vercel.app e https://emprestimo-ti-back.vercel.app/v1/health. Nada novo da prática.

## Não fazer
- Agente nunca escreve em produção nem faz merge (rules/restrictions.md).
- Nunca gravar a senha padrão da turma em arquivo versionado. Não usar `prisma migrate dev`.
- Testes nunca no Supabase local. Não escrever rodada à mão. Não documentar a reorganização do `.git` no ENTREGA.md.
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Depois do merge da etapa 1, atualize o master e crie a branch `003-dados-iniciais`, começando pelas perguntas da spec (rules/spec-flow.md).
