---
section: UI Customization
---

## content: Branding the chat UI {#ui-wrapper-intro}
---
source: https://github.com/bkirkware/tanzuagent-ui-wrapper
---

### A branded reverse-proxy wrapper, deployed alongside the agent

The Agent Buildpack's chat UI has no theming hooks — no CSS override, no logo slot, no layout config. `tanzuagent-ui-wrapper` — a small, public, company-agnostic Node.js/Express template — solves that from the outside: it sits in front of the unmodified `kirkwaregpt` agent and re-brands everything a user actually sees. We deploy our own customized copy of it as `kirkwaregpt-ui-wrapper`, in the same `kirkware-gpt` space.

- icon:shield-check **Zero changes to the agent** — The agent_buildpack app, its `AGENTS.md`, its model binding — none of it changed. The wrapper is purely additive.
- icon:globe **One origin, transparently** — Every request — HTML, JS, CSS, WebSocket upgrades — proxies straight through to the real agent at the same path it asked for. No cross-origin cookie or CSP friction, because there's only ever one origin.
- icon:workflow **Response-body injection, not an iframe** — The branding is spliced directly into the agent's own HTML response via `http-proxy-middleware`'s `responseInterceptor`, keeping the browser on a single origin the whole time.

> [!info] What this does and doesn't do
> This is genuinely cheap to run — under 100 lines of code, no knowledge of the agent's internal API required. The trade-off is real too: it decorates the existing chat UI, it doesn't replace it. Everything past the injected theme, favicon, and footer notice still behaves like the stock buildpack UI underneath.

## command: Clone the template, drop in our branding {#ui-wrapper-prepare}
---
source: https://github.com/bkirkware/tanzuagent-ui-wrapper
---

### A public template, customized in three known places

The template's own README calls out exactly three constants to edit — `COMPANY_NAME`, `COMPANY_LOGO_SVG_BODY`, `THEME_OVERRIDE_CSS` — everything else (the proxy engine, the favicon route, the footer's layout fix) stays exactly as cloned.

```bash label=clone.sh live=kirkwaregpt-ui-wrapper-clone.sh
cd "$TEMP_WORKSPACE" && gh repo clone bkirkware/tanzuagent-ui-wrapper
```

```bash label=customize-server.sh live=kirkwaregpt-ui-wrapper-customize-server.sh
cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > server.js <<'EOF'
... (COMPANY_NAME -> 'Kirkware Enterprises', COMPANY_LOGO_SVG_BODY -> our SVG,
     THEME_OVERRIDE_CSS -> grey + yellow — see the template's own README for
     the full customization list. Everything else is unchanged.)
EOF
```

```bash label=customize-manifest.sh live=kirkwaregpt-ui-wrapper-create-manifest.sh
cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > manifest.yml <<'EOF'
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
EOF
```

## command: Push it {#ui-wrapper-push}

### One more `cf push`, into the same space as the agent

Run from the repo root, not `$TEMP_WORKSPACE/tanzuagent-ui-wrapper` — `-f` points at the manifest, `-p` points at the app bits. `-f` alone isn't enough: Cloud Foundry still looks for app bits in the current directory unless `-p` (or a `path:` in the manifest) says otherwise.

```bash label=push.sh live=kirkwaregpt-ui-wrapper-push.sh
cf push -f "$TEMP_WORKSPACE/tanzuagent-ui-wrapper/manifest.yml" -p "$TEMP_WORKSPACE/tanzuagent-ui-wrapper"
```

```bash label=app.sh live=kirkwaregpt-ui-wrapper-app.sh
cf app kirkwaregpt-ui-wrapper
```

## diagram: Request flow {#ui-wrapper-diagram}
---
diagram: kirkwaregpt-ui-wrapper-flow
visibleNodeIds:
  - browser
  - wrapper
  - agent
visibleEdgeIds:
  - e-browser-wrapper
  - e-wrapper-agent
activeNodeIds:
  - wrapper
---

### One browser origin, two Cloud Foundry apps

The browser never talks to `kirkwaregpt` directly — every request, at every path, lands on the wrapper first and proxies straight through to the real agent. The only place Kirkware's branding actually enters is a body-rewrite on HTML responses.

## content: What's next {#ui-wrapper-roadmap}

### Native customization is coming in a future Tanzu Platform release

This wrapper is a real, deployable answer today — zero changes to the agent, live right now in `kirkware-gpt`. It's also a workaround for a gap that won't stay open forever: expanded branding and theming support for agent-hosted chat UIs is on the roadmap for a future major Tanzu Platform release, at which point re-skinning an agent's UI won't require standing up a second app in front of it.

> [!info] Until then
> kirkwaregpt-ui-wrapper stays exactly as useful as it is today — a clone, a three-value edit, one extra `cf push`, and a fully re-branded chat experience with no dependency on that future release landing on any particular timeline.
