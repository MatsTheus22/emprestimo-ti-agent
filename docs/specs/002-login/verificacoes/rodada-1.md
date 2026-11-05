# Rodada 1 — 002-login

data: 2026-11-05T13:45:56.325Z
back: 2358293 arvore=4dec46e96986da021141527b125b81ca80e11b79 limpo=sim
front: a0c6665 arvore=b21a143a1c945e334b864da6f476753e4d83e58e limpo=sim
spec-sha: 69f6b12fe6879718

Spec: docs/specs/002-login/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/auth-hook.db-spec.ts:51 (com membership), :63 (sem membership), :71 (usuário logado não chama o hook) | ATENDIDO | Os testes chamam `custom_access_token_hook` como `supabase_auth_admin`, em Postgres real. Eles não emitem token pelo Supabase Auth de ponta a ponta. O hook ligado no `config.toml` não é exercitado por teste. |
| CA-02 | back/test/db/me.db-spec.ts:58 | ATENDIDO | Verifica status 200 e o corpo completo `{userId, displayName, role, tenant}`. |
| CA-03 | back/test/db/me.db-spec.ts:70 (sem token), :95 (expirado, chave estranha, outro emissor, malformado), :149 (health continua público) | ATENDIDO | Verifica status 401 e corpo. O caso "sem token" também verifica o content-type `application/problem+json`. |
| CA-04 | back/test/db/me.db-spec.ts:102 (token sem tenant), :113 (claim de tenant sem membership no banco) | ATENDIDO | Verifica status 403 e o corpo em Problem Details. |
| CA-05 | back/test/db/me.db-spec.ts:123 (tenant A em query e header, token de B), :139 (token de B para usuário que só existe em A) | ATENDIDO | O teste de :123 manda o tenant A em query e header. Ele não manda no body, mas a rota é GET. Roda em Postgres real. |
| CA-06 | front/src/app/login-flow.test.tsx:120 | ATENDIDO | Verifica a mensagem de credencial errada, via `INVALID_CREDENTIALS`. O sucesso do login é coberto em :128 e :142. O `AuthGateway` é falso nos testes. O `createSupabaseAuth` real (`signInWithPassword` e o mapeamento de `invalid_credentials`) não tem teste. |
| CA-07 | front/src/app/login-flow.test.tsx:128 (Colaborador), :142 (Operações), :152 (Colaborador não abre `/operacoes`) | ATENDIDO | Verifica rota de destino, abas por papel, etiqueta do papel, iniciais "AR", nome e "Em construção". Não encontrei verificação do botão "Sair" nesses testes. Ele é clicado em :166 e :177. |
| CA-08 | front/src/app/login-flow.test.tsx:113 (sem sessão vai a `/login`), :159 (sessão existente entra direto), :166 (Sair), front/src/vercel-config.test.ts:14 (rewrite da SPA) | ATENDIDO | "Recarregar mantém a sessão" é simulado com uma sessão falsa já existente. A persistência real depende do `supabase-js` e não tem teste. |
| CA-09 | front/src/app/login-flow.test.tsx:177 | ATENDIDO | Verifica a mensagem `NO_ACCESS` e o botão "Sair". O teste confere a constante `NO_ACCESS` e não o texto literal da spec. A mensagem do back tem o mesmo texto (me.db-spec.ts:109). |

status: ATENDIDO · REPROVADO · SEM TESTE · AMBÍGUO · AGUARDA PRODUÇÃO

Não há CA marcado "(produção)" e a pasta `evidencias/` não existe.

Checks: back `npm test` → passou (jest: 8 suítes e 29 testes; jest.db: 6 suítes e 40 testes)
Checks: back `npm run build` → passou
Checks: front `npm test` → passou (4 arquivos, 40 testes)
Checks: front `npm run build` → passou (apenas aviso de chunk acima de 500 kB)
Checks: back e front `git status --short` → limpo nos dois
Fora de escopo: nada encontrado. O back expõe só `/v1/me` e `/v1/health`. O front tem login, shell com navegação, "Em construção" e tela sem acesso. Não vi recuperação de senha nem CASL.
Veredito: PRONTA
