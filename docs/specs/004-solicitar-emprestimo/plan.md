# 004 — Solicitar empréstimo · Plano

Spec: [spec.md](spec.md).

## ADRs e regras que restringem

- **ADR-001 §3:** Controller → Service → Repository, com validação Zod e contexto de
  request em `AsyncLocalStorage`.
- **ADR-001 §4:** cliente gerado do `openapi.json`, erro em Problem Details, paginação
  de listas por cursor e rotas com `/v1`.
- **ADR-001 §5:** Prisma Migrate é o único dono do schema; índice parcial, grants e
  policies entram como SQL bruto na migration.
- **ADR-001 §6:** tenant e usuário vêm só do token.
- **ADR-001 §7:** RLS com deny by default, como defesa em profundidade. A autorização
  real fica na API. O CASL não entra: nenhuma regra desta spec muda por papel.
- **ADR-001 §8 e rules/tests.md:** constraint, transação, concorrência e RLS são testadas
  contra Postgres real (Testcontainers), com um caso de isolamento por endpoint.
- **ADR-001 §10:** auditoria append-only. **Desvio consciente:** sem rate limit (spec.md).
- **ADR-002 e layout.md:** classes do Nocturne + estilo inline, sem classe própria de
  produto. `.dialog` e suas partes são do vocabulário do Nocturne (§5) e faltam na folha.
- **rules/migration.md, rules/restrictions.md, rules/secrets.md:** DDL aprovado antes de
  gerar; o usuário executa em produção. Nenhuma variável e nenhuma dependência nova.

## Migration (DDL aprovado em 2026-11-06)

```sql
-- Regra 6: no máximo um empréstimo aberto por equipamento.
CREATE UNIQUE INDEX "loans_one_open_per_equipment"
  ON "loans"("equipment_id") WHERE "returned_at" IS NULL;

-- Deny by default (ADR-001 §7). A API conecta como dona das tabelas e não é afetada.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON "loans", "equipment", "memberships", "tenants", "audit_log", "_prisma_migrations"
  FROM anon, authenticated;

-- Tabela nova deixa de nascer com escrita para esses papéis.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES FROM anon, authenticated;

-- As policies antigas valiam para todos os comandos: passam a valer só para leitura.
DROP POLICY "tenants_isolation" ON "tenants";
CREATE POLICY "tenants_read" ON "tenants" FOR SELECT TO authenticated
  USING ("id" = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY "equipment_isolation" ON "equipment";
CREATE POLICY "equipment_read" ON "equipment" FOR SELECT TO authenticated
  USING ("tenant_id" = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY "memberships_isolation" ON "memberships";
CREATE POLICY "memberships_own_read" ON "memberships" FOR SELECT TO authenticated
  USING ("tenant_id" = (auth.jwt() ->> 'tenant_id')::uuid
    AND "user_id" = (auth.jwt() ->> 'sub')::uuid);

DROP POLICY "loans_isolation" ON "loans";
CREATE POLICY "loans_own_read" ON "loans" FOR SELECT TO authenticated
  USING ("tenant_id" = (auth.jwt() ->> 'tenant_id')::uuid
    AND "user_id" = (auth.jwt() ->> 'sub')::uuid);

-- Leitura só do próprio ator: `loan.create` revelaria quem pegou o quê.
DROP POLICY "audit_log_isolation" ON "audit_log";
CREATE POLICY "audit_log_own_read" ON "audit_log" FOR SELECT TO authenticated
  USING ("tenant_id" = (auth.jwt() ->> 'tenant_id')::uuid
    AND "actor_id" = (auth.jwt() ->> 'sub')::uuid);
```

- **Linhas existentes:** a evidência da 003 registrou zero empréstimos em produção, e a
  aplicação ainda não cria empréstimos, então o índice não tem como falhar. O usuário
  confere antes do merge com `select count(*) from loans`.
- **`schema.prisma`:** o Prisma não modela índice parcial nem policy, então só muda o
  comentário de `Loan`. A migration é escrita à mão, sem `migrate diff`.
- **Hook do token:** a policy `memberships_auth_hook_read` e o `GRANT SELECT` para
  `supabase_auth_admin` ficam como estão.
- **`auth.uid()`:** não é usada, porque não existe no banco dos testes. `auth.jwt()` já é
  o que as policies leem.

## Acréscimos ao pedido (aprovados em 2026-11-06)

1. **`audit_log`:** o pedido limita o `SELECT` de `loans` e `memberships`. Como a 004
   passa a gravar `loan.create` com o ator e o equipamento, um colega leria em
   `audit_log` quem pegou o quê e quando, o que anula a regra de privacidade. Por isso,
   o DDL limita a leitura às linhas em que a pessoa é o ator.
2. **`TRUNCATE`, `REFERENCES` e `TRIGGER`:** o `GRANT ALL` também os concedeu, e `TRUNCATE`
   ignora RLS. Entram no `REVOKE`.
3. **`ALTER DEFAULT PRIVILEGES`:** sem ele, toda tabela nova volta a nascer com escrita
   para `anon` e `authenticated`.
4. **`_prisma_migrations`:** o RLS sem policy já barrava as linhas, mas não o `TRUNCATE`. O
   `SELECT` continua, e o RLS devolve zero linhas. O Prisma é o dono e não é afetado.

## Desenho

### Back: erros
`ProblemDetailsFilter` passa a aceitar um `type` vindo da exceção; o padrão continua
`about:blank`. Tipos: `urn:emprestai:erro:equipamento-indisponivel`,
`urn:emprestai:erro:limite-emprestimos` e `urn:emprestai:erro:emprestimo-em-atraso`.

### Back: `src/modules/equipment/`
`GET /v1/equipment?cursor&limit` (limit padrão 50, máximo 100), ordenado por patrimônio:

```
{ items: [{ id, assetTag, name, category, status, imagePath, myLoan: { dueAt } | null }],
  nextCursor, totals: { total, available } }
```

`myLoan` só vem preenchido para o empréstimo aberto do próprio usuário. O schema Zod da
resposta filtra o resto. A membership é conferida como em `MeService`.

### Back: `src/modules/loans/`
`POST /v1/loans { equipmentId }`. Numa transação interativa (`maxWait` 10 s e `timeout`
15 s: com `connection_limit=1`, um pedido pode esperar o outro, e cada query cruza dos EUA
até São Paulo):
1. `SELECT ... FOR UPDATE` na membership: serializa os pedidos da mesma pessoa, o que
   torna atômica a conferência do limite. Sem membership: 403.
2. Equipamento pelo id e pelo tenant. Não achou: 404.
3. Conta os abertos da pessoa: em atraso → 409; 3 ou mais → 409.
4. `updateMany` com `status = 'disponivel'` no filtro. Zero linhas → 409.
5. Calcula `due_at` no Postgres e cria o empréstimo; violação do índice → 409.
6. Grava `audit_log` e devolve 201.

Dois pedidos ao mesmo equipamento se serializam no `UPDATE`, e o segundo vê zero linhas.
A ordem de bloqueio é sempre a mesma (membership, depois equipamento), então não há
deadlock.

```sql
(((($1::timestamptz at time zone 'America/Sao_Paulo')::date + 15)::timestamp
  at time zone 'America/Sao_Paulo') - interval '1 millisecond') at time zone 'UTC'
```

A coluna é `TIMESTAMP(3)` em UTC, como o restante do schema, então o valor é convertido
com `at time zone 'UTC'` antes de gravar. Sem essa conversão, a coluna recebe a hora no
fuso da sessão. O teste usa instantes fixos, incluindo 22h de São Paulo, quando em UTC já
é o dia seguinte, e roda também com a sessão em outro fuso (`set local time zone`).

`GET /v1/loans/me?cursor&limit`, ordenado por retirada:

```
{ items: [{ id, equipment: { id, assetTag, name, category }, borrowedAt, dueAt, overdue }],
  nextCursor, totals: { open, overdue } }
```

### Back: `prisma/limpar-emprestimos-teste.ts`
`npm run limpar:emprestimos-teste -- --alvo <local|producao> --email <e-mail>`
- Reaproveita `resolverUrl` e `semUrlDeConexao` de `seed-iniciais.ts`.
- Recusa a conta protegida antes de conectar. Normaliza com `trim` e minúsculas.
- Acha a conta em `auth.users` e filtra pelo tenant `suporte_ti`.
- Mostra patrimônio, nome, retirada e devolução do que vai apagar e pede a digitação do
  e-mail. Com 0 empréstimos, informa e encerra.
- Na transação: apaga os empréstimos da conta e devolve a `disponivel` só os equipamentos
  com `status = 'emprestado'` que tinham empréstimo aberto dela.
- No fim, imprime só a leitura: apagados, devolvidos, empréstimos da conta protegida, e a
  contagem de equipamentos por situação.

### Raiz: hook
`hooks/regras.mjs` ganha em `PRODUCAO` o padrão de `limpar[:-]emprestimos-teste` com
`producao`, com testes em `regras.test.mjs` no mesmo formato do `seed:iniciais`.

### Raiz: `layout.md`
§3 e §5.2 (card com foto em 4:3, largura total), §7.1 (sem o nome da pessoa), §7.6 (texto
fixo de manutenção) e §7.7 (com outra pessoa, só a situação; com a própria, "Com você ·
devolver até {data}"). Seção nova "Alterações", com data, mudança e spec.

### Front
- `npm run api:sync` regenera o cliente, sem escrever cliente à mão.
- `.dialog-backdrop`, `.dialog`, `-title`, `-body` e `-actions` entram em `nocturne.css`,
  com o teste da lista de classes. Pill e toast seguem `.tag` e estilo inline.
- `src/pages/CatalogPage.tsx`: URL da imagem a partir de `VITE_SUPABASE_URL` e do bucket
  `equipamentos` (spec 003: quem exibe monta a URL). Sem imagem, mostra um bloco vazio do
  mesmo tamanho. "Carregar mais" só aparece com `nextCursor`. Crédito no rodapé da grade.
- Modal do §7.1. "Devolver até" é calculado com a mesma regra para o resumo, e a data que
  vale é a da resposta. 409 mostra o motivo pelo `type` e atualiza as consultas.
- `src/pages/MyLoansPage.tsx`: §5.3, sem o botão "Devolver".
- Datas com `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })`.
- `login-flow.test.tsx` muda só o que a spec substitui do CA-07 da 002: as telas Catálogo
  e Meus empréstimos deixam de ser "Em construção", e o mock responde às rotas novas.
- O teste do CA-19 fica no front e lê `../layout.md`, pulando se a pasta vizinha não
  existir, no mesmo padrão da spec 003.

## Produção (executado pelo usuário, nesta ordem)

Os comandos exatos vêm na hora de cada passo, em Windows PowerShell (não no ISE), uma
linha por vez. `DATABASE_URL` só no processo e, no pooler, com
`?pgbouncer=true&connection_limit=1`.

1. **Conferir** `select count(*) from loans` antes do merge do back.
2. **Merge do PR do back:** o CI aplica a migration e a Vercel publica.
3. **Merge do PR do front:** só depois do back, porque o front usa as rotas novas.
4. **Permissões (CA-24):** consulta de leitura de grants e policies, e a tentativa real
   abaixo. O `raise exception` final desfaz tudo e mostra o resultado no SQL Editor. Cada
   tabela tem o próprio tratamento de erro, porque um erro sem tratamento abortaria a
   transação na primeira. O `WHERE false` não altera linha, e `permission denied` sai antes
   de executar.
   ```sql
   begin;
   set local role authenticated;
   do $$
   declare t text; resultado text := '';
   begin
     foreach t in array array['loans','equipment','memberships','tenants','audit_log'] loop
       begin
         execute format('update public.%I set id = id where false', t);
         resultado := resultado || t || ': UPDATE ACEITO (falha) | ';
       exception when insufficient_privilege then
         resultado := resultado || t || ': permission denied | ';
       end;
     end loop;
     raise exception 'RESULTADO: %', resultado;
   end $$;
   rollback;
   ```
5. **Conta de teste:** criar pelo painel do Auth e a membership por SQL, como na 003, antes
   do primeiro login.
6. **Testes na tela** com a conta de teste, guardando as evidências: catálogo (CA-20),
   manutenção (CA-21), solicitar e "Meus empréstimos" (CA-22), quarto pedido recusado
   (CA-23).
7. **Limpeza** com o script e consulta final (CA-25). Isso vem por último: os CAs 22 e 23
   precisam dos empréstimos, e o estado final não pode tê-los.

Atraso e pedidos simultâneos ficam provados em Postgres real (CA-11 e CA-12), não em
produção: o atraso exigiria alterar dados à mão, e a lista final do pedido não os cita.

## Verificação

1. Com as tarefas do agente commitadas, o verificador roda com back, front e raiz limpos.
   Resultado esperado: PRONTA PARA PRODUÇÃO, com CA-20 a CA-25 em AGUARDA PRODUÇÃO.
2. Só então abrem os PRs de back e front, pedindo antes para o push.
3. Depois das evidências, o verificador roda de novo. Com PRONTA, entram `Status: PRONTA`,
   o estado do projeto em `AGENTS.md`, o diário e o handoff, e abre o PR da raiz.
