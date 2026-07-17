import type { DemoStep } from '@/types/demo'

const SECTION = 'UI Customization'

export const uiCustomizationSteps: DemoStep[] = [
  {
    id: 'ui-wrapper-intro',
    type: 'content',
    section: SECTION,
    title: 'Branding the chat UI',
    heading: 'A branded reverse-proxy wrapper, deployed alongside the agent',
    body: 'The Agent Buildpack\'s chat UI has no theming hooks — no CSS override, no logo slot, no layout config. `kirkwaregpt-ui-wrapper` — a small Node.js/Express app, deployed as its own `cf push` — solves that from the outside: it sits in front of the unmodified `kirkwaregpt` agent and re-brands everything a user actually sees.',
    bullets: [
      { title: 'Zero changes to the agent', icon: 'shield-check', description: 'The agent_buildpack app, its `AGENTS.md`, its model binding — none of it changed. The wrapper is purely additive.' },
      { title: 'One origin, transparently', icon: 'globe', description: 'Every request — HTML, JS, CSS, WebSocket upgrades — proxies straight through to the real agent at the same path it asked for. No cross-origin cookie or CSP friction, because there\'s only ever one origin.' },
      { title: 'Response-body injection, not an iframe', icon: 'workflow', description: 'The branding is spliced directly into the agent\'s own HTML response via `http-proxy-middleware`\'s `responseInterceptor`, keeping the browser on a single origin the whole time.' },
    ],
    callout: {
      label: 'What this does and doesn\'t do',
      tone: 'info',
      body: 'This is genuinely cheap to run — under 40 lines of code, no knowledge of the agent\'s internal API required. The trade-off is real too: it decorates the existing chat UI, it doesn\'t replace it. Everything past the injected theme, favicon, and footer notice still behaves like the stock buildpack UI underneath.',
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
        code: `const AGENT_URL = process.env.AGENT_URL || 'https://kirkwaregpt-agent.apps.tanzu.kirkware.net'

// The agent's UI is Tailwind v4 + shadcn/ui — its whole color scheme is
// ~20 CSS variables on :root/.dark. Redefining the base tokens (not the
// generated --color-* pass-throughs) recolors every .bg-primary /
// .text-accent / .ring usage in the app. destructive stays red on purpose.
const THEME_OVERRIDE_CSS = \`<style>
:root{--primary:#ca8a04;--primary-foreground:#1c1917;--accent:#71717a;--ring:#ca8a04; /* ...and 12 more */}
.dark{--primary:#eab308;--primary-foreground:#18181b;--accent:#a1a1aa;--ring:#eab308; /* ...and 12 more */}
</style>\`

// GET /favicon.svg is registered ahead of this catch-all, so it
// short-circuits before the agent's own favicon ever gets proxied.

// The chat layout is sized with Tailwind's h-dvh directly, not a
// percentage from #root/<body> — so making room for a fixed footer means
// shrinking that specific class, not padding the body.
const FOOTER_HTML = \`<style>[class*="h-dvh"]{height:calc(100dvh - 32px)!important;}</style>
<div style="position:fixed;bottom:0;...">&copy; Kirkware Enterprises. All rights reserved.
Do not use prompts containing PII/PCI such as credit card numbers, employee IDs, etc.</div>\`

// Proxy every path at the root, transparently — /assets/*, /favicon.svg,
// WebSocket upgrades, all of it — so nothing the agent's own SPA expects
// ever breaks. Only HTML responses get the overrides spliced in.
app.use('/', createProxyMiddleware({
  target: AGENT_URL,
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || ''
    if (!contentType.includes('text/html')) return responseBuffer
    const html = responseBuffer.toString('utf8')
    return html.replace(/<body[^>]*>/i, (m) => \`\${m}\${THEME_OVERRIDE_CSS}\${FOOTER_HTML}\`)
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
    AGENT_URL: https://kirkwaregpt-agent.apps.tanzu.kirkware.net
  routes:
  - route: kirkwaregpt.apps.tanzu.kirkware.net`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push -f apps/kirkwaregpt-ui-wrapper/manifest.yml -p apps/kirkwaregpt-ui-wrapper`,
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
    id: 'ui-wrapper-roadmap',
    type: 'content',
    section: SECTION,
    title: 'What\'s next',
    heading: 'Native customization is coming in a future Tanzu Platform release',
    body: 'This wrapper is a real, deployable answer today — zero changes to the agent, live right now in `kirkware-gpt`. It\'s also a workaround for a gap that won\'t stay open forever: expanded branding and theming support for agent-hosted chat UIs is on the roadmap for a future major Tanzu Platform release, at which point re-skinning an agent\'s UI won\'t require standing up a second app in front of it.',
    callout: {
      label: 'Until then',
      tone: 'info',
      body: 'kirkwaregpt-ui-wrapper stays exactly as useful as it is today — under 40 lines of code, one extra `cf push`, and a fully re-branded chat experience with no dependency on that future release landing on any particular timeline.',
    },
  },
]
