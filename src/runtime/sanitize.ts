/**
 * Bounded, non-leaking descriptions of failures.
 *
 * Provider and HTTP client errors routinely carry request URLs, headers,
 * response bodies and occasionally credential material. None of that may reach
 * an event log or a run artifact, so raw `error.message` is never recorded.
 * Only a coarse code, an optional numeric status, and the stage are kept.
 */

export interface SafeFailure {
  code: string;
  status?: number;
  stage: string;
}

const KNOWN_CODES = new Set([
  'RUN_CLOSED',
  'RUN_ABORTED',
  'RUN_CANCELLED',
  'RUN_TIMEOUT',
  'MODEL_BUDGET',
  'PROBE_BUDGET',
  'PROBE_HTTP',
  'PROBE_RESPONSE',
  'PROBE_UNAVAILABLE',
  'INVALID_PURPOSE',
  'INVALID_PROVENANCE',
  'INVALID_REVISION',
  'INVALID_CONCLUSION',
  'DUPLICATE_CONCLUSION',
]);

function numericStatus(error: unknown): number | undefined {
  const candidate = (error as { status?: unknown; statusCode?: unknown })?.status ??
    (error as { statusCode?: unknown })?.statusCode;
  return typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 100 && candidate < 600
    ? candidate
    : undefined;
}

export function sanitizeFailure(error: unknown, stage: string): SafeFailure {
  const status = numericStatus(error);

  // Errors the project defines itself carry a safe, enumerated code.
  const declared = (error as { code?: unknown })?.code;
  if (typeof declared === 'string' && KNOWN_CODES.has(declared)) {
    return { code: declared, ...(status !== undefined ? { status } : {}), stage };
  }

  const name = error instanceof Error ? error.name : '';
  if (name === 'RuntimeTimeoutError') return { code: 'MODEL_TIMEOUT', stage };
  if (name === 'AbortError') return { code: 'ABORTED', stage };
  if (status !== undefined) return { code: 'PROVIDER_HTTP', status, stage };

  // Anything else is deliberately opaque. The operator can reproduce locally;
  // the artifact must not carry provider text.
  return { code: 'PROVIDER_FAILED', stage };
}

/** Stable ordering so equivalent JSON compares equal regardless of key order. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

/**
 * Canonical form of a tool call's arguments.
 *
 * Raw argument strings differ on whitespace and key order for identical work,
 * so comparing them would report an unchanged action as changed. Call ids are
 * never part of the comparison: a different id is not different work.
 */
export function canonicalArgs(args: string): string {
  try {
    return JSON.stringify(sortKeys(JSON.parse(args)));
  } catch {
    return args.trim();
  }
}

export function sameAction(a: { tool: string; args: string }, b: { tool: string; args: string }): boolean {
  return a.tool === b.tool && canonicalArgs(a.args) === canonicalArgs(b.args);
}
