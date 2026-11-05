# Diário de decisões da prática

Fonte para o ENTREGA.md. Registra só o que aconteceu; toda decisão também vai
para a spec correspondente. A senha padrão da turma nunca entra aqui.

## Conflitos

| pedido | contraria | decisão (minha) | motivo |
|---|---|---|---|
| Verificador corrige teste quebrado (tech lead) | Requisito "Independência" do enunciado, rules/spec-flow.md | Recusado | O enunciado fixa: quem corrige é o agente principal |
| Instalar `sharp` (briefing de dados, item 4) | ADR-001, rules/restrictions.md, contrato da skill | Primeiro decidimos NÃO usar: o CDN do Pexels recortava em 800×600 (testado em 2 fotos). Depois da troca para o Pixabay, decidimos USAR `sharp` | A documentação do Pixabay não oferece recorte em tamanho exato, só tamanhos fixos: é preciso redimensionar localmente |
| Senha escrita no arquivo que popula (briefing de dados, item 5) | Regra "nenhuma senha em código ou no git", rules/secrets.md | Recusado; conta criada por fora | O enunciado fixa |
| 14 dias úteis (briefing de empréstimo, item 3) | PRD: 14 dias; layout.md: hoje + 14 dias | 14 dias corridos | Regra de negócio é do PRD |
| Limite de 5 (briefing de empréstimo, item 4) | PRD: 3 itens | 3 | Regra de negócio é do PRD |
| Catálogo sem crédito (briefing de empréstimo, item 9) | Contrato da skill: crédito na tela com link | "Fotos: Pixabay" com link fica | Exigência do contrato, agora aplicada à nova fonte |
| TI-0004 e TI-0007 em manutenção (briefing) × TI-0004, TI-0007 e TI-0010 (lista) | Dois trechos do enunciado | Segue a lista: 3 em manutenção, 9 disponíveis. Primeiro escolhi o briefing; revi antes de implementar | "Entendi pelo documento que a lista é mais definitiva que o briefing, que pode estar errado" |
| "Com {pessoa}" no card (layout.md §5.2 e §7.7) | Briefing, item 9; layout.md §7.11 | Card mostra só a situação; layout.md será alterado | Decidido em 2026-11-05 |
| Conta com senha padrão | ADR-001 §7, cadastro por convite | Criada por fora, por mim | Cadastro segue fechado |

## Prova do verificador (spec 002-login)

Erro plantado: em `back/src/modules/auth/auth.guard.ts`, 401 em vez de 403 para token válido sem acesso, quebrando o CA-04. Commit `af46491`; desfeito em `43a325a`, com a mesma árvore da `main`. Branch `prova-verificador`, nunca mergeada. O verificador não foi avisado do erro.

| rodada | back | veredito | CA-04 |
|---|---|---|---|
| 1 | 2358293 (main) | PRONTA | ATENDIDO |
| 2 | af46491 (erro) | NÃO PRONTA | REPROVADO |
| 3 | 43a325a (desfeito) | PRONTA | ATENDIDO |

- O verificador achou o arquivo e a linha da causa e não corrigiu nada; o repositório continuou limpo.
- Ao vivo, com a rodada 2 como a última, o hook bloqueou o Edit de "Status: PRONTA". Depois da rodada 3, `checar-spec` liberou.
- Defeito achado durante a prova (corrigido em `ce8fdf9`): uma execução com o erro plantado reprovou o CA-04, mas não gerou arquivo de rodada. O agente entregou só pela ferramenta `SubagentHandback`, sem texto final, e o hook só lia o texto final. A spec continuou bloqueada, então não houve aprovação falsa. Agora o hook lê também a entrega e o transcript e não duplica por execução. O verificador rodou de novo, e essa é a rodada 2 gravada. Não escrevi rodada à mão.
- Limite da comparação: status, veredito e hashes são comparáveis. O texto livre varia. A rodada 2 citou como fora de escopo o redirecionamento de `/operacoes` para o colaborador, e as rodadas 1 e 3, com a mesma regra de front, não citaram.
- Falso positivo do hook: o guarda lê o texto do comando e barrou comandos que só citavam a pasta de rodadas ou a linha de status. Mantive: bloquear a mais é seguro, e basta separar o comando ou usar Edit.
- O que as rodadas apontaram como limite da spec 002: CA-01 testa a função do hook sem emitir token pelo Auth; CA-08 simula a sessão, sem reload real.

## Mudança do professor (2026-11-05)

O professor avisou em sala, oralmente: a fonte de imagens passa a ser o Pixabay
(https://pixabay.com/), no lugar do Pexels, e haverá uma biblioteca de
dimensionação. Vale sobre o texto do enunciado. Motivo observado: a emissão de
novas chaves do Pexels estava pausada (tela da página da API).
O professor não indicou qual biblioteca; escolhi `sharp`, a que o briefing já citava.

## Verificador (etapa 1)

- Pedido do tech lead recusado: o verificador não tem Edit nem Write, e o hook só libera testes, build e git de leitura.
- Gatilho: hook, não instrução. O Stop não deixa encerrar com tarefas concluídas e sem spec pronta; o Edit de "Status: PRONTA" é bloqueado sem rodada aprovada para o código atual.
- Comparável: a rodada é gravada por hook a partir da resposta do verificador, com modelo fixo (`sonnet`), CAs em ordem e hashes; `comparar-rodadas.mjs` mostra duas lado a lado.
- Limite declarado: os hooks casam o texto do comando (a documentação avisa que isso não é fronteira de segurança). O `gh` logado nesta máquina poderia, por outro caminho, fazer merge; o que impede escrita de dados é a chave de produção fora do alcance do agente.
- CA de produção: status AGUARDA PRODUÇÃO e veredito PRONTA PARA PRODUÇÃO, porque a evidência só existe depois do deploy, que depende do PR.
- Os testes dos hooks pegaram um furo: `git -C back push origin HEAD:main` passava pelo bloqueio. Corrigido antes de ligar os hooks.

## Portabilidade do verificador

O agente pôs tudo em .claude/, e eu questionei: só funcionaria no Claude Code. Ficou em agents/ e hooks/, em Node puro; .claude/ só liga isso ao harness. Limite: bloqueio automático só existe onde há hooks. Em outro harness, a rodada e a checagem são comandos manuais.

## Lacunas

- Fotos geradas por IA: ficam de fora (campo `isAiGenerated` da API), porque o contrato pede registrar quem fotografou.
- Papel do professor: `colaborador`, nome "Marcelo Grilo". Primeiro escolhi acesso máximo; mudei ao saber que `operacoes` entra em "Em construção" (spec 002 CA-07).
- Situação "emprestado": gravada em `status`, com índice único parcial em `loans`.
- Concorrência: tratamento atômico e transacionado.
- Créditos da foto: colunas em `equipment`.
- Operações pode solicitar: sim.
- Busca e filtros do layout.md: fora de escopo.
- Empréstimos dos testes em produção: script de limpeza rodado por mim.
- Seed repetido: o que já existe fica como está.
- Numeração: `003-dados-iniciais` e `004-solicitar-emprestimo`.
- Landing: não existe; a entrada do sistema é o login.
- ENTREGA.md: raiz do repo do agente, com cópias idênticas em back e front.

## Senha antiga de usuários de demonstração

Removida do código em back (seed-demo). Continua no histórico do git de back e
deste repo. Era só de usuários locais antigos; conferi que nenhum existe em
produção. Os 6 usuários locais foram apagados em 2026-11-05, e a senha antiga agora é recusada (`invalid_credentials`).

## Onde o agente tentou decidir ou errou

- O agente afirmou que os docs não estavam versionados, com base em ARQUITETURA.md desatualizado. Corrigi: o repo do agente existia.
- A primeira leitura do agente não viu o conflito do TI-0010 entre a lista e o briefing; ele mesmo admitiu depois.
- O agente recomendou manter a senha antiga no histórico como se fosse opção livre, e tratou todas as 23 decisões como minhas. Perguntei se o HTML permitia, e ele reclassificou.
- O agente afirmou que bastava pedir 800×600 ao CDN do Pexels; a documentação não confirma, e ele corrigiu.
