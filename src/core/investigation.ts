import { createQuoteServer, variants } from '../../research/checkout-fixture/quote-service.mjs';
import type { AgentId, Conclusion, Evidence, Policy, QuoteInput, RunEvent, RuntimeDriver, RuntimeResult } from '../contracts.js';
import { DEFAULT_INPUT, quoteSchema } from './quote-contract.js';
import { EvidenceSession, InvestigationError } from './session.js';

export interface RunArtifact {
  schemaVersion: 1;
  appVersion: '0.1.0';
  mozaikVersion: '4.0.5';
  runId: string;
  execution: 'live' | 'test';
  status: 'completed' | 'incomplete' | 'cancelled';
  configuration: { policy: Policy; fixture: string; failingInput: QuoteInput; maxProbes: number; maxModelRequests: number; maxRunMs: number };
  events: readonly RunEvent[];
  evidence: readonly Evidence[];
  conclusions: Partial<Record<AgentId, Conclusion>>;
  metrics: { probeExecutions: number; probeReuses: number; modelRequests: number; elapsedMs: number };
  runtime: RuntimeResult | null;
  error: { code: string; message: string } | null;
}

export async function investigate(driver: RuntimeDriver, config: {
  fixture?: string;
  failingInput?: QuoteInput;
  policy?: Policy;
  execution: 'live' | 'test';
  maxProbes?: number;
  maxModelRequests?: number;
  maxRunMs?: number;
  modelTimeoutMs?: number;
  signal?: AbortSignal;
  onEvent?: (event: RunEvent) => void;
}): Promise<RunArtifact> {
  const fixture = config.fixture ?? 'discount-twice';
  if (!variants.has(fixture)) throw new InvestigationError('INVALID_FIXTURE', 'Unknown local fixture.');
  const policy = config.policy ?? 'cooperative';
  if (!['cooperative', 'independent', 'single'].includes(policy)) throw new InvestigationError('INVALID_POLICY', 'Unknown investigation policy.');
  const failingInput = quoteSchema.parse(config.failingInput ?? DEFAULT_INPUT);
  const maxRunMs = config.maxRunMs ?? 120_000;
  const maxProbes = config.maxProbes ?? 12;
  const maxModelRequests = config.maxModelRequests ?? 12;
  for (const limit of [maxRunMs, maxProbes, maxModelRequests]) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new InvestigationError('INVALID_LIMIT', 'Run limits must be positive integers.');
  }
  const controller = new AbortController();
  const cancel = () => controller.abort(new InvestigationError('RUN_CANCELLED', 'Run was cancelled.'));
  config.signal?.addEventListener('abort', cancel, { once: true });
  if (config.signal?.aborted) cancel();
  const timer = setTimeout(() => controller.abort(new InvestigationError('RUN_TIMEOUT', 'Run exceeded its time budget.')), maxRunMs);
  const server = createQuoteServer(fixture);
  let session: EvidenceSession | undefined;
  let abortListener: (() => void) | undefined;
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture did not bind');
    session = new EvidenceSession({ failingInput, endpoint: `http://127.0.0.1:${address.port}/quote`, signal: controller.signal, maxProbes, maxModelRequests });
    if (config.onEvent) session.subscribe(config.onEvent);
    session.record('run.started', undefined, { execution: config.execution, policy, maxProbes, maxModelRequests, maxRunMs, failingInput });
    let runtime: RuntimeResult | null = null;
    let error: RunArtifact['error'] = null;
    let status: RunArtifact['status'] = 'completed';
    try {
      const abort = new Promise<never>((_, reject) => {
        abortListener = () => reject(controller.signal.reason);
        controller.signal.addEventListener('abort', abortListener, { once: true });
        if (controller.signal.aborted) abortListener();
      });
      const work = async () => {
        await session!.probe('generalist', failingInput, 'Reproduce the submitted input against the written contract.');
        return driver(session!, { policy, maxModelRequests, modelTimeoutMs: config.modelTimeoutMs ?? 25_000 });
      };
      runtime = await Promise.race([work(), abort]);
      const required: AgentId[] = policy === 'single' ? ['generalist'] : ['pricing', 'tax'];
      if (!required.every(id => session!.getConclusions()[id])) throw new InvestigationError('MISSING_CONCLUSION', 'One or more investigators did not finish with cited evidence.');
      if (runtime.modelRequests !== session.getMetrics().modelRequests) throw new InvestigationError('USAGE_MISMATCH', 'Runtime request count does not match the event ledger.');
      session.record('run.completed', undefined, { modelRequests: runtime.modelRequests });
    } catch (caught) {
      const reason = controller.signal.aborted ? controller.signal.reason : caught;
      error = reason instanceof InvestigationError
        ? { code: reason.code, message: reason.message }
        : { code: 'RUNTIME_FAILED', message: 'Runtime failed; completed evidence was preserved. Check the runtime diagnostics without sharing credentials.' };
      status = error.code === 'RUN_CANCELLED' ? 'cancelled' : 'incomplete';
      controller.abort(reason);
      session.record('run.failed', undefined, { ...error, status });
    }
    const artifact: RunArtifact = { schemaVersion: 1, appVersion: '0.1.0', mozaikVersion: '4.0.5', runId: session.runId,
      execution: config.execution, status, configuration: { policy, fixture, failingInput, maxProbes, maxModelRequests, maxRunMs },
      events: session.getEvents(), evidence: session.getEvidence(), conclusions: session.getConclusions(),
      metrics: session.getMetrics(), runtime, error };
    session.close();
    return artifact;
  } finally {
    clearTimeout(timer);
    if (abortListener) controller.signal.removeEventListener('abort', abortListener);
    config.signal?.removeEventListener('abort', cancel);
    session?.close();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
