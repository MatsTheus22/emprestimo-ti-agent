# Rodada 2 — 002-login

data: 2026-11-05T13:54:49.705Z
agente: a0d45db2d25a7769d
back: af46491 arvore=e8ed45c2a217ee6271b1c9ee0b3fbd8acaa72128 limpo=sim
front: a0c6665 arvore=b21a143a1c945e334b864da6f476753e4d83e58e limpo=sim
spec-sha: 69f6b12fe6879718

Spec: docs/specs/002-login/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/auth-hook.db-spec.ts:51, :63, :71 | ATENDIDO | O teste roda a função do hook contra Postgres real, como `supabase_auth_admin`. O token real do Supabase Auth não é exercitado, mas a spec não exige isso. |
| CA-02 | back/test/db/me.db-spec.ts:58 | ATENDIDO | Verifica status 200 e o corpo completo. |
| CA-03 | back/test/db/me.db-spec.ts:70, :78-100, :149 | ATENDIDO | Cobre sem token, expirado, chave estrangeira, emissor errado e malformado. Verifica 401 em `application/problem+json`. |
| CA-04 | back/test/db/me.db-spec.ts:102 (falha), :113 | REPROVADO | `test_ca_04_token_sem_tenant_responde_403` recebe 401 e espera 403. Causa: back/src/modules/auth/auth.guard.ts:42 lança `UnauthorizedException(NO_ACCESS_MESSAGE)` quando faltam os claims. Deveria ser 403 (`ForbiddenException`). O teste de membership removida (:113) passa. |
| CA-05 | back/test/db/me.db-spec.ts:123, :139 | ATENDIDO | O tenant vem só do claim, mesmo com tenant A enviado em query e header. Não há teste que envie o tenant A no body, mas `GET /v1/me` não tem body. |
| CA-06 | front/src/app/login-flow.test.tsx:120 | ATENDIDO | Credencial errada mostra a mensagem "E-mail ou senha incorretos". A entrada com e-mail e senha é exercitada em :128 e :142. |
| CA-07 | front/src/app/login-flow.test.tsx:128, :142 | ATENDIDO | Verifica rota, abas, etiqueta do papel, iniciais, nome e "Em construção". O botão "Sair" é exercitado em :166, mas nenhum teste de CA-07 o afirma na barra. |
| CA-08 | front/src/app/login-flow.test.tsx:113, :159, :166; front/src/vercel-config.test.ts:14 | ATENDIDO | Cobre redirecionamento sem sessão, sessão existente entrando direto, "Sair" e o rewrite da SPA na Vercel. "Recarregar mantém a sessão" é provado só por sessão pré-existente simulada, não por reload real. |
| CA-09 | front/src/app/login-flow.test.tsx:177 | ATENDIDO | Mostra a mensagem de sem acesso e o botão "Sair" funciona. |

Checks: back npm test → falhou (suíte unitária 29/29 passou; suíte db 39/40, falha em test_ca_04_token_sem_tenant_responde_403)
Checks: back npm run build → passou
Checks: front npm test → passou (40/40)
Checks: front npm run build → passou
Fora de escopo: front redireciona o Colaborador de `/operacoes` para `/catalogo` (login-flow.test.tsx:152), e a spec não pede isso. A spec só define a rota de destino após o login. O restante do que a spec cobre foi encontrado sem excesso.
Veredito: NÃO PRONTA — CA-04 reprovado: o token sem tenant_id responde 401 no lugar de 403 (back/src/modules/auth/auth.guard.ts:42).
