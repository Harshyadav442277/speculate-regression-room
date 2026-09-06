# Claude worker — demonstration review

Written 2026-09-06 ~11:20 IST against the working tree. Read-only inspection: no feature work, no new tests, no provider calls, no git, no deployment. I did not re-run the green 35; every finding below comes from source reading or from arithmetic that the fixture makes deterministic. Codex owns whether any of this lands.

---

## 1. Can a judge get from wrong quote to a test they can run themselves?

**Yes, on one path.** The path that works end to end today is the local CLI:

```powershell
pnpm investigate cooperative discount-twice
```

`scripts/investigate.ts:23-30` writes `run.json`, `report.md`, `regression.mjs` and `corrected-verification.json` into `artifacts/private/<runId>/`. The `regression.mjs` it writes is `src/core/report.ts:3` — the same function `tests/core.test.ts:132` spawns as a child process against two live fixture servers, asserting exit 1 on broken and exit 0 on corrected. The payoff artifact and the tested artifact are the same bytes on this path. It requires a provider key (`checkRuntimeConfig()` exits 2 first, `scripts/investigate.ts:12`).

The exported script's assumptions hold up: it takes the endpoint as `argv[2]`, defaults to `http://127.0.0.1:4318/quote`, rejects non-HTTP and credentialed URLs, times out at 5 s per case, counts any error as a failure, and sets `process.exitCode` from the failure count. No imports, no dependencies, no model calls. Expected values come from `expectedQuote()` (BigInt, independent of the fixture), not from an agent verdict.

### Missing steps I actually found

**a) DEMO.md steps 8 and 10 reference commands that DEMO.md never gives.** Step 8 says "Stop that fixture, start correct mode" — the literal `correct` invocation appears only in `README.md:41`, not in DEMO.md, whose own fixture block (line 54) hardcodes `discount-twice`. Step 10 says "through the evaluation command" and never names it (`pnpm evaluate`, `README.md:54`). A judge following DEMO.md alone stalls at both points. Fix is copying two lines from README.

**b) Step 10's control is named something the UI does not offer.** DEMO.md calls it "no-reconsideration"; the selector value is `independent`, labelled "Two agents · no boundary reconsideration" (`web/index.html:27`). Same thing, two names, one of which is unsearchable.

**c) Step 8 assumes the run used `discount-twice`.** The exported file carries no record of which fixture produced it (`src/core/report.ts:6-9`), and step 2 lets the operator pick Tax regression. A `tax-twice` run still exits 1 against a `discount-twice` server — for the wrong reason. Step 8 should say: start the same variant you investigated.

**d) The recorded-run fallback cannot perform step 7 today.** `web/app.js:79` disables *Check corrected fixture* when `imported && transport !== 'post-stream'`. Locally there is no stateless verify route — only ticket-scoped `/api/run/:id/verify` (`src/server.ts:125`) — so a locally imported run has no ticket and the button stays off. Hosted would work, because `api/config.ts` returns `transport: 'post-stream'` and `/api/verify` is stateless. But `/api/config` currently 500s in production, the browser catch at `web/app.js:221` leaves `transport` at its `'event-source'` default, and the button is disabled there too. **The pending deployment is exactly what re-enables the corrected-fixture check on the recorded-run path.** Until it lands, the fallback recording must use the CLI's `corrected-verification.json`, or the live local run (not an import).

**e) The browser download is a second, untested implementation.** `web/app.js:190` fetches the server-generated script only when `!imported && ticket && transport !== 'post-stream'`. Every other case — hosted runs, and *all* imported runs — falls through to the inline generator at `web/app.js:192`. Exit-code logic is equivalent by inspection, but its output lines drop `evidenceId` and the contract-provenance header, and `tests/core.test.ts:132` does not touch it. The judge-facing artifact in the hosted and recorded paths is not the one the green test covers. Cheapest resolution needs no code: export from the CLI or from a live local run, and say which.

**f) Input-safety range for the "change an input" moment.** With `discountBps: 0` the `discount-twice` fixture is byte-identical to `correct` (`research/checkout-fixture/quote-service.mjs:19-21`); likewise `taxBps: 0` for `tax-twice`. A judge who zeroes that field gets an honest "Contract passes" (`web/app.js:40`) and an exported regression that exits 0 against both fixtures. Nothing is faked — but the payoff evaporates on camera. State the safe range before inviting the change: keep `discountBps ≥ 1` on Pricing regression, `taxBps ≥ 1` on Tax regression.

None of these is a correctness defect in the runtime. They are gaps between the walkthrough and the build.

---

## 2. Ninety-second narration, aimed at the result

🔴 = **cannot be spoken until a real provider run exists and is saved.** Everything unmarked is true of the current tree.

| ~ | Line | Shown |
|---|---|---|
| 0–10 s | "A checkout quoted 18,900 cents. It returned 17,010. Someone has to find out why." | The reproduction row, FAIL badge |
| 10–20 s | "Two investigators start at the same time. One works the pricing stage, one works the tax stage. Neither is told which stage is broken." | Both lanes active |
| 20–35 s | 🔴 "They don't guess — every claim comes from a call they actually made. This one disabled tax and the total was still wrong, so tax isn't the story." | Evidence table, expected vs actual per probe |
| 35–50 s | 🔴 "That result landed in the other investigator's context before its next move, and it changed what it did next. Here's the old action, the new action, and the observation that caused it." | One real plan-change card |
| 50–60 s | 🔴 "Both finish with a conclusion, and every conclusion cites the observations behind it." | Two cited conclusions |
| 60–80 s | "This is what you take away — the investigation wrote a test file out of what it observed. No dependencies, no AI in it." | `regression.mjs` on disk |
| 80–95 s | "Same file, broken checkout: it exits 1. Same file, corrected checkout: exits 0. The corrected version is one we wrote — nothing here repaired your code." | Two terminal runs, both exit codes visible |
| 95–105 s | "You don't have to trust the investigators. Run the file." | — |

Closing honesty line, always speakable: *"These are the cases it captured. Passing them doesn't prove every input is right, and we haven't shown that two investigators beat one — that comparison is wired and not yet run."*

Three of eight lines are 🔴-blocked. The two that survive without a provider are the ones carrying the payoff, so a controlled-mode recording still tells a coherent story — provided the interface's **Controlled test** label stays visible and is named out loud as an engineering check, not a live run.

---

## 3. One fair evaluation case that could challenge the preferred explanation

**Case:** the default failing input `{10000, 2, 1000, 500}` against the **`tax-twice`** fixture, cooperative policy. Both controls already exist — `web/index.html:26` exposes the fixture selector, and `investigate({fixture})` accepts it. Public development case, published here in advance; not a blind benchmark.

The demo's preferred explanation is *the discount is applied twice*. On this fixture it is the wrong answer, and the fault variant never reaches agent context (`src/core/investigation.ts:88` keeps it in evaluator metadata), so the investigators have to earn it. Deterministic values from `quote()`:

- Seed: expected 18,900, returned **19,845**.
- Probe with `taxBps: 0`: expected 18,000, returned **18,000** — passes.
- Probe with `discountBps: 0`: expected 21,000, returned **22,050** — still wrong.

**What falsifies a "discount applied twice" diagnosis here:** the `discountBps: 0` probe. If the discount stage were doubling, removing the discount would remove the error; it does not. Conversely the `taxBps: 0` probe passing removes the tax-stage-innocent reading. If a run on this fixture still concludes "the discount is applied twice," or concludes tax without either probe in its cited evidence, the diagnosis is unsupported and the demo's story is a shape of the default fixture rather than a result of investigating.

**Honest limit on how much this case proves.** With a non-zero discount and a subtotal large enough for the second application to move a whole cent, `discount-twice` always lands *below* the contract and `tax-twice` always lands *above* it. The direction of the very first observation already separates the two hypotheses before any probe. So this case tests whether the investigators follow evidence rather than their starting priority — it does not establish that cooperation was needed to get there. That still requires the same input through `single` and `independent`, kept whichever way it falls. No win or saving number should be quoted from this case, and I have not produced one.

Worth recording: the answer-shaped prompt hints the independent audit flagged are already cut in the working tree (`src/runtime/agents.ts`, uncommitted) — both priorities now name a stage and add "Do not assume this stage is faulty." That change is what makes this evaluation case fair to run.

---

## 4. Three obstacles, cheapest next action each

**1. No provider is configured, so nothing has ever exercised a model.** `.env` does not exist; every artifact in the tree is `execution: 'test'`. This blocks three narration lines, the single-vs-cooperative comparison, and the case in section 3.
→ **Cheapest action, user:** put one provider key in `.env` locally (per `.env.example`) and run `pnpm investigate cooperative discount-twice`. Local is where `@mozaik-ai/core` is known to load; it needs no deployment, no hosted access code, and it writes the tested `regression.mjs` plus `corrected-verification.json` in one command. Bounded by the existing 12-request cap. One completed run, saved, is enough to unlock the recording.

**2. The hosted app's runtime routes are still failing, which also disables the corrected-fixture check on the recorded-run path** (finding 1d). The fix is written and passes locally; it is waiting on a deployment I must not run.
→ **Cheapest action, user:** run the manual Vercel command Codex already gave you in REVIEW.md. Until it reports success, rehearse and record locally and drop the hosted URL from DEMO.md step 1 as the primary route — it belongs in the closing as an inspectable recorded viewer. I have not attempted, retried or worked around that command.

**3. The written walkthrough and the build have drifted** (findings 1a, 1b, 1c, 1e, 1f). A judge following DEMO.md alone hits two undocumented commands, one control name that does not exist in the UI, and — on the hosted or imported path — downloads a regression file produced by an exporter no test covers.
→ **Cheapest action, Codex:** five line-level edits to DEMO.md, no code. Paste the `correct 4318` and `pnpm evaluate` commands into steps 8 and 10; rename "no-reconsideration" to "independent"; add "start the same fixture variant you investigated" to step 8; add the `discountBps ≥ 1` / `taxBps ≥ 1` note to step 2; and state that the demo exports via `pnpm investigate` or a live local run, not an imported one.

Two things I am deliberately not saying: the exported JSON and event ledger are inspectable local records, not tamper-evident — nothing here is signed; and a single passing case set diagnoses one fixture's behaviour on the inputs it captured, not a root cause that generalises. I have no evidence supporting any placement or ranking estimate and offer none.
