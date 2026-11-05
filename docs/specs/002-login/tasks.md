# Trilha do login (001 mínima + 002)

Ordem aprovada em 2026-10-19: entregar login funcionando + health antes do
resto da 001. Uma tarefa = um commit. Branch `001-fundacao` em back e front.
Tarefas da 001 aqui citam CAs de 001/spec.md; as da 002, CAs de 002/spec.md.

## Back
- [x] **L1** — 001/T03: config/env.ts com Zod. **001/CA-06**
- [x] **L2** — 001/T04: filtro Problem Details. **001/CA-05**
- [x] **L3** — 001/T05: helmet + CORS. **001/CA-07**
- [x] **L4** — 001/T06: PrismaService + harness Testcontainers + testes de RLS. **001/CA-04**
- [x] **L5** — Migration `display_name` + `custom_access_token_hook`; hook ligado no config.toml. **001/CA-02**, **002/CA-01**
- [x] **L6** — 001/T08+T09: seed do tenant + seed-demo dos 6 usuários. **001/CA-01**, **001/CA-03**
- [x] **L7** — AuthGuard (jose/JWKS) + `GET /v1/me` + testes 200/401/403 e de isolamento. **002/CA-02..05**
- [x] **L8** — 001/T11: OpenAPI gerado + `openapi.json`. **001/CA-09**
- [x] **L9** — 001/T12: handler Vercel (`/v1/health` público). **001/CA-10**

## Front
- [x] **L10** — 001/T14+T16: scaffold Vite (mostrar arquivos antes) + env Zod. **001/CA-11**
- [x] **L11** — 001/T17 parcial: tokens + classes usadas no login e na nav. **001/CA-12**
- [x] **L12** — orval + Login + rotas protegidas + nav + "Em construção" + sem acesso. **002/CA-06..09**

## Depois da trilha
Restante da 001: T10 (pino), T13/T19 (CI), T15 (lint front), T17 completo, T20 (AGENTS.md).
