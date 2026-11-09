// Spec 005 CA-06: conferir.mjs compara a URL pública de cada foto com creditos.json, só com GET.
// Roda contra um Storage falso em HTTP. As fotos vêm de saida/final, que o git ignora.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FINAL = path.join(AQUI, '..', 'saida', 'final');
const PREFIXO_PUBLICO = '/storage/v1/object/public/equipamentos/';

function jpeg(largura, altura, vermelho) {
  return sharp({
    create: { width: largura, height: altura, channels: 3, background: { r: vermelho, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer();
}

describe('conferir.mjs', { skip: !existsSync(FINAL) }, () => {
  const objetos = new Map();
  const respostas = new Map();
  const pedidos = [];
  let ausenteComo;
  let servidor;
  let host;
  let arquivoEnv;
  let pasta;

  function atender(req, res) {
    req.resume();
    pedidos.push({ metodo: req.method, cabecalhos: req.headers });
    const nome = req.url.startsWith(PREFIXO_PUBLICO) ? req.url.slice(PREFIXO_PUBLICO.length) : '';
    if (respostas.has(nome)) {
      res.writeHead(respostas.get(nome)).end('{}');
    } else if (req.method === 'GET' && objetos.has(nome)) {
      res.writeHead(200).end(objetos.get(nome));
    } else if (ausenteComo === 'http-400') {
      // Forma do Storage do Supabase, medida no local.
      const erro = { statusCode: '404', error: 'not_found', message: 'Object not found', code: 'NoSuchKey' };
      res.writeHead(400).end(JSON.stringify(erro));
    } else {
      res.writeHead(404).end();
    }
  }

  function envComArquivo(nome, conteudo) {
    const arquivo = path.join(pasta, nome);
    writeFileSync(arquivo, conteudo);
    return arquivo;
  }

  function rodar(argumentos, variaveis = {}) {
    const env = { ...process.env, ...variaveis };
    if (!('SUPABASE_URL' in variaveis)) delete env.SUPABASE_URL;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    return new Promise((resolve) => {
      const filho = spawn(process.execPath, [path.join(AQUI, 'conferir.mjs'), ...argumentos], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      filho.stdout.on('data', (dado) => (stdout += dado));
      filho.stderr.on('data', (dado) => (stderr += dado));
      filho.on('close', (status) => resolve({ status, stdout, stderr, tudo: stdout + stderr }));
    });
  }

  const local = () => rodar(['--alvo', 'local', '--env', arquivoEnv]);

  before(async () => {
    servidor = createServer(atender);
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    host = `127.0.0.1:${servidor.address().port}`;
    pasta = mkdtempSync(path.join(tmpdir(), 'conferir-'));
    // A chave fica no arquivo para provar que o script não a usa.
    arquivoEnv = envComArquivo('.env', `SUPABASE_URL=http://${host}\nSUPABASE_SERVICE_ROLE_KEY=chave-falsa\n`);
  });

  after(() => servidor.close());

  beforeEach(() => {
    objetos.clear();
    for (const nome of readdirSync(FINAL)) objetos.set(nome, readFileSync(path.join(FINAL, nome)));
    respostas.clear();
    pedidos.length = 0;
    ausenteComo = 'http-404';
  });

  it('test_ca_06_tudo_igual_informa_12_de_12', async () => {
    const r = await local();

    assert.equal(r.status, 0, r.stderr);
    for (let i = 1; i <= 12; i += 1) {
      assert.match(r.stdout, new RegExp(`TI-${String(i).padStart(4, '0')}: igual`));
    }
    assert.match(r.stdout, /iguais: 12 de 12/);
  });

  it('test_ca_06_diferente_e_fora_de_800x600_sao_listados_e_saem_com_erro', async () => {
    objetos.set('TI-0001.jpg', await jpeg(800, 600, 200));
    objetos.set('TI-0004.jpg', await jpeg(100, 100, 0));

    const r = await local();

    assert.notEqual(r.status, 0);
    assert.match(r.stdout, /TI-0001: diferente/);
    assert.match(r.stdout, /TI-0004: diferente/);
    assert.match(r.stdout, /TI-0002: igual/);
    assert.match(r.stdout, /iguais: 10 de 12/);
  });

  for (const forma of ['http-404', 'http-400']) {
    it(`test_ca_06_foto_ausente_e_diferente_e_segue_${forma}`, async () => {
      ausenteComo = forma;
      objetos.delete('TI-0001.jpg');

      const r = await local();

      assert.notEqual(r.status, 0);
      assert.match(r.stdout, /TI-0001: diferente \(ausente\)/);
      assert.match(r.stdout, /TI-0012: igual/);
      assert.match(r.stdout, /iguais: 11 de 12/);
    });
  }

  it('test_ca_06_outra_falha_e_diferente_e_segue', async () => {
    respostas.set('TI-0001.jpg', 500);

    const r = await local();

    assert.notEqual(r.status, 0);
    assert.match(r.stdout, /TI-0001: diferente \(HTTP 500\)/);
    assert.match(r.stdout, /iguais: 11 de 12/);
  });

  it('test_ca_06_so_faz_get_sem_chave', async () => {
    await local();

    assert.equal(pedidos.length, 12);
    for (const { metodo, cabecalhos } of pedidos) {
      assert.equal(metodo, 'GET');
      assert.equal(cabecalhos.apikey, undefined);
      assert.equal(cabecalhos.authorization, undefined);
    }
  });

  it('test_ca_06_nao_imprime_url_nem_host_nem_chave', async () => {
    objetos.delete('TI-0001.jpg');
    respostas.set('TI-0002.jpg', 500);

    const r = await local();

    assert.doesNotMatch(r.tudo, /127\.0\.0\.1|storage\/v1|chave-falsa/);
    assert.ok(!r.tudo.includes(host));
  });

  it('test_ca_06_alvo_local_recusa_host_remoto_sem_imprimir_o_host', async () => {
    const remoto = envComArquivo('remoto.env', 'SUPABASE_URL=https://refsecreto.supabase.co\n');

    const r = await rodar(['--alvo', 'local', '--env', remoto]);

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /--alvo local recusa host remoto/);
    assert.doesNotMatch(r.tudo, /refsecreto/);
    assert.equal(pedidos.length, 0);
  });

  it('test_ca_06_alvo_producao_nao_le_arquivo', async () => {
    const r = await rodar(['--alvo', 'producao', '--env', arquivoEnv]);

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /--alvo producao não lê arquivo/);
    assert.equal(pedidos.length, 0);
  });

  it('test_ca_06_alvo_producao_exige_supabase_url_no_processo', async () => {
    const r = await rodar(['--alvo', 'producao']);

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /SUPABASE_URL só do processo/);
  });

  it('test_ca_06_alvo_producao_recusa_host_local', async () => {
    const r = await rodar(['--alvo', 'producao'], { SUPABASE_URL: `http://${host}` });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /--alvo producao recusa host local/);
    assert.equal(pedidos.length, 0);
  });

  it('test_ca_06_sem_alvo_falha', async () => {
    const r = await rodar([]);

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Informe --alvo local ou --alvo producao/);
  });
});
