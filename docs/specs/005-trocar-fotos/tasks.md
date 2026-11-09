# 005 — Trocar fotos em produção · Tarefas

Spec: [spec.md](spec.md). Plano: [plan.md](plan.md). Uma tarefa = um commit. Branch
`005-trocar-fotos` no back e na raiz. O front não muda.

## Agente: back
- [x] **T1** — Criar a branch no back e substituir a alteração sem commit de
  `loans.repository.ts` pelo comentário do CA-10, com o teste do texto. **CA-10**

## Agente: skill e hook
- [x] **T2** — `enviar.mjs --substituir` compara o hash antes de gravar, com testes. **CA-05**
- [x] **T3** — `conferir.mjs` com testes; `SKILL.md` descreve o comando e o novo `--substituir`.
  **CA-06**
- [x] **T4** — Hook bloqueia `conferir.mjs` com `--alvo producao`, com testes. Commit próprio,
  separado do código. **CA-07**

## Agente e usuário: fotos
- [x] **T5** — Rodar `buscar.mjs --somente TI-0001,TI-0006,TI-0007,TI-0012`, acrescentando termos
  em `buscas-alternativas.json` se preciso; entregar a folha de contato e PARAR para a revisão do
  usuário. **CA-03**
- [x] **T6** — Transcrever em `decisoes.json` o que o usuário decidiu, o que a spec já registra e
  as novas aprovações; rodar `fechar.mjs`; escrever os testes das decisões e dos créditos.
  **CA-01**, **CA-02**, **CA-03**, **CA-04**

## Agente: créditos e banco
- [x] **T7** — Atualizar `equipamentos-iniciais.json` no back, com o teste. **CA-08**
- [x] **T8** — Escrever `atualizar-creditos.sql` na pasta da spec, com os valores de
  `creditos.json`. **CA-09**
- [x] **T9** — Teste do SQL em Postgres real no back. **CA-09**
- [x] **T10** — No ambiente local: `enviar.mjs --alvo local --substituir`, `conferir.mjs --alvo
  local`, o SQL e a consulta das 12 linhas. Mostrar a saída; sem arquivo novo, sem commit. **CA-05**,
  **CA-06**, **CA-09**

## Verificação antes de produção
- [x] **T11** — Verificador com veredito PRONTA PARA PRODUÇÃO (back limpo; front sem alteração);
  PR do back, pedindo antes para o push. **CA-01**, **CA-02**, **CA-03**, **CA-04**, **CA-05**,
  **CA-06**, **CA-07**, **CA-08**, **CA-09**, **CA-10**

## Usuário: produção (ordem em plan.md)
- [x] **P1** — Merge do PR do back. **CA-08**
- [x] **P2** — Conferir antes (6 diferentes), enviar com `--substituir` e conferir até 12 de 12;
  gravar `imagens.txt`. **CA-11**, **CA-12**
- [x] **P3** — Colar o SQL e rodar a consulta das 12 linhas; gravar `banco.txt`. **CA-13**
- [x] **P4** — Depois do 12 de 12, tirar os prints do catálogo; gravar `telas.md` e os prints, sem
  o e-mail da conta de teste nem o ref do projeto. **CA-14**, **CA-15**

## Fechamento
- [x] **T12** — Conferir marcadores nas evidências e rodar o verificador até o veredito PRONTA;
  registrar `Status: PRONTA`; atualizar o estado do projeto em `AGENTS.md`; PR da raiz, pedindo
  antes para o push. `docs/handoff.md` e `docs/entrega/diario.md` são escritos no disco, sem tirar
  a marca `skip-worktree`, e não entram em commit. **CA-11**, **CA-12**, **CA-13**, **CA-14**,
  **CA-15**
