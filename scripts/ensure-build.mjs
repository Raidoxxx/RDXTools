import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

async function buildIsReady(directory) {
  const root = resolve(directory, 'build');
  try {
    await Promise.all(['index.html', '404.html', '_headers', 'sitemap.xml', 'robots.txt']
      .map(file => access(resolve(root, file))));
    const [release, app] = await Promise.all([
      readFile(resolve(root, '.rdx-build.json'), 'utf8'),
      readFile(resolve(directory, 'package.json'), 'utf8'),
    ]);
    if (JSON.parse(release).version !== JSON.parse(app).version) return false;
    const html = await readFile(resolve(root, 'index.html'), 'utf8');
    if (html.includes('<!--app-html-->') || !html.includes('data-route="/"')) return false;
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)];
    if (!assets.length) return false;
    await Promise.all(assets.map(([, asset]) => access(resolve(root, asset.slice(1)))));
    return true;
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code) || error instanceof SyntaxError) return false;
    throw error;
  }
}

export async function ensureBuild(directory) {
  if (await buildIsReady(directory)) return;
  console.log('Build de produção ausente ou incompleto. Gerando os arquivos antes de iniciar…');
  // npm start supplies npm_execpath; direct node execution can use npm on PATH.
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : 'npm';
  const args = npmCli ? [npmCli, 'run', 'build'] : ['run', 'build'];
  await new Promise((resolveBuild, reject) => {
    const child = spawn(command, args, {
      cwd: directory, stdio: 'inherit', env: process.env,
      shell: !npmCli && process.platform === 'win32',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveBuild();
      else reject(new Error(`Build falhou (${signal ?? code}). Confira as dependências de desenvolvimento e os logs acima.`));
    });
  });
  if (!await buildIsReady(directory)) throw new Error('O build terminou sem gerar todos os arquivos necessários em build/.');
}
