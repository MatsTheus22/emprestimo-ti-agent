// Confere se cada foto publicada é a aprovada: lê a URL pública e compara com o hash de
// creditos.json e com 800x600. Só faz GET, não usa chave de serviço e não imprime a URL nem
// o ref do projeto. Sai com erro enquanto não forem todas iguais.
//   --alvo local    --env <arquivo do back>   só aceita localhost/127.0.0.1
//   --alvo producao                           lê SUPABASE_URL só do processo; só o usuário roda
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { ALTURA, LARGURA, hostEhLocal, lerVariavel, publicaAusente, semSegredo, sha256 } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = 'equipamentos';

// As mensagens não citam o host: em produção, ele traz o ref do projeto.
function resolverUrl(values) {
  if (values.alvo === 'local') {
    if (!values.env) throw new Error('--alvo local exige --env <caminho do .env do back>.');
    const url = lerVariavel(values.env, 'SUPABASE_URL');
    if (!url) throw new Error('Arquivo sem SUPABASE_URL.');
    if (!hostEhLocal(url)) throw new Error('--alvo local recusa host remoto.');
    return url;
  }
  if (values.alvo === 'producao') {
    if (values.env) throw new Error('--alvo producao não lê arquivo: defina SUPABASE_URL no processo.');
    const url = process.env.SUPABASE_URL;
    if (!url) throw new Error('--alvo producao lê SUPABASE_URL só do processo.');
    if (hostEhLocal(url)) throw new Error('--alvo producao recusa host local.');
    return url;
  }
  throw new Error('Informe --alvo local ou --alvo producao.');
}

// Devolve null se a foto publicada é a registrada, ou o motivo da diferença.
async function diferenca(url, item) {
  let resposta;
  try {
    resposta = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${item.arquivo}`);
  } catch {
    return 'falha de rede';
  }
  if (!resposta.ok) {
    return publicaAusente(resposta.status, await resposta.text()) ? 'ausente' : `HTTP ${resposta.status}`;
  }
  const conteudo = Buffer.from(await resposta.arrayBuffer());
  if (sha256(conteudo) !== item.sha256) return 'hash diferente';
  const { width, height } = await sharp(conteudo).metadata();
  if (width !== LARGURA || height !== ALTURA) return `${width}x${height}`;
  return null;
}

let segredos = [];

async function main() {
  const { values } = parseArgs({ options: { alvo: { type: 'string' }, env: { type: 'string' } } });
  const url = resolverUrl(values).replace(/\/$/, '');
  segredos = [url, new URL(url).host];

  const { itens } = JSON.parse(readFileSync(path.join(RAIZ, 'creditos.json'), 'utf8'));
  let iguais = 0;
  for (const item of itens) {
    const motivo = await diferenca(url, item);
    if (motivo) {
      console.log(`${item.patrimonio}: diferente (${motivo})`);
    } else {
      iguais += 1;
      console.log(`${item.patrimonio}: igual`);
    }
  }
  console.log(`iguais: ${iguais} de ${itens.length}`);
  if (iguais !== itens.length) process.exitCode = 1;
}

main().catch((erro) => {
  console.error(segredos.reduce((texto, segredo) => semSegredo(texto, segredo), erro.message));
  process.exit(1);
});
