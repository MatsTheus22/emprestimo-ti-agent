# ADR-002 — Design system

Fonte: `layout.md` (especificação de layout v1, handoff completo de telas).
Este ADR registra as decisões de design system por trás daquele documento;
`layout.md` continua a fonte de valores exatos (px, cor, textos de tela,
dados de exemplo) e specs de página individuais.

## Decisões

### 1. Base do design system

| Item | Escolha |
|---|---|
| Design system de base | Nocturne (interface escura, densa) |
| Customização | Acento e tipografia substituídos pela marca EMPREST.AI; estrutura, classes e regras de uso do Nocturne mantidas |
| Regra geral de cor | Acento nunca preenche área grande — usado como linha, borda ou brilho |

- **Design system de base** — adotar um sistema pronto evita desenhar tipografia, espaçamento, elevação e comportamento de componente do zero; o handoff em `layout.md` já cobre todas as telas do produto em cima dele.
- **Customização por token, não por reescrita** — trocar o acento e a fonte no `:root` basta para a marca aparecer sem recriar `.btn`, `.card`, `.table` etc.; a estrutura do Nocturne continua a de referência para telas futuras.
- **Acento como linha/brilho** — mantém a interface "quieta": numa tela densa (inventário, tabela de operações), cor sólida em área grande compete com o dado em vez de guiar o olho até ele.

### 2. Tokens de cor

| Item | Escolha |
|---|---|
| Fundo e superfície | `--color-bg #161826`, `--color-surface #232532` — nunca preto puro |
| Texto | `--color-text #e9e9ed` — nunca branco puro; variações por transparência (40–72%), nunca cinza novo |
| Acento da marca | Teal `#2fb8ac` (500), rampa 100→900 |
| Uso da rampa de acento | 500 em borda/linha/ícone/número de destaque · 300 em texto de parágrafo sobre fundo escuro · 900 em preenchimento tintado · 700 em borda desses preenchimentos |
| Cores semânticas | 4 estados fixos (disponível/em dia, emprestado/a vencer, em atraso/erro, manutenção/inativo), cada um com trinca fg/bg/bd própria |

- **Fundo e superfície sem preto/branco puro** — preto e branco puros criam contraste duro demais numa interface que fica aberta por longas sessões de operação; o par `#161826`/`#232532` dá profundidade sem fadiga visual.
- **Texto por transparência** — gerar hierarquia de texto secundário com opacidade sobre um único token evita que a paleta cresça um cinza novo por caso de uso, e mantém a relação de contraste previsível em qualquer fundo escuro do sistema.
- **Rampa de acento fechada (100–900)** — ter a rampa pronta evita decidir um tom de teal novo cada vez que surge um caso (hover, pressed, texto sobre fundo escuro); cada uso aponta para um degrau já calibrado para contraste.
- **4 cores semânticas fixas** — disponibilidade, prazo e manutenção são os três sinais que toda tela do produto precisa comunicar (catálogo, meus empréstimos, operações); fixar as quatro trincas evita que cada tela nova invente sua própria cor de "atraso".

### 3. Tipografia

| Item | Escolha |
|---|---|
| Família | Raleway única (Google Fonts), pesos 400/500/600/700 |
| Peso | Títulos 600, corpo 400 |
| Escala | 11px (kicker) a 44px (H1 de login), ~13 degraus nomeados por uso de tela |

- **Família única** — duas famílias (ex.: uma para título, outra para corpo) multiplicam peso de carregamento de fonte e decisão de pareamento sem ganho perceptível numa interface funcional, não editorial.
- **Peso 600 para título / 400 para corpo** — intervalo de dois pesos é suficiente para hierarquia e evita carregar pesos extras (500/700 ficam reservados a casos pontuais como a marca).
- **Escala nomeada por uso** — a escala em `layout.md` §2 é amarrada a elemento de tela (H1 de login, número de KPI, nota), não a uma escala abstrata tipo type-scale numérica; isso impede que uma tela nova escolha um tamanho fora do vocabulário já estabelecido.

### 4. Espaçamento, raio e elevação

| Item | Escolha |
|---|---|
| Unidade de espaçamento | Escala do Nocturne em densidade 0.70× (2.8 · 5.6 · 8.4 · 11.2 · 16.8 · 22.4px) |
| Raio | `--radius-sm 4px` (chip/traço) · `--radius-md 8px` (botão, input, linha de lista) · `--radius-lg 14px` (card, painel, modal) |
| Elevação | `--shadow-sm/md/lg` do sistema, nunca sombras empilhadas |
| Espaçamento entre irmãos | Sempre flex/grid com `gap`, nunca margem por elemento |

- **Densidade 0.70×** — o produto é uma ferramenta operacional (tabela de empréstimos, grade de inventário) que se beneficia de mais itens visíveis por tela; a densidade padrão do Nocturne deixaria menos linha visível sem ganho de legibilidade.
- **Três raios fixos por categoria de elemento** — controla o vocabulário visual (nada de raio arbitrário por componente) e já resolve a pergunta "que raio esse elemento novo usa" por categoria: controle, container, ou pill/traço (999px, fora da escala, reservado a indicadores de estado).
- **`gap` em vez de margem** — margem por elemento quebra ao reordenar ou remover item de uma lista (sobra margem solta numa ponta); `gap` no container pai mantém o espaçamento correto independente do que está dentro.

### 5. Componentes e ícones

| Item | Escolha |
|---|---|
| Vocabulário de componente | Classes do Nocturne (`.btn`, `.card`, `.field`, `.table`, `.dialog`, `.nav`, `.tag` etc.), sem componente customizado novo |
| Ícones | Phosphor Icons |
| Estados de interação | Hover tintado do acento → pressed um passo além → foco com `outline` de 2px do acento → desabilitado com opacidade 0.45 |

- **Vocabulário fechado de componente** — reaproveitar as classes do Nocturne em vez de criar componente novo por tela mantém toda a interface consistente e faz qualquer ajuste de token (cor, raio, espaçamento) propagar automaticamente.
- **Phosphor Icons** — já é a decisão do Nocturne; mantida para não introduzir um segundo peso de ícone (estilo, grossura de traço) a conciliar visualmente com o resto do sistema.
- **Progressão hover → pressed → foco → desabilitado** — fixar a progressão de estado evita que cada componente novo invente sua própria intensidade de hover ou esqueça o anel de foco (acessibilidade de teclado).

### 6. Estratégia de implementação de estilo

| Item | Escolha |
|---|---|
| Forma de aplicar estilo | Inline no markup, usando as classes do design system + `var(--*)` para os tokens |
| Classe própria do produto | Nenhuma além das herdadas do Nocturne |

- **Inline sobre classe própria** — mantém a estrutura de cada tela legível e editável elemento por elemento sem caçar uma folha de CSS paralela; o custo aceito é estilo repetido entre elementos parecidos em vez de centralizado numa classe de produto.
- **Nenhuma classe própria nova** — qualquer variação visual vira combinação das classes do Nocturne com valor inline, não uma classe nova a manter; evita que o vocabulário de componente cresça fora do sistema de origem.

### 7. Animação

| Item | Escolha |
|---|---|
| Ocorrência | Só em card de catálogo, modal e toast (`fadeUp`, 0.18–0.25s) |
| Fora de escopo | Escala, sombra pulsante, parallax; nenhuma animação em número de KPI, tabela ou navegação |

- **Animação restrita a três elementos** — a interface é operacional e densa; animação em tabela ou KPI atrasaria a leitura de um número que a pessoa está checando repetidamente durante o turno.
- **Sem efeito de escala/sombra/parallax** — esses efeitos pedem GPU e assinatura visual de produto "vivo"; aqui o objetivo é uma ferramenta "quieta", coerente com a regra de cor (acento nunca preenche área grande).

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Biblioteca de componente fechada (MUI, Mantine, shadcn com tema próprio) | Já descartado em ADR-001 §2 — o design vem de um handoff fiel, não de um visual de biblioteca |
| Cinza novo por nível de texto secundário | Transparência sobre um único token de texto evita multiplicar tokens de cor |
| Preenchimento sólido do acento em botão/área grande | Contraria a regra do Nocturne de acento como linha/brilho; botão primário é contorno de 1px |
| Classe CSS própria do produto por tela | Estilo inline + classes herdadas do Nocturne mantêm a estrutura editável elemento por elemento sem uma segunda folha de estilo a sincronizar |
| Segunda família tipográfica (título ≠ corpo) | Dobra peso de carregamento de fonte e decisão de pareamento sem ganho de hierarquia perceptível |
| Densidade padrão (1×) do Nocturne | Reduziria a quantidade de linha/card visível numa ferramenta operacional sem ganho de legibilidade |
| Animação de escala, sombra pulsante ou parallax | Contraria o objetivo de interface "quieta"; atrasaria leitura de número em tabela/KPI checado com frequência |
| Tema claro | Fora do escopo decidido aqui — ver "O que este ADR não decide" |

## Consequências

**Fica mais fácil**
- Tela nova reaproveita tokens e classes já definidos, sem decisão visual nova por feature.
- Ajuste de marca (acento, fonte) é só override de `:root`; a estrutura de componente do Nocturne não muda.
- Onboarding de quem já conhece Nocturne é rápido — só o acento e a fonte mudam.
- Consistência de estado (hover/pressed/foco/desabilitado) é automática por vir da classe, não reescrita por tela.

**Fica mais difícil**
- Estilo inline espalha decisão visual por todo componente; ajuste pontual de layout toca cada elemento individualmente, não uma classe central.
- Progressão de estado disponível → emprestado → atraso → manutenção está fixada em 4 cores; um quinto estado de negócio exigiria estender a tabela semântica, não só adicionar uma classe.
- Dependência de uma única fonte e de uma única paleta reduz flexibilidade para variar visual por tela sem revisão ampla do `layout.md`.

**O que isso impede de fazer depois sem custo**
- Tema claro — a regra de cor é fundada em "nunca preto puro nem branco puro" sobre fundo escuro (`--color-bg #161826`); um tema claro exige rampa nova, não inversão de token.
- Biblioteca de componente de terceiros com visual próprio — brigaria com os tokens e classes do Nocturne (mesma razão do ADR-001 §2).
- Interface mais "viva" com motion de produto (parallax, sombra pulsante, hover elaborado) — contraria a decisão de interface quieta sem uma revisão de toda a seção 8.

## O que este ADR não decide

- Specs de página individuais (login, catálogo, meus empréstimos, operações, cadastro) — continuam em `layout.md` §5.
- Regras de negócio e interação (limite de itens, bloqueio por atraso, busca, filtros) — pertencem ao PRD e às specs de feature em `docs/specs/`, não ao design system.
- Dados de exemplo e conteúdo de protótipo — `layout.md` §9.
- Internacionalização além de português do Brasil.
- Acessibilidade além do anel de foco e da opacidade de desabilitado já descritos (ex.: contraste WCAG auditado, navegação por leitor de tela).
- Biblioteca de teste visual/regressão de UI.
