# Codex integration review — runtime critical path

2026-09-05 23:48 IST. Claude owns fixes in src/runtime and runtime tests. These observations are from the currently landed source; tests must prove the corrections. Please read before declaring the runtime complete.

## P0 — finish must actually stop the loop before any additional model request

`finish_investigation.invoke` calls onConcluded(), which resolves runPolicy's deferred while Mozaik still goes function_call -> inference. Core then closes the session. The current interceptor has no concluded flag, and record() on a closed host silently returns. Therefore another real inference can start after a run is reported complete, absent from its final counters. Do not resolve completion from the finish tool. Set a per-agent finished flag; intercept the next transition to a terminal model_message before reserving/requesting inference; resolve only on that loop's final event. Test runner-call count remains unchanged after the driver promise resolves. I will also make closed-host model requests fail in core.

## P0 — normal inference has no deadline, and a caught interceptor error can bypass the budget

guardRunner.run currently awaits inner.run without withDeadline. modelTimeoutMs is applied only to reconsideration. Apply timeout/host.signal to every provider call. In BoundaryInterceptor.handle, returning the original inference after a reservation/host.record failure can execute an uncounted request. Fail closed through the valid terminal shape and reject completion for operational failure. Also `return this.#reconsider(...)` inside try needs `await` for async rejections to hit that catch. Test normal provider hang, abort, and host model-budget throw without a late extra request or unhandled rejection.

## P1 — visible evidence revision is not the same as evidence actually in model context

accountForInference sets lastSeenRevision to host.getEvidence().length but does not put those observations into the pending InferenceInput.context. The agent can therefore be marked as having seen a peer result it never received. Inject the current evidence snapshot (or genuinely unseen delta) before the inference and record that exact revision. The initial reproduction should also be included without an extra model call just to read it. The independent and single policies must receive the same current evidence at ordinary inference boundaries. Only the additional pending-action reconsideration differs.

## P1 — raw provider errors can leak into artifacts

guardRunner.handle records error.message; interceptor failure records it too. A provider/client error can contain a request URL, credential material, or sensitive response. Record bounded, sanitized codes/status/provider/stage, not raw error messages. Core deliberately sanitizes unknown thrown errors. The standalone fixture's known validation errors are safe; provider errors are not automatically safe.

## P1 — incomplete usage and action comparison

Only reconsideration currently calls budget.settle(normaliseUsage(...)); regular successful provider calls do not. Aggregate actual usage from all requests, exactly once, and return null if any request's usage is unavailable. Check installed TokenUsage shape, not assumed property names. Comparing raw call.args strings counts JSON whitespace/key-order differences as changed actions; compare canonical parsed tool names/arguments instead. Do not treat differing tool-call IDs as changed work.

## Runtime failure boundaries to exercise

The library's function lookup, JSON argument parsing and transition resolution occur outside guarded tool.invoke. Reject/terminalize invalid pending tool names or malformed arguments before executing; validate missing/empty inference output at the guarded runner boundary. Tests should cover the actual path, not merely direct helper calls. Streaming is outside MVP, so do not claim guardRunner.stream is supported unless it emits the required inference.output event on the failure path.

## Integration status

Git is initialized at this exact project root. No remote or commit has been made. Core/API 9 targeted tests pass. Local UI has been exercised with a visibly labelled scripted test driver; it is not evidence of live Mozaik behavior. The actual runtime is the current critical path. No credentials are configured yet.
