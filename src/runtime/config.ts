import { supportedModels } from '@mozaik-ai/core/dist/index.mjs';

/**
 * Provider/model readiness check.
 *
 * SAFETY: this module must never return, log, or otherwise expose credential
 * material -- not the value, not a prefix, not a length. It reports presence
 * only. See CLAUDE_BUILD_TASK.md ("Do not read credentials from unrelated
 * projects or put keys in status/logs").
 */

export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'deepseek';

export interface RuntimeConfigCheck {
  ready: boolean;
  provider: string;
  model: string;
  reason?: string;
}

interface ProviderRequirement {
  /** Env vars that must be present and non-empty. */
  required: string[];
  defaultModel: string;
  /**
   * The `provider` string the installed package puts on its ModelSpecification.
   * These do NOT always equal our provider id: verified in 4.0.5, Gemini models
   * are tagged `google`, and DeepSeek models are tagged `deepseek` while being
   * served through the OpenAI endpoint.
   */
  specProvider: string;
}

const PROVIDERS: Record<ProviderId, ProviderRequirement> = {
  openai: { required: ['OPENAI_API_KEY'], defaultModel: 'gpt-5.4-nano', specProvider: 'openai' },
  anthropic: { required: ['ANTHROPIC_API_KEY'], defaultModel: 'claude-haiku-4-5', specProvider: 'anthropic' },
  gemini: { required: ['GEMINI_API_KEY'], defaultModel: 'gemini-3.5-flash', specProvider: 'google' },
  // Verified in @mozaik-ai/core@4.0.5: DeepSeek models are wired through
  // OpenAIChatCompletions, so they read the OpenAI SDK's env vars.
  deepseek: { required: ['OPENAI_API_KEY', 'OPENAI_BASE_URL'], defaultModel: 'deepseek-v4-flash', specProvider: 'deepseek' },
};

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value);
}

function present(env: NodeJS.ProcessEnv, name: string): boolean {
  const raw = env[name];
  return typeof raw === 'string' && raw.trim().length > 0;
}

/** Model names bundled with the installed package, read from the package itself. */
export function installedModelNames(): { name: string; provider: string }[] {
  return supportedModels
    .map((entry) => {
      const spec = (entry as { specification?: { name?: unknown; provider?: unknown } }).specification;
      return {
        name: typeof spec?.name === 'string' ? spec.name : '',
        provider: typeof spec?.provider === 'string' ? spec.provider : '',
      };
    })
    .filter((m) => m.name !== '');
}

/**
 * Reports whether a live provider run is possible. Does not perform any
 * network call -- readiness here means "configured", never "reachable".
 * Only an executed smoke run can establish that a provider actually works.
 */
export function checkRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfigCheck {
  const requested = (env.SPECULATE_PROVIDER ?? 'openai').trim().toLowerCase();

  if (!isProviderId(requested)) {
    return {
      ready: false,
      provider: requested,
      model: '',
      reason: `Unknown SPECULATE_PROVIDER "${requested}". Expected one of: ${PROVIDER_IDS.join(', ')}.`,
    };
  }

  const requirement = PROVIDERS[requested];
  const model = (env.SPECULATE_MODEL ?? '').trim() || requirement.defaultModel;
  const known = installedModelNames();
  const match = known.find((m) => m.name === model);

  if (!match) {
    return {
      ready: false,
      provider: requested,
      model,
      reason:
        `Model "${model}" is not bundled with the installed @mozaik-ai/core. ` +
        `Available: ${known.map((m) => m.name).join(', ')}.`,
    };
  }

  // DeepSeek is routed through the OpenAI endpoint, so its specification
  // provider is "deepseek" while its credentials are OpenAI's. Compare against
  // the specification rather than assuming they agree.
  if (match.provider !== requirement.specProvider) {
    return {
      ready: false,
      provider: requested,
      model,
      reason: `Model "${model}" belongs to provider "${match.provider}", not "${requested}".`,
    };
  }

  const missing = requirement.required.filter((name) => !present(env, name));
  if (missing.length > 0) {
    return {
      ready: false,
      provider: requested,
      model,
      reason: `Missing required environment variable(s): ${missing.join(', ')}. Copy .env.example to .env.`,
    };
  }

  // Collision guard for a real trap in 4.0.5: OpenAI and DeepSeek read the same
  // env vars. If OPENAI_BASE_URL is set while provider is plain openai, calls
  // are silently redirected to a non-OpenAI host.
  if (requested === 'openai' && present(env, 'OPENAI_BASE_URL')) {
    return {
      ready: false,
      provider: requested,
      model,
      reason:
        'OPENAI_BASE_URL is set while SPECULATE_PROVIDER=openai. ' +
        'OpenAI and DeepSeek share these variables; unset OPENAI_BASE_URL, or use SPECULATE_PROVIDER=deepseek.',
    };
  }

  return { ready: true, provider: requested, model };
}
