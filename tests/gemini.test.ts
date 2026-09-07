import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { FunctionCallOutputItem, ModelContext } from '@mozaik-ai/core/dist/index.mjs';
import { geminiEndpoint } from '../src/runtime/gemini.js';

test('Gemini tool history retains exact provider signatures without exposing them on context items', () => {
  const mapper = geminiEndpoint().endpointMapper;
  const firstPart = { functionCall: { id: 'call-a', name: 'probe_quote', args: { quantity: 2 } }, thoughtSignature: 'opaque-test-a' };
  const secondPart = { functionCall: { id: 'call-b', name: 'probe_quote', args: { quantity: 3 } }, thoughtSignature: 'opaque-test-b' };
  const first = mapper.toResponse({ candidates: [{ content: { parts: [firstPart] } }] });
  const second = mapper.toResponse({ candidates: [{ content: { parts: [secondPart] } }] });
  for (const [output, part] of [[first, firstPart], [second, secondPart]] as const) {
    const context = new ModelContext('agent', [...output.items,
      FunctionCallOutputItem.create(part.functionCall.id, '{"total":100}')]);
    const request = mapper.toRequest({ model: 'gemini-3.5-flash', context, streaming: false });
    assert.deepEqual(request.contents[0].parts[0], part);
    assert.equal(request.contents[1].parts[0].functionResponse.id, part.functionCall.id);
    assert.equal(JSON.stringify(output.items).includes(part.thoughtSignature), false);
  }
});
