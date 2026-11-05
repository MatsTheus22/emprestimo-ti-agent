// Busca candidatas na API do Pixabay e gera a folha de contato para revisão.
// Uso: node buscar.mjs --env-chave <arquivo com PIXABAY_API_KEY> [--por-equipamento 4] [--somente TI-0007]
// A chave vai na query string da API: nunca logar a URL da busca.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  cacheAindaValido,
  chaveDeCache,
  lerVariavel,
  montarFolhaDeContato,
  motivoRejeicao,
  redimensionar,
  semSegredo,
  sha256,
} from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'saida');
const CACHE = path.join(SAIDA, 'cache');
const ORIGINAIS = path.join(SAIDA, 'originais');
const CANDIDATAS = path.join(SAIDA, 'candidatas');
const DECISOES = path.join(RAIZ, 'revisao', 'decisoes.json');
const INTERVALO_MS = 700; // a API permite 100 requisições a cada 60 s
const POR_PAGINA = 80;

let chaveEmUso;

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function lerChave(arquivo) {
  const chave = process.env.PIXABAY_API_KEY ?? (arquivo && lerVariavel(arquivo, 'PIXABAY_API_KEY'));
  if (!chave) throw new Error('Defina PIXABAY_API_KEY no ambiente ou passe --env-chave <arquivo>.');
  return chave;
}

// A API exige guardar as respostas por 24 h.
async function buscar(chave, termo) {
  const parametros = {
    q: termo,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    min_width: '800',
    min_height: '600',
    per_page: String(POR_PAGINA),
  };
  const arquivo = path.join(CACHE, `${chaveDeCache(parametros)}.json`);
  if (existsSync(arquivo) && cacheAindaValido(statSync(arquivo).mtimeMs, Date.now())) {
    return JSON.parse(readFileSync(arquivo, 'utf8'));
  }

  const url = `https://pixabay.com/api/?${new URLSearchParams({ key: chave, ...parametros })}`;
  const resposta = await fetch(url);
  if (resposta.status === 429) {
    const espera = Number(resposta.headers.get('x-ratelimit-reset') ?? 60);
    console.log(`limite da API atingido; aguardando ${espera}s`);
    await dormir(espera * 1000);
    return buscar(chave, termo);
  }
  if (!resposta.ok) {
    throw new Error(`API do Pixabay respondeu ${resposta.status} para "${termo}".`);
  }
  const corpo = await resposta.json();
  writeFileSync(arquivo, JSON.stringify(corpo));
  await dormir(INTERVALO_MS);
  return corpo;
}

async function baixarOriginal(hit) {
  const arquivo = path.join(ORIGINAIS, `${hit.id}.bin`);
  if (existsSync(arquivo)) return arquivo;
  const resposta = await fetch(hit.largeImageURL);
  if (!resposta.ok) throw new Error(`download da foto ${hit.id} respondeu ${resposta.status}`);
  writeFileSync(arquivo, Buffer.from(await resposta.arrayBuffer()));
  await dormir(INTERVALO_MS);
  return arquivo;
}

async function main() {
  const { values } = parseArgs({
    options: {
      'env-chave': { type: 'string' },
      'por-equipamento': { type: 'string', default: '4' },
      somente: { type: 'string' },
    },
  });
  const porEquipamento = Number(values['por-equipamento']);
  const chave = lerChave(values['env-chave']);
  chaveEmUso = chave;

  for (const pasta of [CACHE, ORIGINAIS, CANDIDATAS]) mkdirSync(pasta, { recursive: true });

  const equipamentos = JSON.parse(
    readFileSync(path.join(RAIZ, 'references', 'equipamentos.json'), 'utf8'),
  );
  const alternativas = JSON.parse(
    readFileSync(path.join(RAIZ, 'references', 'buscas-alternativas.json'), 'utf8'),
  );

  // Sem repetição: um id ou arquivo usado por um equipamento não serve a outro.
  const idsUsados = new Set();
  const hashesUsados = new Set();
  const candidatas = {};
  // Com --somente, as fotos já revisadas ficam como estão e não voltam como candidatas.
  const somente = values.somente?.split(',');
  const anteriores = somente ? JSON.parse(readFileSync(path.join(SAIDA, 'candidatas.json'), 'utf8')) : {};
  for (const item of Object.values(anteriores).flat()) {
    idsUsados.add(item.id);
    hashesUsados.add(item.sha256);
  }
  const novas = {};

  for (const equipamento of equipamentos) {
    const { patrimonio, busca } = equipamento;
    if (somente && !somente.includes(patrimonio)) {
      candidatas[patrimonio] = anteriores[patrimonio] ?? [];
      continue;
    }
    const lista = [];
    const rejeicoes = {};
    let chamadas = 0;

    const termos = [busca, ...(alternativas[patrimonio] ?? [])];
    for (const termo of somente ? termos.reverse() : termos) {
      if (lista.length >= porEquipamento) break;
      chamadas += 1;
      const { hits } = await buscar(chave, termo);

      for (const hit of hits) {
        if (lista.length >= porEquipamento) break;
        if (idsUsados.has(hit.id)) continue;
        const motivo = motivoRejeicao(hit);
        if (motivo) {
          rejeicoes[motivo] = (rejeicoes[motivo] ?? 0) + 1;
          continue;
        }

        const original = await baixarOriginal(hit);
        const pasta = path.join(CANDIDATAS, patrimonio);
        mkdirSync(pasta, { recursive: true });
        const destino = path.join(pasta, `${hit.id}.jpg`);
        try {
          await redimensionar(original, destino);
        } catch (erro) {
          rejeicoes['falhou em 800x600'] = (rejeicoes['falhou em 800x600'] ?? 0) + 1;
          console.log(`  ${hit.id}: ${erro.message}`);
          continue;
        }

        const hash = sha256(readFileSync(destino));
        if (hashesUsados.has(hash)) continue;
        idsUsados.add(hit.id);
        hashesUsados.add(hash);
        lista.push({
          id: hit.id,
          pageURL: hit.pageURL,
          user: hit.user,
          user_id: hit.user_id,
          tags: hit.tags,
          termo,
          sha256: hash,
        });
      }
    }

    candidatas[patrimonio] = [...(anteriores[patrimonio] ?? []), ...lista];
    novas[patrimonio] = lista;
    console.log(
      `${patrimonio}: ${lista.length} candidata(s), ${chamadas} busca(s), rejeições: ${JSON.stringify(rejeicoes)}`,
    );
  }

  writeFileSync(path.join(SAIDA, 'candidatas.json'), JSON.stringify(candidatas, null, 2));
  const nomeDaFolha = somente ? `folha-${somente.join('-')}.html` : 'folha-de-contato.html';
  writeFileSync(
    path.join(SAIDA, nomeDaFolha),
    somente
      ? montarFolhaDeContato(equipamentos.filter((e) => somente.includes(e.patrimonio)), novas)
      : montarFolhaDeContato(equipamentos, candidatas),
  );

  // Preserva o que o usuário já decidiu; só acrescenta o que é novo como pendente.
  const decisoes = existsSync(DECISOES) ? JSON.parse(readFileSync(DECISOES, 'utf8')) : {};
  for (const { patrimonio } of equipamentos) {
    decisoes[patrimonio] ??= {};
    for (const { id } of candidatas[patrimonio]) {
      decisoes[patrimonio][id] ??= { decisao: 'pendente', motivo: '' };
    }
  }
  writeFileSync(DECISOES, `${JSON.stringify(decisoes, null, 2)}\n`);
  console.log(`folha de contato: ${path.join(SAIDA, nomeDaFolha)}`);
}

main().catch((erro) => {
  console.error(semSegredo(erro.message, chaveEmUso));
  process.exit(1);
});
