# Rodada 2 — 005-trocar-fotos

data: 2026-11-09T02:24:26.803Z
agente: a8934758d270aea23
back: b2c0b42 arvore=7fcad405ed1a00ae6258f91fcd2cc51095262f66 limpo=sim
front: 3055f55 arvore=8089cc70727ed21b9e2a8585240f62ab0a6ce3ad limpo=sim
spec-sha: 9ac0c1faf1d4fbca

Spec: docs/specs/005-trocar-fotos/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:72 | ATENDIDO | As 6 fotos atuais estão como reprovadas, com o motivo. Nesta rodada o teste passou. |
| CA-02 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:78 | ATENDIDO | As 4 reservas com marca estão como reprovadas, com o motivo. |
| CA-03 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:84, 90, 96, 100 | ATENDIDO | O teste só confere a transcrição. Que o usuário disse cada aprovação o teste não prova. |
| CA-04 | skills/imagens-equipamentos/scripts/decisoes-005.test.mjs:108, 118, 125, 133, 138 | ATENDIDO | Os testes leem `saida/final`, que existe nesta máquina. 0 pulados. |
| CA-05 | skills/imagens-equipamentos/scripts/enviar.test.mjs:52, 56, 61, 169, 182, 201, 215, 228, 242, 254 | ATENDIDO | Cobre hash igual, hash diferente, 404, 400 com `statusCode` 404, outra resposta como erro, troca não confirmada, repetir gravando 0 e o comportamento sem `--substituir`. |
| CA-06 | skills/imagens-equipamentos/scripts/conferir.test.mjs:96, 106, 120, 133, 143, 154, 164, 175, 183, 190, 198 | ATENDIDO | A parte do `SKILL.md` não tem teste e foi conferida só por leitura na rodada 1. |
| CA-07 | hooks/regras.test.mjs:131, 142, 147 | ATENDIDO | O hook nega `conferir.mjs --alvo producao`. Os 121 testes passaram. |
| CA-08 | back/test/dados-iniciais.spec.ts:101, 136 | ATENDIDO | Conferi também por leitura: `back/prisma/dados/equipamentos-iniciais.json` tem os 12 itens com origem e autor iguais aos de `banco.txt`. |
| CA-09 | back/test/db/atualizar-creditos.db-spec.ts:104, 171, 176 | ATENDIDO | Roda contra Postgres real em Testcontainers. Passou. |
| CA-10 | back/test/loans-repository-comentario.spec.ts:18, 23 | ATENDIDO | O diff de `src` entre `main` e `005-trocar-fotos` só troca o comentário em `loans.repository.ts`. |
| CA-11 | docs/specs/005-trocar-fotos/evidencias/imagens.txt:10-23, 25-41 | ATENDIDO | Antes do envio: exatamente TI-0001, 0004, 0006, 0007, 0008 e 0012 diferentes, "iguais: 6 de 12". O envio gravou essas 6 e não regravou as outras 6. O bucket ficou com 12 objetos. Os avisos "troca não confirmada" saem do CA-05 e não contradizem o CA-11. A confirmação veio no CA-12. |
| CA-12 | docs/specs/005-trocar-fotos/evidencias/imagens.txt:48-61 | ATENDIDO | "iguais: 12 de 12". |
| CA-13 | docs/specs/005-trocar-fotos/evidencias/banco.txt:14-123 | ATENDIDO | Os campos conferem com `equipamentos-iniciais.json`: image_path, origem, autor e licença. As 6 trocadas têm `updated_at` 2026-11-09 02:16:34.552 e as outras 6 têm 11-07 19:39:54.093 ou 11-06 10:38:42.046. A situação é 3 em manutenção (TI-0004, 0007, 0010) e 9 disponíveis. A comparação com `creditos.json` foi feita pela cópia em `equipamentos-iniciais.json`, que o CA-08 prova igual a ele. |
| CA-14 | docs/specs/005-trocar-fotos/evidencias/telas.md, catalogo-1.png a catalogo-4.png | ATENDIDO | Vi os 4 prints: "9 de 12 equipamentos disponíveis agora", os 12 cards com foto e "Fotos: Pixabay" sublinhado em catalogo-4.png. A conferência da foto de cada card é visual, sem teste automático. |
| CA-15 | docs/specs/005-trocar-fotos/evidencias/ | ATENDIDO | O Grep em `.txt` e `.md` não achou "@" nem host supabase.co. O ref aparece como `<ref do projeto>`. Os 4 prints mostram só "Conta de Teste", sem barra de endereço e sem e-mail. |

Checks: back `npm test` → passou (15 suites, 264 testes)
Checks: back `npm run build` → passou
Checks: skills/imagens-equipamentos/scripts `npm test` → passou (80 testes, 0 pulados)
Checks: raiz `node --test hooks/regras.test.mjs` → passou (121 testes)
Checks: back `git status --short -b` → passou (`005-trocar-fotos...origin/005-trocar-fotos`, limpo)
Checks: front `git status --short -b` → passou (`main...origin/main`, limpo, sem alteração desta spec)
Checks: raiz `git status --short -b` → passou (branch `005-trocar-fotos`, limpa)
Fora de escopo: nada encontrado. A raiz toca só `skills/imagens-equipamentos/`, `hooks/` e `docs/specs/005-trocar-fotos/`. O back toca só `equipamentos-iniciais.json`, o comentário em `loans.repository.ts` e testes.
Veredito: PRONTA
