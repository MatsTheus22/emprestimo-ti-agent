// Envia as imagens aprovadas ao bucket público, com caminho fixo: repetir o envio
// não duplica nada, e o que já existe fica como está.
//   --alvo local    --env <arquivo do back>   só aceita localhost/127.0.0.1
//   --alvo producao                           só no terminal do usuário
//   --substituir                              grava por cima do que já existe
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import {
  classificarEnvio,
  exigirCondicoesDeProducao,
  exigirHostLocal,
  lerVariavel,
  semSegredo,
  sha256,
  validarArquivo,
} from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FINAL = path.join(RAIZ, 'saida', 'final');
const BUCKET = 'equipamentos';

function cabecalhos(chave) {
  // Chave no formato novo (sb_...) não é JWT: vai só no apikey.
  return chave.startsWith('sb_')
    ? { apikey: chave }
    : { apikey: chave, authorization: `Bearer ${chave}` };
}

async function garantirBucketPublico(url, chave) {
  const atual = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers: cabecalhos(chave) });
  const corpo = { id: BUCKET, name: BUCKET, public: true };
  const json = { ...cabecalhos(chave), 'content-type': 'application/json' };
  if (atual.ok) {
    const bucket = await atual.json();
    if (bucket.public) return 'já existia';
    const r = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify(corpo),
    });
    if (!r.ok) throw new Error(`não consegui tornar o bucket público: HTTP ${r.status}`);
    return 'tornado público';
  }
  const r = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`não consegui criar o bucket: HTTP ${r.status}`);
  return 'criado';
}

async function enviarArquivo(url, chave, nome, substituir) {
  const arquivo = path.join(FINAL, nome);
  await validarArquivo(arquivo);
  const conteudo = readFileSync(arquivo);
  const resposta = await fetch(`${url}/storage/v1/object/${BUCKET}/${nome}`, {
    method: 'POST',
    headers: {
      ...cabecalhos(chave),
      'content-type': 'image/jpeg',
      'x-upsert': substituir ? 'true' : 'false',
    },
    body: conteudo,
  });
  const situacao = classificarEnvio(resposta.ok, resposta.status, await resposta.text());
  if (situacao === 'erro') throw new Error(`${nome}: envio respondeu HTTP ${resposta.status}`);

  // Prova do contrato: abre pela URL pública, sem login, no tamanho certo.
  const publica = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${nome}`);
  if (!publica.ok) throw new Error(`${nome}: URL pública respondeu HTTP ${publica.status}`);
  const publicado = Buffer.from(await publica.arrayBuffer());
  const meta = await sharp(publicado).metadata();
  if (meta.width !== 800 || meta.height !== 600) {
    throw new Error(`${nome}: URL pública entregou ${meta.width}x${meta.height}`);
  }

  if (situacao === 'enviado') {
    console.log(`${nome}: enviado; URL pública 800x600`);
    return 'enviado';
  }
  if (sha256(publicado) === sha256(conteudo)) {
    console.log(`${nome}: já existia; URL pública 800x600`);
    return 'já existia';
  }
  console.log(
    `${nome}: já existia; URL pública 800x600; AVISO: conteúdo diferente do arquivo local, mantido. Para trocar, use --substituir`,
  );
  return 'diferente';
}

async function contarNoBucket(url, chave) {
  const resposta = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...cabecalhos(chave), 'content-type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 1000 }),
  });
  if (!resposta.ok) throw new Error(`listar o bucket respondeu HTTP ${resposta.status}`);
  return (await resposta.json()).length;
}

async function confirmarProducao(ref) {
  const leitor = createInterface({ input: process.stdin, output: process.stdout });
  const digitado = await leitor.question(`Digite o ref do projeto (${ref}) para confirmar: `);
  leitor.close();
  if (digitado.trim() !== ref) throw new Error('Confirmação não confere. Nada foi enviado.');
}

async function resolverDestino(values) {
  if (values.alvo === 'local') {
    if (!values.env) throw new Error('--alvo local exige --env <caminho do .env do back>.');
    const url = lerVariavel(values.env, 'SUPABASE_URL');
    const chave = lerVariavel(values.env, 'SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !chave) throw new Error('Arquivo sem SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.');
    exigirHostLocal(url);
    return { url, chave };
  }
  if (values.alvo === 'producao') {
    if (values.env) throw new Error('--alvo producao não lê chave de arquivo.');
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ref = exigirCondicoesDeProducao({ isTTY: process.stdin.isTTY === true, url, chave });
    await confirmarProducao(ref);
    return { url, chave };
  }
  throw new Error('Informe --alvo local ou --alvo producao.');
}

let segredo;

async function main() {
  const { values } = parseArgs({
    options: {
      alvo: { type: 'string' },
      env: { type: 'string' },
      substituir: { type: 'boolean', default: false },
    },
  });
  const { url, chave } = await resolverDestino(values);
  segredo = chave;

  if (!existsSync(FINAL)) throw new Error('Rode fechar.mjs antes: não há imagens finais.');
  const arquivos = readdirSync(FINAL).filter((nome) => /^TI-\d{4}\.jpg$/.test(nome));
  if (arquivos.length === 0) throw new Error('Nenhuma imagem final encontrada.');

  console.log(`bucket ${BUCKET}: ${await garantirBucketPublico(url, chave)}`);
  const contagem = { enviado: 0, 'já existia': 0, diferente: 0 };
  for (const nome of arquivos) {
    contagem[await enviarArquivo(url, chave, nome, values.substituir)] += 1;
  }
  console.log(
    `enviados: ${contagem.enviado} · já existiam: ${contagem['já existia'] + contagem.diferente} · com conteúdo diferente: ${contagem.diferente}`,
  );
  console.log(`objetos no bucket: ${await contarNoBucket(url, chave)}`);
}

main().catch((erro) => {
  console.error(semSegredo(erro.message, segredo));
  process.exit(1);
});
