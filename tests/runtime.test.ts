import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { investigate } from '../src/core/investigation.js';
import { createRuntimeDriver } from '../src/runtime/index.js';
import {
  DeterministicInferenceRunner,
  type DeterministicScript,
} from '../src/runtime/testing/deterministic-runner.js';
import type { AgentId, RunEvent } from '../src/contracts.js';

/**
 * Runtime tests against the INSTALLED @mozaik-ai/core@4.0.5.
 *
 * The inference runner is a clearly labelled deterministic test double. These
 * tests prove loop mechanics -- real overlap, real interception at a real
 * pending tool call, terminal transition shape, budgets, error propagation.
 * They prove NOTHING about model quality, and no result here is a benchmark,
 * a policy comparison, or a live-AI claim.
 */

const FAILING = { unitPriceCents: 10_000, quantity: 2, discountBps: 1000, taxBps: 500 };
const PROBE_A = { unitPriceCents: 10_000, quantity: 2, discountBps: 0, taxBps: 0, purpose: 'isolate discount' };
const PROBE_B = { unitPriceCents: 10_000, quantity: 2, discountBps: 1000, taxBps: 0, purpose: 'discount only' };
const PROBE_C = { unitPriceCents: 10_000, quantity: 1, discountBps: 0, taxBps: 500, purpose: 'tax only' };

/**
 * The valid close: `finish_investigation` citing the evidence ids the runner
 * actually received in its context. An earlier helper here hand-wrote a call
 * with `evidenceIds: []`, which the host correctly refuses as an uncited
 * conclusion -- so those runs never completed and the tests only ever proved
 * that intermediate events fired. Use the deterministic `finish` step instead.
 */
const FINISH = { kind: 'finish' as const };

async function run(script: DeterministicScript, policy: 'cooperative' | 'independent' | 'single', opts: {
  maxModelRequests?: number;
  maxReconsiderationsPerAction?: number;
} = {}) {
  const runner = new DeterministicInferenceRunner(script);
  const driver = createRuntimeDriver({
    runner,
    maxReconsiderationsPerAction: opts.maxReconsiderationsPerAction,
  });
  const artifact = await investigate(driver, {
    execution: 'test',
    policy,
    failingInput: FAILING,
    maxModelRequests: opts.maxModelRequests ?? 12,
    maxRunMs: 20_000,
    modelTimeoutMs: 5_000,
  });
  return { artifact, runner };
}

const typesOf = (events: readonly RunEvent[]) => events.map((e) => e.type);

type Artifact = Awaited<ReturnType<typeof investigate>>;

/**
 * The whole path completed: the run reached `completed`, every named
 * participant concluded, and each cited id is real evidence in the artifact.
 * Intermediate events are not completion, so tests that care about a full run
 * assert this rather than the presence of a mid-run event.
 */
function assertCompletedWithCitedConclusions(artifact: Artifact, agents: readonly AgentId[]) {
  assert.equal(
    artifact.status,
    'completed',
    `the run must complete; got ${artifact.status} ${JSON.stringify(artifact.error)}`,
  );
  assert.deepEqual(
    Object.keys(artifact.conclusions).sort(),
    [...agents].sort(),
    'exactly the participating agents must conclude',
  );
  for (const agent of agents) {
    const conclusion = artifact.conclusions[agent];
    assert.ok(conclusion, `${agent} must reach a conclusion`);
    assert.ok(conclusion.summary.length > 0, `${agent}'s conclusion must carry a summary`);
    assert.ok(conclusion.evidenceIds.length > 0, `${agent} must cite evidence it actually holds`);
    for (const id of conclusion.evidenceIds) {
      assert.ok(
        artifact.evidence.some((e) => e.id === id),
        `${agent} cited ${id}, which is not evidence in this run`,
      );
    }
  }
}

test('two Mozaik participants run overlapping loops against the installed package', async () => {
  // Both agents probe with a delay, so each is mid-flight while the other works.
  const script: DeterministicScript = {
    loop: {
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 40 },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
      tax: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_C, delayMs: 40 },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
    },
  };
  const { artifact } = await run(script, 'independent');

  const started = artifact.events.filter((e) => e.type === 'agent.started');
  assert.equal(started.length, 2, 'both participants must join and start');

  // Real overlap: an event from one agent falls between another agent's
  // probe.started and its probe.completed.
  const pricingStart = artifact.events.find((e) => e.type === 'probe.started' && e.agentId === 'pricing');
  const pricingDone = artifact.events.find((e) => e.type === 'probe.completed' && e.agentId === 'pricing');
  assert.ok(pricingStart && pricingDone, 'pricing must actually probe');
  const interleaved = artifact.events.filter(
    (e) => e.agentId === 'tax' && e.sequence > pricingStart.sequence && e.sequence < pricingDone.sequence,
  );
  assert.ok(interleaved.length > 0, 'tax activity must interleave with an in-flight pricing probe');
});

test('cooperative policy reconsiders a real pending tool call on peer evidence', async () => {
  // tax probes fast; pricing is slow, so pricing's SECOND call is pending when
  // tax's evidence lands. Reconsideration then redirects that pending call.
  const script: DeterministicScript = {
    loop: {
      tax: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_C },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 120 },
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 10 },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
    },
    reconsider: {
      // The "model" chooses a different, non-redundant action.
      pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_B }],
    },
  };
  const { artifact } = await run(script, 'cooperative');

  // The intervention happens inside a run that actually finishes -- both agents
  // conclude on cited evidence. Reconsideration must not cost completion.
  assertCompletedWithCitedConclusions(artifact, ['pricing', 'tax']);

  const reconsidered = artifact.events.filter((e) => e.type === 'action.reconsidered');
  assert.ok(reconsidered.length > 0, 'a pending action must be reconsidered');

  const changed = reconsidered.find((e) => e.data.changed === true);
  assert.ok(changed, 'at least one reconsideration must actually change the action');

  // The host validated these ids as real peer evidence from another agent.
  const peerIds = changed.data.peerEvidenceIds as string[];
  assert.ok(Array.isArray(peerIds) && peerIds.length > 0);
  for (const id of peerIds) {
    const ev = artifact.evidence.find((e) => e.id === id);
    assert.ok(ev, 'cited peer evidence must exist');
    assert.notEqual(ev.agentId, changed.agentId, 'peer evidence must come from another agent');
    // Seed evidence must never be citable as a live peer intervention.
    assert.notEqual(ev.agentId, 'generalist', 'seed evidence must not be cited as peer evidence');
  }

  assert.notDeepEqual(changed.data.before, changed.data.after, 'before and after must differ when changed');

  // The revised action really executed.
  const executed = artifact.evidence.some(
    (e) => e.agentId === 'pricing' && e.input.discountBps === PROBE_B.discountBps && e.input.taxBps === 0,
  );
  assert.ok(executed, 'the reconsidered action must actually run');
});

test('independent policy is the same run with reconsideration off', async () => {
  const script: DeterministicScript = {
    loop: {
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'done' }],
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 120 },
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 10 },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
    },
    reconsider: { pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_B }] },
  };
  const { artifact, runner } = await run(script, 'independent');

  // The control reaches the same completed end state on the same script, so the
  // only difference between the policies is the reconsideration, not the
  // ability to finish.
  assertCompletedWithCitedConclusions(artifact, ['pricing', 'tax']);

  assert.equal(
    artifact.events.filter((e) => e.type === 'action.reconsidered').length,
    0,
    'the ablation must produce no reconsiderations',
  );
  assert.equal(runner.requests.filter((r) => r.reconsider).length, 0, 'the ablation makes no reconsideration calls');
  // Same participants, same tools -- only the policy differs.
  assert.equal(artifact.events.filter((e) => e.type === 'agent.started').length, 2);
});

test('model request budget is enforced and no conclusion is invented', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: Array.from({ length: 10 }, () => ({ kind: 'call' as const, tool: 'probe_quote', args: PROBE_A })),
      tax: Array.from({ length: 10 }, () => ({ kind: 'call' as const, tool: 'probe_quote', args: PROBE_C })),
    },
  };
  const { artifact } = await run(script, 'independent', { maxModelRequests: 3 });

  assert.ok(artifact.metrics.modelRequests <= 3, `ledger must respect the cap, got ${artifact.metrics.modelRequests}`);
  assert.notEqual(artifact.status, 'completed', 'a capped run must not report completion');
  assert.equal(Object.keys(artifact.conclusions).length, 0, 'no conclusion may be invented under a budget stop');
  assert.ok(artifact.evidence.length >= 1, 'evidence gathered before the cap must be preserved');
});

test('runtime request count matches the host ledger exactly', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_A }, FINISH, { kind: 'message', text: 'd' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact } = await run(script, 'independent');
  // investigate() throws USAGE_MISMATCH on divergence, so reaching here proves
  // agreement; assert it explicitly so the intent survives refactors.
  assert.ok(artifact.runtime, 'runtime result must be present');
  assert.equal(artifact.runtime.modelRequests, artifact.metrics.modelRequests);
});

test('a provider failure propagates without inventing success', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'error', message: 'simulated provider outage' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact } = await run(script, 'independent');

  assert.notEqual(artifact.status, 'completed', 'a provider failure must not report completion');
  assert.ok(artifact.error, 'the artifact must carry an error');
  assert.ok(typesOf(artifact.events).includes('run.failed'));
});

test('usage is null when the provider reports none, never a fabricated zero', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_A }, FINISH, { kind: 'message', text: 'd' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
    // usage deliberately omitted
  };
  const { artifact } = await run(script, 'independent');
  assert.equal(artifact.runtime?.usage, null, 'absent usage must stay null');
});

test('only newly arrived peer evidence triggers reconsideration (freshness)', async () => {
  // tax probes exactly once. pricing then takes several actions. Reconsideration
  // must fire only while that single result is genuinely new to pricing -- not
  // on every later action, and never twice for the same already-seen evidence.
  const script: DeterministicScript = {
    loop: {
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'done' }],
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 120 },
        { kind: 'call', tool: 'probe_quote', args: PROBE_B, delayMs: 5 },
        { kind: 'call', tool: 'read_evidence', args: {}, delayMs: 5 },
        FINISH,
        { kind: 'message', text: 'done' },
      ],
    },
    reconsider: {
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_B },
        { kind: 'call', tool: 'probe_quote', args: PROBE_B },
        { kind: 'call', tool: 'probe_quote', args: PROBE_B },
      ],
    },
  };
  const { artifact } = await run(script, 'cooperative');

  const reconsidered = artifact.events.filter((e) => e.type === 'action.reconsidered');
  const taxEvidence = artifact.evidence.filter((e) => e.agentId === 'tax');
  assert.equal(taxEvidence.length, 1, 'exactly one peer result should exist');

  assert.ok(
    reconsidered.length <= taxEvidence.length,
    `reconsiderations (${reconsidered.length}) must not exceed distinct peer results (${taxEvidence.length})`,
  );

  for (const event of reconsidered) {
    const ids = event.data.peerEvidenceIds as string[];
    for (const id of ids) {
      const ev = artifact.evidence.find((e) => e.id === id);
      assert.ok(ev, 'cited evidence must exist');
      assert.notEqual(ev.agentId, 'generalist', 'seed evidence is not peer cooperation');
      assert.notEqual(ev.agentId, event.agentId, 'an agent cannot cite itself');
    }
  }
});

// ---------------------------------------------------------------------------
// Corrections required by RUNTIME_REVIEW.md (Codex integration review, 23:48).
// Each test proves one of the reported P0/P1 defects is actually fixed.
// ---------------------------------------------------------------------------

test('P0: no further model request happens after the driver resolves', async () => {
  // The loop's function_call -> inference edge would otherwise start another
  // real request after finish_investigation, uncounted and after close.
  const script: DeterministicScript = {
    loop: {
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A },
        FINISH,
        { kind: 'call', tool: 'probe_quote', args: PROBE_B },
        { kind: 'call', tool: 'probe_quote', args: PROBE_B },
      ],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact, runner } = await run(script, 'independent');

  const atResolve = runner.requests.length;
  await new Promise((r) => setTimeout(r, 250));
  assert.equal(runner.requests.length, atResolve, 'no provider call may start after the run resolves');
  assert.equal(artifact.runtime?.modelRequests, artifact.metrics.modelRequests, 'counters stay reconciled');
});

test('P0: a hanging provider hits the deadline instead of stalling the run', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 30_000 }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
  };
  const started = Date.now();
  const runner = new DeterministicInferenceRunner(script);
  const artifact = await investigate(createRuntimeDriver({ runner }), {
    execution: 'test',
    policy: 'independent',
    failingInput: FAILING,
    maxRunMs: 20_000,
    modelTimeoutMs: 1_000, // deadline must apply to ORDINARY calls, not just reconsideration
  });
  assert.ok(Date.now() - started < 15_000, 'the deadline must fire well before the run budget');
  assert.notEqual(artifact.status, 'completed');
  assert.ok(artifact.events.some((e) => e.type === 'agent.failed'));
});

test('P1: evidence marked seen is evidence actually delivered to the model', async () => {
  const script: DeterministicScript = {
    loop: {
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 120 },
        FINISH,
        { kind: 'message', text: 'd' },
      ],
    },
  };
  const { artifact, runner } = await run(script, 'independent');

  const taxEvidence = artifact.evidence.find((e) => e.agentId === 'tax');
  assert.ok(taxEvidence, 'tax must produce evidence');

  // Some pricing inference must have actually contained the peer observation.
  const delivered = runner.contexts.some((c) => c.agent === 'pricing' && c.text.includes(taxEvidence.id));
  assert.ok(delivered, 'peer evidence must reach the model context, not just be marked seen');

  // The seed reproduction reaches the model without spending an extra call to read it.
  const seed = artifact.evidence.find((e) => e.agentId === 'generalist');
  assert.ok(seed, 'seed evidence should exist');
  assert.ok(
    runner.contexts.some((c) => c.text.includes(seed.id)),
    'the initial reproduction must be delivered too',
  );
});

test('P1: raw provider error text never reaches the artifact', async () => {
  const secret = 'sk-live-DO-NOT-LEAK-9f3a2b';
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'error', message: `401 Unauthorized calling https://api.example.com?key=${secret}` }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact } = await run(script, 'independent');

  const serialized = JSON.stringify(artifact);
  assert.ok(!serialized.includes(secret), 'credential-shaped text must not appear in the artifact');
  assert.ok(!serialized.includes('api.example.com'), 'provider URLs must not appear in the artifact');
  assert.ok(
    artifact.events.some((e) => e.type === 'agent.failed' && e.data.code === 'PROVIDER_FAILED'),
    'a sanitized code must be recorded instead',
  );
});

test('P1: usage is aggregated across all calls, and null if any call lacks it', async () => {
  const withUsage: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'call', tool: 'probe_quote', args: PROBE_A }, FINISH, { kind: 'message', text: 'd' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
    },
    usage: { inputTokens: 10, outputTokens: 5 },
  };
  const { artifact } = await run(withUsage, 'independent');
  assert.ok(artifact.runtime?.usage, 'usage must aggregate when every call reports it');
  assert.ok(
    artifact.runtime.usage.inputTokens >= 10 * artifact.metrics.modelRequests - 10,
    'aggregate must cover more than a single call',
  );
});

test('P1: a reordered-but-identical action is not counted as changed', async () => {
  // Same tool, same values, different JSON key order. That is not new work.
  const reordered = {
    purpose: PROBE_A.purpose,
    taxBps: PROBE_A.taxBps,
    discountBps: PROBE_A.discountBps,
    quantity: PROBE_A.quantity,
    unitPriceCents: PROBE_A.unitPriceCents,
  };
  const script: DeterministicScript = {
    loop: {
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, FINISH, { kind: 'message', text: 'd' }],
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 120 },
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 10 },
        FINISH,
        { kind: 'message', text: 'd' },
      ],
    },
    reconsider: { pricing: [{ kind: 'call', tool: 'probe_quote', args: reordered }] },
  };
  const { artifact } = await run(script, 'cooperative');

  const events = artifact.events.filter((e) => e.type === 'action.reconsidered');
  assert.ok(events.length > 0, 'a reconsideration should have occurred');
  for (const e of events) {
    assert.equal(e.data.changed, false, 'key reordering alone must not count as a changed action');
  }
});

// The seven failure-boundary / control-plumbing tests that used to be
// appended here now live once in tests/runtime-hardening.test.ts, which asserts
// a strict superset of what this copy did. Duplicating them proved nothing new.
