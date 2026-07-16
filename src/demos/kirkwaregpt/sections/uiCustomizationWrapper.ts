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

// The agent's UI is Tailwind v4 + shadcn/ui — its whole color scheme is
// ~20 CSS variables on :root/.dark. Redefining the base tokens (not the
// generated --color-* pass-throughs) recolors every .bg-primary /
// .text-accent / .ring usage in the app. destructive stays red on purpose.
const THEME_OVERRIDE_CSS = \`<style>
:root{--primary:#ca8a04;--primary-foreground:#1c1917;--accent:#71717a;--ring:#ca8a04; /* ...and 12 more */}
.dark{--primary:#eab308;--primary-foreground:#18181b;--accent:#a1a1aa;--ring:#eab308; /* ...and 12 more */}
</style>\`

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
    return html.replace(/<body[^>]*>/i, (m) => \`\${m}\${THEME_OVERRIDE_CSS}\${BANNER_HTML}\`)
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
    id: 'ui-wrapper-theme',
    type: 'content',
    section: SECTION,
    title: 'Further than expected: overriding the color scheme',
    heading: 'The agent\'s UI is Tailwind v4 + shadcn/ui — its whole palette is ~20 CSS variables',
    body: 'A quick look at the agent\'s actual stylesheet turned up good news: every color in the UI — backgrounds, text, buttons, borders, focus rings, in both light and dark mode — resolves through a small set of CSS custom properties on `:root` and `.dark` (`--primary`, `--accent`, `--background`, `--border`, `--ring`, and friends). Tailwind\'s generated utility classes (`.bg-primary`, `.text-accent`, `.ring-primary`, 18+ usages of `--color-primary` alone) all just pass through to these.',
    bullets: [
      { title: 'One more `<style>` block', icon: 'sparkles', description: 'The same `responseInterceptor` injection point already used for the banner now also injects a `:root{...}` / `.dark{...}` override, redefining the base tokens to grey + yellow instead of the agent\'s stock blue.' },
      { title: 'Cascade does the rest', icon: 'shield-check', description: 'Because the override is a same-specificity `:root` rule injected *after* the agent\'s own linked stylesheet in document order, normal CSS cascade rules mean it wins — no `!important`, no touching the agent, no guessing at class names.' },
      { title: 'destructive/-foreground left alone', icon: 'shield', description: 'Error states stay red on purpose — recoloring semantic status colors to match a brand palette is usually the wrong call, even when it\'s technically just as easy.' },
      { title: 'Favicon and logo, the same way', icon: 'sparkles', description: 'A dedicated `GET /favicon.svg` route — registered ahead of the catch-all proxy, so it short-circuits before the agent\'s own favicon ever gets proxied — serves Kirkware\'s own mark instead. The same inline SVG doubles as the banner\'s logo, so both match exactly.' },
    ],
    callout: {
      label: 'Result',
      tone: 'success',
      body: 'Confirmed live: `kirkwaregpt-ui-wrapper.apps.tanzu.kirkware.net` now serves the override block ahead of the agent\'s `#root` mount point, redefining `--primary`/`--ring` to `#ca8a04` (light) / `#eab308` (dark) and `--accent` to a neutral grey — a full grey-and-yellow re-theme of the agent\'s own UI. The favicon and banner logo are Kirkware\'s own SVG mark, confirmed byte-for-byte different from the agent\'s original. All of it with zero changes to the agent itself.',
    },
  },
  {
    id: 'ui-wrapper-question',
    type: 'question',
    section: SECTION,
    title: 'Where does this fall short?',
    prompt: 'Colors turned out to be fully reachable. What\'s still out of this option\'s reach *inside* the chat experience?',
    hints: [
      'Layout, spacing, component structure, copy — anything not expressed as a CSS variable is still the stock buildpack UI',
      'This override is only as durable as the agent\'s variable names — if a future buildpack version renames --primary or drops the shadcn convention entirely, the override silently stops working',
      'If the real requirement goes beyond "our brand colors" to "our actual product," Option B — the fully custom frontend — is the honest next step',
    ],
  },
]
