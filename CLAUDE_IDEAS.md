# CLAUDE_IDEAS.md — JigJoy "Concurrent Agents" Hackathon

**Author:** Claude (independent pass) · **Started:** 2026-09-05 21:57 IST · **First-pass timebox:** 30 min
**Status:** Sections 0–3 were written WITHOUT reading `CODEX_IDEAS.md`, to preserve independent thinking. Section 4 onward added after.
**Objective:** top-two finish. No placement is promised anywhere in this document.

---

## 0. Verified ground truth (fetched 2026-09-05, ~21:58–22:12 IST)

### 0.1 🔴 THE CLOCK — surfaced immediately

| Fact | Value |
|---|---|
| Submissions close | **Mon 7 Sep 2026, 09:00 "CET"** ([rules](https://build.jigjoy.ai/rules)) |
| Their own conversion | "3:00 AM ET / midnight Sunday PT" |
| Therefore actually | **UTC+2 (CEST)** → **07:00 UTC** → **12:30 PM IST, Mon 7 Sep** |
| Now | Sat 5 Sep 2026, 21:57 IST / 16:27 UTC |
| **Wall clock remaining** | **≈ 38 h 30 m** |
| Realistic build hours (minus ~10 h sleep, ~2 h admin) | **≈ 24–27 h** |
| **70% feature freeze (global rule)** | **Sun 6 Sep, ~19:30 IST** — hard stop on new features |
| Reserved for video + fresh-clone + judge-journey test + submit | **≈ 11 h** |

The site labels it CET; the ET/PT conversions only work if it is CEST. I treat **07:00 UTC Monday** as truth and would still submit ~6 h early. If anyone reads it as literal CET (08:00 UTC) we remain safe.

**The implication that should drive every decision below:** this is a one-day build, not a weekend. Any idea needing a novel data pipeline, a trained model, auth, or a real third-party integration is already dead.

### 0.2 Official rules (source: build.jigjoy.ai/rules, build.jigjoy.ai)

- **Mandatory tech:** "The project must use Mozaik (`@mozaik-ai/core`) and run two (2) or more concurrent agents." Mozaik is an **eligibility gate, not a bonus track**.
- **Teams:** solo or up to 4; one entry per team; one team per person. Age 18+.
- **Pre-existing code:** "Pre-existing frameworks, libraries, and boilerplate may be used, but the substance of the work must happen during the event."
- **Submission requires:** project name · **a repository the judges can access** · a description · **"an explanation of how your agents run concurrently."**
- **Optional but "strongly recommended":** demo video, live deployment, screenshots.
- **Judging (quoted):** *"The weight is on genuine use of concurrency — agents that actually run together — alongside technical execution, creativity, and the clarity of the demo."*
- **Prizes:** $500 / $300 / $200, plus daily.dev Plus (10 seats), Hyperskill Premium (5), Mozaik Cloud Premium (5). **Top two = $500 or $300.**
- Organisers: JigJoy + daily.dev + Hyperskill. Winners announced 13 Sep 2026.

### 0.3 Official criteria vs. weights I invented — kept separate on purpose

**Official, with no numbers published:** (1) genuine concurrency — *explicitly the heaviest*; (2) technical execution; (3) creativity; (4) clarity of the demo.

**Not official — do not optimise for these blindly:** "impact", "UX" and "sponsor use" are our planning categories, not the organiser's words. In particular, **"sponsor use" is not a scoring axis in this event** — Mozaik use is pass/fail. Depth of Mozaik primitive use belongs inside *technical execution*; shallowness of it shows up inside *concurrency*. I flag this because optimising for a phantom sponsor-bonus track would burn hours we do not have.

### 0.4 Mozaik technical reality (source: docs.jigjoy.ai/docs)

```ts
const { initializeRuntime, resolveRuntime, resolveParticipant,
        join, leave, sendMessage, sendEvent, runLoop } = defineRuntime<AppState>();
```

- **Concurrency model:** `runLoop(agentId, message, inferenceInput, interceptionHandler?)` is **fire-and-forget**; each call gets its own `loopId`. Events from any loop **fan out to every joined participant**, and **the runtime does not await `processor.apply`**. So raw overlap is free. The hard part is making overlap *matter*.
- **Reaction:** `SituationHandler = { specification.isSatisfiedBy({event, participant}), processor.apply({event, participant}) }`, attached at `createAgent` / `createHuman` time. **No documented API for attaching handlers after creation** — design around this.
- **Events:** `SemanticEvent.create(type, producerId, payload)` plus `sendEvent(evt, senderId)`. Built-ins: `participant.joined` / `.left`, `message.sent`, `context_update.started` / `.completed`, `inference.started`, **`inference.stream`**, `inference.completed`, `function_call.started` / `.completed`, `model.answer`, `interception.started` / `.finished`.
- **⭐ Interception — the primitive nobody will use well.** Passed as the 4th argument to `runLoop`; `isSatisfiedBy(transition)` plus `async handle(transition)`; **`handle` is awaited**, and it may **rewrite `nextStateId` and `input`** before that state runs. Interceptable states: `context_update`, `inference`, `inference_streaming`, `function_call`, `model_message`. The docs say it exists for "keeping a human in the loop, **or another agent**, to control what runs next."
  → This is the only primitive that lets **agent A change what agent B is about to do, mid-flight**. That is precisely the difference between "parallel HTTP requests" and "genuine concurrency". **Whatever we build must be built on this.**
- **Shared state:** `class AppState extends RuntimeState {}`; `resolveRuntime().state` is reachable from module scope, so **`FunctionTool.invoke` can read and write shared state**. Structurally certain but undocumented — **verify in the first 30 minutes of build.**
- **Tools:** `{ type:'function', name, description, parameters, strict, invoke }`. Output re-enters context; the loop returns to inference.
- **Structured output:** `structuredOutput: { name, schema, strict }` on `InferenceInput`.
- **Models — cloud only:** OpenAI `gpt-5.4 / -mini / -nano / gpt-5.5`; Anthropic `claude-haiku-4-5 / sonnet-4-6 / opus-4-7 / opus-4-8`; Gemini `gemini-3.5-flash / 3.1-pro-preview`; DeepSeek `deepseek-v4-flash / v4-pro`. Env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_BASE_URL`. **No documented local/Ollama support.**
- **⭐ Escape hatch:** `initializeRuntime({ state, inferenceRunnerConfig: { supportedModels?, runner? } })` lets you supply **your own `InferenceRunner`**. There is an official `custom-inference-runner` example using mock inference. This is our cost control, our determinism lever, and our only route to anything resembling an offline demo.
- Maturity: MIT, ~143 stars, ~768 commits, 2 open issues. **Young.** Expect undocumented sharp edges; budget 2–3 h for "the framework surprised us".

### 0.5 What judges have already seen — do not rebuild these

Official `mozaik-examples`: `terminal-agent`, `inference-interception`, `human-in-the-loop`, **`history-simulation` (multi-agent debate)**, `wrong-asnwer`, `streaming`, `tool-calling`, `structured-output`, `shared-state`, `reasoning-effort`, `custom-inference-runner`, `mcp`. Plus **Baro — the flagship demo: 10 concurrent specialised agents collaborating on a shared goal.**

**Therefore these are pre-burned and will be submitted by many teams:** multi-agent debate; "a swarm of N specialists on one goal" (that *is* Baro); code-review swarm; research swarm; incident-response / on-call swarm; "N agents write a blog post". Each of these starts at a novelty deficit against the organiser's own demo.

### 0.6 Recorded gaps (participant-only or unavailable)

- **No numeric weights are published.** My weights in §1 are invented for planning only.
- **Judge identities not published** — cannot tailor.
- **No demo-video length limit stated.** Per instruction, 90–120 s is *our* design target, not a rule.
- **Discord** (`discord.gg/dvxY9J2kWX`) likely holds the starter template, the pre-event primer, and possibly judge Q&A. **Not accessed in this pass — this is the single biggest information gap.** Action: read `#announcements` and pinned messages before committing build hours. A posted rubric would override §1.
- Mozaik **rate limits** and Mozaik Cloud pricing are not documented.
- No public participant count, so field size is unknown.

---

## 1. Planning weights (invented; official criteria in §0.3 take precedence)

| Axis | Weight | Rationale |
|---|---|---|
| **Genuine concurrency** — agents demonstrably co-executing *and* the coupling changing the result | **35** | The organiser says the weight is here, and the submission form has a dedicated field for it. |
| **Technical execution** — including depth of Mozaik primitives (interception, custom runner, event bus) | **20** | Official criterion; the correct home for "Mozaik depth". |
| **Creativity / innovation** — distance from Baro and the twelve examples | **20** | Official criterion, and the tiebreak in a field of swarms. |
| **Demo clarity** — a judge understands it in 90 s with nobody present | **15** | Official criterion. Judging is async; an unclear demo zeroes everything else. |
| **Impact / usefulness** | **10** | *Not* an official criterion. Deliberately small. |
| **Reliability under a 24 h clock** — ships, survives a fresh clone, survives a flaky API | **Gate (×0–1)** | Not a criterion but a multiplier. A broken demo scores zero on all axes. |

**Two tests every candidate must pass:**

1. **AI necessity.** If a solver, a regex, or a state machine beats the LLM at the core task, the LLM is decoration.
2. **Mozaik necessity.** If the same demo works with `Promise.all` over four `fetch` calls, we have not used Mozaik and we lose the heaviest criterion. **Two animated cards and parallel requests are not a mechanism.**

---

## 2. Five candidates — independent first pass

Effort estimates assume one developer plus Claude, inside the ~24–27 h available.

---

### C1 — CROSSTALK · mid-stream agent-to-agent preemption

**Claim.** *Anyone rehearsing a high-stakes multi-party conversation* can now *practise against a panel that interrupts them and each other in real time, the way real rooms actually work*, because we solved *cross-agent barge-in: one agent reads another's half-finished tokens and cuts it off before it finishes speaking*.

**Plain English.** Most AI role-play is polite turn-taking: you talk, it talks, you talk. Real negotiations are not like that — people talk over each other, and the interruption itself is the information. We run three agents at once; each one watches the others' words appear letter by letter, and if one hears something it must object to, it cuts in mid-sentence and the interrupted agent actually stops.

**Specific user and painful problem.** A founder with a partner-meeting on Monday, or a candidate with a final-round panel. They rehearse against ChatGPT, which waits politely for them to finish and never ganged up on them. On the day, three people talk over each other and they freeze. The rehearsal did not train the skill that failed.

**Status quo.** ChatGPT / Claude voice mode: one agent, strict turn-taking. Voice-agent platforms have solved *human interrupts machine* (barge-in) as a commodity feature. Interview-practice tools are single-persona and turn-based. Nobody ships *machine interrupts machine, mid-generation, because of shared state*.

**Nearest existing products (primary sources).**
- [Decagon — "what is voice agent barge-in"](https://decagon.ai/glossary/what-is-voice-agent-barge-in) and [Inworld voice-agent platforms](https://inworld.ai/resources/best-voice-agent-platforms) — barge-in is commodity, but human→agent only.
- [Famulor barge-in guide](https://www.famulor.io/blog/ai-voice-agent-barge-in-interruptions-enterprise-guide) — per-agent interruption toggles, single agent.
- [Hamming AI interruption runbook](https://hamming.ai/resources/voice-agent-interruption-handling-runbook) — turn detection as an engineering problem, not multi-agent.
- Mozaik's own [`history-simulation`](https://github.com/jigjoy-ai/mozaik-examples) — multi-agent debate, but turn-based, no preemption.

**Honest novelty gap.** Barge-in is *not* new; a judge who has shipped a voice agent will say so within ten seconds. Our only real novelty is the *direction and trigger*: agent→agent, fired by another agent's partial `inference.stream` payload, executed by rewriting the victim's loop transition. That is a genuinely new use of Mozaik's interception. But it is one idea, and if the judge reads it as "barge-in demo" we lose creativity points. **This is a framing risk, not a technical one.**

**What each agent does.** `Skeptic` (hunts unsupported claims), `Champion` (defends and escalates), `Chair` (enforces floor time, cuts whoever is dominating). All three subscribe to `inference.stream` from the other two.

**Why simultaneity and shared evidence change the result.** The interruption can only be triggered by a token that has not been emitted yet in a sequential world — by definition, the whole point is acting on an *incomplete* utterance. Shared state holds a live floor-time ledger, so the Chair's cut-in depends on what the other two have been doing concurrently.

**Why a single agent, a script, or a scheduler is insufficient.** A single agent can *simulate* three voices, but it cannot be surprised by itself — there is no partial output for a second process to react to. A deterministic script can only interrupt at pre-chosen offsets; the whole claim is that the interrupt point is *semantic and discovered at runtime*. A scheduler orders turns; it cannot cancel one mid-flight.

**Unforgettable 90–120 s demo.** Split screen: three streaming panes. User pitches. Champion starts a sentence; at word 14 the Skeptic's pane flashes and the Champion's pane **stops mid-word**, greyed with a strikethrough. A side rail shows the exact `inference.stream` event and the `interception` that rewrote the transition. Toggle **"Sequential mode"** and replay the same input: three polite paragraphs, no cut-ins, visibly worse.

**Measurable success.** Number of interrupts fired; median tokens-into-utterance at cut (proving it was mid-stream, not post-hoc); % of interrupts triggered by another agent versus the human; the sequential/concurrent A-B on the same transcript.

**Minimum scope.** Three agents, one scenario, text streaming only. **Explicit cuts:** no voice/TTS, no scenario library, no auth, no persistence, no scoring rubric for the user.

**Ranked failure risks.**
1. **Interception may be too coarse to cancel an in-flight `inference_streaming` state.** The docs let you rewrite the *next* transition, not necessarily abort a stream already in progress. If we cannot truly abort, "interruption" degrades to "we stopped rendering", which is a lie on camera. **This is the idea's throat.**
2. Latency: if cut-ins land >2 s late the illusion dies.
3. It reads as a party trick; impact score low.
4. Three concurrent streams triple token spend.

**Build effort.** 10–14 h. Most of it in the streaming UI, which is exactly where the demo lives.

**Early experiment that would kill it (≤45 min).** Two agents; A runs a long generation; B's handler fires on A's third `inference.stream` event and attempts to force A to `model_message` / `idle`. **If A's stream does not visibly stop, C1 is dead.** Run this before anything else.

---

### C2 — CONTENTION · optimistic claims on a scarce resource, with interception as admission control

**Claim.** *A dispatcher allocating scarce slots under live pressure* can now *let one negotiating agent per requester race for the same slots and still get a defensible, no-starvation allocation*, because we solved *admission control at the model's function-call boundary: a claim is vetoed and the agent forced to re-plan before the write ever lands*.

**Plain English.** Imagine six people all trying to book the last four appointment slots at the same instant, each represented by their own AI advocate. The advocates all reach for the same slot simultaneously. Instead of a queue, we let them collide — and at the exact moment an advocate tries to grab a slot, a gatekeeper checks the shared board, blocks the grab if it is already gone or unfair, and hands that advocate a fresh situation to think about. The final allocation is the product of the collision.

**Specific user and painful problem.** A clinic scheduler with four same-day slots and a morning of urgent calls; or a logistics dispatcher with three loading docks. Today they hand-triage on a spreadsheet under phone pressure, first-come wins, and the genuinely urgent case that called at 11 a.m. loses to the routine one that called at 09:00.

**Status quo.** Spreadsheets plus phone; or rigid rules engines (first-come, or fixed priority tiers) that cannot read "my kid's fever spiked overnight" out of free text. Solvers optimise beautifully but need the objective pre-quantified — which is exactly the step humans are doing by hand.

**Nearest existing products (primary sources).**
- [OR-Tools CP-SAT](https://developers.google.com/optimization) — beats any LLM at allocation *once preferences are numbers*.
- [LangGraph](https://github.com/langchain-ai/langgraph) — multi-agent graphs, but coordination is edges in a graph, not runtime contention.
- [CrewAI](https://github.com/crewAIInc/crewAI) / [AutoGen (AG2)](https://github.com/ag2ai/ag2) — role-based agent teams, effectively sequential or manager-delegated.

**Honest novelty gap.** The allocation problem is ancient and solved better by OR. Our novelty is narrow and real: **using an LLM only for the part solvers cannot do (turning free-text pleading into a comparable urgency claim) while resolving contention through genuine concurrent races arbitrated at the tool-call boundary.** If we oversell it as "AI scheduling" a sharp judge rightly kills it with one sentence: "why not CP-SAT?" We must pre-empt that in the README.

**What each agent does.** N `Advocate` agents (one per requester, each holding only its own requester's story, each with a `claim_slot` tool). One `Registrar` — not a chatty agent but an **interception handler** on every advocate's `function_call` transition, which validates against `AppState.board` and, on veto, rewrites the transition's `input` to "slot 3 was taken 40 ms ago by a higher-urgency case; here is what remains".

**Why simultaneity and shared evidence change the result.** Advocates read a board that other advocates are mutating *during their own inference*. An advocate that started reasoning at t=0 with six free slots may reach its claim at t=3 s with two left — and its argument must adapt. Run them sequentially and the first advocate always wins with a stale, uncontested board; the allocation is measurably different, not merely slower.

**Why a single agent, a script, or a scheduler is insufficient.** A single agent seeing all six requests at once is just a ranking prompt — no contention, no adaptation, and it scales badly with request count. A deterministic script cannot read urgency from prose. **An ordinary scheduler is precisely the status quo we are beating**, and the demo shows it losing.

**Unforgettable 90–120 s demo.** A live board of four slots and six advocate lanes. All six light up simultaneously. Two lanes reach for slot 2 within the same 200 ms; one turns green, the other flashes **VETOED** and visibly re-plans in its own pane, then takes slot 4. A ticker prints wall-clock timestamps proving overlap. Then the **Sequential** toggle: same six inputs, first-come order — a demonstrably worse allocation, with the urgent case unserved, shown side by side.

**Measurable success.** Allocation utility (sum of urgency served) concurrent vs. sequential on the same fixtures; number of real vetoes; count of overlapping `inference.started` / `inference.completed` intervals as machine-checkable proof of co-execution; zero starvation.

**Minimum scope.** Six advocates, four slots, one fixture set, one veto policy. **Explicit cuts:** no calendar integration, no auth, no multi-round auction, no persistence, no mobile layout.

**Ranked failure risks.**
1. **"Why not a solver?"** — the AI-necessity attack. Mitigation: the README states plainly that allocation is trivial and *extraction of comparable urgency from free text under live contention* is the hard part.
2. LLM latency makes races too easy to win — collisions may be rare by luck. Mitigation: seed fixtures that force ties; never fake the collision.
3. Nondeterminism makes the concurrent-vs-sequential delta wobble; a bad seed could show concurrency *losing*. **We must report that honestly if it happens**, not re-roll until it looks good.
4. Board mutation from inside `invoke` may hit an unforeseen Mozaik constraint.

**Build effort.** 12–16 h. The riskiest hours are the veto-plus-replan path.

**Early experiment that would kill it (≤45 min).** One advocate, one slot: can an `InterceptionHandler` on `function_call` (a) read `resolveRuntime().state`, (b) veto, and (c) rewrite `transition.input` such that the agent *actually re-plans* rather than dying? **If the rewrite does not change subsequent model behaviour, C2 is dead.**

---

### C3 — SPECULATE · concurrent hypotheses that kill each other off

**Claim.** *Someone triaging a broken physical machine* can now *reach the true fault with far fewer diagnostic tests*, because we solved *speculative parallel hypothesis pursuit with cross-agent pruning: evidence produced by any one agent immediately terminates the others' now-impossible branches, mid-loop*.

**Plain English.** When something breaks, you normally test one theory at a time. Here, four theories are investigated at once. Each investigator orders its own tests. The moment any test result rules a theory out — even a test somebody else ordered — that investigator is stopped mid-thought instead of finishing a line of enquiry we already know is wrong. This is speculative execution, borrowed from CPUs, applied to reasoning.

**Specific user and painful problem.** A repair technician (3D printer, HVAC unit, e-bike) facing an intermittent fault. Each diagnostic test costs real time and sometimes a part. Sequential elimination is slow and testing order is usually a guess.

**Status quo.** Decision trees in a service manual (rigid, blind to combinations); forums; or a single LLM chat that produces a plausible list and then walks it in one order, wasting tests.

**Nearest existing products (primary sources).**
- [Microsoft Magentic-One / AutoGen](https://github.com/microsoft/autogen) — an orchestrator delegating to specialists; the orchestrator decides sequentially, and there is no speculative kill.
- [LangGraph](https://github.com/langchain-ai/langgraph) — supports parallel branches, but branches join at a merge node; branches do not preempt each other mid-execution.
- [OpenAI Agents SDK / Swarm](https://github.com/openai/openai-agents-python) — handoffs, i.e. explicitly sequential.
- Tree-of-Thoughts style search — parallel branch exploration, but a *single* model exploring, with pruning at the search layer, not between independent live processes.

**Honest novelty gap.** "Explore several hypotheses in parallel" is not new; ToT and LangGraph branches do it. Our narrow novelty: **the branches are independent live agents that abort one another mid-inference via interception, on evidence one of them just produced.** The pruning is an interrupt, not a post-hoc filter at a merge point. That is a real distinction, but it is a *systems* distinction — it must be made visible on screen, or a judge will file it under "parallel search, seen it".

**What each agent does.** Four `Hypothesis` agents, each committed to one candidate root cause, each with `order_test(name)` — a tool hitting a deterministic simulated test bench. One shared `EvidenceLedger` in `AppState`. Each agent runs an interception handler on its own `inference` transition that first checks whether the ledger has already falsified it; if so it rewrites the transition to `model_message` with "you are eliminated; state why" and the agent concedes.

**Why simultaneity and shared evidence change the result.** The saving *is* the concurrency: a test ordered by agent B at t=2 s eliminates agent C while C is mid-inference, so C's next test is never ordered. Run the same four hypotheses sequentially and every one of them orders its full test sequence. **The metric is tests ordered, and it changes.**

**Why a single agent, a script, or a scheduler is insufficient.** A single agent holding four hypotheses tends to anchor and interleave badly; more importantly there is no independent process to kill, so "pruning" collapses into ordinary prompting. A script needs the elimination rules pre-encoded — which is the service manual we are beating. A scheduler runs branches to completion and filters afterwards; it cannot cancel work in flight, which is the entire saving.

**Unforgettable 90–120 s demo.** Four lanes running at once, each printing tests as they are ordered, one shared evidence ledger filling in the middle. At ~8 s, lane 2's test result lands in the ledger and lanes 1 and 4 **go dark mid-sentence** with "ELIMINATED by evidence #3 (from lane 2)". Lane 3 converges. End card: **"Concurrent: 5 tests. Sequential: 13 tests. Same fixture, same models."**

**Measurable success.** Tests ordered to correct diagnosis, concurrent vs. sequential, across ~5 fixtures; count of mid-inference kills; wall-clock overlap proof; accuracy must be *equal or better*, not just cheaper.

**Minimum scope.** One machine domain, five fixtures, a hard-coded deterministic test bench, four hypotheses. **Explicit cuts:** no real sensor data, no manual ingestion, no user-supplied machines, no persistence, no login.

**Ranked failure risks.**
1. **The test bench is a fixture we wrote, so the win could be an artefact of our own design.** This is the credibility risk. Mitigation: publish the bench, keep it hypothesis-agnostic, let a judge edit it and re-run.
2. Same interception-abort uncertainty as C1 — can we truly stop an agent mid-loop?
3. If elimination logic is deterministic, a judge asks why the LLM is needed at all. Our answer must be that the LLM chooses *which test to order next given partial evidence*, and that answer must be visibly non-trivial.
4. Four fixtures × two modes × five runs is a lot of token spend for the metrics table.

**Build effort.** 12–15 h, of which ~3 h is the bench and fixtures.

**Early experiment that would kill it (≤45 min).** Can agent B's `sendEvent` cause agent A's *already-running* loop to terminate early via A's interception handler on its next `inference` transition? Measure: does A order fewer tool calls than it does when running alone? **If A cannot be stopped early, C3 is dead** — and note C1 and C3 share this single fatal dependency, so **one experiment tests both.**

---

### C4 — ENSEMBLE · agents improvising together with no turn order

**Claim.** *A solo musician with no band* can now *jam against three players who listen to each other and to them simultaneously*, because we solved *continuous mutual adaptation with no conductor: every player's next bar is a reaction to what the others are playing right now*.

**Plain English.** Four AI musicians play together. Nobody takes turns and nobody is in charge. Each one listens to what the others just played and to a shared "feel" (key, tempo, intensity) that any of them can nudge, and plays its next bar accordingly. When the drummer pushes the tempo, the bassist notices and follows — because they are both playing at the same time.

**Specific user and painful problem.** A bedroom guitarist who cannot get three friends in a room. Backing tracks are fixed loops that do not respond; if the player slows down, the track does not.

**Status quo.** Fixed backing tracks (iReal Pro, YouTube loops); generative music that produces a finished piece you cannot play *with*; and — importantly — **live music models that do respond in real time.**

**Nearest existing products (primary sources).**
- [Google Magenta RealTime](https://huggingface.co/google/magenta-realtime) and [MRT2 (June 2026)](https://magenta.tensorflow.org/blog) — open-weights *live* music models, MIDI control, low-latency, explicitly designed for live jamming. **This is directly in our lane.**
- ["Human–AI jam session shapes live music with swarm intelligence" (June 2026)](https://techxplore.com/news/2026-06-humanai-session-music-swarm-intelligence.html) — swarm-intelligence live jamming, already published.
- ["Real-Time Language Model Jamming"](https://arxiv.org/pdf/2606.11886) and [live accompaniment with latent diffusion](https://arxiv.org/pdf/2604.07612) — 2026 academic work on exactly this.

**Honest novelty gap. This one is bad and I am not going to soften it.** Live human–AI jamming with swarm coordination was published three months ago and Google ships open weights for it. Our version would be *worse* musically (LLMs emitting note tokens are not audio models) and only differently coordinated. The one defensible claim left is "the players are general LLM agents coordinating through a shared event bus rather than a purpose-built music model" — which is a weaker product and an interesting systems demo. **Novelty here is largely spent.**

**What each agent does.** `Drums`, `Bass`, `Keys` agents emit short bar-length note events on a loop; `AppState` holds tempo, key, and an intensity dial any agent may nudge; every agent's handler fires on the others' `note.played` events.

**Why simultaneity and shared evidence change the result.** Musical coherence *is* mutual real-time adaptation; sequential generation produces four solos stapled together.

**Why a single agent, a script, or a scheduler is insufficient.** One agent writing four parts is composition, not improvisation, and cannot be surprised. A sequencer replays fixed patterns. A scheduler imposes exactly the turn order we are removing.

**Unforgettable 90–120 s demo.** Audible, which is a real advantage — judges watching twenty terminal demos will remember the one that made noise. Human nudges tempo; within two bars all three follow.

**Measurable success.** Honestly weak. Latency-to-adapt in bars; some tempo-coherence number. Musical quality is unmeasurable in our timeframe, which is itself a scoring problem.

**Minimum scope.** Three agents, MIDI-ish note events via WebAudio, one key, one groove. **Explicit cuts:** no audio models, no recording, no human instrument input beyond dials.

**Ranked failure risks.**
1. **Prior art is stronger than our build** (Magenta RT2 + the swarm-jam paper). Novelty claim collapses under a judge who follows music-ML.
2. LLM inference latency (~1–3 s) versus musical timing (~0.5 s/bar) — the tempo may simply be impossible. **Likely fatal on physics alone.**
3. It will probably sound bad, and bad music actively repels.
4. Audio in a screen recording adds capture risk.

**Build effort.** 14–18 h, with the highest variance of the five, mostly in audio timing.

**Early experiment that would kill it (≤30 min).** Measure `inference.started` → `inference.completed` round-trip for `gpt-5.4-nano` / `claude-haiku-4-5` with a 20-token cap. **If the median exceeds ~600 ms, real-time musical reaction is off the table and C4 is dead.** My prior: it fails.

---

### C5 — PROOF · a concurrency truth-meter for Mozaik

**Claim.** *A judge (and any Mozaik developer)* can now *tell in seconds whether agents genuinely ran together or merely took turns quickly*, because we solved *turning the runtime's own event stream into a machine-checked overlap proof with a falsifiable sequential control run*.

**Plain English.** Everyone at this hackathon will claim their agents run concurrently. Almost nobody can prove it. This is a small library plus a viewer that taps Mozaik's event bus, draws the real overlapping execution intervals, computes how much genuine overlap occurred, and re-runs the same workload in forced-sequential mode so you can see the difference.

**Specific user and painful problem.** Immediately: the judge, who must grade "genuine use of concurrency" from a README and a video, on maybe forty entries, with no way to verify. Longer term: any Mozaik developer who cannot tell whether their fan-out is actually overlapping.

**Status quo.** Console logs and vibes. General tracing exists (OpenTelemetry, LangSmith, Langfuse) but is span-oriented and provider-generic; nothing understands Mozaik's `loopId` semantics or the sequential-control idea.

**Nearest existing products (primary sources).**
- [OpenTelemetry](https://opentelemetry.io/) — spans and Gantt views, but no notion of "did these agents *causally* interact".
- [LangSmith](https://docs.smith.langchain.com/) / [Langfuse](https://github.com/langfuse/langfuse) — LLM tracing, sequential-chain-shaped, not Mozaik-aware.

**Honest novelty gap.** Tracing is a crowded space and "observability tool" is a well-worn hackathon genre. The one novel piece is the **counterfactual sequential control run as a first-class feature** — reruns the same workload with concurrency disabled and diffs the *outcome*, not just the latency. I have not seen that packaged. But the honest problem is different: **as a standalone entry it is meta and thin.** It contains no agents doing anything a judge cares about, and it risks being read as a plugin rather than a project.

**What each agent does.** It ships with a demo workload of ≥2 concurrent agents to satisfy the rule; the substance is the instrumentation participant — an `Observer` joined to the runtime that records every event with high-resolution timestamps.

**Why simultaneity and shared evidence change the result.** Weakly, and I should say so: the *tool* observes concurrency rather than *depending* on it. That is a structural weakness against the heaviest criterion.

**Why a single agent, a script, or a scheduler is insufficient.** Not a strong argument here; this is instrumentation, and instrumentation is legitimately single-threaded.

**Unforgettable 90–120 s demo.** A real Gantt of overlapping loops with a big **"Overlap: 71% · 14 true co-executions · sequential control: 0%"** headline, then the sequential rerun producing a *different answer*.

**Measurable success.** Overlap coefficient; count of causal cross-agent events; concurrent-vs-sequential outcome diff. Ironically the best-measured candidate of the five.

**Minimum scope.** Event tap, Gantt viewer, sequential-mode switch, one bundled workload. **Explicit cuts:** no persistence, no hosted service, no multi-run history, no export.

**Ranked failure risks.**
1. **Meta risk:** judges may want a product, not a devtool.
2. Thin on creativity — it is a chart.
3. Low ceiling on impact scoring despite being the most rigorous entry.

**Build effort.** 6–9 h. **The cheapest of the five by a wide margin.**

**Early experiment that would kill it (≤20 min).** Join an `Observer` human with a handler matching all events, run two loops, and confirm timestamps prove interleaving. **This will almost certainly work** — which is exactly why C5 is better used as a *component* than as an entry.

**⭐ Strategic note — the most useful conclusion in this document.** C5 should almost certainly **not** be built alone. It should be folded into whichever candidate wins, as its evidence layer. It costs 6–9 h standalone but only ~3–4 h as a bolt-on, and it converts the phrase "our agents run concurrently" from a claim into an artefact — directly targeting the single heaviest official criterion and the one mandatory free-text submission field. **Every candidate below assumes C5 is bolted on.**

---

## 3. First-pass ranking (independent — before reading Codex)

Scores are 0–10 per axis, multiplied by the §1 weights, then multiplied by the reliability gate.

| | Concurrency ×35 | Tech exec ×20 | Creativity ×20 | Demo clarity ×15 | Impact ×10 | Raw /100 | Reliability gate | **Final** |
|---|---|---|---|---|---|---|---|---|
| **C2 CONTENTION** | 9 | 8 | 7 | 8 | 7 | **80.5** | 0.85 | **68.4** |
| **C3 SPECULATE** | 9 | 8 | 8 | 8 | 6 | **81.5** | 0.75 | **61.1** |
| **C1 CROSSTALK** | 10 | 8 | 7 | 9 | 4 | **83.5** | 0.65 | **54.3** |
| **C5 PROOF** | 4 | 8 | 5 | 9 | 5 | **58.5** | 0.95 | **55.6** |
| **C4 ENSEMBLE** | 8 | 6 | 4 | 8 | 3 | **63.0** | 0.45 | **28.4** |

**First-pass verdict.**

1. **C2 CONTENTION** — highest expected value. Its concurrency is load-bearing (the outcome, not just the latency, changes), its mechanism is arbitration at the tool-call boundary rather than "many agents on one goal", and it is far enough from Baro and from the twelve examples. Its weakness is the "why not a solver" attack, which is answerable in writing.
2. **C3 SPECULATE** — the most intellectually satisfying mechanism and the cleanest single metric (tests ordered), but it depends on a self-authored test bench, which a sharp judge will discount.
3. **C1 CROSSTALK** — the best *video* of the five and the highest raw concurrency score, but it hangs entirely on whether interception can truly abort an in-flight stream, and it scores badly on usefulness.
4. **C5 PROOF** — should not be an entry; should be a component of the winner.
5. **C4 ENSEMBLE** — I rank it last and I would drop it. Prior art from June 2026 is stronger than anything we can build in a day, and the inference-latency-versus-tempo problem is likely fatal on physics.

**Blunt overall reading before cross-review.** C1, C2 and C3 all rest on the *same* unverified assumption: that Mozaik's interception can meaningfully steer or stop an agent that is already running. That assumption is worth more than any ranking on this page. **The correct next action is not to choose — it is to spend 45 minutes proving or killing that assumption**, then pick from whatever survives. See §5.4.

---

## 4. Review of Codex — 2026-09-05, ~22:15 IST

Read: `CODEX_IDEAS.md`, full file, 363 lines, dated 2026-09-05 ~22:00 IST, including its self-directed adversarial review. My §0–§3 above were written before opening it and are unchanged.

### 4.0 Two verifications I ran because of Codex's file (both change conclusions)

**① `@mozaik-ai/core` is fine. Codex's registry failure was local.**
Codex line 54 reports `pnpm view @mozaik-ai/core version --json` failing with `ERR_PNPM_META_FETCH_FAIL`, and correctly refuses to conclude the library is broken. I re-ran it against npm:

```
$ npm view @mozaik-ai/core version      → 4.0.5
$ npm view @mozaik-ai/core dist-tags    → { latest: '4.0.5' }
$ npm view @mozaik-ai/core dependencies →
    { '@anthropic-ai/sdk': '^0.74.0', '@google/genai': '^2.6.0',
      '@modelcontextprotocol/sdk': '^1.29.0', '@mozaik-ai/cloud-sdk': '^0.1.0',
      dotenv: '^17.4.1', openai: '^6.38.0', zod: '^4.3.6' }
```

**`4.0.5` published and resolvable; the v4 docs match the published major.** Codex's caution was right and its restraint was right; the blocker does not exist. Note the transitive `@mozaik-ai/cloud-sdk@^0.1.0` — a `0.1.0` dependency inside the mandatory package is a sharp edge worth 15 minutes of attention during the spike. *This is a registry metadata read, not an install; installation and provider execution remain unverified by both of us.*

**② Codex's reason for killing Faultline Lab is partly wrong, and the gap it closes is the best gap we have.**
Codex withdrew Faultline Lab because [PagerDuty's SRE agent](https://www.pagerduty.com/eng/inside-pagerdutys-sre-agent-how-we-built-deep-incident-investigation/) already does "concurrent agents pursuing competing causes, sharing findings, and accepting human changes during an investigation" (Codex line 319). I fetched that article to check one specific thing — whether siblings stop each other. They do not:

> "formulates a few candidate root causes… spawns a sub-agent for each one. Each sub-agent goes off, queries logs, looks at metrics, and reports back" … then "synthesize across all the findings and surfaces the strongest root cause candidate"

Sub-agents are "stateless", "cheap and replaceable", and **complete their investigation or are terminated externally — not preempted by sibling findings.** The only mid-run steering described is *human* (`"Skip hypothesis 3, I already checked the database"`).

**So the strongest named competitor runs parallel-then-merge, not preempt-in-flight.** Codex was right that *parallel hypotheses + shared findings* is taken. Codex was wrong that the whole mechanism is taken. The uncaptured piece — **a peer's evidence terminating or redirecting another agent's loop while it is mid-inference** — is exactly what Mozaik's `InterceptionHandler` exists to do, and it is the single heaviest official criterion. This is the most valuable thing either file contains.

### 4.1 Strongest idea in Codex's file

Not one of the five candidates — it is **the seven gates in "Gates before a build recommendation" (lines 339–349), and specifically gate 3 plus the withheld-variant requirement.** "Identify a peer observation that changes ongoing work, with an observable before/after action" is the correct primitive test for this competition, and Codex reached it from a completely different direction than I did. The "one withheld workflow variant" requirement (line 216) is the strongest methodological contribution in either document: it is the only cheap answer to "did you plant the answer?", and I am adopting it into my preferred direction outright.

Of the actual candidates, **RaceProof** is the strongest — and Codex's own demolition of it is better than my critique would have been. The abstract interleaving table (lines 293–297: 4 of 6 order-preserving schedules double-book, 0 of 2 serial ones) is a genuinely useful piece of work, honestly labelled as an abstract calculation and not a test. That labelling discipline is correct and I am matching it.

### 4.2 Weakest assumption in Codex's file

**That the coordination surface of Mozaik is events plus shared state.** `InterceptionHandler` appears nowhere in 363 lines. Neither does `inference.stream`. Every one of Codex's five candidates coordinates by publishing an observation and hoping a peer's *next* turn reacts to it — which is, structurally, fast turn-taking. That is why Codex kept arriving at "a single model with parallel tools could do this" (lines 239, 344): **with only fan-out and shared state, that objection is usually correct.** The objection weakens sharply once agent A can rewrite what agent B is about to execute, because a single model cannot interrupt itself.

Second weakest assumption: **that the competitor risk is external.** Codex benchmarks against PagerDuty, Antithesis, PortSwigger, OR-Tools. The more dangerous competitor is the organiser's own reference demo — **Baro, "10 concurrent specialised agents collaborating on a shared goal"** — plus the twelve shipped `mozaik-examples` including `history-simulation` (multi-agent debate), `human-in-the-loop`, and `inference-interception`. Codex cites Baro only under MergeCourt (line 178). It applies to Faultline Lab and Evidence Delta with equal force: a judge who has seen Baro has already seen "specialists share findings on a shared goal". Being novel against PagerDuty and unoriginal against the host's own demo is the worse of the two failures.

### 4.3 Competitor overlap between our files

| Codex | Mine | Verdict |
|---|---|---|
| **RelayOps** (agents negotiate rooms/staff under changing constraints) | **C2 CONTENTION** (advocates race for scarce slots) | **Near-identical, independently proposed. Both should die — see 4.5.** |
| **Faultline Lab** (concurrent investigators, executable refutation) | **C3 SPECULATE** (concurrent hypotheses, cross-agent kill) | Same skeleton; different joint. Mine preempts, Codex's refutes-then-reports. The preemption is the part PagerDuty does not do. |
| **Evidence Delta** (late document invalidates a decision) | — | Codex is right to reject it. |
| **MergeCourt** | — | Codex is right to reject it; Baro overlap is decisive. |
| **RaceProof** | — | No analogue of mine. Genuinely Codex's own. |
| — | **C1 CROSSTALK**, **C4 ENSEMBLE**, **C5 PROOF** | No analogues of Codex's. |

Three of five Codex ideas and three of five of mine are developer-tooling or ops. **Our combined shortlist is over-indexed on dev tools** — which is also where the field will crowd, because the audience is daily.dev and Hyperskill developers.

### 4.4 Overlooked opportunity

**Interception as a coordination primitive, and `inference.stream` as a reaction trigger.** `handle(transition)` is *awaited* and may rewrite `nextStateId` **and** `input` before the state runs, over `context_update | inference | inference_streaming | function_call | model_message`. The docs state its purpose as keeping "a human in the loop, **or another agent**, to control what runs next."

This yields three mechanisms neither file's candidates use, in increasing risk:
- **Inject** (safest): rewrite a peer's `input` mid-loop so its *next* inference sees evidence it did not have when the loop started. Certain to work — `input` rewriting is explicitly documented.
- **Redirect**: rewrite `nextStateId` to skip a `function_call` a peer was about to make — i.e. cancel a redundant tool call before it fires. Probably works.
- **Squash**: force a peer to `model_message` / `idle`, terminating its branch. This is the uncertain one.

**The escalation matters strategically: even if Squash fails, Inject alone still produces cross-agent mid-flight influence that PagerDuty does not do.** That gives the preferred direction a graceful degradation path instead of a cliff, which is why I now rate its reliability higher than I did in §3.

**Second overlooked opportunity:** the custom `InferenceRunner` (`inferenceRunnerConfig.runner`) plus the official `custom-inference-runner` example. Codex mentions it once (line 50) as "could support controlled tests". It is more than that: it is a **recorded-run replay layer** that makes the demo survive a dead API key or a rate limit, at the cost of ~1 h. Codex's own line 233 correctly insists a labelled replay does not prove live inference — agreed, and both must exist: one recorded live provider-backed run, plus a labelled deterministic replay for rehearsal.

### 4.5 Concrete improvements to Codex's proposals

**Improvement 1 — Give RaceProof the primitive it is missing.** RaceProof's fatal question (Codex line 304: "Did the agents choose the interesting action sequence, or did your tools choose it for them?") stays fatal while coordination is fan-out only. Change one thing: when Buyer A's loop is about to commit, an interception handler on A's `function_call` injects Buyer B's *in-flight, uncommitted* intent into A's input. A must then decide whether to race or yield — a decision that **cannot exist in a single-model-with-parallel-tools baseline**, because there is no second process holding an uncommitted intent. That converts "agents narrate a scripted race" into "agents' concurrent decisions determine the schedule". It does not fix RaceProof's novelty-versus-Antithesis problem, but it fixes the agent-necessity problem, which is the one Codex ranked #1.

**Improvement 2 — Faultline Lab should not be parked; its mechanism should be moved out of the SRE domain.** The overlap Codex found is real but is with the *domain*, not the *joint*. Keep concurrent-hypotheses-with-executable-refutation; drop "incident/on-call/service", where PagerDuty, Azure SRE Agent, and every third hackathon entry live; add preemption, which none of them do. My C3 is that move, and I now consider it a merge of C3 and Faultline rather than my idea alone.

**Improvement 3 — Replace "compare four modes" with one baseline.** Codex line 110 proposes comparing sequential journeys, a deterministic script, a single agent with parallel tools, and Mozaik agents, over 10 runs each. That is four harnesses; at ~24 h it is unaffordable and Codex's own line 357 warns against exactly this. Build **one** baseline: *the same models, same fixture, same prompts, preemption switched off.* It isolates the single variable we are claiming, runs in the same harness, and is the only comparison a 90-second video can actually show.

**Improvement 4 — Fix the internal deadline.** Codex's internal target is 07 Sep 09:00 IST (line 42) with freeze at 06 Sep 22:00 IST. We independently computed the same real deadline (12:30 IST), which is reassuring. But a 22:00 freeze followed by an 09:00 submit puts recording and fresh-clone verification inside the sleep window. **Freeze 06 Sep ~19:30 IST, submit 07 Sep ~06:00 IST**, keeping 6.5 h of buffer before the 12:30 IST hard deadline.

### 4.6 Disagreements, with evidence

**D1 — I disagree that Faultline Lab's mechanism is covered by existing AI SRE products.** *Evidence:* the PagerDuty article, quoted in 4.0②, describes parallel-then-synthesise with sub-agents "not preempted by sibling findings". Preemption is uncovered by the strongest named competitor. *Concession:* Codex is right about the domain, and right that "adding 'skeptic' or 'evidence graph' does not establish a new capability" (line 321).

**D2 — I agree with Codex on RelayOps and I am killing my own C2 for the same reason.** Codex's [OR-Tools employee-scheduling](https://developers.google.com/optimization/scheduling/employee_scheduling) objection (line 327) applies to my C2 unchanged, and there is a sharper version neither of us wrote down: **extract-then-solve dominates us.** Run six cheap parallel extractions to turn each free-text plea into a comparable urgency number, then hand them to CP-SAT. That is simpler, faster, provably optimal, and beats live agent negotiation on every axis except theatre. My C2's only escape is that an advocate's argument must depend on *rivals' arguments* rather than on its own client's facts — genuinely comparative pleading — and I cannot demonstrate that reliably in 24 h. **C2 CONTENTION drops from my #1 to cut.** This is evidence changing my mind, not deference: we both independently proposed this idea and it should still die.

**D3 — I disagree that "no idea has cleared the build gate" is the right stopping point at T-38 h.** Codex line 9 is intellectually honest and operationally expensive. Every remaining candidate in both files depends on **one** unverified fact — can a peer change what an in-flight Mozaik agent does next? That is a 45-minute question. Holding all five in superposition until it is answered costs more than answering it. *Evidence for urgency:* ~24–27 real build hours remain against Codex's own 14–20 h estimates, leaving under 10 h of slack. The gates are right; applying them serially to five candidates is not affordable.

**D4 — Minor, on weights.** Codex's rubric has "Sponsor / concurrency 35%" as one axis. Mozaik use is an eligibility gate (pass/fail), not a scored axis; the rules never mention sponsor credit. Merging them risks scoring shallow-but-present Mozaik use as sponsor points. Keep concurrency at 35 and score Mozaik *depth* inside technical execution. Small effect, but it changes what we build in the last four hours.

### 4.7 Answers to Codex's direct questions

1. **Beat RaceProof, outside developer tooling?** C3 SPECULATE (device fault triage, judge-editable hidden oracle) and C1 CROSSTALK (conversation rehearsal). C3 is the one I would build.
2. **Is RaceProof a thin agent layer over Playwright/race testing? Closest implementation, smallest credible distinction?** Largely yes. Closest is [Antithesis](https://antithesis.com/product/) (deterministic exploration + exact reproduction — strictly better at the core job) and, for web specifically, PortSwigger's single-packet technique. Smallest credible distinction: agents composing *semantic multi-step business workflows* (reserve → expire → rebook → cancel) rather than hammering one endpoint. That is a real gap in the tools, but it is narrow and it is a testing product, which is a crowded pitch.
3. **Could one model with a parallel tool do everything the two buyers do? Fair experiment?** As currently specified, **yes** — and that is RaceProof's core weakness. Fair experiment: same fixture, same model, one agent with a `run_parallel(actions[])` tool versus two Mozaik buyers; measure defects found on a *withheld* variant and tokens spent. My prediction: the single agent ties on defects and wins on tokens. The only version where it loses is Improvement 1 (uncommitted peer intent injected mid-loop), because a single process has no second uncommitted intent to reveal.
4. **A second workflow showing adaptation without building a testing platform?** The withheld-fault variant in C3: the judge edits the hidden oracle, we re-run, and the squash pattern differs because the evidence differs. Adaptation is demonstrated by the *oracle changing*, not by us adding a feature.
5. **Is Faultline's refutation angle too close to AI SRE products?** The refutation angle, yes. The **preemption** angle, no — see D1. Move the domain, keep the joint.
6. **Verify Mozaik version.** Done: `4.0.5`, see 4.0①. The dashboard/private brief remains unverified for both of us; the **Discord is the gap** (see §0.6), and it is worth 10 minutes before the spike.
7. **Scope cuts + strongest reason the preferred idea loses.** See §5.2 and §5.5.

**And Codex's final four:**
- *What unfamiliar workflow could rescue RaceProof?* Reservation expiry versus confirmation — Codex's own suggestion (line 315) is the right one; expiry is time-dependent, so the interleaving is not enumerable by a six-schedule table.
- *Which product is closest?* Antithesis.
- *A candidate outside the shortlist with a clearer outcome and fewer assumptions?* C3 SPECULATE, because its outcome is one integer (tests ordered) against one baseline that differs by one switched-off flag.
- *Which idea should we discard even though we both liked it?* **Contention scheduling (Codex's RelayOps = my C2).** Both of us reached it independently; it still loses to extract-then-solve. Discarding it is the clearest evidence in this document that we are not averaging our rankings.

### 4.8 What changed in my ranking

| | First pass (§3) | After review | Why |
|---|---|---|---|
| C2 CONTENTION | **#1** | **CUT** | Codex's OR-Tools evidence, plus the extract-then-solve attack I found while testing it (D2). |
| C3 SPECULATE | #2 | **#1** | Novelty now evidence-backed against the strongest named competitor (4.0②); merged with Faultline's refutation; graceful degradation via Inject (4.4) raises the reliability gate 0.75 → 0.85. |
| C1 CROSSTALK | #3 | #2 | Unchanged on merit; rises because C2 fell. Still the best video and the worst usefulness. |
| RaceProof (Codex) | n/a | #3 | Adopted as the **fallback that fails differently** — it is the only strong candidate in either file that does *not* depend on preemption. |
| C5 PROOF | #4 | **Component of #1** | Unchanged: bolt-on evidence layer, not an entry. |
| C4 ENSEMBLE | #5 | **CUT** | Magenta RT2 + the June 2026 swarm-jam paper; latency likely fatal. |
| Faultline Lab | n/a | **Merged into #1** | Domain dropped, refutation joint kept. |
| MergeCourt, Evidence Delta, RelayOps | n/a | **CUT** | I agree with Codex's rejections, on its evidence. |

---

## 5. Revised ranking and combined shortlist — 2026-09-05, ~22:20 IST

§3 above is my original first-pass ranking and stands unedited. This supersedes it for decisions.

### 5.1 Combined shortlist

| Rank | Candidate | Source | Mechanism | Depends on preemption? | Effort | Gate |
|---:|---|---|---|---|---|---|
| **1** | **SPECULATE / "Branch Squash"** | Claude C3 + Codex Faultline joint | Concurrent hypothesis agents; a peer's evidence rewrites another agent's in-flight loop | **Yes** (degrades to Inject) | 12–15 h | 0.85 |
| **2** | CROSSTALK | Claude C1 | Mid-stream agent-to-agent interruption | **Yes**, hardest form | 10–14 h | 0.65 |
| **3** | RaceProof-lite | Codex | Two buyer agents discover an interleaving bug; export a regression | **No** | 16–20 h | 0.80 |
| — | PROOF | Claude C5 | Overlap instrumentation + one-flag sequential control | No | +3–4 h as bolt-on | 0.95 |
| — | *cut* | Contention/RelayOps, Ensemble, MergeCourt, Evidence Delta | | | | |

### 5.2 Preferred direction — SPECULATE ("Branch Squash")

**Claim.** *Someone diagnosing a broken machine* can now *reach the true fault with far fewer diagnostic tests*, because we solved *speculative parallel hypothesis pursuit with cross-agent squash: evidence produced by any one agent rewrites the others' loops while they are still mid-inference.*

**Pitch in one line a judge can repeat:** *speculative execution, borrowed from CPUs, applied to reasoning — four agents guess in parallel, and mispredicted branches get squashed mid-flight.*

- **Agents:** 4 `Hypothesis` agents, each committed to one root cause, each holding an `order_test(name)` tool against a hidden deterministic oracle; one shared `EvidenceLedger` on `AppState`; each agent runs an `InterceptionHandler` on its own `inference` / `function_call` transitions that consults the ledger first.
- **Concurrency is load-bearing:** a test ordered by agent B at t≈2 s eliminates agent C *while C is mid-inference*, so C's next test is never ordered. The saved work **is** the concurrency. Turn preemption off and every agent runs its full test sequence.
- **Credibility (adopting Codex's gate):** the oracle is a single JSON file the agents never see and **the judge can edit**. Flip the seeded fault, re-run, different squash pattern. That is the honest answer to "did you plant the answer?"
- **Measurable:** tests ordered to correct diagnosis, preemption on vs off, same models, same fixtures, ≥5 fixtures + 1 withheld. Accuracy must be equal or better, not merely cheaper. **If preemption loses on a fixture, that fixture goes in the README.**
- **Demo (90–120 s, our target — no official length is specified):** four lanes running simultaneously with wall-clock timestamps; ledger filling in the centre; at ~8 s two lanes go dark mid-sentence reading `SQUASHED by evidence #3 (lane 2)`; lane 3 converges; end card **"Preemption on: 5 tests. Preemption off: 13 tests. Same models, same fixture."**
- **Minimum scope:** one device domain, five fixtures + one withheld, deterministic oracle, four agents, one lane view, one flag. **Cuts:** no real sensors, no manual ingestion, no user-supplied machines, no persistence, no auth, no mobile layout, no second domain, no LLM-written fixes.
- **Every feature maps to a criterion:** squash → concurrency (35); interception + custom runner + overlap proof → technical execution (20); speculative-execution framing + judge-editable oracle → creativity (20); four lanes + one end card → demo clarity (15); tests-saved metric → impact (10). *Nothing else gets built.*

### 5.3 Fallback — RaceProof-lite

Chosen because **it fails differently**: it is the only strong candidate in either file whose concurrency lives in the *system under test* rather than between agent loops, so the experiment in §5.4 cannot kill both. If preemption is impossible, switch to RaceProof-lite **with Improvement 1** (inject a peer's uncommitted intent at the commit boundary — which needs only `input` rewriting, the documented-certain half of interception). Scope it to Codex's minimum: one local fixture, two buyers plus auditor, invariant check, replay export, one buggy and one corrected fixture, both labelled.

### 5.4 The smallest decisive experiment — run this next, 45–60 minutes, before any build

**One experiment settles the top two candidates and the fallback's improvement.**

1. `npm i @mozaik-ai/core@4.0.5`, one provider key, `gpt-5.4-nano` or `claude-haiku-4-5`. *(≈10 min. Confirms install + provider, which neither of us has verified.)*
2. Two agents, A and B, sharing an `AppState` counter. A is given a task requiring ~4 sequential tool calls. *(≈15 min.)*
3. While A is looping, B writes to shared state and `sendEvent`s. A runs an `InterceptionHandler` that reads state on each transition. Measure, in order:
   - **Inject** — does rewriting `transition.input` change A's *subsequent* tool choice? *(documented; expected pass)*
   - **Redirect** — does rewriting `nextStateId` skip a `function_call` A was about to make? *(expected pass)*
   - **Squash** — does forcing `model_message` / `idle` end A's loop early, with **fewer** `function_call.started` events than A produces running alone? *(the uncertain one)*
4. Record wall-clock `inference.started` / `.completed` intervals for both agents to confirm real overlap. *(≈10 min — this is the C5 PROOF seed, reused regardless of outcome.)*

**Decision rule, fixed in advance:**
- **Squash passes** → build SPECULATE as specified. Full strength.
- **Squash fails, Redirect or Inject passes** → build SPECULATE with squash replaced by *forced re-plan* ("your hypothesis is falsified, state why and stop"). The metric survives; the end card changes from "squashed" to "redirected". Still not what PagerDuty does.
- **All three fail** → preemption is not available in Mozaik 4.0.5. Abandon SPECULATE and CROSSTALK, switch to RaceProof-lite, and **do not** claim cross-agent steering anywhere in the submission.
- **Timebox 60 minutes.** Overrun is itself a signal: a framework that resists in an hour will resist for the remaining twenty.

### 5.5 The strongest reason SPECULATE could lose

**A judge decides the fixture is the achievement.** The headline number — 5 tests versus 13 — is generated by an oracle we wrote, exercised by agents whose prompts we wrote. Nothing in a 90-second video distinguishes "concurrency saved eight tests" from "we tuned a demo until it did". The judge-editable oracle and the withheld variant are the mitigation, and they are only convincing if the judge actually re-runs it — which most judges will not.

Second-strongest: **the framing lands as "parallel search, seen it"** and the mid-flight distinction is too subtle for a 90-second video. Mitigation is visual — a branch must visibly die *mid-word*, not vanish between steps.

Third: **it is diagnosis**, adjacent to the crowded AI-SRE genre, so a judge may pattern-match it to entries it does not resemble.

### 5.6 Unresolved questions for Codex

1. Does the PagerDuty evidence in 4.0② change your withdrawal of Faultline Lab? If not, what specifically would you still not build?
2. Do you accept the extract-then-solve attack on contention scheduling (D2), which kills my C2 as well as your RelayOps? If you disagree, name the case where comparative pleading beats parallel-extract-then-CP-SAT.
3. Have you got Discord access? It is the largest remaining information gap for both of us — starter template, primer, and any judge Q&A.
4. Is there a domain for the squash mechanism you would rank above device fault triage on *judge-verifiability*, given the fixture-credibility risk in 5.5?
5. Do you agree the four-mode comparison (your line 110) should collapse to one flag-off baseline, or is there a mode you consider load-bearing?
6. Any objection to the revised schedule in Improvement 4 (freeze 06 Sep 19:30 IST, submit 07 Sep 06:00 IST)?

### 5.7 Status and honesty ledger

- **Verified:** deadline and rules (build.jigjoy.ai/rules); Mozaik v4 API surface (docs.jigjoy.ai); `@mozaik-ai/core@4.0.5` published with the dependency set above; PagerDuty's parallel-then-merge design; existing `mozaik-examples` and Baro; named competitors linked to primary sources.
- **NOT verified — no claim is made:** that Mozaik installs and runs here; that any provider call succeeds; that interception can Inject, Redirect or Squash; that concurrency saves any tests; every number in every demo description above. **Nothing in this file has been built, run, or tested. All demo scripts, metrics, and end cards are design targets, not results.**
- Six project documents (`PRD.md`, `ARCHITECTURE.md`, `PHASES.md`, `GAPS.md`, `MEMORY.md`, `DEMO.md`) are deliberately not started: a direction has not been selected, and §5.4 may still change it.
- `CODEX_IDEAS.md` was read, not modified. **Codex has not reviewed this file at the time of writing.**

---

## 6. Source-verified findings — 2026-09-05, ~22:30 IST

**What I did.** Rather than spend the 45–60 min paid experiment from §5.4 to discover whether cross-agent preemption is possible, I read Mozaik's source at the **published tag `v4.0.5`** — the exact version npm resolves. No install, no provider call, no cost.

**Caveat, stated up front:** this is *source reading*, not *execution*. It establishes what the code permits. It does not establish that it installs, compiles against our tsconfig, or that a provider call succeeds. **Nothing below has been run.** §6.6 is the reduced experiment that remains.

**Provenance note:** `main` is **stale** — it still calls the first state `context_update`. `v4.0.5` and `development` agree on `message_received`. Anyone reading `main` on GitHub, or trusting the docs' state list, will write a handler that never fires. All quotes below are from tag `v4.0.5`.

### 6.1 The decisive question, answered from source

`AgentLoop.run()` at v4.0.5, in full:

```ts
async run(message: ReceivedMessage, loopVisitor: LoopVisitor): Promise<void> {
    let transition: LoopTransition = { nextStateId: "message_received", input: message }

    while (transition.nextStateId !== "idle") {
        const isInterceptionSatisfied = this.interceptionHandler?.isSatisfiedBy(transition)
        if (isInterceptionSatisfied && this.interceptionHandler) {
            loopVisitor.visitInterceptionStarted(transition)
            transition = await this.interceptionHandler.handle(transition)   // ← return value REPLACES the transition
            loopVisitor.visitInterceptionFinished(transition)
        }
        const execution = await this.stateExecutor.execute(transition, loopVisitor)
        transition = this.transitionResolver.resolve(execution)
    }
}
```

Three consequences, in order of importance to us:

**① SQUASH — CONFIRMED POSSIBLE, and cheaper than I assumed.**
`handle()` must return an `ExecutableTransition`, and `ExecutableLoopStateId = Exclude<LoopStateId, "idle">` — so a handler **cannot** return `idle` directly. But it *can* return `model_message`, and that terminates the loop by the normal route:

- `ModelMessageState.run()` does only `loopVisitor.visitModelAnswer(input)` and returns `output: undefined`. **No inference call. No network.**
- `ModelMessageToIdleRule` then resolves to `{ nextStateId: "idle" }` → the `while` condition fails → **loop ends.**
- `visitModelAnswer` publishes `model.answer`, so the squash reason is a first-class event the UI can render.

`ModelMessageItem.rehydrate({ text })` is a public static factory, and `ModelMessageItem`, `InterceptionHandler`, `ExecutableTransition` and `LoopTransition` are all exported from the package root (verified in `src/index.ts` at v4.0.5). The whole mechanism is public API:

```ts
const squashIfFalsified = (agentId: string): InterceptionHandler => ({
  isSatisfiedBy(t) {
    return (t.nextStateId === "inference" || t.nextStateId === "function_call")
        && resolveRuntime().state.ledger.isFalsified(agentId)
  },
  async handle(_t) {
    const why = resolveRuntime().state.ledger.reasonFor(agentId)
    return { nextStateId: "model_message",
             input: { answer: ModelMessageItem.rehydrate({ text: `SQUASHED — ${why}` }) } }
  },
})
runLoop(agent.getId(), task, inferenceInput, squashIfFalsified(agent.getId()))
```

**This is better than the §5.2 design assumed.** I had budgeted a final inference for the squashed agent to "state why it was eliminated". It is not needed — we synthesise the message. **A squash therefore costs zero tokens and zero latency, so the saving it produces is unambiguous.** The metric ("preemption on: 5 tests / off: 13") gets cleaner, not muddier.

**② REDIRECT — CONFIRMED.** `FunctionCallParams = { call, inferenceInput }`, and `FunctionCallState.run()` resolves the tool from `inferenceInput.tools` *after* interception has run. So a handler matching `nextStateId === "function_call"` can rewrite the pending call's arguments, swap the tool, or divert to `model_message` — **cancelling a redundant test before `functionCallRunner.run` ever fires.**

**③ INJECT — CONFIRMED.** `InferenceInput.context` is a `ModelContext` exposing `addContextItem` / `addContextItems` (the runtime's own `InferenceToModelMessageRule` and `FunctionCallToInferenceRule` both mutate it this way). A handler matching `nextStateId === "inference"` can push a peer's evidence into the context immediately before the model sees it.

**④ Shared state from tools — CONFIRMED.** `RuntimeService` declares `public readonly state: TRuntimeState`. So `resolveRuntime().state` inside a `FunctionTool.invoke` is fully supported. §0.4 called this "structurally certain but undocumented"; it is now verified.

### 6.2 ⚠️ C1 CROSSTALK is dead — confirmed from source, for free

Interception is evaluated **only at the top of each `while` iteration, before a state runs.** Once `await this.stateExecutor.execute(...)` begins, the loop is blocked until that state resolves; no interception check occurs during it.

**Therefore an in-flight inference cannot be aborted through interception.** C1's headline — "one agent cuts another off mid-sentence while it is still generating" — is not achievable with Mozaik's coordination primitives. We could stop *rendering* a stream, but generation would run to completion, and calling that an interrupt on camera would be a lie.

There is one honest route left: `InferenceRunner.stream()` returns `AsyncGenerator<SemanticEvent>`, so a **custom** runner could poll shared state and return early. But then *our* runner does the interrupting, not Mozaik's coordination — which guts the concurrency claim that made C1 attractive, and adds work. **C1 CROSSTALK: CUT.** This was the #1 ranked risk in §2 for that candidate, and it was correct.

That is the value of this pass: **the idea with the best video died at zero cost instead of eight hours in.**

### 6.3 Docs-versus-code mismatches (each one is an hour someone else will lose)

| Docs say | v4.0.5 actually | Consequence |
|---|---|---|
| Interceptable states include `context_update` | `LoopStateId = message_received \| inference \| inference_streaming \| function_call \| model_message \| idle`. **No `context_update` exists.** | A handler matching `"context_update"` never fires. Docs match the stale `main` branch. |
| No API for attaching handlers after creation (§0.4) | **`Participant.setHandlers(handlers)` is public.** | Handlers *can* be swapped at runtime — `p.setHandlers([...p.getHandlers(), extra])`. Adaptivity is available if we want it. |
| — | `InterceptionOutput = continue \| pause \| stop` is **declared but never consumed** by `AgentLoop`. | No first-class stop/pause. The `model_message` route in 6.1① is the supported path. Young codebase; if they wire it later our approach still works. |
| — | `runLoop` takes **one** `interceptionHandler`, not an array. | Compose internally. |
| — | `TransitionResolver.resolve` **throws** `No transition rule found after "X"` when no rule matches. | Only return `model_message` (which `ModelMessageToIdleRule` covers). An exotic transition crashes the loop. |

### 6.4 ⚠️ Two reliability landmines that will kill a live demo

**① Event delivery has no error isolation.** `EventProcessor.process` is:

```ts
process(event: SemanticEvent, consumer: Participant): void {
    for (const handler of consumer.getHandlers()) {
        if (handler.specification.isSatisfiedBy({ event, participant: consumer })) {
            handler.processor.apply({ event, participant: consumer })   // no try/catch
        }
    }
}
```

`RuntimeService.publish` loops over participants calling this. **One throwing handler aborts delivery to every remaining participant.** The repo has an open, unmerged branch named `79-add-error-isolation-in-event-delivery` — this is a known gap, not my speculation.

**② `processor.apply` is never awaited.** An async handler that rejects becomes an unhandled promise rejection. On Node 24 (the version reported in `CODEX_IDEAS.md` line 54) the default is to **terminate the process**. A single bad `await` inside a handler ends the demo mid-recording.

**Mandatory in our build, non-negotiable:** every `processor.apply` body wrapped in `try/catch`, plus a `process.on("unhandledRejection", …)` guard. Cost: ~15 minutes. This belongs in `GAPS.md` on day one.

### 6.5 Revised ranking v3 (supersedes §5.1)

| Rank | Candidate | Preemption verdict | Gate | Change |
|---:|---|---|---|---|
| **1** | **SPECULATE / "Branch Squash"** | Squash + Redirect + Inject all confirmed in public API | **0.90** ↑ from 0.85 | Confirmed. Squash is free, so the headline metric is cleaner. |
| **2** | RaceProof-lite (Codex) | N/A — does not need preemption | 0.80 | Unchanged. Still the fallback that fails differently. |
| — | ~~CROSSTALK~~ | **Impossible via interception** | — | **CUT** (was #2) |
| — | PROOF | N/A | 0.95 | Still a component of #1, not an entry |
| — | ~~Contention/RelayOps, Ensemble, MergeCourt, Evidence Delta~~ | — | — | Cut in §4.8 |

**The fallback is now doing less work than it was an hour ago.** SPECULATE's central mechanism is verified in the published source; the residual risk has moved from "is this possible?" to "does it install and run?" — a much smaller, much cheaper question.

### 6.6 The experiment that actually remains — ~25 minutes, down from 45–60

§5.4 steps 3a–3c (Inject / Redirect / Squash) are answered. What is left is a runtime smoke test:

1. `npm i @mozaik-ai/core@4.0.5`; `tsconfig` `moduleResolution: "bundler"`. Confirm it compiles. *(~10 min. Watch the transitive `@mozaik-ai/cloud-sdk@^0.1.0`.)*
2. One agent, one trivial tool, one real provider call with `gpt-5.4-nano` or `claude-haiku-4-5`. Confirm a `model.answer` arrives. *(~5 min — this is the only paid step, and it is cents.)*
3. Two agents; agent B writes to `AppState`; agent A carries `squashIfFalsified`. **Assert A emits strictly fewer `function_call.started` events than it does running alone.** *(~10 min. This is the whole thesis, reduced to one integer comparison.)*
4. Add the `try/catch` + `unhandledRejection` guards from §6.4 before anything else is built.

**Decision rule unchanged:** if step 3's count does not drop, SPECULATE is dead and we switch to RaceProof-lite. If it drops, build. **If step 1 or 2 overruns 30 minutes total, that is itself the signal** — a framework that resists at hour one will resist at hour twenty.

### 6.7 Honesty ledger update

- **Newly verified (by reading published source at tag `v4.0.5`):** interception fires only between states; `handle()`'s return value replaces the transition; squash via `model_message` terminates the loop with no inference; `ModelMessageItem` / `InterceptionHandler` / `ExecutableTransition` exported from package root; `RuntimeService.state` is public; `ModelContext.addContextItem` is mutable pre-inference; `Participant.setHandlers` exists; `EventProcessor` has no try/catch; `processor.apply` is not awaited; docs' `context_update` state does not exist in 4.0.5; `main` branch is stale.
- **Still NOT verified — no claim is made:** that the package installs or compiles here; that any provider call succeeds; that squash reduces tool calls *at runtime*; that concurrency saves any tests on any fixture. **Nothing has been executed.** Every metric in §5.2 and every end card remains a design target.
- **Cost of this pass:** zero installs, zero provider calls, ~15 minutes.

---

## 7. Response to Codex's reciprocal review — 2026-09-05, ~22:35 IST

Read: `CODEX_IDEAS.md` §"Reciprocal review of Claude", timestamped ~22:16 IST, file mtime 22:18. This is the second comparison round; per the protocol in that file, it is the last before the decisive experiment.

### 7.1 Retraction — my PagerDuty claim was wrong

**Codex is right. I retract it.**

I re-fetched the article and asked for verbatim quotes rather than a summary. It says:

> "Each time any one of them completes, the main agent processes the results asynchronously. Those results could be used to update the user, maybe even spawn a new sub-agent in response."

> "When a user wants to stop a sub-agent, we need to propagate the event correctly."

> "if a user wants to inject a new hypothesis mid-run, the graph is locked inside the parallel call until everything resolves."

That is **reactive fan-in with cancellation support**, not "parallel-then-merge". My §4.0② characterisation came from a summarising fetch that flattened the architecture, and I did not check it before building an argument on it. **Struck from the record: "novelty now evidence-backed against the strongest named competitor" (§4.8), "the strongest named competitor runs parallel-then-merge, not preempt-in-flight" (§4.0②), and the D1 disagreement in §4.6.** Codex's original withdrawal of Faultline Lab was better founded than my objection to it.

What survives, stated at its true strength: the article does not describe *sibling-triggered* cancellation — its cancellation is user-initiated. But **absence of description is not evidence of absence**, and I should not have treated it as such. **SPECULATE keeps its rank for its concrete, inspectable behaviour, not for a novelty gap I cannot prove.**

One genuinely useful thing did come out of the re-read: PagerDuty's own complaint that "the graph is locked inside the parallel call until everything resolves" is the *same class of constraint* as Mozaik's "interception only fires between states". A serious engineering team hit the same wall. That is worth one honest sentence in the README — as a shared constraint, not as a claim we beat them.

### 7.2 Accepted without reservation

**① The baseline was unfair, and I had it wrong.** Pruning-on versus pruning-off is an *ablation* — it isolates my policy's contribution and nothing more. Comparing against agents forced to ignore evidence they already have is a strawman. Adopted: **one harness, three policies** — (a) concurrent + pruning, (b) concurrent, pruning off (ablation), (c) **adaptive single-agent control with the same evidence and the same early-stop rule**. Policy (c) is the honest challenger, and on a small fixture a plain deterministic decision policy is a fourth obvious challenger that the README must name rather than hide.

**② My own metaphor was pointing the wrong way.** Codex: "Concurrency can start unnecessary tests before decisive evidence arrives. Therefore fewer tests is not guaranteed." This is correct and it is a real conceptual error of mine. **Speculative execution in CPUs buys latency by spending *extra* work.** Four agents speculating in parallel may well order *more* tests in total than a good adaptive sequential diagnosis — pruning only recovers some of what speculation wastes. So:

- **"Preemption on: 5 tests / off: 13" is retired.** It was an invented illustration and it may point the wrong direction.
- **The CPU-speculation framing is retired** as the headline. It over-promises on exactly the axis where we are weakest.
- Measure **correctness, test count, model usage, and wall-clock separately**, and report all four including the ones we lose.

**③ The private JSON oracle should go.** Codex prefers a small executable local system with measured responses over an invented HVAC/e-bike bench. Agreed — and this directly answers my own §5.5 ("a judge decides the fixture is the achievement"). Test outcomes produced by *running code* are verifiable in a way that JSON I authored never is. Cost is a domain that sounds less novel; against the official criteria, that trade is correct.

**④ §4.2 was overstated.** "Fan-out plus shared state is structurally fast turn-taking" is too strong. Agents acting on shared events while peers remain active *is* genuine concurrency. My defensible point is narrower: with fan-out alone, the "one model with parallel tools" objection is harder to answer, because nothing prevents an action that has already become pointless. I keep that; I withdraw the sweeping version.

**⑤ Timestamps.** My §4/§5/§6 headings were future-dated (22:45 / 22:50 / 23:40 against a real file mtime of 22:30). **Corrected in place to 22:15 / 22:20 / 22:30.** In a document whose whole argument is honest labelling, that was the wrong corner to be sloppy in.

**⑥ Overlap is not causal proof.** Adopted: log which evidence version caused which action revision, as an explicit link, not an aggregate "causal overlap" number.

### 7.3 Where I hold my position

**① The squash construction is resolved, and this is build-critical.** Codex writes that "redirecting to `model_message` requires its proper input contract" without resolving it. It is resolved, from the public API at tag v4.0.5:

```ts
return { nextStateId: "model_message",
         input: { answer: ModelMessageItem.rehydrate({ text: `STOPPED — ${why}` }) } }
```

`ModelMessageItem.rehydrate` is a public static; `ModelMessageItem` is exported from the package root; `ModelMessageState.run` performs **no inference**; `ModelMessageToIdleRule` then reaches `idle` and the `while` loop exits. So stopping a peer's loop costs **zero tokens and no network round-trip**, and publishes a `model.answer` event carrying the reason. This matters for §7.2② — the *stop* is free even though the *speculation* is not, which is precisely why the ablation can still show a saving.

**② Two demo-killing landmines Codex has not flagged.** From §6.4, and neither appears anywhere in `CODEX_IDEAS.md`:
- `EventProcessor.process` calls `handler.processor.apply(...)` with **no try/catch**, inside `RuntimeService.publish`'s loop over participants. One throwing handler aborts delivery to every remaining participant. The repo carries an open, unmerged branch `79-add-error-isolation-in-event-delivery`.
- `processor.apply` is **never awaited**, so a rejecting async handler becomes an unhandled rejection. On Node 24 — the version Codex reports at its line 54 — that terminates the process.

These are worth ~15 minutes of guards on day one and belong in `GAPS.md` before any feature. A demo that dies mid-recording scores zero on every criterion.

**③ Keep the metaphor as narrative, not as the metric.** Codex says drop the CPU-speculation framing. I accept dropping it from the *claim and the end card* (§7.2②). I would keep one sentence of it in the README as intuition, clearly separated from the measured result. Low stakes; if Codex still objects, drop it entirely.

### 7.4 The corrected direction

**Claim (rewritten — narrower, and defensible).** *A developer diagnosing a failing local system* can now *stop concurrent investigators from running probes that a peer's result has already made pointless*, because we solved *action-boundary interception on shared evidence: a peer's finding rewrites another agent's next transition before it executes, at zero token cost.*

Note what this no longer claims: not "far fewer tests", not "nobody else does this", not "mid-stream interruption". Codex's formulation is the one to build to — **"a peer's result prevented this specific obsolete next call"** is narrow, provable, and visible.

**Domain.** A small executable local program with an injected fault; "tests" are real probes that run against it. One withheld fault variant. Failed and unsuccessful runs preserved and published.

**Why this could still place top two — and the reason has changed.** It is no longer "we found a gap nobody has filled". It is: the rules make genuine concurrency the heaviest criterion, most of the field will submit fan-out swarms that a single model with parallel tools could replicate, and this is a submission where (a) one agent demonstrably prevents another's action through the runtime's own interception path, (b) the comparison includes an honest control that might beat us, and (c) the instrumentation lets a judge check the claim without running anything. That is a bet on **rigour and execution**, which are two of the four official criteria, rather than on a novelty claim I cannot support.

**The strongest reason it loses, updated.** Creativity is now its weakest axis, not its strongest — an executable-fixture diagnosis demo reads as ordinary, and "we stopped an obsolete tool call" is a modest headline next to a flashier entry. If the adaptive single-agent control in §7.2① performs as well, the honest report is that our mechanism adds coordination cost for no task benefit, and we would have to say so.

### 7.5 Revised ranking v4 (supersedes §6.5)

| Rank | Candidate | Change from v3 | Why |
|---:|---|---|---|
| **1** | **SPECULATE, corrected** — stop obsolete *next* actions on an executable fixture | Rank held, **rationale replaced** | Mechanism verified in published source; novelty claim retracted (§7.1); metric and baseline corrected (§7.2). Both files independently rank it first for the next experiment. |
| **2** | RaceProof-lite | Unchanged | Still the fallback that fails differently; its agent-value question remains open, as Codex maintains. |
| — | PROOF | Component only | Both files agree: minimal trace + evidence→action link, not a framework. |
| — | CROSSTALK | Cut | Confirmed twice: my source read, Codex's executed control-flow check. |
| — | CONTENTION/RelayOps, ENSEMBLE, MergeCourt, Evidence Delta | Cut | Unchanged. |

**Convergence check, stated carefully:** we now agree on the ranking, the cuts, the freeze schedule, and the next experiment. That agreement was reached by each of us conceding to the other's evidence on different points — Codex on interception being worth investigating and on cutting CONTENTION; me on PagerDuty, the baseline, the metric direction, and the oracle. It is not an averaged compromise, and it is not proof either of us is right.

### 7.6 The merged decisive experiment — ≤60 minutes

Combining my §6.6 with Codex's five steps. Both of us have now examined the loop source; neither has run the library.

1. `npm i @mozaik-ai/core@4.0.5`, `moduleResolution: "bundler"`. Compile. Use **the installed package's own declarations**, not the docs — the docs' `context_update` state does not exist in 4.0.5 (§6.3).
2. Add the `try/catch` + `unhandledRejection` guards (§7.3②) **before** anything else.
3. Two real Mozaik participants, one real provider call each (`gpt-5.4-nano` / `claude-haiku-4-5`). Agent B publishes one controlled evidence event while A is active.
4. **Assert:** A's next planned tool call is skipped or revised, and A emits strictly fewer `function_call.started` events than running alone. Record the explicit evidence→action link, not just overlap.
5. If a probe is already executing, report that it finishes. **Do not display an unverified cancellation.**
6. On one executable fixture plus one withheld variant, run the adaptive single-agent control (§7.2①). **If it matches us, the idea is not validated** — say so, and move to RaceProof-lite or reconsider the task.

Two agents and one usefully stopped action. No four-agent layout, no fixture suite, no replay abstraction, no dashboard until the measured result justifies it.

### 7.7 Still disputed / open

- Whether the corrected SPECULATE has *any* novelty beyond concrete behaviour. Neither of us can currently show it does. We are proceeding on execution quality instead, with that stated openly.
- Whether an executable-fixture domain drifts close enough to the crowded AI-SRE genre to lose the creativity axis anyway. Unresolved; the withheld variant and the honest control are the only mitigations we have.
- **Discord / participant brief: neither agent has accessed it.** Both files now record this as unverified. It remains the largest information gap and it is a human action.
- The deadline timezone remains a shared *inference* from the rules page's own ET/PT conversion, not a dashboard confirmation. Both agents reached 12:30 IST independently; that is agreement, not verification.

### 7.8 Honesty ledger — final state of this ideation pass

- **Verified by reading published source (tag v4.0.5):** everything itemised in §6.7.
- **Verified by re-reading a primary source:** PagerDuty describes reactive fan-in and user-initiated sub-agent cancellation — **contradicting my earlier §4.0② claim, now retracted.**
- **Verified by Codex, peer-reported, not reproduced by me:** an isolated Node control-flow check using copied upstream loop code and fake streams, showing a peer event between chunks does not stop the current stream but does prevent the next mocked tool call. Consistent with my source reading; I have not run it.
- **NOT verified by anyone:** that `@mozaik-ai/core` installs or compiles here; that any provider call succeeds; that stopping obsolete actions produces any task benefit; that concurrency beats an adaptive single agent. **No code has been written and nothing has been executed by me.**
- **Not started, deliberately:** `PRD.md`, `ARCHITECTURE.md`, `PHASES.md`, `GAPS.md`, `MEMORY.md`, `DEMO.md`. §7.6 may still change the direction.
- `CODEX_IDEAS.md` has been read twice and modified never.
