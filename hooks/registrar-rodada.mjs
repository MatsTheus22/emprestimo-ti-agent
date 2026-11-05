// Grava a rodada a partir da resposta do verificador: ninguém escreve esse arquivo à mão.
// Claude Code: hooks SubagentStop e PostToolUse da entrega do subagente (JSON no stdin).
// O agente pode entregar por texto ou só pela ferramenta, por isso os dois eventos;
// a mesma execução nunca grava duas rodadas.
// Outro harness: node hooks/registrar-rodada.mjs <arquivo com a resposta>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  agenteJaRegistrado,
  escolherResposta,
  estadoRepos,
  lerResposta,
  montarRodada,
  proximaRodada,
  respostaDoTranscript,
  VERIFICADOR,
} from './regras.mjs';

const arquivoResposta = process.argv[2];
const entrada = arquivoResposta
  ? { last_assistant_message: readFileSync(arquivoResposta, 'utf8'), cwd: process.cwd() }
  : JSON.parse(readFileSync(0, 'utf8'));

const naEntrega = entrada.hook_event_name === 'PostToolUse';
if (naEntrega && entrada.agent_type !== VERIFICADOR) process.exit(0);

function lerTranscript(caminho) {
  if (!caminho) return '';
  const real = caminho.replace(/^~(?=[\\/])/, homedir());
  return existsSync(real) ? readFileSync(real, 'utf8') : '';
}

const resposta = escolherResposta([
  entrada.tool_input?.message,
  entrada.last_assistant_message,
  () => respostaDoTranscript(lerTranscript(entrada.agent_transcript_path)),
]);

// Sem rodada, o gate continua bloqueando a spec: a falha nunca vira aprovação.
function recusar(mensagem) {
  if (naEntrega || entrada.stop_hook_active) process.exit(0);
  process.stderr.write(mensagem);
  process.exit(2);
}

if (!resposta) recusar('Resposta fora do formato: a primeira linha precisa ser "Spec: docs/specs/<NNN-nome>/spec.md" e a última "Veredito: ...".');

const { spec } = lerResposta(resposta);
const raiz = process.env.CLAUDE_PROJECT_DIR ?? entrada.cwd;
const arquivoSpec = join(raiz, 'docs', 'specs', spec, 'spec.md');
if (!existsSync(arquivoSpec)) recusar(`Spec não encontrada: ${spec}.`);

const pasta = join(raiz, 'docs', 'specs', spec, 'verificacoes');
if (agenteJaRegistrado(pasta, entrada.agent_id)) process.exit(0);

mkdirSync(pasta, { recursive: true });
const numero = proximaRodada(pasta);
writeFileSync(
  join(pasta, `rodada-${numero}.md`),
  montarRodada({
    numero,
    spec,
    data: new Date().toISOString(),
    agente: entrada.agent_id,
    estado: estadoRepos(raiz),
    conteudoSpec: readFileSync(arquivoSpec, 'utf8'),
    resposta,
  }),
);
