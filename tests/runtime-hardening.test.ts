import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { investigate } from '../src/core/investigation.js';
import { createRuntimeDriver } from '../src/runtime/index.js';
import {
  DeterministicInferenceRunner,
  type DeterministicScript,
} from '../src/runtime/testing/deterministic-runner.js';
import type { RunEvent } from '../src/contracts.js';

/**
 * Failure-boundary and control-plumbing tests, all through the REAL installed
 * @mozaik-ai/core loop with the clearly labelled deterministic runner.
 *
 * Nothing here is a model result, a benchmark or a policy comparison. Every run
 * is `execution: 'test'`. No provider is configured and none is called.
 */

const FAILING = { unitPriceCents: 10_000, quantity: 2, discountBps: 1000, taxBps: 500 };
const PROBE_A = { unitPriceCents: 10_000, quantity: 2, discountBps: 0, taxBps: 0, purpose: 'isolate discount' };
const PROBE_C = { unitPriceCents: 10_000, quantity: 1, discountBps: 0, taxBps: 500, purpose: 'tax only' };
const REPRO = { ...FAILING, purpose: 'reproduce the reported input' };

type Policy = 'cooperative' | 'independent' | 'single';

interface RunOpts {
  maxModelRequests?: number;
  runtimeMaxModelRequests?: number;
  signal?: AbortSignal;
  onEvent?: (event: RunEvent) => void;
}

async function run(script: DeterministicScript, policy: Policy, opts: RunOpts = {}) {
  const runner = new DeterministicInferenceRunner(script);
  const driver = createRuntimeDriver({ runner, runtimeMaxModelRequests: opts.runtimeMaxModelRequests });
  const artifact = await investigate(driver, {
    execution: 'test',
    policy,
    failingInput: FAILING,
    maxModelRequests: opts.maxModelRequests ?? 12,
    maxRunMs: 20_000,
    modelTimeoutMs: 5_000,
    signal: opts.signal,
    onEvent: opts.onEvent,
  });
  return { artifact, runner };
}

/**
 * Observes process-level unhandled rejections for the duration of one run.
 *
 * The loops are fire-and-forget, so a throw inside a library state has no
 * caller and would surface here. This is a TEST-ONLY observer that re-asserts;
 * it is not a global swallow, and nothing in `src/` installs such a handler.
 */
async function withoutUnhandledRejections<T>(body: () => Promise<T>): Promise<T> {
  const seen: unknown[] = [];
  const capture = (reason: unknown) => seen.push(reason);
  process.on('unhandledRejection', capture);
  try {
    const result = await body();
    // Give any orphaned promise a few turns to be reported before we look.
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 60));
    assert.equal(seen.length, 0, `unhandled rejection(s): ${seen.map(String).join(' | ')}`);
    return result;
  } finally {
    process.off('unhandledRejection', capture);
  }
}

/** Requests the runner served, ignoring anything the guard refused before it. */
const served = (r: DeterministicInferenceRunner) => r.requests.length;

async function assertNoLateRequests(runner: DeterministicInferenceRunner, label: string) {
  const atEnd = served(runner);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(served(runner), atEnd, `${label}: no provider call may start after the run ends`);
}

// ---------------------------------------------------------------------------
// 1. Single / generalist control -- plumbing validation only.
// ---------------------------------------------------------------------------

test('single control: one real generalist loop finishes, reuses evidence, never reconsiders', async () => {
  // This proves the control path is WIRED, not that it is better or worse than
  // anything. A policy comparison needs a real provider, which does not exist
  // in this project. The control is not handicapped: same host, same tools,
  // same budget, same evidence delivery -- only the participant list differs.
  const script: DeterministicScript = {
    loop: {
      generalist: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A },
        // Deliberately re-probes the input the host already reproduced as seed
        // evidence, so the reuse path is exercised rather than asserted about.
        { kind: 'call', tool: 'probe_quote', args: REPRO },
        { kind: 'call', tool: 'read_evidence', args: {} },
        { kind: 'finish' },
        { kind: 'message', text: 'done' },
      ],
    },
  };
  const { artifact, runner } = await withoutUnhandledRejections(() => run(script, 'single'));

  assert.equal(artifact.status, 'completed', `the control must finish; error=${JSON.stringify(artifact.error)}`);
  assert.ok(artifact.conclusions.generalist, 'the generalist must finish with a cited conclusion');
  assert.ok(artifact.conclusions.generalist.evidenceIds.length > 0, 'the conclusion must cite real evidence');

  // Exactly one participant, it is the generalist, and the library agrees.
  const started = artifact.events.filter((e) => e.type === 'agent.started');
  assert.equal(started.length, 1);
  assert.equal(started[0].agentId, 'generalist', 'the control participant is the generalist');
  const joins = artifact.events.filter((e) => e.type === 'runtime.native' && e.data.native === 'participant.joined');
  assert.equal(joins.length, 1, 'exactly one agent participant joined the real runtime');
  const loopIds = new Set(
    artifact.events
      .filter((e) => e.type === 'runtime.native' && typeof e.data.loopId === 'string')
      .map((e) => e.data.loopId as string),
  );
  assert.equal(loopIds.size, 1, `the control must run exactly one library loop, saw ${loopIds.size}`);

  // Initial evidence: the host's seed reproduction reached the model.
  const seed = artifact.evidence.find((e) => e.purpose.startsWith('Reproduce'));
  assert.ok(seed, 'the host seed reproduction must exist');
  assert.ok(
    runner.contexts.some((c) => c.agent === 'generalist' && c.text.includes(seed.id)),
    'the initial reproduction must be delivered into the model context',
  );

  // Subsequent evidence: its own probe, delivered on a later inference.
  const own = artifact.evidence.find((e) => e.agentId === 'generalist' && e.id !== seed.id);
  assert.ok(own, 'the control must gather its own evidence too');
  assert.ok(
    runner.contexts.some((c) => c.text.includes(own.id)),
    'evidence gathered during the run must reach a later inference',
  );

  // Reuse: re-probing an already-observed input must not re-execute it.
  assert.ok(artifact.metrics.probeReuses >= 1, 'an already-observed input must be reused, not re-run');
  assert.ok(
    artifact.events.some((e) => e.type === 'probe.reused'),
    'the reuse must be recorded',
  );

  // No peer reconsideration: there is no peer.
  assert.equal(artifact.events.filter((e) => e.type === 'action.reconsidered').length, 0);
  assert.equal(runner.requests.filter((r) => r.reconsider).length, 0, 'no reconsideration call may be made');
  assert.equal(artifact.runtime?.modelRequests, artifact.metrics.modelRequests);
});

// ---------------------------------------------------------------------------
// 2. Failure boundaries, exercised through the actual loop.
// ---------------------------------------------------------------------------

test('actual loop: an unknown tool name stops the run honestly', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'call', tool: 'delete_production_database', args: { x: 1 } }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, { kind: 'finish' }, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact, runner } = await withoutUnhandledRejections(() => run(script, 'independent'));

  const rejected = artifact.events.find((e) => e.type === 'action.rejected');
  assert.ok(rejected, 'the invalid pending call must be rejected at the boundary');
  assert.equal(rejected.data.reason, 'unknown-tool');
  assert.equal(rejected.data.tool, 'delete_production_database');

  assert.notEqual(artifact.status, 'completed', 'a rejected action must not report completion');
  assert.equal(artifact.conclusions.pricing, undefined, 'no conclusion may be invented for the stopped agent');
  await assertNoLateRequests(runner, 'unknown tool');
});

test('actual loop: malformed tool arguments stop the run honestly', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'rawCall', tool: 'probe_quote', rawArgs: '{"unitPriceCents": 100, ' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, { kind: 'finish' }, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact, runner } = await withoutUnhandledRejections(() => run(script, 'independent'));

  const rejected = artifact.events.find((e) => e.type === 'action.rejected');
  assert.ok(rejected, 'unparsable arguments must be rejected before execution');
  assert.equal(rejected.data.reason, 'unparsable-arguments');
  assert.notEqual(artifact.status, 'completed');
  assert.equal(artifact.conclusions.pricing, undefined, 'no conclusion may be invented for the stopped agent');
  // The malformed argument text itself is not useful in an artifact and the
  // rejection records only the tool name and a reason code.
  assert.ok(!JSON.stringify(artifact).includes('{"unitPriceCents": 100, '));
  await assertNoLateRequests(runner, 'malformed args');
});

test('actual loop: empty inference output fails the run instead of being treated as an answer', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [{ kind: 'empty' }],
      tax: [{ kind: 'call', tool: 'probe_quote', args: PROBE_C }, { kind: 'finish' }, { kind: 'message', text: 'd' }],
    },
  };
  const { artifact, runner } = await withoutUnhandledRejections(() => run(script, 'independent'));

  assert.notEqual(artifact.status, 'completed', 'an empty provider response is not a completion');
  assert.ok(
    artifact.events.some(
      (e) => e.type === 'agent.failed' && e.agentId === 'pricing' && e.data.stage === 'inference:empty',
    ),
    'the empty output must be caught at the guarded runner boundary, with its stage named',
  );
  assert.ok(artifact.error, 'the artifact must carry an error');
  assert.equal(Object.keys(artifact.conclusions).length, 0, 'no conclusion may be invented');
  await assertNoLateRequests(runner, 'empty output');
});

test('actual loop: the HOST rejecting model.requested stops the run, even when our budget disagrees', async () => {
  // The host caps model requests independently. Raise the runtime-side budget
  // above it so the host's `MODEL_BUDGET` throw -- not our own counter -- is
  // what ends the run. This is the case where our bookkeeping is wrong and the
  // ledger is right, and it must fail closed.
  const many = Array.from({ length: 8 }, () => ({ kind: 'call' as const, tool: 'probe_quote', args: PROBE_A }));
  const script: DeterministicScript = { loop: { pricing: [...many], tax: [...many] } };
  const { artifact, runner } = await withoutUnhandledRejections(() =>
    run(script, 'independent', { maxModelRequests: 2, runtimeMaxModelRequests: 12 }),
  );

  assert.equal(artifact.error?.code, 'MODEL_BUDGET', `expected the host cap to end the run: ${JSON.stringify(artifact.error)}`);
  assert.equal(artifact.status, 'incomplete');
  assert.equal(artifact.metrics.modelRequests, 2, `the host cap must hold exactly, saw ${artifact.metrics.modelRequests}`);
  assert.equal(Object.keys(artifact.conclusions).length, 0, 'no conclusion may be invented under a budget stop');

  const failed = artifact.events.find((e) => e.type === 'interception.failed');
  assert.ok(failed, 'the fail-closed path must be recorded');
  assert.equal(failed.data.code, 'MODEL_BUDGET', 'only a sanitized code is recorded');
  assert.equal(failed.data.message, undefined, 'no raw error message may be recorded');

  // The sibling loop must not keep spending after runPolicy rejected.
  await assertNoLateRequests(runner, 'host budget rejection');
});

test('actual loop: cancellation stops every loop, including the healthy sibling', async () => {
  const controller = new AbortController();
  const slow = Array.from({ length: 8 }, () => ({
    kind: 'call' as const,
    tool: 'probe_quote',
    args: PROBE_A,
    delayMs: 30,
  }));
  const script: DeterministicScript = {
    loop: {
      pricing: [...slow],
      tax: Array.from({ length: 8 }, () => ({ kind: 'call' as const, tool: 'probe_quote', args: PROBE_C, delayMs: 30 })),
    },
  };

  const { artifact, runner } = await withoutUnhandledRejections(() =>
    run(script, 'independent', {
      signal: controller.signal,
      // Cancel as soon as the run is genuinely under way.
      onEvent: (event) => {
        if (event.type === 'probe.completed' && event.agentId === 'tax') controller.abort();
      },
    }),
  );

  assert.equal(artifact.status, 'cancelled', `expected cancellation, got ${artifact.status}`);
  assert.equal(artifact.error?.code, 'RUN_CANCELLED');
  assert.equal(Object.keys(artifact.conclusions).length, 0, 'a cancelled run concludes nothing');
  assert.ok(artifact.evidence.length >= 1, 'evidence gathered before cancellation is preserved');

  // Both loops -- the failed one and its healthy sibling -- must be silent now.
  await assertNoLateRequests(runner, 'cancellation');
});

// ---------------------------------------------------------------------------
// 3. Native lifecycle evidence.
// ---------------------------------------------------------------------------

test('native library events prove two real loops ran and overlapped', async () => {
  const script: DeterministicScript = {
    loop: {
      pricing: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_A, delayMs: 60 },
        { kind: 'finish' },
        { kind: 'message', text: 'd' },
      ],
      tax: [
        { kind: 'call', tool: 'probe_quote', args: PROBE_C, delayMs: 60 },
        { kind: 'finish' },
        { kind: 'message', text: 'd' },
      ],
    },
  };
  const { artifact } = await withoutUnhandledRejections(() => run(script, 'independent'));

  const native = artifact.events.filter((e) => e.type === 'runtime.native');
  assert.ok(native.length > 0, 'native lifecycle events must be recorded');

  // Two distinct loop UUIDs, both minted inside the library by AgentLoop.create.
  const loops = new Map<string, { first: number; last: number; agent?: string; participant?: unknown }>();
  for (const e of native) {
    const id = e.data.loopId;
    if (typeof id !== 'string') continue;
    const span = loops.get(id) ?? { first: e.sequence, last: e.sequence, agent: e.agentId, participant: e.data.participantId };
    assert.equal(span.participant, e.data.participantId, 'a loop belongs to exactly one participant');
    span.last = e.sequence;
    loops.set(id, span);
  }
  assert.equal(loops.size, 2, `two real library loops must run, saw ${loops.size}`);

  const [a, b] = [...loops.values()];
  assert.ok(a.first < b.last && b.first < a.last, 'the two loop spans must overlap in the ledger');
  assert.notEqual(a.agent, b.agent, 'each loop must belong to a different agent');

  // The library admitted both participants, and our interceptor really ran
  // inside its loop rather than beside it.
  assert.equal(native.filter((e) => e.data.native === 'participant.joined').length, 2);
  assert.ok(native.some((e) => e.data.native === 'interception.finished'));
  assert.ok(native.some((e) => e.data.native === 'model.answer'));

  // Bounded and payload-free: no provider response, context or tool output.
  for (const e of native) {
    assert.deepEqual(
      Object.keys(e.data).sort(),
      ['loopId', 'native', 'participantId'].filter((k) => k in e.data).sort(),
      'native records carry only the event name and identifiers',
    );
  }
  assert.equal(
    native.filter((e) => e.data.native === 'inference.stream').length,
    0,
    'per-token stream events must never be recorded',
  );
  const serialized = JSON.stringify(native);
  assert.ok(!serialized.includes('rowResponse'), 'raw provider responses must never be recorded');
  assert.ok(!serialized.includes('probe_quote'), 'native records carry no tool arguments or context text');
});
