# Rodada 1 — 003-dados-iniciais

data: 2026-11-05T17:22:19.457Z
agente: aa06c9205c0c2c0c5
back: 098ddbe arvore=dacce2a75e320c7ebb8cd8bdb746129983e8b4ab limpo=sim
front: a0c6665 arvore=b21a143a1c945e334b864da6f476753e4d83e58e limpo=sim
spec-sha: 561a88a714b0fa5a

Spec: docs/specs/003-dados-iniciais/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/equipment-schema.db-spec.ts:28,47,58,65,77,85,96 | ATENDIDO | Roda em Postgres real. Cobre as colunas opcionais, patrimônio obrigatório, duplicado recusado no mesmo tenant e aceito em outro, e as categorias permitidas e inválidas. A migration está em back/prisma/migrations. |
| CA-02 | back/test/db/seed-iniciais.db-spec.ts:30,45; back/test/dados-iniciais.spec.ts:30,36,44,48,54,68 | ATENDIDO | Os 12 itens foram gravados com os mesmos dados da lista, 3 em manutenção e 9 disponíveis, imagem `<patrimônio>.jpg`. O teste da linha 68 compara com `equipamentos.json` e `creditos.json` da skill. |
| CA-03 | back/test/db/seed-iniciais.db-spec.ts:59,70,92; back/test/seed-iniciais.spec.ts:12 | ATENDIDO | A segunda execução mantém 12 linhas e informa 0 criadas. Linha divergente não muda. O código só chama `createMany` com `skipDuplicates` (seed-iniciais.ts:39), sem update. |
| CA-04 | back/test/db/seed-iniciais.db-spec.ts:104; back/test/seed-iniciais.spec.ts:21,25 | ATENDIDO | Não cria empréstimo, membership nem usuário, e não há senha no código nem no arquivo de dados. |
| CA-05 | back/test/seed-iniciais-alvo.spec.ts:47-151; hooks/regras.test.mjs:72,84,89,138,154 | ATENDIDO | Cobre `--alvo local` recusando host remoto e `--alvo producao` (terminal interativo, `DATABASE_URL` só do processo, host local recusado, digitação do ref). O hook nega o seed em produção. |
| CA-06 | skills/imagens-equipamentos/scripts/enviar.test.mjs:29-186 | ATENDIDO | Cobre conflito 409 e 400 com 409 no corpo, "já existia", aviso de conteúdo diferente, `--substituir` e conferência 800x600 da URL pública. |
| CA-07 | - | AGUARDA PRODUÇÃO | Não há arquivo em evidencias/. |
| CA-08 | - | AGUARDA PRODUÇÃO | Não há arquivo em evidencias/. |
| CA-09 | - | AGUARDA PRODUÇÃO | Não há arquivo em evidencias/. |
| CA-10 | - | AGUARDA PRODUÇÃO | Não há arquivo em evidencias/. |

Checks: back `cd back && npm test` → passou (jest unit: 11 suites, 61 testes; jest db: 8 suites, 59 testes)
Checks: back `cd back && npm run build` → passou
Checks: raiz `node --test hooks/regras.test.mjs` → passou (97 testes, 0 falhas)
Checks: raiz `cd skills/imagens-equipamentos/scripts && npm test` → passou (44 testes, 0 falhas)
Checks: front não tocado, `npm test` e `npm run build` não rodados
Fora de escopo: nada encontrado. A única edição fora de tasks.md é em agents/verificador-spec.md (+3 linhas, instruindo a procurar em skills/hooks e rodar os testes deles), que está dentro do escopo da T6, cuja finalidade é liberar a verificação do CA-05.
Veredito: PRONTA PARA PRODUÇÃO
