# SPECULATE — project decision log

This is the workspace's project log required by the user's global project rules. It is not an update to Codex's global memory store.

## September 5, 2026 — idea finalization

- User objective: top-two finish in the JigJoy / Mozaik hackathon; blunt criticism and collaboration with an independently running Claude Code session.
- Independent research lives in `CODEX_IDEAS.md` and `CLAUDE_IDEAS.md`; both initial rankings are retained. Codex read Claude's full revised file and replied in its own file. Claude's acknowledgment of the latest reply is not verified.
- Initial numeric rankings were too optimistic about hypothetical implementation. Do not reuse them as evidence of win probability or feasibility.
- RelayOps/CONTENTION was independently proposed and rejected after the extraction-plus-solver comparison. MergeCourt, Evidence Delta, and ENSEMBLE were cut for scope, weak agent value, or prior-art concerns.
- CROSSTALK and the original SPECULATE pitch relied on mid-stream cancellation. Upstream inspection and an isolated check established that the built-in interception path runs between awaited states. Preventing the next tool call is possible in that control flow; cancelling the current provider stream was not demonstrated.
- Claude's description of PagerDuty as parallel-then-merge was contradicted by its cited article's concurrent-fan-in section. Do not restore competitor-absence claims without evidence.
- Final decision: SPECULATE, with two investigators debugging an executable local checkout API, shared evidence changing the next action, and an exportable diagnosis. `FINAL_IDEA.md` supersedes the historical candidate specifications.
- Domain choice: measurable local API behavior instead of fabricated physical-machine diagnostics. No claim that the local fixture establishes production usefulness.
- The quote fixture applies discount then tax, rounding in integer cents at each step. It has correct, double-discount, and double-tax modes. Main symptom: expected 18,900 cents, observed 17,010; tax disabled still fails at 16,200 versus 18,000. Twelve HTTP cases and three invalid-input checks passed.
- Both agents can inspect the development repository, so public fixture modes are not blind holdouts. Reserve an evaluator-only configuration before tuning and keep all private fixture fields out of runtime model context.
- Two model agents are sufficient. The observer/verifier is deterministic infrastructure. More agents, provider-abort adapters, arbitrary tools, and a general tracing framework are out of scope.
- Replanning-off is an ablation, not a sufficient alternative-product baseline. Use an adaptive control that also reads evidence and stops obsolete work.
- A captured live run may be replayed with a visible label. Replaying JSON events is the intended minimal fallback; no custom model replay framework is required.
- Standard provider-key environment variables were absent in this Codex shell. Do not assume no credentials exist anywhere; do not search or borrow keys from other projects.
- Internal freeze selected: September 6, 19:30 IST. Internal submission target: September 7, 06:00 IST. Official deadline wording remains ambiguous by an hour; preserve the early buffer.

## Collaboration

Preserve peer edits. Claude owns runtime/agents and Codex owns fixture/evaluation/verification, shared contracts, UI/API and hosting. Claude acknowledged and implemented its assignment. On September 6 the user authorized Codex to directly control Claude Opus 5; the installed Claude CLI verified that model and was given CLAUDE_DEPLOY_TASK.md.

Commits follow the user's configured authorship and contain no co-author or generated-by trailers. A project-local Git repository was initialized during implementation. Its root was verified; no parent-home staging occurred. No judge-accessible remote is verified yet.

## September 6 — implementation and deployment

- Mozaik 4.0.5 installed; actual runtime loops work with a labelled deterministic inference runner. This is not provider-backed evidence.
- Evidence is immutable, independently checked, deduplicated per run and exported as JSON, Markdown and a standalone regression script. The script was executed: failure against the broken checkout, success against the corrected checkout.
- The local browser journey passed with controlled responses and actual HTTP probes. Runtime hardening closed post-completion calls, timeout, evidence-delivery and raw-provider-error leakage issues.
- User chose Vercel. Hosted runs use a single streamed request instead of requiring later requests to recover in-memory state. Four deployment tests cover validation, corrected verification, streaming and disconnect cancellation.
- Product model key remains absent. Claude Code's Opus 5 subscription usage is separate from the application's model API access.
- REVIEW.md is the user's requested plain-language project brief. Deployment and final test results are recorded there and in VERIFICATION.md.
- Final local checks: 35 tests pass, build/typecheck pass. Production UI and corrected-checkout endpoint verified. Node startup exposed extensionless runtime imports and then the package's CommonJS-to-ESM dependency path; both fixes exist locally, with the explicit shipped ESM entry checked under disabled require(ESM).
- Last deployment attempt was rejected by automatic approval review because its usage limit was reached. No alternate tool/worker may bypass that rejection. The user has the exact manual command. Working hosted model routes remain unverified.
- Exact-path Git trust was added for the user account; first source checkpoint is 8d64800 under the user's authorship. Local credential files remain ignored. Final source backup and judge access are tracked separately.
- Independent JUDGE_VERDICT.md was reviewed. The demo now ends with the exportable test; unsupported rank probabilities and tamper-evidence language were not adopted. Claude Opus 5 completed CLAUDE_NEXT_TASK.md and delivered CLAUDE_DEMO_REVIEW.md; its concrete walkthrough/export findings were integrated.
- September 6 independent work: neutral stage priorities replace answer-shaped prompts; hosted config/start degrade safely if runtime loading fails; one shared regression/report generator serves browser, server and CLI. A Node-built-ins recorded viewer serves built assets without model dependencies. Changed imported inputs, visible save link, desktop/mobile view and app-server-stopped import were checked with a controlled artifact, not a genuine AI run.
- A fresh local Git clone of 8d64800 installed 145 packages from the user's pnpm cache with a frozen lockfile and zero downloads, then passed build and fixture checks. Final source revision verification is tracked in VERIFICATION.md. This does not prove an external judge can access the repository or a real run works without internet.
- DEMO.md now contains exact regression, corrected-fixture, evaluation and recorded-viewer commands. SUBMISSION.md is an unsubmitted entry draft. User is handling manual prerequisites; no extra plugins are currently needed.
- Final application source 25ec3c10fd3b3714df6233ebf3b4545f03c98184 passed all 35 tests and build. A fresh GitHub clone of that exact hash passed frozen cached installation (145 reused, zero downloaded), build, twelve fixture HTTP cases, three invalid cases and seven core tests, including standalone broken/corrected execution. No additional provider call was made.
- Private backup was created under the newly active GitHub account 0xsaroj001, rather than the earlier checked Harshyadav442277 account. Codex disclosed the destination mistake and requested transfer to Harshyadav442277. Recipient acceptance remains pending; verify actual ownership and update the remote afterward. Both accounts were already signed in; no global account switch was made. Private backup and requested transfer do not establish judge access.

## Next evidence to record

Exact installed package version; first real provider run; peer-triggered action revision; control results including failures; runtime limits; browser journey; clean-checkout run; network-off behavior; recording; repository URL; actual submission confirmation. Update `GAPS.md` and `DEMO.md` as those facts change.
