# SPECULATE — evidence changes the plan

Selected September 5, 2026, approximately 22:35 IST, after independent idea passes and reciprocal review. This file fixes the build direction. The idea files preserve research history; they are no longer competing build specifications.

## The decision

Build a small debugging application in which **two concurrent Mozaik investigators diagnose an incorrect checkout quote, share actual probe results, and revise their next action when a peer's evidence changes the explanation**.

The user is a developer investigating a reproducible API regression. The useful output is an inspectable diagnosis report containing the observed failure, executed probes, changed hypotheses, and a standalone Node regression check that can run without the agents. The developer can change the initial quote input; the same captured cases can be checked against a labelled prebuilt corrected fixture.

**Claim, as the build objective:** A developer can turn overlapping debugging attempts into one reproducible diagnosis, because fresh evidence changes what the active investigators do next.

**Plain words:** Two investigators work on the same broken checkout. One finds a result that contradicts the other's explanation. The other changes course before wasting another test. You can inspect what changed and why.

## The memorable flow

1. A checkout should quote 18,900 cents but returns 17,010.
2. Pricing and Tax investigators start together, each choosing probes from the same allowed interface.
3. A probe with tax disabled still returns the wrong total: 16,200 instead of 18,000.
4. The Tax investigator receives that result while the investigation is active and revises its tax-only hypothesis and next proposed action. The application shows the actual before/after plan, linked to that evidence.
5. Further results implicate discount handling. The same saved probe set passes against a clearly labelled prebuilt corrected version.
6. Export the diagnosis, probe inputs/outputs, action revisions, and measured run statistics.

Steps 1, 3, the corrected fixture arithmetic, and the standalone regression export have been executed and verified. The live agent behavior and UI remain unverified. Do not force or animate step 4 if the real agents did not perform it.

## Why choose this after the critique

It keeps Claude's strongest contribution—peer evidence steering the next action—and replaces the unsupported provider-cancellation claim with the actual Mozaik execution boundary. It keeps the testable evidence from Faultline while using a runnable local program instead of invented physical-machine sensor readings. It has a concrete outcome a judge can reproduce without external integrations.

The competitive case is precise execution and a clear demonstration of collaboration. We have not established a new algorithm, a world-first capability, or superiority to existing AI SRE products. No top-two probability is known. The strongest reason it could lose is that a judge sees a small scripted debugging example with unnecessary agents. The live action-change trace, stronger control, and an evaluator-reserved variant must address that objection.

## What is fixed and what is cut

**Fixed:** two real Mozaik agents; one local quote API; peer evidence; bounded replanning before the next action; a compact two-lane UI; actual result comparison; an exportable report; visible live/recorded mode; tests and a recorded demo.

**Cut:** provider stream cancellation; “squashed mid-word” graphics; hardware diagnosis; arbitrary websites or repositories; production access; auto-generated fixes; four or more agents; voice; authentication; database setup; general tracing SDK; cloud integrations; large scenario libraries.

The corrected implementation is prebuilt and labelled. A test fixture is labelled as a test fixture. Switching to it is not autonomous repair.

## Judge-facing proof

- Show overlapping activity from two real Mozaik participants.
- Show an actual proposed action that was revised because of identified peer evidence.
- Show authoritative API results, not an agent vote about whether the test passed.
- Export the evidence so the judge can reproduce it.
- Report elapsed time, actual probe executions, proposed/revised actions, and model usage separately. Never invent a “tests saved” or speedup number.

The same harness should support a no-replanning ablation and an adaptive single-agent or sequential control. The latter must also reuse evidence and stop investigating disproven explanations. Two agents need an observed benefit; comparing only against deliberately wasteful behavior is insufficient.

## What is already verified

- `node research/checkout-fixture/verify.mjs`: PASS; 12 actual loopback HTTP cases and 3 invalid-input checks; no external requests.
- `node --experimental-transform-types research/runtime-review/check.ts`: PASS; copied upstream control flow with fake inference confirms that interception can precede the next tool action while the current stream completes. This is not a full-package or real-provider result.
- No `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY` was present in the current Codex shell. Credentials elsewhere have not been searched. Provider execution remains an implementation prerequisite.

## Build order and handoff

Read `PRD.md`, `ARCHITECTURE.md`, `PHASES.md`, `GAPS.md`, and `DEMO.md`. The first build milestone is two installed-package agents with one real peer-triggered action revision, timeboxed to 60 minutes. A failure there changes implementation scope; it does not reopen five unrelated ideas automatically.

Suggested parallel ownership, pending Claude's acknowledgment: Claude takes the pinned Mozaik runtime, agent definitions, and replanning hook; Codex maintains fixture correctness, controls, verification, and integration review. Agree before editing the same module. The runtime-to-UI event contract is specified in `ARCHITECTURE.md`.

Internal feature freeze: September 6, 19:30 IST. Internal submission target: September 7, 06:00 IST. These are our buffers, not organizer deadlines. See `PHASES.md` for the official timezone ambiguity and recovery cuts.

The idea is finalized with the sharper runnable-regression deliverable. The latest execution review and ownership are in EXECUTION.md. Full-build readiness and hackathon submission remain unverified, as tracked in GAPS.md.
