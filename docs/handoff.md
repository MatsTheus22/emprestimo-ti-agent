# Handoff — 2026-10-19

## Onde parei
Trilha do login COMPLETA (L1–L12, docs/specs/002-login/tasks.md). Login real verificado: front
5173 + API 3000 + Supabase local; ana → colaborador, operacoes → operacoes, senha errada → invalid_credentials.

## Commitado (branch `001-fundacao` nos dois repos)
back: e4c0ed0…470774c (T01–T02, L1–L9, jest sem type-check, handler Vercel) · e4b082d vercel.json (estáticos só de public/ vazia).
front: 11119a9 L10 scaffold · 0a21027 L11 nocturne.css · 8e3cf3a L12 login/rotas/nav/orval · c31b76e vercel.json (rewrite SPA).
Usuário vai testar em preview na Vercel (passos 1–5 da conversa: JWT keys assimétricas, migrate via
workflow_dispatch na branch, hook, usuários+memberships por SQL, env vars nos 2 projetos).

## Banco local
2 migrations; tenant suporte_ti + 6 usuários demo (senha `emprestai-dev`). Hook ativo.

## Publicado em PRODUÇÃO (2026-10-20)
PRs #1 mergeados na main (back fc8d676, front a0c6665); repos locais em `main`.
Migration aplicada pelo CI da main. Envs de Production corrigidas (DATABASE_URL com pgbouncer,
CORS_ORIGIN e URLs do front, chave publishable) e produção redeployada.
API: https://emprestimo-ti-back.vercel.app/v1/health → 200 · Front: https://emprestimo-ti-front.vercel.app
Pendente: SUPABASE_SERVICE_ROLE_KEY legada nas envs do back (runtime não usa; trocar pela sb_secret).

## Histórico do preview (branch 001-fundacao, já mergeada)
- Migration 20261019132041 aplicada no Supabase remoto (workflow_dispatch na branch).
- Vercel Preview (branch 001-fundacao): envs criadas nos 2 projetos; back sem Deployment Protection.
  API: https://emprestimo-ti-back-git-001-fundacao-mats-theus.vercel.app/v1/health → 200 (verificado).
  Front: https://emprestimo-ti-front-git-001-fundacao-mats-theus.vercel.app — LOGIN REAL VERIFICADO
  pelo usuário (Auth Hooks → Customize Access Token ligado; usuário + membership criados por painel/SQL).
- Push feito pelo usuário (back f90d642, front f4e3afb).
- Novo usuário remoto: Auth → Add user + insert em memberships (sem tela de gestão no PRD).
- Production (main) ainda com envs erradas: CORS_ORIGIN e URLs do front placeholder, DATABASE_URL
  sem pgbouncer, front sem VITE_SUPABASE_ANON_KEY; service_role legada nos dois ambientes.

## Rodar local / tempos
back `npm run start:dev` (3000) · front `npm run dev` (5173) · seed `npm run seed:demo` (back).
Unidade back ~16s, front ~17s · test:db ~2min · build front ~14s. Rodar em primeiro plano com
`timeout`; após `npm install` o OneDrive deixa tudo lento por alguns minutos.

## Não fazer
- Não usar `prisma migrate dev`; `migrate reset` exige frase de consentimento (rules/migration.md).
- Não editar `.env` nem imprimir valores; chave → clipboard via `clip.exe`.
- Nunca apontar teste ao Supabase local. Ações do usuário na seção final "-- Ações necessarias:".

## Próximo passo
Pergunte ao usuário se segue com o restante da 001 (T10 pino, T13/T19 CI, T15 lint front, T20 AGENTS.md) ou com a spec 003 (catálogo).
