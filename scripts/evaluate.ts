import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { evaluationPlan, evaluateArtifact } from '../src/core/evaluation.js';
import { investigate } from '../src/core/investigation.js';
import { checkRuntimeConfig, runInvestigation } from '../src/runtime/index.js';

const plan = evaluationPlan();
if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({ execution: 'plan only; no model requests', runs: plan.length, maxRequestsPerRun: 12,
    note: 'All scenarios are public development cases. Policy order rotates; all failures are retained. Execute with --execute after the provider smoke passes.', plan }, null, 2));
} else {
  const config = checkRuntimeConfig();
  if (!config.ready) { console.log(JSON.stringify(config)); process.exitCode = 2; }
  else {
    const directory = resolve('artifacts/private', `evaluation-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'plan.json'), JSON.stringify(plan, null, 2));
    const rows = [];
    for (const [index, cell] of plan.entries()) {
      const artifact = await investigate(runInvestigation, { fixture: cell.fixture, failingInput: cell.input, policy: cell.policy, execution: 'live' });
      await writeFile(resolve(directory, `${String(index + 1).padStart(2, '0')}-${cell.caseId}-${cell.policy}.json`), JSON.stringify(artifact, null, 2));
      const row = { caseId: cell.caseId, ...evaluateArtifact(artifact) };
      rows.push(row);
      await writeFile(resolve(directory, 'summary.json'), JSON.stringify(rows, null, 2));
      console.log(JSON.stringify(row));
      // Systemic provider/config failures do not justify spending on the rest of the matrix.
      if (artifact.status !== 'completed' && artifact.metrics.modelRequests <= 2) {
        console.log('Evaluation stopped after early runtime failure; attempted run and full plan retained.');
        process.exitCode = 1; break;
      }
    }
    console.log(JSON.stringify({ directory, attemptsRetained: rows.length, plannedRuns: plan.length }));
  }
}
