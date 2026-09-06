# Verification record

Updated September 6, 11:07 IST. Verification is separated from submission and ranking evidence.

## Latest integration and deployment

- `pnpm build` exits 0, including strict typecheck. `pnpm test` exits 0: **35 passed, 0 failed**, about 34 seconds. Four hosted-route tests and seven distinct runtime hardening tests are included; seven duplicated tests were removed. Cooperative and independent success tests now require completed runs with both cited conclusions, not merely intermediate events.
- Runtime imports explicitly target the ESM build shipped by pinned Mozaik 4.0.5. `node --no-experimental-require-module --input-type=module` successfully imports that entry. This reproduces the relevant compatibility restriction locally without a model call.
- Vercel production alias: https://speculate-regression-room.vercel.app. Latest deployed ID: dpl_DssRguEaH63ytQrD9cBnn2fUWN5f. Public HTML returns 200 without Vercel authentication; hosted POST /api/verify executed two corrected cases, 18900 and 19695 cents, both passing. Vercel's first build completed a clean dependency installation.
- **The deployed /api/config and /api/investigate still fail at startup.** First error was extensionless local ESM imports, fixed by Claude. Second was the package's CommonJS entry requiring its ESM cloud dependency under Vercel instrumentation. Codex's explicit ESM-entry fix passes all local checks but is not deployed yet.
- Automatic approval review rejected the final `pnpm dlx vercel@59.11.7 deploy --prod --yes --scope wukong4` attempt because its usage limit was reached. The user has the manual command. Do not route around that rejection through another tool or worker. After deployment, verify config returns JSON, missing-provider start fails safely, cross-origin start is rejected, and the public browser loads its expected setup state.
- Vercel Production settings were listed by name only: no project environment variables configured. No provider secret was read or printed. Local .env.local created by Vercel linking is ignored; .env.example remains eligible for source control.
- User-account Git now trusts only this exact project path. Source was staged; final changes remain partly unstaged and no commit or remote has been created. The source checkpoint is still required. Historical upstream files contain harmless final blank lines; their attribution was preserved.
- Claude Opus 5 coding tasks were run through the actual installed CLI and independently integrated. This is not app-provider evidence. A separate worker's JUDGE_VERDICT.md was read; its unsupported loss probabilities and tamper-evidence claim were not adopted.

The prior local browser record below remains valid for that tested version. Final hosted browser/export verification must follow the pending deployment.

## Executed by Codex

- `node node_modules/tsx/dist/cli.mjs --test tests/core*.test.ts`: 10 tests pass. Real loopback HTTP, simultaneous deduplication, independent exact rounding, provenance, seed exclusion, request/probe budgets, sync/async observer isolation, failed-probe retry accounting, timeout/cancellation, export execution, API request validation and double-start rejection.
- The exported standalone Node test exits 1 against the broken fixture and 0 against the prebuilt corrected fixture, using the same saved cases.
- `pnpm typecheck` and `pnpm build` passed before the current runtime hardening edits. They must be rerun at integration freeze.
- Browser Playwright through the existing in-app tab: started the labelled controlled test, saw 18,900 expected / 17,010 observed, three real probe rows, the scripted revision explicitly in test mode, and `3/3` corrected-fixture verification. Changed input and single policy through WebMCP; observed 19,695 expected / 19,695 actual on the correct fixture and a generalist-only lane.
- Imported the controlled artifact into the provider-unconfigured local viewer: recorded/test labels, evidence, conclusions and export controls appeared; live start and remote verification remained disabled as appropriate.
- WebMCP tools registered. Read-state and valid controlled start updated the visible UI; invalid negative quantity was rejected without changing state. This is not a paid/live-model result.
- The browser download event wait timed out despite no console errors. HTTP export content and standalone execution are verified; actual browser download completion still needs verification.
- Git initialized inside this project; `git rev-parse --show-toplevel` resolves exactly to this workspace. No parent-home repository staging occurred.

## Reported by Claude, pending final integration rerun

Installed Mozaik participants, deterministic runner overlap, boundary reconsideration, seed freshness, controls and error handling tests. Critical integration findings are listed in RUNTIME_REVIEW.md; do not treat earlier green tests as resolving those findings until the new cases pass.

## Not yet established

Real app-provider calls; an unscripted useful peer intervention; comparative diagnosis quality/cost/latency; held-out fault handling; a real replay artifact; full network-disabled test; fresh Git clone/install; working production model routes; recording; judge-accessible source; dashboard submission.
