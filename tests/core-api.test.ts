import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createAppServer } from '../src/server.js';
import { DEFAULT_INPUT } from '../src/core/quote-contract.js';
import type { RuntimeDriver } from '../src/contracts.js';

const testDriver: RuntimeDriver = async host => {
  for (const agent of ['pricing', 'tax'] as const) {
    host.record('agent.started', agent, {});
    await host.probe(agent, { ...DEFAULT_INPUT, taxBps: 0 }, 'HTTP integration test');
    host.conclude(agent, { summary: 'Controlled test result', evidenceIds: host.getEvidence().map(e => e.id), unresolved: ['No model was called.'] });
  }
  return { provider: 'none', model: 'test-driver', modelRequests: 0, usage: null };
};
const configured = () => ({ ready: true, provider: 'none', model: 'test-driver' });
async function serve(driver = testDriver, ready = configured) {
  const server = createAppServer({ driver, configurationCheck: ready, execution: 'test' });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  return { url: `http://127.0.0.1:${address.port}`, async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}
const payload = { fixture: 'discount-twice', policy: 'cooperative', failingInput: DEFAULT_INPUT };
const post = (url: string, value: unknown, origin?: string) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Speculate': '1', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(value) });

test('HTTP judge path streams evidence, exports a failing regression and verifies corrected fixture', async () => {
  const app = await serve();
  try {
    assert.equal((await fetch(`${app.url}/`)).status, 200);
    const exporter = await fetch(`${app.url}/export.js`);
    assert.equal(exporter.status, 200); assert.match(await exporter.text(), /export function regressionScript/);
    const start = await post(`${app.url}/api/run`, payload, app.url); assert.equal(start.status, 202);
    const { ticket } = await start.json() as { ticket: string };
    const stream = await fetch(`${app.url}/api/run/${ticket}/events`);
    const events = await stream.text();
    assert.match(events, /event: trace/); assert.match(events, /probe.completed/); assert.match(events, /event: complete/);
    const result = await (await fetch(`${app.url}/api/run/${ticket}`)).json() as any;
    assert.equal(result.artifact.status, 'completed'); assert.equal(result.artifact.execution, 'test');
    assert.equal(result.artifact.metrics.probeExecutions, 2); assert.equal(result.artifact.metrics.probeReuses, 1);
    const report = await fetch(`${app.url}/api/run/${ticket}/report`); assert.match(await report.text(), /Model conclusions/);
    const script = await fetch(`${app.url}/api/run/${ticket}/regression`); assert.match(await script.text(), /process.exitCode = failures/);
    const verification = await post(`${app.url}/api/run/${ticket}/verify`, {}, app.url);
    assert.equal((await verification.json() as any).failures, 0);
  } finally { await app.close(); }
});

test('API rejects cross-origin actions, invalid inputs, unknown routes and missing configuration', async () => {
  const app = await serve();
  const unconfigured = await serve(testDriver, () => ({ ready: false, provider: 'none', model: 'test-driver' }));
  try {
    assert.equal((await post(`${app.url}/api/run`, payload, 'https://unrelated.example')).status, 403);
    assert.equal((await fetch(`${app.url}/api/run`, { method: 'POST', body: JSON.stringify(payload) })).status, 403);
    assert.equal((await post(`${app.url}/api/run`, { ...payload, failingInput: { ...DEFAULT_INPUT, quantity: -1 } })).status, 400);
    assert.equal((await post(`${app.url}/api/run`, { ...payload, endpoint: 'https://example.com' })).status, 400);
    assert.equal((await post(`${unconfigured.url}/api/run`, payload)).status, 503);
    assert.equal((await fetch(`${app.url}/.env`)).status, 404);
    // fetch normalizes Host; raw HTTP is needed to exercise the server's host check.
    const invalidHostStatus = await new Promise<number | undefined>((resolve, reject) => {
      const req = httpRequest(`${app.url}/api/config`, { headers: { Host: 'evil.example:4317' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      req.on('error', reject); req.end();
    });
    assert.equal(invalidHostStatus, 403);
  } finally { await app.close(); await unconfigured.close(); }
});

test('double-start is rejected and cancellation preserves partial evidence', async () => {
  const app = await serve(async () => new Promise(() => {}));
  try {
    const first = await post(`${app.url}/api/run`, payload); const { ticket } = await first.json() as { ticket: string };
    assert.equal((await post(`${app.url}/api/run`, payload)).status, 409);
    assert.equal((await post(`${app.url}/api/run/${ticket}/cancel`, {})).status, 200);
    const events = await (await fetch(`${app.url}/api/run/${ticket}/events`)).text();
    assert.match(events, /"status":"cancelled"/);
  } finally { await app.close(); }
});
