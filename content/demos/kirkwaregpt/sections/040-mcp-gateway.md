---
section: MCP Gateway
---

## content: One gateway, every MCP server {#mcp-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### A dashboard, OAuth federation, and audit — in front of tools you didn't write

The GitHub MCP server is just an off-the-shelf binary — this section pushes it unmodified. The MCP Gateway is what turns "an MCP server running somewhere" into something KirkwareGPT can discover, authenticate against, and call, with usage and audit visibility that living inside the agent's own code would never give you.

## command: Clone the GitHub MCP server {#mcp-clone-server}
---
source: https://github.com/github/github-mcp-server
---

### An exact, pinned version — not whatever main happens to be

```bash label=clone.sh live=kirkwaregpt-clone-github-mcp.sh
cd "$TEMP_WORKSPACE" && gh repo clone github/github-mcp-server && cd github-mcp-server && git checkout v0.33.1
```

## command: Push the MCP server {#mcp-push-server}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Same space as the agent — kirkware-gpt

The Go buildpack compiles the server binary directly from source; the `command` line is what actually starts it.

```bash label=create-github-mcp-manifest.sh live=kirkwaregpt-create-github-mcp-manifest.sh
cd "$TEMP_WORKSPACE/github-mcp-server" && cat > github-mcp-manifest.yaml <<EOF
applications:
  - name: github-mcp
    instances: 1
    memory: 124M
    buildpacks:
      - go_buildpack
    env:
      GO_INSTALL_PACKAGE_SPEC: github.com/github/github-mcp-server/cmd/github-mcp-server/
    command: "bin/github-mcp-server --port 8080 --gh-host ${GITHUB_HOST:-github.com} http"
    routes:
    - route: github-mcp.apps.internal
EOF
```

```bash label=push.sh live=kirkwaregpt-push-github-mcp.sh
cd "$TEMP_WORKSPACE/github-mcp-server" && cf push -f github-mcp-manifest.yaml
```

> [!impact]
> Set `GITHUB_HOST` in Settings for a GitHub Enterprise instance — it defaults to plain github.com if unset.

## command: Create the MCP Gateway {#mcp-create-gateway}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### One service instance, one dashboard URL

```bash label=marketplace.sh live=marketplace-mcp-gateway.sh
cf marketplace -e mcp-gateway
```

```bash label=ensure-gateway.sh live=cf-ensure-mcp-gateway.sh
cf service kirkwaregpt-mcp-gateway || cf create-service mcp-gateway gateway kirkwaregpt-mcp-gateway --wait
```

```bash label=show-gateway.sh live=cf-show-mcp-gateway.sh
cf service kirkwaregpt-mcp-gateway
```

> [!impact]
> The dashboard URL from `cf service kirkwaregpt-mcp-gateway` is the same URL every client (Cursor, the OAuth callback, presenter demo) points at from here on.

## diagram: Registering the server {#mcp-diagram-1}
---
diagram: kirkwaregpt-mcp-gateway-flow
visibleNodeIds:
  - app
  - gateway
  - github-mcp
visibleEdgeIds:
  - e-app-gateway
  - e-gateway-github-mcp
activeNodeIds:
  - gateway
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Step 1 — an agent, a gateway, and a server that don't know about each other yet

Three independent pieces so far: the agent, the gateway, and the pushed GitHub MCP server. The next steps wire authentication, then registration.

## content: Create a GitHub OAuth App {#mcp-oauth-setup}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Done once, in GitHub — not in Cloud Foundry

In GitHub (or GitHub Enterprise) settings:

- icon:key **1. Open OAuth Apps** — Settings → Developer settings → OAuth Apps → New OAuth App
- icon:file-text **2. Name it** — e.g. `github-mcp` — any name that identifies its purpose
- icon:globe **3. Homepage URL** — Set to the MCP Gateway dashboard URL from the previous step
- icon:route **4. Authorization callback URL** — `<GATEWAY_URL>/github-mcp/auth/callback` — e.g. `https://kirkwaregpt-mcp-gateway.apps.tanzu.kirkware.net/github-mcp/auth/callback`
- icon:lock **5. Copy credentials** — Client ID, plus a newly-generated Client Secret — both feed the user-provided service next

## command: Store the OAuth credentials {#mcp-create-oauth-ups}

### A user-provided service, not a manifest secret

```bash label=create-oauth-ups.sh live=kirkwaregpt-create-oauth-ups.sh
cf create-user-provided-service github-mcp-oauth \
-p '{
  "authorization_endpoint": "https://github.com/login/oauth/authorize",
  "token_endpoint": "https://github.com/login/oauth/access_token",
  "client_id": "'"$GIT_MCP_OAUTH_CLIENT_ID"'",
  "client_secret": "'"$GIT_MCP_OAUTH_CLIENT_SECRET"'",
  "scopes": ["repo", "read:user"],
  "issuer": "https://github.com/login/oauth"
}'
```

## diagram: OAuth configured {#mcp-diagram-2}
---
diagram: kirkwaregpt-mcp-gateway-flow
visibleNodeIds:
  - app
  - gateway
  - github-mcp
  - oauth
visibleEdgeIds:
  - e-app-gateway
  - e-gateway-github-mcp
  - e-github-mcp-oauth
activeNodeIds:
  - oauth
---

### Step 2 — credentials in place, not yet wired to the gateway

The OAuth App and its user-provided service exist now, but nothing has bound them to the gateway's registration of `github-mcp` yet — that's the next command.

## command: Register the server with the gateway {#mcp-bind-gateway}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-mcp-authentication.html
---

### One bind-service call does the registration

Binding `github-mcp` to `kirkwaregpt-mcp-gateway` with an `auth` block is what actually registers the server — the gateway now knows this app exists, and how to authenticate calls to it.

```bash label=bind-gateway.sh live=kirkwaregpt-bind-github-mcp-gateway.sh
cf bind-service github-mcp kirkwaregpt-mcp-gateway \
-c '{
  "auth": {
    "service-instance": {
      "type": "OAUTH",
      "name": "github-mcp-oauth"
    }
  }
}' --wait
```

```bash label=restage.sh live=kirkwaregpt-restage-github-mcp.sh
cf restage github-mcp
```

> [!impact]
> This demo uses a generic `OAUTH` service-instance binding, which works against plain github.com OAuth Apps. A dedicated `GITHUB_ENTERPRISE` auth type also exists for full GitHub Enterprise deployments, and Tanzu SSO can front the gateway with OIDC instead — same registration shape, different `type` value.

## diagram: Fully registered {#mcp-diagram-3}
---
diagram: kirkwaregpt-mcp-gateway-flow
visibleNodeIds:
  - app
  - gateway
  - github-mcp
  - oauth
  - github
visibleEdgeIds:
  - e-app-gateway
  - e-gateway-github-mcp
  - e-github-mcp-oauth
  - e-github-mcp-github
  - e-oauth-github
activeNodeIds:
  - github
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### Step 3 — an authenticated path all the way to GitHub

The registration is complete: the gateway can proxy calls to `github-mcp`, which authenticates against GitHub using the OAuth App's credentials before making the actual tool call.

## command: Connect KirkwareGPT to the gateway {#mcp-connect-agent}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### The same mcp-server tag from the Agent Buildpack tutorial

A user-provided service pointing at the gateway's route for this server, tagged `mcp-server` so the buildpack discovers it automatically at startup — no code, no SDK.

```bash label=create-mcp-ups.sh live=kirkwaregpt-create-mcp-ups.sh
cf create-user-provided-service github-mcp -p '{"url": "https://kirkwaregpt-mcp-gateway.apps.tanzu.kirkware.net/github-mcp/mcp"}' -t mcp-server
```

```bash label=bind-agent.sh live=kirkwaregpt-bind-github-mcp-agent.sh
cf bind-service kirkwaregpt github-mcp --wait
```

```bash label=restage.sh live=kirkwaregpt-restage.sh
cf restage kirkwaregpt
```

> [!impact]
> Open KirkwareGPT's chat UI again — the debug panel now lists `github-mcp` under bound servers, along with every tool it exposes (search repos, read issues, open PRs, and the rest of the GitHub MCP server's tool surface).

## content: Dashboard, usage, and audit {#mcp-dashboard-monitor}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-mcp-gateway.html
---

### What the gateway gives you beyond registration

Once registered, `github-mcp` is visible from three different vantage points:

- icon:gauge **The gateway dashboard** — Lists registered servers with per-client connect options — click a client (e.g. Cursor), install, and authenticate through the same OAuth flow just configured.
- icon:bar-chart **Tanzu Hub usage metrics** — Marketplace → Service Offerings → MCP Gateway → Usage — tool popularity and error rates across every client, not just KirkwareGPT.
- icon:file-text **Audit logs** — Tanzu Hub → Workloads → Apps → the gateway's app (find its GUID via `cf service kirkwaregpt-mcp-gateway --guid`) → Logs, filtered to `mcp.audit` for detailed JSON records of every tool call and auth event.

## discussion: What else belongs on this gateway? {#mcp-discussion}

GitHub is one MCP server on one gateway. What other internal tools — ticketing, wikis, deploy pipelines — would be worth exposing the same way?

- Anything with an existing MCP server implementation registers the same way — push it, bind it, done
- One gateway can front many servers at once; the dashboard and audit story scales with the org, not per-agent
- The auth model is per-registration — a low-trust server and a high-trust server can sit on the same gateway with different auth types
