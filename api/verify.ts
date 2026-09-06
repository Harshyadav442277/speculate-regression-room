import { z } from 'zod';
import { quoteSchema, expectedQuote } from '../src/core/quote-contract.js';
import { verifyCorrectedFixture } from '../src/core/verification.js';
import { applicationRequest, json, smallJson } from '../src/deployment/http.js';

const schema = z.object({ evidence: z.array(z.object({ id: z.string().min(1).max(100), input: quoteSchema }).strict()).min(1).max(12) }).strict();
export async function POST(request: Request): Promise<Response> {
  if (!applicationRequest(request)) return json({ error: 'Same-origin application request required.' }, 403);
  try {
    const value = schema.parse(await smallJson(request));
    const evidence = value.evidence.map(e => ({ ...e, expectedCents: expectedQuote(e.input) }));
    const result = await verifyCorrectedFixture({ evidence });
    return json(result);
  } catch { return json({ error: 'Provide one to twelve valid captured probe inputs.' }, 400); }
}
