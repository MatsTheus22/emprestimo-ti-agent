# EMPREST.AI

Sistema de empréstimo de equipamentos de TI internos (notebooks, monitores, cabos, câmeras), para colaboradores pedirem e devolverem itens e para Operações controlar o inventário.
Negócio em docs/PRD.md. Stack decidida em docs/adr/001-stack.md.

## Onde olhar

- docs/PRD.md — o que o negócio precisa. Não é spec.
- docs/adr/ — decisões técnicas já tomadas e o motivo delas.
- docs/specs/<NNN-funcionalidade>/ — spec, plano e tarefas de cada feature.
- rules/ — como se trabalha aqui. Leia rules/restrictions.md sempre.

## Comandos

- subir o banco local: ainda não rodado nesta máquina
- rodar o projeto: ainda não rodado nesta máquina
- rodar os testes: ainda não rodado nesta máquina
- buildar: ainda não rodado nesta máquina

Só entram comandos que eu já rodei nesta máquina.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco LOCAL.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variável de ambiente. Ver .env.example.

## Precedência

Se dois artefatos discordarem sobre comportamento, a spec vence o código.
Se algo não estiver escrito em lugar nenhum, pergunte — não decida.

## Estado atual do projeto

Existe: docs/PRD.md, docs/adr/001-stack.md, rules/ (checks.md, migration.md,
restrictions.md, secrets.md, spec-flow.md), layout.md (spec de layout) e
ARQUITETURA.md. Este repositório guarda só a configuração do agente (regras,
skills, subagentes e docs). O código vive em dois repositórios git separados,
`front/` e `back/` (remotes em ARQUITETURA.md), que NÃO estão neste repo. Este repo é `emprestimo-ti-agent` (ver ARQUITETURA.md).

Nenhum comando deste projeto foi rodado nesta máquina.

## Procedimentos
Sempre siga as seguintes regras:
- rules/checks.md -> O que precisa passar antes de declarar uma tarefa pronta
- rules/handoff.md -> Ao terminar uma tarefa do plano, ou quando eu disser "vamos fechar".
- rules/migration.md -> Procedimento para qualquer mudança de schema
- rules/operacao.md -> Contrato de operacao entre mim e o agente neste projeto
- rules/restrictions.md -> O que o agente não pode fazer neste projeto
- rules/secrets.md -> Onde cada variável de ambiente vive e qual chave usar
- rules/skills.md -> Onde ficam as skills e como escolher qual usar
- rules/spec-flow.md -> Ao iniciar qualquer funcionalidade nova do PRD.
- rules/tests.md -> Ao escrever, alterar ou remover qualquer teste.

## Subagentes
- Ficam em agents/<nome>.md. O frontmatter diz quando delegar; o
  corpo é a instrução completa do subagente.
- Subagente não herda esta conversa: ao delegar, passe tudo que o
  arquivo dele pede como entrada.
- Se o harness não tiver subagentes, abra uma sessão nova e comece
  com: "Aja conforme agents/<nome>.md." e as entradas pedidas.