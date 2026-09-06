// Dependency-free fallback after `pnpm build`. Never imports the AI runtime.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.RECORDED_PORT ?? 4320);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid RECORDED_PORT.');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/export.js', ['export.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (request.method !== 'GET' || !/^(127\.0\.0\.1|localhost):\d+$/.test(request.headers.host ?? '')) {
    response.writeHead(403).end('Recorded viewer only.'); return;
  }
  const pathname = new URL(request.url ?? '/', `http://127.0.0.1:${port}`).pathname;
  if (pathname === '/api/config') {
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      ready: false, recordedOnly: true,
      reason: 'Recorded viewer. Open a saved investigation; no agents or model calls will run.',
    })); return;
  }
  const asset = assets.get(pathname);
  if (!asset) { response.writeHead(404).end('Not found'); return; }
  try {
    const content = await readFile(new URL(`../dist/${asset[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': asset[1] }).end(content);
  } catch { response.writeHead(503).end('Build the interface with pnpm build before using the recorded viewer.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Recorded viewer: http://127.0.0.1:${port} — no model connection or package dependencies`));
