import {
  SituationSpecification,
  createHuman,
  type Human,
  type SituationContext,
  type SituationHandler,
} from '@mozaik-ai/core/dist/index.mjs';
import type { AgentId, RuntimeHost } from '../contracts.js';

/**
 * Bounded recording of NATIVE @mozaik-ai/core lifecycle events.
 *
 * ## Why this exists
 *
 * Everything else in the ledger is written by us: `agent.started`,
 * `model.requested`, `probe.*`. Those prove what OUR code did. They do not
 * prove that the library actually ran two independent agent loops -- a
 * sufficiently confused wrapper could emit all of them from one loop, or from
 * no loop at all.
 *
 * The library's own events can prove it. Verified in the installed 4.0.5:
 * `RuntimeService.publish` fans every event out to every joined participant,
 * and `EventProcessor.process` runs that participant's handlers. So one extra
 * participant with a catch-all handler observes the real bus. Each loop event
 * is published by `LoopVisitor.publish`, which stamps `producerId` (the
 * library's own participant UUID) and `payload.loopId` (a UUID minted by
 * `AgentLoop.create`). Neither value is derived from our code.
 *
 * ## What is recorded, and what is deliberately not
 *
 * ONLY the event name, the producing participant UUID, and the loop UUID.
 * Never the payload. The payloads are unsafe or useless for an artifact:
 *
 *  - `inference.started`  carries the whole `InferenceInput`, i.e. the model
 *    context and every instruction.
 *  - `inference.completed` carries the raw `InferenceOutput`, including
 *    `rowResponse` -- the verbatim provider response body.
 *  - `function_call.completed` carries the raw tool output.
 *  - `message.sent` carries raw message text.
 *
 * Recording any of those would put raw provider responses, and potentially
 * anything a provider echoes back, into a persisted artifact. So the payload is
 * dropped entirely rather than filtered, which is the only version of this that
 * cannot leak by accident later.
 *
 * `inference.stream` is excluded separately: it fires per streamed chunk and
 * would flood the ledger with per-token noise. Streaming is not supported by
 * this runtime anyway.
 *
 * ## What this evidence does and does not prove
 *
 * PROVES OVERLAP: two distinct `loopId`s, each with its own
 * `message_received.started ... model.answer` span, whose spans interleave in
 * sequence order. That is genuine concurrent execution of two real library
 * loops -- not a claim we could fake from a single loop, because the loop UUID
 * is minted inside `AgentLoop.create`.
 *
 * DOES NOT PROVE USEFUL COOPERATION. Overlap only shows two loops were alive at
 * once. Cooperation being *useful* needs the semantic events: `probe.reused`
 * (one agent consumed the other's observation instead of spending a probe) and
 * `action.reconsidered` with `changed: true` citing peer evidence ids that the
 * host independently validated as another agent's. And even those show that the
 * mechanism engaged, not that the outcome was better -- that would need a
 * real-provider comparison against the controls, which this project has not run.
 */

/** Native events worth one ledger line each. Chosen to bound ledger growth. */
export const RECORDED_NATIVE_EVENTS: ReadonlySet<string> = new Set([
  'participant.joined', // which participants the library actually admitted
  'participant.left',
  'message_received.started', // start of a real loop
  'inference.started', // a real provider call inside a real loop
  'inference.completed',
  'function_call.started',
  'function_call.completed',
  'interception.started', // proof our interceptor ran inside the library loop
  'interception.finished',
  'model.answer', // the loop reached its own terminal state
]);

/**
 * Excluded on purpose. `inference.stream` is per-chunk noise; `message.sent`
 * and `message_received.completed` add content or duplication without adding
 * proof.
 */
export const EXCLUDED_NATIVE_EVENTS: readonly string[] = [
  'inference.stream',
  'message.sent',
  'message_received.completed',
];

/** Hard ceiling so a runaway loop cannot flood the artifact. */
export const MAX_NATIVE_EVENTS = 400;

class AnyRecordedNativeEvent extends SituationSpecification {
  isSatisfiedBy({ event }: SituationContext): boolean {
    return RECORDED_NATIVE_EVENTS.has(event.type);
  }
}

export class NativeLoopRecorder {
  #recorded = 0;
  #truncated = false;
  #selfId = '';
  readonly #agentIds = new Map<string, AgentId>();

  constructor(private readonly host: RuntimeHost) {}

  get recorded(): number {
    return this.#recorded;
  }

  /** Map a library participant UUID onto our stable agent id. Call before `join`. */
  register(participantId: string, agentId: AgentId): void {
    this.#agentIds.set(participantId, agentId);
  }

  /** A participant whose only job is to observe. It never joins a loop. */
  participant(): Human {
    const handler: SituationHandler = {
      specification: new AnyRecordedNativeEvent(),
      processor: {
        apply: ({ event }) => {
          // `EventProcessor.process` has no try/catch in 4.0.5, so a throw here
          // would stop delivery to every remaining participant mid-run.
          try {
            this.#capture(event.type, event.producerId, event.payload);
          } catch {
            /* observation must never be able to damage a run */
          }
        },
      },
    };
    const human = createHuman({ name: 'native-loop-recorder', capabilities: [], handlers: [handler] });
    this.#selfId = human.getId();
    return human;
  }

  #capture(type: string, producerId: string, payload: unknown): void {
    if (producerId === this.#selfId) return; // our own join is not evidence
    if (this.#recorded >= MAX_NATIVE_EVENTS) {
      if (!this.#truncated) {
        this.#truncated = true;
        this.host.record('runtime.native.truncated', undefined, { limit: MAX_NATIVE_EVENTS });
      }
      return;
    }
    const loopId = (payload as { loopId?: unknown })?.loopId;
    this.#recorded += 1;
    this.host.record('runtime.native', this.#agentIds.get(producerId), {
      native: type,
      participantId: producerId,
      ...(typeof loopId === 'string' ? { loopId } : {}),
    });
  }
}
