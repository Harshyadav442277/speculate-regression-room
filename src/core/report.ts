import type { RunArtifact } from './investigation.js';

export function regressionScript(artifact: RunArtifact): string {
  if (!artifact.evidence.length) throw new Error('A regression export requires executed evidence.');
  const cases = artifact.evidence.map(e => ({ evidenceId: e.id, input: e.input, expectedCents: e.expectedCents, observedCents: e.actualCents }));
  return `// SPECULATE regression check. Captured evidence; this file contains no model calls.
// Run: node regression.mjs http://127.0.0.1:4318/quote
// Expected values come from the written quote contract, not an agent verdict.
const cases = ${JSON.stringify(cases, null, 2)};
const endpoint = new URL(process.argv[2] ?? 'http://127.0.0.1:4318/quote');
if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Provide an HTTP quote endpoint without credentials.');
let failures = 0;
for (const test of cases) {
  try {
    const response = await fetch(endpoint, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(test.input), signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const result = await response.json();
    if (!Number.isSafeInteger(result?.totalCents)) throw new Error('Invalid quote response');
    const passed = result.totalCents === test.expectedCents;
    if (!passed) failures++;
    console.log(JSON.stringify({ evidenceId: test.evidenceId, passed, expectedCents: test.expectedCents, actualCents: result.totalCents }));
  } catch (error) {
    failures++;
    console.log(JSON.stringify({ evidenceId: test.evidenceId, passed: false, error: error.message }));
  }
}
console.log(JSON.stringify({ cases: cases.length, failures }));
process.exitCode = failures ? 1 : 0;
`;
}

export function markdownReport(artifact: RunArtifact): string {
  const revisions = artifact.events.filter(e => e.type === 'action.reconsidered');
  const clean = (text: string) => text.replace(/[\r\n|]/g, ' ');
  const summaries = Object.entries(artifact.conclusions).map(([agent, conclusion]) =>
    `### ${agent}\n\n${conclusion.summary}\n\nEvidence: ${conclusion.evidenceIds.join(', ')}\n\nUnresolved: ${conclusion.unresolved.length ? conclusion.unresolved.join('; ') : 'None stated by the agent; this is not proof that none exist.'}`).join('\n\n');
  return `# SPECULATE investigation\n\nRun: ${artifact.runId}\n\nMode: ${artifact.execution}; policy: ${artifact.configuration.policy}; status: ${artifact.status}.\n\nThis is a local executable checkout fixture. The fault configuration is evaluator metadata; it is not supplied to the investigators.\n\n## Measured result\n\n${artifact.metrics.probeExecutions} executed probes; ${artifact.metrics.probeReuses} reused results; ${artifact.metrics.modelRequests} model requests; ${artifact.metrics.elapsedMs} ms elapsed. Token usage: ${artifact.runtime?.usage ? JSON.stringify(artifact.runtime.usage) : 'unavailable'}.\n\n${revisions.length} recorded action reconsiderations; ${revisions.filter(e => e.data.changed === true).length} marked changed. These counts are not a claim about saved tests or speedup.\n\n## Executed evidence\n\n| Evidence | Investigator | Expected cents | Actual cents | Contract passes | Purpose |\n|---|---|---|---|---|---|\n${artifact.evidence.map(e => `| ${e.id} | ${e.agentId} | ${e.expectedCents} | ${e.actualCents} | ${e.passed} | ${clean(e.purpose)} |`).join('\n')}\n\n## Model conclusions\n\n${summaries || 'No complete, evidence-linked conclusion was recorded.'}\n\n## Limits\n\nThe conclusions are model judgments; observed HTTP results are the evidence. Passing a captured regression set does not establish correctness on untested inputs. The corrected fixture is prebuilt, not an AI-generated repair.\n\n${artifact.error ? `Run failure: ${artifact.error.code}: ${artifact.error.message}\n` : ''}`;
}
