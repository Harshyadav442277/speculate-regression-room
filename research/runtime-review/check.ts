// This checks copied upstream control flow with fake collaborators and inference.
// It is NOT an installed-package, provider, token-cost, or product test.
import assert from 'node:assert/strict';
import { AgentLoop } from './agent-loop.ts';
import { InferenceStreamingState } from './inference-streaming.ts';

const trace: string[] = [];
let evidenceArrived = false;
let toolCalls = 0;
let releaseStream: () => void;
let announceFirstChunk: () => void;
const firstChunk = new Promise<void>(resolve => { announceFirstChunk = resolve; });
const resumeStream = new Promise<void>(resolve => { releaseStream = resolve; });

const visitor = {
  visitInferenceStarted: () => trace.push('A.inference.started'),
  visitInferenceEvent: (event: any) => {
    if (event.type === 'chunk') {
      trace.push(`A.chunk.${event.payload}`);
      if (event.payload === 1) announceFirstChunk();
    }
  },
  visitInferenceCompleted: () => trace.push('A.inference.completed'),
  visitInterceptionStarted: () => trace.push('A.interception.started'),
  visitInterceptionFinished: () => trace.push('A.interception.finished'),
};

const streaming = new InferenceStreamingState({
  async *stream() {
    yield { type: 'chunk', payload: 1 };
    await resumeStream;
    yield { type: 'chunk', payload: 2 };
    yield { type: 'inference.output', payload: { items: [], tokenUsage: undefined } };
  },
} as any);

const executor = {
  async execute(transition: any, currentVisitor: any) {
    switch (transition.nextStateId) {
      case 'message_received':
        return { stateId: 'message_received', input: transition.input, output: {} };
      case 'inference_streaming':
        return streaming.run(transition.input, currentVisitor);
      case 'function_call':
        toolCalls++;
        return { stateId: 'function_call', input: {}, output: {} };
      case 'model_message':
        trace.push('A.model_message');
        return { stateId: 'model_message', input: transition.input, output: undefined };
      default:
        throw new Error(`Unsupported executable state: ${transition.nextStateId}`);
    }
  },
};
const resolver = {
  resolve(execution: any) {
    const next = {
      message_received: 'inference_streaming',
      inference_streaming: 'function_call',
      function_call: 'model_message',
      model_message: 'idle',
    }[execution.stateId];
    return { nextStateId: next, input: {} };
  },
};
const interceptor = {
  isSatisfiedBy: (transition: any) => evidenceArrived && transition.nextStateId === 'function_call',
  async handle() {
    return { nextStateId: 'model_message', input: { answer: { content: { text: 'Branch closed' } } } };
  },
};

const a = AgentLoop.create(executor as any, resolver as any, interceptor as any);
const runA = a.run({ content: 'fixture', input: {} } as any, visitor as any);
await firstChunk;
const b = AgentLoop.create({
  async execute() {
    evidenceArrived = true;
    trace.push('B.evidence.arrived');
    releaseStream();
    return { stateId: 'model_message', input: {}, output: undefined };
  },
} as any, { resolve: () => ({ nextStateId: 'idle', input: undefined }) } as any);
await b.run({ content: 'peer evidence', input: {} } as any, {} as any);
await runA;

assert(trace.indexOf('B.evidence.arrived') < trace.indexOf('A.chunk.2'));
assert(trace.indexOf('A.inference.completed') < trace.indexOf('A.interception.started'));
assert.equal(toolCalls, 0);

// Deliberately bypass the public type contract to show why forcing idle is invalid.
const invalid = AgentLoop.create(executor as any, resolver as any, {
  isSatisfiedBy: () => true,
  handle: async () => ({ nextStateId: 'idle', input: undefined }),
} as any);
await assert.rejects(
  invalid.run({ content: 'invalid transition', input: {} } as any, visitor as any),
  /Unsupported executable state: idle/,
);

console.log(JSON.stringify({
  scope: 'Upstream source control flow with fake collaborators and fake inference only',
  upstreamCommit: '8f6b198cfae64026b157a17ed054a0d459abae76',
  actualProviderCalls: 0,
  trace: trace.slice(0, trace.indexOf('A.model_message') + 1),
  continuedStreamingAfterPeerEvidence: true,
  interceptedBeforeNextTool: true,
  actualToolCalls: toolCalls,
  forcedIdleRejectedByHarnessExecutor: true,
  result: 'PASS',
}, null, 2));
