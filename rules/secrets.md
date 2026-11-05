---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "back/src/config/**", "front/src/config/**", "front/src/auth/**"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento
1. Chave pública (anon): só ela pode aparecer em código que roda no
   navegador. A proteção dela são as políticas de acesso do banco.
2. Chave de serviço: ignora todas as políticas. Só em código que roda
   no servidor, nunca em componente de cliente, nunca em variável com
   prefixo público.
3. Variável nova existe em TRÊS lugares ou em nenhum:
   `.env.local` (sua máquina) · `.env.example` (versionado, sem valor)
   · painel da Vercel (preview e production).
   Exceção: variável lida só por script local, que o deploy nunca
   executa (ex.: `PIXABAY_API_KEY`, `DEMO_SEED_PASSWORD`), fica em
   `.env.local` e `.env.example`, sem ir para a Vercel: colocar lá só
   espalharia o segredo por um lugar que nunca o usa.
4. Nenhuma senha, token ou chave em código, em arquivo versionado ou no
   histórico do git, mesmo sendo de ambiente local.
5. A chave de serviço de produção nunca fica em arquivo ao alcance do
   agente. Só eu a uso, no meu terminal (rules/restrictions.md § Produção).
6. Ao criar uma variável, diga na resposta em quais dos três lugares
   você já a colocou e o que falta eu fazer à mão.

## Verificação
Uma busca por "service" no código que vai para o navegador não
retorna nada. `.env.example` tem todas as chaves que o projeto usa,
sem nenhum valor real.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável que o deploy usa só no `.env.local`. Ela quebra o
  deploy e o erro só aparece no build da Vercel.
- Não contorne uma política de acesso trocando de chave. Se a política
  atrapalha, a política está errada — pare e me avise.