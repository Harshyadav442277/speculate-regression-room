import type { Policy, QuoteInput } from '../contracts.js';
import type { RunArtifact } from './investigation.js';

export interface EvaluationCell { caseId: string; fixture: string; input: QuoteInput; policy: Policy; }

// Development scenarios, deliberately published. They are not a blind benchmark.
const scenarios = [
  { caseId: 'discount-varied-input', fixture: 'discount-twice', input: { unitPriceCents: 7351, quantity: 3, discountBps: 1750, taxBps: 825 } },
  { caseId: 'tax-varied-input', fixture: 'tax-twice', input: { unitPriceCents: 12499, quantity: 2, discountBps: 1250, taxBps: 725 } },
  { caseId: 'correct-control', fixture: 'correct', input: { unitPriceCents: 2999, quantity: 4, discountBps: 1500, taxBps: 500 } },
];
const policies: Policy[] = ['cooperative', 'single', 'independent'];

export function evaluationPlan(): EvaluationCell[] {
  return scenarios.flatMap((scenario, index) => policies.map((_, offset) => ({ ...scenario, input: { ...scenario.input }, policy: policies[(offset + index) % policies.length]! })));
}

export function evaluateArtifact(artifact: RunArtifact) {
  const timeline = artifact.events;
  const intervals = ['pricing', 'tax'].map(agentId => {
    const start = timeline.find(e => e.type === 'agent.started' && e.agentId === agentId)?.elapsedMs;
    const end = timeline.find(e => ['agent.completed', 'agent.failed'].includes(e.type) && e.agentId === agentId)?.elapsedMs;
    return { start, end };
  });
  const overlapMs = intervals.every(i => i.start !== undefined && i.end !== undefined)
    ? Math.max(0, Math.min(...intervals.map(i => i.end!)) - Math.max(...intervals.map(i => i.start!))) : null;
  const changed = timeline.filter(e => e.type === 'action.reconsidered' && e.data.changed === true);
  const failedEvidence = artifact.evidence.filter(e => !e.passed);
  return {
    runId: artifact.runId, execution: artifact.execution, status: artifact.status, policy: artifact.configuration.policy,
    contractFailureReproduced: failedEvidence.length > 0,
    validConclusions: Object.keys(artifact.conclusions).length,
    // Conclusions require human/source review; the presence of a conclusion is not diagnostic correctness.
    diagnosisCorrectness: 'not independently scored' as const,
    changedActions: changed.length, agentLifetimeOverlapMs: overlapMs,
    ...artifact.metrics, usage: artifact.runtime?.usage ?? null,
  };
}
