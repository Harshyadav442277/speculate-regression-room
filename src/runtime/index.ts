import type { InferenceRunner } from '@mozaik-ai/core/dist/index.mjs';
import type { RuntimeDriver, RuntimeResult } from '../contracts.js';
import { checkRuntimeConfig } from './config.js';
import { resolveOptions } from './budget.js';
import { AGENT_SPECS, GENERALIST_SPEC } from './agents.js';
import { runPolicy } from './run.js';
import { sanitizeFailure } from './sanitize.js';

export { checkRuntimeConfig, installedModelNames } from './config.js';
export type { RuntimeConfigCheck, ProviderId } from './config.js';
export { ModelBudget, BudgetExhaustedError, RuntimeTimeoutError, withDeadline, resolveOptions } from './budget.js';
export { BoundaryInterceptor } from './interception.js';
export { runPolicy, RunStoppedError } from './run.js';
export { NativeLoopRecorder, RECORDED_NATIVE_EVENTS, EXCLUDED_NATIVE_EVENTS, MAX_NATIVE_EVENTS } from './observer.js';
export { AGENT_SPECS, GENERALIST_SPEC } from './agents.js';

export class RuntimeConfigError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'RuntimeConfigError';
  }
}

export interface DriverOverrides {
  /**
   * TEST ONLY. Supplying a runner bypasses provider configuration, so any run
   * made this way is plumbing evidence and must be labelled `execution: 'test'`.
   */
  runner?: InferenceRunner;
  model?: string;
  provider?: string;
  maxReconsiderationsPerAction?: number;
  /**
   * TEST ONLY. Raises the runtime-side budget above the host's cap so the
   * HOST's independent rejection of `model.requested` is the thing that stops
   * the run. Proves the host is the authority even when our local counter
   * disagrees. Never set this outside a test.
   */
  runtimeMaxModelRequests?: number;
}

/**
 * Builds the driver `investigate()` calls.
 *
 * Policies share one implementation and differ only by which participants join
 * and whether boundary reconsideration is enabled. The controls are NOT
 * handicapped: same tools, same host, same budgets, same evidence reuse.
 */
export function createRuntimeDriver(overrides: DriverOverrides = {}): RuntimeDriver {
  return async (host, options): Promise<RuntimeResult> => {
    const resolved = resolveOptions(options);
    const isTest = Boolean(overrides.runner);

    let model = overrides.model ?? '';
    let provider = overrides.provider ?? '';

    if (!isTest) {
      const config = checkRuntimeConfig();
      if (!config.ready) {
        host.record('runtime.failed', undefined, {
          stage: 'configuration',
          policy: resolved.policy,
          provider: config.provider,
          model: config.model,
          reason: config.reason ?? 'Runtime configuration is not ready.',
        });
        throw new RuntimeConfigError(config.reason ?? 'Runtime configuration is not ready.');
      }
      model = config.model;
      provider = config.provider;
    } else {
      model = model || 'deterministic-test-double';
      provider = provider || 'test';
    }

    host.record('runtime.started', undefined, {
      policy: resolved.policy,
      provider,
      model,
      execution: isTest ? 'test' : 'live',
      maxModelRequests: resolved.maxModelRequests,
      modelTimeoutMs: resolved.modelTimeoutMs,
    });

    const specs = resolved.policy === 'single' ? [GENERALIST_SPEC] : AGENT_SPECS;
    const reconsider = resolved.policy === 'cooperative';

    try {
      return await runPolicy(host, {
        specs,
        reconsider,
        maxModelRequests: Math.max(
          1,
          Math.min(overrides.runtimeMaxModelRequests ?? resolved.maxModelRequests, 12),
        ),
        modelTimeoutMs: resolved.modelTimeoutMs,
        model,
        provider,
        runner: overrides.runner,
        maxReconsiderationsPerAction: overrides.maxReconsiderationsPerAction,
      });
    } catch (error) {
      // Sanitized only. A provider or HTTP client error can carry a request
      // URL, headers or credential material, and this event is persisted into
      // the run artifact. Never record raw error text here.
      host.record('runtime.failed', undefined, {
        policy: resolved.policy,
        ...sanitizeFailure(error, 'policy'),
      });
      throw error;
    }
  };
}

/** Live driver. Requires provider configuration; makes real provider calls. */
export const runInvestigation: RuntimeDriver = createRuntimeDriver();
