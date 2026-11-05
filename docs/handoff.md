# Handoff — 2026-11-05

## Onde parei
Prática SDD (enunciado HTML, fora do git; é verdade absoluta). Etapa 0 concluída e verificada (`npm test` e `npm run build` em back e front). Próxima: etapa 1, subagente verificador.
Decisões do usuário: docs/entrega/diario.md. MUDANÇA: fonte de imagens é Pixabay, não Pexels, com `sharp` (professor e usuário, 2026-11-05). Chave em back/.env.local; testada, HTTP 200.

## Commitado (branch `etapa-0-preparacao`)
Agente: .gitignore com .env e enunciado; regras alinhadas (agente nunca escreve em produção); spec 001 CA-03; AGENTS.md, diário e este handoff.
Back: seed-demo com senha de `DEMO_SEED_PASSWORD` e usuários em @dev.local.

## Banco local
2 migrations. Usuários antigos apagados; 6 novos em @dev.local (senha em `DEMO_SEED_PASSWORD`).

## Publicado em produção
Só login: https://emprestimo-ti-front.vercel.app e https://emprestimo-ti-back.vercel.app/v1/health. Nada novo da prática.

## Não fazer
- Agente nunca escreve em produção nem faz merge (rules/restrictions.md).
- Nunca gravar a senha padrão da turma em arquivo versionado. Não usar `prisma migrate dev`.
- Testes nunca no Supabase local; Testcontainers.
- Não documentar a reorganização do `.git` no ENTREGA.md (pedido do usuário).
- Rodar em primeiro plano com timeout. Ações do usuário na seção final "-- Acoes necessarias:".

## Próximo passo
Crie `.claude/agents/verificador-spec.md` com ferramentas restritas e hooks, conforme a seção 02 do enunciado.
