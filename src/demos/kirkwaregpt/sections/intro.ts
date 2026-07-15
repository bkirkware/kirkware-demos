import type { DemoStep } from '@/types/demo'

const AI_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'
const AGENT_TUTORIAL = `${AI_DOCS}/tutorials-deploy-an-ai-agent.html`
const SECTION = 'Introduction'

export const introSteps: DemoStep[] = [
  {
    id: 'intro-title',
    type: 'title',
    section: SECTION,
    title: 'Welcome',
    eyebrow: 'KirkwareGPT · Internal AI Agent',
    heading: 'KirkwareGPT',
    subheading:
      'An internal, MCP-connected AI agent — deployed with the Tanzu Agent Buildpack, grounded with a Postgres-backed RAG store, and governed by rate limits, quotas, and a content-filtering webhook.',
    bullets: ['agent_buildpack, not a custom Dockerfile', 'MCP Gateway → GitHub tools for free', 'Postgres-backed RAG', 'Rate limits, quotas & webhooks'],
  },
  {
    id: 'intro-architecture',
    type: 'diagram',
    section: SECTION,
    title: 'The moving pieces',
    heading: 'Four sections, one system',
    diagramId: 'kirkwaregpt-architecture',
    narrative: 'Every box here gets its own section. The agent (center) is the only thing users talk to directly — it reaches the MCP Gateway for tools, an AI Services gateway for the model, and Postgres for retrieval. Policies live at the gateway, not in the agent\'s own code.',
    visibleNodeIds: ['users', 'app', 'mcp-gateway', 'github-mcp', 'ai-gateway', 'model', 'postgres', 'webhook'],
    visibleEdgeIds: ['e-users-app', 'e-app-mcpgw', 'e-mcpgw-github', 'e-app-aigw', 'e-aigw-model', 'e-app-postgres', 'e-aigw-webhook'],
  },
  {
    id: 'intro-prerequisites',
    type: 'content',
    section: SECTION,
    title: 'Prerequisites',
    heading: 'What has to be true before any of this works',
    body: 'None of these are covered by this demo — they\'re assumed to already be in place.',
    bullets: [
      { title: 'Agent Buildpack enabled', icon: 'server', description: 'An Operator has enabled the agent buildpack on the foundation — it isn\'t on by default.' },
      { title: 'cf CLI, authenticated', icon: 'terminal', description: 'Installed and logged in to the target foundation, with permission to create and target the kirkware-gpt space inside the kirkware org.' },
      { title: 'kirkware-all-models on the marketplace', icon: 'bot', description: 'Visible via `cf marketplace -e ai-models` — this demo binds the plan and sets claude-sonnet-4-6 as the default model for testing.' },
      { title: 'mcp-gateway on the marketplace', icon: 'network', description: 'Visible via `cf marketplace -e mcp-gateway` — provisions the dashboard the GitHub MCP server registers against.' },
      { title: 'A Postgres offering on the marketplace', icon: 'database', description: 'Visible via `cf marketplace -e postgres` — backs the RAG store. Plan name varies by foundation; Lab Preparation has you confirm it.' },
      { title: 'gh CLI, authenticated', icon: 'git-branch', description: 'Needed to clone github/github-mcp-server before pushing it.' },
      { title: 'A GitHub OAuth App (or GitHub Enterprise)', icon: 'key', description: 'The MCP Gateway section walks through creating one — have admin access to the GitHub org or Enterprise instance ready.' },
    ],
    callout: {
      label: 'This is a real deployment, not a simulation',
      tone: 'info',
      body: 'Every command with a "Run Live" button executes on your actual foundation. Anything that pushes, binds, or restages is left as copy-paste — safe to run, but not auto-executed from the slide.',
    },
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'intro-why',
    type: 'content',
    section: SECTION,
    title: 'What the buildpack actually buys you',
    heading: 'A hosted chat UI and a debug panel, for free',
    body: 'The agent buildpack isn\'t a framework you write against — it\'s a runtime you push into. `AGENTS.md` is the entire application: a system prompt, nothing else. Everything else (chat UI, model binding, MCP tool discovery) is the buildpack\'s job.',
    bullets: [
      { title: 'Degraded mode by design', icon: 'server', description: 'A freshly-pushed agent runs immediately — just with a setup banner instead of a chat box, until a model is bound.' },
      { title: 'MCP servers via env, not code', icon: 'network', description: 'Any bound service tagged `mcp-server` is discovered automatically at startup — no SDK, no tool-registration code.' },
      { title: 'The model is a service binding', icon: 'bot', description: 'Swapping models is `cf bind-service` + `cf restage`, the same shape as every other CF service — not an application redeploy.' },
      { title: 'A debug panel comes standard', icon: 'activity', description: 'The built-in chat UI ships a side panel showing the active model, system prompt, bound servers, and available tools.' },
    ],
    callout: {
      label: 'The trade-off',
      tone: 'info',
      body: 'What you gain in zero-code hosting, you give up in UI control — the built-in chat UI isn\'t deeply customizable today. The Agent section covers exactly what that limitation looks like, and the options worth considering.',
    },
  },
  {
    id: 'intro-discussion',
    type: 'discussion',
    section: SECTION,
    title: 'Where would this fit at Kirkware?',
    prompt: 'Think about the internal tools your team already fields questions for by hand — runbooks, on-call triage, "how do I". Which of those becomes a KirkwareGPT-shaped agent first?',
    talkingPoints: [
      'A hosted chat UI plus MCP tool access covers a lot of "internal assistant" ground with zero custom frontend work',
      'RAG over Postgres means the knowledge base is whatever you choose to ingest — runbooks, docs, past incidents',
      'Policies apply at the gateway, so the same governance story (rate limits, quotas, a content filter) covers every agent on the foundation, not just this one',
    ],
  },
]
