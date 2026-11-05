import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  avaliarDecisoes,
  cacheAindaValido,
  chaveDeCache,
  CACHE_MS,
  escaparHtml,
  exigirCondicoesDeProducao,
  exigirHostLocal,
  lerVariavel,
  montarFolhaDeContato,
  montarManifesto,
  motivoRejeicao,
  redimensionar,
  refDoProjeto,
  semSegredo,
  validarArquivo,
} from './lib.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const temp = () => mkdtempSync(path.join(tmpdir(), 'imagens-'));
const hitBom = {
  type: 'photo',
  isAiGenerated: false,
  isLowQuality: 0,
  imageWidth: 4000,
  imageHeight: 3000,
  tags: 'laptop, desk, white',
};
const imagem = (width, height) =>
  sharp({ create: { width, height, channels: 3, background: '#808080' } }).png().toBuffer();

describe('filtros da busca', () => {
  it('aceita foto limpa', () => {
    assert.equal(motivoRejeicao(hitBom), null);
  });

  it('rejeita foto gerada por IA', () => {
    assert.match(motivoRejeicao({ ...hitBom, isAiGenerated: true }), /IA/);
  });

  it('rejeita o que não é foto', () => {
    assert.match(motivoRejeicao({ ...hitBom, type: 'vector/svg' }), /tipo/);
  });

  it('rejeita foto menor que 800x600', () => {
    assert.match(motivoRejeicao({ ...hitBom, imageWidth: 799 }), /800x600/);
    assert.match(motivoRejeicao({ ...hitBom, imageWidth: 1000, imageHeight: 599 }), /800x600/);
  });

  it('rejeita panorâmica que precisaria ampliar', () => {
    assert.match(motivoRejeicao({ ...hitBom, imageWidth: 5000, imageHeight: 1500 }), /ampliar/);
  });

  it('rejeita tag de pessoa, marca e texto, palavra a palavra', () => {
    assert.match(motivoRejeicao({ ...hitBom, tags: 'laptop, young woman' }), /pessoa.*woman/);
    assert.match(motivoRejeicao({ ...hitBom, tags: 'macbook pro, desk' }), /marca.*macbook/);
    assert.match(motivoRejeicao({ ...hitBom, tags: 'website, desk' }), /texto.*website/);
  });

  it('não confunde parte de palavra com tag proibida', () => {
    assert.equal(motivoRejeicao({ ...hitBom, tags: 'manual, signal, handle' }), null);
  });
});

describe('800x600 garantido', () => {
  it('redimensiona e confere o arquivo final', async () => {
    const destino = path.join(temp(), 'a.jpg');
    assert.deepEqual(await redimensionar(await imagem(1280, 853), destino), {
      largura: 800,
      altura: 600,
    });
    const meta = await sharp(destino).metadata();
    assert.deepEqual([meta.width, meta.height, meta.format], [800, 600, 'jpeg']);
  });

  it('falha em vez de ampliar imagem pequena', async () => {
    const destino = path.join(temp(), 'b.jpg');
    await assert.rejects(redimensionar(await imagem(640, 480), destino), /esperado JPEG 800x600/);
  });

  it('validarArquivo reprova arquivo fora do tamanho', async () => {
    const arquivo = path.join(temp(), 'c.jpg');
    await sharp(await imagem(801, 600)).jpeg().toFile(arquivo);
    await assert.rejects(validarArquivo(arquivo), /801x600/);
  });

  it('validarArquivo reprova o que não é JPEG', async () => {
    const arquivo = path.join(temp(), 'd.png');
    await sharp(await imagem(800, 600)).png().toFile(arquivo);
    await assert.rejects(validarArquivo(arquivo), /png/);
  });
});

describe('cache de 24 h e segredo', () => {
  it('a chave de cache não depende da chave da API', () => {
    assert.equal(chaveDeCache({ q: 'a', key: 'x' }), chaveDeCache({ key: 'y', q: 'a' }));
    assert.notEqual(chaveDeCache({ q: 'a' }), chaveDeCache({ q: 'b' }));
  });

  it('cache vale por menos de 24 h', () => {
    assert.equal(cacheAindaValido(0, CACHE_MS - 1), true);
    assert.equal(cacheAindaValido(0, CACHE_MS), false);
  });

  it('semSegredo apaga a chave de mensagens', () => {
    assert.equal(semSegredo('erro key=abc123 fim', 'abc123'), 'erro key=*** fim');
  });

  it('lerVariavel lê do arquivo, com ou sem aspas', () => {
    const arquivo = path.join(temp(), '.env');
    writeFileSync(arquivo, 'A=1\r\nB="dois"\n# C=3\n');
    assert.equal(lerVariavel(arquivo, 'A'), '1');
    assert.equal(lerVariavel(arquivo, 'B'), 'dois');
    assert.equal(lerVariavel(arquivo, 'C'), undefined);
  });
});

describe('revisão humana', () => {
  const equipamentos = [{ patrimonio: 'TI-0001' }, { patrimonio: 'TI-0002' }];
  const candidatas = {
    'TI-0001': [
      { id: 1, sha256: 'h1', pageURL: 'p1', user: 'u1', user_id: 11 },
      { id: 2, sha256: 'h2', pageURL: 'p2', user: 'u2', user_id: 22 },
    ],
    'TI-0002': [{ id: 3, sha256: 'h3', pageURL: 'p3', user: 'u3', user_id: 33 }],
  };
  const aprovada = { decisao: 'aprovada', motivo: '' };

  it('aceita 1 aprovada por equipamento e conta as reprovadas', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 1: { decisao: 'reprovada', motivo: 'logo legível' }, 2: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.deepEqual(r.erros, []);
    assert.equal(r.aprovadas.length, 2);
    assert.equal(r.reprovadas.length, 1);
  });

  it('reserva não conta como aprovada nem como reprovada', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 1: { decisao: 'reserva', motivo: '' }, 2: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.deepEqual(r.erros, []);
    assert.equal(r.aprovadas.length, 2);
    assert.equal(r.reprovadas.length, 0);
    assert.equal(r.reservas.length, 1);
    assert.equal(montarManifesto(r.aprovadas, r.reprovadas, r.reservas).revisao_humana.reservas, 1);
  });

  it('pendente não conta como reprovada', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 1: { decisao: 'pendente', motivo: '' }, 2: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.deepEqual(r.erros, []);
    assert.equal(r.reprovadas.length, 0);
  });

  it('recusa equipamento sem aprovada ou com duas', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 1: aprovada, 2: aprovada },
    });
    assert.equal(r.erros.length, 2);
  });

  it('recusa reprovação sem motivo', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 1: { decisao: 'reprovada', motivo: ' ' }, 2: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.match(r.erros[0], /sem motivo/);
  });

  it('recusa a mesma foto em dois equipamentos, por id ou por arquivo', () => {
    const repetida = {
      'TI-0001': [{ id: 1, sha256: 'igual' }],
      'TI-0002': [{ id: 3, sha256: 'igual' }],
    };
    const r = avaliarDecisoes(equipamentos, repetida, {
      'TI-0001': { 1: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.match(r.erros[0], /já foi aprovada em TI-0001/);
  });

  it('recusa foto que não é candidata daquele equipamento', () => {
    const r = avaliarDecisoes(equipamentos, candidatas, {
      'TI-0001': { 3: aprovada, 2: aprovada },
      'TI-0002': { 3: aprovada },
    });
    assert.match(r.erros[0], /não é candidata/);
  });

  it('o manifesto traz origem, autor e licença, só das aprovadas', () => {
    const m = montarManifesto(
      [{ patrimonio: 'TI-0001', id: 2, pageURL: 'p2', user: 'u2', user_id: 22, sha256: 'h2' }],
      [{ patrimonio: 'TI-0001', id: 1, motivo: 'logo legível' }],
    );
    assert.equal(m.itens.length, 1);
    assert.equal(m.itens[0].arquivo, 'TI-0001.jpg');
    assert.equal(m.itens[0].origem, 'p2');
    assert.equal(m.itens[0].autor, 'u2');
    assert.match(m.itens[0].licenca, /Pixabay/);
    assert.equal(m.revisao_humana.reprovadas, 1);
    assert.equal(m.revisao_humana.motivos['logo legível'], 1);
  });

  it('a folha de contato escapa HTML vindo da API', () => {
    assert.equal(escaparHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
    const html = montarFolhaDeContato(
      [{ patrimonio: 'TI-0001', nome: 'n', busca: 'b' }],
      { 'TI-0001': [{ id: 1, user: '<script>', tags: 't', pageURL: 'p' }] },
    );
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('candidatas/TI-0001/1.jpg'));
  });
});

describe('produção fora do alcance do agente', () => {
  const remota = 'https://abcd1234.supabase.co';

  it('alvo local recusa host remoto', () => {
    assert.throws(() => exigirHostLocal(remota), /recusa o host/);
    assert.doesNotThrow(() => exigirHostLocal('http://127.0.0.1:54321'));
    assert.doesNotThrow(() => exigirHostLocal('http://localhost:54321'));
  });

  it('alvo producao exige terminal interativo', () => {
    assert.throws(
      () => exigirCondicoesDeProducao({ isTTY: false, url: remota, chave: 'k' }),
      /terminal interativo/,
    );
  });

  it('alvo producao exige URL e chave do processo', () => {
    assert.throws(
      () => exigirCondicoesDeProducao({ isTTY: true, url: remota }),
      /só do processo/,
    );
  });

  it('alvo producao recusa host local e devolve o ref do projeto', () => {
    assert.throws(
      () => exigirCondicoesDeProducao({ isTTY: true, url: 'http://127.0.0.1:1', chave: 'k' }),
      /host local/,
    );
    assert.equal(exigirCondicoesDeProducao({ isTTY: true, url: remota, chave: 'k' }), 'abcd1234');
    assert.throws(() => refDoProjeto('https://exemplo.com'), /não é de um projeto/);
  });

  function rodarEnviar(argumentos, env = {}) {
    const limpo = { ...process.env, ...env };
    return spawnSync(process.execPath, [path.join(AQUI, 'enviar.mjs'), ...argumentos], {
      env: limpo,
      input: '',
      encoding: 'utf8',
    });
  }

  it('sem terminal, enviar.mjs recusa produção de ponta a ponta', () => {
    const r = rodarEnviar(['--alvo', 'producao'], {
      SUPABASE_URL: remota,
      SUPABASE_SERVICE_ROLE_KEY: 'chave-falsa',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /terminal interativo/);
    assert.ok(!r.stderr.includes('chave-falsa'));
  });

  it('enviar.mjs recusa ler arquivo com alvo produção', () => {
    const r = rodarEnviar(['--alvo', 'producao', '--env', 'qualquer']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /não lê chave de arquivo/);
  });

  it('enviar.mjs com alvo local recusa arquivo que aponta para remoto', () => {
    const arquivo = path.join(temp(), '.env');
    writeFileSync(arquivo, `SUPABASE_URL=${remota}\nSUPABASE_SERVICE_ROLE_KEY=k\n`);
    const r = rodarEnviar(['--alvo', 'local', '--env', arquivo]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /recusa o host/);
  });

  it('a lista de equipamentos é a do enunciado', () => {
    const lista = JSON.parse(
      readFileSync(path.join(AQUI, '..', 'references', 'equipamentos.json'), 'utf8'),
    );
    assert.equal(lista.length, 12);
    assert.deepEqual(
      lista.filter((item) => item.situacao === 'manutencao').map((item) => item.patrimonio),
      ['TI-0004', 'TI-0007', 'TI-0010'],
    );
  });
});
