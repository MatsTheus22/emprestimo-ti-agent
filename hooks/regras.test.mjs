// Rodar: node --test hooks/regras.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  decidir,
  estadoRepos,
  hashSpec,
  lerResposta,
  linhasDaTabela,
  montarRodada,
  motivoNaoPronta,
  negarProducao,
  negarVerificador,
  proximaRodada,
  specsPendentes,
} from './regras.mjs';

describe('negarProducao', () => {
  for (const comando of [
    'git push origin main',
    'git push --force origin etapa-1',
    'git push -f origin etapa-1',
    'git -C back push origin HEAD:main',
    'gh pr merge 3 -R x/y --merge',
    'gh workflow run migrate.yml',
    'npx prisma migrate deploy',
    'npx prisma db push',
    'npx vercel deploy --prod',
    'npx vercel env pull',
    'npx supabase db push',
    'node skills/imagens-equipamentos/scripts/enviar.mjs --alvo producao',
    'psql postgres://u@db.abc.supabase.co:5432/postgres -c "delete from x"',
    'curl -X DELETE https://abc.supabase.co/storage/v1/object/x',
    'SUPABASE_URL=https://abc.supabase.co npm run seed',
  ]) {
    it(`nega: ${comando}`, () => assert.ok(negarProducao(comando)));
  }

  for (const comando of [
    'git push -u origin etapa-1-verificador',
    'git status',
    'npm test',
    'npx prisma migrate reset --force',
    'node skills/imagens-equipamentos/scripts/enviar.mjs --alvo local',
    'curl -sI https://abc.supabase.co/storage/v1/object/public/equipamentos/TI-0001.jpg',
    'git commit -m "explica por que gh pr merge fica com o usuario"',
    'gh pr create --head etapa-1 --title "x" --body "nao rode gh pr merge"',
    `git commit -m "$(cat <<'EOF'\nnao usa git push origin main\nEOF\n)"`,
  ]) {
    it(`permite: ${comando}`, () => assert.equal(negarProducao(comando), null));
  }

  it('texto livre não esconde comando proibido encadeado', () => {
    assert.ok(negarProducao('git commit -m "ok" && git push origin main'));
  });
});

describe('negarVerificador', () => {
  for (const comando of [
    'npm test',
    'cd back && npm test',
    'cd "pasta com espaco" && npm run build 2>&1 | tail -5',
    'timeout 300 npm run test:db',
    'git log --oneline -5',
    'git -C back diff HEAD~1',
    'git -C "front" status --short',
    'git branch --show-current',
  ]) {
    it(`permite: ${comando}`, () => assert.equal(negarVerificador(comando), null));
  }

  for (const comando of [
    'sed -i s/a/b/ back/test/x.spec.ts',
    'npm install',
    'npx prisma migrate reset --force',
    'npm run seed:demo',
    'git commit -m x',
    'git checkout -- back/test/x.spec.ts',
    'git push',
    'git diff --output=x.txt',
    'npm test > saida.txt',
    'npm test; rm -rf back',
    'npm test || true',
    'npm test | node -e "x"',
    'echo $(npm test)',
    'node back/scripts/x.js',
    'curl https://abc.supabase.co',
  ]) {
    it(`nega: ${comando}`, () => assert.ok(negarVerificador(comando)));
  }
});

describe('decidir', () => {
  const verificador = { agent_type: 'verificador-spec' };

  it('nega Edit e Write ao verificador, mesmo em teste quebrado', () => {
    for (const tool_name of ['Edit', 'Write']) {
      assert.ok(decidir({ ...verificador, tool_name, tool_input: { file_path: 'back/test/x.spec.ts', new_string: 'x' } }, '.'));
    }
  });

  it('nega escrita em verificacoes/ por qualquer agente', () => {
    assert.ok(decidir({ tool_name: 'Write', tool_input: { file_path: 'C:\\p\\docs\\specs\\003-x\\verificacoes\\rodada-1.md', content: 'x' } }, '.'));
    assert.ok(decidir({ tool_name: 'Bash', tool_input: { command: 'rm docs/specs/003-x/verificacoes/rodada-1.md' } }, '.'));
  });

  it('permite ler verificacoes/ pelo shell', () => {
    assert.equal(decidir({ tool_name: 'Bash', tool_input: { command: 'ls docs/specs/003-x/verificacoes' } }, '.'), null);
  });

  it('nega declarar pronta pelo shell', () => {
    assert.ok(decidir({ tool_name: 'Bash', tool_input: { command: 'echo "Status: PRONTA" >> docs/specs/003-x/spec.md' } }, '.'));
  });

  it('também guarda o PowerShell', () => {
    assert.ok(decidir({ tool_name: 'PowerShell', tool_input: { command: 'gh pr merge 1' } }, '.'));
  });
});

describe('gate da spec', () => {
  let raiz;
  const SPEC = '003-x';
  const pastaSpec = () => join(raiz, 'docs', 'specs', SPEC);
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore' });
  const gravarRodada = (numero, veredito) => {
    mkdirSync(join(pastaSpec(), 'verificacoes'), { recursive: true });
    const conteudoSpec = '# Spec\n';
    writeFileSync(
      join(pastaSpec(), 'verificacoes', `rodada-${numero}.md`),
      montarRodada({ numero, spec: SPEC, data: 'd', estado: estadoRepos(raiz), conteudoSpec, resposta: `Spec: docs/specs/${SPEC}/spec.md\nVeredito: ${veredito}` }),
    );
  };

  before(() => {
    raiz = mkdtempSync(join(tmpdir(), 'gate-'));
    mkdirSync(pastaSpec(), { recursive: true });
    writeFileSync(join(pastaSpec(), 'spec.md'), '# Spec\n');
    for (const repo of ['back', 'front']) {
      const pasta = join(raiz, repo);
      mkdirSync(pasta);
      git(pasta, 'init', '-q');
      writeFileSync(join(pasta, 'a.txt'), 'a');
      git(pasta, 'add', '.');
      git(pasta, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x');
    }
  });
  after(() => rmSync(raiz, { recursive: true, force: true }));

  const declarar = () => decidir({ tool_name: 'Edit', tool_input: { file_path: join(pastaSpec(), 'spec.md'), new_string: 'Status: PRONTA\n' } }, raiz);

  it('sem rodada, não pode', () => assert.match(declarar(), /ainda não passou/));

  it('rodada reprovada, não pode', () => {
    gravarRodada(1, 'NÃO PRONTA — CA-01 falhou');
    assert.match(declarar(), /NÃO PRONTA/);
  });

  it('PRONTA PARA PRODUÇÃO libera o PR de código, não a spec', () => {
    gravarRodada(2, 'PRONTA PARA PRODUÇÃO');
    assert.match(declarar(), /PRONTA PARA PRODUÇÃO/);
    assert.equal(motivoNaoPronta(raiz, SPEC, ['PRONTA', 'PRONTA PARA PRODUÇÃO']), null);
  });

  it('rodada PRONTA com código igual, pode', () => {
    gravarRodada(3, 'PRONTA');
    assert.equal(declarar(), null);
  });

  it('merge commit com a mesma árvore continua valendo', () => {
    git(join(raiz, 'back'), '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--allow-empty', '-qm', 'merge');
    assert.equal(declarar(), null);
  });

  it('declarar pronta não invalida a própria rodada', () => {
    assert.equal(hashSpec('# Spec\n'), hashSpec('Status: PRONTA\n# Spec\r\n'));
  });

  it('spec alterada invalida a rodada', () => {
    writeFileSync(join(pastaSpec(), 'spec.md'), '# Spec nova\n');
    assert.match(declarar(), /spec .* mudou/i);
    writeFileSync(join(pastaSpec(), 'spec.md'), '# Spec\n');
  });

  it('código alterado invalida a rodada', () => {
    const pasta = join(raiz, 'front');
    writeFileSync(join(pasta, 'a.txt'), 'b');
    assert.match(declarar(), /front mudou/);
    git(pasta, 'add', '.');
    git(pasta, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'y');
    assert.match(declarar(), /front mudou/);
    gravarRodada(4, 'PRONTA');
    assert.equal(declarar(), null);
  });

  it('rodada com repositório sujo não vale', () => {
    const pasta = join(raiz, 'back');
    writeFileSync(join(pasta, 'b.txt'), 'x');
    gravarRodada(5, 'PRONTA');
    assert.match(declarar(), /sujo/);
    rmSync(join(pasta, 'b.txt'));
    gravarRodada(6, 'PRONTA');
    assert.equal(proximaRodada(join(pastaSpec(), 'verificacoes')), 7);
  });

  it('PR de código exige rodada; PR do agente exige o status', () => {
    const noRepo = (repo) => ({ tool_name: 'Bash', tool_input: { command: `gh pr create -R u/emprestimo-ti-${repo} --head ${SPEC} --title x` } });
    assert.equal(decidir(noRepo('back'), raiz), null);
    assert.match(decidir(noRepo('agent'), raiz), /Status: PRONTA/);
    writeFileSync(join(pastaSpec(), 'spec.md'), 'Status: PRONTA\n# Spec\n');
    assert.equal(decidir(noRepo('agent'), raiz), null);
    writeFileSync(join(pastaSpec(), 'spec.md'), '# Spec\n');
  });

  it('git push sem branch: nega na principal, permite em branch de trabalho', () => {
    const pasta = join(raiz, 'back');
    const empurrar = (command) => decidir({ tool_name: 'Bash', cwd: pasta, tool_input: { command } }, raiz);
    git(pasta, 'switch', '-qC', 'main');
    assert.match(empurrar('git push'), /sem branch/);
    assert.match(empurrar('git push -u origin'), /sem branch/);
    git(pasta, 'switch', '-qc', 'etapa-x');
    assert.equal(empurrar('git push'), null);
    assert.equal(empurrar('git push -u origin etapa-x'), null);
    assert.match(empurrar('cd outro && git push'), /sem branch/);
  });

  it('Stop cobra só spec de tarefas concluídas e sem status', () => {
    writeFileSync(join(pastaSpec(), 'tasks.md'), '- [x] a\n- [ ] b\n');
    assert.deepEqual(specsPendentes(raiz), []);
    writeFileSync(join(pastaSpec(), 'tasks.md'), '- [x] a\n- [x] b\n');
    assert.deepEqual(specsPendentes(raiz), [SPEC]);
    writeFileSync(join(pastaSpec(), 'spec.md'), 'Status: PRONTA\n# Spec\n');
    assert.deepEqual(specsPendentes(raiz), []);
  });

  it('Stop ignora specs anteriores à regra', () => {
    const antiga = join(raiz, 'docs', 'specs', '002-velha');
    mkdirSync(antiga);
    writeFileSync(join(antiga, 'spec.md'), '# x\n');
    writeFileSync(join(antiga, 'tasks.md'), '- [x] a\n');
    assert.deepEqual(specsPendentes(raiz), []);
  });
});

describe('leitura da resposta', () => {
  it('exige spec e veredito', () => {
    assert.deepEqual(lerResposta('Spec: docs/specs/002-login/spec.md\nVeredito: NÃO PRONTA — x'), { spec: '002-login', veredito: 'NÃO PRONTA' });
    assert.equal(lerResposta('Veredito: PRONTA'), null);
    assert.equal(lerResposta('Spec: docs/specs/../../x/spec.md\nVeredito: PRONTA'), null);
    assert.equal(lerResposta(undefined), null);
  });

  it('lê os status da tabela', () => {
    const tabela = '| CA | evidência | status | obs |\n|---|---|---|---|\n| CA-01 | a.ts:1 | ATENDIDO | |\n| CA-02 | - | REPROVADO | x |\n';
    assert.deepEqual([...linhasDaTabela(tabela)], [['CA-01', 'ATENDIDO'], ['CA-02', 'REPROVADO']]);
  });
});
