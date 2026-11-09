# 005 — Trocar fotos em produção · Plano

Spec: [spec.md](spec.md).

## ADRs e regras que restringem

- **ADR-001 §5:** Prisma Migrate é o único dono do schema. Esta spec muda dados, não schema: não
  há migration, e o SQL só faz UPDATE.
- **ADR-001 §8 e rules/tests.md:** o SQL é testado contra Postgres real (Testcontainers).
- **ADR-001 §9:** o merge na `main` do back dispara o workflow de migration, e a Vercel publica.
  Sem migration nova, o workflow não aplica nada, e a API não muda de comportamento.
- **ADR-003:** `sharp` só nos scripts locais da skill. `conferir.mjs` usa o que já existe, sem
  dependência nova.
- **rules/restrictions.md, rules/operacao.md:** o agente não escreve em produção nem faz merge.
  Push da branch é pedido antes.
- **rules/secrets.md:** a chave de serviço de produção não fica em arquivo. `conferir.mjs` não
  precisa dela.
- **Skill `imagens-equipamentos`:** o agente só transcreve as decisões do usuário.

## O que muda

| Onde | O quê |
|---|---|
| `back/src/modules/loans/loans.repository.ts` | Comentário do CA-10, no lugar da alteração sem commit |
| `skills/imagens-equipamentos/scripts/enviar.mjs` | `--substituir` compara o hash antes de gravar |
| `skills/imagens-equipamentos/scripts/conferir.mjs` | Novo: conferência só de leitura |
| `skills/imagens-equipamentos/SKILL.md` | Documenta os dois pontos acima |
| `hooks/regras.mjs` | Bloqueia `conferir.mjs` com `--alvo producao` para o agente |
| `references/buscas-alternativas.json` | Termos para as 4 buscas, se a lista atual não bastar |
| `revisao/decisoes.json`, `creditos.json` | Decisões do usuário e manifesto gerado |
| `back/prisma/dados/equipamentos-iniciais.json` | Créditos dos 6 itens |
| `docs/specs/005-trocar-fotos/atualizar-creditos.sql` | Novo: os 6 UPDATE |

O front não muda: não há branch nele.

## `enviar.mjs --substituir`

```text
GET URL pública
  200 e mesmo hash   -> não grava; conta como igual
  200 e outro hash   -> grava (x-upsert: true)
  404, ou 400 com statusCode 404 no corpo -> grava
  outra resposta     -> erro; interrompe sem gravar
Depois de gravar: GET URL pública
  mesmo hash         -> trocada
  outro hash         -> AVISO: troca não confirmada; não conta como trocada; não falha
```

O aviso não encerra com erro, porque a decisão é repetir a conferência por até 24 h. A prova
continua sendo o `conferir.mjs`. A checagem de 800x600 continua em todos os casos.

## SQL dos créditos

O arquivo fica na pasta da spec, porque é uma operação única. Os valores saem de `creditos.json`
depois do `fechar.mjs`. Os de TI-0001, TI-0006, TI-0007 e TI-0012 dependem da aprovação do usuário.

```sql
begin;

update equipment
set photo_source = 'https://pixabay.com/photos/coffee-caffeine-beverage-table-2425303/',
    photo_author = 'Engin_Akyurt',
    updated_at = now() at time zone 'UTC'
where asset_tag = 'TI-0004'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/high-definition-multimedia-1827/',
    photo_author = 'PublicDomainPictures',
    updated_at = now() at time zone 'UTC'
where asset_tag = 'TI-0008'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

-- TI-0001, TI-0006, TI-0007 e TI-0012 no mesmo formato.

commit;
```

Consulta da prova, a mesma no banco local e em produção:

```sql
select asset_tag, status, image_path, photo_source, photo_author, photo_license, updated_at
from equipment
where tenant_id = (select id from tenants where slug = 'suporte_ti')
order by asset_tag;
```

No banco local, o agente roda com `docker exec -i supabase_db_back psql -U postgres -d postgres
-v ON_ERROR_STOP=1`, lendo o arquivo pela entrada padrão.

## Testes

| CA | Onde | O que prova |
|---|---|---|
| CA-01 a CA-04 | `skills/.../scripts/decisoes-005.test.mjs` | Decisões, motivos, ids novos, itens mantidos e hashes |
| CA-05 | `skills/.../scripts/enviar.test.mjs` | Igual não grava; diferente, 404 e 400 com `statusCode` 404 gravam; erro de leitura não grava; troca não confirmada avisa; repetir grava 0 |
| CA-06 | `skills/.../scripts/conferir.test.mjs` | Contra Storage falso: 12 de 12, diferença, só GET, sem URL na saída, alvos recusados |
| CA-07 | `hooks/regras.test.mjs` | Variações do comando com `--alvo producao` bloqueadas; `--alvo local` permitido |
| CA-08 | `back/test/dados-iniciais.spec.ts` | Créditos dos 6 itens iguais a `creditos.json` |
| CA-09 | `back/test/db/atualizar-creditos.db-spec.ts` | Executa o arquivo SQL em Postgres real, em transação desfeita no fim; as 6 linhas com o mesmo `updated_at` e as outras 6 com valor diferente |
| CA-10 | `back/test/` | Texto do comentário, como o teste do `layout.md` na 004 |
| CA-11 a CA-15 | `evidencias/`, gravadas pelo usuário | Produção |

O teste do CA-09 lê o SQL na raiz e, como o teste do CA-02 da 003, é pulado em clone só do back.
Se outra spec trocar fotos, ela substitui esse teste, porque ele compara o SQL com
`equipamentos-iniciais.json`.

## Ordem em produção (usuário)

Tudo é executado pelo usuário, no Windows PowerShell, não no ISE, um comando por vez, com as
variáveis só naquele terminal. O ISE travou o envio na spec 003. O ref e o e-mail são trocados por
marcadores antes de gravar a evidência.

1. Confirmar que o Supabase está ativo: o plano Free pausa, e o workflow falha se o banco estiver
   pausado. Depois, merge do PR do back. Nada muda para quem usa o sistema.
2. **Conferir antes:** `$env:SUPABASE_URL` definido; `node conferir.mjs --alvo producao`. O comando
   sai com erro de propósito, porque ainda não são 12 de 12. O que vale é apontar exatamente os 6
   itens. Se apontar outra coisa, a spec para: rodar o envio regravaria essa outra foto também.
3. **Enviar:** `$env:SUPABASE_SERVICE_ROLE_KEY` definido; `node enviar.mjs --alvo producao
   --substituir`. Precisa gravar 6 e informar 12 objetos no bucket. Depois disso, remover a
   chave do terminal.
4. **Conferir depois:** `node conferir.mjs --alvo producao` até "iguais: 12 de 12". Até 24 h. Se
   não resolver, para e decide com o agente.
5. **Banco:** colar `atualizar-creditos.sql` no SQL Editor e depois rodar a consulta das 12 linhas.
6. **Tela:** com "12 de 12", abrir o catálogo com a conta de teste, em janela anônima, sem
   empréstimo aberto. Tirar os prints sem a tela de login.
7. **Evidências em `evidencias/`:** `imagens.txt` (passos 2 a 4), `banco.txt` (passo 5),
   `catalogo-N.png` e `telas.md` (passo 6). O agente confere os marcadores antes do commit e
   adiciona os arquivos pelo nome.

As fotos vêm antes dos créditos porque, se a conferência travar, o banco continua descrevendo a
foto que está no ar.
