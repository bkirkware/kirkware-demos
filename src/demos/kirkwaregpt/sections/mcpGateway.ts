import type { DemoStep } from '@/types/demo'

const AI_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'
const MCP_TUTORIAL = `${AI_DOCS}/tutorials-mcp-gateway.html`
const AGENT_TUTORIAL = `${AI_DOCS}/tutorials-deploy-an-ai-agent.html`
const AUTH_REFERENCE = `${AI_DOCS}/reference-mcp-authentication.html`
const SECTION = 'MCP Gateway'

export const mcpGatewaySteps: DemoStep[] = [
  {
    id: 'mcp-intro',
    type: 'content',
    section: SECTION,
    title: 'One gateway, every MCP server',
    heading: 'A dashboard, OAuth federation, and audit — in front of tools you didn\'t write',
    body: 'The GitHub MCP server is just an off-the-shelf binary — this section pushes it unmodified. The MCP Gateway is what turns "an MCP server running somewhere" into something KirkwareGPT can discover, authenticate against, and call, with usage and audit visibility that living inside the agent\'s own code would never give you.',
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-clone-server',
    type: 'command',
    section: SECTION,
    title: 'Clone the GitHub MCP server',
    heading: 'An exact, pinned version — not whatever main happens to be',
    commands: [
      {
        label: 'clone.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE" && gh repo clone github/github-mcp-server && cd github-mcp-server && git checkout v0.33.1`,
        liveId: 'kirkwaregpt-clone-github-mcp.sh',
      },
    ],
    sourceUrl: 'https://github.com/github/github-mcp-server',
  },
  {
    id: 'mcp-push-server',
    type: 'command',
    section: SECTION,
    title: 'Push the MCP server',
    heading: 'Same space as the agent — kirkware-gpt',
    description: 'The Go buildpack compiles the server binary directly from source; the `command` line is what actually starts it.',
    commands: [
      {
        label: 'create-github-mcp-manifest.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/github-mcp-server" && cat > github-mcp-manifest.yaml <<EOF
applications:
  - name: github-mcp
    instances: 1
    memory: 124M
    buildpacks:
      - go_buildpack
    env:
      GO_INSTALL_PACKAGE_SPEC: github.com/github/github-mcp-server/cmd/github-mcp-server/
    command: "bin/github-mcp-server --port 8080 --gh-host \${GITHUB_HOST:-github.com} http"
    routes:
    - route: github-mcp.apps.internal
EOF`,
        liveId: 'kirkwaregpt-create-github-mcp-manifest.sh',
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/github-mcp-server" && cf push -f github-mcp-manifest.yaml`,
        liveId: 'kirkwaregpt-push-github-mcp.sh',
      },
    ],
    impact: 'Set `GITHUB_HOST` in Settings for a GitHub Enterprise instance — it defaults to plain github.com if unset.',
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-create-gateway',
    type: 'command',
    section: SECTION,
    title: 'Create the MCP Gateway',
    heading: 'One service instance, one dashboard URL',
    commands: [
      {
        label: 'marketplace.sh',
        lang: 'bash',
        code: `cf marketplace -e mcp-gateway`,
        liveId: 'marketplace-mcp-gateway.sh',
      },
      {
        label: 'ensure-gateway.sh',
        lang: 'bash',
        code: `cf service kirkwaregpt-mcp-gateway || cf create-service mcp-gateway gateway kirkwaregpt-mcp-gateway --wait`,
        liveId: 'cf-ensure-mcp-gateway.sh',
      },
      {
        label: 'show-gateway.sh',
        lang: 'bash',
        code: `cf service kirkwaregpt-mcp-gateway`,
        liveId: 'cf-show-mcp-gateway.sh',
      },
    ],
    impact: 'The dashboard URL from `cf service kirkwaregpt-mcp-gateway` is the same URL every client (Cursor, the OAuth callback, presenter demo) points at from here on.',
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-diagram-1',
    type: 'diagram',
    section: SECTION,
    title: 'Registering the server',
    heading: 'Step 1 — an agent, a gateway, and a server that don\'t know about each other yet',
    diagramId: 'kirkwaregpt-mcp-gateway-flow',
    narrative: 'Three independent pieces so far: the agent, the gateway, and the pushed GitHub MCP server. The next steps wire authentication, then registration.',
    visibleNodeIds: ['app', 'gateway', 'github-mcp'],
    visibleEdgeIds: ['e-app-gateway', 'e-gateway-github-mcp'],
    activeNodeIds: ['gateway'],
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-oauth-setup',
    type: 'content',
    section: SECTION,
    title: 'Create a GitHub OAuth App',
    heading: 'Done once, in GitHub — not in Cloud Foundry',
    body: 'In GitHub (or GitHub Enterprise) settings:',
    bullets: [
      { title: '1. Open OAuth Apps', icon: 'key', description: 'Settings → Developer settings → OAuth Apps → New OAuth App' },
      { title: '2. Name it', icon: 'file-text', description: 'e.g. `github-mcp` — any name that identifies its purpose' },
      { title: '3. Homepage URL', icon: 'globe', description: 'Set to the MCP Gateway dashboard URL from the previous step' },
      { title: '4. Authorization callback URL', icon: 'route', description: '`<GATEWAY_URL>/github-mcp/auth/callback` — e.g. `https://kirkwaregpt-mcp-gateway.apps.tanzu.kirkware.net/github-mcp/auth/callback`' },
      { title: '5. Copy credentials', icon: 'lock', description: 'Client ID, plus a newly-generated Client Secret — both feed the user-provided service next' },
    ],
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-create-oauth-ups',
    type: 'command',
    section: SECTION,
    title: 'Store the OAuth credentials',
    heading: 'A user-provided service, not a manifest secret',
    commands: [
      {
        label: 'create-oauth-ups.sh',
        lang: 'bash',
        code: `cf create-user-provided-service github-mcp-oauth \\
-p '{
  "authorization_endpoint": "https://github.com/login/oauth/authorize",
  "token_endpoint": "https://github.com/login/oauth/access_token",
  "client_id": "'"$GIT_MCP_OAUTH_CLIENT_ID"'",
  "client_secret": "'"$GIT_MCP_OAUTH_CLIENT_SECRET"'",
  "scopes": ["repo", "read:user"],
  "issuer": "https://github.com/login/oauth"
}'`,
        liveId: 'kirkwaregpt-create-oauth-ups.sh',
      },
    ],
  },
  {
    id: 'mcp-diagram-2',
    type: 'diagram',
    section: SECTION,
    title: 'OAuth configured',
    heading: 'Step 2 — credentials in place, not yet wired to the gateway',
    diagramId: 'kirkwaregpt-mcp-gateway-flow',
    narrative: 'The OAuth App and its user-provided service exist now, but nothing has bound them to the gateway\'s registration of `github-mcp` yet — that\'s the next command.',
    visibleNodeIds: ['app', 'gateway', 'github-mcp', 'oauth'],
    visibleEdgeIds: ['e-app-gateway', 'e-gateway-github-mcp', 'e-github-mcp-oauth'],
    activeNodeIds: ['oauth'],
  },
  {
    id: 'mcp-bind-gateway',
    type: 'command',
    section: SECTION,
    title: 'Register the server with the gateway',
    heading: 'One bind-service call does the registration',
    description: 'Binding `github-mcp` to `kirkwaregpt-mcp-gateway` with an `auth` block is what actually registers the server — the gateway now knows this app exists, and how to authenticate calls to it.',
    commands: [
      {
        label: 'bind-gateway.sh',
        lang: 'bash',
        code: `cf bind-service github-mcp kirkwaregpt-mcp-gateway \\
-c '{
  "auth": {
    "service-instance": {
      "type": "OAUTH",
      "name": "github-mcp-oauth"
    }
  }
}' --wait`,
        liveId: 'kirkwaregpt-bind-github-mcp-gateway.sh',
      },
      {
        label: 'restage.sh',
        lang: 'bash',
        code: `cf restage github-mcp`,
        liveId: 'kirkwaregpt-restage-github-mcp.sh',
      },
    ],
    impact: 'This demo uses a generic `OAUTH` service-instance binding, which works against plain github.com OAuth Apps. A dedicated `GITHUB_ENTERPRISE` auth type also exists for full GitHub Enterprise deployments, and Tanzu SSO can front the gateway with OIDC instead — same registration shape, different `type` value.',
    sourceUrl: AUTH_REFERENCE,
  },
  {
    id: 'mcp-diagram-3',
    type: 'diagram',
    section: SECTION,
    title: 'Fully registered',
    heading: 'Step 3 — an authenticated path all the way to GitHub',
    diagramId: 'kirkwaregpt-mcp-gateway-flow',
    narrative: 'The registration is complete: the gateway can proxy calls to `github-mcp`, which authenticates against GitHub using the OAuth App\'s credentials before making the actual tool call.',
    visibleNodeIds: ['app', 'gateway', 'github-mcp', 'oauth', 'github'],
    visibleEdgeIds: ['e-app-gateway', 'e-gateway-github-mcp', 'e-github-mcp-oauth', 'e-github-mcp-github', 'e-oauth-github'],
    activeNodeIds: ['github'],
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-connect-agent',
    type: 'command',
    section: SECTION,
    title: 'Connect KirkwareGPT to the gateway',
    heading: 'The same mcp-server tag from the Agent Buildpack tutorial',
    description: 'A user-provided service pointing at the gateway\'s route for this server, tagged `mcp-server` so the buildpack discovers it automatically at startup — no code, no SDK.',
    commands: [
      {
        label: 'create-mcp-ups.sh',
        lang: 'bash',
        code: `cf create-user-provided-service github-mcp -p '{"url": "https://kirkwaregpt-mcp-gateway.apps.tanzu.kirkware.net/github-mcp/mcp"}' -t mcp-server`,
        liveId: 'kirkwaregpt-create-mcp-ups.sh',
      },
      {
        label: 'bind-agent.sh',
        lang: 'bash',
        code: `cf bind-service kirkwaregpt github-mcp --wait`,
        liveId: 'kirkwaregpt-bind-github-mcp-agent.sh',
      },
      {
        label: 'restage.sh',
        lang: 'bash',
        code: `cf restage kirkwaregpt`,
        liveId: 'kirkwaregpt-restage.sh',
      },
    ],
    impact: 'Open KirkwareGPT\'s chat UI again — the debug panel now lists `github-mcp` under bound servers, along with every tool it exposes (search repos, read issues, open PRs, and the rest of the GitHub MCP server\'s tool surface).',
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'mcp-dashboard-monitor',
    type: 'content',
    section: SECTION,
    title: 'Dashboard, usage, and audit',
    heading: 'What the gateway gives you beyond registration',
    body: 'Once registered, `github-mcp` is visible from three different vantage points:',
    bullets: [
      { title: 'The gateway dashboard', icon: 'gauge', description: 'Lists registered servers with per-client connect options — click a client (e.g. Cursor), install, and authenticate through the same OAuth flow just configured.' },
      { title: 'Tanzu Hub usage metrics', icon: 'bar-chart', description: 'Marketplace → Service Offerings → MCP Gateway → Usage — tool popularity and error rates across every client, not just KirkwareGPT.' },
      { title: 'Audit logs', icon: 'file-text', description: 'Tanzu Hub → Workloads → Apps → the gateway\'s app (find its GUID via `cf service kirkwaregpt-mcp-gateway --guid`) → Logs, filtered to `mcp.audit` for detailed JSON records of every tool call and auth event.' },
    ],
    sourceUrl: MCP_TUTORIAL,
  },
  {
    id: 'mcp-discussion',
    type: 'discussion',
    section: SECTION,
    title: 'What else belongs on this gateway?',
    prompt: 'GitHub is one MCP server on one gateway. What other internal tools — ticketing, wikis, deploy pipelines — would be worth exposing the same way?',
    talkingPoints: [
      'Anything with an existing MCP server implementation registers the same way — push it, bind it, done',
      'One gateway can front many servers at once; the dashboard and audit story scales with the org, not per-agent',
      'The auth model is per-registration — a low-trust server and a high-trust server can sit on the same gateway with different auth types',
    ],
  },
]
