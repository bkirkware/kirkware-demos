import type { DemoStep } from '@/types/demo'

const SECTION = 'UI Customization'

export const uiCustomizationSteps: DemoStep[] = [
  {
    id: 'ui-wrapper-intro',
    type: 'content',
    section: SECTION,
    title: 'Branding the chat UI',
    heading: 'A branded reverse-proxy wrapper, deployed alongside the agent',
    body: 'The Agent Buildpack\'s chat UI has no theming hooks — no CSS override, no logo slot, no layout config. `tanzuagent-ui-wrapper` — a small, public, company-agnostic Node.js/Express template — solves that from the outside: it sits in front of the unmodified `kirkwaregpt` agent and re-brands everything a user actually sees. We deploy our own customized copy of it as `kirkwaregpt-ui-wrapper`, in the same `kirkware-gpt` space.',
    bullets: [
      { title: 'Zero changes to the agent', icon: 'shield-check', description: 'The agent_buildpack app, its `AGENTS.md`, its model binding — none of it changed. The wrapper is purely additive.' },
      { title: 'One origin, transparently', icon: 'globe', description: 'Every request — HTML, JS, CSS, WebSocket upgrades — proxies straight through to the real agent at the same path it asked for. No cross-origin cookie or CSP friction, because there\'s only ever one origin.' },
      { title: 'Response-body injection, not an iframe', icon: 'workflow', description: 'The branding is spliced directly into the agent\'s own HTML response via `http-proxy-middleware`\'s `responseInterceptor`, keeping the browser on a single origin the whole time.' },
    ],
    callout: {
      label: 'What this does and doesn\'t do',
      tone: 'info',
      body: 'This is genuinely cheap to run — under 100 lines of code, no knowledge of the agent\'s internal API required. The trade-off is real too: it decorates the existing chat UI, it doesn\'t replace it. Everything past the injected theme, favicon, and footer notice still behaves like the stock buildpack UI underneath.',
    },
    sourceUrl: 'https://github.com/bkirkware/tanzuagent-ui-wrapper',
  },
  {
    id: 'ui-wrapper-prepare',
    type: 'command',
    section: SECTION,
    title: 'Clone the template, drop in our branding',
    heading: 'A public template, customized in three known places',
    description: 'The template\'s own README calls out exactly three constants to edit — `COMPANY_NAME`, `COMPANY_LOGO_SVG_BODY`, `THEME_OVERRIDE_CSS` — everything else (the proxy engine, the favicon route, the footer\'s layout fix) stays exactly as cloned.',
    commands: [
      {
        label: 'clone.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE" && gh repo clone bkirkware/tanzuagent-ui-wrapper`,
        liveId: 'kirkwaregpt-ui-wrapper-clone.sh',
      },
      {
        label: 'customize-server.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > server.js <<'EOF'
... (COMPANY_NAME -> 'Kirkware Enterprises', COMPANY_LOGO_SVG_BODY -> our SVG,
     THEME_OVERRIDE_CSS -> grey + yellow — see the template's own README for
     the full customization list. Everything else is unchanged.)
EOF`,
        liveId: 'kirkwaregpt-ui-wrapper-customize-server.sh',
      },
      {
        label: 'customize-manifest.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > manifest.yml <<'EOF'
applications:
- name: kirkwaregpt-ui-wrapper
  buildpacks:
  - nodejs_buildpack
  memory: 256M
  instances: 1
  env:
    AGENT_URL: https://kirkwaregpt-agent.apps.tanzu.kirkware.net
  routes:
  - route: kirkwaregpt.apps.tanzu.kirkware.net
EOF`,
        liveId: 'kirkwaregpt-ui-wrapper-create-manifest.sh',
      },
    ],
    sourceUrl: 'https://github.com/bkirkware/tanzuagent-ui-wrapper',
  },
  {
    id: 'ui-wrapper-push',
    type: 'command',
    section: SECTION,
    title: 'Push it',
    heading: 'One more `cf push`, into the same space as the agent',
    description: 'Run from the repo root, not `$TEMP_WORKSPACE/tanzuagent-ui-wrapper` — `-f` points at the manifest, `-p` points at the app bits. `-f` alone isn\'t enough: Cloud Foundry still looks for app bits in the current directory unless `-p` (or a `path:` in the manifest) says otherwise.',
    commands: [
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push -f "$TEMP_WORKSPACE/tanzuagent-ui-wrapper/manifest.yml" -p "$TEMP_WORKSPACE/tanzuagent-ui-wrapper"`,
        liveId: 'kirkwaregpt-ui-wrapper-push.sh',
      },
      {
        label: 'app.sh',
        lang: 'bash',
        code: `cf app kirkwaregpt-ui-wrapper`,
        liveId: 'kirkwaregpt-ui-wrapper-app.sh',
      },
    ],
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
      body: 'kirkwaregpt-ui-wrapper stays exactly as useful as it is today — a clone, a three-value edit, one extra `cf push`, and a fully re-branded chat experience with no dependency on that future release landing on any particular timeline.',
    },
  },
]
