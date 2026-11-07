# Rodada 2 — 004-solicitar-emprestimo

data: 2026-11-07T19:48:30.951Z
agente: a68c1b2f0c7527959
back: 3b9296b arvore=8955ca14a112935eb44c858de8b1c42e6305fbda limpo=sim
front: 41318bf arvore=8089cc70727ed21b9e2a8585240f62ab0a6ce3ad limpo=sim
spec-sha: 47a8c9629bcdef82

Spec: docs/specs/004-solicitar-emprestimo/spec.md

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | back/test/db/loans-index.db-spec.ts:39, :47, :56 | ATENDIDO | índice parcial: recusa o segundo aberto, aceita depois da devolução |
| CA-02 | back/test/db/permissoes.db-spec.ts:112, :120, :132, :152, :164, :176, :184, :197, :212, :227 | ATENDIDO | escrita e TRUNCATE negados, tabela nova sem escrita, papel, membership, tenant e auditoria |
| CA-03 | back/test/db/permissoes.db-spec.ts:249, :254, :258, :262, :275 | ATENDIDO | só as próprias linhas; leitura por tenant mantida |
| CA-04 | back/test/db/permissoes.db-spec.ts:288, :301 | ATENDIDO | hook do token entrega tenant_id e app_role |
| CA-05 | back/test/db/equipment.db-spec.ts:133, :166, :210, :218, :228, :235, :241, :262 | ATENDIDO | 401, 403, cursor, totais e isolamento (tenant só do token) |
| CA-06 | back/test/db/equipment.db-spec.ts:271, :288, :298, :306, :325 | ATENDIDO | outra pessoa: só `emprestado`; própria: dueAt |
| CA-07 | front/src/pages/CatalogPage.test.tsx:105, :138, :150, :162, :175, :197; front/src/app/login-flow.test.tsx:139 | ATENDIDO | os quatro casos de card e "Fotos: Pixabay" com link |
| CA-08 | back/test/db/loans-create.db-spec.ts:114, :145, :168, :249, :517, :530 | ATENDIDO | 201, due_at em SP, sessão em outro fuso, auditoria e rollback |
| CA-09 | back/test/db/loans-create.db-spec.ts:286, :295, :306 | ATENDIDO | 409 com `type` próprio |
| CA-10 | back/test/db/loans-create.db-spec.ts:322, :333, :342, :360 | ATENDIDO | 409 com `type` próprio |
| CA-11 | back/test/db/loans-create.db-spec.ts:371, :381, :392, :401, :418 | ATENDIDO | atraso vence o limite |
| CA-12 | back/test/db/loans-create.db-spec.ts:428, :445, :456, :471, :482 | ATENDIDO | concorrência em Postgres real |
| CA-13 | front/src/pages/CatalogRequest.test.tsx:121, :216, :239, :252, :264, :301, :317 | ATENDIDO | motivos nos botões, banner com atalho, recusa da API com catálogo atualizado |
| CA-14 | back/test/db/loans-create.db-spec.ts:545, :565, :579, :586, :596, :606, :622 | ATENDIDO | tenant e usuário só do token; 404, 401, 403, 400 |
| CA-15 | back/test/db/loans-me.db-spec.ts:104, :148, :171, :207, :215, :238, :265, :277, :292 | ATENDIDO | só os abertos da própria pessoa; 401, 403 e isolamento |
| CA-16 | front/src/pages/MyLoansPage.test.tsx:81, :89, :101, :116, :165, :175; front/src/app/login-flow.test.tsx:172 | ATENDIDO | contagem, barra, data em SP, pills, estado vazio e sem "Devolver" |
| CA-17 | back/test/limpar-emprestimos-alvo.spec.ts:51, :55, :73; back/test/db/limpar-emprestimos.db-spec.ts:105, :116, :128, :157, :175, :221, :230, :241 | ATENDIDO | inclui conta protegida sem diferenciar maiúscula e ausência do e-mail de teste no código |
| CA-18 | back/test/limpar-emprestimos-alvo.spec.ts:101, :109, :117, :126, :134, :145; hooks/regras.test.mjs:99, :115, :122 | ATENDIDO | alvo local e produção, confirmação do ref; hook bloqueia o agente |
| CA-19 | front/src/layout-doc.test.ts:14, :18, :25, :30 | ATENDIDO | lê o layout.md da raiz |
| CA-20 | evidencias/telas.md; catalogo-1.png, catalogo-2.png, catalogo-3.png | ATENDIDO | prints mostram TI-0001 a TI-0012 com foto, "9 de 12 disponíveis" e "Fotos: Pixabay" sublinhado no fim (o link em si só aparece como texto sublinhado; o destino é provado por teste do CA-07) |
| CA-21 | evidencias/telas.md; manutencao.png; catalogo-2.png, catalogo-3.png | ATENDIDO | TI-0004, 0007 e 0010 com "Em manutenção" e botão "Indisponível" desabilitado; recusa da API está no CA-09 |
| CA-22 | evidencias/telas.md; solicitar.png; meus-emprestimos.png | ATENDIDO | "8 de 12", "Com você · devolver até 21/11/2026", "Está com você"; Meus empréstimos: 1 de 3, retirada 07/11/2026, devolver até 21/11/2026, "Em dia" |
| CA-23 | evidencias/telas.md; limite.png; limpeza.txt | ATENDIDO | botão "Limite de 3 itens" desabilitado em disponíveis; os 3 abertos (TI-0001 a TI-0003) constam em limpeza.txt; recusa da API está no CA-10 |
| CA-24 | evidencias/permissoes.txt | ATENDIDO | consulta 1: só SELECT para anon e authenticated nas 5 tabelas e em _prisma_migrations; consulta 2: 6 policies batem com a migration 20261106112807 (+ memberships_auth_hook_read da 20261019132041), as `*_isolation` antigas não existem mais; consulta 3: permission denied nas 5 tabelas com ROLLBACK |
| CA-25 | evidencias/limpeza.txt | ATENDIDO | script apagou 3 e devolveu 3; conta protegida com 0; consulta final: 0 empréstimos no total, 0 do Marcelo, 9 disponíveis e 3 em manutenção; e-mail e ref anonimizados |

status: ATENDIDO · REPROVADO · SEM TESTE · AMBÍGUO · AGUARDA PRODUÇÃO

Checks: raiz node --test hooks/regras.test.mjs → passou (110 de 110)
Checks: back npm test → passou (14 suítes e 261 testes de banco no bloco final, em Testcontainers; o stack trace impresso em loans-create é erro esperado logado por teste que passou; rodado sozinho, sem build em paralelo, sem repetição)
Checks: back npm run build → passou
Checks: front npm test → passou (8 arquivos, 99 testes)
Checks: front npm run build → passou (só o aviso de chunk maior que 500 kB)
Checks: git status de back (HEAD 3b9296b) e front (HEAD 41318bf) → limpos
Fora de escopo: nada encontrado
Veredito: PRONTA
