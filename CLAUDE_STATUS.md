# CLAUDE_STATUS.md

Owner: Claude. Updated 2026-09-05 ~23:25 IST.

## Acknowledgment

Read `CLAUDE_BUILD_TASK.md`, `FINAL_IDEA.md`, `EXECUTION.md`, `ARCHITECTURE.md`, `src/contracts.ts`, and the current `CODEX_IDEAS.md` (through the reciprocal review). **Assignment accepted. Ideation stopped.**

I own **`src/runtime/**`, `tests/runtime*`, and this file** — nothing else. I will not edit `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `src/contracts.ts`, `src/core/**`, `tests/core*`, `scripts/**`, the six project documents, or either idea file. Contract and dependency requests go in §"Requests to Codex" below, not into shared files. No package installs will be run from this session.

Interface I will deliver from `src/runtime/index.ts`:
- `export const runInvestigation: RuntimeDriver` — `(host: RuntimeHost, options: RuntimeOptions) => Promise<RuntimeResult>`
- `export function checkRuntimeConfig(): { ready: boolean; provider: string; model: string; reason?: string }` — **no credentials, no key fragments, no lengths.** Presence-only.

## Readiness check — installed package verified

`node_modules/@mozaik-ai/core/package.json` → **`4.0.5`**, `dist/` present (`index.js`, `index.mjs`, `index.d.ts`, `index.d.mts`). Node **v24.19.0**. Root `package.json` is `"type": "module"`, engines `>=22`.

I re-verified my earlier upstream source findings **against the installed declarations** (`dist/index.d.ts`, 628 lines) rather than trusting docs or my own prior notes:

| Claim | Installed declaration | Verdict |
|---|---|---|
| First loop state is `message_received`, **not** `context_update` | `type LoopStateId = "message_received" \| "inference" \| "inference_streaming" \| "function_call" \| "model_message" \| "idle"` | **Confirmed.** The published docs' `context_update` does not exist in 4.0.5. A handler matching it never fires. |
| Interceptor cannot return `idle` | `type ExecutableLoopStateId = Exclude<LoopStateId, "idle">`; `handle(t: ExecutableTransition): Promise<ExecutableTransition>` | **Confirmed.** Terminal close must go through a correctly formed `model_message`. |
| `ModelMessageItem` constructible without inference | `static rehydrate(data: { text: string }): ModelMessageItem` (public; constructor private) | **Confirmed.** |
| Context mutable before inference | `ModelContext.addContextItem/addContextItems` | **Confirmed.** |
| `runLoop` is fire-and-forget | `runLoop: (...) => void` — returns `void`, no promise to await | **Confirmed.** This is the promise-management problem in task item 4. |
| Tool shape | `interface FunctionTool { type:"function"; name; description; parameters; strict; invoke }`, `type Tool = FunctionTool` | **Confirmed.** |

**Not yet verified by me and not claimed:** that any provider call succeeds; that two loops actually overlap at runtime; that a real pending action is reconsidered. Those are G1/G2 and are what I am building toward. **No provider call has been made from this session.**

## Position on the two leads Codex flagged

Both were accepted as "important leads, verify against the installed package." Verification result above: **the type-level facts hold.** Their *runtime* behaviour is still unproven and I will not report it as working until a test executes.

- **Terminal `model_message`** — I will use it only as the documented correction/close path at a boundary, with a correctly formed `ModelMessageItem`. I will **not** describe it as cancellation, and I will not claim token savings from it. Per ARCHITECTURE.md, a current call is allowed to finish.
- **Error isolation** — `EventProcessor.process` calls `handler.processor.apply(...)` with no `try/catch`, inside `RuntimeService.publish`'s loop over participants, so one throwing handler can end delivery to the rest. Per task item 4 I will **not** install a global `unhandledRejection` swallow. Instead: every handler body I own is wrapped, failures emit `agent.failed` evidence, and the run rejects cleanly through an explicit deferred that `runLoop`'s void return otherwise gives us no way to observe.

## Requests to Codex (I will not make these edits myself)

1. **`RuntimeResult.usage`** is typed `{ inputTokens: number; outputTokens: number } | null`. Mozaik's `InferenceOutput.tokenUsage` is `TokenUsage | undefined` and providers vary. I will return `null` when unavailable — never a fabricated `0`, per your instruction. **No contract change needed; flagging so the report layer does not coerce `null` to `0`.**
2. **Probe reservation.** `RuntimeHost.probe` is async. ARCHITECTURE.md requires an atomic synchronous reservation before the awaited probe to prevent duplicate ownership. That reservation lives in your host, not my driver. **Please confirm `probe()` already fingerprints and reserves synchronously on entry** — if not, two overlapping agents will double-execute the same input and the executed/reused counts will be wrong. This is the one thing that could silently corrupt the headline comparison.
3. **`AgentId` is a closed union** (`'pricing' | 'tax' | 'generalist'`). The `single` policy uses `generalist`. Confirmed usable as-is; no change requested.
4. **No dependency additions requested.** Everything I need is in `@mozaik-ai/core` + `zod` + Node built-ins.

## Milestones

| # | Milestone | State |
|---|---|---|
| M0 | Read task, verify installed package, acknowledge ownership | **Done** (this file) |
| M1 | `src/runtime/index.ts` skeleton + `checkRuntimeConfig()` + typecheck clean | **Done — executed, see log** |
| M2 | Two model participants, overlapping loops, tools bound to `host.probe`/`getEvidence`/`record`/`conclude` | **Next** |
| M3 | Cooperative boundary reconsideration emitting `action.reconsidered` with `before`/`after`/`peerEvidenceIds`/`changed` | Not started |
| M4 | `independent` ablation + `single` control, same tools/budgets, control not handicapped | Not started |
| M5 | Budgets, timeouts, `host.signal`, one-loop-per-participant, explicit promise failure handling | Not started |
| M6 | `tests/runtime*` against the installed package using a clearly labelled deterministic custom runner | Not started |
| M7 | Real-provider smoke, only if `.env` is configured; coordinate with Codex before any larger paid run | **Blocked — no credentials configured** |

## Blockers

- **M7 needs a local `.env`.** `.env.example` exists; `.env` does not. Until then I build and test against a **clearly labelled deterministic custom `InferenceRunner`**, which is test evidence only — never live AI, never a benchmark result.
- Awaiting Codex confirmation on request 2 (synchronous probe reservation).

## Honesty note

The verification table above is **type-declaration reading of the installed package** — stronger than docs or upstream source, but not execution.

What *has* executed is only M1: an import of the installed package, a registry read of its 12 bundled models, and 7 configuration assertions. That is the full extent of the runtime evidence in this project right now.

**Explicitly not established:** that any provider call works; that two Mozaik loops overlap; that a pending action is ever reconsidered on peer evidence; that cooperation beats either control. Those are G1/G2/G4 and remain unbuilt. `runInvestigation` currently throws for all three policies by design.

## Milestone log

### M1 — done 2026-09-05 ~23:35 IST

Files added (all within my ownership): `src/runtime/config.ts`, `src/runtime/budget.ts`, `src/runtime/index.ts`, `tests/runtime-config.smoke.ts`.

**`pnpm` is not on this shell's PATH**, so I invoked the local binaries directly. Both commands are reproducible from the repo root:

```
$ node node_modules/typescript/bin/tsc --noEmit
(no output)                                                    exit 0

$ node node_modules/tsx/dist/cli.mjs tests/runtime-config.smoke.ts
PASS  installed package exposes bundled models -- 12 models
PASS  unknown provider rejected
PASS  missing credential reported
PASS  unknown model rejected
PASS  OPENAI_BASE_URL collision caught
PASS  configured env reports ready -- openai/gpt-5.4-nano
PASS  no credential value echoed in reasons        7/7             exit 0
```

**First executed evidence in this project:** the installed `@mozaik-ai/core@4.0.5` imports at runtime and its `supportedModels` enumerates 12 models. This is an import + registry read. **No provider call was made and none is claimed.**

**The smoke test caught two real bugs in my own first draft**, both now fixed:
1. `present()` read `process.env` directly instead of the injected env object, so every injected-credential case silently consulted the real environment. Two assertions failed and exposed it.
2. Provider-id vs specification-provider mismatch (see request 5 below).

Delivered so far:
- `checkRuntimeConfig(env?)` — presence-only readiness. Returns `{ready, provider, model, reason?}`. No key value, prefix, or length is ever returned or logged. Validates the model against the **installed** bundled list rather than a hardcoded one.
- `ModelBudget` — synchronous `reserve()` before any model call, so two overlapping loops cannot both pass a check only one should. `usage()` returns `null` when no provider reported usage, never a fabricated `0`.
- `withDeadline()` — bounds how long we **wait**, and its docstring says so explicitly. It does not cancel the provider request; 4.0.5 exposes no cancellation path. This must never be described as a cancelled call.
- `runInvestigation` — config gating, budget wiring, `run.started` / `run.failed` recording. **All three policies deliberately throw `PolicyNotImplementedError`** rather than returning a plausible-looking empty result.

## Requests to Codex — addendum

5. **Gemini's specification provider is `google`, not `gemini`.** Verified by executing against the installed package: `gemini-3.5-flash(google)`, `gemini-3.1-pro-preview(google)`, while OpenAI/Anthropic/DeepSeek specs match their provider ids. Any code elsewhere that filters `supportedModels` by a `'gemini'` provider string will silently match nothing. I handle it in my own mapping; flagging in case the report or evaluation layer does the same comparison.
6. **`OPENAI_BASE_URL` collision** — DeepSeek is served through `OpenAIChatCompletions` and reads the same env vars as OpenAI. If both a real OpenAI key and a DeepSeek base URL are configured, calls are silently redirected. I reject that combination in `checkRuntimeConfig`. Worth mirroring in any `.env` documentation you own.

## Next step

M2: two model participants with overlapping loops, tools bound to `host.probe` / `getEvidence` / `record` / `conclude`, exercised through a clearly labelled deterministic custom `InferenceRunner` so it is testable with no credentials. Then M3's boundary reconsideration.

---

## 2026-09-05 ~23:45 IST — audit round 1 + integration fixes

**New file: `CLAUDE_AUDIT.md`** (mine, rolling). Independent review of your landed core, my improvisations, and ranked suggestions. Two items need your decision:

- **A7 🔴 BLOCKER — this project is not a git repository.** `git status` → `fatal: not a git repository`. Submission requires a judge-accessible repo. Worse: a `.git` exists at `C:/Users/hyada/.git`, so any `git add`/`commit` run from here walks *up* and resolves to the **home-directory repo** — staging could sweep the entire home directory into a repo intended to be public. `git init` must be run **inside this project** before any other git command. I have run no writing git command and will not; this is integration-level. **Who owns this — you or the user?**
- **A1 HIGH — `action.reconsidered` can be satisfied by the `generalist` seed evidence.** Your prose says treat the seed as initial context, but `record()` only checks `agentId !== peer.agentId`, so citing the seed passes validation and inflates the headline metric. Suggested ~5-line fix: capture `#evidence.length` at driver invocation as `driverStartRevision` and require cited peer evidence to have `revision > driverStartRevision`. This is the single highest-value change available right now — it makes the metric honest by construction rather than by convention.

Also in the audit: A2 failed probes stay cached in `#pending` and poison that input for the run; A3 dual model-request counters can produce a spurious `USAGE_MISMATCH`; A4 your `MODEL_BUDGET` throw can land in Mozaik's unprotected `EventProcessor` loop; A5 `JSON.stringify` drops `undefined` after validation has already passed.

**Verified your claims independently** — `tests/core.test.ts` 5/5 pass exit 0, probe reservation is correctly synchronous, tsc clean. No overclaiming found.

**Fixes applied on my side:** lifecycle events renamed to `runtime.started` / `runtime.failed` (core keeps `run.*`); model-request count will be derived from successful `record('model.requested')` calls only, so `USAGE_MISMATCH` cannot fire on bookkeeping drift; reserve-then-record ordering so the budget throw is avoided rather than caught. `tsc --noEmit` exit 0 and `tests/runtime-config.smoke.ts` 7/7 after the rename.

**Question:** `investigate()` requires `['pricing','tax']` conclusions for `independent` as well as `cooperative`. Confirm the ablation should still produce two cited conclusions with reconsideration disabled — that is how I am building it.

**Next:** M2, two Mozaik participants with overlapping loops against a labelled deterministic runner.

---

## 2026-09-05 ~23:50 IST — M2 + M3 done, 14/14 green

```
$ node node_modules/typescript/bin/tsc --noEmit                                  exit 0
$ node node_modules/tsx/dist/cli.mjs --test tests/core.test.ts tests/runtime.test.ts
  ... 14 pass, 0 fail                                                            exit 0
```

**Delivered** (`src/runtime/`): `agents.ts` (specs + host-bound tools), `interception.ts` (`BoundaryInterceptor`), `run.ts` (participants, overlap, failure handling), `testing/deterministic-runner.ts`, `index.ts` (`createRuntimeDriver` / `runInvestigation`), `tests/runtime.test.ts` (8 tests).

**Two participants, real overlap, real interception.** `runLoop` is fired per agent without awaiting; a test asserts tax activity interleaves between pricing's `probe.started` and `probe.completed`. Reconsideration fires at an actual pending `function_call`, asks the model with the peer evidence injected into an *isolated context copy*, and — when the model picks a different action — returns a `function_call` transition carrying the agent's own `inferenceInput`, so no orphan calls or invented results enter context.

**Your A1 follow-up is implemented and tested.** `BoundaryInterceptor` tracks `#lastSeenRevision` (reset at every inference) and `driverStartRevision`, so only peer evidence that arrived *after* the agent formed its pending proposal qualifies. The requested freshness test is `only newly arrived peer evidence triggers reconsideration (freshness)` — one peer result cannot produce more reconsiderations than distinct peer results, and no cited id is ever `generalist` or self.

**⚠️ Your A4 hazard is real — I reproduced it, then fixed it.** A provider error inside `InferenceState.run` escapes `AgentLoop.run`, which `runLoop` never awaits, so it became an **unhandled rejection that crashed the test run** (22s hang, exit 1). Fix: `guardRunner` wraps the runner used by the loop, records `agent.failed`, rejects that agent's completion so the run ends honestly, and returns a terminal `model_message` so the loop closes through `model_message -> idle`. Reconsideration calls are deliberately rethrown so `BoundaryInterceptor`'s own recovery handles them. **No global `unhandledRejection` swallow**, per your instruction. Test: `a provider failure propagates without inventing success`.

**Note on the default runner:** `DefaultInferenceRunner` needs a non-exported `InferenceInputValidator`, so a real instance is obtained from an isolated throwaway `defineRuntime()` and then wrapped, rather than reconstructed by hand. Flagging in case you prefer a different approach.

**Accounting:** `modelRequests` is now mirrored from successful `record('model.requested')` calls only, so `USAGE_MISMATCH` cannot fire on bookkeeping drift — asserted explicitly in `runtime request count matches the host ledger exactly`. Usage stays `null` when the provider reports none; asserted.

**Confirmed received:** you own git init (A7); independent ablation returns two cited conclusions; A2/A5 fixes verified in `session.ts`.

**Still blocked:** M7 real-provider smoke — no `.env`. Everything above is the deterministic test double and is labelled `execution: 'test'`. **No provider call has been made by me. No policy comparison has been run, and none of this is evidence that cooperation beats either control.**

**Next:** M4 — `single` generalist control wired through the same harness, then M5 hardening. Ready for a real-provider trace the moment `.env` exists.

---

## 2026-09-06 ~00:05 IST — RUNTIME_REVIEW.md P0/P1 all fixed and proven. 21/21 green.

```
$ node node_modules/tsx/dist/cli.mjs --test tests/core.test.ts tests/runtime.test.ts
  21 pass, 0 fail                                                        exit 0
```

Every finding accepted; none disputed. Each has a test that fails without the fix.

| Review item | Fix | Proving test |
|---|---|---|
| **P0** finish resolves before the loop ends, allowing a late paid call | `finish_investigation` now only sets a per-agent `concluded` flag. The interceptor terminalizes the next transition **before** reserving or requesting inference. Completion resolves solely on that loop's own `model.answer`. | `P0: no further model request happens after the driver resolves` — snapshots runner call count at resolve, waits 250 ms, asserts unchanged |
| **P0** ordinary inference had no deadline | `guardRunner.run` now applies `withDeadline(modelTimeoutMs, host.signal)` to **every** provider call, not just reconsideration | `P0: a hanging provider hits the deadline instead of stalling the run` — 30 s scripted hang, 1 s timeout, run ends fast and honestly |
| **P0** caught interceptor error could bypass the budget | `handle` now **fails closed**: any operational failure returns a valid terminal transition and calls `onOperationalFailure`, never the original inference. `#reconsider` is now `await`ed inside the try so async rejections reach the catch. | covered by the deadline and budget tests; `interception.failed` is recorded sanitized |
| **P1** revision marked seen without injecting evidence | `#prepareInference` builds a new `ModelContext` containing the undelivered evidence digest and only then advances `#injectedRevision` / `#lastSeenRevision`. Applies to **all** policies at ordinary boundaries; only reconsideration differs. Seed reproduction is delivered without an extra call. | `P1: evidence marked seen is evidence actually delivered to the model` — asserts the peer evidence id and the seed id appear in text the model actually received |
| **P1** raw provider errors leak into artifacts | New `src/runtime/sanitize.ts`. Only `{code, status?, stage}` is ever recorded. **You caught a real leak I had missed** — `index.ts` still wrote `error.message` on the `runtime.failed` path; the test failed until I sanitized it too. | `P1: raw provider error text never reaches the artifact` — scripts a `401 ... ?key=sk-live-...` error, asserts neither the key nor the host appears anywhere in the artifact |
| **P1** incomplete usage; brittle action comparison | Usage now settles on **every** call and `usage()` returns `null` unless every completed call reported it. Verified `TokenUsage` in dist/index.d.ts: `inputTokens`/`outputTokens`/`totalTokens`. Comparison is canonical parsed JSON via `sameAction()`; call ids are never compared. | `P1: usage is aggregated across all calls...` and `P1: a reordered-but-identical action is not counted as changed` |
| Failure boundaries outside guarded `invoke` | `#rejectInvalidCall` validates the pending tool name against `inferenceInput.tools` and parses args before execution, recording `action.rejected` and terminalizing. Empty/malformed inference output is caught at the guarded runner. | exercised through the real loop path, not helper calls |
| Streaming | **Not claimed.** `guardRunner.stream` records `runtime.unsupported`, fails the agent, and emits one event. It is explicitly not supported. | — |

**A bug your review indirectly caught:** widening `isSatisfiedBy` to cover every inference and pending call dropped the policy gate that used to live there, so the ablation started reconsidering. Now gated inside `#reconsider`. `independent policy is the same run with reconsideration off` failed until fixed.

## Two things for you

**1. 🔴 `tsc --noEmit` is currently broken by `tests/core.test.ts:70` — your file, so I did not touch it.**
```
tests/core.test.ts(70,32): error TS2322: Type 'number' is not assignable to type 'void | Promise<void>'.
    session.subscribe(event => observed.push(event.sequence));
```
`Array.push` returns a number; the observer expects `void`. One-line fix: `event => { observed.push(event.sequence); }`. Tests still pass under tsx (types stripped), but the typecheck gate is red for both of us.

**2. 🔴 Git is initialized, but not owned by the user.**
```
$ git status
fatal: detected dubious ownership in repository at '.../jigjoy hackathon'
'.../.git' is owned by: LAPTOP-VHMAP9UF/CodexSandboxOffline (S-1-5-21-...-1005)
```
The `.git` you created belongs to the sandbox account, so neither the user nor I can run git here. Since the submission needs a judge-accessible repo pushed from the user's account, this needs resolving — either `git config --global --add safe.directory` plus an ownership fix, or re-init under the user's own account. Flagging rather than acting: repo setup is yours.

## Unchanged and still true

Everything above is the **labelled deterministic test double**, `execution: 'test'`. **No provider call has been made by me. No policy comparison has been run. Nothing here shows cooperation beating either control** — that needs `.env`, which still does not exist. M4 (`single` control) is wired and reachable through the same harness; it has no dedicated test yet because a policy comparison would be meaningless without a real provider.

**Ready for the real-provider trace the moment `.env` appears.** Tell me the model and the cap you want and I will run one bounded trace and report exact counts.

---

## 2026-09-06 ~10:50 IST — final runtime hardening pass. 21/21 green, typecheck clean.

```
$ node node_modules/typescript/bin/tsc --noEmit
(no output)                                                              exit 0

$ node node_modules/tsx/dist/cli.mjs --test tests/runtime.test.ts
  tests 21 | pass 21 | fail 0 | duration_ms 32781                        exit 0
```

`tsc --noEmit` is now clean — the `tests/core.test.ts:70` observer-callback error I flagged last night is fixed on your side. **No remaining failures, and no shared type errors visible to me.**

7 new tests, all through the real installed `@mozaik-ai/core@4.0.5` loop with the labelled deterministic runner. The 14 previous tests still pass unchanged.

### 1. Single/generalist control — plumbing validation

`single/generalist control runs to completion through the installed runtime`. Reaches `status: 'completed'` with one participant citing real evidence, and asserts: the seed reproduction reaches the model context; its own later probe is delivered back at a subsequent boundary; `probeReuses >= 1` with a `probe.reused` event; zero `action.reconsidered` events and zero reconsideration calls on the runner.

**Plumbing only.** It shows the control reaches the same loop, tools, host, budget and reuse path as the other policies. It is not a comparison and says nothing about quality.

**This is the first test in the project to reach `status: 'completed'`,** and getting there exposed a real gap: the old `finish()` helper passed `evidenceIds: []`, which `conclude()` correctly rejects, so `guardTool` swallowed it and **no earlier test had ever completed a run.** The new `{kind:'finish'}` step cites ids parsed back out of the context the runtime actually delivered — if evidence was never injected it cites nothing and the host correctly refuses.

### 2. Actual-loop failure boundaries

| Test | Path exercised | Asserted outcome |
|---|---|---|
| unknown tool name | library tool lookup, outside guarded `invoke` | `action.rejected` reason `unknown-tool`, not completed, no invented conclusion |
| malformed tool arguments | library JSON arg parsing (`{"unitPriceCents": `, new `rawCall` step) | `action.rejected` reason `unparsable-arguments` |
| empty inference output | guarded runner boundary (new `empty` step) | `agent.failed` stage `inference:empty`, run carries an error |
| host model-budget rejection | host `record('model.requested')` throwing `MODEL_BUDGET` | `error.code === 'MODEL_BUDGET'`, `metrics.modelRequests === 2` exactly, sanitized `interception.failed` code |
| cancellation | `AbortController` fired from `onEvent` at a real `probe.completed` | `status: 'cancelled'`, `RUN_CANCELLED`, evidence preserved, no conclusion |

Each runs inside `withNoUnhandledRejection`, which installs a `process.on('unhandledRejection')` probe **for the duration of that test only** and asserts nothing escaped — a test-scoped assertion, not a global swallow. Each also calls `assertNoLateRequests`: snapshot the runner call count after the run returns, wait 250 ms, assert it did not move.

For the host-budget test I added `runtimeMaxModelRequests` to `DriverOverrides` (**TEST ONLY**, documented as such). It raises the runtime-side budget *above* the host cap so the **host ledger** is what stops the run, proving the host is the authority when our local counter disagrees. Without it both caps are the same number and our own `reserve()` always trips first, so the host path was never exercised.

**No fixes were needed inside my modules** — every one of these paths already behaved honestly. These are new coverage of existing behaviour, not repairs.

### 3. Sibling loops after `runPolicy` rejects — new guard, with an honest caveat

Added a run-level stop: `runPolicy` sets `stopped = true` in its `finally` (before anything else), `BoundaryInterceptor` terminalizes on `isStopped()`, and `guardRunner.run` refuses without calling the provider. It targets the window where `Promise.all` rejects for one agent while the sibling loop — which nothing awaits — is still mid-iteration.

**⚠️ I could not make any test fail without this guard.** I mutated `isStopped` to `() => false` and re-ran the sibling, cancellation, empty-output, unknown-tool, malformed-args and P0 tests: **all still passed.** The observable behaviour is already produced by two pre-existing mechanisms — `investigate()` calls `controller.abort(reason)` in its catch, and `ModelBudget.reserve()` returns `false` on an aborted signal. So the guard narrows a real race window by a few microtasks, but **the tests verify the behaviour, not this guard specifically.** Reporting it as defence-in-depth, not as a proven fix.

### 4. Native Mozaik loop evidence — checked, and it was missing

**Finding: the native events are sufficient, but none of them were reaching the artifact.** Everything in the ledger was written by us (`agent.started`, `model.requested`), which proves what our code did — not that the library ran two real loops.

Verified in the installed 4.0.5: `RuntimeService.publish` fans every event out to every joined participant and `EventProcessor.process` runs that participant's handlers, so one extra participant with a catch-all handler observes the real bus. `LoopVisitor.publish` stamps `producerId` (the library's participant UUID) and `payload.loopId` (minted inside `AgentLoop.create`). Neither is derived from our code.

New `src/runtime/observer.ts` — `NativeLoopRecorder`, a `createHuman` participant recording **only** `{native, participantId, loopId}` per event. **The payload is dropped entirely rather than filtered**, which is the only version that cannot leak later. It would otherwise carry: `inference.started` → the whole model context; `inference.completed` → the raw provider response including `rowResponse`; `function_call.completed` → raw tool output. `inference.stream` is excluded separately as per-token noise. Capped at 400 events with a `runtime.native.truncated` marker; the recorder skips its own join; the handler cannot throw (`EventProcessor.process` has no try/catch in 4.0.5).

The test asserts two distinct library `loopId`s, one participant each, overlapping spans, exactly two `participant.joined`, no field outside the three allowed keys, no `inference.stream`, and that neither `rowResponse` nor `probe_quote` appears anywhere in the native records.

**What this evidence proves — and does not:**

- **Proves overlap.** Two distinct library-minted `loopId`s whose event spans interleave in sequence order. Real concurrent execution of two real loops, not fakeable from one loop since the UUID is minted inside `AgentLoop.create`.
- **Does NOT prove useful cooperation.** Overlap only shows two loops were alive at once. Usefulness needs the semantic events: `probe.reused` (one agent consumed the other's observation instead of spending a probe) and `action.reconsidered` with `changed: true` citing peer ids the host independently validated as another agent's.
- **Neither proves the cooperation is *better*.** That needs a real-provider comparison against the controls, which **has not been run.**

## Files changed (all within my ownership)

| File | Change |
|---|---|
| `src/runtime/observer.ts` | **new** — `NativeLoopRecorder`, bounded native lifecycle recording |
| `src/runtime/run.ts` | run-level `stopped` flag + `isStopped` in `guardRunner`; `RunStoppedError`; recorder joined and wired |
| `src/runtime/interception.ts` | `isStopped` option; terminalize a stopped run at the boundary |
| `src/runtime/index.ts` | TEST-ONLY `runtimeMaxModelRequests`; observer exports |
| `src/runtime/testing/deterministic-runner.ts` | new `rawCall`, `finish`, `empty` step kinds |
| `tests/runtime.test.ts` | +7 tests (14 → 21) |

## Remaining limitations

- **The sibling-stop guard is unproven by test** (section 3 above). Strongest caveat in this pass.
- **`guardRunner.stream` is still not supported** and is not claimed to be. It records `runtime.unsupported` and fails the agent.
- **`withDeadline` bounds how long we wait, not the provider's work.** 4.0.5 exposes no cancellation path. A timeout here must never be described as a cancelled call.
- Everything above is the **labelled deterministic test double**, `execution: 'test'`. **No provider call has been made by me, and none is configured — there is still no `.env`.** No policy comparison has been run; nothing here shows cooperation beating either control. **No paid model evaluation was performed in this task, as instructed.**
- **Not touched, by instruction:** `api/**`, `src/core/**`, `src/server.ts`, `web/**`, `scripts/**`, package/lock/config, deployment, Git. I made no Git command of any kind. Note that Git in this directory is still owned by the sandbox account, so `git status` fails for the user with `dubious ownership` — unchanged from last night and yours to resolve.

## September 6, 10:59 IST — Codex integration note

The follow-up Opus 5 task applied explicit .js extensions to runtime imports, changed successful scripted finishes to cite delivered evidence, required completed cooperative/independent runs with both conclusions, and consolidated seven duplicated checks. Its task budget ended before its final status append; this paragraph is Codex's verification, not a claimed Claude final answer.

Codex ran pnpm build and pnpm test after those edits: both exited 0; 35 tests passed, 0 failed. The Vercel import failure was observed in production logs and a corrected deployment is now being verified. No app-provider call occurred. Claude is idle pending a new bounded task.
