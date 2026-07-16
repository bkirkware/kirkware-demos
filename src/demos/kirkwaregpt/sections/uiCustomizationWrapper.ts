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
      { title: 'One origin, transparently', icon: 'globe', description: 'Every request — HTML, JS, CSS, WebSocket upgrades — proxies straight through to the real agent at the same path it asked for. No cross-origin cookie or CSP friction, because there\'s only ever one origin.' },
      { title: 'Response-body injection, not an iframe', icon: 'workflow', description: 'The branding is spliced directly into the agent\'s own HTML response via `http-proxy-middleware`\'s `responseInterceptor` — the first version used an iframe instead, and that version had a real bug (see below).' },
    ],
    callout: {
      label: 'Lowest effort, least control',
      tone: 'info',
      body: 'This is genuinely the cheapest option to stand up — under 40 lines of code, no knowledge of the agent\'s internal API required. The trade-off is real too: you\'re decorating the existing chat UI, not replacing it. Everything past the injected banner still looks and behaves like the stock buildpack UI.',
    },
  },
  {
    id: 'ui-wrapper-bug',
    type: 'content',
    section: SECTION,
    title: 'A real bug, caught by actually testing it',
    heading: 'The first version looked fine in curl and broke in a browser',
    body: 'The original implementation served a branded shell page with an `<iframe src="/agent/">`, and reverse-proxied everything under `/agent/*` to the real agent. `curl` on `/agent/` returned 200, so it looked correct. Opening it in an actual browser showed only the banner — no chat interface at all.',
    bullets: [
      { title: 'The real cause', icon: 'help-circle', description: 'The agent\'s chat UI is a Vite SPA whose HTML references its own JS/CSS at root-absolute paths — `/assets/index-*.js`, not `./assets/...`. Once iframed at `/agent/`, the browser requests those assets from the *iframe\'s own origin* at `/assets/*` — never under `/agent/` at all — so the wrapper\'s Express app had no route for them and 404\'d silently.' },
      { title: 'The fix', icon: 'sparkles', description: 'Drop the iframe and the `/agent` prefix entirely. Proxy every path transparently at the root — so `/assets/*` just resolves — and inject the banner into the HTML response body instead of wrapping it in a separate frame.' },
    ],
    callout: {
      label: 'Why this matters beyond this one bug',
      tone: 'info',
      body: '`curl` verifies that a URL returns a response. It does not verify that a browser can actually render what depends on it — relative-path assumptions, iframe origin rules, and client-side routing are all invisible to a status-code check. This is exactly why "verified" claims need an actual browser pass, not just an HTTP check.',
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
const BANNER_HTML = \`<style>body{padding-top:44px!important;}</style>
<div style="position:fixed;top:0;...">Kirkware Assistant</div>\`

// Proxy every path at the root, transparently — /assets/*, /favicon.svg,
// WebSocket upgrades, all of it — so nothing the agent's own SPA expects
// ever breaks. Only HTML responses get the banner spliced in.
app.use('/', createProxyMiddleware({
  target: AGENT_URL,
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || ''
    if (!contentType.includes('text/html')) return responseBuffer
    const html = responseBuffer.toString('utf8')
    return html.replace(/<body[^>]*>/i, (m) => \`\${m}\${BANNER_HTML}\`)
  }),
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
    narrative: 'The browser never talks to `kirkwaregpt` directly — every request, at every path, lands on the wrapper first and proxies straight through to the real agent. The only place Kirkware\'s branding actually enters is a body-rewrite on HTML responses.',
    visibleNodeIds: ['browser', 'wrapper', 'agent'],
    visibleEdgeIds: ['e-browser-wrapper', 'e-wrapper-agent'],
    activeNodeIds: ['wrapper'],
  },
  {
    id: 'ui-wrapper-verify',
    type: 'content',
    section: SECTION,
    title: 'Verified',
    heading: 'Pushed, broken, fixed, and re-verified in kirkware-gpt',
    body: 'Deployed the same way as any other app on the platform — a plain `nodejs_buildpack` push, no special handling required for the proxy layer.',
    callout: {
      label: 'Result',
      tone: 'success',
      body: 'kirkwaregpt-ui-wrapper.apps.tanzu.kirkware.net now serves the real agent chat UI with the Kirkware banner injected above it — confirmed by fetching the previously-broken `/assets/*` paths directly (both return real JS/CSS content through the wrapper) and by checking the rendered HTML contains the injected banner markup.',
    },
  },
  {
    id: 'ui-wrapper-question',
    type: 'question',
    section: SECTION,
    title: 'Where does this fall short?',
    prompt: 'The wrapper only controls a banner spliced above the chat UI. What would you actually need to change *inside* the chat experience that this option can\'t reach?',
    hints: [
      'Message bubble styling, input box placement, model picker UI — all still the stock buildpack UI, since the injection only touches the `<body>` open tag',
      'Deeper styling would mean injecting CSS that overrides the SPA\'s own class names — possible, but brittle against buildpack UI updates changing those names',
      'If the real requirement is "make it feel like our product," Option B — the fully custom frontend — is the honest next step',
    ],
  },
]
