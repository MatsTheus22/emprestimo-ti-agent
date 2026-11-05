# 002 — Login · Plano

Spec: [spec.md](spec.md). Depende da fundação mínima da 001 (ver ordem em tasks.md).

## ADRs que restringem

- **ADR-001 §6:** o tenant vem do claim do JWT e é resolvido no guard, nunca do body. A membership fica em `(user_id, tenant_id, role)`.
- **ADR-001 §7:**
  - Login com Supabase Auth (e-mail e senha), com o token no header gerenciado pelo `supabase-js`.
  - A API valida o JWT via JWKS e autoriza com guards do Nest.
  - O CORS é uma allowlist.
- **ADR-001 §4:** rotas com prefixo `/v1`, erros em Problem Details e cliente gerado pelo orval.
- **ADR-001 §8 e rules/tests.md:**
  - O teste de isolamento roda contra Postgres real (Testcontainers).
  - Todo teste de endpoint verifica status e corpo.
- **ADR-002 e layout.md §5.1 e §6:** a tela de Login e a barra de navegação seguem o visual Nocturne.

## Desenho

- **Hook:** a função `public.custom_access_token_hook` (DDL aprovado) é criada numa migration do Prisma e ativada em `supabase/config.toml` (`[auth.hook.custom_access_token]`). O claim do papel se chama `app_role`, porque `role` já é um claim reservado do Postgres/Supabase.
- **Guard:** um `AuthGuard` global valida a assinatura, o `iss` e o `exp` com o `jose` (`createRemoteJWKSet` apontando para `SUPABASE_JWKS_URL`).
  - Depois põe `user_id`, `tenant_id` e `role` no contexto de request (`AsyncLocalStorage`).
  - Sem `tenant_id` no token, o guard responde 403.
  - Rotas públicas, como `/v1/health`, são marcadas com `@Public()`.
- **`/v1/me`:** segue `modules/me/` com Controller → Service → Repository. O repositório filtra por `user_id` e `tenant_id` vindos do contexto.
- **CASL:** fica fora desta spec, porque ainda não há regra por papel. Entra na 004, que é a primeira ação restrita a Operações.
- **Front:**
  - O `supabase-js` (`signInWithPassword` e `onAuthStateChange`) cuida da sessão.
  - O cliente gerado pelo orval usa um mutator que injeta `Authorization: Bearer`.
  - O React Router tem um loader que protege as rotas internas.
  - O TanStack Query busca `/v1/me` para montar a barra de navegação.
- **Nova dependência:** `jose` no back. Ela não estava no ADR-001, mas é a forma padrão de validar JWT via JWKS, que é o que o ADR pede.
