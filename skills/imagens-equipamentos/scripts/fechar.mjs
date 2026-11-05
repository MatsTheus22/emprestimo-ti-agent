// Depois da revisão humana: valida as decisões, separa as imagens finais e
// grava o manifesto de créditos. Falha se algum equipamento não tiver
// exatamente 1 aprovada, ou se alguma foto repetir.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { avaliarDecisoes, montarManifesto, validarArquivo } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'saida');
const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, 'utf8'));

async function main() {
  const equipamentos = lerJson(path.join(RAIZ, 'references', 'equipamentos.json'));
  const candidatas = lerJson(path.join(SAIDA, 'candidatas.json'));
  const decisoes = lerJson(path.join(RAIZ, 'revisao', 'decisoes.json'));

  const { erros, aprovadas, reprovadas, reservas } = avaliarDecisoes(equipamentos, candidatas, decisoes);
  if (erros.length > 0) throw new Error(`Revisão incompleta:\n- ${erros.join('\n- ')}`);

  const final = path.join(SAIDA, 'final');
  mkdirSync(final, { recursive: true });
  for (const item of aprovadas) {
    const destino = path.join(final, `${item.patrimonio}.jpg`);
    copyFileSync(path.join(SAIDA, 'candidatas', item.patrimonio, `${item.id}.jpg`), destino);
    await validarArquivo(destino);
  }

  writeFileSync(
    path.join(RAIZ, 'creditos.json'),
    `${JSON.stringify(montarManifesto(aprovadas, reprovadas, reservas), null, 2)}\n`,
  );
  console.log(`creditos.json: ${aprovadas.length} aprovadas, ${reprovadas.length} reprovadas, ${reservas.length} reservas`);
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
