---
description: Ao terminar uma tarefa do plano, ou quando eu disser "vamos fechar".
globs: []
alwaysApply: true
---

# Handoff de sessão
> leitor: agente

## Quando
Ao terminar uma tarefa do plano, ou quando eu disser "vamos fechar".

## Procedimento
Sobreescreva em ./docs/handoff.md com, no máximo, 25 linhas:
1. Onde parei — tarefa e critério em andamento
2. O que está commitado e em qual branch
3. O que está aplicado no banco local mas ainda não commitado
4. O que já foi publicado
5. O que NÃO fazer na próxima sessão e por quê
6. O próximo passo, em uma frase imperativa

## Verificação
Uma sessão nova, lendo só handoff.md + a spec, continua sem
perguntar nada sobre o que já foi feito.

## Não faça
- Não use o handoff para publicar nada. Push é sempre da pessoa;
  o handoff só documenta o que já existe.
- Não abra uma tarefa nova dentro do handoff. Ele fecha a sessão
  atual — o próximo passo é uma frase, não um novo plano.
- Não insista numa sessão longa tentando corrigir com regra mais
  enfática. Encerre por aqui e abra outra sessão.