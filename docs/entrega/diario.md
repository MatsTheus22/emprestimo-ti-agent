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
| TI-0010 em manutenção (lista) × só TI-0004 e TI-0007 (briefing) | Dois trechos do enunciado | TI-0004 e TI-0007 em manutenção; os outros 10 disponíveis | Confirmado em 2026-11-05. Motivo: PENDENTE |
| "Com {pessoa}" no card (layout.md §5.2 e §7.7) | Briefing, item 9; layout.md §7.11 | Card mostra só a situação; layout.md será alterado | Decidido em 2026-11-05 |
| Conta com senha padrão | ADR-001 §7, cadastro por convite | Criada por fora, por mim | Cadastro segue fechado |

## Mudança do professor (2026-11-05)

O professor avisou em sala, oralmente: a fonte de imagens passa a ser o Pixabay
(https://pixabay.com/), no lugar do Pexels, e haverá uma biblioteca de
dimensionação. Vale sobre o texto do enunciado. Motivo observado: a emissão de
novas chaves do Pexels estava pausada (tela da página da API).
O professor não indicou qual biblioteca; escolhi `sharp`, a que o briefing já citava.

## Lacunas

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
