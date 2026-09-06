import type { RuntimeOptions } from '../contracts.js';

/**
 * Hard caps on model usage for one run.
 *
 * Every model request must be admitted through `reserve()` BEFORE it is issued,
 * synchronously, so two overlapping agent loops cannot both pass a check that
 * only one of them should. Reservation is deliberately not async: an await
 * between the check and the increment is exactly how a budget gets overrun by
 * concurrent participants.
 */
export class ModelBudget {
  private reserved = 0;
  private completed = 0;
  private requested = 0;
  private usageReported = 0;
  private inputTokens = 0;
  private outputTokens = 0;

  constructor(
    private readonly maxModelRequests: number,
    private readonly signal: AbortSignal,
  ) {}

  /** Synchronously claim one request slot. Returns false when exhausted. */
  reserve(): boolean {
    if (this.signal.aborted) return false;
    if (this.reserved >= this.maxModelRequests) return false;
    this.reserved += 1;
    return true;
  }

  /**
   * Call immediately after a SUCCESSFUL `host.record('model.requested', ...)`.
   * The host ledger is the single source of truth for the request count, and
   * `investigate()` aborts the run on any mismatch, so we mirror it rather than
   * counting independently.
   */
  noteRequested(): void {
    this.requested += 1;
  }

  /** Release a slot claimed by `reserve()` that was never issued. */
  release(): void {
    if (this.reserved > 0) this.reserved -= 1;
  }

  /**
   * Record one finished provider call and its reported usage.
   *
   * The installed `TokenUsage` exposes `inputTokens` / `outputTokens` /
   * `totalTokens` (verified against dist/index.d.ts). Anything else is treated
   * as usage being unavailable rather than guessed at.
   */
  settle(usage: unknown): void {
    this.completed += 1;
    const u = usage as { inputTokens?: unknown; outputTokens?: unknown } | null | undefined;
    if (!u || typeof u.inputTokens !== 'number' || typeof u.outputTokens !== 'number') return;
    this.inputTokens += u.inputTokens;
    this.outputTokens += u.outputTokens;
    this.usageReported += 1;
  }

  /** A finished call that reported no usage at all (failure, or a silent provider). */
  settleMissing(): void {
    this.completed += 1;
  }

  /** Mirrors the host's `model.requested` ledger count. */
  get requestsIssued(): number {
    return this.requested;
  }

  get callsCompleted(): number {
    return this.completed;
  }

  get exhausted(): boolean {
    return this.reserved >= this.maxModelRequests;
  }

  /**
   * Aggregate usage across ALL requests, or null.
   *
   * Null when any completed request failed to report usage: a partial total
   * silently understates real spend, which is worse than admitting it is
   * unknown. Never a fabricated zero -- ARCHITECTURE.md: "Missing usage is
   * unavailable, not zero."
   */
  usage(): { inputTokens: number; outputTokens: number } | null {
    if (this.completed === 0 || this.usageReported !== this.completed) return null;
    return { inputTokens: this.inputTokens, outputTokens: this.outputTokens };
  }
}

export class BudgetExhaustedError extends Error {
  constructor(limit: number) {
    super(`Model request budget exhausted (limit ${limit}).`);
    this.name = 'BudgetExhaustedError';
  }
}

export class RuntimeTimeoutError extends Error {
  constructor(ms: number) {
    super(`Model call exceeded ${ms}ms.`);
    this.name = 'RuntimeTimeoutError';
  }
}

/**
 * Races a promise against the run's abort signal and a per-call timeout.
 *
 * NOTE: this bounds how long we WAIT, not how long the provider works. The
 * underlying request is not cancelled -- @mozaik-ai/core@4.0.5 exposes no
 * cancellation path, and ARCHITECTURE.md places provider cancellation outside
 * MVP scope. Do not describe a timeout here as a cancelled call.
 */
export function withDeadline<T>(promise: Promise<T>, ms: number, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      fn();
    };
    const onAbort = () => finish(() => reject(abortError()));
    const timer = setTimeout(() => finish(() => reject(new RuntimeTimeoutError(ms))), ms);

    if (signal.aborted) {
      finish(() => reject(abortError()));
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error)),
    );
  });
}

function abortError(): Error {
  const error = new Error('Run aborted.');
  error.name = 'AbortError';
  return error;
}

export function resolveOptions(options: RuntimeOptions): RuntimeOptions {
  const maxModelRequests = Math.max(1, Math.min(options.maxModelRequests, 12));
  const modelTimeoutMs = Math.max(1_000, Math.min(options.modelTimeoutMs, 120_000));
  return { policy: options.policy, maxModelRequests, modelTimeoutMs };
}
