// Recorded engineering demonstration: real Mozaik loops and HTTP probes,
// explicitly scripted inference. Never presented as live AI.
import { mkdir, writeFile } from 'node:fs/promises';
import { investigate } from '../src/core/investigation.js';
import { createRuntimeDriver } from '../src/runtime/index.js';
import { DeterministicInferenceRunner } from '../src/runtime/testing/deterministic-runner.js';
import { regressionScript, markdownReport } from '../src/core/report.js';
import { verifyCorrectedFixture } from '../src/core/verification.js';
const base = { unitPriceCents: 10000, quantity: 2, discountBps: 1000, taxBps: 500 };
const baseline = { ...base, discountBps: 0, taxBps: 0, purpose: 'Controlled probe: baseline without discount or tax.' };
const runner = new DeterministicInferenceRunner({ loop: {
  tax: [{kind:'call', tool:'probe_quote', args:{...base, discountBps:0, purpose:'Controlled probe: tax without discount.'}}, {kind:'finish'}],
  pricing: [{kind:'call',tool:'probe_quote',args:baseline,delayMs:150}, {kind:'call',tool:'probe_quote',args:baseline}, {kind:'finish'}],
}, reconsider: { pricing: [{kind:'call',tool:'probe_quote',args:{...base,taxBps:0,purpose:'Controlled revised probe: discount without tax.'}}] } });
const run = await investigate(createRuntimeDriver({runner}), {execution:'test',policy:'cooperative',fixture:'discount-twice'});
if(run.status !== 'completed' || !run.events.some(e=>e.type==='action.reconsidered' && e.data.changed)) throw new Error('Controlled demonstration did not complete.');
await mkdir('web/recordings',{recursive:true});
await mkdir('artifacts/private/demo',{recursive:true});
await writeFile('web/recordings/controlled.json',JSON.stringify(run,null,2));
await writeFile('artifacts/private/demo/run.json',JSON.stringify(run,null,2));
await writeFile('artifacts/private/demo/regression.mjs',regressionScript(run));
await writeFile('artifacts/private/demo/report.md',markdownReport(run));
await writeFile('artifacts/private/demo/corrected-verification.json',JSON.stringify(await verifyCorrectedFixture(run),null,2));
console.log(JSON.stringify({execution:run.execution,status:run.status,probes:run.metrics.probeExecutions,changedActions:run.events.filter(e=>e.type==='action.reconsidered'&&e.data.changed).length}));
