import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const securitySteps: DemoStep[] = [
  {
    id: 'sec-intro',
    type: 'content',
    section: 'Security & MCP Gateway',
    title: 'MCP Gateway',
    heading: 'One front door for Model Context Protocol traffic',
    body: "Introduced in v10.4.0, MCP Gateway is a separate marketplace service (`mcp-gateway`, plan `gateway`) that proxies Model Context Protocol traffic to on-platform or off-platform MCP servers — with per-server auth federation, audit events, and Prometheus metrics.",
    bullets: [
      { title: 'none', icon: 'shield', description: 'Default. Unauthenticated proxy — appropriate for trusted internal tools.' },
      { title: 'forward_token', icon: 'key', description: "The gateway forwards the caller's own access token upstream. Used for endpoints like GitHub Copilot's MCP server." },
      { title: 'oauth_passthrough', icon: 'lock', description: "The gateway rewrites the upstream OAuth Protected-Resource-Metadata to point at itself. Used for endpoints like Figma's MCP server." },
    ],
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-diagram-1',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'Single entry point',
    heading: 'Step 1 — every MCP call passes through one gateway',
    diagramId: 'mcp-gateway-security',
    narrative: 'Whether the caller is an AI Agent, an IDE, or a custom chat client, MCP traffic enters through one MCP Gateway service instance.',
    visibleNodeIds: ['agent', 'mcp-gateway'],
    visibleEdgeIds: ['e-agent-gw'],
    activeNodeIds: ['mcp-gateway'],
    sourceUrl: `${DOCS}/tutorials-mcp-gateway.html`,
  },
  {
    id: 'sec-diagram-2',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'auth: none',
    heading: 'Step 2 — on-platform tools, no auth required',
    diagramId: 'mcp-gateway-security',
    narrative: "The default auth mode: for internal, trusted MCP servers, the gateway simply proxies through.",
    visibleNodeIds: ['agent', 'mcp-gateway', 'onplat'],
    visibleEdgeIds: ['e-agent-gw', 'e-gw-onplat'],
    activeNodeIds: ['onplat'],
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-diagram-3',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'forward_token',
    heading: 'Step 3 — GitHub Copilot: forward the caller’s token',
    diagramId: 'mcp-gateway-security',
    narrative: "Some upstream MCP servers need the caller's own identity, not the gateway's. `forward_token` mode passes the caller's access token straight through — this is how GitHub Copilot's MCP endpoint is wired up.",
    visibleNodeIds: ['agent', 'mcp-gateway', 'onplat', 'copilot'],
    visibleEdgeIds: ['e-agent-gw', 'e-gw-onplat', 'e-gw-copilot'],
    activeNodeIds: ['copilot'],
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-diagram-4',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'oauth_passthrough',
    heading: 'Step 4 — Figma: the gateway impersonates the OAuth resource',
    diagramId: 'mcp-gateway-security',
    narrative: "Other upstreams (like Figma) expect to run their own OAuth dance against the caller. `oauth_passthrough` has the gateway rewrite the upstream's OAuth Protected-Resource-Metadata to point back at itself, so the flow still works transparently.",
    visibleNodeIds: ['agent', 'mcp-gateway', 'onplat', 'copilot', 'figma'],
    visibleEdgeIds: ['e-agent-gw', 'e-gw-onplat', 'e-gw-copilot', 'e-gw-figma'],
    activeNodeIds: ['figma'],
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-diagram-5',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'Enterprise OIDC/OAuth',
    heading: 'Step 5 — GitHub Enterprise via Tanzu SSO',
    diagramId: 'mcp-gateway-security',
    narrative: "For a self-hosted GitHub Enterprise MCP server, the gateway federates against your own identity provider via a Tanzu SSO (`p-identity`) binding — full OIDC/OAuth with token introspection, not just passthrough.",
    visibleNodeIds: ['agent', 'mcp-gateway', 'onplat', 'copilot', 'figma', 'ghe', 'sso'],
    visibleEdgeIds: ['e-agent-gw', 'e-gw-onplat', 'e-gw-copilot', 'e-gw-figma', 'e-gw-ghe', 'e-ghe-sso'],
    activeNodeIds: ['ghe', 'sso'],
    sourceUrl: `${DOCS}/reference-mcp-authentication.html`,
  },
  {
    id: 'sec-diagram-6',
    type: 'diagram',
    section: 'Security & MCP Gateway',
    title: 'Audit & metrics',
    heading: 'Step 6 — everything is logged and metered centrally',
    diagramId: 'mcp-gateway-security',
    narrative: 'Regardless of auth mode, every MCP call emits structured audit events and Prometheus metrics, surfaced in Tanzu Hub\'s "MCP Gateway Usage" dashboard.',
    visibleNodeIds: ['agent', 'mcp-gateway', 'onplat', 'copilot', 'figma', 'ghe', 'sso', 'hub'],
    visibleEdgeIds: ['e-agent-gw', 'e-gw-onplat', 'e-gw-copilot', 'e-gw-figma', 'e-gw-ghe', 'e-ghe-sso', 'e-gw-hub'],
    activeNodeIds: ['hub'],
    sourceUrl: `${DOCS}/reference-mcp-audit-log-schema.html`,
  },
  {
    id: 'sec-cmd-create',
    type: 'command',
    section: 'Security & MCP Gateway',
    title: 'Provisioning the gateway',
    heading: 'Registering off-platform MCP servers per auth mode',
    description: "The three auth modes map directly onto the `mcp-servers` array you pass at `cf create-service` time.",
    commands: [
      {
        label: 'no-auth.sh',
        lang: 'bash',
        code: `cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [
    {"name": "partner-api", "url": "https://partner.example.com/mcp",
     "metadata": {"description": "Connect to the partner API via MCP"}},
    {"name": "analytics-api", "url": "https://analytics.example.com/mcp"}
  ]
}' --wait`,
      },
      {
        label: 'forward-token.sh',
        lang: 'bash',
        code: `cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [{"name": "copilot", "url": "https://api.githubcopilot.com/mcp",
                    "auth": {"mode": "forward_token"}}]
}' --wait`,
      },
      {
        label: 'oauth-passthrough.sh',
        lang: 'bash',
        code: `cf create-service mcp-gateway gateway my-gateway -c '{
  "mcp-servers": [{"name": "figma", "url": "https://mcp.figma.com/mcp",
                    "auth": {"mode": "oauth_passthrough"}}]
}' --wait`,
        output: `Creating service instance my-gateway in org demo / space demo as admin...
Create in progress. Use 'cf services' or 'cf service my-gateway' to check operation status.

OK

my-gateway now proxies https://mcp.figma.com/mcp with OAuth PRM rewritten to itself.`,
      },
    ],
    impact: "Notice these are declarative — `cf update-service` must resend the full desired `mcp-servers` state, not a delta. Run `cf service my-gateway --params` first to see current config before editing.",
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-cmd-ghe',
    type: 'command',
    section: 'Security & MCP Gateway',
    title: 'Full GitHub Enterprise walkthrough',
    heading: 'Pushing a real MCP server behind enterprise OAuth',
    description: 'The deepest security example in the docs: push the actual open-source GitHub MCP server, put it behind the gateway, and bind it with GitHub Enterprise OIDC credentials via a user-provided service.',
    commands: [
      {
        label: 'push-server.sh',
        lang: 'bash',
        code: `git clone git@github.com:github/github-mcp-server.git
cd github-mcp-server && git checkout v0.33.0

cf create-org mcp-servers && cf target -o mcp-servers
cf create-space github && cf target -s github
cf push -f github-mcp.manifest.yml`,
      },
      {
        label: 'wire-auth.sh',
        lang: 'bash',
        code: `cf create-service mcp-gateway gateway mcp-gateway-1 --wait

cf create-user-provided-service github-enterprise-auth-credentials -p '{
  "base_url": "<GITHUB_ENTERPRISE_URL>",
  "client_id": "<CLIENT_ID>",
  "client_secret": "<CLIENT_SECRET>",
  "scopes": ["repo", "user:email", "read:user"]
}'

cf bind-service github-mcp mcp-gateway-1 -c '{
  "auth": {"service-instance": {"type": "GITHUB_ENTERPRISE", "name": "github-enterprise-auth-credentials"}},
  "metadata": {"description": "GitHub MCP server for R&D division use."}
}' --wait`,
        output: `Binding service mcp-gateway-1 to app github-mcp...
Bind in progress. Use 'cf service mcp-gateway-1' to check operation status.
OK

Reachable at: <gateway-url>/github-mcp/mcp
Auth: GitHub Enterprise OIDC — tokens introspected per request`,
      },
    ],
    impact: 'A fully working, enterprise-auth-gated GitHub MCP tool is now reachable from any bound agent or chat client — every call carries a verified GitHub Enterprise identity, not an anonymous or shared credential.',
    sourceUrl: `${DOCS}/how-to-guides-add-off-platform-mcp-servers.html`,
  },
  {
    id: 'sec-question',
    type: 'question',
    section: 'Security & MCP Gateway',
    title: 'Which auth mode fits?',
    prompt: 'For the internal or third-party tools your teams already use — which of these three auth modes would each one need?',
    hints: [
      'none: quick internal prototypes, servers already behind your network perimeter',
      'forward_token: any upstream that authorizes per-user (Copilot-style) rather than per-app',
      'oauth_passthrough / enterprise OIDC: SaaS tools with their own OAuth flow, or anything requiring an audit trail tied to a real identity',
    ],
  },
]
