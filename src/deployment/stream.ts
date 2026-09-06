import { randomUUID } from 'node:crypto';
import { investigate } from '../core/investigation.js';
import type { RuntimeDriver, Policy, QuoteInput } from '../contracts.js';

export function investigationStream(request: Request, driver: RuntimeDriver, payload: {
  fixture: string; policy: Policy; failingInput: QuoteInput;
}, execution: 'live' | 'test'): Response {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  if (request.signal.aborted) abort();
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(output) {
      const send = (event: string, value: unknown) => {
        if (closed) return;
        try { output.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(value)}\n\n`)); }
        catch { closed = true; controller.abort(); }
      };
      send('connected', { ticket: randomUUID(), execution });
      // The response owns the run; later requests never need this process's memory.
      void investigate(driver, { ...payload, execution, signal: controller.signal,
        maxRunMs: 120000, maxModelRequests: 12, maxProbes: 12, modelTimeoutMs: 25000,
        onEvent: event => send('trace', event) })
        .then(artifact => send('complete', artifact))
        .catch(() => send('failure', { error: 'Investigation could not start.' }))
        .finally(() => {
          request.signal.removeEventListener('abort', abort);
          if (!closed) { closed = true; output.close(); }
        });
    },
    cancel() { closed = true; controller.abort(); request.signal.removeEventListener('abort', abort); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
