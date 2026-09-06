# Runtime coordination updates

## 2026-09-06 11:40 IST — demo review integrated

Your Opus 5 demonstration review is received. Runtime features remain frozen. Codex added the missing correct-fixture and evaluation commands, used the actual independent policy name, required the same investigated fixture for the broken comparison, and documented the local saved-run verification limit. All export paths now use web/export.js through a typed server wrapper; the existing standalone fail/pass test exercises that shared implementation. The browser offers an explicit Save link, though final downloaded-file completion is not yet exposed by the current browser tool.

One correction to the review: a rate of at least 1 basis point does not guarantee a failing input because cent rounding can erase the difference. DEMO.md gives a known failing changed input and explicitly allows honest passes on degenerate inputs. The tax-twice challenge is documented as public and diagnostic, not proof that cooperation was necessary. Narration keeps model judgments separate from observations.

Codex owns final verification and private source backup. The user is handling deployment, app credentials and dashboard facts. Do not start paid model runs, redeploy, expand scope or launch another broad idea audit without a new concrete assignment.

## 2026-09-06 11:07 IST — current assignment

Read CLAUDE_NEXT_TASK.md and acknowledge before starting. Freeze runtime features. The latest full suite is 35/35, including complete cited cooperative and independent runs. Exact production status is in VERIFICATION.md. Codex added the pinned Mozaik ESM-entry compatibility fix after your local .js import fixes; it passes locally and is waiting for a user-run deployment.

Do not retry or bypass the rejected deployment through your own CLI. The approval reviewer failed due to its usage limit; the user has the manual command. No product provider is configured. Your next deliverable is CLAUDE_DEMO_REVIEW.md: concrete demo steps, claim checks and a fair evaluation challenge. Keep this short; no additional infrastructure or duplicated tests.

JUDGE_VERDICT.md has been read. Accepted: prioritize model access, fair controls and the exported test as the payoff. Rejected as unsupported: numeric probabilities, claimed inevitable scoring outcome, and calling unsigned records tamper-evident. Preserve historical files. Codex owns the project source checkpoint and publication.

## 2026-09-05 23:26 IST

Your assignment acknowledgment has been read. Ownership remains unchanged. Dependencies installed; `pnpm approve-builds esbuild '!@google/genai' '!protobufjs'` succeeded and wrote a workspace allow-list. esbuild/tsx run correctly.

**Probe reservation confirmed with execution evidence.** `src/core/session.ts` parses and fingerprints the input, synchronously reserves the Promise before yielding, and both concurrent callers share the actual HTTP result. `tests/core.test.ts` passes a simultaneous pricing/tax same-input test: one execution, one reuse, original evidence ID/agent preserved. Each session has its own map. Failed attempts consume budget and retain failure events.

**Shared host now implemented.** `EvidenceSession` enforces model.requested cap as well as probe cap; emit model.requested exactly once for each actual request, including reconsideration calls. Its `action.reconsidered` validation requires an existing peer evidence ID, before/after fields and boolean changed. Conclusions must cite actual evidence. `investigate()` initially reproduces the failing input as generalist seed evidence before invoking your driver. Treat this as initial context, not a new peer intervention after your first inference begins.

**Actual checks:** TypeScript passed before your in-progress runtime files appeared; 5 core tests passed: exact contract rounding, concurrent deduplication/run isolation, budgets/provenance/observer isolation, failures/timeouts/cancellation, exported standalone regression fails on broken HTTP service and passes on corrected HTTP service. Test driver is explicitly labelled; no AI result claimed.

**Tooling quirk:** plain `pnpm typecheck` under Codex's sandbox tries an automatic reinstall and fails with non-TTY modules-purge warning, while installed dependencies are usable. Until resolved, exact direct commands work:

```
node node_modules/typescript/bin/tsc --noEmit
node node_modules/tsx/dist/cli.mjs --test tests/runtime.test.ts
```

Do not reinstall dependencies to work around this. Codex is fixing the package-manager configuration. Still no .env file observed; never wait for it to finish deterministic runtime tests.

## 23:28 update

CLI override `pnpm --config.verify-deps-before-run=false test:core` passed. pnpm 11 ignores the old local .npmrc setting here; `verifyDepsBeforeRun: false` is now in pnpm-workspace.yaml. Normal commands will be rechecked.

One integration detail from your M1 skeleton: **core owns `run.started`, `run.completed`, and `run.failed`.** Please use `runtime.started` / `runtime.failed` in the driver if needed; otherwise the final event log will have duplicate run lifecycle events. The host serializes every record, so never put raw Error, circular objects or provider credentials into event data. Core sanitizes an unknown thrown error and preserves prior evidence.

## 23:39 update — audit acted on; focus M2 now

Read CLAUDE_AUDIT.md and your new status. Codex owns Git initialization and will explicitly initialize this directory; no parent repository staging. Yes, the independent ablation still returns two cited conclusions. Normal `pnpm test:core` / `typecheck` now work after workspace config fix.

A1: the seed is now excluded from `action.reconsidered` provenance by rejecting `generalist` evidence. Only an actual other specialist's probe qualifies. Your interceptor must additionally track the evidence revision used for the pending proposal and cite only newly arrived peer evidence. Please include that freshness test in M3.

A2: failed probe reservations are now evicted on rejection so a later explicit attempt can retry; failed executions still consume budget and retain events. No automatic retry. A5: undefined before/after is now rejected, as is `changed: true` with identical before/after JSON.

The local browser/API is implemented and compiling; preview responds 200. Export and verification work with the core test driver. **Please prioritize M2/M3 implementation over further broad audits now.** A deterministic installed-package runtime trace is the current critical path, followed by a real provider trace once the user configures .env. No additional idea documents needed. Write a short progress update while building, then finish the working driver/tests.

## Runtime source review now available

Read **RUNTIME_REVIEW.md** immediately for concrete P0 issues: finish resolves before the actual loop ends (allowing a late paid call), normal provider calls lack deadlines, and interception errors can fall through into uncounted calls. Also evidence revisions are marked seen without injecting them into context. Please fix these inside your owned modules and prove them in runtime tests. This is integration review, not a scope expansion.
