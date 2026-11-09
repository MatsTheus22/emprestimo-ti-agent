// Spec 005 CA-01 a CA-04: as decisões do usuário estão transcritas em decisoes.json e o
// fechamento gerou créditos e fotos finais coerentes. As fotos e as candidatas vêm de saida/,
// que o git ignora: sem essa pasta, os testes do fechamento são pulados.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { avaliarDecisoes, sha256 } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'saida');
const lerJson = (...partes) => JSON.parse(readFileSync(path.join(...partes), 'utf8'));

const decisoes = lerJson(RAIZ, 'revisao', 'decisoes.json');
const creditos = lerJson(RAIZ, 'creditos.json');
const equipamentos = lerJson(RAIZ, 'references', 'equipamentos.json');
const credito = (patrimonio) => creditos.itens.find((item) => item.patrimonio === patrimonio);

// CA-01: as fotos que estavam em produção.
const ATUAIS = [
  ['TI-0001', '1483974', 'tela com site aberto, tablet com apps e fone com marca'],
  ['TI-0004', '4906312', 'mãos e pernas de uma pessoa'],
  ['TI-0006', '3114274', 'maçã da Apple e foto na tela'],
  ['TI-0007', '2853836', 'maçã da Apple'],
  ['TI-0008', '2202226', '"HDMI" em relevo'],
  ['TI-0012', '1362419', '"FUJIFILM" legível na câmera'],
];

// CA-02: as reservas com marca.
const RESERVAS_COM_MARCA = [
  ['TI-0006', '2853860', 'maçã'],
  ['TI-0007', '3539656', '"SAMSUNG" e fone Beats'],
  ['TI-0012', '3545828', '"PENTAX"'],
  ['TI-0012', '7693094', '"Rollei 35"'],
];

// CA-03: o que o usuário aprovou.
const APROVADAS = {
  'TI-0001': '2665794',
  'TI-0004': '2425303',
  'TI-0006': '17894',
  'TI-0007': '17768',
  'TI-0008': '1827',
  'TI-0012': '601528',
};

// Candidatas que já existiam antes da spec 005, nos itens com nova busca.
const ANTERIORES = {
  'TI-0001': ['1483974', '2325627', '4484282', '7188564'],
  'TI-0006': ['338561', '2181919', '2853860', '3114274'],
  'TI-0012': ['1362419', '3545828', '4516107', '7693094'],
};

// CA-04: os itens que não mudam, com id e hash de antes da spec 005.
const MANTIDOS = {
  'TI-0002': [791032, '47e5dbd4b62e93cc9eb7a62d804e2033c9700770cde71c0b90ea3220319e7624'],
  'TI-0003': [6801339, 'e8476c6fba4cfdb3aaaf83aafe5e32d9ea360254e2c77461b860c9b9ae8a7a7e'],
  'TI-0005': [1140699, '419c971937763becd7ccc5bf675354d6af5629a8bd9fee7c2bee7746b5eee4ab'],
  'TI-0009': [7066127, 'c8612fbd76139f387290d5a1434b2e22199b781a9d33be1fd92e77df56edda9d'],
  'TI-0010': [494649, 'a80e261a3a0d148ba5df89af1ce5c40727c60be25a5a3b49eda1c7ef9995298c'],
  'TI-0011': [8670926, 'b7f8347cc212c11a6e62a7f232824ba7b1b545440711198cf8b7cdffba19ae15'],
};

const aprovadasDe = (patrimonio) =>
  Object.entries(decisoes[patrimonio] ?? {})
    .filter(([, registro]) => registro.decisao === 'aprovada')
    .map(([id]) => id);

describe('decisões da spec 005', () => {
  it('test_ca_01_fotos_atuais_reprovadas_com_o_motivo_real', () => {
    for (const [patrimonio, id, motivo] of ATUAIS) {
      assert.deepEqual(decisoes[patrimonio][id], { decisao: 'reprovada', motivo }, `${patrimonio} ${id}`);
    }
  });

  it('test_ca_02_reservas_com_marca_reprovadas_com_o_motivo', () => {
    for (const [patrimonio, id, motivo] of RESERVAS_COM_MARCA) {
      assert.deepEqual(decisoes[patrimonio][id], { decisao: 'reprovada', motivo }, `${patrimonio} ${id}`);
    }
  });

  it('test_ca_03_aprovadas_sao_as_ditas_pelo_usuario', () => {
    for (const [patrimonio, id] of Object.entries(APROVADAS)) {
      assert.deepEqual(aprovadasDe(patrimonio), [id], patrimonio);
    }
  });

  it('test_ca_03_novas_buscas_nao_reaproveitam_candidata_anterior', () => {
    for (const [patrimonio, anteriores] of Object.entries(ANTERIORES)) {
      assert.ok(!anteriores.includes(APROVADAS[patrimonio]), patrimonio);
    }
  });

  it('test_ca_03_a_17768_saiu_da_ti_0006', () => {
    assert.equal(decisoes['TI-0006']['17768'], undefined);
  });

  it('test_ca_03_cada_equipamento_tem_exatamente_uma_aprovada', () => {
    for (const { patrimonio } of equipamentos) {
      assert.equal(aprovadasDe(patrimonio).length, 1, patrimonio);
    }
  });
});

describe('créditos da spec 005', () => {
  it('test_ca_04_creditos_trazem_a_foto_aprovada_nos_6_trocados', () => {
    for (const [patrimonio, id] of Object.entries(APROVADAS)) {
      const item = credito(patrimonio);
      assert.equal(item.pixabay_id, Number(id), patrimonio);
      assert.ok(item.origem.endsWith(`-${id}/`), `${patrimonio}: ${item.origem}`);
      assert.ok(item.autor.trim(), patrimonio);
      assert.equal(item.licenca, 'Pixabay Content License');
    }
  });

  it('test_ca_04_os_outros_6_mantem_id_e_hash', () => {
    for (const [patrimonio, [id, hash]] of Object.entries(MANTIDOS)) {
      assert.equal(credito(patrimonio).pixabay_id, id, patrimonio);
      assert.equal(credito(patrimonio).sha256, hash, patrimonio);
    }
  });

  it('test_ca_04_creditos_tem_12_itens_sem_repeticao', () => {
    assert.equal(creditos.itens.length, 12);
    assert.equal(new Set(creditos.itens.map((item) => item.pixabay_id)).size, 12);
    assert.equal(new Set(creditos.itens.map((item) => item.sha256)).size, 12);
  });
});

describe('fechamento da spec 005', { skip: !existsSync(path.join(SAIDA, 'candidatas.json')) }, () => {
  it('test_ca_04_fechamento_sem_erros', () => {
    const candidatas = lerJson(SAIDA, 'candidatas.json');
    assert.deepEqual(avaliarDecisoes(equipamentos, candidatas, decisoes).erros, []);
  });

  it('test_ca_04_fotos_finais_800x600_com_o_hash_de_creditos', async () => {
    for (const item of creditos.itens) {
      const arquivo = path.join(SAIDA, 'final', item.arquivo);
      const meta = await sharp(arquivo).metadata();
      assert.deepEqual([meta.format, meta.width, meta.height], ['jpeg', 800, 600], item.patrimonio);
      assert.equal(sha256(readFileSync(arquivo)), item.sha256, item.patrimonio);
    }
  });
});
