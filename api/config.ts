import { json } from '../src/deployment/http.js';

export async function GET(): Promise<Response> {
  let config;
  try { config = (await import('../src/runtime/config.js')).checkRuntimeConfig(); }
  catch { return json({ ready: false, execution: 'live', transport: 'post-stream', requiresAccessCode: true,
    reason: 'The investigation runtime is unavailable. Recorded runs can still be opened and their saved cases checked.' }); }
  const protectedRuns = (process.env.SPECULATE_RUN_TOKEN?.trim().length ?? 0) >= 16;
  return json({ ...config, ready: config.ready && protectedRuns, execution: 'live', transport: 'post-stream', requiresAccessCode: true,
    reason: !config.ready ? 'The hosted AI provider has not been configured yet. Recorded runs can still be opened.' : !protectedRuns ? 'The private demo access code has not been configured yet.' : undefined });
}
