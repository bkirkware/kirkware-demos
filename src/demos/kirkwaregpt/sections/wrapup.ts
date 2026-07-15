import type { DemoStep } from '@/types/demo'

export const wrapupSteps: DemoStep[] = [
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Summary',
    title: 'Recap',
    heading: 'What KirkwareGPT actually demonstrates',
    body: 'Four platform features, composed — not four things built from scratch.',
    bullets: [
      { title: 'Agent Buildpack', icon: 'bot', description: 'A hosted chat UI, debug panel, and MCP discovery — all from `AGENTS.md` and a `cf push`. No custom Dockerfile, no frontend code.' },
      { title: 'MCP Gateway', icon: 'network', description: 'One dashboard, OAuth federation, and audit logs in front of an unmodified GitHub MCP server binary — registered with a single `cf bind-service` call.' },
      { title: 'Postgres-backed RAG', icon: 'database', description: 'A real database instance, bound like any other marketplace service — the ingestion pipeline is the next build, not this one.' },
      { title: 'Policy governance', icon: 'shield-check', description: 'Rate limits, quotas, and a credit-card-filtering webhook — all attached to the plan in Operations Manager, never touching the agent\'s own code.' },
    ],
    callout: {
      label: 'One open thread: UI customization',
      tone: 'info',
      body: 'The Agent section assessed four ways to get Kirkware\'s branding onto the chat UI — a reverse-proxy wrapper, a fully custom frontend, a sidecar process, or requesting theming hooks from the platform team — and deliberately implemented none of them. That decision is still open.',
    },
  },
  {
    id: 'wrap-diagram',
    type: 'diagram',
    section: 'Summary',
    title: 'The full picture',
    heading: 'Every piece, together',
    diagramId: 'kirkwaregpt-architecture',
    narrative: 'Same diagram as the Introduction — now every box has a section behind it.',
    visibleNodeIds: ['users', 'app', 'mcp-gateway', 'github-mcp', 'ai-gateway', 'model', 'postgres', 'webhook'],
    visibleEdgeIds: ['e-users-app', 'e-app-mcpgw', 'e-mcpgw-github', 'e-app-aigw', 'e-aigw-model', 'e-app-postgres', 'e-aigw-webhook'],
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Summary',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: 'What would you point KirkwareGPT at first?',
  },
]
