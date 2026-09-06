# SPECULATE — gaps and evidence status

Updated September 6. The application is deployed to Vercel; final endpoint verification is recorded in VERIFICATION.md. Deployment does not establish real-model reliability, submission or competition readiness.

| Priority | Gap | Current evidence | Resolution |
|---|---|---|---|
| P0 | Real provider is not configured in this shell | Standard OpenAI/Anthropic/Gemini key variables absent; other credential locations not searched | Configure a provider locally, then run and retain actual trace |
| P0 | Agent contribution unproven | Installed Mozaik loops and controlled action revisions work; real-model behavior is unknown | Capture a real peer-driven change and compare an adaptive control |
| P0 | Hosted model setup missing | Public UI and corrected-case verification deployed; provider key and access code absent | Add Production settings, redeploy, verify one bounded real run |
| P0 | Final hosted startup fix not deployed | Deployed package CommonJS entry fails on Vercel; explicit ESM-entry fix passes all 35 local tests | User runs the supplied deploy command; automatic approval review blocked Codex's attempt because its usage limit was reached |
| P0 | Registration/private brief/team/submission unknown | Public rules reviewed; participant dashboard and Discord not accessed | Verify with organizer/dashboard before submission |
| P1 | No controlled comparative results | All speed/cost/test-saving values are unknown | Same harness, honest controls and failure reporting |
| P1 | No blind evaluation variant reserved | Public correct/double-discount/double-tax fixtures exist | Evaluator reserves a separate configuration before prompt tuning |
| P1 | Model may infer an overly broad cause | Executable probes support limited distinctions | Link conclusions to observed evidence; preserve uncertainty |
| P1 | Prompt/context answer leakage | Runtime excludes source, operator variant and verification table; seed/fresh evidence delivery tested | Review real model context and avoid broader causal claims |
| P1 | Real-provider failure behavior | Controlled tests cover deadlines, malformed actions, budgets, stopping and preserved evidence | Verify those limits with the chosen provider; cancellation cannot stop an already-started provider request |
| P1 | Hosted stream recovery | A run is owned by one streamed response; disconnect cancellation tested | Export successful runs; do not promise reconnect/resume or durable hosted history |
| P1 | Full rehearsal/fresh clone/offline fallback incomplete | Controlled local browser journey and Vercel clean install tested | Finish public browser checks, fresh clone, dead-network rehearsal and real captured artifact |
| P1 | Demo recording and accessible repository absent | Project-local Git initialized; no judge-accessible remote or video verified | Package and verify repository/video/submission |
| P2 | Novelty gap not established | Similar reactive AI SRE systems exist | Make precise implementation claims; no “first” or competitor-absence assertions |
| P2 | Deadline timezone ambiguity | CET wording and ET/PT conversions differ by an hour | Follow earlier interpretation and internal buffer; confirm dashboard |

## Verified results

- `node research/checkout-fixture/verify.mjs` exited 0: 12 real loopback HTTP probe cases plus 3 invalid-input checks. Corrected mode matches all four expected contract results. Both fault variants produce their distinct observed patterns.
- `node --experimental-transform-types research/runtime-review/check.ts` exited 0: copied upstream control flow with fake collaborators allows the current stream to complete, then intercepts the next tool action. Full provenance and limitations are in its README.
- Implementation checks and current deployment evidence are in VERIFICATION.md. No product-provider calls or hackathon submission are established. Claude Opus 5 was used as the coding worker, separate from app model access.

## Claims that must stay out of the pitch

“Stops provider generation mid-word”; “proves universal root cause”; “first system to coordinate hypotheses”; “5 tests instead of 13”; “faster/cheaper than one agent”; “live AI works offline”; “AI wrote the fix.” None is established.

The idea remains selected. Its main competitive gap is proof that cooperation helps on a worthwhile problem, not more interface features.
