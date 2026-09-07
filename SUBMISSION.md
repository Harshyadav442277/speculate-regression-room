# Submission — form fields, paste-ready

Deadline: Monday 7 September, 09:00 CET → **12:30 IST**. Fields below match the dashboard
form exactly. Paste each block into the matching field.

---

## DEMO OR VIDEO URL

```
<paste the video link>
```

---

## WHAT DOES IT DO?

```
A checkout service returns the wrong total and nobody knows why. SPECULATE puts two AI
investigators — Pricing and Tax — into a shared room with the running service and one
shared evidence log. Each one probes the real service over HTTP, and every result it gets
back is immediately visible to the other.

The point is what happens between them. When one investigator has already decided on its
next probe and new evidence from the other arrives, SPECULATE catches that probe before it
runs and gives the investigator one chance to reconsider using what it just learned. The
run records the original probe, the replacement, and the exact peer evidence that caused
the change.

You end up with an evidence table of real request/response pairs and a standalone
regression.mjs you can run yourself: it exits 1 against the broken service and 0 against a
corrected one. The corrected service was written by hand beforehand — SPECULATE
investigates and explains, it does not repair code.
```

---

## HOW DO THE AGENTS RUN CONCURRENTLY?

```
Three participants run as overlapping Mozaik 4.0.5 loops, not scheduled turns: a
generalist that reproduces the reported failure, then Pricing and Tax investigating in
parallel. The saved run shows both specialists' participant.joined and message_received
events interleaved, and their inference and function_call phases overlapping in time.

Shared state is an append-only evidence log with a revision counter. Every probe result —
the inputs, the expected cents, the actual cents observed from the live service — is
appended and readable by every participant. Nobody writes to another agent's context
directly; they coordinate only through evidence that was actually measured.

Coordination happens through a Mozaik action-boundary interceptor. Each participant
records the evidence revision it was working from when it prepared its next action. On the
next transition, the interceptor compares that against the current revision, and if peer
evidence has landed since, it holds the pending action and issues one bounded
re-evaluation with the new evidence attached before the action executes. It cannot
interrupt a model response already streaming — it acts at the next action boundary.

This is not scripted. There is no fault-to-agent table anywhere in the code. The evidence
is presented and the model decides.

From the saved live Gemini run:

  Pricing probes quantity=1        → expected 9450, actual 8505
  Tax has a probe pending          → quantity=2, taxBps=0
  Pricing's evidence lands (rev 2) → interceptor holds Tax's action
  Tax's probe changes              → quantity=1, taxBps=0
  Tax probes                       → expected 9000, actual 8100

  action.reconsidered  changed: true  peerEvidenceIds: [e0dc1e73…]

Tax's original probe would have varied two things at once. After seeing Pricing's result
it isolated the discount from both tax and quantity. All three evidence rows then came
back at exactly 0.9× expected — the discount is applied twice.

The same tools, fixtures and 12-request cap also run a single-generalist policy and a
two-investigator policy with reconsideration disabled, so the coordination can be turned
off and compared. Failed runs and ties are kept.

Honest limits: this run stopped on a provider rate limit at 7 of 12 calls, so no
investigator wrote the final diagnosis — the 0.9× reading above is ours from the evidence
table, and the UI shows the run as incomplete. The checkout cases are public development
cases, not a blind benchmark. Anything labelled "controlled test" in the app is a
deterministic runner, not live AI.
```

---

## SCREENSHOTS

Upload these three, in order, from `artifacts/private/demo/`:

1. `01-overview.png` — two investigators running, evidence table filling
2. `02-interception.png` — the interceptor holding the pending action
3. `03-action.png` — before/after probe with the cited peer evidence

All well under the 5 MB limit.

---

## Repo

```
https://github.com/Harshyadav442277/speculate-regression-room
```

---

## Rules checkbox

Read them, then tick it. Do not skip this — the entry is void without it.
