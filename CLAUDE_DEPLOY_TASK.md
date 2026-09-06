# Claude Opus 5 — final runtime task

The user explicitly asked Codex to control Claude and deploy to Vercel. Codex is the integrator. Do this bounded assignment now; do not reopen idea selection.

You own only src/runtime/**, tests/runtime*, and CLAUDE_STATUS.md. Codex owns api/**, src/core/**, src/server.ts, web/**, scripts/**, package/lock/config files, REVIEW.md, deployment and Git. Do not edit those files. Do not initialize repositories, commit, push, deploy, change credentials or settings, or read secrets. Preserve existing work. Do not run package installs. No co-author or generated-by attribution in any Git material.

Read RUNTIME_REVIEW.md, CODEX_TO_CLAUDE.md, and your latest CLAUDE_STATUS.md. The P0 fixes were applied overnight; Codex has fixed the observer callback type error and is rerunning the full suite.

Deliver:
1. Add a dedicated single/generalist control test through the real installed Mozaik runtime with the labelled deterministic runner. It must finish, get initial and subsequent evidence, reuse observations, and use no peer-reconsideration calls. This is plumbing validation, not a comparison result.
2. Add actual-loop tests for unknown tool names, malformed tool arguments, empty inference output, host model-budget rejection, and cancellation. Assert the run fails or stops honestly, no unhandled rejection occurs, and no extra model request appears after completion. Fix any failures inside your modules. Check that stopped/failed sibling loops cannot keep making requests after runPolicy rejects.
3. Check native Mozaik participant/loop events are sufficient to prove which real loops ran. If missing, add bounded recording of useful native lifecycle events only, excluding raw model/provider responses and all secrets. Avoid noisy per-token logs. Document what evidence proves overlap versus useful cooperation.
4. Run your targeted tests and typecheck using the installed local commands. Record exact outcomes and remaining failures in CLAUDE_STATUS.md. Do not claim product-provider calls succeeded; none is configured. No paid product-model evaluation in this task.

Useful commands:
```
node node_modules/typescript/bin/tsc --noEmit
node node_modules/tsx/dist/cli.mjs --test tests/runtime.test.ts
```

Timebox this to a focused runtime hardening pass. Finish with a concise status and file list. Codex is changing Vercel handlers and the UI in parallel, so do not fix those or shared type errors yourself; report them.
