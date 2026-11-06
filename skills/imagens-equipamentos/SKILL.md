---
name: imagens-equipamentos
description: Use ao obter, trocar, revisar ou enviar fotos de equipamento do catálogo. Busca só na API do Pixabay, padroniza em 800x600, registra créditos e prepara o envio ao Supabase Storage. Não use para landing, logo ou ilustrações, e nunca para escrever em produção.
---

# Imagens de equipamentos

Toda foto de equipamento do sistema sai desta skill. Nenhuma outra origem de imagem é aceita.

## Fluxo

Rode dentro de `scripts/`. Instale uma vez com `npm ci`.

1. **Buscar:** `node buscar.mjs --env-chave ../../../back/.env.local`
   Filtra, baixa, gera 4 candidatas por equipamento em 800x600 e cria
   `saida/folha-de-contato.html`. Repetir usa o cache de 24 h da API e preserva decisões.
2. **Revisar (humano):** o usuário abre a folha de contato e preenche `revisao/decisoes.json`
   conforme [references/criterios-revisao.md](references/criterios-revisao.md).
   O agente nunca aprova foto: só transcreve o que o usuário disse. Se houver mais de uma
   aprovada, uma é a final e as outras ficam como `reserva`.
3. **Fechar:** `node fechar.mjs`
   Falha se algum equipamento não tiver exatamente 1 aprovada. Gera `saida/final/` e
   `creditos.json`, com origem, autor, licença e a contagem real de reprovadas.
4. **Enviar:**
   - Ambiente local (agente pode): `node enviar.mjs --alvo local --env ../../../back/.env`
   - Produção: **só o usuário**, no próprio terminal. O agente passa o comando e para.
     O script exige terminal interativo, a digitação do ref do projeto e
     `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` definidas no processo.
   - Repetir o envio não altera o que já existe: o script informa "já existia" e avisa se
     o conteúdo local for diferente. Para trocar uma foto já publicada, use `--substituir`.

Se uma busca da lista trouxer poucas opções, acrescente termos em
`references/buscas-alternativas.json` (`{ "TI-0001": ["outro termo"] }`) e rode
`node buscar.mjs --somente TI-0001 --env-chave <arquivo>`: as fotos já revisadas ficam como estão.
Não altere
`references/equipamentos.json`: é a lista exata do enunciado.

## Quem garante cada requisito

| Requisito | Garantia | Onde |
|---|---|---|
| Só Pixabay | Código: a busca só chama essa API | `buscar.mjs` |
| 800x600 | Código: `sharp` redimensiona e o arquivo final é relido; falha se diferir, sem ampliar | `validarArquivo` em `lib.mjs` |
| Sem repetição | Código: id da Pixabay e hash do arquivo, na busca e no fechamento | `buscar.mjs`, `avaliarDecisoes` |
| Sem pessoa, marca, texto ou tela com conteúdo | **Humano.** O código só faz um filtro inicial por tags, que não provam o que aparece na foto | `motivoRejeicao`, revisão |
| Sem imagem gerada por IA | Código, pelo campo `isAiGenerated` da API, que é declarado na origem | `motivoRejeicao` |
| Créditos | Código: manifesto só com aprovadas | `creditos.json` |
| Armazenamento sem duplicar | Código: caminho fixo `TI-000N.jpg` em bucket público; só grava por cima com `--substituir` | `enviar.mjs`, `classificarEnvio` |
| Produção fora do alcance do agente | Código: terminal interativo e chave só do processo. Regra e hook do harness completam | `enviar.mjs`, `rules/restrictions.md` |
| Sem segredo no git | Código e regra: chave lida do ambiente, `saida/` ignorada | `.gitignore`, `rules/secrets.md` |

## Fora da skill, mas obrigatório

A tela que exibe as fotos mostra **"Fotos: Pixabay"** com link para https://pixabay.com/.
A implementação é da spec que cria a tela. Ver [references/licenca.md](references/licenca.md).

## Não faça

- Não use URL do Pixabay no sistema: a API proíbe hotlink permanente. Só o bucket.
- Não imprima a URL da busca: a chave vai na query string.
- Não aprove foto: `revisao/decisoes.json` só recebe o que o usuário decidiu.

Detalhes da API: [references/api-pixabay.md](references/api-pixabay.md).
