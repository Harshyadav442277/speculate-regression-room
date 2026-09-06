# Isolated Mozaik source review

Checked September 5, 2026, approximately 22:14 IST, with Node v24.19.0.

This is a narrow control-flow experiment for reviewing the proposed CROSSTALK / SPECULATE mechanisms. It is not an application, installed-package test, or provider-backed run. No model calls were made.

## Source provenance

Upstream: [jigjoy-ai/mozaik](https://github.com/jigjoy-ai/mozaik/tree/8f6b198cfae64026b157a17ed054a0d459abae76), commit `8f6b198cfae64026b157a17ed054a0d459abae76`. The package manifest at this commit says `4.0.5`. This does not independently prove the npm tarball has identical bytes.

`agent-loop.ts` and `inference-streaming.ts` contain upstream implementations with only their type-dependency import lines removed and provenance comments added. Their control flow is unchanged. The original MIT license is preserved in `LICENSE.mozaik`.

`check.ts` supplies fake state execution, a fake inference stream, fake peer evidence, and a resolver. Node's experimental TypeScript transform executes the copied control flow without installing dependencies. The mocks deliberately avoid pretending to represent a real inference provider or full Mozaik runtime.

## Reproduce

From the project root:

```powershell
node --experimental-transform-types research/runtime-review/check.ts
```

## Observed result

Exit code 0; result `PASS`. The relevant ordering was:

```text
A.inference.started
A.chunk.1
B.evidence.arrived
A.chunk.2
A.inference.completed
A.interception.started
A.interception.finished
A.model_message
```

The second chunk was consumed after peer evidence arrived. The interceptor then diverted the next transition, and the mocked tool-call counter remained zero. This establishes the difference between allowing a current generation to finish and preventing a subsequent action in this control flow.

The final negative check deliberately bypasses the type contract and redirects to `idle`; the harness executor rejects that state. The upstream interception signature returns `ExecutableTransition`, which explicitly excludes `idle`, and the upstream executor has no `idle` execution case. A bare cast to `idle` is therefore not a supported cancellation mechanism. Redirecting to `model_message` requires a correctly formed answer; our harness does not validate that object's full production contract.

## Limits and implication

The built-in loop invokes interception between awaited state executions. Its streaming state does not consult the interceptor for each chunk. Consequently, this mechanism does not abort already-running provider generation. A custom runner might implement explicit cancellation, but that is separate, unimplemented work requiring provider-specific validation and correct termination output.

Use this result to correct the pitch to “peer evidence prevents the next redundant test.” Do not claim mid-word provider cancellation, token savings, physical-machine diagnosis, or full runtime compatibility from this experiment. A next-step full-package/provider spike is still necessary.
