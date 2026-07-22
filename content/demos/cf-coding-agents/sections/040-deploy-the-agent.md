---
section: Deploy the Agent
---

## content: From clone to staged droplet {#deploy-agent-intro}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/README.md
---

### Every command below runs from 01-claude-cli/

This is the first of the three moving parts from the source repo's README: download the exact binary, layer on the tools via `apt.yml`, then push as a task-only app. Nothing here is agent-specific yet — it's the same droplet whichever model answers later.

## command: Download the binary {#deploy-agent-download}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/download.sh
---

### Ship an exact, known Claude Code version

`download.sh` resolves the latest Linux x64 build and writes it to `./agent/bin/claude` — the exact binary that ends up in the droplet, not whatever happens to be on the presenter's laptop.

```bash label=download.sh
./download.sh
```

## command: Create the credential services {#deploy-agent-creds}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/create-services.sh
---

### Two UPS, bound in the manifest — never on a push command line

```bash label=get-github-token.sh
export GITHUB_TOKEN=$(gh auth token)
```

```bash label=create-anthropic-creds.sh
cf create-user-provided-service anthropic-creds -p "{\"api_key\":\"$ANTHROPIC_API_KEY\"}"
```

```bash label=create-github-creds.sh
cf create-user-provided-service github-creds -p "{\"token\":\"$GITHUB_TOKEN\"}"
```

## command: Push as a task-only app {#deploy-agent-push}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/manifest.yaml
---

### Stage the droplet, leave it stopped

The manifest chains `apt-buildpack` ahead of `binary_buildpack`, declares zero `web` instances, and binds both services. `--task` stages without starting anything.

```bash label=push.sh
cf push agent-cli --task
```

## command: Verify the toolchain {#deploy-agent-verify}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/agent/versions.sh
---

### Prove every installed tool actually works before trusting the agent to it

`versions.sh` prints every tool's version — including a real `git clone` over HTTPS to prove the credential-helper wiring from `.profile.d/vcap.sh` actually works — and reports gaps as "NOT FOUND" rather than halting, so one missing tool doesn't hide the rest.

```bash label=run-versions.sh
cf run-task agent-cli --name versions --command './versions.sh'
```

```bash label=check-tasks.sh
cf tasks agent-cli
```

```bash label=view-logs.sh
cf logs agent-cli --recent
```

> [!impact]
> This is the moment that catches a bad Adoptium key, a missing `.profile.d/java.sh` truststore fix, or a `gh` credential helper that never got wired — before an actual agent run wastes time discovering it mid-issue.
