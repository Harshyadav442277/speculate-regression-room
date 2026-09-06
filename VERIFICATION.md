# Verification record

Updated September 6, 11:43 IST. Verification is separated from submission and ranking evidence.

## Latest integration and deployment

- Final working-tree `pnpm build` exits 0, including strict typecheck. `pnpm test` exits 0: **35 passed, 0 failed**, about 41 seconds. This includes the latest neutral agent priorities, dynamic runtime loading and shared browser/server/CLI exporter. Four hosted-route tests and seven distinct runtime hardening tests are included; seven duplicated tests were removed. Cooperative and independent success tests require completed runs with both cited conclusions, not merely intermediate events.
- Runtime imports explicitly target the ESM build shipped by pinned Mozaik 4.0.5. `node --no-experimental-require-module --input-type=module` successfully imports that entry. This reproduces the relevant compatibility restriction locally without a model call.
- Vercel production alias: https://speculate-regression-room.vercel.app. Latest deployed ID: dpl_DssRguEaH63ytQrD9cBnn2fUWN5f. Public HTML returns 200 without Vercel authentication; hosted POST /api/verify executed two corrected cases, 18900 and 19695 cents, both passing. Vercel's first build completed a clean dependency installation.
- **The deployed /api/config and /api/investigate still fail at startup.** First error was extensionless local ESM imports, fixed by Claude. Second was the package's CommonJS entry requiring its ESM cloud dependency under Vercel instrumentation. Codex's explicit ESM-entry fix passes all local checks but is not deployed yet.
- Automatic approval review rejected the final `pnpm dlx vercel@59.11.7 deploy --prod --yes --scope wukong4` attempt because its usage limit was reached. The user has the manual command. Do not route around that rejection through another tool or worker. After deployment, verify config returns JSON, missing-provider start fails safely, cross-origin start is rejected, and the public browser loads its expected setup state.
- Vercel Production settings were listed by name only: no project environment variables configured. No provider secret was read or printed. Local .env.local created by Vercel linking is ignored; .env.example remains eligible for source control.
- User-account Git trusts only this exact project path. Initial source commit: 8d64800c6bac2968adef40820b84378eac6eb004, authored solely by Harshyadav442277. Final reliability changes are being checkpointed separately. Historical upstream attribution and licenses were preserved.
- Claude Opus 5 coding tasks were run through the actual installed CLI and independently integrated. This is not app-provider evidence. A separate worker's JUDGE_VERDICT.md was read; its unsupported loss probabilities and tamper-evidence claim were not adopted.

An additional read-only public config request at approximately 11:40 IST still returned 500. Final hosted browser/export verification must follow the pending deployment.

## Independent checks completed September 6

- Fresh local Git clone of 8d64800 with no shared node_modules: `pnpm install --frozen-lockfile --offline --store-dir C:\Users\hyada\AppData\Local\pnpm\store` reused 145 cached packages and downloaded zero. Build and fixture checks passed. This verifies the documented setup with a warm dependency cache; it is not an external judge-access or brand-new internet machine check.
- Canonical exports now live in web/export.js with a typed server wrapper. The existing regression execution test runs that generator against actual broken/corrected HTTP fixtures and observes exit 1/0. Fourteen affected core/hosted-route tests passed during integration; all 35 passed after final changes. Served /export.js returned 200.
- Compiled hosted handlers under Node with require(ESM) disabled: missing configuration returned safe not-ready JSON. Temporarily making only the compiled runtime config module unavailable made GET return 200 with ready:false and an authorized start return 503 with a generic message. The compiled file was restored. No provider call was made.
- Recorded viewer: Node built-ins plus built assets only, on localhost:4320. After loading the page, stopped its server and confirmed it was unreachable. Imported a controlled artifact containing actual HTTP results; it displayed 7351/3/1750/825, expected 19695, observed 16248, three evidence rows, zero model requests, and Recorded · controlled test. This is an app-server-unreachable check, not full system internet disconnection or a genuine model recording.
- At a 390-pixel viewport, no horizontal overflow was observed; imported inputs and results remained visible. The browser console had no warning/error entries in the tested flow. After restarting the viewer with final assets, the regression export produced a visible Save regression.mjs link with the download filename. The browser's download event did not provide a completed file; actual download completion remains unverified. The documented CLI artifact path avoids depending on that behavior for rehearsal.
- `pnpm evaluate` exited 0 and printed nine cells, rotating cooperative/single/independent policies across three public cases. It explicitly reported plan-only mode and made zero model requests. Execution remains pending credentials.
- Actual Claude Opus 5 worker finished CLAUDE_DEMO_REVIEW.md. Codex integrated the exact-command, scenario-matching, prompt and exporter findings. Its suggested minimum nonzero rate was corrected because rounding can still produce an honest pass.

## Executed by Codex

- `node node_modules/tsx/dist/cli.mjs --test tests/core*.test.ts`: 10 tests pass. Real loopback HTTP, simultaneous deduplication, independent exact rounding, provenance, seed exclusion, request/probe budgets, sync/async observer isolation, failed-probe retry accounting, timeout/cancellation, export execution, API request validation and double-start rejection.
- The exported standalone Node test exits 1 against the broken fixture and 0 against the prebuilt corrected fixture, using the same saved cases.
- Latest final typecheck/build and runtime integration results are recorded above; these supersede the earlier pre-hardening checks.
- Browser Playwright through the existing in-app tab: started the labelled controlled test, saw 18,900 expected / 17,010 observed, three real probe rows, the scripted revision explicitly in test mode, and `3/3` corrected-fixture verification. Changed input and single policy through WebMCP; observed 19,695 expected / 19,695 actual on the correct fixture and a generalist-only lane.
- Imported the controlled artifact into the provider-unconfigured local viewer: recorded/test labels, evidence, conclusions and export controls appeared; live start and remote verification remained disabled as appropriate.
- WebMCP tools registered. Read-state and valid controlled start updated the visible UI; invalid negative quantity was rejected without changing state. This is not a paid/live-model result.
- The browser download event wait timed out despite no console errors. HTTP export content and standalone execution are verified; actual browser download completion still needs verification.
- Git initialized inside this project; `git rev-parse --show-toplevel` resolves exactly to this workspace. No parent-home repository staging occurred.

## Claude runtime work integrated and rerun

Installed Mozaik participants, deterministic runner overlap, boundary reconsideration, seed freshness, controls and error handling are covered by the final 35 passing tests. The findings in RUNTIME_REVIEW.md are retained as history; their new stopping, deadline, evidence-delivery and safe-error cases pass. This still uses controlled inference, not a real app provider.

## Not yet established

Real app-provider calls; an unscripted useful peer intervention; comparative diagnosis quality/cost/latency; held-out fault handling; a real replay artifact; full network-disabled test; browser download completion; working production model routes; recording; judge-accessible source; dashboard submission.
