import type { DemoStep } from '@/types/demo'

const SECTION = 'UI Customization — Option A'

export const uiCustomizationWrapperSteps: DemoStep[] = [
  {
    id: 'ui-wrapper-intro',
    type: 'content',
    section: SECTION,
    title: 'What got built',
    heading: 'Option A, actually implemented: a branded reverse-proxy wrapper',
    body: 'The Agent section assessed four UI-customization options without building any of them. This is Option A, built for real: a small Node.js/Express app — `kirkwaregpt-ui-wrapper` — deployed as its own `cf push`, sitting in front of the unmodified `kirkwaregpt` agent.',
    bullets: [
      { title: 'Zero changes to the agent', icon: 'shield-check', description: 'The agent_buildpack app, its `AGENTS.md`, its model binding — none of it changed. The wrapper is purely additive.' },
      { title: 'One origin, not two', icon: 'globe', description: 'Everything under `/agent/*` reverse-proxies to the real agent, so the branded shell and the chat UI share a single domain — no cross-origin cookie or CSP friction.' },
      { title: 'http-proxy-middleware', icon: 'workflow', description: 'One Express route (`/`) serves the branded shell; one proxy middleware mount (`/agent`) forwards everything else, including WebSocket upgrades.' },
    ],
    callout: {
      label: 'Lowest effort, least control',
      tone: 'info',
      body: 'This is genuinely the cheapest option to stand up — about 60 lines of code, no knowledge of the agent\'s internal API required. The trade-off is real too: you\'re decorating the existing chat UI, not replacing it. Anything inside the iframe still looks and behaves like the stock buildpack UI.',
    },
  },
  {
    id: 'ui-wrapper-code',
    type: 'command',
    section: SECTION,
    title: 'The whole app',
    heading: '`apps/kirkwaregpt-ui-wrapper/` — one server file, one manifest',
    description: 'Deployed independently from the agent, into the same `kirkware-gpt` space.',
    commands: [
      {
        label: 'server.js',
        lang: 'javascript',
        code: `const AGENT_URL = process.env.AGENT_URL || 'https://kirkwaregpt.apps.tanzu.kirkware.net'

app.get('/', (req, res) => {
  res.type('html').send(brandedShellHtml) // header, logo, <iframe src="/agent/">
})

// Everything under /agent reverse-proxies to the real agent app — one
// origin, no cross-origin cookie or CSP headaches.
app.use('/agent', createProxyMiddleware({
  target: AGENT_URL,
  changeOrigin: true,
  pathRewrite: { '^/agent': '' },
  ws: true,
}))`,
      },
      {
        label: 'manifest.yml',
        lang: 'yaml',
        code: `applications:
- name: kirkwaregpt-ui-wrapper
  buildpacks:
  - nodejs_buildpack
  memory: 256M
  instances: 1
  env:
    AGENT_URL: https://kirkwaregpt.apps.tanzu.kirkware.net
  routes:
  - route: kirkwaregpt-ui-wrapper.apps.tanzu.kirkware.net`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cd apps/kirkwaregpt-ui-wrapper
cf push -f manifest.yml`,
      },
    ],
    sourceUrl: 'https://github.com/bkirkware/kirkware-demos/tree/main/apps/kirkwaregpt-ui-wrapper',
  },
  {
    id: 'ui-wrapper-diagram',
    type: 'diagram',
    section: SECTION,
    title: 'Request flow',
    heading: 'One browser origin, two Cloud Foundry apps',
    diagramId: 'kirkwaregpt-ui-wrapper-flow',
    narrative: 'The browser never talks to `kirkwaregpt` directly — every request lands on the wrapper first. The root route serves Kirkware\'s branded chrome; everything else is transparently proxied through to the real agent.',
    visibleNodeIds: ['browser', 'wrapper', 'agent'],
    visibleEdgeIds: ['e-browser-wrapper', 'e-wrapper-agent'],
    activeNodeIds: ['wrapper'],
  },
  {
    id: 'ui-wrapper-verify',
    type: 'content',
    section: SECTION,
    title: 'Verified',
    heading: 'Pushed and live in kirkware-gpt',
    body: 'Deployed the same way as any other app on the platform — a plain `nodejs_buildpack` push, no special handling required for the proxy layer.',
    callout: {
      label: 'Result',
      tone: 'success',
      body: 'kirkwaregpt-ui-wrapper.apps.tanzu.kirkware.net loads the branded shell, and the embedded iframe successfully renders the real agent chat UI proxied through the wrapper\'s own origin.',
    },
  },
  {
    id: 'ui-wrapper-question',
    type: 'question',
    section: SECTION,
    title: 'Where does this fall short?',
    prompt: 'The wrapper controls everything outside the iframe. What would you actually need to change *inside* the chat experience that this option can\'t reach?',
    hints: [
      'Message bubble styling, input box placement, model picker UI — all still the stock buildpack UI inside the iframe',
      'A CSS injection trick (postMessage into the iframe, or a proxy-side style override) could go further, at the cost of being brittle against buildpack UI updates',
      'If the real requirement is "make it feel like our product," Option B — the fully custom frontend — is the honest next step',
    ],
  },
]
