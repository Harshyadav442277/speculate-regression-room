import type { Tool } from '@mozaik-ai/core/dist/index.mjs';
import type { AgentId, RuntimeHost } from '../contracts.js';

/**
 * Agent-facing surface.
 *
 * Every observation goes through RuntimeHost. Agents never see fixture source,
 * the operator variant, or any hidden answer table -- ARCHITECTURE.md forbids
 * putting those in agent context, and the whole credibility of the result
 * depends on it.
 */

export interface AgentSpec {
  id: AgentId;
  name: string;
  /** Different starting priority; identical capability and tool access. */
  instruction: (host: RuntimeHost) => string;
}

const SHARED_RULES = `
You are investigating why a checkout quote service returns a wrong total.

The written contract is authoritative:
%CONTRACT%

Rules you must follow:
- Learn only by calling probe_quote. Never guess a service result.
- probe_quote returns the service's actual total and the contract's expected
  total. A probe that passes is still useful evidence.
- read_evidence shows every probe run so far, including your colleague's. Their
  results are as valid as your own; do not re-run an input that already has
  evidence unless you need it at a different revision.
- Keep probes few and deliberate. You share a strict budget with your colleague.
- Finish with finish_investigation, citing the evidence IDs that actually
  support your explanation, and listing anything still unresolved. Do not claim
  certainty you have not earned.
`.trim();

function instructionFor(priority: string) {
  return (host: RuntimeHost) =>
    `${SHARED_RULES.replace('%CONTRACT%', host.contract)}\n\nYour starting priority: ${priority}\n\n` +
    `This is a starting priority, not a restriction. If the evidence points elsewhere, follow the evidence and say so.`;
}

export const AGENT_SPECS: readonly AgentSpec[] = [
  {
    id: 'pricing',
    name: 'Pricing investigator',
    instruction: instructionFor(
      'Investigate the pricing and discount stage: compare its behavior with the written contract. Do not assume this stage is faulty.',
    ),
  },
  {
    id: 'tax',
    name: 'Tax investigator',
    instruction: instructionFor(
      'Investigate the tax stage: compare its behavior with the written contract. Do not assume this stage is faulty.',
    ),
  },
];

export const GENERALIST_SPEC: AgentSpec = {
  id: 'generalist',
  name: 'Generalist investigator',
  instruction: instructionFor(
    'Consider the discount stage and the tax stage. Order probes so that each one can rule something out, ' +
      'and stop as soon as the evidence identifies the faulty stage.',
  ),
};

const QUOTE_PARAMS = {
  type: 'object',
  properties: {
    unitPriceCents: { type: 'integer', minimum: 0, maximum: 1000000 },
    quantity: { type: 'integer', minimum: 1, maximum: 100 },
    discountBps: { type: 'integer', minimum: 0, maximum: 10000 },
    taxBps: { type: 'integer', minimum: 0, maximum: 10000 },
    purpose: { type: 'string', description: 'What this probe is meant to rule in or out.' },
  },
  required: ['unitPriceCents', 'quantity', 'discountBps', 'taxBps', 'purpose'],
  additionalProperties: false,
} as const;

/** Serialisable evidence view. Never exposes anything the host did not observe. */
function evidenceView(host: RuntimeHost) {
  return host.getEvidence().map((e) => ({
    id: e.id,
    revision: e.revision,
    byAgent: e.agentId,
    input: e.input,
    expectedCents: e.expectedCents,
    actualCents: e.actualCents,
    passed: e.passed,
    purpose: e.purpose,
  }));
}

export function buildTools(
  host: RuntimeHost,
  agentId: AgentId,
  onConcluded: () => void,
): Tool[] {
  return [
    {
      type: 'function',
      name: 'probe_quote',
      description:
        'Run one input against the quote service. Returns the service total and the contract-expected total.',
      parameters: QUOTE_PARAMS as unknown as Record<string, unknown>,
      strict: true,
      invoke: async (args: Record<string, unknown>) => {
        const { purpose, ...input } = args as {
          purpose: string;
          unitPriceCents: number;
          quantity: number;
          discountBps: number;
          taxBps: number;
        };
        const evidence = await host.probe(agentId, input, purpose);
        return {
          evidenceId: evidence.id,
          revision: evidence.revision,
          input: evidence.input,
          serviceTotalCents: evidence.actualCents,
          contractExpectedCents: evidence.expectedCents,
          matchesContract: evidence.passed,
        };
      },
    },
    {
      type: 'function',
      name: 'read_evidence',
      description: 'Every probe result so far, from both investigators.',
      parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
      strict: true,
      invoke: async () => ({ evidence: evidenceView(host), revision: host.getEvidence().length }),
    },
    {
      type: 'function',
      name: 'record_hypothesis',
      description:
        'Record your current explanation and whether you maintain, revise or retract it. This records your judgment; it is not a correctness check.',
      parameters: {
        type: 'object',
        properties: {
          hypothesis: { type: 'string' },
          stance: { type: 'string', enum: ['maintain', 'revise', 'retract'] },
          evidenceIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['hypothesis', 'stance', 'evidenceIds'],
        additionalProperties: false,
      },
      strict: true,
      invoke: async (args: { hypothesis: string; stance: string; evidenceIds: string[] }) => {
        host.record('hypothesis.revised', agentId, {
          hypothesis: args.hypothesis,
          stance: args.stance,
          evidenceIds: args.evidenceIds,
          evidenceRevision: host.getEvidence().length,
        });
        return { recorded: true };
      },
    },
    {
      type: 'function',
      name: 'finish_investigation',
      description: 'Record your final explanation with the evidence that supports it, then stop.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          evidenceIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
          unresolved: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'evidenceIds', 'unresolved'],
        additionalProperties: false,
      },
      strict: true,
      invoke: async (args: { summary: string; evidenceIds: string[]; unresolved: string[] }) => {
        host.conclude(agentId, {
          summary: args.summary,
          evidenceIds: args.evidenceIds,
          unresolved: args.unresolved ?? [],
        });
        onConcluded();
        return { recorded: true };
      },
    },
  ];
}
