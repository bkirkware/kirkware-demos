import type { DemoStep } from '@/types/demo'

const AI_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'
const AGENT_TUTORIAL = `${AI_DOCS}/tutorials-deploy-an-ai-agent.html`
const SECTION = 'Agent'

export const agentSteps: DemoStep[] = [
  {
    id: 'agent-intro',
    type: 'content',
    section: SECTION,
    title: 'The Agent Buildpack',
    heading: 'A buildpack that hosts the agent, not just the code',
    body: 'Most buildpacks turn source into a runnable process. This one also supplies the process: a chat UI, model binding, and MCP tool discovery all come from the buildpack itself. The only thing the application provides is `AGENTS.md`.',
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-prepare',
    type: 'command',
    section: SECTION,
    title: 'Prepare the agent',
    heading: 'AGENTS.md is the entire application',
    description: 'The system prompt is the whole app. An optional `manifest.yaml` makes the buildpack explicit rather than auto-detected.',
    commands: [
      {
        label: 'mkdir.sh',
        lang: 'bash',
        code: `mkdir -p "$TEMP_WORKSPACE/kirkwaregpt"`,
        liveId: 'kirkwaregpt-mkdir.sh',
      },
      {
        label: 'create-agents-md.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > AGENTS.md <<'EOF'
You are KirkwareGPT, an internal engineering assistant for Kirkware.
Answer questions concisely and accurately, grounded in Kirkware's own
runbooks and documentation whenever they're available to you.
When you have access to tools, use them to provide better answers.
EOF`,
        liveId: 'kirkwaregpt-create-agents-md.sh',
      },
      {
        label: 'create-manifest.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > manifest.yaml <<'EOF'
applications:
- name: kirkwaregpt
  buildpacks:
  - agent_buildpack
  routes:
  - route: kirkwaregpt.apps.tanzu.kirkware.net
EOF`,
        liveId: 'kirkwaregpt-create-manifest.sh',
      },
    ],
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-push',
    type: 'command',
    section: SECTION,
    title: 'Push — degraded mode',
    heading: 'A running app, before any model is bound',
    description: 'The agent launches immediately, but "degraded" — reachable, but showing a setup banner instead of a chat box until a model is bound.',
    commands: [
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/kirkwaregpt" && cf push kirkwaregpt`,
        liveId: 'kirkwaregpt-push.sh',
      },
      {
        label: 'app.sh',
        lang: 'bash',
        code: `cf app kirkwaregpt`,
        liveId: 'kirkwaregpt-app.sh',
      },
    ],
    impact: 'Open the URL from `cf app kirkwaregpt` in a browser now — the setup banner is exactly what a teammate would see if they hit this link one step too early.',
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-diagram-1',
    type: 'diagram',
    section: SECTION,
    title: 'Staging the agent',
    heading: 'Step 1 — cf push stages a degraded droplet',
    diagramId: 'kirkwaregpt-agent-lifecycle',
    narrative: 'The buildpack stages the droplet from `AGENTS.md` and `manifest.yaml` alone. It starts immediately — just without a model bound yet.',
    visibleNodeIds: ['files', 'buildpack', 'degraded'],
    visibleEdgeIds: ['e-files-buildpack', 'e-buildpack-degraded'],
    activeNodeIds: ['degraded'],
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-bind-model',
    type: 'command',
    section: SECTION,
    title: 'Bind the model',
    heading: 'kirkware-all-models, bound to the agent',
    description: 'Binding the plan gives the chat UI every model it exposes to choose from — including claude-sonnet-4-6.',
    commands: [
      {
        label: 'marketplace.sh',
        lang: 'bash',
        code: `cf marketplace -e ai-models`,
        liveId: 'marketplace.sh',
      },
      {
        label: 'ensure-model-service.sh',
        lang: 'bash',
        code: `cf service kirkwaregpt-model || cf create-service ai-models kirkware-all-models kirkwaregpt-model --wait`,
        liveId: 'cf-ensure-kirkwaregpt-model.sh',
      },
      {
        label: 'bind-model.sh',
        lang: 'bash',
        code: `cf bind-service kirkwaregpt kirkwaregpt-model --wait`,
        liveId: 'kirkwaregpt-bind-model.sh',
      },
      {
        label: 'restage.sh',
        lang: 'bash',
        code: `cf restage kirkwaregpt`,
        liveId: 'kirkwaregpt-restage.sh',
      },
    ],
    impact: 'The chat UI activates the moment restage completes — no second deploy, no image rebuild.',
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-diagram-2',
    type: 'diagram',
    section: SECTION,
    title: 'Binding the model',
    heading: 'Step 2 — a service binding, not a redeploy',
    diagramId: 'kirkwaregpt-agent-lifecycle',
    narrative: '`kirkware-all-models` is a plan like any other CF marketplace service. Binding it hands the agent a service key; nothing about the droplet changes.',
    visibleNodeIds: ['files', 'buildpack', 'degraded', 'model-svc'],
    visibleEdgeIds: ['e-files-buildpack', 'e-buildpack-degraded', 'e-degraded-model'],
    activeNodeIds: ['model-svc'],
    sourceUrl: AGENT_TUTORIAL,
  },
  {
    id: 'agent-bind-postgres',
    type: 'command',
    section: SECTION,
    title: 'Bind Postgres for RAG',
    heading: 'A real database instance — not a RAG pipeline yet',
    description: 'Binding gets KirkwareGPT a reachable Postgres instance and credentials. It does not, by itself, ingest or embed anything — that\'s a follow-on step (an ingestion job plus a tool the agent calls), deliberately out of scope for this demo.',
    commands: [
      {
        label: 'bind-postgres.sh',
        lang: 'bash',
        code: `cf bind-service kirkwaregpt kirkwaregpt-db --wait`,
        liveId: 'kirkwaregpt-bind-postgres.sh',
      },
      {
        label: 'restage.sh',
        lang: 'bash',
        code: `cf restage kirkwaregpt`,
        liveId: 'kirkwaregpt-restage.sh',
      },
    ],
    impact: '`kirkwaregpt-db` was already provisioned back in Lab Preparation — this bind is instant, no multi-minute wait mid-demo.',
  },
  {
    id: 'agent-diagram-3',
    type: 'diagram',
    section: SECTION,
    title: 'Binding Postgres',
    heading: 'Step 3 — a RAG-ready store, bound the same way',
    diagramId: 'kirkwaregpt-agent-lifecycle',
    narrative: 'Same shape as the model binding: a marketplace service, bound, restaged. What KirkwareGPT does with it — embeddings, similarity search — is application logic on top, not something the binding provides.',
    visibleNodeIds: ['files', 'buildpack', 'degraded', 'model-svc', 'postgres'],
    visibleEdgeIds: ['e-files-buildpack', 'e-buildpack-degraded', 'e-degraded-model', 'e-degraded-postgres'],
    activeNodeIds: ['postgres'],
  },
  {
    id: 'agent-chat-ui',
    type: 'content',
    section: SECTION,
    title: 'The chat UI',
    heading: 'What you get without writing a frontend',
    body: 'Open the agent\'s URL again — the setup banner is gone, replaced by a working chat interface.',
    bullets: [
      { title: 'Conversation area', icon: 'message', description: 'A standard chat pane — send a message, get a streamed response.' },
      { title: 'Debug panel', icon: 'activity', description: 'Shows the active model, the live `AGENTS.md` system prompt, every bound MCP server, and the tools each one exposes.' },
    ],
  },
  {
    id: 'agent-ui-customization',
    type: 'content',
    section: SECTION,
    title: 'UI customization — options, not implementation',
    heading: 'What\'s actually possible today, and what it costs',
    body: 'The buildpack\'s chat UI has no theming hooks as of this writing — no CSS override, no logo slot, no layout config. That\'s a real, current limitation, not a configuration gap. Below are four ways to get Kirkware\'s branding in front of users anyway, roughly ordered from least to most invasive. None of these are built in this demo — this is an assessment to react to, not a recommendation to implement today.',
    bullets: [
      {
        title: 'A. Branded reverse-proxy wrapper (Node.js)',
        icon: 'workflow',
        description: 'A small Express or Fastify app, deployed alongside kirkwaregpt, that serves Kirkware\'s chrome (header, favicon, color scheme) and embeds the buildpack\'s own chat UI in an iframe or reverse-proxied route. Lowest effort, least control — you\'re decorating the existing UI, not replacing it.',
      },
      {
        title: 'B. Fully custom frontend against the agent\'s own API',
        icon: 'braces',
        description: 'If the buildpack exposes the same HTTP endpoint its built-in UI calls for chat completions, a custom Node.js/React (or any stack) frontend can talk to that endpoint directly and discard the built-in UI entirely — full control over look and UX, while the buildpack still handles hosting, model binding, and MCP discovery underneath.',
      },
      {
        title: 'C. Sidecar process in the same app',
        icon: 'boxes',
        description: 'A second process in the same manifest — a lightweight Node.js static-asset server — serving custom branding on its own route/domain, proxying API calls through to the buildpack\'s process. Keeps everything in one `cf push`, at the cost of a slightly more complex manifest.',
      },
      {
        title: 'D. Request theming hooks from the platform team',
        icon: 'help-circle',
        description: 'The most durable fix isn\'t a workaround at all — file the customization need with whoever owns the agent buildpack roadmap. A supported theming API would make options A–C unnecessary for the next agent, not just this one.',
      },
    ],
    callout: {
      label: 'Why Node.js specifically',
      tone: 'info',
      body: 'Options A and C both run comfortably as their own lightweight CF app or sidecar process — no special toolchain, small footprint, and it\'s the natural choice if the eventual custom frontend (option B) is also a Node.js/React stack, so the same team and skillset covers both.',
    },
  },
  {
    id: 'agent-question',
    type: 'question',
    section: SECTION,
    title: 'Which customization path fits?',
    prompt: 'Given Kirkware\'s actual branding requirements, which of the four options — wrapper, custom frontend, sidecar, or platform request — is worth prototyping first?',
    hints: [
      'If the ask is "just put our logo on it," option A is probably enough and ships fastest',
      'If the ask is "this needs to feel like our product," option B is the honest answer — the other three are all still someone else\'s UI underneath',
      'Filing the request with the platform team (option D) costs almost nothing and can run in parallel with whichever workaround you pick',
    ],
  },
]
