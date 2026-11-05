import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

// Contrato da skill: tudo aqui é regra garantida por código.
// O que depende de olho humano está em references/criterios-revisao.md.

export const LARGURA = 800;
export const ALTURA = 600;
export const LICENCA = {
  nome: 'Pixabay Content License',
  url: 'https://pixabay.com/service/license-summary/',
};
export const CACHE_MS = 24 * 60 * 60 * 1000;
const LARGURA_MAX_LARGE_IMAGE = 1280;

// Comparadas palavra a palavra com as tags da foto. Filtro inicial: a revisão
// humana continua obrigatória, porque tag não prova o que aparece na imagem.
const TAGS_PROIBIDAS = {
  pessoa: [
    'person', 'people', 'man', 'men', 'woman', 'women', 'girl', 'boy', 'child', 'children',
    'kid', 'baby', 'human', 'female', 'male', 'hand', 'hands', 'finger', 'fingers', 'face',
    'portrait', 'model', 'businessman', 'businesswoman', 'student', 'worker', 'blogger',
    'freelancer', 'selfie', 'couple', 'family', 'team',
  ],
  marca: [
    'apple', 'macbook', 'imac', 'iphone', 'ipad', 'mac', 'macintosh', 'dell', 'hp', 'lenovo',
    'asus', 'acer', 'samsung', 'lg', 'sony', 'canon', 'nikon', 'fujifilm', 'panasonic',
    'olympus', 'leica', 'kodak', 'gopro', 'logitech', 'microsoft', 'windows', 'google',
    'android', 'intel', 'nvidia', 'amd', 'logo', 'brand', 'trademark',
  ],
  'texto ou tela com conteúdo': [
    'text', 'typography', 'quote', 'letter', 'letters', 'word', 'words', 'sign', 'code',
    'coding', 'programming', 'website', 'web', 'browser', 'internet', 'seo', 'app', 'facebook',
    'instagram', 'youtube', 'twitter', 'social', 'dashboard', 'chart', 'graph', 'news',
    'game', 'gaming', 'movie', 'email',
  ],
};

export function lerVariavel(caminho, nome) {
  const linhas = readFileSync(caminho, 'utf8').split(/\r?\n/);
  for (const linha of linhas) {
    const achado = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (achado && achado[1] === nome) return achado[2].replace(/^["']|["']$/g, '');
  }
  return undefined;
}

export function palavrasDasTags(tags) {
  return String(tags ?? '')
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
}

// Devolve o motivo da rejeição, ou null se a foto pode virar candidata.
export function motivoRejeicao(hit) {
  if (hit.type !== 'photo') return `tipo ${hit.type}`;
  if (hit.isAiGenerated) return 'gerada por IA';
  if (hit.isLowQuality) return 'baixa qualidade';
  if (hit.imageWidth < LARGURA || hit.imageHeight < ALTURA) return 'menor que 800x600';
  if (hit.imageWidth <= hit.imageHeight) return 'não é horizontal';

  // largeImageURL tem no máximo 1280 px de lado: panorâmica ficaria baixa demais.
  const escala = Math.min(1, LARGURA_MAX_LARGE_IMAGE / hit.imageWidth);
  if (hit.imageHeight * escala < ALTURA) return 'proporção não permite 800x600 sem ampliar';

  const palavras = new Set(palavrasDasTags(hit.tags));
  for (const [grupo, proibidas] of Object.entries(TAGS_PROIBIDAS)) {
    const achada = proibidas.find((tag) => palavras.has(tag));
    if (achada) return `tag proibida (${grupo}): ${achada}`;
  }
  return null;
}

export function sha256(conteudo) {
  return createHash('sha256').update(conteudo).digest('hex');
}

// O nome do arquivo de cache não pode depender da chave da API.
export function chaveDeCache(parametros) {
  const ordenados = Object.keys(parametros)
    .filter((nome) => nome !== 'key')
    .sort()
    .map((nome) => `${nome}=${parametros[nome]}`);
  return sha256(ordenados.join('&')).slice(0, 24);
}

export function cacheAindaValido(modificadoEmMs, agoraMs) {
  return agoraMs - modificadoEmMs < CACHE_MS;
}

export function semSegredo(texto, segredo) {
  return segredo ? String(texto).split(segredo).join('***') : String(texto);
}

// Garantia do contrato: relê o arquivo final e falha se não for 800x600.
export async function validarArquivo(caminho) {
  const meta = await sharp(caminho).metadata();
  if (meta.width !== LARGURA || meta.height !== ALTURA || meta.format !== 'jpeg') {
    throw new Error(
      `${caminho}: esperado JPEG ${LARGURA}x${ALTURA}, veio ${meta.format} ${meta.width}x${meta.height}`,
    );
  }
  return { largura: meta.width, altura: meta.height };
}

export async function redimensionar(entrada, destino) {
  await sharp(entrada)
    .rotate()
    .resize(LARGURA, ALTURA, { fit: 'cover', position: 'centre', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(destino);
  return validarArquivo(destino);
}

export function hostEhLocal(url) {
  const { hostname } = new URL(url);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function exigirHostLocal(url) {
  if (!hostEhLocal(url)) {
    throw new Error(`--alvo local recusa o host "${new URL(url).hostname}".`);
  }
}

export function refDoProjeto(url) {
  const { hostname } = new URL(url);
  const achado = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
  if (!achado) throw new Error(`Host "${hostname}" não é de um projeto Supabase.`);
  return achado[1];
}

// Pré-condições do envio para produção. O agente não tem terminal interativo.
export function exigirCondicoesDeProducao({ isTTY, url, chave }) {
  if (!isTTY) throw new Error('--alvo producao exige terminal interativo: só o usuário executa.');
  if (!url || !chave) {
    throw new Error(
      '--alvo producao lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY só do processo, nunca de arquivo.',
    );
  }
  if (hostEhLocal(url)) throw new Error('--alvo producao recusa host local.');
  return refDoProjeto(url);
}

// decisoes: { "TI-0001": { "123": { "decisao": "aprovada|reprovada|pendente", "motivo": "" } } }
export function avaliarDecisoes(equipamentos, candidatas, decisoes) {
  const erros = [];
  const aprovadas = [];
  const reprovadas = [];
  const reservas = [];
  const idsAprovados = new Map();

  for (const { patrimonio } of equipamentos) {
    const dasCandidatas = candidatas[patrimonio] ?? [];
    const doEquipamento = decisoes[patrimonio] ?? {};
    const aprovadasAqui = [];

    for (const [id, registro] of Object.entries(doEquipamento)) {
      const candidata = dasCandidatas.find((item) => String(item.id) === id);
      if (!candidata) {
        erros.push(`${patrimonio}: a foto ${id} não é candidata deste equipamento.`);
        continue;
      }
      if (registro.decisao === 'aprovada') {
        aprovadasAqui.push(candidata);
      } else if (registro.decisao === 'reprovada') {
        if (!String(registro.motivo ?? '').trim()) {
          erros.push(`${patrimonio}: a foto ${id} foi reprovada sem motivo.`);
        }
        reprovadas.push({ patrimonio, id: candidata.id, motivo: registro.motivo });
      } else if (registro.decisao === 'reserva') {
        reservas.push({ patrimonio, id: candidata.id });
      } else if (registro.decisao !== 'pendente') {
        erros.push(`${patrimonio}: decisão inválida para a foto ${id}: ${registro.decisao}.`);
      }
    }

    if (aprovadasAqui.length !== 1) {
      erros.push(`${patrimonio}: precisa de exatamente 1 aprovada, tem ${aprovadasAqui.length}.`);
      continue;
    }
    const [aprovada] = aprovadasAqui;
    const repetida = idsAprovados.get(aprovada.id) ?? idsAprovados.get(aprovada.sha256);
    if (repetida) erros.push(`${patrimonio}: a mesma foto já foi aprovada em ${repetida}.`);
    idsAprovados.set(aprovada.id, patrimonio);
    idsAprovados.set(aprovada.sha256, patrimonio);
    aprovadas.push({ patrimonio, ...aprovada });
  }

  return { erros, aprovadas, reprovadas, reservas };
}

export function montarManifesto(aprovadas, reprovadas, reservas = []) {
  const motivos = {};
  for (const { motivo } of reprovadas) motivos[motivo] = (motivos[motivo] ?? 0) + 1;
  return {
    fonte: 'API do Pixabay',
    revisao_humana: {
      aprovadas: aprovadas.length,
      reservas: reservas.length,
      reprovadas: reprovadas.length,
      detalhe_reprovadas: reprovadas,
      motivos,
    },
    itens: aprovadas.map((item) => ({
      patrimonio: item.patrimonio,
      arquivo: `${item.patrimonio}.jpg`,
      pixabay_id: item.id,
      origem: item.pageURL,
      autor: item.user,
      autor_id: item.user_id,
      licenca: LICENCA.nome,
      licenca_url: LICENCA.url,
      largura: LARGURA,
      altura: ALTURA,
      sha256: item.sha256,
    })),
  };
}

export function escaparHtml(valor) {
  return String(valor ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

export function montarFolhaDeContato(equipamentos, candidatas) {
  const secoes = equipamentos.map((equipamento) => {
    const cards = (candidatas[equipamento.patrimonio] ?? []).map(
      (item) => `<figure>
  <img src="candidatas/${escaparHtml(equipamento.patrimonio)}/${escaparHtml(item.id)}.jpg" width="400" height="300" alt="">
  <figcaption><b>${escaparHtml(item.id)}</b> · ${escaparHtml(item.user)}<br>
  <small>${escaparHtml(item.tags)}</small><br>
  <a href="${escaparHtml(item.pageURL)}">página no Pixabay</a></figcaption>
</figure>`,
    );
    return `<section>
<h2>${escaparHtml(equipamento.patrimonio)} · ${escaparHtml(equipamento.nome)}</h2>
<p>busca: ${escaparHtml(equipamento.busca)} · ${cards.length} candidata(s)</p>
<div class="grade">${cards.join('\n') || '<p><b>Sem candidatas.</b></p>'}</div>
</section>`;
  });
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Folha de contato</title>
<style>
body{font:14px system-ui,sans-serif;margin:24px;background:#f4f4f4;color:#111}
.grade{display:flex;flex-wrap:wrap;gap:12px}
figure{margin:0;width:400px;background:#fff;padding:8px;border-radius:8px}
img{display:block;width:400px;height:300px}
small{color:#555}
</style></head><body>
<h1>Revisão visual</h1>
<p>Reprove foto com pessoa, marca ou logo legível, texto ou tela com conteúdo.
Registre a decisão em <code>revisao/decisoes.json</code>; cada equipamento precisa de exatamente 1 aprovada; outra foto boa fica como <code>reserva</code>.</p>
${secoes.join('\n')}
</body></html>
`;
}
