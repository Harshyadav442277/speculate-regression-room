import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createQuoteServer } from './quote-service.mjs';

// Expected values come from the written fixture contract, not quote().
const cases = [
  { name: 'initial-complaint', input: { unitPriceCents: 10000, quantity: 2, discountBps: 1000, taxBps: 500 }, expected: 18900 },
  { name: 'tax-disabled', input: { unitPriceCents: 10000, quantity: 2, discountBps: 1000, taxBps: 0 }, expected: 18000 },
  { name: 'discount-disabled', input: { unitPriceCents: 10000, quantity: 2, discountBps: 0, taxBps: 500 }, expected: 21000 },
  { name: 'both-disabled', input: { unitPriceCents: 10000, quantity: 2, discountBps: 0, taxBps: 0 }, expected: 20000 },
];
const knownOutputs = {
  correct: [18900, 18000, 21000, 20000],
  'discount-twice': [17010, 16200, 21000, 20000],
  'tax-twice': [19845, 18000, 22050, 20000],
};
const results = [];

for (const variant of Object.keys(knownOutputs)) {
  const server = createQuoteServer(variant);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/quote`;
  try {
    for (const [i, probe] of cases.entries()) {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(probe.input) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(Object.keys(body), ['totalCents']);
      assert.equal(body.totalCents, knownOutputs[variant][i]);
      results.push({ variant, probe: probe.name, expectedCents: probe.expected,
        observedCents: body.totalCents, matchesContract: body.totalCents === probe.expected });
    }
    const invalid = await fetch(url, { method: 'POST', body: JSON.stringify({ ...cases[0].input, quantity: -1 }) });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

assert(results.some(r => r.variant === 'discount-twice' && r.probe === 'tax-disabled' && !r.matchesContract));
assert(results.filter(r => r.variant === 'correct').every(r => r.matchesContract));
assert(results.some(r => r.variant === 'tax-twice' && r.probe === 'discount-disabled' && !r.matchesContract));
console.log(JSON.stringify({ status: 'PASS', httpProbeCases: results.length,
  invalidInputChecks: 3, realProviderCalls: 0, mozaikRuns: 0, results }, null, 2));
