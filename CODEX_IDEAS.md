# Codex ideas: JigJoy / Mozaik hackathon

Updated: 2026-09-05, finalization pass after the reciprocal review. Stage: idea selected, build documents written, isolated source check and executable HTTP fixture verified. No application or real-provider run exists.

Objective: maximize the chance of a top-two finish through a distinctive, reliable demonstration of concurrent agents. No placement probability is known. The competitor field, private participant brief, and judges' preferences have not been inspected.

## Final decision — SPECULATE

**The idea is finalized: SPECULATE, with two concurrent investigators debugging an executable local checkout API.** Fresh peer evidence changes the next proposed action, and the developer receives a reproducible diagnosis report. `FINAL_IDEA.md` is the scope authority; `PRD.md`, `ARCHITECTURE.md`, `PHASES.md`, `GAPS.md`, `MEMORY.md`, and `DEMO.md` are the build documents. Historical fallback rankings below are retained as research, not active competing plans. Implementation remains unverified where `GAPS.md` says so.

Claude's complete independent pass and revised ranking have now been read. See the reciprocal review at the end for the changes, technical evidence, disagreements, and answers to its questions. The original numeric scores are retained for history but withdrawn as decision guidance. Peer file reviewed: 64,367 bytes, filesystem modified September 5 at 22:09:11 IST, SHA-256 `FC53E010405169A02D8A6087D90233FC96B8BB5FE0520DD60B209A129956401F`.

## Original independent shortlist — preserved, superseded by the review

**Original lead: RaceProof.** Two cooperating user agents find a bug that only appears when people act at the same time; a third participant turns the observed failure into an executable regression. The memorable result is one remaining seat, two confirmed bookings, then the same test passing against a corrected implementation.

This is conditional. A hardcoded two-request race with AI narration is too weak. The first experiment must establish useful agent-selected coordination on a fixture whose failing schedule is not supplied to the agents.

**Original fallback: Faultline Lab (endorsement withdrawn below).** Concurrent investigators test competing explanations against an executable local incident fixture. Generic AI incident investigation is already well covered by existing products. Only the experiment-and-refutation demonstration makes this worth considering.

Claude has not contributed a file yet. This document is the independent Codex pass, not a joint decision. Read `CLAUDE_IDEAS.md` when it arrives and add a reciprocal review below. Do not manufacture agreement or choose a project just because both agents suggested a common category.

## Global rules applied

Read directly: `C:\Users\hyada\.claude\CLAUDE.md`. The global Codex `AGENTS.md` was empty. This workspace was empty and was not a Git repository at initial inspection. The separate `buildMozaik` workspace was also empty when checked; its earlier Faultline idea was a proposal, not implemented work.

- Use one user, one painful problem, and one memorable flow.
- Explain the claim and challenge status quo, user demand, novelty, and ranked failure risks.
- Allocate work against innovation, technical execution, impact, UX, and sponsor use.
- Never claim a feature works until it is tested. Keep fixtures and replays distinguishable from live runs.
- Test the complete judge journey, dead-network behavior, and fresh-clone setup.
- Freeze features by 70% of the usable schedule; reserve the rest for verification and submission.
- During the build, maintain separate `PRD.md`, `ARCHITECTURE.md`, `PHASES.md`, `GAPS.md`, `MEMORY.md`, and `DEMO.md`. These are not being filled with an assumed product before idea selection.
- Preserve concurrent contributors' edits. Any future commits use the user's configured authorship and contain no co-author or generated-by trailers.

## Verified event facts and schedule

The [official rules, updated September 4](https://build.jigjoy.ai/rules), require work built during the event, use of `@mozaik-ai/core`, and at least two concurrent agents. Teams have at most four people and submit one entry. AI-assisted development is allowed. Submission needs a name, accessible repository, description, and concurrency explanation; video, deployment, and screenshots are recommended rather than mandatory. Judges emphasize concurrency, technical execution, creativity, and demo clarity. No numerical weights are published there.

The rules say Monday September 7 at **09:00 CET**, also expressed as **03:00 ET / midnight PT**. In September, the daylight-time interpretation of those American equivalents maps to 12:30 IST, while literal CET maps to 13:30 IST. Confirm the dashboard's intended timezone; plan against the earlier interpretation. The homepage still contains conflicting older schedule wording. Use the rules and subsequent organizer updates as authority.

**Internal submission target: September 7, 09:00 IST.** This is our buffer, not an official deadline. At this research pass, about 35 hours remain until that target. Freeze by September 6, 22:00 IST, or earlier if available working hours are less. Keep the final roughly 11 hours for verification, rehearsal, recording, and submission. Allow sleep; wall-clock time is not engineering capacity.

Registration, dashboard access, actual team membership, and submission remain unverified.

## Current Mozaik fit: important correction

The [current introduction](https://docs.jigjoy.ai/docs) explicitly describes v4 and says the older environment/handler-override style is gone. Do not implement from the older `AgenticEnvironment` / `BaseParticipant` proposal without verifying a deliberately pinned older version.

The [runtime documentation](https://docs.jigjoy.ai/docs/runtime) describes `defineRuntime`, `RuntimeState`, and `initializeRuntime`; the runtime factory returns membership, messaging, and loop functions. The [concurrency guide](https://docs.jigjoy.ai/docs/concurrent-agents) describes non-blocking per-agent loops, shared state, and membership events. These support evidence arriving while other participants are still active. The [models guide](https://docs.jigjoy.ai/docs/models) permits a custom inference runner, which could support controlled tests; compatibility still needs a spike.

Mozaik must own the actual agents, shared observations, and reactions. The browser driver or experiment runner should be a tool of those participants. A decorative import around an independently orchestrated workflow would fail our sponsor-use test. A proper alternative runtime could implement similar behavior; the requirement is substantial actual use, not a claim that Mozaik is the only possible technology.

Local checks passed: Node v24.19.0, pnpm 11.19.0, Git 2.51.0. `pnpm view @mozaik-ai/core version --json` failed with `ERR_PNPM_META_FETCH_FAIL`. Therefore the currently published package version, installation, and provider execution are NOT validated. Check package declarations against docs before selecting an implementation API. Do not confuse a registry network failure with proof that the library is broken.

## Decision method

These are internal planning weights, NOT official judging weights and NOT empirical predictions. Scores are 1–5 estimates of the scoped proposal, conditional on its core mechanism working. Feasibility and validity gates override arithmetic.

| Dimension | Weight | What earns it | Example allocation from a 20-hour implementation budget |
|---|---:|---|---:|
| Sponsor / concurrency | 35% | Real overlapping agents whose actions change in response to shared evidence | 7 hours |
| Technical execution | 25% | Measured outcomes, bounded runs, reproducibility, failure handling | 5 hours |
| Innovation | 20% | A specific improvement over named alternatives | 4 hours |
| UX / demo clarity | 10% | A judge sees the problem and outcome without reading agent chatter | 2 hours |
| Impact | 10% | A credible user receives a useful artifact or decision | 2 hours |

Build-hour allocation excludes the protected rehearsal/submission period. Features may serve multiple criteria, but do not double-count the hours. Frontend polish cannot consume the core-mechanism budget.

| Rank | Candidate | Innovation | Technical | Impact | UX | Sponsor | Weighted / 5 | Main gate |
|---:|---|---:|---:|---:|---:|---:|---:|---|
| 1 | RaceProof | 4 | 4 | 4 | 5 | 5 | 4.45 | Agents must discover useful coordination beyond scripted racing |
| 2 | Faultline Lab | 3 | 4 | 4 | 4 | 5 | 4.15 | Executed refutation must distinguish it from existing AI SRE products |
| 3 | RelayOps | 3 | 4 | 3 | 5 | 4 | 3.80 | Must outperform an ordinary scheduler on changing constraints |
| 4 | MergeCourt | 3 | 3 | 4 | 4 | 4 | 3.55 | Must fit the time budget and differ from existing coding orchestration |
| 5 | Evidence Delta | 2 | 4 | 3 | 3 | 3 | 3.05 | Must change a consequential decision, not just summarize documents |

## 1. RaceProof — reproduce the bug between two users

**Claim.** A developer of a small booking app can now turn an intermittent multi-user failure into a reproducible regression, because we solved the coordination and evidence capture between interacting user journeys.

**Plain words.** The website says one seat is left. Two people both get it. Our agents show exactly how that happened and give the developer a test to stop it happening again.

**Who cares / status quo.** A developer whose single-user tests pass but who receives occasional reports of duplicate reservations. Today they can handwrite multi-session tests, use race-testing tools, or adopt a broader testing platform. Those approaches already work. The proposed improvement is reducing the effort of identifying the conflicting steps and constructing the reproducer, not inventing concurrent testing.

**Nearest work and honest novelty.** [Playwright supports multiple browser contexts](https://playwright.dev/docs/browser-contexts). [PortSwigger documents sophisticated race-condition testing](https://portswigger.net/research/smashing-the-state-machine). [Antithesis provides fault exploration and deterministic reproduction](https://antithesis.com/product/), and [Bombadil explores UI correctness properties](https://github.com/antithesishq/bombadil). None of this is new as a category. The hypothesis to validate is a small, understandable workflow that uses cooperating agents to select interleavings and exports an ordinary test. This research does not establish that no competitor does the same thing.

**Agents and genuine concurrency.** Buyer A and Buyer B each control an isolated session and choose actions from the app's available operations. They publish observations and intended actions through Mozaik. A third auditor participant watches actual booking state, identifies a candidate invariant violation, and asks the buyers to rerun or change one step. At least the two buyer agents perform real overlapping work. Coordination messages alter their next actions before both journeys finish. The auditor's verdict comes from application state and request results, not model agreement.

**What requires overlap.** The failing state depends on interleaving two user journeys around shared inventory. A sequential journey baseline may miss it. However, a single agent with a parallel-execution tool can also discover it; that is an essential comparison, not a straw man to omit. A deterministic barrier can make replay reliable, but barriers alone do not prove agent collaboration is useful.

**AI necessity.** Agents propose the conflicting sequence from operation descriptions, observations, and previous outcomes. Tool code handles exact synchronization and verifies invariants. Kill the AI claim if every agent action is prewritten or if a tiny deterministic search finds the same cases just as conveniently. Do not give agents the bug location, successful schedule, or hidden expected answer.

**90–120 second demo target, not an achieved result.**

1. Show a local booking fixture and its passing sequential test.
2. Start the two user agents. Their shared observations and overlapping requests appear as a short event timeline.
3. Show the failure using authoritative state: `capacity = 1`, `confirmedBookings = 2`.
4. Export the observed schedule as an executable regression and rerun it successfully as a reproduction of the bug.
5. Switch to a clearly labelled, prebuilt corrected version of the fixture. Rerun the identical regression: `confirmedBookings = 1`; the other request is rejected or queued according to the specified contract.

Do not call the prebuilt correction an AI-generated fix. Do not present a seeded fixture as discovery of an unknown production vulnerability.

**Minimum scope.** One owned local app; two user agents plus auditor; a small typed operation vocabulary; an append-only event trace; invariant checking; replay export; one buggy and one corrected fixture. Discovery can begin with typed HTTP tools; browser views can show user state. Describe the tool surface accurately rather than claiming autonomous browser navigation if it is not implemented.

**Explicit cuts.** Arbitrary website crawling, real purchases, production integrations, authentication onboarding, distributed workers, autonomous code repair, visual locator generation, and large agent swarms. Tests stay within the supplied local fixture.

**Acceptance experiments.** Proposed targets: at least two overlapping inference/tool activity intervals tied to real Mozaik participants; one peer event demonstrably changing a later action; reproducible failure in 10/10 recorded-schedule runs; corrected fixture with no duplicate confirmation in those same 10 runs; and successful discovery on one withheld variation whose failing sequence is not in the prompt. Ten runs establish local repeatability only, not general reliability.

Compare four modes on the same fixtures: sequential journeys; a deterministic concurrent script/search; one agent able to launch parallel tools; cooperating Mozaik agents. Report time, calls/tokens, confirmed defects, and replay success. No artificial sleeps in the sequential mode to inflate speedup. A test-only scheduling hook must be disclosed and excluded from claims about naturally finding timing bugs.

**Ranked risks, highest first.**

1. AI and Mozaik become decoration around a preprogrammed race. This is the likeliest reason judges dismiss it.
2. Only the exact planted scenario works. A withheld case and explicit fixture labels address the evidence gap.
3. Timing is unreliable. Separate adaptive discovery from deterministic replay; cap attempts.
4. Browser/SDK setup consumes the build window. Start with a small typed tool interface and verify the actual package first.
5. The demo confuses “test failed” with “product failed.” Make the invariant and corrected outcome unambiguous.

**Estimate.** 16–20 focused engineering hours plus protected QA/demo time, assuming the runtime spike passes. This is a rough estimate, not a delivery commitment.

**Kill experiment.** Within the first 90 minutes after selection, demonstrate two Mozaik participants exchanging an observation that changes a subsequent action in the local fixture. Then check one altered workflow without supplying its answer. If only the fixed race script works, downgrade or replace the idea before building a dashboard.

## 2. Faultline Lab — test the explanation before trusting it

**Claim.** An on-call developer can now see which proposed cause survives a controlled experiment, because we connect parallel diagnosis to executable evidence and explicit refutation.

**Plain words.** Three investigators disagree about why a small service is failing. They try tests, show which explanations fail, and identify a change that fixes the local failure.

**Who cares / status quo.** A developer handling an unfamiliar service failure. Logs, recent-change review, runbooks, and AI SRE products already support this work. Access to real telemetry and integration setup are substantial obstacles to a weekend product.

**Nearest work / novelty.** [PagerDuty describes parallel hypothesis agents and live user intervention](https://www.pagerduty.com/eng/inside-pagerdutys-sre-agent-how-we-built-deep-incident-investigation/); [Azure SRE Agent documents parallel hypothesis testing](https://learn.microsoft.com/en-us/azure/sre-agent/tutorial-deep-investigation). The original Faultline proposal overlaps strongly with these. A visible sandbox experiment with negative evidence is a narrower product direction, but is not established as novel relative to all existing tools.

**Agents.** A telemetry investigator queries symptoms, a change investigator checks candidate changes, and a falsifier challenges their explanations and runs allowed local experiments. They publish evidence while peers continue working; later evidence invalidates an active line of investigation. Run experiments against separately reset fixture copies to prevent agents contaminating one another's results.

**Why agents / concurrency.** Several plausible explanations and evolving evidence can justify simultaneous exploration. A fixed static bundle usually does not need three agents. Compare against one agent with parallel tools, and against replaying known diagnostic checks. Mozaik should carry partial evidence and revision events during the run.

**Demo.** An apparent bad deployment attracts suspicion. An agent tests rolling back that deployment in a local copy and the error persists. A peer discovers retry amplification; a different local experiment disables it and the measured error falls. The interface keeps the rejected explanation and its test evidence visible. Exact metrics must come from execution. This is a planned scenario, not observed behavior.

**MVP / cuts.** One small service fixture, three candidate causes, three agents, typed evidence, two bounded local interventions, one clear result view. Cut production access, cloud integrations, Kubernetes, arbitrary shell tools, automated remediation, and optional agent-removal choreography until the core passes.

**Measures.** Correct cause identification on controlled variants; count of unsupported claims; time to the first valid refutation; experiment reproducibility; and evidence-event timestamps. One cause may be supported while another remains unresolved: no fake confidence percentages.

**Failure ranking.** (1) Looks like a smaller existing AI SRE product. (2) Diagnosis is scripted or the answer leaks through fixture names. (3) The experiments are a toy with no credible user path. (4) Multiple model calls add cost without helping. (5) Integration work displaces verification.

**Estimate / kill test.** 14–18 focused hours plus QA/demo. Within 90 minutes, two concurrent agents must use a peer observation to abandon one explanation and execute a discriminating test. Kill if the entire outcome is hardcoded or a single concise prompt performs equally well without the coordination burden.

## 3. RelayOps — keep a small event running when plans break

**Claim.** A volunteer coordinator can now adapt room assignments and staff coverage while work is underway, because multiple participants negotiate changes against the same live constraints.

**Plain words.** A room closes and a volunteer leaves. The event finds a workable new plan and explains what changed.

**Who cares / status quo.** A coordinator at a small community workshop. Shared spreadsheets, group chat, and scheduling software already handle much of the problem. Actual demand for autonomous agents is unvalidated; interview one coordinator before treating this as impact.

**Agents.** A session agent protects speaker/time requirements, a staffing agent maintains coverage, and a room agent checks equipment/capacity. Each receives changes and proposes reservations; a deterministic validator prevents double booking. Mozaik carries new constraints and rejection reasons so a participant can revise while the others continue.

**Novelty check.** Dynamic constraint scheduling and multi-agent negotiation are established ideas. We have not yet verified a specific closest product; this missing comparison penalizes the idea. The proposed distinction is transparent recovery from two simultaneous disruptions. It is not enough to rename an optimization algorithm as three agents.

**AI/concurrency test.** Messy natural-language constraints could justify model interpretation; hard constraints should be validated in code. If all inputs are structured, an ordinary optimizer is likely the better design. Simultaneous negotiation must improve completion or responsiveness over a central scheduler, not merely animate more messages.

**Demo / MVP.** Start with three sessions, two rooms, four volunteers. Inject a room closure and staff withdrawal while negotiations are active. Show a valid changed plan and one explicit tradeoff. Keep inputs local and user initiated. Cut maps, notifications, calendar integrations, routing, real emergency dispatch, and external communications.

**Measures.** Zero hard-constraint violations; resolution time; number of unnecessary assignment changes; correct recognition when no feasible plan exists. Never call an infeasible plan solved.

**Failure ranking.** (1) Deterministic scheduler is clearly sufficient. (2) User impact is speculative. (3) A colourful simulation looks more useful than it is. (4) Negotiation loops oscillate. (5) Vague soft constraints make evaluation subjective.

**Estimate / kill test.** 12–16 focused hours plus QA/demo. Give the same three disruption cases to a simple scheduler and the agents. Kill if the agents add no useful interpretation or recovery behavior.

## 4. MergeCourt — expose the conflict between two individually passing changes

**Claim.** A developer coordinating two coding efforts can now catch an incompatible assumption before accepting both changes, because we test their combined behavior while their authors are still active.

**Plain words.** Two changes each pass their tests. Together they break the app. The system finds the disagreement and checks a repair.

**Who cares / status quo.** A maintainer running parallel coding sessions, directly relevant to our own workflow. CI, integration branches, contract tests, and reviews already address this. The proposed gain is catching the semantic conflict early enough for the agents to react without waiting for a completed handoff.

**Nearest work.** [Mozaik's own examples describe baro's concurrent coding roles and conflict-related events](https://docs.jigjoy.ai/docs/examples). A generic team of coder/reviewer/fixer agents would compete with the sponsor's existing example. Our only plausible distinction is a very clear combined-change counterexample and repair contract.

**Agents / concurrency.** Client and service participants explore separate change assumptions. A contract auditor reads their proposed interfaces and executes combination tests while they remain active. It publishes a failing example that changes a participant's proposal. Use temporary fixture copies; never execute or mutate arbitrary user repositories in this MVP.

**Demo / scope.** One tiny HTTP contract; one field changes meaning in two incompatible ways; both isolated checks pass; the combined test fails; one scoped revision makes it pass. Cut general codebase indexing, GitHub integration, arbitrary patches, multi-repo dependency graphs, and autonomous merging.

**AI necessity.** The possible benefit is interpreting incompatible intent and proposing a minimal revision. A compiler or schema checker already catches many easy examples; choose a behavioral conflict they cannot catch alone. Concurrency must let the participants correct an active proposal, rather than presenting an ordinary sequential code-review chain.

**Measures.** Executed combined failure, passing revised test, unchanged unaffected behavior, actual overlapping work, and traceable revision caused by peer evidence.

**Failure ranking.** (1) Too close to baro and ordinary coding orchestration. (2) Code execution and patch reliability exceed the deadline. (3) Example is caught by a trivial type check. (4) Participants overwrite each other's state. (5) Demo becomes a wall of source code.

**Estimate / kill test.** 18–24 focused hours plus QA/demo, too much without a very narrow fixture. Kill if a compelling behavioral counterexample cannot be demonstrated in the first two hours.

## 5. Evidence Delta — notice when a new document invalidates a decision

**Claim.** A small project coordinator can now see which parts of a plan need reconsideration when a new requirement arrives, because agents track the evidence each decision depends on.

**Plain words.** A new message changes the deadline. The system shows which promises no longer fit and why.

**Who cares / status quo.** A coordinator reconciling a brief, schedule, and supplier note. Search, document chat, checklists, and human review already help. The pain is plausible; willingness to use this product is unvalidated.

**Agents / concurrency.** Scope, schedule, and evidence-checking participants read different local documents, share cited facts, and revise affected conclusions while others continue. A supplied late document forces a change before the full review is finished.

**Novelty and necessity.** Research swarms and document contradiction checks are crowded categories. Closest-product verification remains open. A single model with all three small documents may be adequate; this is the likely reason to reject it. Do not invent evidence merely to make the agents disagree.

**Demo / scope.** Three short fixture documents, exact source spans, one late amendment, one changed decision, and an explicit unresolved question. Cut live web research, OCR, email integrations, arbitrary PDFs, and autonomous outbound messages.

**Measures.** Citation correctness, correct handling of the newer authoritative source, unsupported-claim count, and time to update the affected decision. **Risks:** unnecessary multi-agent overhead; weak novelty; ambiguous source precedence; modest demo impact. **Estimate:** 10–14 focused hours plus QA/demo. **Kill:** compare to one model on the same bundle; reject if it reaches the same result as cleanly.

## Features we can defend if RaceProof wins selection

| Proposed feature | Judging reason | Evidence needed | Priority |
|---|---|---|---|
| Two real Mozaik agents with observation sharing | Sponsor / concurrency | Overlap plus an event that changes an active peer's action | Must |
| State-based invariant verdict | Technical execution | Actual application records match the reported defect | Must |
| Replayable regression | Technical execution / impact | Reproducer fails on buggy fixture and passes on corrected fixture | Must |
| Two sessions and one compact result timeline | UX | A new viewer can explain the bug and result without narration | Must |
| One withheld workflow variant | Innovation / technical execution | Discovery without supplying the failing schedule | Must before broad claims |
| Recorded demo plus explicit failure state | Demo clarity / execution | Unplug network, observe honest fallback, continue evidence inspection | Must |
| Agent-removal recovery | Sponsor adaptivity | Needed only if core case is already reliable | Cut by default |
| Autonomous patch writing or arbitrary website support | Weak return within deadline | Large additional reliability surface | Do not build |

## Proposed feasibility and delivery gates

These are next-step experiments, not completed checks and not an instruction to begin a full build during ideation.

1. **Idea convergence:** compare both files, resolve decisive disagreements with sources, and choose one lead plus one fallback. Do not merge every attractive feature into a larger product.
2. **Runtime spike:** pin an installable Mozaik version, match its declarations to docs, run two actual agents, and capture overlap and peer reaction. Fake inference can exercise failure handling, but a separate real-provider run is required before claiming live AI works.
3. **Mechanism spike:** the local application produces a real invariant violation and the trace reproduces it. If synchronization is instrumented, label it.
4. **Agent-value gate:** test the withheld variation and the deterministic/single-agent baselines. Lack of a speedup is acceptable if a different measurable benefit is demonstrated; unsupported superiority claims are not.
5. **Vertical slice:** one complete judge path, runtime-driven UI state, exported evidence, bounded error handling. Then the six global project documents must be maintained with exact commands and actual results.
6. **Freeze:** no new scope after September 6, 22:00 IST under this provisional schedule. Cut earlier if setup or available human hours require it.
7. **Judge verification:** clean checkout with documented install/run commands; browser journey where relevant; credentials missing; provider timeout; no-network behavior; replay integrity; recording; accessible repository; completed submission.

Fresh clone and dead network are separate tests. A fresh clone normally needs an initial dependency/browser installation with connectivity. After setup, the local fixture and saved evidence should remain usable without network. A labelled recorded run can support rehearsal and inspection; it does not prove live model inference works offline. Include an actual recorded successful provider-backed run before relying on replay.

## Open questions and requests for Claude

1. Beat RaceProof with a more distinctive but equally verifiable idea, especially outside developer tooling. Do not assume my ranking is correct.
2. Is RaceProof merely a thin agent layer over Playwright / race testing / property testing? Name the closest current implementation and the smallest credible distinction.
3. Can a single model with a parallel tool do everything the two buyer agents do? What fair experiment would settle this?
4. Find a compelling second workflow that demonstrates adaptation without creating an entire testing platform.
5. Is Faultline Lab's experiment/refutation angle still too close to existing AI SRE products to justify it as fallback?
6. Verify the published Mozaik version and dashboard brief if your environment can access them. The documented v4 API and the failed local registry lookup must not be conflated.
7. Recommend concrete scope cuts and the strongest reason the combined preferred idea might lose.

## Reciprocal-review protocol

- Codex owns `CODEX_IDEAS.md`; Claude owns `CLAUDE_IDEAS.md`.
- Preserve each independent ranking. Add dated review sections and revised rankings rather than quietly rewriting the initial opinion.
- Read the peer's full file before commenting. Cite specific candidate/section names and external evidence.
- Each review includes the strongest contribution, weakest assumption, at least two improvements, what changed, and what remains disputed.
- During active work, re-read after material peer updates and before proposing implementation. If the other agent is idle, leave explicit questions for its next turn; files do not wake an agent automatically.
- At most two comparison rounds before choosing the decisive experiment. New names and larger scopes do not count as progress.
- The final direction can be Claude's idea, Codex's idea, or one tightly scoped synthesis. Source of the idea is irrelevant; demonstrated merit decides.

### Codex review of Claude — original pending status, now superseded

`CLAUDE_IDEAS.md` was absent during the initial pass. The reciprocal review has since been completed and is appended at the end, preserving the initial independent analysis.

## Evidence status

Verified now: global guidance, public event rules, public current Mozaik docs, named primary-source competitors, empty starting workspaces, and local runtime versions.

Unverified: installed Mozaik API, provider connectivity, any candidate's implemented behavior, superiority to baselines, actual user demand, private brief, participant registration, and submission readiness. All acceptance numbers and demo outcomes above are proposed targets.

## Adversarial review — September 5, approximately 22:00 IST

The user explicitly requested a brutal assessment after sending Claude the research prompt. This section challenges our own ideas while preserving the independent first pass.

### The central mistake in the original ranking

The 4.45/5 for RaceProof looked more rigorous than it was. I assigned high sponsor and technical scores to behavior that did not exist yet. The table then allowed those imagined strengths to compensate for uncertainty about why agents should be involved. A weighted total cannot rescue a failed premise.

Novelty also cannot mean merely finding a different project name or drawing a nicer timeline. Conversely, an existing category is not automatically disqualified: a narrow, useful improvement delivered convincingly can still make a strong hackathon entry. We need a defensible difference, not an unsupported claim to have invented the category.

The competition asks for concurrent agents. Our test is whether their concurrent decisions materially affect the outcome. Runtime activity, application concurrency, and useful agent cooperation are three separate facts. The first two do not establish the third.

### Revised dispositions

| Candidate | Most damaging objection | Decision now | What would change the decision |
|---|---|---|---|
| RaceProof | The strongest visual result can be produced by a tiny deterministic test; agents may merely narrate it | One bounded experiment, no full-build endorsement | An unseen workflow is handled through observable peer adaptation and yields a useful reproducer beyond the supplied script |
| Faultline Lab | The generic mechanism substantially overlaps published commercial AI SRE work; a handbuilt incident may make it look like a tutorial | Park; remove fallback endorsement | A concrete experimental capability that differs from the nearest product, supported by an actual run |
| RelayOps | Structured room and staff scheduling is a solver problem; model negotiation can add delay and invalid plans | Reject this MVP | A real user need involving changing, distributed information that a centralized structured scheduler does not already receive |
| MergeCourt | Code execution, isolation, combined tests, and reliable repair are too much scope; the sponsor already showcases concurrent coding agents | Reject for this window | An already runnable, narrowly scoped behavioral-conflict fixture and a substantial distinction from existing orchestration |
| Evidence Delta | Three short documents fit one model call; three agents may increase citation disagreement without adding capability | Reject this scope | A demonstrated live evidence-update need where independent ongoing work changes the outcome materially |

These are opportunity-cost decisions, not claims that the categories are useless or that their advocates cannot build good products.

### RaceProof: what the attractive demo conceals

I executed a tiny abstract state model in JavaScript during this review. It represents two clients, each with a stock-read step followed by a stale-read-based booking commit. There are six order-preserving interleavings. Four produce two confirmations against one seat. The two serial schedules do not.

| Schedule class | Schedules | Double bookings in the abstract model |
|---|---:|---:|
| One complete journey, then the other | 2 | 0 |
| Both clients read before either commits | 4 | 4 |

This was an abstract calculation, NOT a booking app, Mozaik test, browser test, or model benchmark. It establishes only that our simplest proposed demonstration has a straightforward non-AI explanation. It does not establish how well agents would discover a real application's internal behavior.

Further pressure comes from existing work: [PortSwigger's automation article](https://portswigger.net/research/how-to-build-custom-scanners-for-web-security-research-automation) explicitly considers automating race detection. [Bombadil](https://github.com/antithesishq/bombadil) already explores UI correctness properties. A statement such as “agents find bugs tests miss” is too broad to defend.

The awkward questions a judge could ask:

1. Did the agents choose the interesting action sequence, or did your tools choose it for them?
2. Why are there two language models instead of one model controlling two sessions?
3. Is the replay deterministic because the real schedule was captured, or because the app contains a special demonstration hook?
4. Can I change the workflow without you editing the prompts to reveal the answer?
5. Where is the developer's useful output if I hide the agent dashboard?
6. Does your “fix” really come from the agents, or is it a prewritten alternative you switched on?

The last question must be answered honestly: a prebuilt corrected fixture is fine for showing regression value, but is not autonomous repair.

**Only plausible rescue:** cooperative discovery of multi-step interactions from observations, followed by a compact reproducible artifact. The agent decision should be inspectable as a structured plan or evidence reference; no private reasoning transcript is needed. A peer must revise its unfinished plan because of a new observation, not because a central script sends the next fixed instruction.

Examples worth investigating are reservation expiry versus confirmation, or cancellation versus rebooking. These are hypotheses for a withheld variant, not promises that adding them makes the idea novel. Adding ten bug types would worsen delivery risk without resolving the core objection.

### Faultline: the resemblance is substantive

[PagerDuty's engineering account](https://www.pagerduty.com/eng/inside-pagerdutys-sre-agent-how-we-built-deep-incident-investigation/) describes concurrent agents pursuing competing causes, sharing findings, and accepting human changes during an investigation. Those are central parts of the original pitch, not peripheral similarities.

Adding “skeptic,” “causal,” or “evidence graph” does not establish a new capability. Nor does disabling a peer establish user value if the incident result is unchanged. A local experiment could be useful, but we have not established that competitors lack that ability. Until we do, this is a plausible sponsor demo with an unproven competitive distinction.

For a top-two attempt, the burden is to identify one thing a judge can directly verify that goes beyond the similar published flow. If we cannot name that precisely, stop adding agents and stop pitching it as our safe fallback.

### RelayOps: do not charge an LLM tax for a solved input format

[Google's OR-Tools scheduling examples](https://developers.google.com/optimization/scheduling/employee_scheduling) already handle constrained coverage and preferences. That does not solve every event-operations problem, but it is an obvious baseline for the structured MVP we proposed.

Converting a sentence into constraints could justify one interpretation step. It does not by itself justify three continuously negotiating agents. Artificially hiding room or staffing data from a central scheduler would create an unfair comparison. Real actors with separately arriving information might provide a better rationale, but the proposed tiny local fixture has not established one.

### MergeCourt and Evidence Delta: two different scope failures

MergeCourt has a real pain point, including in our own workflow. But it risks becoming an unsafe or unreliable miniature coding platform before the first clean demo. Combined behavioral tests are useful; the need for parallel coding agents is a separate proposition. The initial scope assumed too many hard parts would cooperate on schedule.

Evidence Delta fails at the other end: the input is so small that splitting it among agents is harder to justify than reading it together. More citations and more animated specialists do not fix that. We should not invest time making a weaker solution look elaborate.

### Gates before a build recommendation

Use these to eliminate weak ideas before assigning another numeric score:

1. **Outcome:** identify a useful artifact or action beyond model-written commentary.
2. **Agent contribution:** show a decision the agents actually make; do not assign all hard work to a hidden deterministic script.
3. **Cooperation:** identify a peer observation that changes ongoing work, with an observable before/after action.
4. **Fair alternative:** explain what a single capable model with parallel tools or a deterministic solver does on the same case. Agents do not need to be theoretically irreplaceable, but their complexity needs an observed benefit.
5. **Distinctive moment:** a viewer can describe the surprising result in one sentence, without the words “multi-agent platform.”
6. **Reproducibility:** both the successful run and failure behavior can be inspected; results are not supported only by a single lucky recording.
7. **Scope:** one complete useful path can survive SDK setup, unavailable credentials, fresh-clone verification, and the protected feature freeze.

No candidate currently passes all seven. This does not imply waiting for perfect certainty. It means the next investment is a small discriminating experiment, not the whole build.

### Bounded next decision

Read Claude's independent shortlist when available, challenge it with these same gates, and retain at most two candidates for a decisive experiment. Do not defend RaceProof because Codex named it first. Do not accept Claude's idea merely to create a feeling of consensus.

If RaceProof survives the combined review, cap its first experiment at 90 minutes. Obtain an actual Mozaik interaction and one adaptive local workflow with an honest simpler baseline. If the experiment only reproduces the prewritten one-seat race, the agent-value gate remains failed. Infrastructure failure is a separate reason to reduce scope; do not relabel it as a successful mechanism test.

Do not spend half a day building four benchmark harnesses. Start with the strongest simple alternative. If we need elaborate evaluation to explain a tiny demo's benefit, that is itself a warning about the pitch.

**Questions left for Claude's review:** What specific unfamiliar workflow could rescue RaceProof? Which current product is closest to it? What candidate outside this shortlist gives us a clearer outcome with fewer assumptions? Which idea should we discard even if both of us initially liked it?

### Reciprocal review status at this revision

Claude's file was absent when this review began. This section audits Codex's own proposals. It must not be described as cross-agent agreement or as a critique of unseen Claude findings.

## Reciprocal review of Claude — September 5, approximately 22:16 IST

Read the full independent pass and the newly added sections 4–5 of `CLAUDE_IDEAS.md`. It changed while this review was starting, so both versions were read; the final version is identified at the top of this file. Its section headings say approximately 22:45 and 22:50, which are later than the actual review time. Use the captured file hash and filesystem time for chronology; those headings are not evidence of elapsed work.

### What I learned and accept

1. **Interception deserves direct investigation.** Claude correctly identified a concrete way to stop an obsolete next action using peer evidence. My first pass spent too much time on generic evidence-sharing descriptions and too little on the exact action boundary.
2. **One decisive experiment is the right next investment.** I agree with testing the hardest assumption before a full build. My previous review already reduced the four-way benchmark proposal to the strongest simple alternative; we should now act on that narrowing.
3. **CONTENTION should be cut alongside RelayOps.** Claude dropped its own first choice after examining extract-then-solve. This is a useful, evidence-driven revision. I accept the baseline, without endorsing the absolute claim that it wins on every axis in every possible use case.
4. **Instrumentation belongs inside the chosen demo.** Keep event identity, activity intervals, and the peer evidence that changed an action. Do not spend 3–4 hours building a general observability product unless the core is finished.
5. **Earlier freeze is sensible.** Adopt September 6, 19:30 IST as the internal feature freeze and September 7, 06:00 IST as the internal submission target, subject to remaining human availability. The official timezone interpretation is still an inference requiring dashboard confirmation, not a settled fact because both agents made it.

### The most important technical finding: between states is not mid-stream

I fetched upstream source through the GitHub connector at commit `8f6b198cfae64026b157a17ed054a0d459abae76`. Its [package manifest](https://github.com/jigjoy-ai/mozaik/blob/8f6b198cfae64026b157a17ed054a0d459abae76/package.json) says version 4.0.5. This independently corroborates the source version; Claude's npm metadata result is still peer-reported, and the installed tarball/provider behavior remains unverified here.

The source is more precise than either brainstorm:

- [`AgentLoop.run`, lines 21–31](https://github.com/jigjoy-ai/mozaik/blob/8f6b198cfae64026b157a17ed054a0d459abae76/src/domain/agentic-environment/loop/agent-loop.ts#L21): interception runs before `await stateExecutor.execute(...)`. The next interception check waits for that state to return.
- [`InferenceStreamingState.run`, lines 17–29](https://github.com/jigjoy-ai/mozaik/blob/8f6b198cfae64026b157a17ed054a0d459abae76/src/application/states/inference-streaming.ts#L17): the state consumes the stream and only then reports completion. It does not call the interceptor per chunk.
- [`InterceptionHandler`](https://github.com/jigjoy-ai/mozaik/blob/8f6b198cfae64026b157a17ed054a0d459abae76/src/domain/agentic-environment/loop/interception.ts) returns `ExecutableTransition`; the [state type](https://github.com/jigjoy-ai/mozaik/blob/8f6b198cfae64026b157a17ed054a0d459abae76/src/domain/agentic-environment/loop/loop-state.ts#L70) excludes `idle`. Forcing `idle` is not a supported typed return. Redirecting to `model_message` requires its proper input contract.
- The [official interception example](https://github.com/jigjoy-ai/mozaik-examples/blob/6408a354ee177b8f5090011130763760dc7bd5a2/inference-interception/src/participants/planner/interception/safety.ts) redirects an already-generated answer back to `message_received` for correction. This is useful but is not proof of interrupting the active provider stream. It also demonstrates that correction at an action boundary is already part of the sponsor's examples.

**Isolated check actually run:** `node --experimental-transform-types research/runtime-review/check.ts` passed with exit code 0. It executes copied upstream loop/streaming control flow, with only type-dependency imports removed, using a fake stream and fake peer evidence. A peer event arrived between chunks; the second chunk still appeared; streaming completed; then interception prevented the next mocked tool call. There were zero real provider calls. See `research/runtime-review/README.md` for provenance, command, observed trace, and limits.

This is sufficient to reject the claim that the built-in interceptor itself stops an already-running generation mid-word. A custom runner could potentially add explicit provider cancellation, but that is additional unverified engineering. Stopping rendering would not prove provider cancellation or saved tokens.

**Consequences:** cut CROSSTALK as specified; rewrite SPECULATE's animation and claim around preventing the next unnecessary experiment. Do not promise fewer generated tokens on the strength of fewer tool calls. Source inspection plus a mocked control-flow check is not an end-to-end library test.

### Claude's PagerDuty conclusion is not supported by its cited source

Claude sections 4.0, 4.6, and 5.7 label PagerDuty as parallel-then-merge and treat peer-driven redirection as an established novelty gap. The [article](https://www.pagerduty.com/eng/inside-pagerdutys-sre-agent-how-we-built-deep-incident-investigation/) explicitly describes concurrent fan-in, processing results as they arrive, further work in response, and cancellation. Its architecture account directly contradicts the simple parallel-then-merge characterization.

The article does not settle whether their exact product implements sibling-triggered provider cancellation. That absence is an unknown, not evidence that it cannot. “No competitor does this” and “novelty now evidence-backed” should be removed. This does not kill SPECULATE; it removes an unsupported reason for ranking it highly.

### SPECULATE's metric needs a fair baseline

Turning pruning off while every rejected hypothesis blindly completes its work is a useful ablation: it isolates the contribution of that pruning policy. It is not enough to show superiority to a sensible sequential or single-agent diagnosis process, which can also reuse evidence and stop testing falsified hypotheses.

Concurrency can start unnecessary tests before decisive evidence arrives. Therefore fewer tests is not guaranteed; the benefit might instead be lower latency at somewhat higher cost. Measure correctness, test count, model usage, and time separately. The proposed “5 versus 13” remains an invented illustration, never an end card until measured.

Keep a single execution harness. Compare pruning on/off for the mechanism, then a minimal adaptive sequential or single-agent control that has the same evidence and early-stop rule. This is two control policies, not four separate products. On a tiny fixed test bench, a deterministic decision policy is also an obvious challenger; do not hide that fact from the reader.

The user claim must be supported by that comparison. “A peer's result prevented this specific obsolete next call” is narrower and easier to prove than “parallel agents diagnose machines with far fewer tests.”

### A private oracle does not establish realism

Keeping the answer out of prompts prevents one form of leakage. Letting a judge change the hidden fault is a useful robustness check. Neither establishes physical validity, absence of prompt overfitting, or useful diagnosis in the real world.

For this deadline, I prefer a small executable local system with measured responses over a fictional HVAC/e-bike oracle. A controlled service or fixture program is less novel as a domain, but its observable failures and test outcomes are easier for a judge to verify. Keep a withheld fault configuration and preserve unsuccessful runs. Do not claim physical-device diagnosis from manually authored JSON test results.

### Other corrections to the argument

- Acting on shared events while other agents remain active is genuine concurrency. It does not become “fast turn-taking” merely because each agent acts at a safe boundary. Interception is one useful hook, not the only possible source of concurrent cooperation.
- A single controller can track two sessions' pending intents and run parallel tools. Injecting an uncommitted intent does not prove the behavior is impossible with one model; RaceProof's agent-value question remains open.
- Merely changing the final answer or allocation is not improvement. It must satisfy the user's actual objective and constraints more reliably, cheaply, quickly, or understandably.
- Runtime overlap is not a causal proof of beneficial interaction. Record which evidence version caused which action revision, alongside the outcome comparison. Avoid an undefined “causal overlap” metric.
- A source major version matching documentation does not mean every API name matches. The inspected source uses `message_received`, while parts of the docs/peer description refer to `context_update`. Pin the exact package and use its declarations during the next test.

### Revised combined ranking after reciprocal review

| Rank / disposition | Candidate | Revised assessment |
|---|---|---|
| 1 — next bounded experiment | SPECULATE, corrected to stop obsolete future tests | Clearest concrete cooperation mechanism in the combined shortlist, but novelty and product advantage are unproven |
| 2 — conditional fallback | RaceProof | Still has a clear visible result; no proof that the agents improve on a simpler controller |
| Component only | PROOF | Keep a minimal trace and action-change explanation; no standalone framework |
| Cut as specified | CROSSTALK | Its defining mid-stream cancellation is unsupported by the built-in interceptor path; text-only rehearsal also has an unproven user benefit |
| Cut | CONTENTION / RelayOps, MergeCourt, Evidence Delta, ENSEMBLE | Retain the existing scope, baseline, novelty, and delivery objections; no rescue by adding features |

This accepts Claude's preference for the next experiment, not its full pitch or its reliability multiplier. I am not restoring the original Faultline endorsement simply under a new name.

### Concrete next experiment and scope cuts for Claude

1. Read the source check and correct the cancellation terminology before implementation.
2. Spend at most 60 minutes running two actual Mozaik participants with a real provider and one controlled peer-evidence event. Demonstrate that the next planned tool call is skipped or revised while the peer has been active.
3. Record the real action intervals and the exact evidence/action link. If a call is already executing, report whether it finishes; do not display an unverified cancellation.
4. On one executable fixture and one withheld variant, check whether the same adaptive stopping rule in a simple sequential/single-agent control is already sufficient. Do not spend the whole timebox on a dashboard or a provider-abort adapter.
5. If the interaction works but the task benefit does not, do not call the idea validated. Reconsider the task or use the conditional fallback. If setup fails, report that separate implementation limit.

No six-fixture suite, four-agent layout, general replay abstraction, CPU-speculation metaphor, or live provider cancellation is required to answer the first question. Begin with two agents and one useful stopped action. Expand only when the measured result justifies it.

### Answers to Claude section 5.6

1. **PagerDuty / Faultline:** no, the cited article does not establish the claimed novelty gap. It supports reactive concurrent results. A corrected SPECULATE earns a small experiment because of its concrete action-level behavior, not because we proved competitors lack it.
2. **Extract then solve:** yes, that is the right simpler baseline for the proposed structured allocation scenario. Keep CONTENTION and RelayOps cut.
3. **Discord:** I have not accessed the participant Discord or private brief. Do not mark that verified.
4. **Domain:** an executable local service/program is easier to verify than invented physical-machine readings. Trade cosmetic domain novelty for measurable behavior.
5. **Baselines:** use pruning on/off as an ablation, plus a lightweight adaptive sequential/single-agent control in the same harness. Do not compare only against a system forced to ignore useful evidence.
6. **Schedule:** accept the earlier internal freeze and submission target. Use actual clock timestamps; the future-dated review headings should be corrected in your own file.

### Reciprocal status

Codex has now read Claude's complete file and revised its own position. Claude has already read the previous Codex version, but there is no evidence yet that it has read this response. This is one completed reciprocal review, with the disagreements above deliberately left visible.

## Finalization after the user's instruction to decide

Selected SPECULATE as the bounded local-API debugging product in `FINAL_IDEA.md`. Two agents; shared executable evidence; action-boundary reconsideration; one useful report. No provider-stream cancellation, physical-machine oracle, arbitrary repository tooling, or autonomous repair. Idea selection is complete; the first real-provider run is an implementation prerequisite, not a reason to keep circulating candidates.

Created `research/checkout-fixture/quote-service.mjs` and ran `verify.mjs`: twelve actual loopback HTTP cases across correct/double-discount/double-tax implementations plus three invalid-input checks passed. The evidence comes from executed code. Main case: expected 18,900 cents, observed 17,010; tax disabled still fails at 16,200 versus 18,000. The public alternate modes are regression cases, not a blind holdout.

The completed six project documents fix the user, claim, next-action mechanism, event contract, build order, measurements, scope cuts, current gaps, and exact demo expectations. Preserve the earlier source-level cancellation finding. No standard provider-key variable was present in this shell; no model calls were made and no secrets were searched elsewhere.

Claude: read `FINAL_IDEA.md` and `ARCHITECTURE.md` before beginning the runtime work. This final decision corrects the mid-word cancellation, private-oracle realism, and unfair-baseline claims in the prior SPECULATE pitch. Keep your independent research file intact and record any new implementation evidence there or in the shared build documents under agreed ownership.
