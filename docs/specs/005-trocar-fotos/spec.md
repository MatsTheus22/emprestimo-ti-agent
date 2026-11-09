# 005 — Trocar fotos em produção

O enunciado da prática exige: "Nenhuma foto com pessoa, marca ou logo legível, texto ou tela
com conteúdo chega ao sistema". Na revisão da spec 003, o usuário avaliou só se a foto mostrava
o equipamento certo, e 6 fotos publicadas descumprem o requisito. Objetivo: em produção, as 12
fotos cumprem as duas coisas, e os créditos no banco correspondem às fotos publicadas.

## Decisões

### Do pedido
- **Critério da foto nova:** mostrar o equipamento certo e respeitar o requisito acima.
- **Caminho:** a skill `imagens-equipamentos`: só Pixabay, 800x600 e sem repetição.
- **Aprovação:** o usuário aprova cada foto. O agente só transcreve o que ele disser.
- **Produção:** tudo que escreve é do usuário: o envio das fotos e os créditos no banco.
- **Specs fechadas:** 003 e 004 não são editadas. As evidências delas ficam como registro
  histórico, mesmo mostrando as fotos antigas.

### Respostas às perguntas (2026-11-07)
- **6 fotos, não 5:** o pedido inicial trocava 5. A TI-0008 entrou depois de o agente apontar
  "HDMI" em relevo no plugue, e o usuário decidiu trocá-la. Continuam TI-0002, TI-0003, TI-0005,
  TI-0009, TI-0010 e TI-0011.
- **Fotos sem nova busca:** o usuário aprovou as reservas 2425303 (TI-0004) e 1827 (TI-0008).
- **Fotos com nova busca:** TI-0001, TI-0006, TI-0007 e TI-0012.
- **TI-0007 com a 17768:** a 17768 veio na busca 2 como candidata da TI-0006, porque as duas
  buscavam monitor com os mesmos termos. O usuário a moveu para a TI-0007 depois de 4 buscas sem
  monitor para ela. A TI-0006 fica com a 17894 e sem reserva. A mudança foi feita em
  `saida/candidatas.json` e na pasta das candidatas, que o git ignora, e em `decisoes.json`, sem
  mudar código.
- **Créditos no banco:** SQL que o usuário cola no editor de produção, com 6 UPDATE em uma
  transação, setando também `updated_at`. O mesmo SQL roda no banco local. A prova é a consulta
  das 12 linhas contra `creditos.json`. Motivo proposto pelo chat de validação e aceito pelo
  usuário: é uma operação única, e a consulta prova o resultado sem um script novo para manter.
- **`--substituir` sem lista:** grava só quando o hash da URL pública difere do arquivo local.
  Motivo proposto pelo chat de validação e aceito pelo usuário: não exige lista digitada,
  repetir é seguro e as outras fotos não são regravadas. Isso substitui, na prática, o trecho "Com `--substituir`, grava por cima" do
  CA-06 da spec 003, que não é editada.
- **Objeto ausente:** na T2, o Storage local respondeu objeto inexistente com HTTP 400 e
  `statusCode` 404 no corpo, não com HTTP 404. O usuário decidiu tratar as duas formas como foto
  ausente, no envio e na conferência.
- **Falha de leitura na conferência:** aparece como diferente, com o motivo, e a conferência segue.
  Motivo proposto pelo agente e aceito pelo usuário: o script só lê e sai com erro de qualquer
  forma, e parar esconderia o estado dos outros itens.
- **Prova da troca:** a troca só vale com o hash da URL pública igual ao de `creditos.json` nos
  12 itens, por um comando só de leitura que o usuário roda. Evidência só depois de 12/12.
- **Cache:** a URL não muda. Medido na TI-0001 em produção antes da troca, em duas leituras,
  no plano Free: `cache-control: private, no-cache`, `cf-cache-status: DYNAMIC`, sem `age`. A
  medição foi feita pelo chat de validação, o que descumpriu rules/operacao.md, mesmo sendo só
  leitura. As próximas leituras de produção são do usuário. Se a foto antiga continuar, o usuário
  repete a conferência por até 24 h. Se não resolver, a spec para e o usuário decide com o agente.
- **Comentário no back:** `back/src/modules/loans/loans.repository.ts` tem uma alteração sem
  commit, do usuário, que deixou a frase cortada. O agente pode substituí-la pelo texto do CA-10,
  em tarefa e commit próprios.
- **Evidência:** prints dos 12 itens, saída do hash e consulta das 12 linhas. O e-mail da conta
  de teste e o ref do projeto ficam de fora, porque o repositório é público. O catálogo é
  registrado com "9 de 12", sem empréstimo aberto.

## Fora desta spec

Trocar outras fotos; rever as reservas que continuam; editar as specs 003 e 004 ou as evidências
delas; alterar telas, API ou schema; caminho novo para a foto (`image_path` continua
`<patrimônio>.jpg`); script novo para atualizar créditos; alterar `status`, nome, categoria ou
`photo_license` de qualquer equipamento; alterar `references/equipamentos.json`.

## Critérios de aceitação

### Revisão e créditos
- **CA-01** — Em `revisao/decisoes.json`, as 6 fotos atuais estão como `reprovada`, com o motivo
  real:

  | Patrimônio | Foto | Motivo |
  |---|---|---|
  | TI-0001 | 1483974 | tela com site aberto, tablet com apps e fone com marca |
  | TI-0004 | 4906312 | mãos e pernas de uma pessoa |
  | TI-0006 | 3114274 | maçã da Apple e foto na tela |
  | TI-0007 | 2853836 | maçã da Apple |
  | TI-0008 | 2202226 | "HDMI" em relevo |
  | TI-0012 | 1362419 | "FUJIFILM" legível na câmera |

- **CA-02** — As 4 reservas com marca estão como `reprovada`, com o motivo:

  | Patrimônio | Foto | Motivo |
  |---|---|---|
  | TI-0006 | 2853860 | maçã |
  | TI-0007 | 3539656 | "SAMSUNG" e fone Beats |
  | TI-0012 | 3545828 | "PENTAX" |
  | TI-0012 | 7693094 | "Rollei 35" |

- **CA-03** — TI-0004 tem 2425303 como `aprovada`, TI-0008 tem 1827, e TI-0007 tem 17768, movida
  da TI-0006. TI-0001, TI-0006 e TI-0012 têm, cada uma, exatamente 1 `aprovada`, que veio da nova
  busca e não estava entre as candidatas anteriores. Toda aprovação foi dita pelo usuário.
- **CA-04** — `fechar.mjs` passa. Em `creditos.json`, os 6 itens trocados trazem origem, autor e
  hash da foto aprovada. TI-0002, TI-0003, TI-0005, TI-0009, TI-0010 e TI-0011 mantêm o mesmo id
  e o mesmo hash. Em `saida/final`, as 12 fotos têm 800x600, sem repetição, e o hash de cada uma
  é igual ao de `creditos.json`.

### Envio e conferência
- **CA-05** — Com `--substituir`, `enviar.mjs` lê primeiro a URL pública de cada foto. Hash igual
  ao do arquivo local: não grava e informa. Hash diferente: grava por cima. HTTP 404, ou HTTP 400
  com `statusCode` 404 no corpo: grava. Qualquer outra resposta: erro, sem gravar. Depois de gravar, se a URL pública ainda entregar outro hash,
  avisa que a troca não foi confirmada, sem contar como trocada. Rodar de novo, com tudo igual,
  grava 0. Sem `--substituir`, o comportamento não muda.
- **CA-06** — `conferir.mjs` compara a URL pública de cada item de `creditos.json` com o hash
  registrado e confere 800x600. Só faz GET, não lê chave de serviço e não imprime a URL nem o
  ref do projeto. Lista cada patrimônio como igual ou diferente e informa "iguais: N de 12". Foto
  ausente (HTTP 404, ou HTTP 400 com `statusCode` 404 no corpo) aparece como diferente, e a
  conferência segue para os próximos itens, sem quebrar. Falha de leitura (HTTP de erro ou rede)
  aparece como "diferente (motivo)", e a conferência também segue. Sai com erro se não forem 12
  de 12. `--alvo local` só aceita host local. `--alvo producao` lê
  `SUPABASE_URL` só do processo e recusa host local. `SKILL.md` descreve o comando e o novo
  comportamento de `--substituir`.
- **CA-07** — O hook do harness bloqueia o agente de rodar `conferir.mjs` com `--alvo producao`.

### Banco
- **CA-08** — `back/prisma/dados/equipamentos-iniciais.json` traz os créditos novos dos 6 itens e
  continua igual a `creditos.json` nos 12.
- **CA-09** — `atualizar-creditos.sql` tem 6 UPDATE em uma transação. Contra Postgres real, com
  o tenant `suporte_ti` e outro tenant: os 6 itens ficam com `photo_source` e `photo_author` iguais
  aos de `equipamentos-iniciais.json` e com exatamente o mesmo `updated_at`, o `now()` da transação,
  e os outros 6 têm valor diferente; `status` e os demais campos não mudam; os outros 6 itens e o
  outro tenant não mudam; nenhuma linha é criada.

### Comentário
- **CA-10** — `loans.repository.ts` traz exatamente o comentário abaixo, sem citar São Paulo, e o
  código da transação não muda:
  `// Com connection_limit=1, um pedido pode esperar o outro: os padrões do Prisma (2 s e 5 s) virariam erro 500.`

### Em produção
- **CA-11 (produção)** — Antes do envio, a conferência aponta como diferentes exatamente TI-0001,
  TI-0004, TI-0006, TI-0007, TI-0008 e TI-0012, com "iguais: 6 de 12". O envio com `--substituir`
  grava essas 6, não regrava as outras 6, e o bucket continua com 12 objetos.
- **CA-12 (produção)** — Depois do envio, a conferência informa "iguais: 12 de 12".
- **CA-13 (produção)** — A consulta das 12 linhas é igual a `creditos.json` em imagem, origem,
  autor e licença. As 6 linhas trocadas têm exatamente o mesmo `updated_at`, o `now()` da
  transação, e as outras 6 têm valor diferente. A situação continua com 3 em manutenção (TI-0004,
  TI-0007 e TI-0010) e 9 disponíveis.
- **CA-14 (produção)** — Depois do 12 de 12, o catálogo mostra "9 de 12 equipamentos disponíveis
  agora", os 12 itens com a foto aprovada e "Fotos: Pixabay" com link.
- **CA-15 (produção)** — Nenhum arquivo em `evidencias/` traz o e-mail da conta de teste ou o ref
  do projeto, em texto ou em imagem.
