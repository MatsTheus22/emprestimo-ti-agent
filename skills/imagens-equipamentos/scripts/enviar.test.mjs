// Spec 003 CA-06: enviar.mjs não altera o que já existe, salvo com --substituir.
// Roda contra um Storage falso em HTTP, porque o caminho real só existe com o
// Supabase local no ar. As fotos vêm de saida/final, que o git ignora.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { classificarEnvio } from './lib.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FINAL = path.join(AQUI, '..', 'saida', 'final');
const PREFIXO_OBJETO = '/storage/v1/object/equipamentos/';
const PREFIXO_PUBLICO = '/storage/v1/object/public/equipamentos/';

function jpeg(largura, altura, vermelho) {
  return sharp({
    create: { width: largura, height: altura, channels: 3, background: { r: vermelho, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer();
}

describe('classificarEnvio', () => {
  it('test_ca_06_sucesso_e_enviado', () => {
    assert.equal(classificarEnvio(true, 200, '{}'), 'enviado');
  });

  it('test_ca_06_conflito_http_409_e_ja_existia', () => {
    assert.equal(classificarEnvio(false, 409, ''), 'já existia');
  });

  it('test_ca_06_conflito_http_400_com_status_409_no_corpo_e_ja_existia', () => {
    const corpo = JSON.stringify({ statusCode: '409', error: 'Duplicate' });
    assert.equal(classificarEnvio(false, 400, corpo), 'já existia');
  });

  it('test_ca_06_outras_falhas_sao_erro', () => {
    assert.equal(classificarEnvio(false, 500, ''), 'erro');
    assert.equal(classificarEnvio(false, 401, '{"statusCode":"409"}'), 'erro');
    assert.equal(classificarEnvio(false, 400, '{"statusCode":"403"}'), 'erro');
    assert.equal(classificarEnvio(false, 400, 'não é json'), 'erro');
  });
});

describe('enviar.mjs de ponta a ponta', { skip: !existsSync(FINAL) }, () => {
  const objetos = new Map();
  let conflito;
  let publicaForaDoTamanho;
  let servidor;
  let arquivoEnv;

  function responderConflito(res) {
    if (conflito === 'http-409') {
      res.writeHead(409).end(JSON.stringify({ error: 'Duplicate' }));
    } else {
      res.writeHead(400).end(JSON.stringify({ statusCode: '409', error: 'Duplicate' }));
    }
  }

  async function atender(req, res) {
    const pedacos = [];
    for await (const pedaco of req) pedacos.push(pedaco);

    if (req.method === 'GET' && req.url === '/storage/v1/bucket/equipamentos') {
      res.writeHead(200).end(JSON.stringify({ public: true }));
    } else if (req.method === 'POST' && req.url === '/storage/v1/object/list/equipamentos') {
      res.writeHead(200).end(JSON.stringify([...objetos.keys()].map((name) => ({ name }))));
    } else if (req.method === 'POST' && req.url.startsWith(PREFIXO_OBJETO)) {
      const nome = req.url.slice(PREFIXO_OBJETO.length);
      if (objetos.has(nome) && req.headers['x-upsert'] !== 'true') {
        responderConflito(res);
      } else {
        objetos.set(nome, Buffer.concat(pedacos));
        res.writeHead(200).end('{}');
      }
    } else if (req.method === 'GET' && req.url.startsWith(PREFIXO_PUBLICO)) {
      const corpo = publicaForaDoTamanho ?? objetos.get(req.url.slice(PREFIXO_PUBLICO.length));
      res.writeHead(corpo ? 200 : 404).end(corpo);
    } else {
      res.writeHead(404).end();
    }
  }

  function rodar(...argumentos) {
    return new Promise((resolve) => {
      const filho = spawn(
        process.execPath,
        [path.join(AQUI, 'enviar.mjs'), '--alvo', 'local', '--env', arquivoEnv, ...argumentos],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
      let stdout = '';
      let stderr = '';
      filho.stdout.on('data', (dado) => (stdout += dado));
      filho.stderr.on('data', (dado) => (stderr += dado));
      filho.on('close', (status) => resolve({ status, stdout, stderr }));
    });
  }

  before(async () => {
    servidor = createServer((req, res) => {
      atender(req, res).catch(() => res.writeHead(500).end());
    });
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    arquivoEnv = path.join(mkdtempSync(path.join(tmpdir(), 'enviar-')), '.env');
    writeFileSync(
      arquivoEnv,
      `SUPABASE_URL=http://127.0.0.1:${servidor.address().port}\nSUPABASE_SERVICE_ROLE_KEY=chave-falsa\n`,
    );
  });

  after(() => servidor.close());

  beforeEach(() => {
    objetos.clear();
    conflito = 'http-400';
    publicaForaDoTamanho = undefined;
  });

  it('test_ca_06_bucket_vazio_envia_todos', async () => {
    const total = readdirSync(FINAL).length;

    const r = await rodar();

    assert.equal(r.status, 0, r.stderr);
    assert.equal(objetos.size, total);
    assert.match(r.stdout, new RegExp(`enviados: ${total} · já existiam: 0`));
    assert.match(r.stdout, new RegExp(`objetos no bucket: ${total}`));
  });

  for (const forma of ['http-400', 'http-409']) {
    it(`test_ca_06_repetir_nao_altera_nada_conflito_${forma}`, async () => {
      conflito = forma;
      const total = readdirSync(FINAL).length;
      await rodar();
      const antes = new Map(objetos);

      const r = await rodar();

      assert.equal(r.status, 0, r.stderr);
      assert.deepEqual(objetos, antes);
      assert.match(r.stdout, new RegExp(`enviados: 0 · já existiam: ${total} · com conteúdo diferente: 0`));
      assert.match(r.stdout, new RegExp(`objetos no bucket: ${total}`));
      assert.doesNotMatch(r.stdout, /AVISO/);
    });
  }

  it('test_ca_06_conteudo_diferente_e_mantido_e_avisado', async () => {
    const outra = await jpeg(800, 600, 200);
    objetos.set('TI-0001.jpg', outra);

    const r = await rodar();

    assert.equal(r.status, 0, r.stderr);
    assert.ok(objetos.get('TI-0001.jpg').equals(outra), 'o objeto existente mudou');
    assert.match(r.stdout, /TI-0001\.jpg: já existia; .*AVISO: conteúdo diferente/);
    assert.match(r.stdout, /com conteúdo diferente: 1/);
  });

  it('test_ca_06_substituir_grava_por_cima', async () => {
    objetos.set('TI-0001.jpg', await jpeg(800, 600, 200));

    const r = await rodar('--substituir');

    assert.equal(r.status, 0, r.stderr);
    assert.ok(objetos.get('TI-0001.jpg').equals(readFileSync(path.join(FINAL, 'TI-0001.jpg'))));
    assert.match(r.stdout, /TI-0001\.jpg: enviado/);
    assert.doesNotMatch(r.stdout, /AVISO/);
  });

  for (const argumentos of [[], ['--substituir']]) {
    it(`test_ca_06_url_publica_fora_de_800x600_falha_${argumentos.join('') || 'padrao'}`, async () => {
      publicaForaDoTamanho = await jpeg(100, 100, 0);

      const r = await rodar(...argumentos);

      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /URL pública entregou 100x100/);
    });
  }

  it('test_ca_06_erro_do_storage_interrompe_sem_expor_a_chave', async () => {
    conflito = 'http-400';
    const original = servidor.listeners('request')[0];
    servidor.removeAllListeners('request');
    servidor.on('request', (req, res) => {
      req.resume();
      if (req.method === 'POST' && req.url.startsWith(PREFIXO_OBJETO)) {
        res.writeHead(500).end('{}');
      } else {
        original(req, res);
      }
    });

    try {
      const r = await rodar();

      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /envio respondeu HTTP 500/);
      assert.doesNotMatch(r.stderr, /chave-falsa/);
    } finally {
      servidor.removeAllListeners('request');
      servidor.on('request', original);
    }
  });
});
