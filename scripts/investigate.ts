import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { investigate } from '../src/core/investigation.js';
import { markdownReport, regressionScript } from '../src/core/report.js';
import { verifyCorrectedFixture } from '../src/core/verification.js';
import { checkRuntimeConfig, runInvestigation } from '../src/runtime/index.js';
import type { Policy } from '../src/contracts.js';

const config = checkRuntimeConfig();
console.log(JSON.stringify(config));
if (!config.ready) {
  process.exitCode = 2;
} else {
  const policy = (process.argv[2] ?? 'cooperative') as Policy;
  const fixture = process.argv[3] ?? 'discount-twice';
  const artifact = await investigate(runInvestigation, { policy, fixture, execution: 'live',
    onEvent: event => {
      if (['agent.started', 'probe.completed', 'action.reconsidered', 'agent.completed', 'agent.failed', 'run.failed'].includes(event.type)) {
        console.log(JSON.stringify({ sequence: event.sequence, elapsedMs: event.elapsedMs, type: event.type, agentId: event.agentId }));
      }
    } });
  const directory = resolve('artifacts/private', artifact.runId);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'run.json'), JSON.stringify(artifact, null, 2));
  await writeFile(resolve(directory, 'report.md'), markdownReport(artifact));
  if (artifact.evidence.length) {
    await writeFile(resolve(directory, 'regression.mjs'), regressionScript(artifact));
    await writeFile(resolve(directory, 'corrected-verification.json'), JSON.stringify(await verifyCorrectedFixture(artifact), null, 2));
  }
  console.log(JSON.stringify({ runId: artifact.runId, status: artifact.status, metrics: artifact.metrics, directory }));
  process.exitCode = artifact.status === 'completed' ? 0 : 1;
}
