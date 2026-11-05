# 003 — Dados iniciais · Plano

Spec: [spec.md](spec.md).

## ADRs e regras que restringem

- **ADR-001 §5:** Prisma Migrate é o único dono do schema; `prisma/seed.ts` continua
  criando só o tenant.
- **ADR-001 §6:** `equipment` é por tenant, então o patrimônio é único dentro do tenant.
- **ADR-001 §7:** cadastro fechado; a conta do professor é criada por fora.
- **ADR-001 §8 e rules/tests.md:** idempotência e constraint são provadas contra
  Postgres real (Testcontainers), sem mock.
- **ADR-003:** `sharp` só nos scripts da skill; não entra no `package.json` do back.
- **rules/migration.md:** DDL aprovado antes de gerar. Nenhuma tabela nova, então não
  há policy nova: a `equipment_isolation` continua valendo para as colunas novas.
- **rules/restrictions.md e rules/secrets.md:** o agente prepara, o usuário executa
  em produção. Nenhuma variável nova: o script usa a `DATABASE_URL` que já existe.

## Migration (aguarda aprovação do DDL)

```sql
ALTER TABLE "equipment"
  ADD COLUMN "image_path"    TEXT,
  ADD COLUMN "photo_source"  TEXT,
  ADD COLUMN "photo_author"  TEXT,
  ADD COLUMN "photo_license" TEXT,
  ALTER COLUMN "asset_tag" SET NOT NULL;

CREATE UNIQUE INDEX "equipment_tenant_id_asset_tag_key"
  ON "equipment"("tenant_id", "asset_tag");

ALTER TABLE "equipment" ADD CONSTRAINT "equipment_category_check"
  CHECK ("category" IN ('notebook', 'monitor', 'cabo', 'camera'));
```

- **Linhas existentes:** produção tem 0 linhas (consulta do usuário em 2026-11-05: total
  0, com patrimônio 0, distintos 0), então nem o NOT NULL, nem o índice, nem o CHECK têm
  como falhar. O banco local é refeito pelo `migrate reset`.
- **`asset_tag` obrigatório:** o pedido é patrimônio único, e nulo escapa do índice.
- **Colunas opcionais:** as de imagem e crédito aceitam nulo. Se o cadastro vai exigi-las
  é decisão da spec do cadastro.
- **CHECK:** entra como SQL bruto na mesma migration, como o `equipment_status_check`,
  porque o Prisma não modela CHECK.

## Desenho

### Dados: `back/prisma/dados/equipamentos-iniciais.json`
`back` é outro repositório, então a lista consolidada fica nele: `assetTag`, `name`,
`category`, `status`, `imagePath`, `photoSource`, `photoAuthor`, `photoLicense`. Um teste
compara o arquivo com `equipamentos.json` e `creditos.json` da skill quando a pasta
vizinha existe, para acusar divergência. Sem a pasta, como num clone só do back, esse
teste é pulado, e os testes do próprio arquivo continuam valendo.

### Script: `back/prisma/seed-iniciais.ts` (`npm run seed:iniciais`)
- `seedEquipamentos(prisma)`: chama `seedTenant` e depois
  `equipment.createMany({ skipDuplicates: true })`, que vira `ON CONFLICT DO NOTHING`.
  Nunca há update, então um `emprestado` futuro não volta para `disponivel`. Devolve
  criadas e total.
- Fica fora do `prisma.seed`: `migrate reset` continua criando só o tenant.
- `--alvo local`: carrega `.env` e recusa host que não seja `localhost`/`127.0.0.1`.
- `--alvo producao`: não carrega arquivo, exige terminal interativo, recusa host local e
  pede o ref do projeto, extraído da `DATABASE_URL` (`db.<ref>.supabase.co` ou usuário
  `postgres.<ref>` do pooler). Antes de escrever, mostra o host de destino.
- Saída: `criadas: N · já existiam: M · total: T`. Erro passa por remoção da URL de
  conexão, para a senha do banco não aparecer no terminal.

### Envio: `skills/imagens-equipamentos/scripts/enviar.mjs`
- Por padrão manda `x-upsert: false`. A decisão fica numa função pura em `lib.mjs`, que
  trata conflito como "já existia". O Storage pode responder conflito como HTTP 409 ou
  como HTTP 400 com `statusCode: "409"` no corpo; a função aceita os dois, e o caminho
  real é testado no Supabase local.
- Em conflito, baixa a URL pública, compara o sha256 com o arquivo local e avisa se
  diferir, sem alterar nada.
- `--substituir` manda `x-upsert: true`.
- `SKILL.md` é atualizado no fluxo e na tabela de garantias.

### Hook: `hooks/regras.mjs`
O padrão atual só pega seed com `.supabase.co` no texto do comando, e
`npm run seed:iniciais -- --alvo producao` não tem isso. Entra um padrão igual ao do
`enviar.mjs`, com teste. Commit próprio, porque é regra e não código.

O verificador hoje só roda `npm`, `git` e `cd`, então não consegue executar os testes do
hook que provam o CA-05. `PERMITIDOS_VERIFICADOR` passa a aceitar exatamente
`node --test hooks/regras.test.mjs`, com teste de que esse comando passa e de que outro
`node` continua negado.

### Variável: `back/.env.example`
Na T4, entra `PIXABAY_API_KEY=` sem valor. O `SKILL.md` lê essa chave do `.env.local` do
back, e `rules/secrets.md` pede que ela esteja no `.env.example`.

## Produção (executado pelo usuário, nesta ordem)

1. **Merge do PR do back:** o CI aplica a migration e a Vercel publica. A API não lê as
   colunas novas, então a ordem entre os dois não importa.
2. **Conta:** criar o usuário pelo painel do Auth (Add user, com Auto Confirm User) e só
   a membership por SQL, antes do primeiro login: o claim de tenant é gravado quando o
   token é emitido. A senha fica só no painel, nunca em arquivo ou no editor SQL.
   ```sql
   insert into public.memberships (user_id, tenant_id, role, display_name)
   select u.id, t.id, 'colaborador', 'Marcelo Grilo'
   from auth.users u cross join public.tenants t
   where u.email = 'marcelo.grilo@institutojef.org.br' and t.slug = 'suporte_ti'
   on conflict (user_id, tenant_id) do nothing;
   ```
3. **Imagens:** `npm ci` e `node enviar.mjs --alvo producao` em `scripts/`, com
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` só no processo.
4. **Dados:** `npm run seed:iniciais -- --alvo producao` em `back/`, com `DATABASE_URL`
   só no processo.
5. **Repetir os passos 3 e 4** e guardar as saídas (CA-10).
6. **Evidências** em `evidencias/`: login (CA-07), resultado do SELECT dos 12 e contagem
   de empréstimos (CA-08), saída do envio (CA-09), saída da repetição (CA-10). O agente
   passa os comandos exatos nesse momento.

## Verificação

1. Com T1 a T6 commitadas, o verificador roda com back e raiz limpos. Resultado esperado:
   PRONTA PARA PRODUÇÃO, com CA-07 a CA-10 em AGUARDA PRODUÇÃO.
2. Só então abre o PR do back (pedindo antes para o push).
3. Depois das evidências, o verificador roda de novo. Com PRONTA, entra `Status: PRONTA`
   e abre o PR do repositório do agente.
