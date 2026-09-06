import { createQuoteServer } from '../../research/checkout-fixture/quote-service.mjs';
import type { Evidence } from '../contracts.js';

export interface RegressionVerification {
  target: 'prebuilt-corrected-fixture';
  cases: number;
  failures: number;
  results: { evidenceId: string; expectedCents: number; actualCents: number; passed: boolean }[];
}

export async function verifyCorrectedFixture(artifact: { evidence: readonly Pick<Evidence, 'id' | 'input' | 'expectedCents'>[] }): Promise<RegressionVerification> {
  if (!artifact.evidence.length) throw new Error('There is no captured evidence to verify.');
  const server = createQuoteServer('correct');
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Corrected fixture failed to bind.');
    const results: RegressionVerification['results'] = [];
    for (const evidence of artifact.evidence) {
      const response = await fetch(`http://127.0.0.1:${address.port}/quote`, { method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evidence.input), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Corrected fixture returned HTTP ${response.status}.`);
      const result = await response.json() as { totalCents: number };
      if (!Number.isSafeInteger(result.totalCents)) throw new Error('Malformed corrected quote.');
      results.push({ evidenceId: evidence.id, expectedCents: evidence.expectedCents, actualCents: result.totalCents, passed: result.totalCents === evidence.expectedCents });
    }
    return { target: 'prebuilt-corrected-fixture', cases: results.length, failures: results.filter(result => !result.passed).length, results };
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
