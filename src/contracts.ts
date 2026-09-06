export type AgentId = 'pricing' | 'tax' | 'generalist';
export type Policy = 'cooperative' | 'independent' | 'single';
export interface QuoteInput {
  unitPriceCents: number;
  quantity: number;
  discountBps: number;
  taxBps: number;
}
export interface Evidence {
  id: string;
  revision: number;
  agentId: AgentId;
  input: QuoteInput;
  expectedCents: number;
  actualCents: number;
  passed: boolean;
  purpose: string;
  elapsedMs: number;
}
export interface RunEvent {
  runId: string;
  sequence: number;
  elapsedMs: number;
  timestamp: string;
  type: string;
  agentId?: AgentId;
  data: Record<string, unknown>;
}
export interface Conclusion {
  summary: string;
  evidenceIds: string[];
  unresolved: string[];
}
export interface RuntimeHost {
  readonly runId: string;
  readonly signal: AbortSignal;
  readonly failingInput: Readonly<QuoteInput>;
  readonly contract: string;
  getEvidence(): readonly Evidence[];
  probe(agentId: AgentId, input: QuoteInput, purpose: string): Promise<Evidence>;
  record(type: string, agentId: AgentId | undefined, data: Record<string, unknown>): void;
  conclude(agentId: AgentId, conclusion: Conclusion): void;
}
export interface RuntimeOptions {
  policy: Policy;
  maxModelRequests: number;
  modelTimeoutMs: number;
}
export interface RuntimeResult {
  modelRequests: number;
  usage: { inputTokens: number; outputTokens: number } | null;
  model: string;
  provider: string;
}
export type RuntimeDriver = (host: RuntimeHost, options: RuntimeOptions) => Promise<RuntimeResult>;
