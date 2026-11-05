# 003 — Dados iniciais

PRD item 2 ("Catálogo de equipamentos com a situação de cada um") depende destes
dados. Objetivo: o sistema em produção tem equipamentos reais para mostrar e a
conta do professor para testar.

## Decisões (respostas às perguntas, aprovadas em 2026-11-05)

- **Lista:** os 12 itens de `skills/imagens-equipamentos/references/equipamentos.json`.
- **Situação:** a da lista: TI-0004, TI-0007 e TI-0010 em manutenção, os outros 9
  disponíveis. A lista é mais definitiva que o pedido original, que citava só
  TI-0004 e TI-0007.
- **Imagens:** fonte Pixabay, por decisão do professor; `sharp` só em script local
  (ADR-003). A revisão visual foi feita pelo usuário: valem as 12 fotos de
  `saida/final` e os créditos de `creditos.json`.
- **Créditos:** origem, autor e licença ficam em colunas de `equipment`.
- **Imagem no banco:** só o caminho no bucket (`TI-0001.jpg`). A URL pública é
  montada por quem exibe, a partir do `SUPABASE_URL` do ambiente.
- **Patrimônio obrigatório:** `asset_tag` passa a NOT NULL. O pedido é patrimônio
  único, e nulo escapa do índice único. Produção tem 0 linhas. As colunas de imagem
  e crédito continuam opcionais.
- **Categoria restrita:** CHECK em `category` com `notebook`, `monitor`, `cabo` e
  `camera`.
- **Conta do professor:** o usuário cria a conta por fora, pelo painel do Auth, e só
  a membership por SQL. Inserir direto em `auth.users` pode quebrar o login e
  deixaria a senha no editor SQL. O script de dados não toca em `auth.users` nem em
  `memberships`.
- **Repetição:** rodar de novo não duplica nada, e o que já existe fica como está.
  Vale para o banco e para o bucket: o `enviar.mjs` deixa de sobrescrever por
  padrão, e trocar uma foto passa a exigir `--substituir`.
- **Produção:** tudo que escreve no banco ou no Storage de produção é executado
  pelo usuário (rules/restrictions.md).

## Fora desta spec

Tela de catálogo e o aviso "Fotos: Pixabay" (spec que cria a tela); cadastro de
equipamento pela interface; importação da planilha; qualquer endpoint novo;
criação de empréstimos.

## Critérios de aceitação

### Banco e script
- **CA-01** — `equipment` tem as colunas opcionais `image_path`, `photo_source`,
  `photo_author` e `photo_license`. `asset_tag` é obrigatório: linha sem patrimônio
  é recusada. O mesmo patrimônio é recusado duas vezes no mesmo tenant e aceito em
  outro tenant. `category` só aceita `notebook`, `monitor`, `cabo` e `camera`.
- **CA-02** — `npm run seed:iniciais -- --alvo local` grava os 12 equipamentos com
  patrimônio, nome, categoria, situação, imagem e créditos iguais aos de
  `equipamentos.json` e `creditos.json`: 3 em manutenção (TI-0004, TI-0007 e
  TI-0010) e 9 disponíveis. A imagem de cada um é `<patrimônio>.jpg`.
- **CA-03** — Rodar o script de novo mantém 12 linhas e informa 0 criadas. Uma
  linha que já existe não muda, mesmo que difira da lista (ex.: `status`
  `emprestado`, outra imagem).
- **CA-04** — O script não cria empréstimo, membership nem usuário, e nem o código
  dele nem o arquivo de dados contêm senha.
- **CA-05** — O script recusa apontar para o alvo errado: `--alvo local` recusa host
  remoto; `--alvo producao` exige terminal interativo, lê `DATABASE_URL` só do
  processo, recusa host local e pede a digitação do ref do projeto. O hook do
  harness bloqueia o agente de rodar `seed:iniciais` com `--alvo producao`.

### Envio das imagens
- **CA-06** — `enviar.mjs` sem `--substituir` não altera objeto que já existe no
  bucket: informa "já existia" e avisa se o conteúdo local for diferente. Com
  `--substituir`, grava por cima. Em todos os casos, confere a URL pública em 800x600.

### Em produção
- **CA-07 (produção)** — `marcelo.grilo@institutojef.org.br` entra no link da Vercel
  com a senha padrão da turma, aparece como "Marcelo Grilo", papel colaborador, e
  tem zero empréstimos. Nenhuma senha foi para código ou git.
- **CA-08 (produção)** — Os 12 equipamentos existem no banco do deploy, cada um com
  a sua imagem, os seus créditos e a sua situação (3 em manutenção, 9 disponíveis).
  Nenhum empréstimo foi criado.
- **CA-09 (produção)** — As 12 imagens abrem pela URL pública, sem login, todas em
  800x600, e o bucket tem exatamente 12 objetos.
- **CA-10 (produção)** — Repetir o envio e o script não duplicou nada: continuam 12
  linhas e 12 objetos, e o script informa 0 criadas.
