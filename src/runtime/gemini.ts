import { GeminiGenerateContent, FunctionCallItem, ModelMessageItem, type ContextItem } from '@mozaik-ai/core/dist/index.mjs';

/** Mozaik 4.0.5 drops Gemini's opaque signatures when mapping tool calls.
 * Preserve provider parts in memory for this run; never put them in the ledger.
 * https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures
 */
export function geminiEndpoint(): GeminiGenerateContent {
  const endpoint = new GeminiGenerateContent();
  const original = endpoint.endpointMapper;
  const parts = new WeakMap<ContextItem, Record<string, unknown>>();
  endpoint.endpointMapper = {
    toRequest(input) {
      const request = original.toRequest(input);
      const modelItems = input.context.getItems().filter(item =>
        item instanceof FunctionCallItem || item instanceof ModelMessageItem);
      let index = 0;
      for (const content of request.contents ?? []) {
        if (content.role !== 'model') continue;
        content.parts = content.parts.map((part: Record<string, unknown>) => {
          const item = modelItems[index++];
          return item ? (parts.get(item) ?? part) : part;
        });
      }
      return request;
    },
    toResponse(response) {
      const output = original.toResponse(response);
      const providerParts = response.candidates?.[0]?.content?.parts ?? [];
      let index = 0;
      for (const part of providerParts) {
        // These are exactly the parts represented by the installed mapper.
        if (!part.text && !part.functionCall) continue;
        const item = output.items[index++];
        if (item) parts.set(item, structuredClone(part));
      }
      return output;
    },
  };
  return endpoint;
}
