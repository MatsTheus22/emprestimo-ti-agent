# 004 — Solicitar empréstimo · Tarefas

Spec: [spec.md](spec.md). Plano: [plan.md](plan.md). Uma tarefa = um commit. Branch
`004-solicitar-emprestimo` em back, front e na raiz.

## Agente: back
- [x] **T1** — Migration do índice parcial, das permissões e das policies; ajuste de
  `rls.db-spec.ts` para o claim `sub`; testes de escrita negada, papel inalterável, leitura
  só das próprias linhas e hook do token. Pede antes o consentimento do `migrate reset`
  local. **CA-01**, **CA-02**, **CA-03**, **CA-04**
- [x] **T2** — `GET /v1/equipment` com cursor, totais e isolamento; `openapi.json`.
  **CA-05**, **CA-06**
- [x] **T3** — `type` no Problem Details e `POST /v1/loans` transacionado, com testes de
  prazo, recusas, concorrência, rollback, auditoria e isolamento; `openapi.json`. **CA-08**,
  **CA-09**, **CA-10**, **CA-11**, **CA-12**, **CA-14**
- [x] **T4** — `GET /v1/loans/me` com cursor, totais e isolamento; `openapi.json`. **CA-15**
- [ ] **T5** — Script `limpar:emprestimos-teste`, com controle de alvo e conta protegida.
  **CA-17**, **CA-18**

## Agente: raiz
- [ ] **T6** — Hook bloqueia o script de limpeza com `--alvo producao`, com testes. **CA-18**
- [ ] **T7** — `layout.md` alterado, com a seção "Alterações". **CA-19**

## Agente: front
- [ ] **T8** — Cliente regenerado, classes `.dialog` e tela Catálogo com fotos, situações e
  crédito; ajuste do `login-flow.test.tsx`; teste do `layout.md`. **CA-07**, **CA-19**
- [ ] **T9** — Solicitar: modal, toast, motivos nos botões, banner e recusa da API. **CA-13**
- [ ] **T10** — Tela "Meus empréstimos". **CA-16**

## Verificação antes de produção
- [ ] **T11** — Verificador com veredito PRONTA PARA PRODUÇÃO; PRs de back e front, pedindo
  antes para o push. **CA-01**, **CA-02**, **CA-03**, **CA-04**, **CA-05**, **CA-06**,
  **CA-07**, **CA-08**, **CA-09**, **CA-10**, **CA-11**, **CA-12**, **CA-13**, **CA-14**,
  **CA-15**, **CA-16**, **CA-17**, **CA-18**, **CA-19**

## Usuário: produção (ordem em plan.md)
- [ ] **P1** — Conferir `loans`, merge do PR do back (CI aplica a migration) e merge do PR
  do front. **CA-20**
- [ ] **P2** — Consulta de grants e policies e tentativa real com `UPDATE ... WHERE false`;
  gravar em `evidencias/`. **CA-24**
- [ ] **P3** — Criar a conta de teste com membership; testes na tela; gravar as evidências.
  **CA-20**, **CA-21**, **CA-22**, **CA-23**
- [ ] **P4** — Rodar a limpeza e a consulta final; gravar a evidência. **CA-25**

## Fechamento
- [ ] **T12** — Verificador com veredito PRONTA; `Status: PRONTA` em spec.md; `AGENTS.md`,
  diário e handoff; PR do repositório do agente. **CA-20**, **CA-21**, **CA-22**, **CA-23**,
  **CA-24**, **CA-25**
