import {
  DeveloperMessageItem,
  FunctionCallItem,
  ModelContext,
  ModelMessageItem,
  type ExecutableTransition,
  type InferenceInput,
  type InferenceRunner,
  type InterceptionHandler,
} from '@mozaik-ai/core/dist/index.mjs';
import type { AgentId, Evidence, RuntimeHost } from '../contracts.js';
import { ModelBudget, withDeadline } from './budget.js';
import { sameAction, sanitizeFailure } from './sanitize.js';

/**
 * Boundary interception.
 *
 * Responsibilities, all at an action boundary and never mid-generation:
 *
 *  1. Stop a finished agent BEFORE it can start another inference.
 *  2. Budget accounting -- reserve, then emit `model.requested` exactly once.
 *  3. Evidence delivery -- put newly observed evidence into the context the
 *     model is about to read, and only then mark it as seen.
 *  4. Cooperative reconsideration of a pending tool call on fresh peer evidence.
 *
 * What this is NOT: it does not abort an in-flight inference. Verified in
 * @mozaik-ai/core@4.0.5 -- `AgentLoop.run` checks interception only at the top
 * of each iteration, before `await stateExecutor.execute(...)`. A call already
 * running finishes. Never describe this as cancellation.
 *
 * Failure policy: FAIL CLOSED. Any operational failure here terminates the
 * branch through a valid terminal transition and reports the run as failed,
 * because returning the original transition would execute an unbudgeted,
 * uncounted provider call.
 */

export interface ReconsiderOptions {
  enabled: boolean;
  /** Evidence count when the driver was invoked. At or below this is seed
   *  context, never a live peer intervention. */
  driverStartRevision: number;
  maxPerAction: number;
  modelTimeoutMs: number;
  isFinished: () => boolean;
  /** True once the whole run has stopped -- completed, failed or cancelled. */
  isStopped: () => boolean;
  onOperationalFailure: (error: unknown) => void;
}

export class BoundaryInterceptor implements InterceptionHandler {
  #lastSeenRevision: number;
  #injectedRevision = 0;
  #reconsiderationsForCurrentAction = 0;
  #lastActionSignature = '';
  #reconsiderCount = 0;

  constructor(
    private readonly agentId: AgentId,
    private readonly host: RuntimeHost,
    private readonly budget: ModelBudget,
    private readonly runner: InferenceRunner,
    private readonly options: ReconsiderOptions,
  ) {
    this.#lastSeenRevision = options.driverStartRevision;
  }

  get reconsiderations(): number {
    return this.#reconsiderCount;
  }

  /** Peer evidence that arrived after this agent formed its pending proposal. */
  #freshPeerEvidence(): Evidence[] {
    return this.host
      .getEvidence()
      .filter(
        (e) =>
          e.agentId !== this.agentId &&
          e.revision > this.#lastSeenRevision &&
          e.revision > this.options.driverStartRevision,
      );
  }

  isSatisfiedBy(transition: ExecutableTransition): boolean {
    // Every inference and every pending tool call is inspected: budget,
    // evidence delivery, finished-agent stop and pending-call validation all
    // live here, not only reconsideration.
    return (
      transition.nextStateId === 'inference' ||
      transition.nextStateId === 'inference_streaming' ||
      transition.nextStateId === 'function_call'
    );
  }

  async handle(transition: ExecutableTransition): Promise<ExecutableTransition> {
    // AgentLoop awaits this, and a throw escapes the un-awaited
    // `agentLoop.run(...)` as an unhandled rejection, so this must never throw.
    try {
      // The agent has already concluded. Close the branch instead of letting
      // the loop's function_call -> inference edge start another paid request
      // after the run has been reported complete.
      if (this.options.isFinished()) {
        return terminal('Investigation already concluded; stopping this loop.');
      }
      // A sibling loop failed, or the run was cancelled, while this loop was
      // still iterating. Nothing awaits this loop, so it would otherwise keep
      // spending real requests against a run that has already been reported.
      if (this.options.isStopped()) {
        return terminal('The run has stopped; this loop makes no further requests.');
      }
      if (transition.nextStateId === 'inference' || transition.nextStateId === 'inference_streaming') {
        return this.#prepareInference(transition);
      }
      if (transition.nextStateId === 'function_call') {
        const invalid = this.#rejectInvalidCall(transition);
        if (invalid) return invalid;
        return await this.#reconsider(transition);
      }
      return transition;
    } catch (error) {
      const safe = sanitizeFailure(error, `interception:${transition.nextStateId}`);
      try {
        this.host.record('interception.failed', this.agentId, { ...safe });
      } catch {
        /* ledger closed or capped */
      }
      // Fail closed: never return an inference transition after a reservation
      // or ledger failure, or the request runs uncounted.
      this.options.onOperationalFailure(error);
      return terminal('Runtime failure at an action boundary; stopping without a conclusion.');
    }
  }

  /**
   * Reserve budget, record the request, and deliver any evidence the agent has
   * not yet actually received. Marking evidence "seen" without putting it in
   * the context would let the agent be treated as informed about a peer result
   * it never got.
   */
  #prepareInference(transition: ExecutableTransition): ExecutableTransition {
    if (transition.nextStateId !== 'inference' && transition.nextStateId !== 'inference_streaming') {
      return transition;
    }
    if (!this.budget.reserve()) {
      return terminal('Model request budget exhausted. Stopping without a conclusion rather than inventing one.');
    }

    const input = transition.input;
    const evidence = this.host.getEvidence();
    const undelivered = evidence.filter((e) => e.revision > this.#injectedRevision);

    let next = transition;
    if (undelivered.length > 0) {
      // Keep the context id stable: it identifies the agent for routing.
      const context = new ModelContext(input.context.id, [
        ...input.context.getItems(),
        DeveloperMessageItem.create(evidenceDigest(undelivered)),
      ]);
      next = { nextStateId: transition.nextStateId, input: { ...input, context } };
      this.#injectedRevision = evidence.length;
    }

    this.host.record('model.requested', this.agentId, {
      reason: 'agent-loop-inference',
      evidenceRevision: this.#injectedRevision,
      evidenceDelivered: undelivered.length,
    });
    this.budget.noteRequested();

    // Only what was actually delivered counts as seen.
    this.#lastSeenRevision = this.#injectedRevision;
    this.#reconsiderationsForCurrentAction = 0;
    return next;
  }

  /**
   * Tool lookup and JSON argument parsing happen inside the library, outside
   * our guarded `invoke`. A malformed pending call is terminalized here rather
   * than left to throw somewhere we cannot catch.
   */
  #rejectInvalidCall(transition: ExecutableTransition): ExecutableTransition | undefined {
    if (transition.nextStateId !== 'function_call') return undefined;
    const { call, inferenceInput } = transition.input;
    const known = (inferenceInput.tools ?? []).some((t) => t.name === call.name);
    let parsable = true;
    try {
      const parsed = JSON.parse(call.args || '{}');
      parsable = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      parsable = false;
    }
    if (known && parsable) return undefined;
    this.host.record('action.rejected', this.agentId, {
      tool: call.name,
      reason: known ? 'unparsable-arguments' : 'unknown-tool',
    });
    return terminal(
      `The pending call ${call.name} was ${known ? 'malformed' : 'not a known tool'}; stopping without a conclusion.`,
    );
  }

  async #reconsider(transition: ExecutableTransition): Promise<ExecutableTransition> {
    if (transition.nextStateId !== 'function_call') return transition;
    // The ablation runs the identical path with this switched off. `isSatisfiedBy`
    // is deliberately broad (budget, evidence delivery, validation), so the
    // policy gate has to live here.
    if (!this.options.enabled) return transition;

    const pending = transition.input;
    const before = { tool: pending.call.name, args: pending.call.args };
    const signature = `${before.tool}:${before.args}`;
    if (signature !== this.#lastActionSignature) {
      this.#lastActionSignature = signature;
      this.#reconsiderationsForCurrentAction = 0;
    }
    if (this.#reconsiderationsForCurrentAction >= this.options.maxPerAction) return transition;

    const peers = this.#freshPeerEvidence();
    if (peers.length === 0) return transition;

    if (!this.budget.reserve()) {
      this.host.record('reconsideration.skipped', this.agentId, {
        reason: 'model-budget-exhausted',
        peerEvidenceIds: peers.map((p) => p.id),
      });
      return transition;
    }

    this.#reconsiderationsForCurrentAction += 1;
    this.#reconsiderCount += 1;

    this.host.record('model.requested', this.agentId, {
      reason: 'boundary-reconsideration',
      evidenceRevision: this.host.getEvidence().length,
    });
    this.budget.noteRequested();

    let after = before;
    let changed = false;
    let note = 'reconsidered; original action kept';
    let next: ExecutableTransition = transition;

    try {
      const output = await withDeadline(
        this.runner.run(this.#reconsiderInput(pending.inferenceInput, pending.call, peers)),
        this.options.modelTimeoutMs,
        this.host.signal,
      );
      this.budget.settle(output.tokenUsage);

      const call = output.items.find((i): i is FunctionCallItem => i.type === 'function_call');
      if (call) {
        const candidate = { tool: call.name, args: call.args };
        // Canonical comparison: whitespace, key order and call ids are not work.
        if (!sameAction(before, candidate)) {
          after = candidate;
          changed = true;
          next = { nextStateId: 'function_call', input: { call, inferenceInput: pending.inferenceInput } };
          note = 'peer evidence changed the pending action';
        }
      } else {
        note = 'reconsideration produced no action; original action kept';
      }
    } catch (error) {
      this.budget.settleMissing();
      note = `reconsideration failed; original action kept (${sanitizeFailure(error, 'reconsideration').code})`;
    }

    this.host.record('action.reconsidered', this.agentId, {
      before,
      after,
      changed,
      peerEvidenceIds: peers.map((p) => p.id),
      evidenceRevision: this.host.getEvidence().length,
      note,
    });

    this.#lastSeenRevision = this.host.getEvidence().length;
    return next;
  }

  #reconsiderInput(base: InferenceInput, call: FunctionCallItem, peers: Evidence[]): InferenceInput {
    const briefing = DeveloperMessageItem.create(
      [
        'Pause before your next action.',
        '',
        'You were about to call:',
        `  ${call.name}(${call.args})`,
        '',
        'While you were thinking, your colleague produced evidence you have not seen:',
        ...peers.map(describe),
        '',
        'If that evidence makes your pending action redundant or less informative,',
        'call a better tool instead. If the pending action is still the right next',
        'step, call it again unchanged. Reply with exactly one tool call.',
      ].join('\n'),
    );
    // A separate context object: a re-evaluation that gets discarded must not
    // mutate the agent's live context.
    const context = new ModelContext(`${base.context.id}:reconsider`, [...base.context.getItems(), briefing]);
    return {
      model: base.model,
      maxOutputTokens: base.maxOutputTokens,
      tools: base.tools,
      streaming: false,
      context,
    };
  }
}

function describe(e: Evidence): string {
  return (
    `  [${e.id}] by ${e.agentId}: input=${JSON.stringify(e.input)} ` +
    `service=${e.actualCents} expected=${e.expectedCents} ` +
    `${e.passed ? 'MATCHES contract' : 'VIOLATES contract'} (${e.purpose})`
  );
}

function evidenceDigest(items: Evidence[]): string {
  return ['Observations available to you now (including your colleague\'s):', ...items.map(describe)].join('\n');
}

function terminal(text: string): ExecutableTransition {
  return { nextStateId: 'model_message', input: { answer: ModelMessageItem.rehydrate({ text }) } };
}
