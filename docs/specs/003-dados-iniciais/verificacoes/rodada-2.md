# Rodada 2 — 003-dados-iniciais

data: 2026-11-06T10:55:25.415Z
agente: a1d570acdfe316fd5
back: 098ddbe arvore=dacce2a75e320c7ebb8cd8bdb746129983e8b4ab limpo=sim
front: a0c6665 arvore=b21a143a1c945e334b864da6f476753e4d83e58e limpo=sim
spec-sha: 561a88a714b0fa5a

Spec: docs/specs/003-dados-iniciais/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/equipment-schema.db-spec.ts:28,47,58,65,77,85,96 | ATENDIDO | Roda em Postgres real (Testcontainers). Cobre as colunas opcionais, patrimônio obrigatório, duplicado recusado no mesmo tenant e aceito em outro, e as categorias válidas e inválidas. |
| CA-02 | back/test/db/seed-iniciais.db-spec.ts:30,45; back/test/dados-iniciais.spec.ts:30,36,44,48,54,68 | ATENDIDO | Os 12 itens têm os dados da lista (3 em manutenção, 9 disponíveis, imagem `<patrimônio>.jpg`). O teste da linha 68 compara com `equipamentos.json` e `creditos.json` da skill. |
| CA-03 | back/test/db/seed-iniciais.db-spec.ts:59,70,92; back/test/seed-iniciais.spec.ts:12 | ATENDIDO | A segunda execução mantém 12 linhas e informa 0 criadas. Linha divergente não muda. |
| CA-04 | back/test/db/seed-iniciais.db-spec.ts:104; back/test/seed-iniciais.spec.ts:21,25 | ATENDIDO | Não cria empréstimo, membership nem usuário. A busca por senha literal em back/prisma não achou nada. |
| CA-05 | back/test/seed-iniciais-alvo.spec.ts:47-151; hooks/regras.test.mjs:72,84,89,138,154 | ATENDIDO | Cobre `--alvo local` recusando host remoto e `--alvo producao` (terminal interativo, `DATABASE_URL` só do processo, host local recusado, digitação do ref). O hook nega o seed em produção. |
| CA-06 | skills/imagens-equipamentos/scripts/enviar.test.mjs:29-186 | ATENDIDO | Cobre conflito 409 e 400 com 409 no corpo, "já existia", aviso de conteúdo diferente, `--substituir` e conferência 800x600 da URL pública. |
| CA-07 | docs/specs/003-dados-iniciais/evidencias/login.md, login.png, banco.txt (consulta 3) | ATENDIDO | O login funcionou no link da Vercel. Mostra "Marcelo Grilo", papel COLABORADOR e 0 empréstimos do usuário. Não achei senha no código nem nos dados do back. A senha usada não aparece nas evidências. A imagem login.png não foi aberta aqui; vale o que login.md descreve. |
| CA-08 | docs/specs/003-dados-iniciais/evidencias/banco.txt (consultas 1, 2 e 3) | ATENDIDO | Os 12 equipamentos têm imagem, créditos e situação. São 9 disponíveis e 3 em manutenção (TI-0004, TI-0007, TI-0010). `emprestimos_total` é 0. |
| CA-09 | docs/specs/003-dados-iniciais/evidencias/imagens.txt | ATENDIDO | Os 12 arquivos foram enviados e a URL pública de cada um deu 800x600. O bucket tem 12 objetos. |
| CA-10 | docs/specs/003-dados-iniciais/evidencias/repeticao.txt | ATENDIDO | O envio repetido deu 0 enviados, 12 já existiam e 12 objetos. O script repetido deu "criadas: 0 · já existiam: 12 · total: 12". A falha intermediária (`prepared statement "s0"`, por falta de `pgbouncer=true`) está registrada. A execução seguinte passou. |

Checks: back `npm test` → passou (11 suites unit e 8 suites de banco, 59 testes de banco; a contagem do unit não foi relida nesta rodada)
Checks: back `npm run build` → passou
Checks: raiz `node --test hooks/regras.test.mjs` → passou (97 testes, 0 falhas)
Checks: raiz `npm test` em skills/imagens-equipamentos/scripts → passou (44 testes, 0 falhas)
Checks: front não tocado (sem commits nesta spec), `npm test` e `npm run build` não rodados
Fora de escopo: nada encontrado. O código de back (098ddbe) é o mesmo da rodada 1. Na raiz, a única edição fora de spec, plan e tasks é a de agents/verificador-spec.md (+3 linhas), que está dentro da T6. Desde a rodada 1 entraram só os arquivos de evidencias/.
Veredito: PRONTA
