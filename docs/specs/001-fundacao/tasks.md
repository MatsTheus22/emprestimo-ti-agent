# 001 — Fundação · Tarefas

Spec: [spec.md](spec.md) · Plano: [plan.md](plan.md)
Uma tarefa = um commit. Ao terminar cada uma: rules/checks.md e pare.

## Back (`back/`, branch `001-fundacao`)

- [x] **T01** — Instalar Nest e base TS strict; `app.factory.ts`, `main.ts`, prefixo `/v1`, `GET /v1/health`; Jest + supertest com teste `ca_05` do 200. **CA-05**
- [x] **T02** — ESLint + Prettier + husky + lint-staged no back. **CA-14**
- [x] **T03** — `config/env.ts` com Zod; boot falha nomeando a variável; teste unitário. **CA-06**
- [x] **T04** — Filtro Problem Details global (404, 400 de validação, 500 genérico); teste `ca_05` do 404 com status e corpo. **CA-05**
- [x] **T05** — helmet + CORS por `CORS_ORIGIN`; teste de cabeçalhos e de origem recusada. **CA-07**
- [x] **T06** — `PrismaService` + harness Testcontainers (imagem supabase/postgres) + testes de RLS das 5 tabelas existentes; verificar grants pós-reset. **CA-04**
- [x] **T07** — Migration `memberships.display_name` (DDL do plano, já aprovado); reset local + testes. **CA-02**
- [x] **T08** — `prisma/seed.ts` idempotente com tenant `suporte_ti`, ligado ao `prisma migrate reset`; teste de idempotência. **CA-01**
- [x] **T09** — `prisma/seed-demo.ts` (Admin API local, 6 usuários + memberships, trava de localhost); script `seed:demo`. **CA-03**
- [ ] **T10** — pino + `AsyncLocalStorage` com `request_id` e header `x-request-id`; teste. **CA-08**
- [x] **T11** — `nestjs-zod` + `@nestjs/swagger`; `scripts/generate-openapi.ts`; `openapi.json` commitado. **CA-09**
- [x] **T12** — `api/index.ts` + `vercel.json` com instância cacheada; teste de duas invocações com um bootstrap. **CA-10**
- [ ] **T13** — `.github/workflows/ci.yml`: lint, test (Docker no runner), build, checagem e artefato do `openapi.json`. **CA-15**

## Front (`front/`, branch `001-fundacao`)

- [x] **T14** — Scaffold Vite React TS (mostrar a lista de arquivos antes de gerar), `strict`, Vitest; build passa. **CA-11**
- [ ] **T15** — ESLint + Prettier + husky + lint-staged no front. **CA-14**
- [x] **T16** — `src/config/env.ts` com Zod; erro na subida nomeando a variável; teste. **CA-11**
- [ ] **T17** — `nocturne.css` com tokens e classes do layout.md §1–4 + Raleway + Phosphor; teste que confere os tokens de cor. **CA-12**
- [ ] **T18** — orval + `api:sync`; Router + QueryClient; página temporária consumindo `/v1/health` pelo cliente gerado; teste com resposta simulada. **CA-13**
- [ ] **T19** — `.github/workflows/ci.yml`: lint, test, build e checagem de contrato. **CA-15**

## Documentação (raiz, não versionada)

- [ ] **T20** — Atualizar `AGENTS.md` (Comandos e Estado atual) e os placeholders de rules/ com os comandos que rodaram. **CA-16**
