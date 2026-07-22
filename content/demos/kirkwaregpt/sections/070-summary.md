---
section: Summary
---

## content: Recap {#wrap-recap}

### What KirkwareGPT actually demonstrates

Four platform features, composed — not four things built from scratch.

- icon:bot **Agent Buildpack** — A hosted chat UI, debug panel, and MCP discovery — all from `AGENTS.md` and a `cf push`. No custom Dockerfile, no frontend code.
- icon:network **MCP Gateway** — One dashboard, OAuth federation, and audit logs in front of an unmodified GitHub MCP server binary — registered with a single `cf bind-service` call.
- icon:database **Postgres-backed RAG** — A real database instance, bound like any other marketplace service — the ingestion pipeline is the next build, not this one.
- icon:shield-check **Policy governance** — Rate limits, quotas, and a credit-card-filtering webhook — all attached to the plan in Operations Manager, never touching the agent's own code.

> [!info] One open thread: UI customization
> The Agent section assessed four ways to get Kirkware's branding onto the chat UI — a reverse-proxy wrapper, a fully custom frontend, a sidecar process, or requesting theming hooks from the platform team — and deliberately implemented none of them. That decision is still open.

## diagram: The full picture {#wrap-diagram}
---
diagram: kirkwaregpt-architecture
visibleNodeIds:
  - users
  - app
  - mcp-gateway
  - github-mcp
  - ai-gateway
  - model
  - postgres
  - webhook
visibleEdgeIds:
  - e-users-app
  - e-app-mcpgw
  - e-mcpgw-github
  - e-app-aigw
  - e-aigw-model
  - e-app-postgres
  - e-aigw-webhook
---

### Every piece, together

Same diagram as the Introduction — now every box has a section behind it.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

What would you point KirkwareGPT at first?
