// Regras dos hooks do verificador. Funções puras, testadas em regras.test.mjs.
// Limite conhecido: casam o texto do comando. São uma barreira contra engano,
// não uma fronteira de segurança; a chave de produção fora do alcance do agente
// é o que de fato impede a escrita (rules/secrets.md).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const VERIFICADOR = 'verificador-spec';

const STATUS_PRONTA = /^Status:\s*PRONTA\s*$/m;
const SPEC_ARQUIVO = /docs[\\/]specs[\\/](\d{3}-[^\\/]+)[\\/]spec\.md$/;
const PASTA_RODADAS = /docs[\\/]specs[\\/][^\\/]+[\\/]verificacoes\b/;
const PRIMEIRA_SPEC_COM_GATE = 3; // 001 e 002 são anteriores a esta regra.

const GIT_PUSH = String.raw`\bgit(?:\s+-[Cc]\s+(?:"[^"]+"|\S+))*\s+push\b`;
const PUSH_SEM_BRANCH = new RegExp(String.raw`\bgit(?:\s+-C\s+("[^"]+"|\S+))?\s+push(?:\s+-\S+)*(?:\s+origin)?\s*(?:$|&&|;|\|)`, 'm');

const PRODUCAO = [
  [new RegExp(GIT_PUSH + String.raw`[^;&|\n]*(--force|--force-with-lease|\s-f\b)`), 'force push'],
  [new RegExp(GIT_PUSH + String.raw`[^;&|\n]*\b(main|master)\b`), 'push na branch principal'],
  [/\bgh\s+pr\s+merge\b/, 'merge de PR'],
  [/\bgh\s+workflow\s+run\b/, 'disparo de workflow'],
  [/\bgh\s+run\s+rerun\b/, 'disparo de workflow'],
  [/\bgh\s+api\b[^;&|\n]*(dispatches|\/merge)/, 'merge ou workflow pela API'],
  [/\bprisma\s+migrate\s+deploy\b/, 'migration em produção'],
  [/\bprisma\s+db\s+(push|execute)\b/, 'escrita de schema fora de migration'],
  [/\bvercel\b[^;&|\n]*(--prod\b|\bpromote\b|\brollback\b)/, 'deploy de produção'],
  [/\bvercel\s+env\s+pull\b/, 'trazer segredos de produção para a máquina'],
  [/\bsupabase\s+(db\s+push|link|migration\s+up|storage\s+cp|functions\s+deploy)\b/, 'escrita no Supabase remoto'],
  [/\benviar\.mjs\b[^;&|\n]*\bproducao\b/, 'envio de imagens para produção'],
];

const SUPABASE_REMOTO = /\.supabase\.(co|com)\b/;
const ESCRITA_REMOTA = /\bpsql\b|\bseed\b|\bmigrate\b|-X\s*(POST|PUT|PATCH|DELETE)\b|--data\b|\s-d\s|--upload-file\b|\s-T\s/;

const MENSAGEM_LIVRE = /\b(git\s+commit|gh\s+pr\s+(create|edit|comment))\b/;

// Texto de commit e de PR pode citar um comando proibido sem executá-lo.
function semTextoLivre(comando) {
  if (!MENSAGEM_LIVRE.test(comando)) return comando;
  return comando
    .replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1\b/g, '')
    .replace(/(-m|--message|--body|--title)\s+("(?:[^"\\]|\\.)*"|'[^']*')/g, '$1 ""');
}

export function negarProducao(comando) {
  const texto = semTextoLivre(comando);
  for (const [padrao, oQue] of PRODUCAO) {
    if (padrao.test(texto)) return `Bloqueado: ${oQue}. O agente nunca escreve em produção (rules/restrictions.md); prepare o comando para o usuário rodar.`;
  }
  if (SUPABASE_REMOTO.test(texto) && ESCRITA_REMOTA.test(texto)) {
    return 'Bloqueado: escrita no Supabase remoto. O agente nunca escreve em produção (rules/restrictions.md).';
  }
  return null;
}

const REPO = String.raw`(\s+-C\s+("[^"]+"|\S+))?`;
const PERMITIDOS_VERIFICADOR = [
  /^cd\s+("[^"]+"|\S+)$/,
  /^(timeout\s+\d+\s+)?npm\s+(test|run\s+(test:unit|test:db|build|lint))$/,
  new RegExp(String.raw`^git${REPO}\s+(log|diff|show|status|rev-parse|ls-files|blame)\b(?!.*--output)`),
  new RegExp(String.raw`^git${REPO}\s+branch\s+--show-current$`),
];
const FILTROS_SAIDA = /^(tail|head|grep)\b/;

// O verificador só testa, compila e lê o git. Todo o resto é negado.
export function negarVerificador(comando) {
  const negar = `Bloqueado: o verificador só roda testes, build e git de leitura. Não corrige nada: reporte no veredito. Comando negado: ${comando.slice(0, 120)}`;
  const texto = comando.replace(/\s*2>&1/g, '').trim();
  if (/[;`<>\n]|\$\(|\|\|/.test(texto)) return negar;
  for (const trecho of texto.split('&&')) {
    const [principal, ...filtros] = trecho.split('|').map((parte) => parte.trim());
    if (!PERMITIDOS_VERIFICADOR.some((padrao) => padrao.test(principal))) return negar;
    if (!filtros.every((filtro) => FILTROS_SAIDA.test(filtro))) return negar;
  }
  return null;
}

function git(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

export function estadoRepos(raiz) {
  const estado = {};
  for (const repo of ['back', 'front']) {
    const pasta = join(raiz, repo);
    try {
      estado[repo] = {
        arvore: git(pasta, 'rev-parse', 'HEAD^{tree}'),
        commit: git(pasta, 'rev-parse', '--short', 'HEAD'),
        limpo: git(pasta, 'status', '--porcelain') === '',
      };
    } catch {
      estado[repo] = { arvore: 'indisponivel', commit: 'indisponivel', limpo: false };
    }
  }
  return estado;
}

// O hash ignora a linha de status: declarar a spec pronta não invalida a rodada.
export function hashSpec(conteudo) {
  const normal = conteudo.replace(/\r\n/g, '\n').replace(/^Status:.*\n?/m, '');
  return createHash('sha256').update(normal).digest('hex').slice(0, 16);
}

function numerosRodadas(pasta) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta)
    .map((nome) => /^rodada-(\d+)\.md$/.exec(nome))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

export function proximaRodada(pasta) {
  const numeros = numerosRodadas(pasta);
  return (numeros.at(-1) ?? 0) + 1;
}

export function montarRodada({ numero, spec, data, estado, conteudoSpec, resposta }) {
  return [
    `# Rodada ${numero} — ${spec}`,
    '',
    `data: ${data}`,
    `back: ${estado.back.commit} arvore=${estado.back.arvore} limpo=${estado.back.limpo ? 'sim' : 'nao'}`,
    `front: ${estado.front.commit} arvore=${estado.front.arvore} limpo=${estado.front.limpo ? 'sim' : 'nao'}`,
    `spec-sha: ${hashSpec(conteudoSpec)}`,
    '',
    resposta.trim(),
    '',
  ].join('\n');
}

const VEREDITO = /^Veredito:\s*(PRONTA PARA PRODUÇÃO|PRONTA|NÃO PRONTA)\b/m;

export function lerResposta(mensagem) {
  const spec = /^Spec:\s*docs\/specs\/(\d{3}-[\w-]+)\/spec\.md\s*$/m.exec(mensagem ?? '')?.[1];
  const veredito = VEREDITO.exec(mensagem ?? '')?.[1];
  return spec && veredito ? { spec, veredito } : null;
}

// Por que a spec não pode ser declarada pronta (null = pode). Com `aceitar`,
// serve também ao PR de código, que vem antes das evidências de produção.
export function motivoNaoPronta(raiz, spec, aceitar = ['PRONTA']) {
  const pastaSpec = join(raiz, 'docs', 'specs', spec);
  const pasta = join(pastaSpec, 'verificacoes');
  const numero = numerosRodadas(pasta).at(-1);
  if (!numero) return `A spec ${spec} ainda não passou pelo verificador. Delegue ao subagente verificador-spec.`;

  const rodada = readFileSync(join(pasta, `rodada-${numero}.md`), 'utf8');
  const veredito = VEREDITO.exec(rodada)?.[1];
  if (!aceitar.includes(veredito)) return `A última rodada (${numero}) de ${spec} deu "${veredito ?? 'sem veredito'}". Corrija e verifique de novo.`;

  const estado = estadoRepos(raiz);
  for (const repo of ['back', 'front']) {
    const gravado = new RegExp(`^${repo}: \\S+ arvore=(\\S+) limpo=(sim|nao)`, 'm').exec(rodada);
    if (gravado?.[2] !== 'sim') return `A rodada ${numero} rodou com ${repo} sujo. Commite e verifique de novo.`;
    if (gravado[1] !== estado[repo].arvore || !estado[repo].limpo) return `O código de ${repo} mudou depois da rodada ${numero}. Verifique de novo.`;
  }
  const sha = /^spec-sha: (\S+)/m.exec(rodada)?.[1];
  if (sha !== hashSpec(readFileSync(join(pastaSpec, 'spec.md'), 'utf8'))) return `A spec ${spec} mudou depois da rodada ${numero}. Verifique de novo.`;
  return null;
}

// `git push` sem branch envia a atual: pode ser a principal sem o nome aparecer.
function negarPushImplicito(comando, cwd) {
  const achado = PUSH_SEM_BRANCH.exec(comando);
  if (!achado) return null;
  const repo = achado[1]?.replace(/"/g, '');
  const pasta = /\bcd\b/.test(comando) ? null : repo ? join(cwd, repo) : cwd;
  let branch = null;
  try {
    if (pasta) branch = git(pasta, 'branch', '--show-current');
  } catch {
    branch = null;
  }
  if (branch && branch !== 'main' && branch !== 'master') return null;
  return 'Bloqueado: `git push` sem branch explícita pode publicar na principal. Diga a branch: git push origin <branch>.';
}

function negarPrCriado(comando, raiz) {
  const head = /--head\s+(\d{3}-[\w-]+)/.exec(comando)?.[1];
  if (!head || !existsSync(join(raiz, 'docs', 'specs', head))) return null;
  if (/emprestimo-ti-(back|front)\b/.test(comando)) {
    return motivoNaoPronta(raiz, head, ['PRONTA', 'PRONTA PARA PRODUÇÃO']);
  }
  const spec = readFileSync(join(raiz, 'docs', 'specs', head, 'spec.md'), 'utf8');
  return STATUS_PRONTA.test(spec) ? null : `A spec ${head} ainda não está com Status: PRONTA.`;
}

export function decidir(entrada, raiz) {
  const { tool_name: ferramenta, tool_input: dados = {}, agent_type: agente } = entrada;

  if (ferramenta === 'Bash' || ferramenta === 'PowerShell') {
    const comando = dados.command ?? '';
    if (agente === VERIFICADOR) return negarVerificador(comando);
    const producao = negarProducao(comando);
    if (producao) return producao;
    const texto = semTextoLivre(comando);
    const pushImplicito = negarPushImplicito(texto, entrada.cwd ?? raiz);
    if (pushImplicito) return pushImplicito;
    if (/Status:\s*PRONTA/.test(texto)) return 'Bloqueado: declare a spec pronta editando spec.md com Edit, para o gate conferir a rodada.';
    if (PASTA_RODADAS.test(texto) && /\brm\b|\bmv\b|\bcp\b|\bsed\b|>|Remove-Item|Set-Content|git\s+(rm|checkout|restore)/.test(texto)) {
      return 'Bloqueado: as rodadas são gravadas só pelo hook. Não altere verificacoes/.';
    }
    if (/\bgh\s+pr\s+create\b/.test(comando)) return negarPrCriado(comando, raiz);
    return null;
  }

  if (ferramenta === 'Edit' || ferramenta === 'Write' || ferramenta === 'NotebookEdit') {
    if (agente === VERIFICADOR) return 'Bloqueado: o verificador não edita arquivos. Quem corrige é o agente principal.';
    const caminho = dados.file_path ?? dados.notebook_path ?? '';
    if (PASTA_RODADAS.test(caminho)) return 'Bloqueado: as rodadas são gravadas só pelo hook. Não altere verificacoes/.';
    const spec = SPEC_ARQUIVO.exec(caminho)?.[1];
    const novo = dados.new_string ?? dados.content ?? '';
    if (spec && STATUS_PRONTA.test(novo)) return motivoNaoPronta(raiz, spec);
  }
  return null;
}

// Specs com todas as tarefas concluídas que ainda não foram declaradas prontas.
export function specsPendentes(raiz) {
  const base = join(raiz, 'docs', 'specs');
  if (!existsSync(base)) return [];
  return readdirSync(base).filter((spec) => {
    if (Number(spec.slice(0, 3)) < PRIMEIRA_SPEC_COM_GATE) return false;
    const tarefas = join(base, spec, 'tasks.md');
    const texto = join(base, spec, 'spec.md');
    if (!existsSync(tarefas) || !existsSync(texto)) return false;
    const lista = readFileSync(tarefas, 'utf8');
    return /- \[x\]/i.test(lista) && !/- \[ \]/.test(lista) && !STATUS_PRONTA.test(readFileSync(texto, 'utf8'));
  });
}

export function linhasDaTabela(texto) {
  const linhas = new Map();
  for (const m of texto.matchAll(/^\|\s*(CA-\d+)\s*\|[^|]*\|\s*([^|]+?)\s*\|/gm)) linhas.set(m[1], m[2]);
  return linhas;
}
