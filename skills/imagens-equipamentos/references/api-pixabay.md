# API do Pixabay

Fonte: https://pixabay.com/api/docs/, lida em 2026-11-05.

## Busca

`GET https://pixabay.com/api/` com `key` na query string. A skill usa `q`,
`image_type=photo`, `orientation=horizontal`, `safesearch=true`, `min_width=800`,
`min_height=600` e `per_page=80` (aceita de 3 a 200). `id` retorna uma imagem específica.

## URLs da resposta

| Campo | Tamanho | Observação |
|---|---|---|
| `previewURL` | máx. 150 px | |
| `webformatURL` | máx. 640 px | "URL valid for 24 hours." Trocar `_640` por `_180`, `_340` ou `_960` muda o tamanho |
| `largeImageURL` | máx. 1280 px | É a que a skill baixa |
| `fullHDURL`, `imageURL`, `vectorURL` | maiores | Só para contas aprovadas |

Não existe recorte em tamanho exato pela URL, por isso o `sharp`
(ver `docs/adr/003-sharp.md`). `min_width` e `min_height` só filtram resultados.

## Limites

- "By default, you can make up to 100 requests per 60 seconds." Acima disso, HTTP 429.
- "requests must be cached for 24 hours." A skill guarda as respostas em `saida/cache/`.
- "Systematic mass downloads are not allowed." A skill baixa só as candidatas, com intervalo entre downloads.

## Hospedagem

"permanent hotlinking of images (using Pixabay URLs in your app) is not allowed."
"If you intend to use the images, please download them to your server first."
Por isso as imagens ficam no bucket do Supabase.

## Campos usados

`id`, `pageURL`, `type`, `tags`, `imageWidth`, `imageHeight`, `largeImageURL`, `user`,
`user_id`, `isAiGenerated`, `isLowQuality`. `isAiGenerated` e `isLowQuality` foram
observados em respostas reais em 2026-11-05; a página de documentação não os descreve.
