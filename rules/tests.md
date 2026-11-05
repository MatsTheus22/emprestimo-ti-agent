---
description: Ao escrever, alterar ou remover qualquer teste.
globs: ["<CAMINHO-DE-TESTES>"]
alwaysApply: false
---

# Testes automatizados
> leitor: agente

## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. O nome do teste cita o critério que ele prova: test_ca_03_...
2. Teste de endpoint verifica status E corpo.
3. Tabela com política de acesso tem um teste que prova o bloqueio:
   o mesmo dado, com outro usuário, não retorna.

## Verificação
<COMANDO-TESTES> passa com o banco local recém-resetado.

## Não faça
- Não mocke o banco em teste de repositório ou de política de acesso.
  Mock testa o mock; constraint, cascade, transação e RLS só falham
  contra Postgres de verdade.
- Não escreva teste só para subir percentual de cobertura. O critério
  aqui é caminho crítico coberto, não número.
- Não publique endpoint novo sem o teste obrigatório de isolamento
  entre tenants (um caso por endpoint, além do teste por tabela do
  item 3): tenant A não pode enxergar dado de tenant B.