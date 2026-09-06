// Browser/API test harness only. No Mozaik participants and no model calls.
// The page and every exported artifact are explicitly marked as controlled tests.
import { createAppServer } from '../src/server.js';
import type { RuntimeDriver } from '../src/contracts.js';

const controlledDriver: RuntimeDriver = async (host, options) => {
  if (options.policy === 'single') {
    host.record('agent.started', 'generalist', { execution: 'test' });
    await host.probe('generalist', { ...host.failingInput, taxBps: 0 }, 'Controlled UI test: inspect quote without tax.');
    host.conclude('generalist', { summary: 'Controlled UI test only. Inspect the observed quote results.', evidenceIds: host.getEvidence().map(e => e.id), unresolved: ['No AI diagnosis was performed.'] });
  } else {
    host.record('agent.started', 'pricing', { execution: 'test' });
    host.record('agent.started', 'tax', { execution: 'test' });
    const before = { tool: 'probe_quote', input: { ...host.failingInput, taxBps: 750 } };
    host.record('proposal.recorded', 'tax', { proposal: before, evidenceRevision: host.getEvidence().length });
    const peer = await host.probe('pricing', { ...host.failingInput, taxBps: 0 }, 'Controlled UI test: remove tax and observe the actual quote.');
    const after = { tool: 'probe_quote', input: { ...host.failingInput, discountBps: 0 } };
    if (options.policy === 'cooperative') host.record('action.reconsidered', 'tax', { before, after, changed: true, peerEvidenceIds: [peer.id], controlled: true });
    await host.probe('tax', after.input, 'Controlled UI test: remove discount and observe the actual quote.');
    for (const agent of ['pricing','tax'] as const) host.conclude(agent, { summary: 'Controlled UI test. These HTTP observations were executed, but this explanation and action sequence are scripted.', evidenceIds: host.getEvidence().map(e => e.id), unresolved: ['No Mozaik or model behavior is established by this run.'] });
  }
  return { modelRequests: 0, usage: null, model: 'controlled-ui-test', provider: 'none' };
};
const server = createAppServer({ driver: controlledDriver, execution: 'test', configurationCheck: () => ({ ready: true, provider: 'none', model: 'controlled-ui-test' }) });
server.listen(4319, '127.0.0.1', () => console.log('Controlled UI test server: http://127.0.0.1:4319 — no model calls'));
