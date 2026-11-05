# ADR-001 — Stack

## Decisões

### 1. Repositórios

| Item | Escolha |
|---|---|
| Estrutura | Dois repositórios: um para o front, um para a API |
| Projetos na Vercel | Dois, um por repositório |
| Compartilhamento de tipos | Nenhum pacote compartilhado; via OpenAPI gerado |

- **Estrutura** — front e API têm ciclo de release e responsáveis diferentes; repositório separado deixa o histórico e as permissões separados também.
- **Projetos na Vercel** — segue a mesma separação de repositórios: um projeto por repositório, sem projeto compartilhado entre front e API.
- **Compartilhamento de tipos** — publicar pacote npm privado e bumpar versão a cada campo alterado é atrito maior do que o ganho; o contrato atravessa via arquivo gerado.

### 2. Frontend

| Item | Escolha |
|---|---|
| Linguagem | TypeScript em modo `strict` |
| Biblioteca de UI | React |
| Build e dev server | Vite |
| Roteamento | React Router (data APIs) |
| Estado de servidor | TanStack Query |
| Estado de cliente | Zustand |
| Formulários | React Hook Form + `zodResolver` |
| Estilização | Folha única do design system (Nocturne recriado) + estilo inline — ver ADR-002 §6 |
| Componentes | Componentes React próprios usando as classes do Nocturne — ver ADR-002 §5 |
| Cliente da API | Gerado a partir do `openapi.json` com orval |

- **Linguagem** — sem `strict` o tipo gerado da API não pega os casos de nulo, que são exatamente os que quebram em produção.
- **Biblioteca de UI** — já era a decisão; mantida.
- **Build e dev server** — o app é uma SPA sem necessidade de renderização no servidor, então não preciso do peso de um framework full-stack.
- **Roteamento** — preciso de rotas aninhadas e proteção de rota por sessão; escrever isso na mão custa mais do que a curva da biblioteca.
- **Estado de servidor** — com REST puro eu teria que reimplementar cache, revalidação, retry e estado de loading em cada tela; isso é a maior fonte de bug repetido em SPA.
- **Estado de cliente** — o estado que sobra depois do TanStack Query é pouco (UI, filtros, wizard), e não justifica uma store grande.
- **Formulários** — o schema Zod do formulário sai do mesmo OpenAPI, então a regra de validação de formato não é reescrita.
- **Estilização** — o design vem de `layout.md` e precisa ser reproduzido de perto; biblioteca com visual próprio brigaria com isso. Tailwind + shadcn/ui foi a escolha original, substituída para não conflitar com o ADR-002 (classes do Nocturne + inline, sem classe própria).
- **Componentes** — o componente fica dentro do repositório, sem API de biblioteca por trás, então customizar não vira luta contra a dependência; o visual vem das classes do Nocturne.
- **Cliente da API** — cliente HTTP escrito à mão é onde o tipo da resposta é reescrito errado e ninguém percebe até a tela quebrar.

### 3. Backend

| Item | Escolha |
|---|---|
| Runtime | Node.js LTS |
| Framework | NestJS |
| Adapter HTTP | Express do próprio Nest, chamado direto pela Vercel Function, com instância cacheada |
| Organização de pastas | Por domínio (`src/modules/<dominio>/`) |
| Camadas | Controller → Service → Repository |
| Validação de entrada | Zod via `nestjs-zod` |
| Contexto de request | `AsyncLocalStorage` com `tenant_id` e `user_id` |

- **Runtime** — o mesmo TypeScript roda nos dois lados e a versão LTS me dá janela de suporte previsível.
- **Framework** — já era a decisão; mantida. Injeção de dependência é o que torna o service testável sem subir a aplicação inteira.
- **Adapter HTTP** — na Vercel o Nest não roda como processo; sem guardar a aplicação criada fora do handler, cada request paga o bootstrap do container de DI. A escolha original era `@vendia/serverless-express`, mas ele converte eventos da AWS Lambda; a Vercel Function Node já entrega `req`/`res` HTTP, então o app Express do Nest é chamado direto (corrigido em 2026-10-19).
- **Organização de pastas** — organizar por camada técnica (`controllers/`, `services/`) faz cada feature nova espalhar arquivos em quatro pastas distantes.
- **Camadas** — substitui "MVC" da lista original: não existe View no servidor, o front é uma SPA separada. O Repository isola o Prisma para o service não depender de ORM.
- **Validação de entrada** — é o que gera o OpenAPI a partir do mesmo schema que valida a entrada; com dois validadores, o documento gerado e a validação real divergem.
- **Contexto de request** — passar `tenant_id` como parâmetro em toda assinatura de método é o tipo de coisa que alguém esquece uma vez e vira vazamento entre tenants.

### 4. Contrato de API

| Item | Escolha |
|---|---|
| Estilo | REST |
| Fonte do contrato | OpenAPI gerado dos schemas Zod do Nest |
| Distribuição | `openapi.json` publicado como artefato do CI da API |
| Consumo | Front regenera o cliente por script, versionado no repositório |
| Versionamento | Prefixo de rota `/v1` |
| Formato de erro | RFC 9457 (Problem Details) |
| Paginação de listas | Cursor |
| Tempo real | Fora de escopo — Vercel não suporta WebSocket |

- **Estilo** — já era a decisão; mantida. O modelo de recurso casa com o CRUD que domina o app.
- **Fonte do contrato** — ts-rest exige que os dois lados importem o mesmo pacote, o que não existe com repositórios separados; o OpenAPI atravessa a fronteira como arquivo.
- **Distribuição** — deixa a mudança de contrato visível no diff do PR, que é o substituto possível para o build quebrar sozinho.
- **Consumo** — deixa a mudança de contrato visível no diff do PR, que é o substituto possível para o build quebrar sozinho.
- **Versionamento** — adicionar versionamento depois que existe cliente em produção obriga a manter rota sem versão para sempre.
- **Formato de erro** — sem formato único de erro, cada tela trata a falha de um jeito e o front acaba lendo string de mensagem.
- **Paginação de listas** — offset fica lento e duplica registro quando a lista recebe escrita concorrente.
- **Tempo real** — function serverless não mantém conexão aberta; atualização de tela é polling do TanStack Query.

### 5. Dados e persistência

| Item | Escolha |
|---|---|
| Banco | PostgreSQL gerenciado pelo Supabase |
| ORM | Prisma |
| Dono do schema | Prisma Migrate (único) |
| Objetos não cobertos pelo Prisma | SQL bruto dentro das migrations do Prisma |
| Conexão de runtime | Supavisor, porta 6543, `?pgbouncer=true&connection_limit=1` |
| Conexão de migration | `directUrl`, porta 5432 |
| Seed | `prisma/seed.ts`, idempotente, cria o tenant `suporte_ti` |

- **Banco** — já era a decisão; mantida. Traz Auth e Storage sem eu operar servidor de banco.
- **ORM** — já era a decisão; mantida. Tipagem gerada a partir do schema é o que evita divergência entre modelo e código.
- **Dono do schema** — Prisma Migrate e Supabase CLI gerenciando o mesmo banco se sobrescrevem; ter dois donos de schema é como o ambiente diverge de produção sem ninguém notar.
- **Objetos não cobertos pelo Prisma** — o Prisma não modela esses objetos, então eles precisam entrar na mesma linha do tempo versionada, não como script solto aplicado à mão.
- **Conexão de runtime** — obrigatório em serverless, não recomendação: a Vercel escala instâncias em paralelo e cada uma abrindo pool próprio esgota a conexão do projeto.
- **Conexão de migration** — o pooler em transaction mode não suporta os comandos que a migration usa; sem os dois endpoints configurados, `prisma migrate deploy` falha em produção.
- **Seed** — seed que só funciona em banco vazio não serve para ambiente de teste que roda várias vezes.

### 6. Multi-tenancy

| Item | Escolha |
|---|---|
| Modelo | Tenant discriminado por coluna, banco único |
| Coluna | `tenant_id` em toda tabela de domínio |
| Vínculo usuário–tenant | Tabela `memberships (user_id, tenant_id, role)` |
| Primeiro tenant | `suporte_ti`, criado no seed |
| Origem do tenant no request | Claim do JWT, resolvido no guard, nunca do body |

- **Modelo** — schema por tenant multiplicaria cada migration pelo número de tenants; para um sistema interno o isolamento lógico basta.
- **Coluna** — tabela sem a coluna não tem como ser protegida por policy e vira o buraco por onde o dado vaza.
- **Vínculo usuário–tenant** — a mesma pessoa pode atuar em mais de uma área com papel diferente em cada; papel gravado no usuário não representa isso.
- **Primeiro tenant** — a estrutura existe desde o primeiro schema mesmo com um único tenant, porque adicionar `tenant_id` depois exige backfill e revisão de toda query que toca a tabela.
- **Origem do tenant no request** — se o cliente manda o tenant no corpo ou na query, trocar o valor é toda a exploração necessária.

### 7. Autenticação e autorização

| Item | Escolha |
|---|---|
| Provedor de identidade | Supabase Auth, e-mail e senha |
| Cadastro | Fechado, somente por convite de administrador |
| Sessão no navegador | Token no header, gerenciado pelo `supabase-js` |
| Domínio | `*.vercel.app`, um por projeto |
| Verificação de token na API | Nest valida o JWT via JWKS do Supabase |
| CORS | Allowlist com a origem do front, `credentials` habilitado |
| Fonte da verdade de autorização | Guards do Nest + CASL |
| RLS | Habilitado em todas as tabelas, deny by default |
| Papel do RLS | Defesa em profundidade, não autorização primária |

- **Provedor de identidade** — não há domínio corporativo para federar; SSO fica fora de escopo.
- **Cadastro** — sem domínio de e-mail para filtrar, cadastro aberto deixa qualquer pessoa que descubra a URL criar conta num sistema que guarda inventário de infraestrutura.
- **Sessão no navegador** — `vercel.app` está na Public Suffix List, então o navegador proíbe cookie no domínio pai; front e API em subdomínios diferentes teriam sessões isoladas e o cookie `httpOnly` não atravessaria. Sem domínio próprio, token no header é o que resta, e a renovação e a persistência de sessão já vêm resolvidas pelo `supabase-js`.
- **Domínio** — `vercel.app` está na Public Suffix List, o que impede cookie de sessão no domínio pai e é a razão de usar token no header entre front e API em subdomínios diferentes.
- **Verificação de token na API** — a API não pode confiar em header enviado pelo cliente; validar assinatura contra a chave pública fecha isso sem consultar o Supabase a cada request.
- **CORS** — front e API vivem em subdomínios diferentes e a sessão é levada por token no header, então a origem do front precisa estar liberada explicitamente.
- **Fonte da verdade de autorização** — o Prisma conecta com um role dono das tabelas, que bypassa RLS por padrão; com um Nest no meio, as policies só rodariam se cada request abrisse transação com `SET LOCAL role` e `SET LOCAL request.jwt.claims`, o que custa uma transação por request e briga com o pooler. As regras são por papel e por tenant ao mesmo tempo; `if (user.role === 'admin')` espalhado por controller não sobrevive à terceira regra.
- **RLS** — se uma credencial vazar ou um endpoint esquecer o guard, a policy é a última barreira entre tenants.
- **Papel do RLS** — o Prisma bypassa RLS por padrão ao conectar com o role dono das tabelas, então a autorização real acontece na aplicação; o RLS fica como barreira adicional, não como mecanismo que a aplicação depende para autorizar.

### 8. Testes

| Item | Escolha |
|---|---|
| Unitário no backend | Jest |
| Unitário no frontend | Vitest |
| Integração de banco | Testcontainers com Postgres real |
| Teste de API | supertest sobre a app Nest |
| E2E de interface | Playwright |
| Teste obrigatório de isolamento | Um caso por endpoint: tenant A não enxerga dado de tenant B |
| Verificação de contrato | CI do front falha se o cliente gerado divergir do `openapi.json` publicado |
| Meta de cobertura | Sem percentual; caminhos críticos obrigatórios |

- **Unitário no backend** — já era a decisão; é o padrão do Nest e o que os schematics geram.
- **Unitário no frontend** — com Vite, o Jest exige configuração de transform paralela ao build; o Vitest usa o mesmo pipeline e a mesma config.
- **Integração de banco** — mockar o Prisma testa o mock, não o banco. Constraint, cascade, transação e policy de RLS só falham contra Postgres de verdade.
- **Teste de API** — valida o contrato como o cliente vai consumir, incluindo guard, pipe de validação e filtro de exceção.
- **E2E de interface** — os fluxos que travam a operação (login, abertura de chamado, cadastro de ativo) precisam ser testados no navegador.
- **Teste obrigatório de isolamento** — vazamento entre tenants é a falha mais cara desse sistema e a mais fácil de introduzir sem perceber; precisa ser verificada por teste, não por revisão.
- **Verificação de contrato** — com repositórios separados, nada quebra sozinho quando a API muda; essa checagem é o substituto do build compartilhado.
- **Meta de cobertura** — meta de cobertura produz teste escrito para subir número; caminho crítico é critério verificável.

### 9. Hospedagem e operação

| Item | Escolha |
|---|---|
| Hospedagem | Vercel (front e API, projetos separados) |
| Plano | Hobby |
| Região das functions | Padrão do Hobby (Estados Unidos) |
| Região do Supabase | `sa-east-1` (São Paulo) |
| Limite de execução | 60s por request (teto do Hobby) |
| Fila e trabalho assíncrono | Fora de escopo; tudo roda dentro do request |
| Agendamento | Fora de escopo; sem cron |
| Configuração | Variáveis de ambiente validadas com Zod no boot |
| Log | pino em JSON, com `request_id` e `tenant_id` |
| Rastreamento de erro | Sentry (API e front) |
| CI | GitHub Actions, um workflow por repositório |
| Migration em deploy | `prisma migrate deploy` em job do GitHub Actions, antes do deploy |

- **Hospedagem** — já era a decisão; mantida, e a conta já existe com outros projetos.
- **Plano** — o Hobby cobre uso pessoal não-comercial, que é o caso: projeto de disciplina, sem cobrança, sem receita e sem ninguém sendo pago para escrever o código. Se o sistema um dia sair do contexto acadêmico e for usado de fato pela empresa, o plano precisa mudar antes.
- **Região das functions** — São Paulo é oferecida apenas no Pro; no Hobby as functions rodam nos EUA e cada query paga ida e volta transatlântica. Em contexto de demonstração isso é aceitável, mas é o primeiro item a mudar se o projeto for usado de verdade.
- **Região do Supabase** — é o outro lado da mesma travessia: functions nos EUA (teto do Hobby) e banco em São Paulo, o que faz cada query pagar ida e volta transatlântica.
- **Limite de execução** — vira o teto de qualquer operação: importação de planilha de ativos, sincronização e relatório grande precisam ser desenhados em lotes que caibam nesse tempo.
- **Fila e trabalho assíncrono** — não há volume assíncrono conhecido agora; adicionar infraestrutura de fila sem caso de uso é custo sem retorno. A consequência é que envio de e-mail e integração externa rodam dentro do request e seguram a resposta.
- **Agendamento** — não há volume assíncrono conhecido agora; adicionar infraestrutura sem caso de uso é custo sem retorno.
- **Configuração** — falhar na subida é melhor que `undefined` virando comportamento silencioso em produção.
- **Log** — investigar incidente em sistema multi-tenant sem poder filtrar por tenant é procurar no escuro.
- **Rastreamento de erro** — sem captura de exceção, eu descubro o erro pelo usuário reclamando.
- **CI** — justificativa não informada.
- **Migration em deploy** — em serverless várias instâncias sobem em paralelo e tentariam migrar ao mesmo tempo.

### 10. Segurança

| Item | Escolha |
|---|---|
| Cabeçalhos HTTP | helmet |
| CSP | Restritiva, sem `unsafe-inline` |
| Rate limit | Por IP e por usuário, com contador no Postgres |
| Segredos | Environment variables da Vercel, fora do repositório |
| `service_role` key do Supabase | Somente na API, nunca no bundle do front |
| Auditoria | Tabela append-only com ator, tenant, ação e recurso |

- **Cabeçalhos HTTP** — cabeçalho de segurança ausente é achado de pentest previsível e barato de evitar.
- **CSP** — com o token acessível ao JavaScript, a CSP é a principal defesa contra roubo de sessão; e mesmo com cookie, ela impede o XSS de agir em nome do usuário.
- **Rate limit** — `@nestjs/throttler` em memória não funciona em serverless, porque cada instância tem contador próprio e o limite nunca é atingido.
- **Segredos** — justificativa não informada.
- **`service_role` key do Supabase** — essa chave ignora RLS; no bundle do front ela dá acesso total ao banco para qualquer visitante.
- **Auditoria** — sistema de TI precisa responder quem mudou o quê; retrofitar log de auditoria depois não recupera o passado.

### 11. Qualidade de código

| Item | Escolha |
|---|---|
| Lint e formatação | ESLint + Prettier, config replicada nos dois repositórios |
| Hook de pré-commit | lint-staged + husky, apenas lint e formatação |
| Convenção de commit | Nenhuma automação; mensagem escrita pela pessoa |

- **Lint e formatação** — com repositórios separados não há pacote comum; a duplicação é aceita e a divergência é resolvida na revisão.
- **Hook de pré-commit** — barra o erro trivial antes do CI sem interferir na mensagem de commit.
- **Convenção de commit** — a mensagem é responsabilidade de quem commita; validação automática de formato seria cerimônia sem changelog gerado para justificar.

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Monorepo com pacote de contrato compartilhado | Contraria a decisão de repositórios separados |
| ts-rest | Exige que os dois lados importem o mesmo pacote, que não existe com repositórios separados |
| Pacote npm privado com os tipos | Bump de versão a cada campo alterado é atrito maior que o ganho |
| RLS como autorização primária | O Prisma conecta com role dono da tabela e bypassa RLS; fazer valer exigiria transação com `SET LOCAL` por request |
| Front falando direto com o Supabase, sem API | Tira o lugar onde regra de negócio e segredo de integração podem viver, e faria a tela driblar a autorização por tenant |
| Cadastro aberto por e-mail | Sem domínio corporativo para filtrar, qualquer pessoa com a URL criaria conta |
| SSO corporativo (OIDC/SAML) | Não há e-mail corporativo para federar |
| Cookie `httpOnly` para a sessão | `vercel.app` está na Public Suffix List; sem domínio próprio o cookie não atravessa do front para a API |
| Domínio próprio com subdomínios | Custo e configuração que o escopo da disciplina não justifica |
| Supabase CLI como dono das migrations | Dois donos de schema no mesmo banco se sobrescrevem |
| BullMQ, pg-boss ou qualquer fila | Sem volume assíncrono conhecido; e worker de vida longa não roda na Vercel |
| Vercel Cron | Sem caso de uso agendado no escopo atual |
| Schema ou banco por tenant | Multiplicaria cada migration pelo número de tenants sem exigência regulatória que justifique |
| `@nestjs/throttler` em memória | Contador por instância não limita nada em ambiente que escala horizontalmente |
| tRPC | Fecha a porta para consumidor não-TypeScript; REST foi decidido antes |
| GraphQL | Custo de schema, resolver e cache não se paga no volume de telas atual |
| Cliente HTTP escrito à mão | Reescrever o tipo da resposta anula o ganho de TypeScript nas duas pontas |
| `class-validator` | Não gera o OpenAPI a partir do mesmo schema que valida a entrada |
| Prisma mockado nos testes de repositório | Testa o mock; constraint, transação e policy não são exercitadas |
| Jest no frontend | Exige pipeline de transform paralelo ao do Vite |
| Redux Toolkit | O estado de cliente restante é pequeno demais para o boilerplate |
| Biblioteca de componentes fechada (MUI, Mantine) | O design vem de `layout.md` e precisaria ser imposto por cima do visual da biblioteca |
| Tailwind CSS + shadcn/ui | Conflita com ADR-002: o estilo vem das classes do Nocturne + inline, sem segunda camada de utilitários nem tema de shadcn a manter |
| Next.js | Não preciso de SSR; teria dois backends no mesmo projeto |
| VPS ou container (Fly, ECS) para a API | Resolveria região, worker, WebSocket e uso justo, mas contraria a decisão de hospedagem |

## Consequências

**Fica mais fácil**
- Permissão, histórico e release do front e da API ficam separados.
- Testar service sem subir a aplicação, e testar repositório contra banco real.
- Auditar autorização: a decisão está em um lugar (CASL), não espalhada em `if`.
- Deploy: push na branch, sem pipeline de container para manter.
- Custo de infraestrutura próximo de zero enquanto o volume for baixo.

**Fica mais difícil**
- Mudança de contrato não quebra o build do front sozinha; depende de regenerar o cliente e da checagem no CI.
- Alterar uma feature que toca os dois lados exige dois PRs coordenados em repositórios diferentes.
- Latência: com as functions nos EUA e o banco em São Paulo, cada query paga a travessia.
- Cold start: a primeira invocação depois de ociosidade paga o bootstrap do Nest.
- Qualquer operação precisa caber em 60s, o que obriga a desenhar importação e relatório em lotes.
- Envio de e-mail e integração externa seguram a resposta do request.
- Manter guards e RLS coerentes exige disciplina — policy desatualizada dá falsa sensação de proteção.
- O token de sessão fica acessível ao JavaScript, então qualquer XSS ou dependência comprometida vira sequestro de sessão; a CSP é a única barreira.
- Config de lint duplicada nos dois repositórios pode divergir sem ninguém notar.

**O que isso impede de fazer depois sem custo**
- Qualquer funcionalidade com conexão aberta (notificação em tempo real, terminal remoto, streaming de log): a Vercel não suporta WebSocket.
- Processamento longo (importação grande, varredura de rede, relatório pesado): estoura o limite de execução.
- Trabalho agendado ou assíncrono: exige introduzir fila e um lugar para o worker rodar, que não é a Vercel.
- Deixar o front falar direto com o Supabase para uma tela específica: essa tela passa a driblar a autorização por tenant.
- Trocar Prisma por outro ORM: as migrations e o SQL de RLS estão dentro do Prisma Migrate.
- Sair do Supabase: Auth, banco e políticas estão acoplados ao projeto.
- Adicionar `tenant_id` a uma tabela criada sem ele: exige backfill e revisão de toda query que a toca.
- Federar com identidade corporativa depois: exige migrar os usuários já cadastrados por e-mail e senha.
- Trocar para cookie `httpOnly`: exige domínio próprio, mover o login para dentro do Nest e refazer o tratamento de CORS e CSRF.
- Unir os repositórios depois: histórico separado e dependências divergentes tornam a junção um trabalho, não um comando.

**Dependência do contexto acadêmico**
- O plano Hobby só vale enquanto o projeto for didático. Se a empresa passar a usar o sistema, é preciso migrar para Pro antes, porque a conta hospeda outros projetos e a exposição seria de conta, não de projeto.

## O que este ADR não decide

- Modelagem de domínio, entidades e relacionamentos.
- Design system, tokens e identidade visual.
- Papéis e matriz de permissão dentro de cada tenant.
- Provisionamento de tenant: quem cria, como se convida usuário.
- Provedor de e-mail transacional e demais integrações.
- Estratégia de backup, retenção e plano de recuperação.
- Ambientes (quantos, como são promovidos) e política de branch.
- Feature flags.
- Observabilidade além de log e erro (métrica, tracing distribuído).
- LGPD: base legal, política de retenção e fluxo de exclusão de dados.
- SLO, meta de latência e orçamento de custo.
