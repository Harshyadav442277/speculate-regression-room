// 4.0.5 ships the same API as CJS and ESM but has no conditional exports map.
// Use its shipped ESM entry on Node hosts that disallow CJS require(ESM).
// The declarations shipped by the pinned package describe both builds.
declare module '@mozaik-ai/core/dist/index.mjs' {
  export * from '@mozaik-ai/core';
}
