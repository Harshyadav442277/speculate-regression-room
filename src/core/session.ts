import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { AgentId, Conclusion, Evidence, QuoteInput, RunEvent, RuntimeHost } from '../contracts.js';
import { expectedQuote, QUOTE_CONTRACT, quoteFingerprint, quoteSchema } from './quote-contract.js';

export class InvestigationError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'InvestigationError'; }
}

function immutable<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) immutable(child);
  }
  return value;
}

export class EvidenceSession implements RuntimeHost {
  readonly runId = randomUUID();
  readonly contract = QUOTE_CONTRACT;
  readonly failingInput: Readonly<QuoteInput>;
  readonly signal: AbortSignal;
  readonly #started = performance.now();
  readonly #endpoint: string;
  readonly #maxProbes: number;
  readonly #maxModelRequests: number;
  readonly #probeTimeoutMs: number;
  readonly #evidence: Evidence[] = [];
  readonly #events: RunEvent[] = [];
  readonly #pending = new Map<string, Promise<Evidence>>();
  readonly #conclusions = new Map<AgentId, Conclusion>();
  readonly #observers = new Set<(event: RunEvent) => void | Promise<void>>();
  #executions = 0;
  #reuses = 0;
  #requests = 0;
  #closed = false;

  constructor(config: { failingInput: QuoteInput; endpoint: string; signal: AbortSignal; maxProbes?: number; maxModelRequests?: number; probeTimeoutMs?: number }) {
    this.failingInput = immutable(quoteSchema.parse(config.failingInput));
    const endpoint = new URL(config.endpoint);
    if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || endpoint.pathname !== '/quote' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new InvestigationError('INVALID_ENDPOINT', 'Probes require the owned loopback quote endpoint.');
    }
    this.#endpoint = endpoint.href;
    this.signal = config.signal;
    this.#maxProbes = config.maxProbes ?? 12;
    this.#maxModelRequests = config.maxModelRequests ?? 12;
    this.#probeTimeoutMs = config.probeTimeoutMs ?? 5000;
    for (const limit of [this.#maxProbes, this.#maxModelRequests, this.#probeTimeoutMs]) {
      if (!Number.isSafeInteger(limit) || limit < 1) throw new InvestigationError('INVALID_LIMIT', 'Limits must be positive integers.');
    }
  }

  getEvidence(): readonly Evidence[] { return [...this.#evidence]; }
  getEvents(): readonly RunEvent[] { return [...this.#events]; }
  getConclusions(): Partial<Record<AgentId, Conclusion>> { return Object.fromEntries(this.#conclusions); }
  getMetrics() { return { probeExecutions: this.#executions, probeReuses: this.#reuses, modelRequests: this.#requests, elapsedMs: Math.round(performance.now() - this.#started) }; }
  subscribe(observer: (event: RunEvent) => void | Promise<void>): () => void { this.#observers.add(observer); return () => { this.#observers.delete(observer); }; }
  close(): void { this.#closed = true; this.#observers.clear(); }

  record(type: string, agentId: AgentId | undefined, data: Record<string, unknown>): void {
    if (this.#closed) {
      if (type === 'model.requested') throw new InvestigationError('RUN_CLOSED', 'Run has ended.');
      return;
    }
    if (type === 'model.requested') {
      this.#assertActive();
      if (this.#requests >= this.#maxModelRequests) throw new InvestigationError('MODEL_BUDGET', 'Model request budget exhausted.');
      this.#requests++;
    }
    if (type === 'action.reconsidered') {
      const peerIds = data.peerEvidenceIds;
      if (!Array.isArray(peerIds) || peerIds.length === 0 || !peerIds.every(id => this.#evidence.some(e => e.id === id && e.agentId !== agentId && e.agentId !== 'generalist'))) {
        throw new InvestigationError('INVALID_PROVENANCE', 'Action reconsideration must reference observed peer evidence.');
      }
      if (data.before === undefined || data.after === undefined || typeof data.changed !== 'boolean') {
        throw new InvestigationError('INVALID_REVISION', 'Action reconsideration needs before, after and changed.');
      }
      if (data.changed && JSON.stringify(data.before) === JSON.stringify(data.after)) {
        throw new InvestigationError('INVALID_REVISION', 'An identical action cannot be counted as changed.');
      }
    }
    this.#append(type, agentId, data);
  }

  #append(type: string, agentId: AgentId | undefined, data: Record<string, unknown>): void {
    // JSON round-trip rejects unserializable payloads and severs caller references.
    const clean = JSON.parse(JSON.stringify(data));
    const event: RunEvent = immutable({ runId: this.runId, sequence: this.#events.length + 1,
      elapsedMs: Math.round(performance.now() - this.#started), timestamp: new Date().toISOString(),
      type, ...(agentId ? { agentId } : {}), data: clean });
    this.#events.push(event);
    let failed = 0;
    for (const observer of this.#observers) {
      try {
        const delivered = observer(event);
        if (delivered) void Promise.resolve(delivered).catch(() => {
          if (this.#observers.delete(observer) && !this.#closed) this.#append('observer.failed', undefined, { detachedObservers: 1 });
        });
      } catch { this.#observers.delete(observer); failed++; }
    }
    if (failed) this.#events.push(immutable({ runId: this.runId, sequence: this.#events.length + 1,
      elapsedMs: Math.round(performance.now() - this.#started), timestamp: new Date().toISOString(),
      type: 'observer.failed', data: { detachedObservers: failed } }));
  }

  #assertActive(): void {
    if (this.#closed) throw new InvestigationError('RUN_CLOSED', 'Run has ended.');
    if (this.signal.aborted) throw new InvestigationError('RUN_ABORTED', 'Run was cancelled or timed out.');
  }

  async probe(agentId: AgentId, value: QuoteInput, purpose: string): Promise<Evidence> {
    this.#assertActive();
    const input = quoteSchema.parse(value);
    if (typeof purpose !== 'string' || purpose.length < 1 || purpose.length > 2000) throw new InvestigationError('INVALID_PURPOSE', 'A bounded probe purpose is required.');
    const key = quoteFingerprint(input);
    const existing = this.#pending.get(key);
    if (existing) {
      const result = await existing;
      this.#assertActive();
      this.#reuses++;
      this.record('probe.reused', agentId, { evidenceId: result.id, originalAgentId: result.agentId, purpose });
      return result;
    }
    if (this.#executions >= this.#maxProbes) throw new InvestigationError('PROBE_BUDGET', 'Probe execution budget exhausted.');
    this.#executions++;
    // Reserve before yielding: simultaneous identical requests share one execution.
    const execution = Promise.resolve().then(() => this.#executeProbe(agentId, input, purpose)).catch(error => {
      // A later explicit attempt may retry a failed input; the spent budget and failure remain.
      this.#pending.delete(key);
      throw error;
    });
    this.#pending.set(key, execution);
    return execution;
  }

  async #executeProbe(agentId: AgentId, input: QuoteInput, purpose: string): Promise<Evidence> {
    const actionId = randomUUID();
    this.record('probe.started', agentId, { actionId, input, purpose, evidenceRevision: this.#evidence.length });
    try {
      const response = await fetch(this.#endpoint, { method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
        signal: AbortSignal.any([this.signal, AbortSignal.timeout(this.#probeTimeoutMs)]) });
      if (!response.ok) throw new InvestigationError('PROBE_HTTP', `Quote endpoint returned HTTP ${response.status}.`);
      const text = await response.text();
      if (text.length > 4096) throw new InvestigationError('PROBE_RESPONSE', 'Quote response exceeded its size limit.');
      const result = JSON.parse(text);
      if (!result || !Number.isSafeInteger(result.totalCents) || result.totalCents < 0 || Object.keys(result).length !== 1) {
        throw new InvestigationError('PROBE_RESPONSE', 'Quote response did not match its contract.');
      }
      this.#assertActive();
      const expectedCents = expectedQuote(input);
      const evidence: Evidence = immutable({ id: randomUUID(), revision: this.#evidence.length + 1,
        agentId, input, expectedCents, actualCents: result.totalCents, passed: result.totalCents === expectedCents,
        purpose, elapsedMs: Math.round(performance.now() - this.#started) });
      this.#evidence.push(evidence);
      this.record('probe.completed', agentId, { actionId, evidenceId: evidence.id, evidenceRevision: evidence.revision, evidence });
      return evidence;
    } catch (error) {
      this.record('probe.failed', agentId, { actionId, code: error instanceof InvestigationError ? error.code : 'PROBE_UNAVAILABLE' });
      throw error;
    }
  }

  conclude(agentId: AgentId, conclusion: Conclusion): void {
    this.#assertActive();
    if (this.#conclusions.has(agentId)) throw new InvestigationError('DUPLICATE_CONCLUSION', 'Agent has already concluded.');
    if (typeof conclusion.summary !== 'string' || conclusion.summary.length < 1 || conclusion.summary.length > 6000
      || !Array.isArray(conclusion.evidenceIds) || conclusion.evidenceIds.length === 0
      || !conclusion.evidenceIds.every(id => this.#evidence.some(e => e.id === id))
      || !Array.isArray(conclusion.unresolved) || !conclusion.unresolved.every(x => typeof x === 'string')) {
      throw new InvestigationError('INVALID_CONCLUSION', 'Conclusion must cite observed evidence and preserve unresolved questions.');
    }
    const copy = immutable(structuredClone(conclusion));
    this.#conclusions.set(agentId, copy);
    this.record('agent.completed', agentId, { conclusion: copy });
  }
}
