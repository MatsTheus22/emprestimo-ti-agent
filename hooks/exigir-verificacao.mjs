// Stop. Não deixa encerrar o turno com spec de tarefas concluídas e sem verificação,
// para que a obrigação não dependa de alguém lembrar de pedir.
import { readFileSync } from 'node:fs';
import { specsPendentes } from './regras.mjs';

const entrada = JSON.parse(readFileSync(0, 'utf8'));
if (entrada.stop_hook_active) process.exit(0);

const pendentes = specsPendentes(process.env.CLAUDE_PROJECT_DIR ?? entrada.cwd);
if (pendentes.length > 0) {
  process.stderr.write(`Tarefas concluídas sem spec declarada pronta: ${pendentes.join(', ')}. Delegue ao subagente verificador-spec e, com o veredito PRONTA, registre "Status: PRONTA" em spec.md.`);
  process.exit(2);
}
