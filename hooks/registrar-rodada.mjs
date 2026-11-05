// Grava a rodada a partir da resposta do verificador: ninguém escreve esse arquivo à mão.
// Claude Code: hook SubagentStop (JSON no stdin).
// Outro harness: node hooks/registrar-rodada.mjs <arquivo com a resposta>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { estadoRepos, lerResposta, montarRodada, proximaRodada } from './regras.mjs';

const arquivoResposta = process.argv[2];
const entrada = arquivoResposta
  ? { last_assistant_message: readFileSync(arquivoResposta, 'utf8'), cwd: process.cwd() }
  : JSON.parse(readFileSync(0, 'utf8'));
const raiz = process.env.CLAUDE_PROJECT_DIR ?? entrada.cwd;
const lida = lerResposta(entrada.last_assistant_message);

if (!lida) {
  if (entrada.stop_hook_active) process.exit(0);
  process.stderr.write('Resposta fora do formato: a primeira linha precisa ser "Spec: docs/specs/<NNN-nome>/spec.md" e a última "Veredito: ...".');
  process.exit(2);
}

const arquivoSpec = join(raiz, 'docs', 'specs', lida.spec, 'spec.md');
if (!existsSync(arquivoSpec)) {
  if (entrada.stop_hook_active) process.exit(0);
  process.stderr.write(`Spec não encontrada: ${lida.spec}.`);
  process.exit(2);
}

const pasta = join(raiz, 'docs', 'specs', lida.spec, 'verificacoes');
mkdirSync(pasta, { recursive: true });
const numero = proximaRodada(pasta);
writeFileSync(
  join(pasta, `rodada-${numero}.md`),
  montarRodada({
    numero,
    spec: lida.spec,
    data: new Date().toISOString(),
    estado: estadoRepos(raiz),
    conteudoSpec: readFileSync(arquivoSpec, 'utf8'),
    resposta: entrada.last_assistant_message,
  }),
);
