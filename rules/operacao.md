---
description: Contrato de operacao entre mim e o agente neste projeto
globs: []
alwaysApply: true
---

# Contrato de operação

## Git
> leitor: agente

- Commit: O agente commita cada tarefa
- Push: o agente pode fazer push da branch de trabalho, sempre pedindo
  antes (rules/restrictions.md § Produção). Nunca na `main`, nunca force.
- A mensagem de commit cita a tarefa e o critério de aceitação.
- Um commit por tarefa. Nunca junte código e mudança de regra
  no mesmo commit.

## Autorização por tipo de ação
> leitor: agente

| ação                                        | nível          |
|---------------------------------------------|----------------|
| Editar arquivo existente dentro do escopo d | livre          |
| Criar arquivo novo                          | avisar depois  |
| Deletar ou renomear arquivo                 | pedir antes    |
| Instalar ou atualizar dependência           | pedir antes    |
| Criar ou alterar migration                  | pedir antes    |
| Mexer em variável de ambiente, config de de | pedir antes    |
| Push da branch de trabalho, GitHub (secrets)| pedir antes    |
| Vercel (preview, env, config)               | pedir antes    |
| Supabase remoto (dados, Auth, Storage)      | proibido       |
| `prisma migrate deploy`, seed ou upload rem | proibido       |
| Merge de PR, push na main, disparar workflo | proibido       |
| Deploy de produção na Vercel                | proibido       |

O que cada nível significa:
- livre — faça e siga em frente.
- avisar depois — faça e me diga na resposta o que fez.
- pedir antes — descreva o que pretende fazer e PARE.
- proibido — não faça, mesmo que eu peça no meio de uma tarefa.
  Se eu pedir, me lembre desta linha.

## Configuração do operador
> leitor: humano — isto não é instrução para o agente

| fase                              | modelo / raciocínio |
|-----------------------------------|---------------------|
| Escrever a spec                   | raciocínio alto     |
| Planejar e quebrar em tarefas     | raciocínio alto     |
| Executar uma tarefa já decidida   | rápido              |
| Debugar algo que quebrou          | raciocínio alto     |
| Revisar o diff antes do commit    | padrão              |

- Revisão de diff acontece em sessão limpa, de preferência com
  modelo diferente do que escreveu o código.
