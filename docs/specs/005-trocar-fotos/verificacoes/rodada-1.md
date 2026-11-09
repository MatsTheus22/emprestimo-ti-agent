# Rodada 1 — 005-trocar-fotos

data: 2026-11-09T01:46:20.074Z
agente: ac3d0d56fc41f1fd0
back: b2c0b42 arvore=7fcad405ed1a00ae6258f91fcd2cc51095262f66 limpo=sim
front: 3055f55 arvore=8089cc70727ed21b9e2a8585240f62ab0a6ce3ad limpo=sim
spec-sha: 9ac0c1faf1d4fbca

Spec: docs/specs/005-trocar-fotos/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:72 | ATENDIDO | As 6 fotos atuais estão como reprovadas, com o motivo da tabela. |
| CA-02 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:78 | ATENDIDO | As 4 reservas com marca estão como reprovadas, com o motivo. |
| CA-03 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:84, 90, 96, 100 | ATENDIDO | Os testes cobrem as aprovadas ditas pelo usuário, a 17768 movida para a TI-0007, 1 aprovada por item e as novas buscas sem reaproveitar candidata anterior. Que a aprovação foi dita pelo usuário não tem como o teste provar; o teste só confere a transcrição. |
| CA-04 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:108, 118, 125, 133, 138 | ATENDIDO | O teste de fechamento sem erros e o de 800x600 com o hash de `creditos.json` leem `saida/final`. `saida/` existe nesta máquina e nenhum teste foi pulado (0 skipped). |
| CA-05 | skills/imagens-equipamentos/scripts/enviar.test.mjs:52, 56, 61, 169, 182, 201, 215, 228, 242, 254 | ATENDIDO | Os testes cobrem hash igual, hash diferente, 404, 400 com `statusCode` 404, outra resposta como erro, foto antiga não confirmada, repetir gravando 0 e o comportamento sem `--substituir`. |
| CA-06 | skills/imagens-equipamentos/scripts/conferir.test.mjs:96, 106, 120, 133, 143, 154, 164, 175, 183, 190, 198 | ATENDIDO | Todos os comportamentos do script têm teste. A parte do `SKILL.md` (linhas 30-36 e 57-58) não tem teste e foi conferida só por leitura, e descreve o comando e o novo `--substituir`. |
| CA-07 | hooks/regras.test.mjs:131, 142, 147 | ATENDIDO | O hook nega `conferir.mjs --alvo producao` e o teste cobre o agente principal e o verificador. |
| CA-08 | back/test/dados-iniciais.spec.ts:101, 136 | ATENDIDO | Os créditos novos dos 6 itens estão em `equipamentos-iniciais.json` e iguais a `creditos.json` nos 12. |
| CA-09 | back/test/db/atualizar-creditos.db-spec.ts:104, 171, 176 | ATENDIDO | Os testes rodam contra Postgres real, com o tenant `suporte_ti` e um outro tenant. O terceiro cobre o `updated_at` em UTC com a sessão em outro fuso. O SQL tem `begin`, 6 UPDATE e `commit`. |
| CA-10 | back/test/loans-repository-comentario.spec.ts:18, 23 | ATENDIDO | O diff de `src` em `main..005-trocar-fotos` só troca o comentário em `loans.repository.ts`. O código da transação não muda. |
| CA-11 | docs/specs/005-trocar-fotos/evidencias/ não existe | AGUARDA PRODUÇÃO | Falta o arquivo gerado pelo usuário. |
| CA-12 | docs/specs/005-trocar-fotos/evidencias/ não existe | AGUARDA PRODUÇÃO | Falta o arquivo gerado pelo usuário. |
| CA-13 | docs/specs/005-trocar-fotos/evidencias/ não existe | AGUARDA PRODUÇÃO | Falta o arquivo gerado pelo usuário. |
| CA-14 | docs/specs/005-trocar-fotos/evidencias/ não existe | AGUARDA PRODUÇÃO | Falta o arquivo gerado pelo usuário. |
| CA-15 | docs/specs/005-trocar-fotos/evidencias/ não existe | AGUARDA PRODUÇÃO | Falta o arquivo gerado pelo usuário. |

Checks: back `npm test` → passou (15 suites, 264 testes)
Checks: back `npm run build` → passou
Checks: skills/imagens-equipamentos/scripts `npm test` → passou (80 testes, 0 pulados)
Checks: raiz `node --test hooks/regras.test.mjs` → passou (121 testes)
Checks: back `git status --short` → passou (árvore limpa)
Checks: raiz `git status --short` → passou (árvore limpa)
Checks: front `git status --short -b` → passou (`main...origin/main`, limpo, sem alteração da spec 005; os 3 últimos commits são da 004)
Fora de escopo: nada encontrado. No back, `main..005-trocar-fotos` toca só `equipamentos-iniciais.json`, o comentário em `loans.repository.ts` e testes. Na raiz, toca só `skills/imagens-equipamentos/`, `hooks/` e `docs/specs/005-trocar-fotos/`.
Veredito: PRONTA PARA PRODUÇÃO
