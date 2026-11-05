# 001 — Fundação · Plano

Spec: [spec.md](spec.md)

## ADRs que restringem

- **ADR-001 §1** — dois repositórios, contrato via OpenAPI gerado, sem pacote compartilhado.
- **ADR-001 §2** — Vite, React, TS strict, React Router, TanStack Query, RHF + Zod, orval; estilo conforme ADR-002.
- **ADR-001 §3** — Node LTS, NestJS, `@vendia/serverless-express` com instância cacheada, `src/modules/<dominio>/`, Controller → Service → Repository, `nestjs-zod`, `AsyncLocalStorage`.
- **ADR-001 §4** — REST, prefixo `/v1`, Problem Details (RFC 9457), OpenAPI publicado pelo CI da API.
- **ADR-001 §5** — Prisma Migrate como único dono do schema, SQL bruto na migration, seed idempotente com tenant `suporte_ti`.
- **ADR-001 §7** — RLS em toda tabela (defesa em profundidade).
- **ADR-001 §8** — Jest (back), Vitest (front), Testcontainers com Postgres real, supertest, checagem de contrato no CI do front.
- **ADR-001 §9** — config validada com Zod no boot, pino JSON com `request_id`, GitHub Actions, `prisma migrate deploy` antes do deploy (já existe em `migrate.yml`).
- **ADR-001 §10** — helmet, segredos fora do repositório, `service_role` só na API.
- **ADR-001 §11** — ESLint + Prettier replicados, husky + lint-staged só lint/format.
- **ADR-002** — Nocturne recriado, tokens no `:root`, Raleway, Phosphor, sem classe própria.

## Branches

`001-fundacao` em `back/` e em `front/`, saindo de `main`. Push é seu.

## Back — estrutura alvo

Montada à mão sobre o repositório existente (não uso `nest new`, que
sobrescreveria `package.json` e criaria um repositório git aninhado):

```
back/
  api/index.ts                 handler Vercel (serverless-express, instância cacheada)
  vercel.json
  openapi.json                 gerado, versionado
  src/
    main.ts                    bootstrap local
    app.factory.ts             cria e configura a app (usado por main e api/)
    app.module.ts
    config/env.ts              schema Zod das variáveis + loadEnv()
    common/
      problem-details.filter.ts
      request-context.ts       AsyncLocalStorage (request_id; user/tenant em 002)
      logger.ts                pino / nestjs-pino
    prisma/prisma.service.ts
    modules/health/health.controller.ts
  scripts/generate-openapi.ts
  prisma/seed.ts               tenant suporte_ti (idempotente)
  prisma/seed-demo.ts          usuários de dev (só local)
  test/
    db/                        harness Testcontainers + testes de RLS
    health.e2e-spec.ts         supertest
```

## Dependências a instalar

- **Back, dependências:** `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/swagger`, `reflect-metadata`, `rxjs`, `zod`, `nestjs-zod`, `nestjs-pino`, `pino`, `pino-http`, `helmet`, `@vendia/serverless-express`, `@supabase/supabase-js` (só no seed-demo, Admin API local).
- **Back, desenvolvimento:** `@nestjs/cli`, `@nestjs/testing`, `typescript`, `ts-node`, `tsx`, `@types/node`, `@types/express`, `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`, `testcontainers`, `@testcontainers/postgresql`, `pg`, `@types/pg`, `supabase` (CLI), `eslint`, `typescript-eslint`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`.
- **Front, dependências:** `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `zod`, `@supabase/supabase-js` (instalado agora, usado na 002), `@phosphor-icons/react`.
- **Front, desenvolvimento:** `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `@testing-library/react`, `jsdom`, `orval`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`.
- **Ficam para a feature que usa:** `zustand` e `react-hook-form` + `@hookform/resolvers` (004/005), `@casl/ability` e `jose` (002), `@sentry/*` (008), `@playwright/test` (008).

## Pontos técnicos

- **Migration nova (CA-02).** O DDL abaixo precisa de aprovação antes de gerar:
  ```sql
  ALTER TABLE "memberships" ADD COLUMN "display_name" TEXT NOT NULL DEFAULT '';
  ```
  - Linhas existentes recebem `''`. O seed-demo e o convite real preenchem o nome.
  - A tabela não ganha policy nova porque a `memberships_isolation` existente cobre a coluna.
- **Grants após o reset.** O `prisma migrate reset` recria o schema `public`, e isso pode perder os grants padrão do Supabase (`anon`, `authenticated`, `service_role`).
  - A verificação fica na T06.
  - Se os grants se perderem, eles voltam como SQL bruto nessa mesma migration.
- **Testcontainers.** O Postgres puro não tem `auth.users`, `auth.jwt()` nem os papéis do Supabase, e a `init_schema` depende deles. Por isso o harness usa a imagem `public.ecr.aws/supabase/postgres:17.11.0.002`, a mesma do banco local, e aplica as migrations com `prisma migrate deploy`.
- **Testes de RLS (CA-04).** Cada teste abre uma transação com `SET LOCAL role authenticated` e `set_config('request.jwt.claims', …)`. Esse é exatamente o caminho que a policy lê.
- **Contrato (CA-09 / CA-13).** O `openapi.json` é versionado no `back` e o CI também o publica como artefato.
  - No front, `npm run api:sync` copia o arquivo de `../back/openapi.json` (localmente) ou do raw do GitHub em `main` (no CI; o repositório é público) e roda o orval.
  - O CI do front regenera o cliente e falha com `git diff --exit-code` se houver diferença.
- **Serverless (CA-10).** O `app.factory.ts` é compartilhado. O `api/index.ts` guarda a promise do handler em escopo de módulo para criar a instância uma vez só.
- **Front sem Tailwind/shadcn.**
  - `src/styles/nocturne.css` recebe os tokens do `:root` e as classes. A fonte Raleway vem por `<link>` do Google Fonts.
  - Os componentes de tela usam `className` do Nocturne + `style` inline.
- **Status `emprestado` gravado.** A `init_schema` grava `equipment.status` com `'emprestado'`. A decisão entre manter esse status gravado ou derivá-lo do empréstimo aberto fica para a spec 003/005, e esta spec não mexe nisso.

## Riscos

- O container `supabase_vector_back` está em loop de restart. Ele não afeta o banco nem o Auth, e não entra nesta spec.
- A versão da imagem do Supabase precisa acompanhar a CLI. Se a CLI for atualizada, o harness precisa trocar a tag da imagem.
