import {
  DeveloperMessageItem,
  ModelContext,
  ModelMessageItem,
  RuntimeState,
  SemanticEvent,
  SituationSpecification,
  createAgent,
  defineRuntime,
  type InferenceInput,
  type InferenceOutput,
  type InferenceRunner,
  type SituationContext,
  type SituationHandler,
  type Tool,
} from '@mozaik-ai/core/dist/index.mjs';
import type { AgentId, RuntimeHost, RuntimeResult } from '../contracts.js';
import { AGENT_SPECS, GENERALIST_SPEC, buildTools, type AgentSpec } from './agents.js';
import { BoundaryInterceptor } from './interception.js';
import { ModelBudget, withDeadline } from './budget.js';
import { NativeLoopRecorder } from './observer.js';
import { sanitizeFailure } from './sanitize.js';

class AppState extends RuntimeState {}

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
  settled: boolean;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const d: Deferred = {
    promise,
    settled: false,
    resolve: () => {
      if (d.settled) return;
      d.settled = true;
      resolve();
    },
    reject: (error) => {
      if (d.settled) return;
      d.settled = true;
      reject(error);
    },
  };
  promise.catch(() => {});
  return d;
}

/** Fires when THIS participant's own loop emits its final message. */
class OwnLoopFinished extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    return event.type === 'model.answer' && event.producerId === participant.getId();
  }
}

/** `<agentId>-context`, or `<agentId>-context:reconsider` for a re-evaluation. */
function routeContext(contextId: string): { agentId: string; reconsider: boolean } {
  const reconsider = contextId.endsWith(':reconsider');
  return { agentId: contextId.replace(':reconsider', '').replace(/-context$/, ''), reconsider };
}

/**
 * A tool that can never throw into the loop.
 *
 * `runLoop` calls `agentLoop.run(...)` without awaiting it (verified in 4.0.5),
 * so anything thrown inside a state becomes an unhandled rejection that no
 * caller can catch. Tool errors are returned to the model as ordinary results
 * and recorded with a sanitized code.
 */
function guardTool(tool: Tool, host: RuntimeHost, agentId: AgentId): Tool {
  return {
    ...tool,
    invoke: async (args: unknown) => {
      try {
        return await tool.invoke(args);
      } catch (error) {
        const safe = sanitizeFailure(error, `tool:${tool.name}`);
        try {
          host.record('tool.failed', agentId, { tool: tool.name, ...safe });
        } catch {
          /* ledger closed or capped; the returned result still informs the model */
        }
        return { error: safe.code, retryable: false };
      }
    },
  };
}

/**
 * The loop's runner: never throws, always bounded, always accounted.
 *
 * A provider error inside `InferenceState.run` escapes `AgentLoop.run` and
 * becomes an unhandled rejection -- proven by `tests/runtime.test.ts`, which
 * crashed the process before this guard existed. So the guard:
 *   - applies `modelTimeoutMs` and `host.signal` to EVERY provider call,
 *   - settles usage for every call so aggregate usage is complete or null,
 *   - records only sanitized codes (provider errors can carry URLs/credentials),
 *   - rejects that agent's completion so the run ends honestly,
 *   - returns a terminal message so the loop closes via model_message -> idle.
 *
 * Reconsideration calls are rethrown: `BoundaryInterceptor` owns their recovery.
 * This is NOT a global `unhandledRejection` swallow, which the build task forbids.
 */
function guardRunner(
  inner: InferenceRunner,
  host: RuntimeHost,
  budget: ModelBudget,
  modelTimeoutMs: number,
  onAgentFailure: (agentId: string, error: unknown) => void,
  isStopped: () => boolean,
): InferenceRunner {
  const fail = (request: InferenceInput, error: unknown, stage: string): InferenceOutput => {
    const { agentId } = routeContext(request.context.id);
    const safe = sanitizeFailure(error, stage);
    budget.settleMissing();
    try {
      host.record('agent.failed', agentId as AgentId, { ...safe });
    } catch {
      /* ledger unavailable; the rejection below still ends the run honestly */
    }
    onAgentFailure(agentId, error);
    return {
      items: [
        ModelMessageItem.rehydrate({
          text: 'The model provider failed for this step. Stopping without a conclusion rather than inventing one.',
        }),
      ],
      tokenUsage: undefined,
      rowResponse: { providerFailed: true },
    };
  };

  return {
    async run(request: InferenceInput): Promise<InferenceOutput> {
      const isReconsider = routeContext(request.context.id).reconsider;
      // Last line of defence for a sibling loop. When one loop fails or the run
      // is cancelled, `runPolicy` returns while the OTHER loop is still mid
      // iteration -- it is fire-and-forget and nothing can await it. The
      // interceptor stops it at the next boundary, but a transition that had
      // already been admitted would otherwise reach the provider after the run
      // was reported over. Refuse before spending anything.
      if (isStopped()) {
        if (isReconsider) throw new RunStoppedError();
        return {
          items: [
            ModelMessageItem.rehydrate({
              text: 'The run has already stopped. This loop is not permitted to make further requests.',
            }),
          ],
          tokenUsage: undefined,
          rowResponse: { runStopped: true },
        };
      }
      try {
        const output = await withDeadline(inner.run(request), modelTimeoutMs, host.signal);
        if (isReconsider) return output; // interceptor settles its own usage
        if (!output || !Array.isArray(output.items) || output.items.length === 0) {
          return fail(request, new Error('empty inference output'), 'inference:empty');
        }
        budget.settle(output.tokenUsage);
        return output;
      } catch (error) {
        if (isReconsider) throw error;
        return fail(request, error, 'inference');
      }
    },
    async *stream(request: InferenceInput): AsyncGenerator<SemanticEvent> {
      // Streaming is outside MVP scope and is not claimed to be supported.
      // Terminalize deterministically rather than half-implementing it.
      const { agentId } = routeContext(request.context.id);
      try {
        host.record('runtime.unsupported', agentId as AgentId, { feature: 'streaming' });
      } catch {
        /* ledger unavailable */
      }
      onAgentFailure(agentId, new Error('streaming is not supported by this runtime'));
      yield SemanticEvent.create('inference.stream', 'runtime-guard', { unsupported: 'streaming' });
    },
  };
}

/**
 * `DefaultInferenceRunner` requires an `InferenceInputValidator` the package
 * does not export, so a real instance is obtained from an isolated throwaway
 * runtime rather than reconstructed by hand.
 */
function defaultRunner(): InferenceRunner {
  const throwaway = defineRuntime<AppState>();
  return throwaway.initializeRuntime({ state: new AppState() }).getInferenceRunner();
}

/** A request refused because the run had already ended. Never a provider error. */
export class RunStoppedError extends Error {
  readonly code = 'RUN_CLOSED';
  constructor() {
    super('The run has already stopped.');
    this.name = 'RunStoppedError';
  }
}

export interface PolicyConfig {
  specs: readonly AgentSpec[];
  reconsider: boolean;
  maxModelRequests: number;
  modelTimeoutMs: number;
  model: string;
  provider: string;
  /** TEST ONLY. A supplied runner marks the run as plumbing evidence. */
  runner?: InferenceRunner;
  maxReconsiderationsPerAction?: number;
}

export async function runPolicy(host: RuntimeHost, config: PolicyConfig): Promise<RuntimeResult> {
  const budget = new ModelBudget(config.maxModelRequests, host.signal);
  const driverStartRevision = host.getEvidence().length;

  const finished = new Map<AgentId, Deferred>();
  const concluded = new Set<AgentId>();
  for (const spec of config.specs) finished.set(spec.id, deferred());

  // Run-level stop. Set the moment this driver stops waiting, for ANY reason:
  // success, one agent failing, or cancellation. Loops are fire-and-forget, so
  // without this a sibling loop keeps issuing requests after the run is over.
  let stopped = false;
  const isStopped = () => stopped || host.signal.aborted;

  const inner = config.runner ?? defaultRunner();
  const guarded = guardRunner(
    inner,
    host,
    budget,
    config.modelTimeoutMs,
    (agentId, error) => {
      finished.get(agentId as AgentId)?.reject(error);
    },
    isStopped,
  );

  const { initializeRuntime, join, runLoop } = defineRuntime<AppState>();
  initializeRuntime({ state: new AppState(), inferenceRunnerConfig: { runner: guarded } });

  // Joined first so it observes every later `participant.joined`.
  const recorder = new NativeLoopRecorder(host);
  join(recorder.participant());

  const interceptors = new Map<AgentId, BoundaryInterceptor>();

  for (const spec of config.specs) {
    const done = finished.get(spec.id)!;

    // Concluding marks the agent finished; it does NOT resolve completion.
    // Mozaik still transitions function_call -> inference, so resolving here
    // would let a further real request start after the run was reported done.
    // The interceptor terminalizes the next transition, and completion is
    // resolved by that loop's own final event below.
    const tools = buildTools(host, spec.id, () => concluded.add(spec.id)).map((t) =>
      guardTool(t, host, spec.id),
    );

    const settleOnFinalMessage: SituationHandler = {
      specification: new OwnLoopFinished(),
      processor: {
        apply() {
          // Wrapped: EventProcessor.process has no try/catch in 4.0.5, so one
          // throwing handler would end delivery to every remaining participant.
          try {
            done.resolve();
          } catch {
            /* an observer failure must never erase a run */
          }
        },
      },
    };

    const instruction = spec.instruction(host);
    const agent = createAgent({
      name: spec.name,
      capabilities: ['inference'],
      instruction,
      tools,
      handlers: [settleOnFinalMessage],
    });

    // Reconsideration uses the RAW runner: the interceptor has its own recovery
    // and must observe a real failure rather than a substituted message.
    interceptors.set(
      spec.id,
      new BoundaryInterceptor(spec.id, host, budget, inner, {
        enabled: config.reconsider,
        driverStartRevision,
        maxPerAction: config.maxReconsiderationsPerAction ?? 2,
        modelTimeoutMs: config.modelTimeoutMs,
        isFinished: () => concluded.has(spec.id),
        isStopped,
        onOperationalFailure: (error) => done.reject(error),
      }),
    );

    recorder.register(agent.getId(), spec.id);
    join(agent);
    host.record('agent.started', spec.id, { name: spec.name, reconsider: config.reconsider });

    const context = new ModelContext(`${spec.id}-context`, [DeveloperMessageItem.create(instruction)]);
    const task =
      `A customer submitted this input and the total looked wrong: ` +
      `${JSON.stringify(host.failingInput)}. Investigate and finish with a cited conclusion.`;

    // Fire-and-forget by design: from here the loops overlap.
    runLoop(
      agent.getId(),
      task,
      { model: config.model, context, tools: agent.getTools(), streaming: false, maxOutputTokens: 1024 },
      interceptors.get(spec.id),
    );
  }

  const aborted = new Promise<never>((_, reject) => {
    const failRun = () => reject(new Error('Run aborted.'));
    if (host.signal.aborted) failRun();
    host.signal.addEventListener('abort', failRun, { once: true });
  });
  aborted.catch(() => {});

  try {
    await Promise.race([Promise.all([...finished.values()].map((d) => d.promise)), aborted]);
  } finally {
    // Before anything else: no loop may issue another request from here on.
    // On the failure and cancellation paths a sibling loop is still running.
    stopped = true;
    for (const [id, interceptor] of interceptors) {
      try {
        host.record('runtime.agent.finished', id, {
          reconsiderations: interceptor.reconsiderations,
          concluded: concluded.has(id),
          nativeEventsRecorded: recorder.recorded,
        });
      } catch {
        /* the ledger may already be closed on an aborted run */
      }
    }
  }

  return {
    modelRequests: budget.requestsIssued,
    usage: budget.usage(),
    model: config.model,
    provider: config.provider,
  };
}

export const COOPERATIVE_SPECS = AGENT_SPECS;
export const SINGLE_SPECS = [GENERALIST_SPEC] as const;
