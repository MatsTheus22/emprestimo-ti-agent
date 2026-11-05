# ADR-003 — Biblioteca para padronizar imagens

Status: aceito (aprovado pelo usuário em 2026-11-05)

## Decisões

### 1. Redimensionamento das fotos de equipamento

| Item | Escolha |
|---|---|
| Biblioteca | `sharp` |
| Onde roda | Só nos scripts locais de `skills/imagens-equipamentos/scripts/` |
| Onde não roda | Deploy: nem API nem front dependem dela |
| Garantia do tamanho | Script relê o arquivo final e falha se não for JPEG 800x600 |

- **Biblioteca** — a API do Pixabay só oferece tamanhos fixos (máximo de 1280 px em `largeImageURL`), sem recorte em tamanho exato, e o contrato exige 800x600 garantido. É preciso redimensionar localmente, e o Node não faz isso sem biblioteca.
- **Onde roda** — o processamento acontece uma vez, antes do envio ao Storage. Fora do deploy, o binário nativo do `sharp` não pesa na function da Vercel nem entra no `package.json` de back ou front.
- **Garantia do tamanho** — pedir o tamanho não basta: a validação no arquivo final torna o erro visível, em vez de deixar uma imagem fora do padrão chegar ao catálogo.

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Recorte pelo CDN, sem biblioteca | Escolhido primeiro, quando a fonte era o Pexels (testado em 2 fotos: 800x600). A fonte mudou para o Pixabay, que não documenta recorte por URL |
| Servir a URL do Pixabay e ajustar por CSS | A API proíbe hotlink permanente, e o arquivo não ficaria em 800x600 |
| Redimensionar no navegador ou na API | Processaria a cada acesso uma tarefa que só precisa acontecer uma vez |
| Escrever o redimensionamento à mão | Decodificar e recodificar JPEG é muito código para manter, sem ganho |

## Consequências

**Fica mais fácil**
- Trocar a fonte de imagens de novo: só a busca muda, a padronização continua igual.

**Fica mais difícil**
- `sharp` usa binário nativo: a instalação depende da plataforma, o que é aceitável em script local.
- Mais uma dependência a manter, isolada no `package.json` da skill.

**Este ADR não muda**
- A regra do ADR-001: qualquer outra biblioteca continua fora até nova decisão.
