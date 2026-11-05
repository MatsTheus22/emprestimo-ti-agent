# Rodada 3 — 002-login

data: 2026-11-05T13:57:25.741Z
agente: a052eda28cc3fd33a
back: 43a325a arvore=4dec46e96986da021141527b125b81ca80e11b79 limpo=sim
front: a0c6665 arvore=b21a143a1c945e334b864da6f476753e4d83e58e limpo=sim
spec-sha: 69f6b12fe6879718

Spec: docs/specs/002-login/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/auth-hook.db-spec.ts:51, :63, :71 | ATENDIDO | Os testes chamam `public.custom_access_token_hook` direto, com o papel `supabase_auth_admin`, contra Postgres real. Não emitem um token pelo Supabase Auth. Cobrem os dois casos: com membership traz `tenant_id` e `app_role`; sem membership não traz. |
| CA-02 | back/test/db/me.db-spec.ts:58 | ATENDIDO | Confere status 200 e o corpo completo `{userId, displayName, role, tenant}`. |
| CA-03 | back/test/db/me.db-spec.ts:70 (sem token), :95 (expirado, chave estranha, emissor errado, malformado), :149 (health público) | ATENDIDO | Confere status 401 e o corpo em Problem Details (`application/problem+json`). |
| CA-04 | back/test/db/me.db-spec.ts:102, :113 | ATENDIDO | Confere status 403, Problem Details e a mensagem. Cobre token sem `tenant_id` e membership removida depois do token. |
| CA-05 | back/test/db/me.db-spec.ts:123, :139 | ATENDIDO | Usuário com membership em A e B recebe só dados de B, mesmo com tenant A enviado em query e header. O teste não envia tenant no body. Fica sem teste de body porque `GET` não tem body. |
| CA-06 | front/src/app/login-flow.test.tsx:120 | ATENDIDO | Credencial errada mostra "E-mail ou senha incorretos" (`INVALID_CREDENTIALS`). Usa um gateway de sessão falso e `fetch` mockado, não o Supabase real. |
| CA-07 | front/src/app/login-flow.test.tsx:128, :142, :152 | ATENDIDO | Colaborador vai para `/catalogo` e Operações para `/operacoes`. Confere as abas, a etiqueta do papel, as iniciais, o nome e "Em construção". O botão "Sair" é conferido no teste do CA-08 (linha 166). |
| CA-08 | front/src/app/login-flow.test.tsx:113, :159, :166 | ATENDIDO | Rota interna sem sessão vai para `/login`, "Sair" chama `signOut` e volta ao login. "Recarregar mantém a sessão" é provado só por uma sessão preexistente no gateway falso, que entra direto. A persistência real do `supabase-js` não é exercitada. |
| CA-09 | front/src/app/login-flow.test.tsx:177 | ATENDIDO | Mostra a mensagem de sem acesso (403) e o botão "Sair" funciona. |

Nenhum CA está marcado "(produção)", e não há pasta `evidencias/`.

Checks: back (branch prova-verificador, 43a325a) npm test → passou (unit 29/29 e db 40/40)
Checks: back npm run build → passou
Checks: front (a0c6665) npm test → passou (40/40)
Checks: front npm run build → passou (só o aviso de chunk maior que 500 kB)
Fora de escopo: nada encontrado. O back tem só os endpoints `/v1/me` e `/v1/health`, e o `health` faz parte da trilha da 001. Não há CASL, recuperação de senha nem outras rotas.
Veredito: PRONTA
