---
section: How It Works
---

## content: What apt.yml adds, and why {#how-apt-yml}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/README.md
---

### cflinuxfs4 ships a lot for free — this is only the gap

The stack already gives us `git`, `jq`, `build-essential`, `curl`, and the usual diagnostics. None of those show up in `apt.yml`. What does show up is picked for a specific coding-agent reason.

- icon:cpu **temurin-25-jdk** — A specific vendor and LTS, not whatever OpenJDK point release Ubuntu's repos happen to carry — added via Adoptium's own apt repo.
- icon:workflow **nodejs (NodeSource)** — Ubuntu's packaged Node is several majors behind — not viable for the npm/pnpm/vite workflows the agent will trigger.
- icon:git-branch **gh** — One well-known CLI for reading issues, opening PRs, and commenting — instead of hand-rolling GitHub's REST API from shell.
- icon:terminal **ripgrep** — Agents grep constantly; `rg` is an order of magnitude faster than `grep -r` on a real repo, and it adds up across many invocations.

> [!info] The pattern generalizes
> Every one of these is the same three-part declaration in `apt.yml`: a GPG key, a repo line, and a package name. Swap them and you're pulling in Corretto instead of Temurin, or any other vendor that publishes a Debian repo.

## diagram: Staging the droplet {#how-diagram-build-1}
---
diagram: agent-droplet-build
visibleNodeIds:
  - payload
  - apt-buildpack
visibleEdgeIds:
  - e-payload-apt
activeNodeIds:
  - apt-buildpack
source: https://github.com/asaikali/cf-coding-agents/blob/main/README.md
---

### Step 1 — apt-buildpack runs ahead of the release buildpack

`cf push --task` chains two buildpacks: `apt-buildpack` first, `binary_buildpack` last. Only the *last* buildpack in the chain owns the release/start contract — apt-buildpack's job ends at "everything in apt.yml is installed."

## diagram: A stopped, task-only droplet {#how-diagram-build-2}
---
diagram: agent-droplet-build
visibleNodeIds:
  - payload
  - apt-buildpack
  - droplet
  - task
visibleEdgeIds:
  - e-payload-apt
  - e-apt-droplet
  - e-droplet-task
activeNodeIds:
  - droplet
  - task
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/manifest.yaml
---

### Step 2 — staged once, run any number of times

The manifest declares zero `web` instances and a `task` process. `cf push --task` leaves the droplet staged and stopped; every `cf run-task` afterward is a fresh, isolated invocation against the same droplet.

## content: Credentials without touching the manifest {#how-credentials}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/README.md#how-credentials-reach-the-agent
---

### Two user-provided services, never a manifest secret

Every scenario needs an Anthropic API key and a GitHub token. Neither is baked into the droplet or lives in a tracked file — each is handed to CF once, outside of any push, as its own user-provided service.

- icon:key **anthropic-creds** — `cf create-user-provided-service anthropic-creds -p '{"api_key":"..."}'` — bound in the manifest, never on a push command line.
- icon:key **github-creds** — Same shape, `token` field — used by both `gh` and, once wired, plain `git` over HTTPS.
- icon:sparkles **Rotate without a re-push** — `cf update-user-provided-service <name> -p <json>` — the very next task invocation reads the fresh value.

> [!info] Two services, not one
> Separate UPS per credential so each can rotate and be shared with other apps independently, rather than one combined secret blob.

## diagram: One blob in, VCAP_SERVICES {#how-diagram-creds-1}
---
diagram: agent-credential-flow
visibleNodeIds:
  - ups
  - vcap
visibleEdgeIds:
  - e-ups-vcap
activeNodeIds:
  - vcap
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/agent/.profile.d/vcap.sh
---

### Step 1 — CF hands the container one JSON blob

CF injects a single env var, `VCAP_SERVICES`, whose value is JSON describing every bound service and its credentials — not the flat `ANTHROPIC_API_KEY` / `GH_TOKEN` the tools actually expect.

## diagram: Bridged by .profile.d/vcap.sh {#how-diagram-creds-2}
---
diagram: agent-credential-flow
visibleNodeIds:
  - ups
  - vcap
  - profile
  - tools
visibleEdgeIds:
  - e-ups-vcap
  - e-vcap-profile
  - e-profile-tools
activeNodeIds:
  - profile
  - tools
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/agent/.profile.d/vcap.sh
---

### Step 2 — parsed and re-exported before every task

Any `*.sh` in `.profile.d/` is sourced by CF's launcher before any start command — including every ad-hoc `cf run-task`. `vcap.sh` pulls both secrets out with `jq`, exports them flat, and wires `gh` as git's HTTPS credential helper so a plain `git push` uses the same token.

## content: The trick: same binary, different model {#how-swap-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### ANTHROPIC_BASE_URL is just an environment variable

The Claude Code CLI reads `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, and `ANTHROPIC_API_KEY` from its environment on every invocation. Nothing about the droplet, the skill file, or the prompt has to change to point it somewhere else — only what `cf run-task --command` sets before `./bin/claude` runs.

- icon:globe **ANTHROPIC_BASE_URL** — Swap `api.anthropic.com` for a Tanzu AI Services endpoint that speaks the identical Messages API wire format.
- icon:bot **ANTHROPIC_MODEL** — Name the on-platform model — `qwen3.6-27b` — instead of a Claude model id.
- icon:key **ANTHROPIC_API_KEY** — A service-key pulled from the platform, not an Anthropic org key.

> [!success] This is the same feature from the AI Services demo
> The Anthropic-wireformat plan is exactly the "Anthropic Messages API" gateway feature covered in the Tanzu AI Services demo — `anthropic-qwen3.6` is just one more plan on the same `ai-models` marketplace offering, reachable through the same one gateway.

## diagram: The default path {#how-diagram-swap-1}
---
diagram: agent-model-swap
visibleNodeIds:
  - binary
  - anthropic
visibleEdgeIds:
  - e-binary-anthropic
activeNodeIds:
  - binary
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/run.sh
---

### Step 1 — unmodified, the binary talks to real Anthropic

With no overrides, `./bin/claude` behaves exactly like it would on a laptop: it calls `api.anthropic.com` using whatever `ANTHROPIC_API_KEY` is present.

## diagram: The swap {#how-diagram-swap-2}
---
diagram: agent-model-swap
visibleNodeIds:
  - binary
  - anthropic
  - ai-services
  - qwen
visibleEdgeIds:
  - e-binary-anthropic
  - e-binary-aiservices
  - e-aiservices-qwen
activeNodeIds:
  - ai-services
  - qwen
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### Step 2 — three env vars later, it talks to on-platform Qwen

Override `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, and `ANTHROPIC_API_KEY` at `cf run-task` time with values pulled from the `anthropic-qwen-model` service key, and the identical binary, skill, and prompt now drive Qwen 3.6 27B running on-platform — no rebuild, no redeploy, no code change.
