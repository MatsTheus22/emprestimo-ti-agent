# Evidência: telas em produção (CA-20, CA-21, CA-22 e CA-23)

Origem: testado no sistema pelo usuário, em 2026-11-07.

- Conta: conta de teste própria do usuário. O e-mail fica fora deste repositório (CA-17).
- Link: https://emprestimo-ti-front.vercel.app
- Nome exibido: Conta de Teste (avatar com as iniciais CT)
- Papel exibido: OPERAÇÕES

## CA-20: catálogo com 12 equipamentos e imagem

- Resultado: "9 de 12 equipamentos disponíveis agora". Do TI-0001 ao TI-0012, todos com foto.
- Rodapé: "Fotos: Pixabay", com link no fim da página.
- Prints: [TI-0001 a TI-0003](catalogo-1.png), [TI-0004 a TI-0009](catalogo-2.png) e
  [TI-0010 a TI-0012, com o crédito](catalogo-3.png).

## CA-21: equipamento em manutenção não pode ser solicitado

- Resultado: TI-0004 com a situação "Em manutenção", o detalhe "Indisponível durante a
  manutenção" e o botão "Indisponível" desabilitado. TI-0007 e TI-0010 aparecem igual em
  `catalogo-2.png` e `catalogo-3.png`.
- Print: [manutencao.png](manutencao.png)
- Limite: o print prova a tela. A recusa da API para esse caso é provada pelo CA-09, em Postgres
  real.

## CA-22: solicitar cria o empréstimo e tira do disponível

- Resultado: depois de solicitar o TI-0001, a contagem caiu para "8 de 12". O card mostra
  "Emprestado", "Com você · devolver até 21/11/2026" e o botão "Está com você".
- Meus empréstimos: "1 de 3 itens em seu nome", TI-0001, retirada em 07/11/2026, devolver até
  21/11/2026 e a situação "Em dia". São 14 dias corridos.
- Prints: [solicitar.png](solicitar.png) e [meus-emprestimos.png](meus-emprestimos.png)

## CA-23: limite de 3 com o motivo visível

- Resultado: com 3 em aberto, itens disponíveis mostram o botão "Limite de 3 itens" desabilitado,
  com a situação "Disponível".
- Print: [limite.png](limite.png)
- Os 3 empréstimos em aberto (TI-0001, TI-0002 e TI-0003) estão em `limpeza.txt`.
- Limite: o print prova o motivo na tela. A recusa da API a um quarto pedido é provada pelo
  CA-10, em Postgres real.
