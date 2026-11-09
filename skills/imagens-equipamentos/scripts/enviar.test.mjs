// Spec 003 CA-06: enviar.mjs não altera o que já existe, salvo com --substituir.
// Spec 005 CA-05: com --substituir, só grava o que difere da URL pública.
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
import { classificarEnvio, publicaAusente } from './lib.mjs';

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

describe('publicaAusente', () => {
  it('test_ca_05_http_404_e_ausente', () => {
    assert.equal(publicaAusente(404, ''), true);
  });

  it('test_ca_05_http_400_com_status_404_no_corpo_e_ausente', () => {
    const corpo = JSON.stringify({ statusCode: '404', error: 'not_found', code: 'NoSuchKey' });
    assert.equal(publicaAusente(400, corpo), true);
  });

  it('test_ca_05_outras_respostas_nao_sao_ausencia', () => {
    assert.equal(publicaAusente(400, '{"statusCode":"403"}'), false);
    assert.equal(publicaAusente(400, 'não é json'), false);
    assert.equal(publicaAusente(500, '{"statusCode":"404"}'), false);
    assert.equal(publicaAusente(403, ''), false);
  });
});

describe('enviar.mjs de ponta a ponta', { skip: !existsSync(FINAL) }, () => {
  const objetos = new Map();
  let conflito;
  let publicaForaDoTamanho;
  let publicaStatus;
  let ausenteComo;
  const publicaCongelada = new Map();
  const gravacoes = [];
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
      gravacoes.push({ nome, upsert: req.headers['x-upsert'] });
      if (objetos.has(nome) && req.headers['x-upsert'] !== 'true') {
        responderConflito(res);
      } else {
        objetos.set(nome, Buffer.concat(pedacos));
        res.writeHead(200).end('{}');
      }
    } else if (req.method === 'GET' && req.url.startsWith(PREFIXO_PUBLICO)) {
      if (publicaStatus) {
        res.writeHead(publicaStatus).end('{}');
        return;
      }
      const nome = req.url.slice(PREFIXO_PUBLICO.length);
      const corpo = publicaForaDoTamanho ?? publicaCongelada.get(nome) ?? objetos.get(nome);
      if (corpo) {
        res.writeHead(200).end(corpo);
      } else if (ausenteComo === 'http-400') {
        // Forma do Storage do Supabase, medida no local.
        const erro = { statusCode: '404', error: 'not_found', message: 'Object not found', code: 'NoSuchKey' };
        res.writeHead(400).end(JSON.stringify(erro));
      } else {
        res.writeHead(404).end();
      }
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
    publicaStatus = undefined;
    ausenteComo = 'http-404';
    publicaCongelada.clear();
    gravacoes.length = 0;
  });

  function preencherComOsArquivosLocais() {
    for (const nome of readdirSync(FINAL)) objetos.set(nome, readFileSync(path.join(FINAL, nome)));
  }

  it('test_ca_05_tudo_igual_nao_grava_nada', async () => {
    preencherComOsArquivosLocais();
    const total = objetos.size;

    const r = await rodar('--substituir');

    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(gravacoes, []);
    assert.match(r.stdout, /TI-0001\.jpg: igual ao arquivo local; não regravado/);
    assert.match(r.stdout, new RegExp(`enviados: 0 .*iguais, não regravados: ${total}`));
    assert.match(r.stdout, new RegExp(`objetos no bucket: ${total}`));
  });

  it('test_ca_05_so_grava_o_que_difere', async () => {
    preencherComOsArquivosLocais();
    const total = objetos.size;
    objetos.set('TI-0001.jpg', await jpeg(800, 600, 200));
    objetos.set('TI-0004.jpg', await jpeg(800, 600, 100));

    const r = await rodar('--substituir');

    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(gravacoes, [
      { nome: 'TI-0001.jpg', upsert: 'true' },
      { nome: 'TI-0004.jpg', upsert: 'true' },
    ]);
    assert.ok(objetos.get('TI-0001.jpg').equals(readFileSync(path.join(FINAL, 'TI-0001.jpg'))));
    assert.match(r.stdout, new RegExp(`enviados: 2 .*iguais, não regravados: ${total - 2}`));
    assert.doesNotMatch(r.stdout, /AVISO/);
  });

  for (const forma of ['http-404', 'http-400']) {
    it(`test_ca_05_foto_ausente_grava_${forma}`, async () => {
      ausenteComo = forma;
      const total = readdirSync(FINAL).length;

      const r = await rodar('--substituir');

      assert.equal(r.status, 0, r.stderr);
      assert.equal(gravacoes.length, total);
      assert.equal(objetos.size, total);
      assert.match(r.stdout, new RegExp(`enviados: ${total} `));
    });
  }

  for (const status of [500, 403, 400]) {
    it(`test_ca_05_url_publica_com_http_${status}_interrompe_sem_gravar`, async () => {
      preencherComOsArquivosLocais();
      publicaStatus = status;

      const r = await rodar('--substituir');

      assert.notEqual(r.status, 0);
      assert.deepEqual(gravacoes, []);
      assert.match(r.stderr, new RegExp(`URL pública respondeu HTTP ${status}`));
      assert.doesNotMatch(r.stderr, /chave-falsa/);
    });
  }

  it('test_ca_05_url_publica_com_foto_antiga_avisa_e_nao_conta_como_trocada', async () => {
    preencherComOsArquivosLocais();
    const antiga = await jpeg(800, 600, 200);
    objetos.set('TI-0001.jpg', antiga);
    publicaCongelada.set('TI-0001.jpg', antiga);

    const r = await rodar('--substituir');

    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(gravacoes, [{ nome: 'TI-0001.jpg', upsert: 'true' }]);
    assert.match(r.stdout, /TI-0001\.jpg: gravado; .*AVISO: troca não confirmada/);
    assert.match(r.stdout, /enviados: 0 .*troca não confirmada: 1/);
  });

  it('test_ca_05_repetir_grava_zero', async () => {
    objetos.set('TI-0001.jpg', await jpeg(800, 600, 200));
    await rodar('--substituir');
    gravacoes.length = 0;

    const r = await rodar('--substituir');

    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(gravacoes, []);
    assert.match(r.stdout, /enviados: 0 /);
  });

  it('test_ca_05_sem_substituir_nao_grava_por_cima', async () => {
    preencherComOsArquivosLocais();
    const outra = await jpeg(800, 600, 200);
    objetos.set('TI-0001.jpg', outra);
    const total = objetos.size;

    const r = await rodar();

    assert.equal(r.status, 0, r.stderr);
    assert.equal(gravacoes.length, total);
    assert.ok(gravacoes.every(({ upsert }) => upsert === 'false'));
    assert.ok(objetos.get('TI-0001.jpg').equals(outra));
    assert.doesNotMatch(r.stdout, /iguais, não regravados/);
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
