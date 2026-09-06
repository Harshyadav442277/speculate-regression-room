import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createQuoteServer } from '../research/checkout-fixture/quote-service.mjs';
import { DEFAULT_INPUT, expectedQuote } from '../src/core/quote-contract.js';
import { EvidenceSession } from '../src/core/session.js';
import { investigate } from '../src/core/investigation.js';
import { regressionScript } from '../src/core/report.js';
import type { RuntimeDriver } from '../src/contracts.js';

async function fixture(variant = 'discount-twice') {
  const server = createQuoteServer(variant);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { endpoint: `http://127.0.0.1:${address.port}/quote`, async close() {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  } };
}

// A test driver for the host contract only. It is neither Mozaik nor live AI.
const testDriver: RuntimeDriver = async (host, options) => {
  const agents = options.policy === 'single' ? ['generalist'] as const : ['pricing', 'tax'] as const;
  for (const agent of agents) {
    await host.probe(agent, { ...host.failingInput, taxBps: 0 }, 'Observe the submitted input without tax.');
    host.conclude(agent, { summary: 'Test driver conclusion', evidenceIds: host.getEvidence().map(e => e.id), unresolved: ['This deterministic driver does not diagnose faults.'] });
  }
  return { modelRequests: 0, usage: null, model: 'test-driver', provider: 'none' };
};

test('exact reference handles rounding, free orders and maximum allowed inputs', () => {
  assert.equal(expectedQuote(DEFAULT_INPUT), 18900);
  assert.equal(expectedQuote({ unitPriceCents: 1, quantity: 1, discountBps: 5000, taxBps: 5000 }), 2);
  assert.equal(expectedQuote({ ...DEFAULT_INPUT, discountBps: 10000 }), 0);
  assert.equal(expectedQuote({ unitPriceCents: 1_000_000, quantity: 100, discountBps: 0, taxBps: 10000 }), 200_000_000);
  assert.throws(() => expectedQuote({ ...DEFAULT_INPUT, quantity: 0 }));
  assert.throws(() => expectedQuote({ ...DEFAULT_INPUT, unitPriceCents: 1.1 }));
});

test('simultaneous identical probes execute once, preserve provenance and isolate runs', async () => {
  const service = await fixture();
  try {
    const session = new EvidenceSession({ endpoint: service.endpoint, failingInput: DEFAULT_INPUT, signal: new AbortController().signal });
    const input = { ...DEFAULT_INPUT };
    const [a, b] = await Promise.all([session.probe('pricing', input, 'First'), session.probe('tax', input, 'Second')]);
    input.quantity = 99;
    assert.equal(a.id, b.id);
    assert.equal(a.actualCents, 17010);
    assert.equal(a.input.quantity, 2);
    assert.equal(a.agentId, 'pricing');
    assert.equal(session.getMetrics().probeExecutions, 1);
    assert.equal(session.getMetrics().probeReuses, 1);
    assert.throws(() => { a.actualCents = 1; });
    const fresh = new EvidenceSession({ endpoint: service.endpoint, failingInput: DEFAULT_INPUT, signal: new AbortController().signal });
    assert.equal(fresh.getEvidence().length, 0);
    assert.notEqual((await fresh.probe('tax', DEFAULT_INPUT, 'Independent run')).id, a.id);
  } finally { await service.close(); }
});

test('budgets, evidence links and detached observers cannot corrupt the ledger', async () => {
  const service = await fixture();
  try {
    const session = new EvidenceSession({ endpoint: service.endpoint, failingInput: DEFAULT_INPUT, signal: new AbortController().signal, maxProbes: 1, maxModelRequests: 1 });
    session.subscribe(() => { throw new Error('Broken display'); });
    const observed: number[] = [];
    session.subscribe(event => { observed.push(event.sequence); });
    const evidence = await session.probe('pricing', DEFAULT_INPUT, 'Reproduce');
    assert.ok(observed.length >= 2);
    assert.ok(session.getEvents().some(e => e.type === 'observer.failed'));
    assert.deepEqual(session.getEvents().map(e => e.sequence), session.getEvents().map((_, i) => i + 1));
    await assert.rejects(session.probe('tax', { ...DEFAULT_INPUT, taxBps: 0 }, 'Budget exceeded'), /budget exhausted/);
    assert.throws(() => session.record('action.reconsidered', 'tax', { before: {}, after: {}, changed: false, peerEvidenceIds: ['made-up'] }), /observed peer/);
    assert.throws(() => session.record('action.reconsidered', 'pricing', { before: {}, after: {}, changed: false, peerEvidenceIds: [evidence.id] }), /observed peer/);
    session.record('action.reconsidered', 'tax', { before: 'a', after: 'b', changed: true, peerEvidenceIds: [evidence.id] });
    session.record('model.requested', 'tax', {});
    assert.throws(() => session.record('model.requested', 'tax', {}), /budget exhausted/);
    assert.throws(() => session.conclude('tax', { summary: 'Unsupported', evidenceIds: ['fake'], unresolved: [] }), /observed evidence/);
    session.close();
    await assert.rejects(session.probe('tax', DEFAULT_INPUT, 'Too late'), /ended/);
  } finally { await service.close(); }
});

test('failure and timeout retain evidence and end the run without an invented success', async () => {
  const failed = await investigate(async () => { throw new Error('sensitive provider diagnostics'); }, { execution: 'test' });
  assert.equal(failed.status, 'incomplete');
  assert.equal(failed.evidence.length, 1);
  assert.equal(JSON.stringify(failed).includes('sensitive provider diagnostics'), false);
  const timedOut = await investigate(async () => new Promise(() => {}), { execution: 'test', maxRunMs: 80 });
  assert.equal(timedOut.status, 'incomplete');
  assert.equal(timedOut.error?.code, 'RUN_TIMEOUT');
  assert.equal(timedOut.evidence.length, 1);
  const controller = new AbortController(); controller.abort();
  const cancelled = await investigate(testDriver, { execution: 'test', signal: controller.signal });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.metrics.probeExecutions, 0);
});

test('seed evidence and missing before/after data cannot be counted as peer cooperation', async () => {
  const service = await fixture();
  try {
    const session = new EvidenceSession({ endpoint: service.endpoint, failingInput: DEFAULT_INPUT, signal: new AbortController().signal });
    const seed = await session.probe('generalist', DEFAULT_INPUT, 'Initial input');
    assert.throws(() => session.record('action.reconsidered', 'tax', { before: 'a', after: 'b', changed: true, peerEvidenceIds: [seed.id] }), /observed peer/);
    const peer = await session.probe('pricing', { ...DEFAULT_INPUT, taxBps: 0 }, 'New specialist evidence');
    assert.throws(() => session.record('action.reconsidered', 'tax', { before: undefined, after: 'b', changed: true, peerEvidenceIds: [peer.id] }), /before, after/);
    assert.throws(() => session.record('action.reconsidered', 'tax', { before: 'same', after: 'same', changed: true, peerEvidenceIds: [peer.id] }), /identical action/);
    assert.equal(session.getEvents().filter(e => e.type === 'action.reconsidered').length, 0);
  } finally { await service.close(); }
});

test('a transient failed probe can be retried explicitly without erasing its cost or failure', async () => {
  let attempts = 0;
  const server = createServer((_, response) => { attempts++; response.writeHead(attempts === 1 ? 503 : 200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ totalCents: 18900 })); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    const session = new EvidenceSession({ endpoint: `http://127.0.0.1:${address.port}/quote`, failingInput: DEFAULT_INPUT, signal: new AbortController().signal });
    session.subscribe(async () => { throw new Error('Async display failure'); });
    await assert.rejects(session.probe('pricing', DEFAULT_INPUT, 'First attempt'), /HTTP 503/);
    assert.equal((await session.probe('pricing', DEFAULT_INPUT, 'Explicit retry')).actualCents, 18900);
    assert.equal(session.getMetrics().probeExecutions, 2);
    assert.equal(session.getEvidence().length, 1);
    assert.equal(session.getEvents().filter(e => e.type === 'probe.failed').length, 1);
    assert.equal(session.getEvents().filter(e => e.type === 'observer.failed').length, 1);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('exported standalone Node test fails on broken service and passes on corrected service', async () => {
  const run = await investigate(testDriver, { execution: 'test' });
  assert.equal(run.status, 'completed');
  assert.equal(run.execution, 'test');
  assert.equal(run.metrics.modelRequests, 0);
  const directory = await mkdtemp(join(tmpdir(), 'speculate-export-'));
  const broken = await fixture();
  const corrected = await fixture('correct');
  try {
    const script = join(directory, 'regression.mjs');
    await writeFile(script, regressionScript(run));
    const execute = (endpoint: string) => new Promise<{ code: number | null; stdout: string }>((resolve, reject) => {
      const child = spawn(process.execPath, [script, endpoint], { windowsHide: true });
      let stdout = ''; child.stdout.on('data', data => { stdout += data; }); child.on('error', reject);
      child.on('close', code => resolve({ code, stdout }));
    });
    const bad = await execute(broken.endpoint);
    const good = await execute(corrected.endpoint);
    assert.equal(bad.code, 1, bad.stdout);
    assert.equal(good.code, 0, good.stdout);
    assert.match(good.stdout, /"failures":0/);
  } finally {
    await broken.close(); await corrected.close();
    assert.equal(dirname(await realpath(directory)).toLowerCase(), (await realpath(tmpdir())).toLowerCase());
    await rm(directory, { recursive: true, force: true });
  }
});
