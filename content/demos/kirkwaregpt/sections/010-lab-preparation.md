---
section: Lab Preparation
---

## command: Pre-checks: login & target {#labprep-login-target}

### One org, one space — kirkware / kirkware-gpt

Everything in this demo — the agent, the MCP gateway, and the GitHub MCP server — deploys into the same space. Every script below is independent and safe to re-run.

```bash label=login.sh live=cf-login.sh
cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null
```

```bash label=set-space-kirkwaregpt.sh live=set-cf-space-kirkwaregpt.sh
export CF_SPACE=kirkware-gpt
echo $CF_SPACE
```

```bash label=ensure-kirkwaregpt-space.sh live=cf-ensure-space.sh
cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

## command: Pre-checks: marketplace offerings {#labprep-marketplace-checks}

### Confirm every offering this demo needs is actually on the marketplace

Three offerings, three purposes: `ai-models` for the model behind the agent, `mcp-gateway` for the MCP dashboard, and a Postgres offering for the RAG store. Plan names vary by foundation — note whatever `postgres`'s actual plan is called here before the Agent section.

```bash label=marketplace-ai-models.sh live=marketplace.sh
cf marketplace -e ai-models
```

```bash label=marketplace-mcp-gateway.sh live=marketplace-mcp-gateway.sh
cf marketplace -e mcp-gateway
```

```bash label=marketplace-postgres.sh live=marketplace-postgres.sh
cf marketplace -e postgres
```

## command: Pre-checks: provision Postgres {#labprep-provision-postgres}

### Start the RAG database now — it can take a few minutes to provision

Provisioning ahead of time means the Agent section's Postgres bind is instant instead of a multi-minute wait mid-demo.

```bash label=ensure-postgres.sh live=kirkwaregpt-ensure-postgres.sh
cf service kirkwaregpt-db || cf create-service postgres "$POSTGRES_PLAN" kirkwaregpt-db --wait
```

## command: Pre-checks: confirm a clean space {#labprep-clean-check}

### Nothing left over from a previous run

A quick sanity check before building anything — this space should have no apps and no service instances yet.

```bash label=apps.sh live=cf-apps.sh
cf apps
```

```bash label=services.sh live=cf-services.sh
cf services
```

> [!impact]
> If either command lists something, the Cleanup step below removes it — run that first, then come back here.

## command: Cleanup {#labprep-cleanup}

### Tear down the agent, the gateway, the MCP server, and every service

```bash label=set-space-kirkwaregpt.sh live=set-cf-space-kirkwaregpt.sh
export CF_SPACE=kirkware-gpt
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=delete-agent.sh live=kirkwaregpt-delete-agent.sh
cf delete kirkwaregpt -f
```

```bash label=delete-github-mcp.sh live=kirkwaregpt-delete-github-mcp.sh
cf delete github-mcp -f
```

```bash label=unbind-and-delete-model.sh live=kirkwaregpt-delete-model.sh
cf delete-service kirkwaregpt-model -f --wait
```

```bash label=delete-pci-model.sh live=kirkwaregpt-delete-pci-model.sh
cf delete-service kirkwaregpt-pci-model -f --wait
```

```bash label=delete-presidio.sh live=presidio-delete.sh
cf delete presidio-content-filter -f
```

```bash label=unbind-and-delete-postgres.sh live=kirkwaregpt-delete-postgres.sh
cf delete-service kirkwaregpt-db -f --wait
```

```bash label=delete-mcp-gateway.sh live=kirkwaregpt-delete-mcp-gateway.sh
cf delete-service kirkwaregpt-mcp-gateway -f --wait
```

```bash label=delete-oauth-ups.sh live=kirkwaregpt-delete-oauth-ups.sh
cf delete-service github-mcp-oauth -f
```

```bash label=delete-mcp-server-ups.sh live=kirkwaregpt-delete-mcp-server-ups.sh
cf delete-service github-mcp -f
```

```bash label=clean-workspace.sh live=kirkwaregpt-clean-workspace.sh
rm -rf "$TEMP_WORKSPACE/kirkwaregpt"
```

```bash label=delete-ui-wrapper.sh live=kirkwaregpt-ui-wrapper-delete.sh
cf delete kirkwaregpt-ui-wrapper -f
```

```bash label=clean-ui-wrapper-workspace.sh live=kirkwaregpt-ui-wrapper-clean-workspace.sh
rm -rf "$TEMP_WORKSPACE/tanzuagent-ui-wrapper"
```
