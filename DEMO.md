# SPECULATE — demo contract and current commands

Status September 6: local application and hosted interface implemented. The local judge journey has passed with controlled responses and real HTTP probes. Real-provider demonstration and video are not yet captured. See VERIFICATION.md for the exact public checks.

## Application setup and exact steps

Public app: https://speculate-regression-room.vercel.app

Local prerequisite: Node 24.x and pnpm 11.19.0.

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Expected: checks exit 0; local app opens at http://127.0.0.1:4317. Without a provider key, Start is disabled and setup is requested; this is not a connection-success result.

For local real runs, configure .env from .env.example and restart. For Vercel, add the chosen provider key, SPECULATE_PROVIDER, an installed SPECULATE_MODEL and SPECULATE_RUN_TOKEN (16+ characters) in Production environment settings, then redeploy. Never put keys in the browser, chat, source or video. Enter only the private demo access code in the page; hide it in recordings.

1. Open the app in a fresh tab. Expect a ready state only after provider settings and the hosted access code exist.
2. Keep the initial quote or change a valid input. Select Pricing regression and the two-agent cooperative policy. Click Start investigation. This uses real model calls once configured.
3. Expect the initial HTTP reproduction: 18,900 expected, 17,010 returned for the default input. Two investigator lanes then update from actual run events.
4. Inspect the evidence. If tax is disabled, that specific default probe should show 18,000 expected, 16,200 returned. Other model-selected probes may differ; never force this step into the recording as if it happened naturally.
5. Expand any actual plan-change card. Show the old action, new action and referenced peer observation. If no change happened, state that; do not fabricate one.
6. On completion, check both conclusions cite evidence. Export run JSON, report and regression test. Incomplete runs must stay labelled incomplete.
7. Click Check corrected fixture. Expect every saved case to pass against the explicitly prebuilt corrected checkout. This is not an AI-written fix.
8. Run the exported regression.mjs against the broken fixture below: expect exit 1 for captured failing cases. Stop that fixture, start correct mode, rerun the same file: expect exit 0.
9. Open recorded run and select the saved JSON. Expect Recorded run, preserved evidence and no new model calls. A controlled artifact must instead say Recorded · controlled test.
10. Repeat with the single and no-reconsideration controls through the evaluation command, retaining failures as well as successes. Do not present controlled responses as comparison results.

Hosted runs stream within one request. If the connection is lost, observed results may remain visible, but the final report cannot be recovered automatically. Keep a genuine exported recording for the fallback.

For UI checks without any model call, run `pnpm dev:test` and open http://127.0.0.1:4319. Expect Controlled test on the page and execution=test in exported JSON. Its action choices and explanations are scripted.

## Commands that work now

From the project root:

```powershell
node research/checkout-fixture/verify.mjs
node --experimental-transform-types research/runtime-review/check.ts
```

Expected first command: exit 0, JSON `status: PASS`, `httpProbeCases: 12`, `invalidInputChecks: 3`, `realProviderCalls: 0`, `mozaikRuns: 0`.

Expected second command: exit 0, JSON `result: PASS`; peer evidence arrives before the second fake stream chunk; the stream completes before interception; the next mocked tool is skipped. Node may print its experimental TypeScript-transform warning. This is a source check with fake inference, not the actual agent demo.

For manual fixture inspection, run:

```powershell
node research/checkout-fixture/quote-service.mjs discount-twice 4318
```

Then, in another PowerShell terminal:

```powershell
$quoteInput = @{ unitPriceCents = 10000; quantity = 2; discountBps = 1000; taxBps = 500 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://127.0.0.1:4318/quote' -Method Post -ContentType 'application/json' -Body $quoteInput
```

Expected `totalCents`: `17010`. The contract expected total is `18900`. The fixture terminal prints its mode for the operator; do not feed that terminal/source into the runtime agents.

## Intended 90–120 second judge story

These times are editorial targets, not fabricated execution timings. Record the actual runtime. Label any cuts, time compression, or recorded mode.

| Segment | Action | Exact thing the viewer should be able to verify |
|---|---|---|
| 0–15 s | Show the complaint and Start | A 18,900-cent expected quote returned 17,010; two named agents start a real run |
| 15–35 s | Show concurrent investigation and one useful result | Both participants are active; an executed probe changes what is supported |
| 35–55 s | Show a real peer-driven plan change if one occurred | A specific proposal changes after identified peer evidence; it is supporting evidence, not the final benefit |
| 55–75 s | Read the conclusion and export the regression file | The developer gets cited findings and an executable test |
| 75–105 s | Run the saved file against broken and corrected checkouts | The same file exits 1, then 0; correction is explicitly prebuilt |
| 105–120 s | Close with the takeaway and honest limit | The judge can rerun the file; these cases do not prove every input or establish that two agents always win |

Do not make an agent perform a predetermined useless test solely to create a saving. If the live run does not produce the selected plan revision, show its real behavior and diagnose why; do not manufacture a transition in the UI.

## Script language

“A checkout returned the wrong total. Two investigators check different explanations and share what they actually find. This peer result changed the next check. Here is the test file the investigation produced: it fails on the broken checkout and passes on the corrected one. You can run it yourself.”

Only speak the peer-change sentence when the recorded real run supports it. Present controlled runs as engineering checks, never as live AI.

Avoid: “We killed the model mid-sentence,” “concurrency always saves tests,” “we invented parallel diagnosis,” or “AI repaired production.” If a comparison shows an advantage, quote only the measured value and describe the tested cases.

## Required rehearsal checks before calling this ready

- Re-run the actual install/start/export commands from a clean checkout.
- Run the complete browser journey from a clean state, including opening the exported report.
- Validate a genuinely reserved evaluation variant; distinguish it from public regression fixtures.
- Exercise missing credentials and provider timeout. The UI must preserve evidence and show incomplete status.
- Capture one real provider-backed run. With external network unavailable after setup, load it with a persistent “Recorded run” label; no fabricated live inference.
- Verify a fresh clone with documented prerequisites and installation. This test normally requires initial dependency connectivity and is separate from the offline test.
- Ensure repository access, recording access, description, and the concurrency explanation are ready for the actual submission page. Obtain actual submission confirmation.

No provider-backed run, genuine demo video or submission is verified yet. Controlled application browser checks and deployment are recorded separately in VERIFICATION.md.
