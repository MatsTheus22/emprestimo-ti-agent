# Critérios da revisão visual

> leitor: humano que revisa

Abra `saida/folha-de-contato.html`. Reprove a foto se aparecer qualquer um destes itens,
mesmo pequeno ou ao fundo:

| Motivo | Exemplos |
|---|---|
| Pessoa | Rosto, mão, reflexo ou silhueta reconhecível |
| Marca ou logo legível | Maçã, nome do fabricante na tampa, no teclado ou na borda do monitor |
| Texto | Teclas não contam; contam etiqueta, papel, placa, capa de livro |
| Tela com conteúdo | Site, aplicativo, código, foto. Tela apagada ou lisa passa |
| Não representa o equipamento | Foto de monitor em um item de cabo, por exemplo |

## Como registrar

Em `revisao/decisoes.json`, por equipamento e id da foto:

```json
{ "TI-0001": {
    "123": { "decisao": "aprovada", "motivo": "" },
    "456": { "decisao": "reprovada", "motivo": "logo legível na tampa" },
    "789": { "decisao": "pendente", "motivo": "" }
} }
```

- Cada equipamento precisa de exatamente 1 `aprovada`.
- `reprovada` exige motivo: é daí que sai a contagem do ENTREGA.md.
- `pendente` é foto que não precisou ser avaliada e não entra na contagem.
- Se nenhuma candidata servir, reprove todas e peça outra busca.

O código recusa fechar a revisão fora dessas regras, mas não sabe o que há na foto:
a aprovação é a única garantia de direito de imagem.
