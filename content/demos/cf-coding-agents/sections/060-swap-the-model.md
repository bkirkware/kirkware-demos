---
section: Swap the Model
---

## content: Two ways to run the exact same skill {#swap-intro}

### Same repo, same issue, same skill file — only the model changes

Both options below invoke the identical `github-issue-workflow` skill against the identical issue on the identical fork. The only difference is which environment variables `cf run-task` sets before `./bin/claude` starts.

> [!info] Ignoring one path on purpose
> The source script this is based on also supports a `--direct` mode that bypasses the platform entirely and hits a raw model endpoint. This demo skips it — the point here is what the AI Services tile buys you, not what happens without it.

## command: Back to coding-agents {#swap-target-space}

### The agent task app lives in its own space

```bash label=set-space-coding-agents.sh live=set-cf-space-coding-agents.sh
export CF_SPACE=coding-agents
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

## command: Option 1 — run with Claude {#swap-option-1-claude}
---
source: https://github.com/asaikali/cf-coding-agents/blob/main/01-claude-cli/run.sh
---

### The unmodified path: real Anthropic models

No environment overrides at all — the credentials `.profile.d/vcap.sh` already exported from `anthropic-creds` are exactly what the CLI needs.

```bash label=set-vars.sh
REPO=bkirkware/spring-petclinic
ISSUE="1"
```

```bash label=run-agent-claude.sh
cf run-task agent-cli \
  --name "issue-${ISSUE}" \
  --process task \
  --command "./bin/claude -p 'Use the github-issue-workflow skill to work on issue ${ISSUE} in repo ${REPO}.' --dangerously-skip-permissions"
```

```bash label=view-logs.sh
cf logs agent-cli --recent | grep issue-${ISSUE}
```

## command: Option 2 — run with Qwen {#swap-option-2-qwen}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### The swap: pull a service key, override three env vars

Everything else about the command is identical to Option 1. `MODEL_BASE_URL` and `MODEL_API_KEY` come straight from the AI Services service key created in Lab Preparation — this is the whole trick.

```bash label=get-model-endpoint.sh
MODEL_BASE_URL=$(cf service-key anthropic-qwen-model anthropic-qwen-model-key | tail -n +3 | jq -r '.credentials.endpoint.anthropic_api_base')
```

```bash label=get-model-key.sh
MODEL_API_KEY=$(cf service-key anthropic-qwen-model anthropic-qwen-model-key | tail -n +3 | jq -r '.credentials.endpoint.api_key')
```

```bash label=set-model.sh
MODEL=qwen3.6-27b
```

```bash label=run-agent-qwen.sh
cf run-task agent-cli \
  --name "issue-${ISSUE}" \
  --process task \
  --command "API_FORCE_IDLE_TIMEOUT=0 API_TIMEOUT_MS=3600000 ANTHROPIC_BASE_URL='${MODEL_BASE_URL}' ANTHROPIC_MODEL='${MODEL}' ANTHROPIC_API_KEY='${MODEL_API_KEY}' CLAUDE_CODE_ATTRIBUTION_HEADER='0' CLAUDE_CODE_ENABLE_TELEMETRY='0' ./bin/claude -p 'Use the github-issue-workflow skill to work on issue ${ISSUE} in repo ${REPO}.' --dangerously-skip-permissions --bare --exclude-dynamic-system-prompt-sections"
```

```bash label=view-logs.sh
cf logs agent-cli --recent | grep issue-${ISSUE}
```

> [!impact]
> Same fork, same issue, same skill, same `--dangerously-skip-permissions` flag — the diff between this command and Option 1's is three environment variables and two CLI flags (`--bare --exclude-dynamic-system-prompt-sections`, which trim Claude-specific system-prompt sections that don't apply to a different model). Everything upstream of the model call — cloning, reading the issue, implementing, testing, opening the PR — is identical.

## question: What would you swap next? {#swap-question}

Any tool that reads ANTHROPIC_BASE_URL — not just Claude Code — gets this same swap for free the moment it's pointed at an Anthropic-wireformat AI Services plan. Where else in your stack could that apply?

- Anthropic SDK-based internal tools (support bots, review assistants) swap the same way — just a base URL, no code change
- Cost and data-residency conversations get a lot easier once "which model" is a runtime env var instead of a vendor lock-in
- The reverse is also true: a Qwen-first workflow can fail over to real Anthropic the same way, by swapping the same three variables back

## command: Land the agent's PR {#swap-land-pr}

### Deploy exactly what the agent shipped

Whichever option produced the PR, the target app deploy is the same: switch to the agent's branch, rebuild, push.

```bash label=set-space-petclinic.sh live=set-cf-space-petclinic.sh
export CF_SPACE=petclinic
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=switch-branch.sh
cd ~/work/git/kirkware/kirkware-lab/dev/spring-petclinic
git switch agent/issue-${ISSUE}
```

```bash label=package.sh
mvn clean package
```

```bash label=push.sh
cf push
```
