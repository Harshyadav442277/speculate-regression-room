# Independent judge audit — SPECULATE

Auditor: third Claude session (`jigjoy-hackathon-06`), no build ownership, no stake in prior decisions.
Audited 2026-09-06 ~10:55 IST against the live tree, not against status docs.
T-8h35m to internal freeze (19:30 IST). T-19h to internal submission target (Sep 7 06:00 IST).

## Independently verified (I ran these; I did not take them on report)

| Check | Result |
|---|---|
| `tsx --test tests/*.test.ts` | **42 pass / 0 fail**, 32.8s |
| `tsc --noEmit` | clean |
| `https://speculate-regression-room.vercel.app` | **HTTP 200**, 0.10s |
| `.env` | **DOES NOT EXIST** |
| `.env.local` contents | `VERCEL_OIDC_TOKEN` only — **no provider key** |
| `git log` | **"does not have any commits yet"** — zero commits |
| `.git` ownership | `CodexSandboxOffline`, not the user — user cannot commit |
| Code volume | ~4.2k lines source + tests |
| Idea-history markdown still in tree | `CLAUDE_IDEAS.md` 89KB + `CODEX_IDEAS.md` 57KB = **146KB of dead history a judge clones** |

Engineering quality is genuinely above hackathon average. That is not the problem.

## Verdict on the core premise: weak as sold, salvageable if reframed

**The premise as currently written — "two agents debug better than one" — is weak, and worse, you have never tested it and it is probably false for your own fixture.**

The demo bug is `unitPrice 10000 × qty 2, discount 1000bps, tax 500bps → expected 18900, got 17010`. That is a discount applied twice. A competent engineer finds it in ninety seconds with one print statement. One capable model finds it in one prompt. **The demo case is the strongest argument against its own thesis**, and a judge will construct that argument in their head before the plan-change card appears.

`PRD.md` ranks this exact risk as failure #1. It was written down, then the build continued for two days without running the control that would settle it.

**The reframe that survives contact with a judge:** stop selling *"cooperation produces a better diagnosis"* (unproven, likely false here, unmeasured). Sell *"verifiable multi-agent execution"* — tamper-evident native provenance, sanitized artifacts, honest failure boundaries, and a regression test the judge takes home and runs. That claim is fully backed by what is already built, needs no new code, and is on-target for a concurrency-weighted sponsor track. It is also the genuinely rare thing in this room.

Not stopping at "premise weak" because the fix is a script change, not a rebuild, and there are hours not days. The five causes below assume the reframe.

## Five causes of the loss, ranked by probability × cheapness-to-fix

### 1. There was no AI in the AI demo — P(cause) ≈ 95%, fix ≈ 45 min

**Failure.** Every green test, every UI state, every agent utterance ever produced comes from `deterministic-runner.ts` labelled `execution: 'test'`. On stage the interface honestly prints **"Controlled test."** The integrity apparatus becomes the murder weapon: a judge reads that label as *did not finish*. In a multi-agent-runtime track, a submission that has never once called a model is not a partial score — it is a zero on the primary criterion.

**Earliest signal.** `GAPS.md` P0 line "Real provider is not configured in this shell" — written yesterday, verified still true today. Two build days elapsed with the highest-value P0 untouched because it needs a human to paste a key.

**Cheapest mitigation.** One key in `.env`. One bounded run with a hard cap. Save the artifact JSON. Ship *that* as the recorded fallback. A single real run reaching a mediocre conclusion beats forty-two perfect scripted tests. **Do this before anything else on this page.**

### 2. No repo, no video, no confirmed submission — P(disqualification) real, fix ≈ 15 min

**Failure.** Zero commits exist. `.git` belongs to a sandbox account the user cannot write as. No judge-accessible remote, no recording, no confirmed dashboard entry. Disqualification-class, not scoring-class — the best demo in the room scores nothing if the entry is incomplete.

**Earliest signal.** `git log`, right now. Claude flagged the ownership break in `CLAUDE_STATUS.md` last night and correctly declined to act; nobody picked it up.

**Cheapest mitigation.** Fix ownership under the user's account, commit, push to a public remote, paste the link into the dashboard. Fifteen minutes — highest ratio on this board after the key.

### 3. The single-agent control was never run — P ≈ 80%, fix ≈ 30 min

**Failure.** The `single` policy is wired and reachable but has never run against the cooperative policy with a real model. The central comparative claim is unmeasured. If a judge asks "did you check whether one agent does this just as well?", the honest answer is no. If the control ties or wins, that must surface *today*, not on stage.

**Earliest signal.** `CLAUDE_STATUS.md`: "M4 has no dedicated test yet because a policy comparison would be meaningless without a real provider." Correct reasoning, unresolved dependency — same root cause as #1.

**Cheapest mitigation.** Immediately after the first real run, push the same input through `single` and `no-reconsideration`. Keep the result whichever way it falls. A measured tie reported honestly scores better than an unmeasured claim, and it determines which story to tell on stage.

### 4. The payoff is a mechanism, not a benefit — P ≈ 70%, fix ≈ 60 min (script only)

**Failure.** The climax is a card showing that agent B changed its next probe. That is an architecture detail. Judges do not feel it. Nothing on screen answers "so what do I get?"

**Earliest signal.** The 90-second table in `DEMO.md`: four of six segments describe internal machinery, one describes the answer.

**Cheapest mitigation.** Promote the **exportable regression test** to the climax. "This investigation produced this file. It exits 1 on the broken build, 0 on the fixed one. Run it yourself." A takeaway artifact, verifiable in ten seconds, rare. The plan-change card becomes supporting evidence, not the punchline.

### 5. Scope — built and never seen — P ≈ 50%, fix ≈ 30 min

**Failure.** The code is disciplined; the *documentation* is the bloat. Fifteen markdown files, 146KB of superseded idea history shipping in the clone. Plus the sibling-stop guard that Claude honestly reports **no test can distinguish** (real integrity, zero judge value), the recorded-run import viewer, and the WebMCP surface.

**Earliest signal.** Markdown byte count exceeding source byte count.

**Cut now.** Archive `CLAUDE_IDEAS.md`, `CODEX_IDEAS.md`, and superseded task files out of the judge-facing tree. Stop writing status documents — this project has spent more words describing itself than a judge will ever read. Freeze the guard work. No new tests.

## The 30-second pitch, no jargon (currently missing — write it verbatim, rehearse it)

> A checkout quoted the wrong price. Two AI investigators work it at the same time, sharing what they find, and you can see exactly which evidence changed what one of them did next. At the end you get a test file that fails on the broken code and passes on the fixed code. Run it yourself — you don't have to trust the AI.

The last sentence is the entry. Lead with it if the run is shaky.

## Order of work for the remaining hours

1. Provider key → one real bounded run → save artifact. **Nothing else matters until this is done.**
2. Repo owned by user, committed, pushed, public, link in dashboard.
3. Same input through `single` and `no-reconsideration`. Record whatever happens.
4. Rewrite the demo script around the exportable test. Rehearse twice.
5. Record the video against the saved artifact so a dead network cannot kill it.
6. Delete the dead markdown. Submit with buffer.

If the key never arrives, the honest submission is the reframe above: a verifiable concurrent-execution harness with provenance and a takeaway artifact, presented in controlled mode and labelled as such. That places lower, but it does not embarrass anyone.

---

# Addendum — second audit pass, 2026-09-06 ~11:10 IST

Deeper verification after the first pass. Two findings that outrank items 3-5 above.

## F1 (CRITICAL, new) — the judge-facing deployed app cannot run an investigation

`DEMO.md` step 1 sends judges to `https://speculate-regression-room.vercel.app`. Every runtime endpoint there returns 500.

| Endpoint | Imports | Live result |
|---|---|---|
| `/api/verify` | `src/core/**` only | **400 on empty body — correct behaviour, works** |
| `/api/config` | `src/runtime/index.js` | **500 FUNCTION_INVOCATION_FAILED** |
| `/api/investigate` | `src/runtime/index.js` | **500 FUNCTION_INVOCATION_FAILED** |

The failure is isolated to modules that load `@mozaik-ai/core`. Ruled out by direct check:

- **Not the extensionless-import bug.** That fix landed: `grep` for relative imports missing `.js` across `src/` and `api/` returns **zero**. `CLAUDE_VERCEL_FIX.md` item 1 is genuinely done.
- **Not a stale deployment.** Deployed `/app.js` is **byte-identical** to local `web/app.js` (24095 bytes, `diff` empty). The live build is current.
- **Not a local package fault.** `import('@mozaik-ai/core/dist/index.mjs')` locally: loads in 648 ms, `supportedModels` present with 12 entries. The package has no `exports` map, so the deep path is legal.

Remaining candidates, in order — needs Vercel runtime logs to separate, which is Codex's access, not mine:

1. Vercel's file tracer not following the deep `@mozaik-ai/core/dist/index.mjs` path from a `main`-is-CJS package, so the `.mjs` never ships in the lambda.
2. `@mozaik-ai/cloud-sdk` doing pairing/telemetry work at import time (it prints its "no API key" banner on load) and throwing against a read-only serverless filesystem with no writable HOME.
3. Bundle size from the transitive `@anthropic-ai/sdk` + `@google/genai` + `openai` + `@modelcontextprotocol/sdk` set.

**The irony a judge will enjoy: the sponsor technology is the single thing that does not work in production.**

**Consequences.** Cause 1 in the main audit is worse than stated. Pasting a provider key does **not** produce a hosted demo — `/api/investigate` 500s before it ever reads a key. Also, these statements are currently false and must be corrected before anyone reads them: `GAPS.md` "Public UI and corrected-case verification deployed"; `PRD.md` "Vercel deployment is the chosen delivery path"; `DEMO.md` step 1.

**Cheapest mitigations, in order:**

1. **Demo locally, not hosted.** `pnpm dev` on `127.0.0.1:4317` is where `@mozaik-ai/core` provably loads. Re-point the rehearsal and the recording at local. Decide this now — it removes the hosted URL from the critical path entirely.
2. **Make `/api/config` degrade instead of crash.** It exists to report readiness; it should never 500. Load `supportedModels` through a guarded dynamic import and return `{ready:false, reason:'runtime unavailable'}` on failure. That matches this project's stated ethos of honest degradation, and it turns a dead page into an honest one.
3. **Keep the hosted URL as the recorded viewer.** This still works today and is worth preserving: `app.js` already catches the config failure and falls back to "Recorded viewer", the saved-run import is client-side, and `/api/verify` (corrected-fixture check) is live. A judge who opens the link can still inspect a real saved artifact and verify the corrected fixture. Label it that way deliberately rather than letting it look broken.

## F2 — the agent prompt points one investigator at the answer

`src/runtime/agents.ts` gives the Pricing investigator this starting priority:

> "Suspect the discount stage -- how the discount is applied, **how many times**, and how it is rounded."

The default fixture (`src/core/investigation.ts:34`) is `discount-twice`. The bug is that the discount is applied twice. The Tax investigator is symmetrically primed with "whether it is applied once" against the `tax-twice` variant.

To be fair to the implementation: there is **no answer-table leak**. The fault variant never enters agent context, both agents hold identical tools, and the instruction explicitly says the priority is "not a restriction." The audit for leakage otherwise comes back clean. But naming the failure *mode* ("how many times") rather than the *stage* is a real nudge, and a judge who opens this file will say you told the agent where to look.

**It also damages the thesis from the inside.** If Pricing is primed for double-application and the bug is double-application, Pricing should solve it nearly unaided — which makes the Tax investigator, and the entire cooperation story, decorative.

**Fix — two words, strengthens the demo.** Cut the failure-mode hints, keep the stages:

- Pricing: "Suspect the discount stage — how the discount is applied and how it is rounded."
- Tax: "Suspect the tax stage — what base tax is applied to and how it is rounded."

With neither agent pre-pointed at double-application, the discriminating probe (tax disabled, still wrong) genuinely carries the diagnosis, and the peer-evidence handoff becomes load-bearing rather than ornamental. This is the cheapest available change that makes the cooperation claim honest.

## Re-verified this pass

- `node research/checkout-fixture/verify.mjs` → exit 0, 12 HTTP cases, 3 invalid-input checks, both fault variants distinct.
- `node --experimental-transform-types research/runtime-review/check.ts` → exit 0, `result: PASS`, `actualProviderCalls: 0`.
- The regression-export claim is **real**: `tests/core.test.ts:132` spawns actual child processes running the exported `regression.mjs` against two live fixture servers, asserting exit 1 on broken and exit 0 on corrected. The climax recommended in the main audit is backed by a genuine test.
- Agent context leakage: clean apart from F2.
