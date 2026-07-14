import type { DiagramDef } from '@/types/demo'

export const agentDropletBuild: DiagramDef = {
  id: 'agent-droplet-build',
  nodes: [
    { id: 'payload', label: 'Agent Payload', sublabel: 'apt.yml · .profile.d/ · bin/claude', kind: 'client', icon: 'file-text', position: { x: 40, y: 380 }, width: 300 },
    { id: 'apt-buildpack', label: 'apt-buildpack', sublabel: 'installs JDK · Node · gh · ripgrep · python3', kind: 'gateway', icon: 'workflow', position: { x: 700, y: 380 }, width: 320 },
    { id: 'droplet', label: 'Staged Droplet', sublabel: 'binary_buildpack owns the release contract — no web process running', kind: 'platform', icon: 'server', position: { x: 1500, y: 380 }, width: 340 },
    { id: 'task', label: 'cf run-task', sublabel: 'ephemeral task instance, one shot', kind: 'model', icon: 'play', position: { x: 2200, y: 380 }, width: 300 },
  ],
  edges: [
    { id: 'e-payload-apt', source: 'payload', target: 'apt-buildpack', label: 'cf push --task', animated: true },
    { id: 'e-apt-droplet', source: 'apt-buildpack', target: 'droplet', label: 'hands off (release contract)' },
    { id: 'e-droplet-task', source: 'droplet', target: 'task', label: "cf run-task --command '...'", dashed: true, animated: true },
  ],
}

export const agentCredentialFlow: DiagramDef = {
  id: 'agent-credential-flow',
  nodes: [
    { id: 'ups', label: 'User-Provided Services', sublabel: 'anthropic-creds · github-creds', kind: 'data', icon: 'key', position: { x: 40, y: 380 }, width: 340 },
    { id: 'vcap', label: 'VCAP_SERVICES', sublabel: 'single JSON blob CF injects', kind: 'gateway', icon: 'braces', position: { x: 700, y: 380 }, width: 320 },
    { id: 'profile', label: '.profile.d/vcap.sh', sublabel: 'parses with jq, exports flat vars', kind: 'service', icon: 'terminal', position: { x: 1360, y: 380 }, width: 340 },
    { id: 'tools', label: 'claude · gh', sublabel: 'read ANTHROPIC_API_KEY, GH_TOKEN', kind: 'client', icon: 'bot', position: { x: 2100, y: 380 }, width: 320 },
  ],
  edges: [
    { id: 'e-ups-vcap', source: 'ups', target: 'vcap', label: 'cf push binds services', animated: true },
    { id: 'e-vcap-profile', source: 'vcap', target: 'profile', label: 'sourced before every task', animated: true },
    { id: 'e-profile-tools', source: 'profile', target: 'tools', label: 'export ANTHROPIC_API_KEY, GH_TOKEN' },
  ],
}

// The centerpiece: the exact same binary, skill file, and prompt can be
// pointed at either a real Anthropic endpoint or a Tanzu AI Services plan
// speaking the Anthropic wire format — the swap is three environment
// variables at `cf run-task` time, nothing about the droplet changes.
export const agentModelSwap: DiagramDef = {
  id: 'agent-model-swap',
  nodes: [
    { id: 'binary', label: './bin/claude', sublabel: 'same droplet, same skill, unmodified', kind: 'client', icon: 'terminal', position: { x: 40, y: 260 }, width: 320 },
    { id: 'anthropic', label: 'api.anthropic.com', sublabel: 'real Claude models', kind: 'external', icon: 'cloud', position: { x: 760, y: 60 }, width: 320 },
    { id: 'ai-services', label: 'Tanzu AI Services', sublabel: 'ai-server gateway · Anthropic wire-format', kind: 'gateway', icon: 'workflow', position: { x: 760, y: 460 }, width: 340 },
    { id: 'qwen', label: 'Qwen 3.6 27B', sublabel: 'on-platform · plan anthropic-qwen3.6', kind: 'model', icon: 'bot', position: { x: 1500, y: 460 }, width: 320 },
  ],
  edges: [
    { id: 'e-binary-anthropic', source: 'binary', target: 'anthropic', label: 'default — no overrides set', dashed: true },
    { id: 'e-binary-aiservices', source: 'binary', target: 'ai-services', label: '3 env vars overridden', animated: true },
    { id: 'e-aiservices-qwen', source: 'ai-services', target: 'qwen', label: 'provider-native call', animated: true },
  ],
}
