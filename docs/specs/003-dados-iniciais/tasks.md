# 003 — Dados iniciais · Tarefas

Spec: [spec.md](spec.md). Plano: [plan.md](plan.md). Uma tarefa = um commit. Branch
`003-dados-iniciais` em back e na raiz; `front/` não muda.

## Agente: back
- [x] **T1** — Migration das colunas de imagem e créditos, `asset_tag` NOT NULL, índice
  único e CHECK de `category`; testes de constraint em container. Pede antes o
  consentimento do `migrate reset` local. **CA-01**
- [x] **T2** — `prisma/dados/equipamentos-iniciais.json` e teste contra as listas da skill. **CA-02**
- [x] **T3** — `seedEquipamentos` e `npm run seed:iniciais`; testes de criação,
  repetição, linha alterada e ausência de empréstimo, membership e senha. **CA-02**, **CA-03**, **CA-04**
- [x] **T4** — Controle de `--alvo` (local e produção) com testes; `PIXABAY_API_KEY`
  sem valor em `back/.env.example`. **CA-05**

## Agente: raiz
- [x] **T5** — `enviar.mjs` sem sobrescrever por padrão e com `--substituir`; testes,
  conferência no Supabase local e `SKILL.md`. **CA-06**
- [ ] **T6** — Hook bloqueia `seed:iniciais` com `--alvo producao` e libera ao verificador
  `node --test hooks/regras.test.mjs`, com testes. **CA-05**

## Verificação antes de produção
- [ ] **T7** — Verificador com veredito PRONTA PARA PRODUÇÃO; PR do back, pedindo antes
  para o push. **CA-01**, **CA-02**, **CA-03**, **CA-04**, **CA-05**, **CA-06**

## Usuário: produção (ordem em plan.md)
- [ ] **P1** — Merge do PR do back (CI aplica a migration). **CA-08**
- [ ] **P2** — Conta pelo painel do Auth e membership por SQL; login no link da Vercel. **CA-07**
- [ ] **P3** — Envio das imagens e script de dados. **CA-08**, **CA-09**
- [ ] **P4** — Repetir envio e script; gravar as evidências em `evidencias/`. **CA-07**, **CA-08**, **CA-09**, **CA-10**

## Fechamento
- [ ] **T8** — Verificador com veredito PRONTA; `Status: PRONTA` em spec.md; PR do
  repositório do agente. **CA-07**, **CA-08**, **CA-09**, **CA-10**
