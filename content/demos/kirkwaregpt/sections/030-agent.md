---
section: Agent
---

## content: The Agent Buildpack {#agent-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### A buildpack that hosts the agent, not just the code

Most buildpacks turn source into a runnable process. This one also supplies the process: a chat UI, model binding, and MCP tool discovery all come from the buildpack itself. The only thing the application provides is `AGENTS.md`.

## command: Prepare the agent {#agent-prepare}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### AGENTS.md is the entire application

The system prompt is the whole app. An optional `manifest.yaml` makes the buildpack explicit rather than auto-detected.

```bash label=mkdir.sh live=kirkwaregpt-mkdir.sh
mkdir -p "$TEMP_WORKSPACE/kirkwaregpt"
```

```bash label=create-agents-md.sh live=kirkwaregpt-create-agents-md.sh
cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > AGENTS.md <<'EOF'
You are KirkwareGPT, an internal engineering assistant for Kirkware.
Answer questions concisely and accurately, grounded in Kirkware's own
runbooks and documentation whenever they're available to you.
When you have access to tools, use them to provide better answers.
EOF
```

```bash label=create-manifest.sh live=kirkwaregpt-create-manifest.sh
cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > manifest.yaml <<'EOF'
applications:
- name: kirkwaregpt
  buildpacks:
  - agent_buildpack
  routes:
  - route: kirkwaregpt-agent.apps.tanzu.kirkware.net
EOF
```

## command: Push — degraded mode {#agent-push}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### A running app, before any model is bound

The agent launches immediately, but "degraded" — reachable, but showing a setup banner instead of a chat box until a model is bound.

```bash label=push.sh live=kirkwaregpt-push.sh
cd "$TEMP_WORKSPACE/kirkwaregpt" && cf push kirkwaregpt
```

```bash label=app.sh live=kirkwaregpt-app.sh
cf app kirkwaregpt
```

> [!impact]
> Open the URL from `cf app kirkwaregpt` in a browser now — the setup banner is exactly what a teammate would see if they hit this link one step too early.

## diagram: Staging the agent {#agent-diagram-1}
---
diagram: kirkwaregpt-agent-lifecycle
visibleNodeIds:
  - files
  - buildpack
  - degraded
visibleEdgeIds:
  - e-files-buildpack
  - e-buildpack-degraded
activeNodeIds:
  - degraded
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### Step 1 — cf push stages a degraded droplet

The buildpack stages the droplet from `AGENTS.md` and `manifest.yaml` alone. It starts immediately — just without a model bound yet.

## command: Bind the model {#agent-bind-model}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### kirkware-all-models, bound to the agent

Binding the plan gives the chat UI every model it exposes to choose from — including claude-sonnet-4-6.

```bash label=marketplace.sh live=marketplace.sh
cf marketplace -e ai-models
```

```bash label=ensure-model-service.sh live=cf-ensure-kirkwaregpt-model.sh
cf service kirkwaregpt-model || cf create-service ai-models kirkware-all-models kirkwaregpt-model --wait
```

```bash label=bind-model.sh live=kirkwaregpt-bind-model.sh
cf bind-service kirkwaregpt kirkwaregpt-model --wait
```

```bash label=restage.sh live=kirkwaregpt-restage.sh
cf restage kirkwaregpt
```

> [!impact]
> The chat UI activates the moment restage completes — no second deploy, no image rebuild.

## diagram: Binding the model {#agent-diagram-2}
---
diagram: kirkwaregpt-agent-lifecycle
visibleNodeIds:
  - files
  - buildpack
  - degraded
  - model-svc
visibleEdgeIds:
  - e-files-buildpack
  - e-buildpack-degraded
  - e-degraded-model
activeNodeIds:
  - model-svc
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### Step 2 — a service binding, not a redeploy

`kirkware-all-models` is a plan like any other CF marketplace service. Binding it hands the agent a service key; nothing about the droplet changes.

## command: Bind Postgres for RAG {#agent-bind-postgres}

### A real database instance — not a RAG pipeline yet

Binding gets KirkwareGPT a reachable Postgres instance and credentials. It does not, by itself, ingest or embed anything — that's a follow-on step (an ingestion job plus a tool the agent calls), deliberately out of scope for this demo.

```bash label=bind-postgres.sh live=kirkwaregpt-bind-postgres.sh
cf bind-service kirkwaregpt kirkwaregpt-db --wait
```

```bash label=restage.sh live=kirkwaregpt-restage.sh
cf restage kirkwaregpt
```

> [!impact]
> `kirkwaregpt-db` was already provisioned back in Lab Preparation — this bind is instant, no multi-minute wait mid-demo.

## diagram: Binding Postgres {#agent-diagram-3}
---
diagram: kirkwaregpt-agent-lifecycle
visibleNodeIds:
  - files
  - buildpack
  - degraded
  - model-svc
  - postgres
visibleEdgeIds:
  - e-files-buildpack
  - e-buildpack-degraded
  - e-degraded-model
  - e-degraded-postgres
activeNodeIds:
  - postgres
---

### Step 3 — a RAG-ready store, bound the same way

Same shape as the model binding: a marketplace service, bound, restaged. What KirkwareGPT does with it — embeddings, similarity search — is application logic on top, not something the binding provides.

## content: The chat UI {#agent-chat-ui}

### What you get without writing a frontend

Open the agent's URL again — the setup banner is gone, replaced by a working chat interface.

- icon:message **Conversation area** — A standard chat pane — send a message, get a streamed response.
- icon:activity **Debug panel** — Shows the active model, the live `AGENTS.md` system prompt, every bound MCP server, and the tools each one exposes.

## content: One more thing: branding {#agent-ui-customization}

### The buildpack's chat UI has no theming hooks — so this demo builds around it

As of this writing, there's no CSS override, no logo slot, no layout config in the agent buildpack itself. That's a real, current limitation, not a configuration gap. The dedicated **UI Customization** section later in this demo covers exactly how KirkwareGPT gets Kirkware's branding anyway — a small Node.js app deployed alongside the agent, without touching the agent itself.
