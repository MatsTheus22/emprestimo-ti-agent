# Arquitetura de repositórios

Projeto dividido em dois repositórios git separados, cada um em sua pasta local dentro desta raiz.

| Parte | Pasta local | Remote (GitHub) |
|---|---|---|
| Front | `front/` | https://github.com/MatsTheus22/emprestimo-ti-front.git |
| Back | `back/` | https://github.com/MatsTheus22/emprestimo-ti-back.git |

A raiz deste diretório (`docs/`, `layout.md`) não é um repositório git — é só o espaço local com a documentação compartilhada entre as duas partes.

Cada pasta (`front/` e `back/`) tem seu próprio `.env`, `.env.example` e `.gitignore`, conforme as variáveis definidas em `docs/adr/001-stack.md`.
