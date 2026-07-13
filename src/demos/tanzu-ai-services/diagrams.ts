import type { DiagramDef } from '@/types/demo'

export const systemArchitecture: DiagramDef = {
  id: 'system-architecture',
  groups: [
    {
      id: 'controller',
      label: 'AI Services tile — Controller VM(s)',
      position: { x: 660, y: 100 },
      size: { width: 340, height: 492 },
    },
    {
      id: 'worker',
      label: 'Worker VM (dedicated per model instance)',
      position: { x: 1020, y: 20 },
      size: { width: 340, height: 332 },
    },
  ],
  nodes: [
    { id: 'client', label: 'CF App', sublabel: 'bound as a service', kind: 'client', icon: 'boxes', position: { x: 40, y: 340 } },
    { id: 'gorouter', label: 'gorouter', sublabel: 'Cloud Foundry routing tier', kind: 'gateway', icon: 'route', position: { x: 360, y: 340 } },
    { id: 'ai-server', label: 'ai-server', sublabel: 'controller job · inference proxy', kind: 'gateway', icon: 'workflow', position: { x: 700, y: 140 }, group: 'controller', width: 290 },
    { id: 'genai-broker', label: 'genai-broker', sublabel: 'controller job · CF service broker', kind: 'service', icon: 'git-branch', position: { x: 700, y: 460 }, group: 'controller', width: 290 },
    { id: 'worker-nginx', label: 'nginx', sublabel: 'TLS termination', kind: 'service', icon: 'shield', position: { x: 1060, y: 60 }, group: 'worker' },
    { id: 'worker-runtime', label: 'Ollama / vLLM', sublabel: 'model runtime process', kind: 'model', icon: 'bot', position: { x: 1060, y: 220 }, group: 'worker' },
    { id: 'postgres', label: 'PostgreSQL', sublabel: 'config · audit · journal', kind: 'data', icon: 'database', position: { x: 1060, y: 460 } },
    { id: 'bosh', label: 'BOSH Director', sublabel: 'provisions Worker VMs', kind: 'platform', icon: 'server', position: { x: 700, y: 680 } },
    { id: 'external', label: 'Off-Platform Models', sublabel: 'OpenAI · Bedrock · Azure · Vertex · Anthropic', kind: 'external', icon: 'cloud', position: { x: 1440, y: 140 }, width: 300 },
  ],
  edges: [
    { id: 'e-client-gorouter', source: 'client', target: 'gorouter', label: 'HTTPS request', animated: true },
    { id: 'e-gorouter-aiserver', source: 'gorouter', target: 'ai-server', label: 'port 9092', animated: true },
    { id: 'e-gorouter-broker', source: 'gorouter', target: 'genai-broker', label: 'port 10005 (marketplace)', dashed: true },
    { id: 'e-broker-bosh', source: 'genai-broker', target: 'bosh', label: 'provision / deprovision VM', dashed: true },
    { id: 'e-aiserver-nginx', source: 'ai-server', target: 'worker-nginx', label: 'port 9023', animated: true },
    { id: 'e-nginx-runtime', source: 'worker-nginx', target: 'worker-runtime', label: 'port 4000' },
    { id: 'e-aiserver-postgres', source: 'ai-server', target: 'postgres', label: 'config · audit · journal', dashed: true },
    { id: 'e-aiserver-external', source: 'ai-server', target: 'external', label: 'off-platform proxy · HTTPS 443', animated: true },
  ],
}

export const gatewayWireFormat: DiagramDef = {
  id: 'gateway-wire-format',
  nodes: [
    { id: 'client-openai', label: 'App (OpenAI SDK / curl)', kind: 'client', icon: 'braces', position: { x: 40, y: 40 }, width: 340 },
    { id: 'client-anthropic', label: 'App (Anthropic SDK)', kind: 'client', icon: 'braces', position: { x: 40, y: 280 }, width: 340 },
    { id: 'wf-gateway', label: 'ai-server', sublabel: 'one gateway, per-plan wire contract', kind: 'gateway', icon: 'workflow', position: { x: 520, y: 160 }, width: 300 },
    { id: 'wf-model', label: 'Backend Model', sublabel: 'vLLM · Ollama · off-platform', kind: 'model', icon: 'bot', position: { x: 980, y: 160 } },
  ],
  edges: [
    { id: 'e-openai-gw', source: 'client-openai', target: 'wf-gateway', label: '/openai/v1/chat/completions', animated: true },
    { id: 'e-anthropic-gw', source: 'client-anthropic', target: 'wf-gateway', label: '/anthropic/v1/messages', dashed: true },
    { id: 'e-gw-model', source: 'wf-gateway', target: 'wf-model', label: 'provider-native call', animated: true },
  ],
}

export const mcpGatewaySecurity: DiagramDef = {
  id: 'mcp-gateway-security',
  nodes: [
    { id: 'agent', label: 'AI Agent / Chat Client', kind: 'client', icon: 'bot', position: { x: 40, y: 340 }, width: 290 },
    { id: 'mcp-gateway', label: 'MCP Gateway', sublabel: 'auth federation · audit · metrics', kind: 'gateway', icon: 'network', position: { x: 460, y: 340 }, width: 300 },
    { id: 'onplat', label: 'On-Platform MCP Server', sublabel: 'auth: none', kind: 'service', icon: 'server', position: { x: 900, y: 40 }, width: 300 },
    { id: 'copilot', label: 'GitHub Copilot MCP', sublabel: 'auth: forward_token', kind: 'external', icon: 'globe', position: { x: 900, y: 260 }, width: 300 },
    { id: 'figma', label: 'Figma MCP', sublabel: 'auth: oauth_passthrough', kind: 'external', icon: 'globe', position: { x: 900, y: 480 }, width: 300 },
    { id: 'ghe', label: 'GitHub Enterprise MCP', sublabel: 'auth: OIDC / OAuth', kind: 'external', icon: 'globe', position: { x: 900, y: 700 }, width: 300 },
    { id: 'sso', label: 'Tanzu SSO (p-identity)', sublabel: 'OIDC provider', kind: 'security', icon: 'key', position: { x: 1360, y: 700 }, width: 300 },
    { id: 'hub', label: 'Tanzu Hub', sublabel: 'usage dashboards · Prometheus metrics', kind: 'observability', icon: 'gauge', position: { x: 460, y: 660 }, width: 300 },
  ],
  edges: [
    { id: 'e-agent-gw', source: 'agent', target: 'mcp-gateway', label: 'MCP session', animated: true },
    { id: 'e-gw-onplat', source: 'mcp-gateway', target: 'onplat', label: 'auth: none' },
    { id: 'e-gw-copilot', source: 'mcp-gateway', target: 'copilot', label: 'forwards caller token', dashed: true },
    { id: 'e-gw-figma', source: 'mcp-gateway', target: 'figma', label: 'rewrites OAuth PRM', dashed: true },
    { id: 'e-gw-ghe', source: 'mcp-gateway', target: 'ghe', label: 'OIDC / OAuth introspect', dashed: true },
    { id: 'e-ghe-sso', source: 'ghe', target: 'sso', label: 'validates identity' },
    { id: 'e-gw-hub', source: 'mcp-gateway', target: 'hub', label: 'metrics + audit', dashed: true },
  ],
}
