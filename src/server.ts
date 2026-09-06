import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RunEvent, RuntimeDriver } from './contracts.js';
import { investigate, type RunArtifact } from './core/investigation.js';
import { quoteSchema } from './core/quote-contract.js';
import { markdownReport, regressionScript } from './core/report.js';
import { verifyCorrectedFixture } from './core/verification.js';
import { checkRuntimeConfig, runInvestigation } from './runtime/index.js';

const requestSchema = z.object({
  fixture: z.enum(['discount-twice', 'tax-twice', 'correct']),
  policy: z.enum(['cooperative', 'independent', 'single']),
  failingInput: quoteSchema,
}).strict();

interface Ticket {
  id: string; state: 'running' | 'complete'; controller: AbortController;
  events: RunEvent[]; artifact?: RunArtifact; listeners: Set<ServerResponse>;
}

async function body(request: IncomingMessage): Promise<unknown> {
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error('Request too large');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

export function createAppServer(options: {
  driver?: RuntimeDriver;
  configurationCheck?: typeof checkRuntimeConfig;
  execution?: 'live' | 'test';
  saveArtifacts?: boolean;
  assets?: string;
} = {}) {
  const driver = options.driver ?? runInvestigation;
  const readiness = options.configurationCheck ?? checkRuntimeConfig;
  const tickets = new Map<string, Ticket>();
  const assets = options.assets ?? resolve('web');
  let active: Ticket | undefined;
  const json = (response: ServerResponse, status: number, value: unknown) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(value));
  };
  const send = (ticket: Ticket, event: string, value: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(value)}\n\n`;
    for (const listener of ticket.listeners) {
      try {
        // An unresponsive display must not hold an investigation in memory indefinitely.
        if (listener.writableLength > 1_000_000) { listener.destroy(); ticket.listeners.delete(listener); }
        else listener.write(payload);
      } catch { ticket.listeners.delete(listener); }
    }
  };
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const host = request.headers.host;
    if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) { json(response, 403, { error: 'Local access required.' }); return; }
    const url = new URL(request.url ?? '/', `http://${host}`);
    if (request.method === 'POST') {
      if ((request.headers.origin && request.headers.origin !== url.origin) || request.headers['x-speculate'] !== '1' || !request.headers['content-type']?.startsWith('application/json')) {
        json(response, 403, { error: 'Same-origin application request required.' }); return;
      }
    }
    try {
      if (request.method === 'GET' && url.pathname === '/api/config') { json(response, 200, { ...readiness(), execution: options.execution ?? 'live' }); return; }
      if (request.method === 'POST' && url.pathname === '/api/run') {
        const parsed = requestSchema.safeParse(await body(request));
        if (!parsed.success) { json(response, 400, { error: 'Provide valid bounded integer quote inputs, a fixture, and a policy.' }); return; }
        if (active) { json(response, 409, { error: 'An investigation is already running.' }); return; }
        const config = readiness();
        if (!config.ready) { json(response, 503, { error: config.reason ?? 'Provider is not configured.' }); return; }
        const ticket: Ticket = { id: randomUUID(), state: 'running', controller: new AbortController(), events: [], listeners: new Set() };
        active = ticket; tickets.set(ticket.id, ticket);
        if (tickets.size > 20) { const oldest = tickets.keys().next().value; if (oldest) tickets.delete(oldest); }
        json(response, 202, { ticket: ticket.id, execution: options.execution ?? 'live' });
        // This promise is handled explicitly. A display or disk failure cannot erase the result.
        void investigate(driver, { ...parsed.data, signal: ticket.controller.signal, execution: options.execution ?? 'live',
          onEvent: event => { ticket.events.push(event); send(ticket, 'trace', event); } })
          .then(async artifact => {
            ticket.artifact = artifact; ticket.state = 'complete';
            send(ticket, 'complete', artifact);
            for (const listener of ticket.listeners) listener.end();
            ticket.listeners.clear();
            if (options.saveArtifacts) {
              try {
                const directory = resolve('artifacts/private', artifact.runId);
                await mkdir(directory, { recursive: true });
                await writeFile(resolve(directory, 'run.json'), JSON.stringify(artifact, null, 2));
              } catch { console.error('Run retained in memory; artifact could not be saved to disk.'); }
            }
          })
          .catch(() => {
            ticket.state = 'complete'; send(ticket, 'failure', { error: 'Investigation could not start.' });
            for (const listener of ticket.listeners) listener.end(); ticket.listeners.clear();
          })
          .finally(() => { if (active === ticket) active = undefined; });
        return;
      }
      const match = /^\/api\/run\/([a-f0-9-]{36})(?:\/(events|cancel|report|regression|verify))?$/.exec(url.pathname);
      if (match) {
        const ticket = tickets.get(match[1]!);
        if (!ticket) { json(response, 404, { error: 'Run not found in this local session.' }); return; }
        const action = match[2];
        if (request.method === 'GET' && !action) { json(response, 200, { state: ticket.state, artifact: ticket.artifact ?? null }); return; }
        if (request.method === 'GET' && action === 'events') {
          response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
          for (const event of ticket.events) response.write(`event: trace\ndata: ${JSON.stringify(event)}\n\n`);
          if (ticket.artifact) { response.end(`event: complete\ndata: ${JSON.stringify(ticket.artifact)}\n\n`); return; }
          if (ticket.state === 'complete') { response.end('event: failure\ndata: {"error":"Run ended before an artifact was available."}\n\n'); return; }
          ticket.listeners.add(response); request.on('close', () => ticket.listeners.delete(response)); return;
        }
        if (request.method === 'POST' && action === 'cancel') {
          ticket.controller.abort(); json(response, 200, { requested: true, note: 'Stops waiting and future local actions; an in-flight provider request may finish.' }); return;
        }
        if (!ticket.artifact) { json(response, 409, { error: 'The investigation has not finished.' }); return; }
        if (request.method === 'POST' && action === 'verify') { json(response, 200, await verifyCorrectedFixture(ticket.artifact)); return; }
        if (request.method === 'GET' && (action === 'report' || action === 'regression')) {
          const isReport = action === 'report';
          response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${isReport ? 'report.md' : 'regression.mjs'}"` });
          response.end(isReport ? markdownReport(ticket.artifact) : regressionScript(ticket.artifact)); return;
        }
      }
      const files: Record<string, { name: string; type: string }> = {
        '/': { name: 'index.html', type: 'text/html; charset=utf-8' },
        '/app.js': { name: 'app.js', type: 'text/javascript; charset=utf-8' },
        '/export.js': { name: 'export.js', type: 'text/javascript; charset=utf-8' },
        '/styles.css': { name: 'styles.css', type: 'text/css; charset=utf-8' },
      };
      const file = files[url.pathname];
      if (request.method === 'GET' && file) {
        const content = await readFile(resolve(assets, file.name));
        response.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'no-cache' }).end(content); return;
      }
      json(response, 404, { error: 'Unknown route.' });
    } catch { if (!response.headersSent) json(response, 400, { error: 'Request could not be completed.' }); else response.end(); }
  });
  server.on('close', () => active?.controller.abort());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4317);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const server = createAppServer({ saveArtifacts: true });
  server.listen(port, '127.0.0.1', () => console.log(`SPECULATE ready at http://127.0.0.1:${port}`));
}
