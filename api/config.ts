import { checkRuntimeConfig } from '../src/runtime/index.js';
import { json } from '../src/deployment/http.js';

export function GET(): Response {
  const config = checkRuntimeConfig();
  const protectedRuns = (process.env.SPECULATE_RUN_TOKEN?.trim().length ?? 0) >= 16;
  return json({ ...config, ready: config.ready && protectedRuns, execution: 'live', transport: 'post-stream', requiresAccessCode: true,
    reason: !config.ready ? 'The hosted AI provider has not been configured yet. Recorded runs can still be opened.' : !protectedRuns ? 'The private demo access code has not been configured yet.' : undefined });
}
