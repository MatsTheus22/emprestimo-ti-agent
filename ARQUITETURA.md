# Arquitetura de repositórios

Projeto dividido em três repositórios git: front, back e agente (configuração do agente). Todos ficam dentro desta pasta raiz; `front/` e `back/` são ignorados pelo git do repo do agente.

| Parte | Pasta local | Remote (GitHub) |
|---|---|---|
| Front | `front/` | https://github.com/MatsTheus22/emprestimo-ti-front.git |
| Back | `back/` | https://github.com/MatsTheus22/emprestimo-ti-back.git |
| Agente | `.` (a própria raiz, público) | https://github.com/MatsTheus22/emprestimo-ti-agent.git |

O repositório do agente contém `AGENTS.md`, `CLAUDE.md`, `agents/`, `rules/`, `skills/`, `docs/`, `layout.md` e este arquivo, tudo menos `front/` e `back/`. A raiz `emprestimo-ti/` é este repositório.

Cada pasta (`front/` e `back/`) tem seu próprio `.env`, `.env.example` e `.gitignore`, conforme as variáveis definidas em `docs/adr/001-stack.md`.
