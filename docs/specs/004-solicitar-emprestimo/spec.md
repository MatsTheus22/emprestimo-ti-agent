# 004 — Solicitar empréstimo

PRD itens 1, 2 e 3: cada pessoa vê os próprios empréstimos, o catálogo com a situação
de cada equipamento, e solicita um item disponível. Objetivo: em produção, um usuário
logado vê o catálogo, solicita um equipamento e acompanha o que está com ele.

## Decisões

### Do pedido
- **Sem aprovação:** solicitar cria o empréstimo na hora. Não há fila nem aprovação de
  Operações nesta versão (decisão para a turma).
- **Regras:** prazo de 14 dias corridos e limite de 3 itens em aberto (docs/PRD.md).
- **Quem pode:** Colaborador e Operações.
- **Situação:** "emprestado" fica gravada em `equipment.status`, com índice único
  parcial em `loans` para no máximo um empréstimo aberto por equipamento.
- **Atomicidade:** criar o empréstimo é atômico e transacionado, inclusive a conferência
  do limite de 3.
- **Crédito:** a tela que exibe as fotos mostra "Fotos: Pixabay" com link para
  https://pixabay.com/ (contrato da skill imagens-equipamentos).
- **Privacidade:** item com outra pessoa mostra só a situação "Emprestado", sem o nome
  dela nem a data. Isso muda o `layout.md`, e a mudança fica registrada nele.
- **Produção:** tudo que escreve no banco de produção é executado pelo usuário
  (rules/restrictions.md).
- **Conta de teste:** o usuário testa com uma conta própria e a limpa com um script que
  ele mesmo roda. `marcelo.grilo@institutojef.org.br` continua com zero empréstimos.

### Respostas às perguntas (2026-11-06)
- **Permissões do banco:** um colaborador conseguia alterar o próprio papel e o de
  todos, apagar memberships de outras pessoas, renomear o tenant, forjar registros em
  `audit_log` e criar empréstimo sem passar pela API (testes do agente e do usuário no
  banco local, com rollback). O ADR-001 §7 pede deny by default, e o papel na membership
  vai para o token. Por isso, `anon` e `authenticated` perdem a escrita em todas as
  tabelas de domínio, e o `SELECT` de `loans` e `memberships` fica limitado às linhas da
  própria pessoa. Entram também, aprovados pelo usuário: a leitura de `audit_log` só para
  o próprio ator, porque `loan.create` revelaria quem pegou o quê; a retirada de
  `TRUNCATE`, `REFERENCES` e `TRIGGER`, porque `TRUNCATE` ignora RLS; a mudança dos
  privilégios padrão, para tabela nova não nascer com escrita; e `_prisma_migrations` no
  mesmo `REVOKE`, porque `anon` e `authenticated` ainda conseguiam `TRUNCATE` nela (teste
  do usuário no banco local, com rollback).
- **Prazo e atraso:** a devolução é a data de hoje + 14 no calendário de São Paulo, e o
  atraso começa quando esse dia termina (`due_at` às 23:59:59.999 de São Paulo). O fuso é
  fixo porque as functions rodam nos EUA. O valor é convertido explicitamente para UTC
  antes de gravar: sem isso, com a sessão em outro fuso, a fórmula grava 5 horas a menos
  (teste do usuário).
- **Auditoria:** solicitar grava `loan.create` em `audit_log` na mesma transação
  (ADR-001 §10). A limpeza não toca nessa tabela, que é append-only: os registros dos
  testes continuam lá, apontando para empréstimos apagados.
- **Limpeza:** o e-mail da conta é informado só na hora de rodar, com `--email`, e nunca
  vai para o repositório. A conta de teste ainda precisa ser criada em produção, com o
  papel `operacoes`: ela entra em `/operacoes`, que continua "Em construção", e chega ao
  Catálogo pela aba.
- **Item com a própria pessoa:** pill "Emprestado", detalhe "Com você · devolver até
  {data}" e botão "Está com você".
- **Manutenção:** o `layout.md` §7.6 pede uma observação, mas `equipment` não tem essa
  coluna. O card usa texto fixo, sem coluna nova, e o `layout.md` é ajustado.
- **Pill em "Meus empréstimos":** só "Em dia" e "Em atraso". O layout cita "a vencer" sem
  definir quando começa.
- **Limite e atraso ao mesmo tempo:** vale o motivo do atraso, que tem banner e atalho.
- **Modal:** o de confirmação do `layout.md` §7.1 continua. O empréstimo é criado ao
  confirmar.
- **Botão "Devolver":** não aparece nesta versão. O `layout.md` não muda nesse ponto.
- **Fotos:** só no catálogo, então o crédito fica só nessa tela.

### Substitui trecho de outra spec
Esta spec substitui, no **CA-07 da spec 002**, o trecho "página Em construção" para
Catálogo e Meus empréstimos. O `spec.md` da 002 não é editado. Operações e Equipamentos
continuam "Em construção".

### Desvio consciente do ADR-001
**§10, rate limit:** o ADR prevê rate limit, e ele não existe no back. Não é implementado
nesta spec. Motivo do usuário: o enunciado não pede e exigiria tabela nova.

## Fora desta spec

Devolução, tela de Operações, reserva com data futura, notificação por e-mail, renovação,
busca e filtros do catálogo, rate limit.

## Critérios de aceitação

### Banco e permissões
- **CA-01** — O banco recusa um segundo empréstimo aberto para o mesmo equipamento e
  aceita um novo quando o anterior tem `returned_at` preenchido.
- **CA-02** — `anon` e `authenticated` não conseguem `INSERT`, `UPDATE`, `DELETE` nem
  `TRUNCATE` em `loans`, `equipment`, `memberships`, `tenants`, `audit_log` e
  `_prisma_migrations`, e tabela nova não nasce com escrita para eles. Em especial: um
  colaborador não altera o próprio papel nem o de outra pessoa, não apaga membership
  alheia, não renomeia o tenant e não forja registro de auditoria.
- **CA-03** — Com o papel `authenticated`, `loans` e `memberships` só devolvem as linhas
  da própria pessoa, e `audit_log` só as do próprio ator: o mesmo dado, com outro usuário
  do mesmo tenant ou de outro tenant, não retorna. A leitura por tenant de `equipment` e
  `tenants` continua valendo.
- **CA-04** — Depois da mudança de permissões, o hook do token continua lendo
  `memberships` como `supabase_auth_admin` e entrega `tenant_id` e `app_role`.

### Catálogo
- **CA-05** — `GET /v1/equipment` devolve, por cursor, os equipamentos do tenant do token
  com id, patrimônio, nome, categoria, situação e caminho da imagem, além dos totais de
  equipamentos e de disponíveis. Sem token responde 401; sem membership, 403. Um tenant
  não vê equipamento de outro, mesmo mandando outro tenant na query ou em header.
- **CA-06** — Para item com outra pessoa, a resposta traz só a situação `emprestado`: o
  corpo não contém o id, o nome nem a data do empréstimo dela. Para item com a própria
  pessoa, traz a data de devolução.
- **CA-07** — A tela Catálogo mostra, em cada card, a foto, o nome, a categoria, o
  patrimônio e a situação, com o detalhe e o botão de cada caso: disponível ("Solicitar"),
  manutenção ("Indisponível", desabilitado), com outra pessoa ("Emprestado", desabilitado,
  sem nome nem data) e com a própria pessoa ("Está com você", desabilitado). A tela mostra
  "Fotos: Pixabay" com link para https://pixabay.com/.

### Solicitar
- **CA-08** — `POST /v1/loans` com um equipamento disponível responde 201, cria o
  empréstimo com `due_at` às 23:59:59.999 de São Paulo do 14º dia corrido depois de hoje
  (inclusive perto da virada do dia em UTC e com a sessão do banco em outro fuso), passa o
  equipamento a `emprestado` e grava `loan.create` em `audit_log`. Se qualquer passo
  falhar, nada fica gravado.
- **CA-09** — Equipamento em manutenção ou emprestado é recusado com 409 e o `type`
  próprio, e nada é criado.
- **CA-10** — Quem já tem 3 empréstimos em aberto é recusado com 409 e o `type` próprio, e
  nada é criado.
- **CA-11** — Quem tem empréstimo em atraso é recusado com 409 e o `type` próprio, e nada
  é criado. Com atraso e limite ao mesmo tempo, vale o de atraso.
- **CA-12** — Dois pedidos simultâneos ao mesmo equipamento criam só um empréstimo: um
  responde 201 e o outro 409. Dois pedidos simultâneos da mesma pessoa, com 2 em aberto e
  para equipamentos diferentes, também criam só um.
- **CA-13** — Quem foi recusado vê o motivo: "Limite de 3 itens" e "Bloqueado por atraso"
  nos botões, banner de atraso com atalho para "Meus empréstimos" e, se a recusa vier da
  API depois de abrir o modal, a mensagem do motivo na tela, com o catálogo atualizado.
- **CA-14** — O tenant e o usuário do empréstimo vêm só do token. Equipamento de outro
  tenant responde 404 e não cria nada; sem token, 401; sem membership, 403; corpo inválido,
  400.

### Meus empréstimos
- **CA-15** — `GET /v1/loans/me` devolve, por cursor, só os empréstimos em aberto da
  própria pessoa, no tenant do token, com equipamento, retirada, devolução e se está em
  atraso, além dos totais. Empréstimo de outra pessoa ou de outro tenant não retorna. Sem
  token responde 401; sem membership, 403.
- **CA-16** — A tela "Meus empréstimos" mostra "N de 3 itens em seu nome · prazo padrão de
  14 dias", a barra de 3 traços e uma linha por empréstimo, com item, retirada, devolução
  em DD/MM/AAAA no fuso de São Paulo e a pill "Em dia" ou "Em atraso". Sem empréstimos,
  mostra o estado vazio com "Ir ao catálogo". Não há botão "Devolver".

### Script de limpeza
- **CA-17** — O script apaga só os empréstimos da conta informada com `--email` e volta a
  `disponivel` só os equipamentos dos empréstimos abertos dela. Não altera empréstimo de
  outra pessoa, equipamento em manutenção nem `audit_log`. Recusa sempre
  `marcelo.grilo@institutojef.org.br`, sem diferenciar maiúscula, e recusa conta
  inexistente. Rodar de novo informa 0 apagados. Nem o código nem o repositório trazem o
  e-mail da conta de teste.
- **CA-18** — O script recusa o alvo errado: `--alvo local` recusa host remoto;
  `--alvo producao` exige terminal interativo, lê `DATABASE_URL` só do processo, recusa
  host local, pede a digitação do ref do projeto e a confirmação do que vai apagar. O hook
  do harness bloqueia o agente de rodar esse script com `--alvo producao`.

### Layout
- **CA-19** — O `layout.md` reflete o card com foto e dados, sem nome nem data de outra
  pessoa, e o texto fixo de manutenção, e tem uma seção de alterações que registra a
  mudança e a spec que a pediu.

### Em produção
- **CA-20 (produção)** — O catálogo mostra os 12 equipamentos com imagem e "Fotos: Pixabay"
  com link.
- **CA-21 (produção)** — Equipamento em manutenção não pode ser solicitado.
- **CA-22 (produção)** — Solicitar um disponível cria o empréstimo e o tira do disponível,
  e "Meus empréstimos" mostra o item em aberto com a data de devolução.
- **CA-23 (produção)** — Com 3 em aberto, a conta de teste não solicita um quarto, e o
  motivo aparece na tela.
- **CA-24 (produção)** — Em produção, `anon` e `authenticated` não têm escrita nas 5
  tabelas de domínio nem em `_prisma_migrations`, e as policies são as da migration
  (consulta de leitura do usuário). Uma tentativa real, `UPDATE ... WHERE false` como
  `authenticated` em transação com `ROLLBACK`, dá `permission denied` nas 5 tabelas.
- **CA-25 (produção)** — Depois da limpeza, a conta de teste e a do Marcelo têm zero
  empréstimos, e os equipamentos voltaram a 9 disponíveis e 3 em manutenção.
