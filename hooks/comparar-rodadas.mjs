// Compara duas rodadas lado a lado.
// Uso: node hooks/comparar-rodadas.mjs docs/specs/002-login 1 2
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { linhasDaTabela } from './regras.mjs';

const [pasta, a, b] = process.argv.slice(2);
if (!pasta || !a || !b) {
  console.error('Uso: comparar-rodadas.mjs <pasta-da-spec> <rodada-A> <rodada-B>');
  process.exit(1);
}

const ler = (numero) => readFileSync(join(pasta, 'verificacoes', `rodada-${numero}.md`), 'utf8');
const [textoA, textoB] = [ler(a), ler(b)];
const [linhasA, linhasB] = [linhasDaTabela(textoA), linhasDaTabela(textoB)];
const cas = [...new Set([...linhasA.keys(), ...linhasB.keys()])].sort();

console.log(`| CA | rodada ${a} | rodada ${b} | mudou |`);
console.log('|---|---|---|---|');
for (const ca of cas) {
  const [sa, sb] = [linhasA.get(ca) ?? '-', linhasB.get(ca) ?? '-'];
  console.log(`| ${ca} | ${sa} | ${sb} | ${sa === sb ? '' : 'SIM'} |`);
}
for (const campo of ['back', 'front', 'spec-sha', 'Veredito']) {
  const valor = (texto) => new RegExp(`^${campo}: (.*)$`, 'm').exec(texto)?.[1] ?? '-';
  console.log(`${campo}: ${valor(textoA)} -> ${valor(textoB)}`);
}
