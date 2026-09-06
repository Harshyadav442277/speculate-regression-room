# SPECULATE — product requirements

Status September 6: application, installed Mozaik runtime, shared evidence exporters, saved-run viewer and all three controls implemented. Controlled tests and a fresh local installation pass; real-provider behavior and comparative value remain unverified. Vercel deployment is the chosen delivery path. Decision authority: `FINAL_IDEA.md`; plain-language status: `REVIEW.md`.

## User, problem, and claim

One user: a developer investigating an incorrect checkout quote in a local API. The pain is keeping simultaneous investigations consistent when a new result invalidates an earlier assumption.

Build objective: the developer obtains a reproducible diagnosis whose evidence visibly changes the active investigators' next actions. The application must expose the difference between an agent's hypothesis and a checked API result.

Today the user can inspect logs, write probes, ask one capable model, or use an existing AI SRE product. Those are credible alternatives. We are demonstrating a small, auditable collaboration mechanism; no existing capability is claimed to be impossible elsewhere.

## One complete flow

Start an investigation on the supplied failing quote. Pricing and Tax agents run concurrently. Each may select any allowed probe, read the shared evidence, and revise its hypothesis. When fresh peer evidence arrives after an agent formed its next proposal, the runtime gives that agent an opportunity to re-evaluate before the action executes. The UI displays a changed proposal only if one actually changed. The developer inspects the implicated behavior, compares the corrected fixture, and exports the report.

## Required behavior

| Requirement | Acceptance evidence | Judging reason |
|---|---|---|
| Two actual Mozaik agents overlap | Real run trace with participant/loop identities and activity intervals | Genuine concurrency |
| Peer evidence changes an active plan | Original proposal, new evidence reference, revised action; no hardcoded event-to-verdict mapping | Concurrency / execution |
| Probes query executable fixture | Recorded request and actual HTTP response with a separate contract verdict | Technical execution |
| Hypotheses remain distinct from facts | Proposed/revised/retracted labels; every factual result links to evidence | Execution / demo clarity |
| Diagnose a bounded regression | Report explains discount-path behavior using actual discriminating probes | Usefulness / creativity |
| Corrected comparison is reproducible | Same probe inputs pass on labelled prebuilt corrected fixture | Execution / usefulness |
| A new viewer understands one screen | Two activity lanes, evidence table, current conclusion, export | Demo clarity |
| Offline fallback is honest | Visible recorded mode; no fabricated live tokens or silent replay | Execution / demo clarity |

Numbers such as two agents and one fixture domain are scope limits. They are not arbitrary opportunities to add more roles after the first demo works.

## Minimal product surface

One screen: incident input summary; Start/Reset; mode label; Pricing and Tax lanes; executed evidence; conclusion; export. An operator control can select the fixture variant for evaluation, but that private flag must stay outside model context. A compact expandable trace shows action provenance without exposing internal reasoning transcripts.

The product language should be plain: “Tax-only explanation withdrawn after probe E2,” “Next probe revised,” “Recorded run.” Raw runtime state names belong in the optional technical trace.

## Evaluation

Track correctness against observed behavior, time to a supported conclusion, actual API probes, proposed/revised actions, and model usage. Track event overlap separately from usefulness.

Use the same fixture contract and allowed tools for all controls. A no-replanning run isolates the coordination policy; an adaptive single-agent/sequential control challenges the product value. Report a control that ties or wins honestly. Do not handicap it by forbidding evidence reuse or adding delays.

The public `tax-twice` fixture is a regression case, not a blind holdout. Reserve one evaluation configuration separately before prompt tuning. A changed number alone is a weak robustness test; require the conclusion to change appropriately under a different causal variant.

## Ranked failure risks

1. The case is solvable as well by one model, and the extra agents merely narrate a scripted experiment.
2. The model incorrectly retracts a hypothesis or asserts a root cause beyond the probes' support.
3. Provider/setup failures or excessive replanning prevent a predictable judge journey.
4. Model context accidentally includes the fixture's cause or expected solution.
5. UI/export/rehearsal are left until after the useful build window.

Mitigate through the action-change trace, checked evidence, bounded execution, a controlled evaluation variant, and the feature freeze. Do not respond by adding unrelated features.

## Explicit limits

No production checkout use, payment actions, arbitrary repository tools, live code repair, physical-device diagnosis, provider-cancellation claim, or general debugging coverage. A displayed answer is a bounded diagnosis of the supplied fixture, not a proof of universal causality.
