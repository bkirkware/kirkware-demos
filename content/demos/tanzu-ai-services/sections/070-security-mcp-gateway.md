---
section: Security & MCP Gateway
---

## content: MCP Gateway {#sec-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### One front door for Model Context Protocol traffic

Introduced in v10.4.0, MCP Gateway is a separate marketplace service (`mcp-gateway`, plan `gateway`) that proxies Model Context Protocol traffic to on-platform or off-platform MCP servers — with per-server auth federation, audit events, and Prometheus metrics.

- icon:shield **none** — Default. Unauthenticated proxy — appropriate for trusted internal tools.
- icon:key **forward_token** — The gateway forwards the caller's own access token upstream. Used for endpoints like GitHub Copilot's MCP server.
- icon:lock **oauth_passthrough** — The gateway rewrites the upstream OAuth Protected-Resource-Metadata to point at itself. Used for endpoints like Figma's MCP server.

## diagram: Single entry point {#sec-diagram-1}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
visibleEdgeIds:
  - e-agent-gw
activeNodeIds:
  - mcp-gateway
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Step 1 — every MCP call passes through one gateway

Whether the caller is an AI Agent, an IDE, or a custom chat client, MCP traffic enters through one MCP Gateway service instance.

## diagram: auth: none {#sec-diagram-2}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
  - onplat
visibleEdgeIds:
  - e-agent-gw
  - e-gw-onplat
activeNodeIds:
  - onplat
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Step 2 — on-platform tools, no auth required

The default auth mode: for internal, trusted MCP servers, the gateway simply proxies through.

## diagram: forward_token {#sec-diagram-3}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
  - onplat
  - copilot
visibleEdgeIds:
  - e-agent-gw
  - e-gw-onplat
  - e-gw-copilot
activeNodeIds:
  - copilot
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Step 3 — GitHub Copilot: forward the caller’s token

Some upstream MCP servers need the caller's own identity, not the gateway's. `forward_token` mode passes the caller's access token straight through — this is how GitHub Copilot's MCP endpoint is wired up.

## diagram: oauth_passthrough {#sec-diagram-4}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
  - onplat
  - copilot
  - figma
visibleEdgeIds:
  - e-agent-gw
  - e-gw-onplat
  - e-gw-copilot
  - e-gw-figma
activeNodeIds:
  - figma
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Step 4 — Figma: the gateway impersonates the OAuth resource

Other upstreams (like Figma) expect to run their own OAuth dance against the caller. `oauth_passthrough` has the gateway rewrite the upstream's OAuth Protected-Resource-Metadata to point back at itself, so the flow still works transparently.

## diagram: Enterprise OIDC/OAuth {#sec-diagram-5}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
  - onplat
  - copilot
  - figma
  - ghe
  - sso
visibleEdgeIds:
  - e-agent-gw
  - e-gw-onplat
  - e-gw-copilot
  - e-gw-figma
  - e-gw-ghe
  - e-ghe-sso
activeNodeIds:
  - ghe
  - sso
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-mcp-authentication.html
---

### Step 5 — GitHub Enterprise via Tanzu SSO

For a self-hosted GitHub Enterprise MCP server, the gateway federates against your own identity provider via a Tanzu SSO (`p-identity`) binding — full OIDC/OAuth with token introspection, not just passthrough.

## diagram: Audit & metrics {#sec-diagram-6}
---
diagram: mcp-gateway-security
visibleNodeIds:
  - agent
  - mcp-gateway
  - onplat
  - copilot
  - figma
  - ghe
  - sso
  - hub
visibleEdgeIds:
  - e-agent-gw
  - e-gw-onplat
  - e-gw-copilot
  - e-gw-figma
  - e-gw-ghe
  - e-ghe-sso
  - e-gw-hub
activeNodeIds:
  - hub
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-mcp-audit-log-schema.html
---

### Step 6 — everything is logged and metered centrally

Regardless of auth mode, every MCP call emits structured audit events and Prometheus metrics, surfaced in Tanzu Hub's "MCP Gateway Usage" dashboard. Navigate to Hub's [Service Offerings]($HUB_URL/hub/marketplace/service-offerings), select MCP Gateway, choose the Usage tab.

## command: Provisioning the gateway {#sec-cmd-create}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Registering off-platform MCP servers per auth mode

The three auth modes map directly onto the `mcp-servers` array you pass at `cf create-service` time.

```bash label=no-auth.sh
cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [
    {"name": "partner-api", "url": "https://partner.example.com/mcp",
     "metadata": {"description": "Connect to the partner API via MCP"}},
    {"name": "analytics-api", "url": "https://analytics.example.com/mcp"}
  ]
}' --wait
```

```bash label=forward-token.sh
cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [{"name": "copilot", "url": "https://api.githubcopilot.com/mcp",
                    "auth": {"mode": "forward_token"}}]
}' --wait
```

```bash label=oauth-passthrough.sh
cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [{"name": "figma", "url": "https://mcp.figma.com/mcp",
                    "auth": {"mode": "oauth_passthrough"}}]
}' --wait
```

```output
Creating service instance my-gateway in org demo / space demo as admin...
Create in progress. Use 'cf services' or 'cf service my-gateway' to check operation status.

OK

my-gateway now proxies https://mcp.figma.com/mcp with OAuth PRM rewritten to itself.
```

> [!impact]
> Notice these are declarative — `cf update-service` must resend the full desired `mcp-servers` state, not a delta. Run `cf service my-gateway --params` first to see current config before editing.

## command: Full GitHub Enterprise walkthrough {#sec-cmd-ghe}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Pushing a real MCP server behind enterprise OAuth

The deepest security example in the docs: push the actual open-source GitHub MCP server, put it behind the gateway, and bind it with GitHub Enterprise OIDC credentials via a user-provided service.

```bash label=push-server.sh
git clone git@github.com:github/github-mcp-server.git
cd github-mcp-server && git checkout v0.33.0

cf create-org mcp-servers && cf target -o mcp-servers
cf create-space github && cf target -s github
cf push -f github-mcp.manifest.yml
```

```bash label=wire-auth.sh
cf create-service mcp-gateway gateway mcp-gateway-1 --wait

cf create-user-provided-service github-enterprise-auth-credentials -p '{
  "base_url": "<GITHUB_ENTERPRISE_URL>",
  "client_id": "<CLIENT_ID>",
  "client_secret": "<CLIENT_SECRET>",
  "scopes": ["repo", "user:email", "read:user"]
}'

cf bind-service github-mcp mcp-gateway-1 -c '{
  "auth": {"service-instance": {"type": "GITHUB_ENTERPRISE", "name": "github-enterprise-auth-credentials"}},
  "metadata": {"description": "GitHub MCP server for R&D division use."}
}' --wait
```

```output
Binding service mcp-gateway-1 to app github-mcp...
Bind in progress. Use 'cf service mcp-gateway-1' to check operation status.
OK

Reachable at: <gateway-url>/github-mcp/mcp
Auth: GitHub Enterprise OIDC — tokens introspected per request
```

> [!impact]
> A fully working, enterprise-auth-gated GitHub MCP tool is now reachable from any bound agent or chat client — every call carries a verified GitHub Enterprise identity, not an anonymous or shared credential.

## question: Which auth mode fits? {#sec-question}

For the internal or third-party tools your teams already use — which of these three auth modes would each one need?

- none: quick internal prototypes, servers already behind your network perimeter
- forward_token: any upstream that authorizes per-user (Copilot-style) rather than per-app
- oauth_passthrough / enterprise OIDC: SaaS tools with their own OAuth flow, or anything requiring an audit trail tied to a real identity
