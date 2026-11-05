// PreToolUse. Exit 2 bloqueia a ferramenta; o motivo vai para o Claude pelo stderr.
// Falha fechada: erro de leitura também bloqueia.
import { readFileSync } from 'node:fs';
import { decidir } from './regras.mjs';

try {
  const entrada = JSON.parse(readFileSync(0, 'utf8'));
  const motivo = decidir(entrada, process.env.CLAUDE_PROJECT_DIR ?? entrada.cwd);
  if (motivo) {
    process.stderr.write(motivo);
    process.exit(2);
  }
} catch (erro) {
  process.stderr.write(`Hook guarda falhou: ${erro.message}`);
  process.exit(2);
}
