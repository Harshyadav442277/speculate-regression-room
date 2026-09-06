# Claude: start the runtime build now

The user has authorized full execution and asked Codex to coordinate. Read FINAL_IDEA.md, EXECUTION.md, ARCHITECTURE.md, src/contracts.ts and the latest CODEX_IDEAS.md. Your source findings about terminal model_message and error isolation are accepted as important leads; verify against the installed package and tests. Stop ideation.

## Ownership and interface

You own only `src/runtime/**`, `tests/runtime*`, and `CLAUDE_STATUS.md`. Codex owns shared contracts, dependencies, core probe/report/evaluation code, scripts, API/UI and integration. Do not edit those without a file handoff. Write requested contract/dependency changes in CLAUDE_STATUS.md. Do not overwrite either idea history.

Dependencies are being installed at root with pnpm: @mozaik-ai/core 4.0.5, zod 4.3.6, dotenv 17.4.1, tsx, TypeScript. Use installed declarations, not stale docs. Do not run concurrent package installs. Global npm is unreliable here. Confirm readiness by checking node_modules/@mozaik-ai/core/package.json.

Export `runInvestigation: RuntimeDriver` from `src/runtime/index.ts`; types live in `src/contracts.ts`. Also expose a safe configuration check returning readiness/provider/model without credentials. Model/provider come from local .env. Do not read credentials from unrelated projects or put keys in status/logs.

## Deliverable, in priority order

1. Two actual Mozaik model participants with overlapping loops, equal probe access and different initial priorities (pricing/tax). Use RuntimeHost.probe for all observations, getEvidence for shared evidence, record for domain/observability events, and conclude for evidence-linked conclusions. Never read fixture source, operator variant or hidden answer tables into agent prompts.
2. Cooperative policy: intercept at an actual pending tool/action boundary when fresh peer evidence exists. Save the proposed action and its evidence revision, then make a bounded model reconsideration using that new evidence. Record before/after proposal, evidence IDs and whether it changed. Do not hardcode a fault-to-agent-kill table. No midstream cancellation claim. A current call can finish. Maintain valid model/tool context and terminal transition shapes.
3. Independent policy: same agents/tools/model limits, boundary reconsideration disabled. This is an ablation. Single policy: one capable generalist with all evidence and early stopping. Do not deliberately handicap the control. Both controls reuse observations through the host.
4. Bound total model requests and per-call timeouts; honor host.signal; prevent multiple loops per participant. Manage promise failures explicitly: Mozaik runLoop fire-and-forgets in inspected source. Never solve that by silently swallowing global unhandledRejection. Wrap event handlers so one failed observer cannot erase a run; emit failure evidence and reject cleanly.
5. Meaningful installed-package tests using a clearly labelled deterministic custom runner if credentials are not configured. Prove overlapping loops, actual next-call interception, correct terminal shape, bounded budgets and provider-error propagation. A deterministic runner is test evidence, never live AI or a benchmark win.
6. If a local provider is ready, run a minimal real provider smoke and retain trace in artifacts/private. Coordinate with Codex before larger paid evaluation to avoid duplicate spend. No provider model is assumed available until tested.

Use event types in ARCHITECTURE.md plus `model.requested`, `model.completed`, `agent.started`, `agent.failed`, and `mozaik.event` as needed. `action.reconsidered` data must carry `before`, `after`, `peerEvidenceIds`, and `changed`. Report token usage as null when unavailable, never invented zero. Only actual probe executions are counted by Codex's host.

Write acknowledgment and current ownership to CLAUDE_STATUS.md immediately, then implement. Update it after each milestone with commands, results, unresolved issues and next step. Run `pnpm typecheck` and your targeted tests. Do not claim completion from source reading alone. A useful partial implementation with exact failures is better than another idea ranking.

The next checkpoint is a working installed-package runtime, not a UI. Scope and safety caps can shrink; correctness and honest reporting cannot.
