import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as start } from '../api/investigate.js';
import { POST as verify } from '../api/verify.js';
import { DEFAULT_INPUT } from '../src/core/quote-contract.js';
import { investigationStream } from '../src/deployment/stream.js';
import type { RuntimeDriver } from '../src/contracts.js';

const payload = { fixture: 'discount-twice', policy: 'cooperative' as const, failingInput: DEFAULT_INPUT };
const request = (value: unknown, origin = 'https://speculate.example') => new Request('https://speculate.example/api/investigate', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Speculate': '1' }, body: JSON.stringify(value),
});

test('hosted routes reject untrusted origins and invalid inputs before running a model', async () => {
  assert.equal((await start(request(payload, 'https://other.example'))).status, 403);
  assert.equal((await start(request({ ...payload, endpoint: 'https://other.example' }))).status, 400);
  assert.equal((await start(request({ ...payload, failingInput: { ...DEFAULT_INPUT, quantity: 0 } }))).status, 400);
  assert.equal((await start(request(payload))).ok, false); // Missing access code always denies a paid run.
});

test('hosted verification reexecutes captured inputs and computes its own expected values', async () => {
  const evidence = [DEFAULT_INPUT, { ...DEFAULT_INPUT, taxBps: 0 }, { ...DEFAULT_INPUT, discountBps: 0 }].map((input, i) => ({ id: `probe-${i}`, input }));
  const result = await verify(request({ evidence }));
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.equal(data.cases, 3); assert.equal(data.failures, 0);
  assert.deepEqual(data.results.map((r: { actualCents: number }) => r.actualCents), [18900, 18000, 21000]);
  assert.equal((await verify(request({ evidence: [{ ...evidence[0], expectedCents: 17010 }] }))).status, 400);
  assert.equal((await verify(request({ evidence: Array(13).fill(evidence[0]) }))).status, 400);
});

test('one hosted response streams executed evidence and the complete portable artifact', async () => {
  const driver: RuntimeDriver = async host => {
    for (const agent of ['pricing', 'tax'] as const) {
      await host.probe(agent, { ...DEFAULT_INPUT, taxBps: 0 }, 'Controlled streaming test');
      host.conclude(agent, { summary: 'Controlled test, no model called.', evidenceIds: host.getEvidence().map(e => e.id), unresolved: [] });
    }
    return { provider: 'none', model: 'test-driver', modelRequests: 0, usage: null };
  };
  const response = investigationStream(request(payload), driver, payload, 'test');
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  const blocks = (await response.text()).trim().split('\n\n');
  assert.ok(blocks[0].startsWith('event: connected'));
  assert.ok(blocks.some(b => b.includes('probe.completed')));
  const artifact = JSON.parse(blocks.find(b => b.startsWith('event: complete'))!.split('\ndata: ')[1]);
  assert.equal(artifact.status, 'completed'); assert.equal(artifact.execution, 'test');
  assert.equal(artifact.metrics.probeExecutions, 2); assert.equal(artifact.metrics.probeReuses, 1);
  assert.equal(artifact.evidence[0].actualCents, 17010);
});

test('disconnecting a hosted response aborts its investigation', async () => {
  let enter!: () => void; let stopped!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const aborted = new Promise<void>(resolve => { stopped = resolve; });
  const driver: RuntimeDriver = async host => {
    host.signal.addEventListener('abort', () => { stopped(); }, { once: true }); enter();
    return new Promise(() => {});
  };
  const response = investigationStream(request(payload), driver, payload, 'test');
  await entered; await response.body!.cancel();
  await Promise.race([aborted, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('No cancellation')), 1000); timer.unref(); })]);
});
