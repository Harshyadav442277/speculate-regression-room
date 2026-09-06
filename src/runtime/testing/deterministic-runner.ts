import {
  FunctionCallItem,
  ModelMessageItem,
  SemanticEvent,
  type InferenceInput,
  type InferenceOutput,
  type InferenceRunner,
} from '@mozaik-ai/core/dist/index.mjs';

/**
 * ============================================================================
 * TEST DOUBLE -- NOT A MODEL. NOT AI. NOT A RESULT.
 * ============================================================================
 *
 * A scripted InferenceRunner used to exercise real @mozaik-ai/core loop
 * mechanics -- overlap, interception, terminal transition shape, budgets and
 * error propagation -- without a provider or a credential.
 *
 * Anything measured with this runner is evidence about OUR PLUMBING ONLY.
 * It can never be reported as a live inference result, a benchmark, a
 * comparison between policies, or a win of any kind. Every artifact produced
 * with it must be labelled `execution: 'test'`.
 */

export type ScriptedStep =
  | { kind: 'call'; tool: string; args: Record<string, unknown>; delayMs?: number }
  | { kind: 'message'; text: string; delayMs?: number }
  | { kind: 'error'; message: string; delayMs?: number }
  /** A call whose argument string is emitted verbatim, so a test can send
   *  arguments the library will fail to parse. */
  | { kind: 'rawCall'; tool: string; rawArgs: string; delayMs?: number }
  /** finish_investigation citing evidence ids the model ACTUALLY received in
   *  its context, so the host's provenance check can pass honestly. */
  | { kind: 'finish'; delayMs?: number }
  /** A provider that returns no items at all. */
  | { kind: 'empty'; delayMs?: number };

export interface DeterministicScript {
  /** Keyed by agent id, e.g. 'pricing'. Consumed in order per inference call. */
  loop: Record<string, ScriptedStep[]>;
  /** Keyed by agent id. Consumed when a reconsideration request arrives. */
  reconsider?: Record<string, ScriptedStep[]>;
  /** Reported token usage, or undefined to simulate a provider that omits it. */
  usage?: { inputTokens: number; outputTokens: number };
}

export class DeterministicInferenceRunner implements InferenceRunner {
  readonly isTestDouble = true as const;
  readonly requests: { agent: string; reconsider: boolean }[] = [];
  /** Text the "model" actually received, so tests can prove evidence delivery. */
  readonly contexts: { agent: string; reconsider: boolean; text: string }[] = [];
  #loop: Record<string, ScriptedStep[]>;
  #reconsider: Record<string, ScriptedStep[]>;

  constructor(private readonly script: DeterministicScript) {
    this.#loop = Object.fromEntries(Object.entries(script.loop).map(([k, v]) => [k, [...v]]));
    this.#reconsider = Object.fromEntries(
      Object.entries(script.reconsider ?? {}).map(([k, v]) => [k, [...v]]),
    );
  }

  /** Context ids are `<agentId>-context`, and `...:reconsider` for re-evaluation. */
  #route(request: InferenceInput): { agent: string; reconsider: boolean } {
    const id = request.context.id;
    const reconsider = id.endsWith(':reconsider');
    const agent = id.replace(':reconsider', '').replace(/-context$/, '');
    return { agent, reconsider };
  }

  async run(request: InferenceInput): Promise<InferenceOutput> {
    const route = this.#route(request);
    this.requests.push(route);
    this.contexts.push({
      ...route,
      text: request.context
        .getItems()
        .map((item) => {
          const content = (item as { content?: { text?: unknown } }).content;
          return typeof content?.text === 'string' ? content.text : '';
        })
        .join('\n'),
    });
    const queue = route.reconsider ? this.#reconsider[route.agent] : this.#loop[route.agent];
    const step = queue?.shift();

    if (!step) {
      // Exhausted script: end this loop cleanly rather than hanging.
      return output([ModelMessageItem.rehydrate({ text: 'Scripted steps exhausted.' })], this.script.usage);
    }
    if (step.delayMs) await new Promise((r) => setTimeout(r, step.delayMs));
    if (step.kind === 'error') throw new Error(step.message);
    if (step.kind === 'message') {
      return output([ModelMessageItem.rehydrate({ text: step.text })], this.script.usage);
    }
    if (step.kind === 'empty') return output([], this.script.usage);
    const callId = `call-${route.agent}-${this.requests.length}`;
    if (step.kind === 'rawCall') {
      return output([FunctionCallItem.rehydrate({ callId, name: step.tool, args: step.rawArgs })], this.script.usage);
    }
    if (step.kind === 'finish') {
      // Ids are read back out of the context the runtime actually delivered.
      // Nothing is smuggled in: if evidence was never injected, this cites
      // nothing and the host correctly rejects the conclusion.
      const seen = this.contexts
        .filter((c) => c.agent === route.agent)
        .map((c) => c.text)
        .join('\n');
      const ids = [...new Set(seen.match(/(?<=\[)[0-9a-f-]{36}(?=\])/g) ?? [])];
      return output(
        [
          FunctionCallItem.rehydrate({
            callId,
            name: 'finish_investigation',
            args: JSON.stringify({
              summary: 'Scripted conclusion from the deterministic test double. Not a model result.',
              evidenceIds: ids,
              unresolved: ['Everything: this is a test double, not an investigation.'],
            }),
          }),
        ],
        this.script.usage,
      );
    }
    return output(
      [
        FunctionCallItem.rehydrate({
          callId: `call-${route.agent}-${this.requests.length}`,
          name: step.tool,
          args: JSON.stringify(step.args),
        }),
      ],
      this.script.usage,
    );
  }

  async *stream(request: InferenceInput): AsyncGenerator<SemanticEvent> {
    // Streaming is not exercised by these tests; emit one event and finish so
    // the contract is honoured rather than silently unimplemented.
    const result = await this.run(request);
    yield SemanticEvent.create('inference.stream', 'deterministic-test-runner', { items: result.items.length });
  }
}

function output(items: InferenceOutput['items'], usage?: { inputTokens: number; outputTokens: number }): InferenceOutput {
  return { items, tokenUsage: usage as InferenceOutput['tokenUsage'], rowResponse: { testDouble: true } };
}
