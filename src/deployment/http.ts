import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { quoteSchema } from '../core/quote-contract.js';

export const hostedRunSchema = z.object({ fixture: z.enum(['discount-twice', 'tax-twice', 'correct']), policy: z.enum(['cooperative', 'independent', 'single']), failingInput: quoteSchema }).strict();
export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function applicationRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  return (!origin || origin === new URL(request.url).origin) && request.headers.get('x-speculate') === '1' && !!request.headers.get('content-type')?.startsWith('application/json');
}
export async function smallJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') ?? 0) > 16384) throw new Error('Request too large');
  const text = await request.text();
  if (Buffer.byteLength(text) > 16384) throw new Error('Request too large');
  return JSON.parse(text);
}
export function permittedLiveRun(request: Request): boolean {
  const expected = process.env.SPECULATE_RUN_TOKEN?.trim();
  const supplied = request.headers.get('x-speculate-access') ?? '';
  if (!expected || expected.length < 16 || supplied.length > 512) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
