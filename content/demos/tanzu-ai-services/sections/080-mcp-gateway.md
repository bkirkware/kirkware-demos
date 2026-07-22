---
section: MCP Gateway
---

## title: Govern the tools {#mcp-divider}
---
variant: section
---

### MCP Gateway

One front door for Model Context Protocol traffic — GA since 10.4.0 as its own marketplace service, with auth federation, audit, and metrics per registered server.

- One entry point
- Three auth modes
- Central audit

## content: The service offering {#sec-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### `mcp-gateway`, plan `gateway`

The gateway proxies MCP traffic to on- or off-platform MCP servers. For off-platform servers, three auth modes (Technical Preview as of 10.4.2) cover most upstreams.

- icon:shield **none** — Default. Unauthenticated proxy for trusted internal tools.
- icon:key **forward_token** — Forward the caller's own token upstream — how GitHub Copilot's MCP endpoint is wired.
- icon:lock **oauth_passthrough** — The gateway rewrites the upstream's OAuth resource metadata to point at itself — how Figma's MCP server works.

## diagram: One entry point {#sec-diagram-1}
---
diagram: mcp-gateway-security
show: [agent, mcp-gateway, e-agent-gw]
active: [mcp-gateway]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Every MCP call passes through one gateway

Agent, IDE, or custom chat client — MCP traffic enters through a single MCP Gateway service instance.

## diagram: auth: none {#sec-diagram-2}
---
diagram: mcp-gateway-security
add: [onplat, e-gw-onplat]
active: [onplat]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### On-platform tools, no auth required

The default: internal, trusted MCP servers are simply proxied through.

## command: Register servers {#sec-cmd-create}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Auth modes map onto `cf create-service`

The `mcp-servers` array declares each upstream and its auth mode.

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
> Declarative, not incremental — `cf update-service` must resend the full `mcp-servers` state. Check current config with `cf service my-gateway --params` before editing.
