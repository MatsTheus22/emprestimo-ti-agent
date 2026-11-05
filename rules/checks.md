---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Em cada repositório tocado (`back/`, `front/`), rode `npm test`. Cole
   a última linha da saída na resposta. No back ele sobe Postgres em
   container (Testcontainers): o Docker precisa estar aberto.
2. Se a tarefa tocou em migration, rode `npx prisma migrate reset`
   contra o banco local e confirme que o banco sobe do zero com todas
   as migrations (Prisma Migrate é o único dono do schema — ADR-001 §5).
3. Rode `npm run build` em cada repositório tocado antes de qualquer
   push. Build que quebra na Vercel é o feedback mais lento e mais caro
   deste projeto.
4. Rode `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa.
5. Diga qual critério de aceitação (CA-xx) esta tarefa atende.

## Verificação
Pronto = os quatro comandos terminaram sem falha E o git status não
trouxe surpresa. As duas coisas, não uma.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.