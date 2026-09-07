# SPECULATE

A regression investigation room: two concurrent Mozaik investigators examine an incorrect checkout quote, share executed probe results, and can reconsider a pending action when a peer produces new evidence. Export the observations as a standalone Node regression check.

**Current status (September 7):** Gemini is configured locally and on Vercel, and the hosted startup error is fixed. A real hosted run executed three probes but stopped on Google's exhausted free-tier daily quota; a complete diagnosis, comparative advantage, a completed recorded demo and submission remain unverified. All 36 tests and the build pass. See the latest section of [VERIFICATION.md](VERIFICATION.md) and [GAPS.md](GAPS.md). The controlled browser harness is labelled and is not a live-AI demonstration.

## Run locally

Requires Node 24.x (tested on 24.19.0) and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:4317. The viewer opens a saved run without model credentials. For live investigators, copy `.env.example` to `.env`, configure one provider and an available model locally, then restart the application. Keep credentials out of chat, source control, recordings and exports. Configuration readiness does not prove provider connectivity.

For the **scripted UI test harness**, which makes real local HTTP probes but no model calls:

```sh
pnpm dev:test
```

Open http://127.0.0.1:4319. Its page and artifacts say “Controlled test.” Never present it as a real agent run.

For a saved-run viewer with no model connection or package dependencies at runtime:

```sh
pnpm build
node scripts/recorded-viewer.mjs
```

Open http://127.0.0.1:4320 and choose a saved run.json. Build once before losing dependency connectivity. This viewer cannot start investigators or run the corrected-fixture button; use the standalone test below. A genuine model-backed recording is still pending.

## Useful output

Inspect expected/observed totals and evidence-linked explanations, then export `regression.mjs`, `report.md`, or `run.json`. The corrected-fixture button executes the saved inputs against a prebuilt implementation. It is not an autonomous repair.

The exported test has no dependencies or model calls:

```sh
node regression.mjs http://127.0.0.1:4318/quote
```

Start the owned fixture in another terminal:

```sh
node research/checkout-fixture/quote-service.mjs discount-twice 4318
# Or stop it and run the prebuilt corrected version:
node research/checkout-fixture/quote-service.mjs correct 4318
```

Start the same broken variant named in the exported file; use tax-twice for a Tax regression. The regression exits 1 if any captured case fails, and 0 if all pass. Passing captured cases does not prove all inputs are correct. Local, hosted and imported runs share the tested exporter. If an automatic browser download does not start, use its visible Save link or the files written by the investigate command.

## Checks and evaluation

```sh
pnpm typecheck
pnpm test
pnpm test:fixture
pnpm build
pnpm investigate cooperative discount-twice
pnpm evaluate
```

`investigate` requires a configured provider; without one it exits 2 before model calls. `evaluate` prints a plan only. `pnpm evaluate --execute` runs the bounded comparison after the provider smoke passes. Every attempted run, including failures, is retained in ignored `artifacts/private/`.

Three policies share tools and a total request budget: cooperative agents, the same pair without pending-action reconsideration, and one adaptive generalist. Public development scenarios are not a blind benchmark. Report correctness review, elapsed time, probes, requests and available usage separately. Overlap alone does not prove useful cooperation; changed actions are not automatically saved tests.

## Architecture and scope

Actual participants run through `@mozaik-ai/core@4.0.5`. Its action-boundary interceptor is where peer evidence can trigger reconsideration before a pending tool executes. It does not interrupt in-flight provider generation. Runtime code is in `src/runtime/`; independent evidence, exports and run controls are in `src/core/`.

The owned quote API binds only to loopback and accepts bounded quote inputs, without arbitrary URLs or shell access. Model tools receive neither source files nor the operator's fault selector. Vercel serves dist/ and bundles api/*.ts as Node functions. Each hosted investigation stays inside one streamed response. Hosted paid runs require the provider key plus a private SPECULATE_RUN_TOKEN of at least 16 characters. The page never receives the provider key. See .env.example for setting names; redeploy after changing Production environment variables.

Vercel is the selected host. An earlier unused Sites registration remains in .openai/hosting.json and is excluded from Vercel uploads. It is not the production deployment.

Read [EXECUTION.md](EXECUTION.md) for ownership and gates, [FINAL_IDEA.md](FINAL_IDEA.md) for scope, and [DEMO.md](DEMO.md) for exact steps. The six project documents and execution board supersede historical idea files. Current integration feedback is in [RUNTIME_REVIEW.md](RUNTIME_REVIEW.md).

[SUBMISSION.md](SUBMISSION.md) contains the entry draft and remaining access checks; it is not a submission confirmation.

Built for the [JigJoy concurrent-agent hackathon](https://build.jigjoy.ai/). Dashboard registration, deadline and private brief remain to be confirmed. The isolated source experiment in `research/runtime-review/` preserves attribution and the MIT license from [Mozaik](https://github.com/jigjoy-ai/mozaik); it is distinct from installed-package and real-provider evidence.
