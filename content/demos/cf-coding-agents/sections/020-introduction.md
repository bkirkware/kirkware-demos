---
section: Introduction
---

## title: Welcome {#intro-title}
---
eyebrow: cf-coding-agents · Scenario 1 — the Claude Code CLI binary
---

### CF Coding Agents

Run Claude Code as a one-shot `cf task` instead of a long-lived web app — then swap the model it talks to for a locally-hosted Qwen, through Tanzu AI Services, without touching a single line of the agent.

- cf task, not cf push
- Same binary, either model
- Zero code changes
- Credentials via UPS

## content: Why tasks, not servers {#intro-why-tasks}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/README.md
---

### A coding agent isn't a server

It wakes up, works against a prompt, and exits. `cf task` matches that shape exactly: stage the droplet once, then fire any number of ad-hoc invocations against it with their own command, memory, and disk.

- icon:server **No route, no idle instance** — The manifest declares zero web instances — nothing sits around burning resources between runs.
- icon:play **Stage once, run many** — `cf push --task` stages the droplet and leaves it stopped. Each `cf run-task` is a fresh, isolated invocation.
- icon:layers **Own command, memory, disk** — Every task invocation can override the process command and resource limits independently of the staged defaults.
- icon:terminal **Fresh shell every time** — No cross-task state leakage — `.profile.d/` scripts re-run on every single invocation.

> [!info] The three moving parts
> 1) Download the agent binary so the droplet ships an exact, known version. 2) Layer on the tools the agent needs via `apt-buildpack`. 3) Push as a task-only app — no route, no running process, work happens on demand.

## discussion: Where would a one-shot agent fit? {#intro-discussion}

Think about the agent workflows your team already runs by hand — triage, small fixes, dependency bumps. Which of those is actually a task, not a service?

- Anything that starts from a prompt, does work, and exits cleanly is a `cf task` candidate — no idle web dyno required
- The CLI-binary shape (this scenario) generalizes to any pre-built agent binary; scenario 2+ in the source repo swap in SDK-driven agents on the exact same CF patterns
- The model behind the agent is a runtime choice, not a build-time one — that is the whole story of this demo
