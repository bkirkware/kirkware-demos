---
section: Security & Auth
---

## diagram: forward_token {#sec-diagram-3}
---
diagram: mcp-gateway-security
add: [copilot, e-gw-copilot]
active: [copilot]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Copilot: forward the caller's token

Some upstreams authorize the person, not the platform. `forward_token` passes the caller's own access token straight through.

## diagram: oauth_passthrough {#sec-diagram-4}
---
diagram: mcp-gateway-security
add: [figma, e-gw-figma]
active: [figma]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### Figma: the gateway plays OAuth resource

Upstreams that run their own OAuth dance still work: the gateway rewrites the upstream's Protected-Resource-Metadata to point back at itself.

## diagram: Enterprise OIDC {#sec-diagram-5}
---
diagram: mcp-gateway-security
add: [ghe, sso, e-gw-ghe, e-ghe-sso]
active: [ghe, sso]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-mcp-authentication.html
---

### GitHub Enterprise via Tanzu SSO

For self-hosted upstreams, the gateway federates against your identity provider through a Tanzu SSO (`p-identity`) binding — full OIDC with token introspection, not just passthrough.

## diagram: Audit & metrics {#sec-diagram-6}
---
diagram: mcp-gateway-security
add: [hub, e-gw-hub]
active: [hub]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-mcp-audit-log-schema.html
---

### Logged and metered, centrally

Every MCP call emits structured audit events and Prometheus metrics — surfaced in Tanzu Hub's [MCP Gateway Usage dashboard]($HUB_URL/hub/marketplace/service-offerings), regardless of auth mode.

## command: Wire up GitHub Enterprise {#sec-cmd-ghe}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-add-off-platform-mcp-servers.html
---

### A real MCP server behind enterprise OAuth

The deepest example in the docs: push the open-source GitHub MCP server, then bind it to the gateway with GitHub Enterprise OIDC credentials.

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
> Every call to this tool now carries a verified GitHub Enterprise identity — no anonymous or shared credentials anywhere in the chain.

## question: Which auth mode fits? {#sec-question}

For the tools your teams already use — which auth mode does each one need?

- none: internal prototypes, servers already behind your perimeter
- forward_token: upstreams that authorize per-user, Copilot-style
- oauth_passthrough / enterprise OIDC: SaaS tools with their own OAuth flow, or anything needing an identity-tied audit trail
