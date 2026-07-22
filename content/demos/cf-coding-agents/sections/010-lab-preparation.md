---
section: Lab Preparation
---

## command: Pre-checks: spaces & login {#labprep-spaces}

### Two spaces, one org — coding-agents and petclinic

The agent task app and its target app live in separate spaces so a runaway agent can never touch the space its own target app is deployed into. Every script below is independent and safe to re-run.

```bash label=login.sh live=cf-login.sh
cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null
```

```bash label=set-space-coding-agents.sh live=set-cf-space-coding-agents.sh
export CF_SPACE=coding-agents
echo $CF_SPACE
```

```bash label=ensure-coding-agents-space.sh live=cf-ensure-space.sh
cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"
```

```bash label=set-space-petclinic.sh live=set-cf-space-petclinic.sh
export CF_SPACE=petclinic
echo $CF_SPACE
```

```bash label=ensure-petclinic-space.sh live=cf-ensure-space.sh
cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"
```

```bash label=set-space-coding-agents.sh live=set-cf-space-coding-agents.sh
export CF_SPACE=coding-agents
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

> [!impact]
> Everything from here through "Deploy the Agent" runs targeted at coding-agents. We switch to petclinic only once, right before pushing the target app.

## command: Pre-checks: Qwen model service {#labprep-qwen-service}

### Provision the on-platform model the agent will swap onto

This is the AI Services side of the demo, done once up front: confirm the Anthropic-wireformat Qwen plan is on the marketplace, provision an instance, and pull a service key — before the agent ever runs.

```bash label=marketplace.sh live=marketplace.sh
cf marketplace -e ai-models
```

```bash label=ensure-qwen-service.sh live=cf-ensure-qwen-service.sh
cf service anthropic-qwen-model || cf create-service ai-models anthropic-qwen3.6 anthropic-qwen-model --wait
```

```bash label=ensure-qwen-service-key.sh live=cf-ensure-qwen-service-key.sh
cf service-key anthropic-qwen-model anthropic-qwen-model-key >/dev/null 2>&1 || cf create-service-key anthropic-qwen-model anthropic-qwen-model-key
```

```bash label=show-qwen-service-key.sh live=cf-show-qwen-service-key.sh
cf service-key anthropic-qwen-model anthropic-qwen-model-key
```

> [!impact]
> `anthropic-qwen3.6` is a plan on the same `ai-models` marketplace offering as every other Tanzu AI Services plan — the service key it hands back is shaped like an Anthropic Messages API endpoint, not an OpenAI one. That shape is exactly what the agent swap in this demo depends on.

## command: Cleanup {#labprep-cleanup}

### Tear down both apps and every service

```bash label=set-space-coding-agents.sh live=set-cf-space-coding-agents.sh
export CF_SPACE=coding-agents
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=delete-agent-app.sh
cf delete agent-cli -f
```

```bash label=delete-anthropic-creds.sh
cf delete-service anthropic-creds -f
```

```bash label=delete-github-creds.sh
cf delete-service github-creds -f
```

```bash label=delete-qwen-service-key.sh
cf delete-service-key anthropic-qwen-model anthropic-qwen-model-key -f --wait
```

```bash label=delete-qwen-service.sh
cf delete-service anthropic-qwen-model -f --wait
```

```bash label=set-space-petclinic.sh live=set-cf-space-petclinic.sh
export CF_SPACE=petclinic
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=delete-petclinic-app.sh
cf delete spring-petclinic -r -f
```
