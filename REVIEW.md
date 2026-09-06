# Project review

Updated September 6, 2026, 11:05 IST. This file is for you, in plain language.

## The idea

**SPECULATE helps a developer investigate a wrong checkout total.** Two AI investigators work at the same time. One starts with pricing and discounts; the other starts with tax. They run real checks and share the results. If one discovers something useful while the other is planning its next check, the second investigator can change its plan.

The developer gets the findings, the evidence behind them, and a small test they can run again after a fix.

The payoff should be: **“Here is the test this investigation produced. It fails on the broken checkout and passes on the corrected checkout. You can run it yourself.”** The visible change in an investigator's plan explains how shared evidence helped produce that result.

## My honest assessment

The idea is worth finishing. It fits the hackathon's focus and gives us a clear demonstration. It is **not yet a proven top-two entry**.

The biggest concern is simple: a judge may ask why this needs two AI investigators when one could solve the same small problem. We have built the comparison needed to answer that question, but have not run it with real models yet.

I have narrowed the project to make it stronger: changeable checkout inputs, visible evidence, a clear before-and-after action, and a test the developer can take away. Extra dashboards, voice, automatic code repair and broad integrations remain out of scope.

## What is happening now

- The local app is built and can display the investigation, evidence and results.
- Tests confirm that real checkout requests are executed and that exported tests fail on the broken checkout and pass on the corrected one.
- Two real Mozaik participants have been tested with controlled model responses. Their overlap and action changes work in those tests.
- The latest full integration check passed **35 tests**, after removing duplicated tests. It covers stopping, failures, the single investigator, and complete two-investigator runs with cited conclusions. The build and type checks also pass.
- The interface is published on Vercel, and the corrected-checkout endpoint works. The model routes still have a production startup error. The final fix passes locally and needs one more deployment; automatic approval review blocked that command because its usage limit was reached.
- Your Claude Code account can run **Opus 5**. I verified that directly and assigned it a focused runtime task. I handle deployment, the interface and final integration.

## What is not proven yet

- Real AI investigators can reliably reach a useful conclusion on this project.
- A peer result naturally changes another investigator's next action during a real run.
- Two investigators give a meaningful advantage over one.
- The final online demo works with a real model account.
- We have a real demonstration recording and a confirmed submission.

The controlled tests are useful, but they must never be shown as live AI evidence.

## Red flags, in order

| Risk | Why it matters | What we are doing |
|---|---|---|
| Two investigators look unnecessary | This could stop us placing near the top | Compare against a capable single investigator and show the useful action change |
| The example looks scripted | Judges need to trust the demonstration | Allow changed inputs, preserve actual results, label controlled tests clearly |
| Real model access is missing | We cannot finish the most important proof | Add one provider key, then run and save a real investigation |
| Online runs fail or continue after “finished” | This hurts reliability and can waste model calls | Add strict limits and tests for failures, stopping and completion |
| A lost connection loses the final report | Hosted runs do not yet have saved history | Export each successful run and prepare a genuine recorded fallback |
| We spend too long polishing | A nice interface does not replace a working demonstration | Freeze features September 6 at 19:30 IST; spend the remaining time on checks, recording and submission |
| We misunderstand the submission rules | A good project can still be ineligible or late | Confirm registration, team details, deadline and any private brief in the participant dashboard |

## Manual help needed from you

1. **Add one model API key.** Your Claude Code subscription lets Claude help us build, but it has not configured the app's separate model connection. For the online app, use [Vercel Production environment settings](https://vercel.com/wukong4/speculate-regression-room/settings/environment-variables). For the default OpenAI setup, add OPENAI_API_KEY; alternatively choose a provider and model using .env.example. Do not paste the secret into chat. Tell me only which provider/model you chose and when the settings are saved; I can then redeploy and test it. A local .env configures only the local app.
2. **For the hosted demo, set a private demo access code.** This stops people without the code from starting paid investigations. The setting is `SPECULATE_RUN_TOKEN`, at least 16 characters. It is separate from the provider key. Keep it private; someone with the code can start multiple bounded runs.
3. **Confirm the hackathon dashboard details:** registration completed, team eligible, exact deadline with timezone, and any extra instructions given to participants.
4. **Allow time for the final recording and submission.** I can prepare the script and files, but we still need a genuine recorded run and confirmation that the entry was submitted.

No new MCP or plugin is needed right now. Vercel and Claude Code are already signed in.

**Immediate deployment help:** from a terminal opened in this project, run:

```powershell
pnpm dlx vercel@59.11.7 deploy --prod --yes --scope wukong4
```

Tell me when it finishes. I will check the public app again. The automatic approval reviewer refused my latest deployment attempt because its usage limit was reached; that is separate from the missing app model key.

## Who is doing what

**Codex:** project direction, deployment, interface, evidence and exports, final review, and keeping the submission work visible.

**Claude Opus 5:** investigator behavior, stopping, failure checks, and the single-investigator control. I directly dispatched its tasks through your installed Claude Code and reviewed the changes. Its latest work requires both investigators to reach cited conclusions in successful tests. My CLI workers have finished; the separate Claude worker has a new written assignment in CLAUDE_NEXT_TASK.md to review the demonstration and hand back concrete findings.

**You:** model access, participant-dashboard information, and final recording/submission help where needed.

## Next milestones

1. Publish and check the Vercel app.
2. Connect a model and save the first real investigation.
3. Run the comparisons and keep all results, including losses.
4. Improve the weak parts shown by those results.
5. Record the demonstration, check judge access, and submit with time to spare.

## Deployment result

Public URL: https://speculate-regression-room.vercel.app

The production page is public without a Vercel login. Hosted checks successfully executed the corrected checkout: 18,900 cents for the original input and 19,695 for a changed input. The model routes currently fail on the deployed version; the latest local fix still needs deployment. Do not use this version as the final judge demo.

**This is a deployed application with model setup still missing. It is not yet a verified live-AI demo.** Vercel's Production environment currently has no model key or private demo code. No top-two result, successful video or submission is claimed.

## What I accepted from the independent Claude review

The small checkout bug makes the advantage of two investigators hard to defend. More polishing will not answer that. We need a real run and a fair single-investigator comparison. I also agree that the exported test should be the demonstration's payoff.

I have not adopted its estimated loss probabilities or its suggestion to call the records tamper-evident. Those are not established. Our files are inspectable records, not cryptographically protected proof. Historical idea files stay preserved; judges should start with README.md and the demo.

Git is initialized and source is staged. The user's account now trusts this exact shared repository, resolving the earlier ownership warning. A final source commit, public repository, video and confirmed entry still need to be completed.
