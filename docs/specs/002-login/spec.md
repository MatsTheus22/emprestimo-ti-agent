# 002 — Login

PRD item 1: "Login. Cada pessoa vê os próprios empréstimos." Esta spec cobre
a autenticação e a identificação da pessoa; a lista de empréstimos é da 006.

## Decisões (respostas às perguntas, aprovadas em 2026-10-19)

- E-mail e senha via Supabase Auth; cadastro só por convite (ADR-001 §7).
- Papel e tenant vêm da `memberships`, levados no token por um custom access
  token hook (`tenant_id`, `app_role`); a tela não escolhe papel.
- Recuperar/trocar senha fora desta versão (Operações refaz pelo painel).
- Após entrar: Colaborador → Catálogo, Operações → Operações; enquanto essas
  telas não existem, página "Em construção" dentro do shell.
- Usuário autenticado sem membership: API responde 403; a tela mostra
  "Seu usuário não tem acesso. Fale com Operações."
- Erro de credencial: sempre "E-mail ou senha incorretos".

## Critérios de aceitação

- **CA-01** — O token emitido pelo Supabase Auth para um usuário com
  membership traz os claims `tenant_id` e `app_role` da membership; usuário
  sem membership recebe token sem esses claims.
- **CA-02** — `GET /v1/me` com token válido responde `200` com
  `{ userId, displayName, role, tenant: { id, slug, name } }`.
- **CA-03** — `GET /v1/me` sem token, com token expirado ou com assinatura
  inválida responde `401` em Problem Details.
- **CA-04** — `GET /v1/me` com token válido mas sem `tenant_id`/membership
  responde `403` em Problem Details.
- **CA-05** — Isolamento: com token cujo claim `tenant_id` é o tenant B,
  `/v1/me` nunca devolve dados do tenant A — nem quando o mesmo usuário também
  tem membership em A, nem quando o tenant A é enviado em query ou body
  (tenant vem só do claim).
- **CA-06** — A tela de Login (layout.md §5.1) entra com e-mail e senha;
  credencial errada mostra "E-mail ou senha incorretos".
- **CA-07** — Após entrar, Colaborador cai em `/catalogo` e Operações em
  `/operacoes` (página "Em construção"), com a barra de navegação (§6)
  mostrando abas do papel, etiqueta do papel, avatar com iniciais, nome e "Sair".
- **CA-08** — Rota interna sem sessão redireciona para `/login`; "Sair" encerra
  a sessão e volta para `/login`; recarregar a página mantém a sessão.
- **CA-09** — Usuário sem membership vê "Seu usuário não tem acesso. Fale com
  Operações." e o botão "Sair".
