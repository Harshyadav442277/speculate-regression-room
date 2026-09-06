import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'app.js', 'export.js', 'styles.css']) await copyFile(resolve('web', file), resolve(output, file));
try {
  const recordings = await readdir(resolve('web/recordings'));
  await mkdir(resolve(output, 'recordings'), { recursive: true });
  for (const file of recordings.filter(name => name.endsWith('.json'))) await copyFile(resolve('web/recordings', file), resolve(output, 'recordings', file));
} catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
console.log('Built the interface in dist. Vercel bundles api/*.ts for hosted runs; pnpm dev serves local runs.');
