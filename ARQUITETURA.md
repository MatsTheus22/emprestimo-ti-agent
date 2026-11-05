# Arquitetura de repositórios

Projeto dividido em três repositórios git: front, back e agente (configuração do agente). Front e back ficam em pastas locais dentro da raiz do projeto.

| Parte | Pasta local | Remote (GitHub) |
|---|---|---|
| Front | `front/` | https://github.com/MatsTheus22/emprestimo-ti-front.git |
| Back | `back/` | https://github.com/MatsTheus22/emprestimo-ti-back.git |
| Agente | `emprestimo-ti-agent/` (pasta irmã da raiz, privado) | https://github.com/MatsTheus22/emprestimo-ti-agent.git |

O repositório do agente contém `AGENTS.md`, `CLAUDE.md`, `agents/`, `rules/`, `skills/`, `docs/`, `layout.md` e este arquivo, tudo menos `front/` e `back/`. A raiz `emprestimo-ti/` não é um repositório git; a cópia dessa documentação no repo do agente é a versão versionada.

Cada pasta (`front/` e `back/`) tem seu próprio `.env`, `.env.example` e `.gitignore`, conforme as variáveis definidas em `docs/adr/001-stack.md`.
