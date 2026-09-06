import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const variants = new Set(['correct', 'discount-twice', 'tax-twice']);

// Executable test fixture, not a payment system. All monetary inputs are cents.
export function quote(input, variant = 'correct') {
  if (!variants.has(variant)) throw new Error('Unknown fixture variant');
  const { unitPriceCents, quantity, discountBps, taxBps } = input;
  if (![unitPriceCents, quantity, discountBps, taxBps].every(Number.isSafeInteger)
    || unitPriceCents < 0 || unitPriceCents > 1_000_000
    || quantity < 1 || quantity > 100
    || discountBps < 0 || discountBps > 10_000
    || taxBps < 0 || taxBps > 10_000) {
    throw new Error('Invalid quote input');
  }
  const subtotalCents = unitPriceCents * quantity;
  let discountedCents = Math.round(subtotalCents * (10_000 - discountBps) / 10_000);
  if (variant === 'discount-twice') {
    discountedCents = Math.round(discountedCents * (10_000 - discountBps) / 10_000);
  }
  let totalCents = Math.round(discountedCents * (10_000 + taxBps) / 10_000);
  if (variant === 'tax-twice') {
    totalCents = Math.round(totalCents * (10_000 + taxBps) / 10_000);
  }
  // The diagnostic response deliberately does not reveal the configured fault.
  return { totalCents };
}

export function createQuoteServer(variant = 'correct') {
  if (!variants.has(variant)) throw new Error('Unknown fixture variant');
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.method !== 'POST' || request.url !== '/quote') {
      response.writeHead(404).end(JSON.stringify({ error: 'Unknown route' }));
      return;
    }
    try {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (Buffer.byteLength(body) > 4096) {
          response.writeHead(413).end(JSON.stringify({ error: 'Request too large' }));
          return;
        }
      }
      const result = quote(JSON.parse(body), variant);
      response.writeHead(200).end(JSON.stringify(result));
    } catch {
      response.writeHead(400).end(JSON.stringify({ error: 'Invalid quote request' }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const variant = process.argv[2] ?? 'discount-twice';
  const port = Number(process.argv[3] ?? 4318);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
  const server = createQuoteServer(variant);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Local fixture ready at http://127.0.0.1:${server.address().port}/quote`);
    console.log(`Operator-only fixture variant: ${variant}`);
  });
}
