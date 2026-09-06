import { z } from 'zod';
import type { QuoteInput } from '../contracts.js';

export const quoteSchema = z.object({
  unitPriceCents: z.number().int().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(100),
  discountBps: z.number().int().min(0).max(10_000),
  taxBps: z.number().int().min(0).max(10_000),
}).strict();

export const DEFAULT_INPUT: QuoteInput = Object.freeze({
  unitPriceCents: 10_000, quantity: 2, discountBps: 1000, taxBps: 500,
});

export const QUOTE_CONTRACT = 'All amounts are integer cents. Multiply unit price by quantity. Apply the discount once, then round half up to a whole cent. Apply tax once to the discounted amount, then round half up to a whole cent. Rates are integer basis points (10000 = 100%).';

// Independent exact-integer reference: does not call the fixture implementation.
export function expectedQuote(value: QuoteInput): number {
  const input = quoteSchema.parse(value);
  const roundBps = (value: bigint) => (value + 5000n) / 10000n;
  const subtotal = BigInt(input.unitPriceCents) * BigInt(input.quantity);
  const discounted = roundBps(subtotal * BigInt(10_000 - input.discountBps));
  return Number(roundBps(discounted * BigInt(10_000 + input.taxBps)));
}

export function quoteFingerprint(value: QuoteInput): string {
  const input = quoteSchema.parse(value);
  return [input.unitPriceCents, input.quantity, input.discountBps, input.taxBps].join(':');
}
