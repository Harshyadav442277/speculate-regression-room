import { investigationStream } from '../src/deployment/stream.js';
import { applicationRequest, hostedRunSchema, json, permittedLiveRun, smallJson } from '../src/deployment/http.js';

export async function POST(request: Request): Promise<Response> {
  if (!applicationRequest(request)) return json({ error: 'Same-origin application request required.' }, 403);
  let parsed;
  try { parsed = hostedRunSchema.safeParse(await smallJson(request)); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (!parsed.success) return json({ error: 'Provide valid bounded quote inputs.' }, 400);
  if (!permittedLiveRun(request)) return json({ error: 'Enter the private demo access code to run the hosted investigators.' }, 403);
  let runtime;
  try { runtime = await import('../src/runtime/index.js'); }
  catch { return json({ error: 'The investigation runtime is unavailable. Open a recorded run while setup is repaired.' }, 503); }
  if (!runtime.checkRuntimeConfig().ready) return json({ error: 'The hosted AI provider is not configured yet.' }, 503);
  return investigationStream(request, runtime.runInvestigation, parsed.data, 'live');
}
