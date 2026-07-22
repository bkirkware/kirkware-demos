---
section: Wrap-up
---

## content: Recap {#wrap-recap}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/README.md
---

### What actually made the swap possible

None of this required a fork of Claude Code, a custom SDK integration, or a second agent binary. It required a platform that speaks the wire format the tool already expects.

- icon:play **cf task, not cf push** — A coding agent wakes up, works, and exits — the same shape as `cf run-task`, staged once and invoked any number of times.
- icon:key **Credentials via UPS** — Two user-provided services, bridged to flat env vars by `.profile.d/vcap.sh` — never a manifest secret, never a push argument.
- icon:globe **The model is an env var** — `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, `ANTHROPIC_API_KEY` — three values, pulled from a real AI Services service key, are the entire swap.
- icon:workflow **One gateway, every wire format** — The `anthropic-qwen3.6` plan is the same Tanzu AI Services gateway from the other demo, just answering in the Messages API shape instead of OpenAI's.

> [!info] What this scenario deliberately leaves out
> This is scenario 1 of five in the source repo — the CLI-binary shape. Scenarios 2-4 swap in SDK-driven agents (Python, then TypeScript) on the same CF patterns; scenario 5 inverts the shape entirely into an always-on Managed Agents worker. The patterns established here — apt-buildpack, .profile.d/, UPS credentials — carry forward unchanged.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

What coding-agent workflow would you point at an on-platform model first?
