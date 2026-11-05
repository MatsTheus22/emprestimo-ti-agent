# 001 — Fundação

> Infraestrutura sobre a qual as features do PRD (002–008) são construídas.
> Não entrega funcionalidade de negócio; entrega as duas aplicações de pé,
> o contrato atravessando entre elas e o banco local reproduzível.

## Ponto de partida (já existe, não refazer)

- `back/`: `prisma/schema.prisma` com `tenants`, `memberships`, `equipment`,
  `loans`, `audit_log`; migration `20261001124031_init_schema` (FKs para
  `auth.users`, CHECKs, RLS com policy por `tenant_id` do JWT) já publicada
  no remoto; `supabase/config.toml`; `.github/workflows/migrate.yml`.
- `front/`: só `.env.example`, `.gitignore`, `LICENSE`.
- Supabase local rodando (Docker), schema `init_schema` aplicado.

## Decisões tomadas para esta spec (respostas às perguntas)

- O nome exibido da pessoa vive em `memberships.display_name`.
- Usuários de desenvolvimento são criados por um seed de demonstração que
  só roda contra o Supabase local, com senha fixa de dev. No ambiente real,
  usuários são convidados pelo painel do Supabase (fora do código).
- Estilo: Nocturne recriado numa folha única + inline (ADR-001 §2, ADR-002).
- Reset de schema: `npx prisma migrate reset` (rules/checks.md).

## Fora desta spec

Login, guard de JWT, CASL, rate limit, claim `tenant_id` no token (002);
qualquer tela de negócio; Sentry e CSP (008); Playwright (008);
dados de exemplo de equipamentos e empréstimos (003/005).

## Critérios de aceitação

### Banco
- **CA-01** — `npx prisma migrate reset` contra o banco local aplica todas
  as migrations do zero e roda o seed sem nenhum passo manual; o seed cria
  o tenant `suporte_ti`; rodar o seed duas vezes não duplica nada.
- **CA-02** — `memberships` tem `display_name` obrigatório; linhas
  existentes recebem string vazia.
- **CA-03** — `npm run seed:demo` cria, de forma idempotente, 6 usuários no
  Auth local (Ana Ribeiro, Marcos Lemos, Júlia Prado, Rafael Souza, Camila
  Nunes como `colaborador`; um usuário `operacoes`), cada um com membership
  no `suporte_ti`. O script recusa rodar se `SUPABASE_URL` não for
  `127.0.0.1`/`localhost`.
- **CA-04** — Para cada tabela de domínio, contra Postgres real
  (Testcontainers): com o papel `authenticated` e claim `tenant_id` do
  tenant B, nenhuma linha do tenant A retorna; sem claim, nenhuma linha
  retorna.

### API
- **CA-05** — `GET /v1/health` responde `200 {"status":"ok"}`; rota
  inexistente responde `404` com `Content-Type: application/problem+json`
  e corpo com `type`, `title`, `status` (RFC 9457).
- **CA-06** — Variável de ambiente ausente ou inválida impede a API de
  subir, e a mensagem nomeia a variável.
- **CA-07** — Toda resposta traz os cabeçalhos do helmet; CORS aceita só a
  origem de `CORS_ORIGIN`.
- **CA-08** — Cada request gera uma linha de log JSON (pino) com
  `request_id`, que também volta no header `x-request-id`.
- **CA-09** — `npm run openapi` gera `openapi.json` a partir dos schemas
  Zod, contendo `/v1/health`; o CI falha se o arquivo commitado divergir
  do gerado.
- **CA-10** — O handler serverless da Vercel responde `/v1/health` e
  reaproveita a instância Nest entre invocações (bootstrap uma vez).

### Front
- **CA-11** — App Vite + React + TS `strict` builda; variável `VITE_*`
  ausente ou inválida mostra erro na subida nomeando a variável.
- **CA-12** — `styles.css` define os tokens de cor, tipografia, raio e
  espaçamento do `layout.md` §1–3 e as classes do Nocturne (`.btn*`,
  `.tag*`, `.card*`, `.field`, `.input`, `.radio`, `.nav*`, `.table`,
  `.dialog*`), com Raleway.
- **CA-13** — O cliente da API é gerado pelo orval a partir do
  `openapi.json`; a página inicial temporária mostra o status de
  `/v1/health` através dele; o CI do front falha se o cliente gerado
  divergir do `openapi.json` publicado.

### Qualidade e operação
- **CA-14** — ESLint + Prettier nos dois repositórios; hook de pré-commit
  (husky + lint-staged) roda só lint e formatação.
- **CA-15** — Cada repositório tem workflow de CI que roda lint, testes e
  build em push e PR.
- **CA-16** — `AGENTS.md` (seção Comandos e Estado atual) lista apenas
  comandos que rodaram nesta máquina e o estado real do projeto.
