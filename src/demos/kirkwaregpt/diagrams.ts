import type { DiagramDef } from '@/types/demo'

// The "big picture" — every piece this demo touches, all at once. Shown in
// full during the Introduction as a preview, then reused in Wrap-up as the
// recap. The individual sections each drill into one branch of this diagram
// with their own dedicated, progressively-revealed diagram.
export const kirkwaregptArchitecture: DiagramDef = {
  id: 'kirkwaregpt-architecture',
  nodes: [
    { id: 'users', label: 'Users', sublabel: 'Slack · web chat · CLI', kind: 'client', icon: 'users', position: { x: 40, y: 340 }, width: 280 },
    { id: 'app', label: 'KirkwareGPT', sublabel: 'agent_buildpack · cf push', kind: 'platform', icon: 'bot', position: { x: 740, y: 340 }, width: 300 },
    { id: 'mcp-gateway', label: 'MCP Gateway', sublabel: 'gateway plan · dashboard + OAuth', kind: 'gateway', icon: 'network', position: { x: 740, y: 20 }, width: 300 },
    { id: 'github-mcp', label: 'github-mcp', sublabel: 'github-mcp-server binary', kind: 'service', icon: 'git-branch', position: { x: 1440, y: 20 }, width: 320 },
    { id: 'ai-gateway', label: 'AI Services Gateway', sublabel: 'ai-server · policies enforced here', kind: 'gateway', icon: 'shield', position: { x: 1440, y: 340 }, width: 320 },
    { id: 'model', label: 'claude-sonnet-4-6', sublabel: 'kirkware-all-models plan', kind: 'model', icon: 'bot', position: { x: 2140, y: 340 }, width: 300 },
    { id: 'postgres', label: 'Postgres', sublabel: 'pgvector · RAG store', kind: 'data', icon: 'database', position: { x: 740, y: 660 }, width: 280 },
    { id: 'webhook', label: 'Webhook Policy', sublabel: 'credit-card filter (preview)', kind: 'security', icon: 'shield-check', position: { x: 1440, y: 660 }, width: 320 },
  ],
  edges: [
    { id: 'e-users-app', source: 'users', target: 'app', label: 'chat request', animated: true },
    { id: 'e-app-mcpgw', source: 'app', target: 'mcp-gateway', label: 'MCP session', animated: true },
    { id: 'e-mcpgw-github', source: 'mcp-gateway', target: 'github-mcp', label: 'proxies calls' },
    { id: 'e-app-aigw', source: 'app', target: 'ai-gateway', label: 'chat completion', animated: true },
    { id: 'e-aigw-model', source: 'ai-gateway', target: 'model', label: 'model call', animated: true },
    { id: 'e-app-postgres', source: 'app', target: 'postgres', label: 'RAG lookup', dashed: true },
    { id: 'e-aigw-webhook', source: 'ai-gateway', target: 'webhook', label: 'policy check', dashed: true },
  ],
}

// The Agent Buildpack lifecycle: push (degraded) -> bind model + Postgres ->
// restage (active). Revealed progressively across three diagram steps in the
// Agent section.
export const kirkwaregptAgentLifecycle: DiagramDef = {
  id: 'kirkwaregpt-agent-lifecycle',
  nodes: [
    { id: 'files', label: 'Agent Payload', sublabel: 'AGENTS.md · manifest.yaml', kind: 'client', icon: 'file-text', position: { x: 40, y: 340 }, width: 300 },
    { id: 'buildpack', label: 'agent_buildpack', sublabel: 'cf push kirkwaregpt', kind: 'gateway', icon: 'workflow', position: { x: 740, y: 340 }, width: 300 },
    { id: 'degraded', label: 'KirkwareGPT', sublabel: 'degraded mode — no model bound', kind: 'platform', icon: 'server', position: { x: 1440, y: 140 }, width: 340 },
    { id: 'model-svc', label: 'kirkware-all-models', sublabel: 'claude-sonnet-4-6 service key', kind: 'model', icon: 'bot', position: { x: 2140, y: 140 }, width: 320 },
    { id: 'postgres', label: 'Postgres', sublabel: 'RAG vector store', kind: 'data', icon: 'database', position: { x: 1440, y: 460 }, width: 280 },
    { id: 'active', label: 'KirkwareGPT', sublabel: 'chat UI + debug panel live', kind: 'platform', icon: 'sparkles', position: { x: 2140, y: 460 }, width: 320 },
  ],
  edges: [
    { id: 'e-files-buildpack', source: 'files', target: 'buildpack', label: 'cf push', animated: true },
    { id: 'e-buildpack-degraded', source: 'buildpack', target: 'degraded', label: 'stages droplet' },
    { id: 'e-degraded-model', source: 'degraded', target: 'model-svc', label: 'bind model', animated: true },
    { id: 'e-degraded-postgres', source: 'degraded', target: 'postgres', label: 'bind postgres', dashed: true },
    { id: 'e-model-active', source: 'model-svc', target: 'active', label: 'cf restage', animated: true },
    { id: 'e-postgres-active', source: 'postgres', target: 'active', label: 'cf restage', animated: true },
  ],
}

// Registering the GitHub MCP server with the gateway, then the agent
// discovering it. Revealed progressively across three diagram steps in the
// MCP Gateway section.
export const kirkwaregptMcpGatewayFlow: DiagramDef = {
  id: 'kirkwaregpt-mcp-gateway-flow',
  nodes: [
    { id: 'app', label: 'KirkwareGPT Agent', sublabel: 'bound as mcp-server tag', kind: 'client', icon: 'bot', position: { x: 40, y: 340 }, width: 320 },
    { id: 'gateway', label: 'MCP Gateway', sublabel: 'kirkwaregpt-mcp-gateway · dashboard', kind: 'gateway', icon: 'network', position: { x: 740, y: 340 }, width: 320 },
    { id: 'github-mcp', label: 'github-mcp', sublabel: 'github-mcp-server binary', kind: 'service', icon: 'git-branch', position: { x: 1440, y: 140 }, width: 320 },
    { id: 'oauth', label: 'GitHub OAuth App', sublabel: 'client id/secret · UPS', kind: 'security', icon: 'key', position: { x: 2140, y: 140 }, width: 320 },
    { id: 'github', label: 'GitHub / GHE', sublabel: 'repos · issues · PRs', kind: 'external', icon: 'globe', position: { x: 1440, y: 460 }, width: 320 },
  ],
  edges: [
    { id: 'e-app-gateway', source: 'app', target: 'gateway', label: 'MCP session', animated: true },
    { id: 'e-gateway-github-mcp', source: 'gateway', target: 'github-mcp', label: 'proxies calls', animated: true },
    { id: 'e-github-mcp-oauth', source: 'github-mcp', target: 'oauth', label: 'auth handshake', dashed: true },
    { id: 'e-github-mcp-github', source: 'github-mcp', target: 'github', label: 'tool calls', animated: true },
    { id: 'e-oauth-github', source: 'oauth', target: 'github', label: 'validates token', dashed: true },
  ],
}

// Where rate limits, quotas, and the content-filtering webhook actually sit —
// in front of the model, behind the agent, applied by the AI Services
// gateway rather than anything the agent's own code does.
export const kirkwaregptPolicyFlow: DiagramDef = {
  id: 'kirkwaregpt-policy-flow',
  nodes: [
    { id: 'client', label: 'KirkwareGPT Users', kind: 'client', icon: 'users', position: { x: 40, y: 340 }, width: 300 },
    { id: 'gateway', label: 'AI Services Gateway', sublabel: 'rate limits · quotas', kind: 'gateway', icon: 'shield', position: { x: 740, y: 340 }, width: 340 },
    { id: 'webhook', label: 'Webhook Policy', sublabel: 'credit-card filter (preview)', kind: 'security', icon: 'shield-check', position: { x: 1440, y: 140 }, width: 340 },
    { id: 'model', label: 'claude-sonnet-4-6', sublabel: 'kirkware-all-models plan', kind: 'model', icon: 'bot', position: { x: 1440, y: 460 }, width: 340 },
  ],
  edges: [
    { id: 'e-client-gateway', source: 'client', target: 'gateway', label: 'chat request', animated: true },
    { id: 'e-gateway-webhook', source: 'gateway', target: 'webhook', label: 'inspects body', dashed: true },
    { id: 'e-gateway-model', source: 'gateway', target: 'model', label: 'forwards call', animated: true },
  ],
}

// Option A: a branded Node.js reverse-proxy wrapper sits in front of the
// unmodified agent, so the browser only ever talks to one origin.
export const kirkwaregptUiWrapperFlow: DiagramDef = {
  id: 'kirkwaregpt-ui-wrapper-flow',
  nodes: [
    { id: 'browser', label: 'User Browser', kind: 'client', icon: 'users', position: { x: 40, y: 340 }, width: 280 },
    { id: 'wrapper', label: 'kirkwaregpt-ui-wrapper', sublabel: 'Node.js · Express · injects branding', kind: 'gateway', icon: 'workflow', position: { x: 680, y: 340 }, width: 340 },
    { id: 'agent', label: 'kirkwaregpt', sublabel: 'agent_buildpack · unmodified', kind: 'platform', icon: 'bot', position: { x: 1360, y: 340 }, width: 320 },
  ],
  edges: [
    { id: 'e-browser-wrapper', source: 'browser', target: 'wrapper', label: 'every request', animated: true },
    { id: 'e-wrapper-agent', source: 'wrapper', target: 'agent', label: 'transparent proxy', animated: true },
  ],
}
