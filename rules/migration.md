---
description: Procedimento para qualquer mudança de schema
globs: ["back/prisma/**", "back/src/modules/**/*.repository.ts"]
alwaysApply: false
---

# Mudança de schema
> leitor: agente

## Quando
Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso — inclusive quando a mudança
parecer trivial.

## Procedimento
1. Antes de gerar qualquer coisa: escreva o DDL pretendido na resposta
   e PARE. Eu aprovo ou corrijo.
2. Gere a migration com Prisma Migrate. `prisma migrate dev` NÃO funciona
   aqui: o shadow database não tem o schema `auth` do Supabase e a
   `init_schema` referencia `auth.users`. Em vez dele:
   - altere `prisma/schema.prisma`;
   - gere o SQL com `npx prisma migrate diff --from-schema-datamodel
     <schema anterior (git show HEAD:prisma/schema.prisma)>
     --to-schema-datamodel prisma/schema.prisma --script`;
   - grave em `prisma/migrations/<AAAAMMDDHHMMSS UTC>_<nome>/migration.sql`.
   Uma migration por tarefa. Prisma Migrate é o único dono do schema
   (ADR-001); objeto que o Prisma não modela (ex.: policy de RLS) entra
   como SQL bruto dentro da mesma migration.
3. Toda tabela nova nasce com Row Level Security habilitada e pelo
   menos uma policy explícita na mesma migration. Tabela sem policy
   não entra no repositório.
4. Se a tabela já tem dado, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de default ou de um
   passo de preenchimento.
5. Rode `npm run test:db` (aplica as migrations num container novo).
   Depois aplique no banco local com `npx prisma migrate reset --force`:
   o Prisma exige consentimento explícito do usuário na conversa
   (variável `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` com o texto
   literal da mensagem dele). Peça a cada migration — o usuário aceitou
   esse fluxo em 2026-10-19. Rode `npm test` ao final.

## Verificação
`npx prisma migrate reset` numa máquina limpa aplica todas as
migrations do zero, sem erro e sem nenhum passo manual.

## Não faça
- Não altere schema pelo Studio nem por SQL avulso. O que não está em
  migration não existe.
- Não use a Supabase CLI (`supabase migration new` / `supabase db
  reset`) para schema — ADR-001 decidiu Prisma Migrate como único
  dono; dois donos de schema no mesmo banco se sobrescrevem.
- Não edite migration que já foi para o repositório remoto. Escreva
  a próxima.