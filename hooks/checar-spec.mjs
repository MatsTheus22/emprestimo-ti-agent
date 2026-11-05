// Diz se a spec pode ser declarada pronta. Funciona em qualquer harness, git hook ou CI.
// Uso: node hooks/checar-spec.mjs <NNN-nome>
import { motivoNaoPronta } from './regras.mjs';

const spec = process.argv[2];
if (!spec) {
  console.error('Uso: checar-spec.mjs <NNN-nome>');
  process.exit(1);
}
const motivo = motivoNaoPronta(process.cwd(), spec);
console.log(motivo ?? `${spec}: pode ser declarada pronta.`);
process.exit(motivo ? 1 : 0);
