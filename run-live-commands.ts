/**
 * The full allowlist of "Run Live" commands, keyed by the `liveId` a demo's
 * command block references. Shared between the dev-server endpoint
 * (vite-plugin-run-live.ts) and the content pipeline's validator, so an
 * unknown `live=` id in a demo's markdown fails at build/dev time instead of
 * 404ing during a presentation.
 */
export interface CommandDef {
  command: string
  /** Env vars this command needs already captured (e.g. from service-key.sh) before it's safe to run. */
  requiredEnv?: string[]
  /** After running, parse stdout and capture these into capturedEnv for later commands. */
  captures?: (stdout: string) => Record<string, string> | null
  /** Written into .env (upserted, preserving everything else) before this command runs. */
  envOverrides?: Record<string, string>
}

function captureServiceKeyCredentials(stdout: string): Record<string, string> | null {
  const start = stdout.indexOf('{')
  if (start === -1) return null
  try {
    const parsed = JSON.parse(stdout.slice(start))
    const endpoint = parsed?.credentials?.endpoint
    if (!endpoint) return null
    const out: Record<string, string> = {}
    if (endpoint.api_key) out.API_KEY = endpoint.api_key
    if (endpoint.api_base) out.API_BASE = endpoint.api_base
    if (endpoint.openai_api_base) out.OPENAI_API_BASE = endpoint.openai_api_base
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

function captureQwenServiceKeyCredentials(stdout: string): Record<string, string> | null {
  const start = stdout.indexOf('{')
  if (start === -1) return null
  try {
    const parsed = JSON.parse(stdout.slice(start))
    const endpoint = parsed?.credentials?.endpoint
    if (!endpoint) return null
    const out: Record<string, string> = {}
    if (endpoint.anthropic_api_base) out.QWEN_ANTHROPIC_BASE_URL = endpoint.anthropic_api_base
    if (endpoint.api_key) out.QWEN_ANTHROPIC_API_KEY = endpoint.api_key
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

const SDK_LIST_JAVA_SCRIPT = ['source "$HOME/.sdkman/bin/sdkman-init.sh"', 'sdk list java'].join('\n')

const ENV_CHECK_SCRIPT = [
  'set -a',
  'source .env 2>/dev/null',
  'set +a',
  "while IFS='=' read -r key _; do",
  '  case "$key" in \'\'|\'#\'*) continue;; esac',
  '  echo "$key=${!key}"',
  'done < .env',
].join('\n')

const KIRKWAREGPT_CREATE_AGENTS_MD_SCRIPT = [
  'cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > AGENTS.md <<\'EOF\'',
  'You are KirkwareGPT, an internal engineering assistant for Kirkware.',
  "Answer questions concisely and accurately, grounded in Kirkware's own",
  "runbooks and documentation whenever they're available to you.",
  'When you have access to tools, use them to provide better answers.',
  'EOF',
].join('\n')

const KIRKWAREGPT_CREATE_MANIFEST_SCRIPT = [
  'cd "$TEMP_WORKSPACE/kirkwaregpt" && cat > manifest.yaml <<\'EOF\'',
  'applications:',
  '- name: kirkwaregpt',
  '  buildpacks:',
  '  - agent_buildpack',
  '  routes:',
  '  - route: kirkwaregpt-agent.apps.tanzu.kirkware.net',
  'EOF',
].join('\n')

// Overwrites the cloned tanzuagent-ui-wrapper/server.js with Kirkware's
// own values for the three constants the template's README calls out as
// customization points (COMPANY_NAME, COMPANY_LOGO_SVG_BODY,
// THEME_OVERRIDE_CSS) — everything else (the proxy engine, the favicon
// route, the footer's h-dvh layout fix) is the template's own code,
// untouched. Uses a quoted heredoc ('EOF') specifically because the file
// contains template-literal backticks and ${...} interpolation that must
// land in server.js as literal characters, not get evaluated by bash.
const KIRKWAREGPT_UI_WRAPPER_CUSTOMIZE_SERVER_SCRIPT = [
  'cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > server.js <<\'EOF\'',
  "const express = require('express')",
  "const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware')",
  '',
  '// Required — the URL of the Agent Buildpack app this wrapper fronts. No',
  '// fallback on purpose: silently defaulting to someone else\'s agent is',
  '// worse than a fast, obvious startup failure.',
  'const AGENT_URL = process.env.AGENT_URL',
  'if (!AGENT_URL) {',
  "  console.error('AGENT_URL is required — set it to the URL of the agent this wrapper proxies to.')",
  '  process.exit(1)',
  '}',
  'const PORT = process.env.PORT || 8080',
  '',
  "// Shown in the injected footer's copyright line.",
  "const COMPANY_NAME = 'Kirkware Enterprises'",
  '',
  "// Kirkware's own logo mark as inline SVG body content — reused both as",
  "// the footer's icon and as the overridden /favicon.svg, so there's only",
  '// one place to edit.',
  'const COMPANY_LOGO_SVG_BODY =',
  '  \'<path d="m32 2c-16.568 0-30 13.432-30 30s13.432 30 30 30 30-13.432 30-30-13.432-30-30-30m6.016 44.508l-8.939-12.666-2.922 2.961v9.705h-5.963v-29.016h5.963v11.955l11.211-11.955h7.836l-11.909 11.934 12.518 17.082h-7.795" fill="#fdd835"/>\'',
  'const COMPANY_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${COMPANY_LOGO_SVG_BODY}</svg>`',
  '',
  '// The Agent Buildpack\'s chat UI (as of this writing) is Tailwind v4 +',
  '// shadcn/ui, whose entire color scheme is centralized in these CSS custom',
  '// properties on :root/.dark — Tailwind\'s generated --color-* utility',
  '// classes just pass through to these, so overriding the base tokens',
  '// recolors every .bg-primary / .text-accent / .border / .ring usage in the',
  '// app without touching its own stylesheet. Leave --destructive and',
  '// --destructive-foreground alone — error states should stay red',
  '// regardless of brand color. The values below are Kirkware\'s own',
  '// palette — grey neutrals with a yellow accent.',
  'const THEME_OVERRIDE_CSS = `',
  '<style>',
  ':root{--background:#fafafa;--foreground:#52525b;--card:#fff;--card-foreground:#52525b;--popover:#fff;--popover-foreground:#52525b;--primary:#ca8a04;--primary-foreground:#1c1917;--secondary:#f4f4f5;--secondary-foreground:#52525b;--muted:#f4f4f5;--muted-foreground:#71717a;--accent:#71717a;--accent-foreground:#fff;--warning:#eab308;--warning-foreground:#1c1917;--muted-hover:#e4e4e7;--border:#d4d4d8;--input:#d4d4d8;--ring:#ca8a04}',
  '.dark{--background:#18181b;--foreground:#e4e4e7;--card:#27272a;--card-foreground:#e4e4e7;--popover:#27272a;--popover-foreground:#e4e4e7;--primary:#eab308;--primary-foreground:#18181b;--secondary:#27272a;--secondary-foreground:#e4e4e7;--muted:#27272a;--muted-foreground:#a1a1aa;--accent:#a1a1aa;--accent-foreground:#18181b;--warning:#eab308;--warning-foreground:#18181b;--muted-hover:#3f3f46;--border:#3f3f46;--input:#3f3f46;--ring:#eab308}',
  '</style>`',
  '',
  '// The chat layout\'s outer container is sized with Tailwind\'s `h-dvh`',
  '// utility directly (a real viewport unit), not a percentage inherited from',
  '// #root or <body> — so making room for a fixed footer means shrinking',
  '// that specific class, not padding the body. If a future buildpack',
  '// version changes this layout class, re-verify this selector still',
  '// matches (inspect the DOM, don\'t just trust it still works).',
  'const FOOTER_HTML = `',
  '<style>[class*="h-dvh"]{height:calc(100dvh - 32px)!important;}</style>',
  '<div style="position:fixed;bottom:0;left:0;right:0;height:32px;z-index:999999;display:flex;align-items:center;justify-content:center;padding:0 16px;background:#18181b;border-top:1px solid #3f3f46;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">',
  '  <span style="color:#a1a1aa;font-size:11px;text-align:center;">&copy; ${COMPANY_NAME}. All rights reserved. Do not use prompts containing PII/PCI such as credit card numbers, employee IDs, etc.</span>',
  '</div>`',
  '',
  'const app = express()',
  '',
  '// Registered before the catch-all proxy below, so this short-circuits the',
  '// agent\'s own /favicon.svg instead of it ever reaching the proxy — the',
  '// agent\'s HTML still references the same href, it just resolves to ours.',
  "app.get('/favicon.svg', (req, res) => {",
  '  res.type(\'image/svg+xml\').send(COMPANY_FAVICON_SVG)',
  '})',
  '',
  '// The agent\'s own chat UI is a Vite SPA that references its JS/CSS at',
  '// root-absolute paths (e.g. /assets/index-*.js). An iframe pointed at a',
  '// path-prefixed proxy (like /agent/) breaks those references, since the',
  '// browser requests them relative to the iframe\'s own origin, not the',
  '// prefix. Proxying transparently at the root sidesteps that entirely —',
  '// every path the agent expects just resolves correctly — and branding is',
  '// injected directly into the proxied HTML instead of wrapping it in an',
  '// iframe.',
  'app.use(',
  "  '/',",
  '  createProxyMiddleware({',
  '    target: AGENT_URL,',
  '    changeOrigin: true,',
  '    ws: true,',
  '    selfHandleResponse: true,',
  '    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {',
  "      const contentType = proxyRes.headers['content-type'] || ''",
  "      if (!contentType.includes('text/html')) return responseBuffer",
  "      const html = responseBuffer.toString('utf8')",
  '      return html.replace(/<body[^>]*>/i, (match) => `${match}${THEME_OVERRIDE_CSS}${FOOTER_HTML}`)',
  '    }),',
  '  }),',
  ')',
  '',
  'app.listen(PORT, () => {',
  '  console.log(`kirkwaregpt-ui-wrapper listening on ${PORT}, proxying to ${AGENT_URL}`)',
  '})',
  'EOF',
].join('\n')

const KIRKWAREGPT_UI_WRAPPER_CREATE_MANIFEST_SCRIPT = [
  'cd "$TEMP_WORKSPACE/tanzuagent-ui-wrapper" && cat > manifest.yml <<\'EOF\'',
  'applications:',
  '- name: kirkwaregpt-ui-wrapper',
  '  buildpacks:',
  '  - nodejs_buildpack',
  '  memory: 256M',
  '  instances: 1',
  '  env:',
  '    AGENT_URL: https://kirkwaregpt-agent.apps.tanzu.kirkware.net',
  '  routes:',
  '  - route: kirkwaregpt.apps.tanzu.kirkware.net',
  'EOF',
].join('\n')

const KIRKWAREGPT_CREATE_GITHUB_MCP_MANIFEST_SCRIPT = [
  'cd "$TEMP_WORKSPACE/github-mcp-server" && cat > github-mcp-manifest.yaml <<EOF',
  'applications:',
  '  - name: github-mcp',
  '    instances: 1',
  '    memory: 124M',
  '    buildpacks:',
  '      - go_buildpack',
  '    env:',
  '      GO_INSTALL_PACKAGE_SPEC: github.com/github/github-mcp-server/cmd/github-mcp-server/',
  '    command: "bin/github-mcp-server --port 8080 --gh-host ${GITHUB_HOST:-github.com} http"',
  '    routes:',
  '    - route: github-mcp.apps.internal',
  'EOF',
].join('\n')

const KIRKWAREGPT_CREATE_OAUTH_UPS_SCRIPT = [
  'cf create-user-provided-service github-mcp-oauth \\',
  "-p '{",
  '  "authorization_endpoint": "https://github.com/login/oauth/authorize",',
  '  "token_endpoint": "https://github.com/login/oauth/access_token",',
  '  "client_id": "\'"$GIT_MCP_OAUTH_CLIENT_ID"\'",',
  '  "client_secret": "\'"$GIT_MCP_OAUTH_CLIENT_SECRET"\'",',
  '  "scopes": ["repo", "read:user"],',
  '  "issuer": "https://github.com/login/oauth"',
  "}'",
].join('\n')

const KIRKWAREGPT_BIND_GATEWAY_SCRIPT = [
  'cf bind-service github-mcp kirkwaregpt-mcp-gateway \\',
  "-c '{",
  '  "auth": {',
  '    "service-instance": {',
  '      "type": "OAUTH",',
  '      "name": "github-mcp-oauth"',
  '    }',
  '  }',
  "}' --wait",
].join('\n')

export const ALLOWED_COMMANDS: Record<string, CommandDef> = {
  'marketplace.sh': { command: 'cf marketplace -e ai-models' },
  'cleanup-ai-service-key.sh': {
    command: 'cf delete-service-key kirkware-all-models kirkware-all-models -f',
  },
  'cleanup-ai-service.sh': {
    command: 'cf delete-service kirkware-all-models -f --wait',
  },
  'service-key.sh': {
    command: 'cf service-key kirkware-all-models kirkware-all-models',
    captures: captureServiceKeyCredentials,
  },
  'list-models.sh': {
    command: 'curl -sS -H "Authorization: Bearer $API_KEY" "$OPENAI_API_BASE/v1/models"',
    requiredEnv: ['API_KEY', 'OPENAI_API_BASE'],
  },
  'env-check.sh': { command: ENV_CHECK_SCRIPT },
  'cf-target.sh': { command: 'cf target -o "$CF_ORG" -s "$CF_SPACE"' },
  'cf-login.sh': {
    // `< /dev/null` forces an immediate, deterministic EOF on the "Select a
    // space" prompt — Node's exec() leaves the child's stdin open-but-idle
    // rather than closed, which otherwise makes the CF CLI treat the prompt
    // as an error (exit 255) instead of skipping it cleanly (exit 0).
    command: 'cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null',
  },
  'set-cf-space-app-advisor.sh': {
    command: 'export CF_SPACE=kwd-app-advisor && echo $CF_SPACE',
    envOverrides: { CF_SPACE: 'kwd-app-advisor' },
  },
  'set-cf-space-app-assessment.sh': {
    command: 'export CF_SPACE=kwd-app-assessment && echo $CF_SPACE',
    envOverrides: { CF_SPACE: 'kwd-app-assessment' },
  },
  'cf-ensure-space.sh': {
    command: 'cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"',
  },
  'sdk-list-java.sh': { command: SDK_LIST_JAVA_SCRIPT },
  'set-cf-space-coding-agents.sh': {
    command: 'export CF_SPACE=coding-agents && echo $CF_SPACE',
    envOverrides: { CF_SPACE: 'coding-agents' },
  },
  'set-cf-space-petclinic.sh': {
    command: 'export CF_SPACE=petclinic && echo $CF_SPACE',
    envOverrides: { CF_SPACE: 'petclinic' },
  },
  'cf-ensure-qwen-service.sh': {
    command: 'cf service anthropic-qwen-model || cf create-service ai-models anthropic-qwen3.6 anthropic-qwen-model --wait',
  },
  'cf-ensure-qwen-service-key.sh': {
    command:
      'cf service-key anthropic-qwen-model anthropic-qwen-model-key >/dev/null 2>&1 || cf create-service-key anthropic-qwen-model anthropic-qwen-model-key',
  },
  'cf-show-qwen-service-key.sh': {
    command: 'cf service-key anthropic-qwen-model anthropic-qwen-model-key',
    captures: captureQwenServiceKeyCredentials,
  },
  'set-cf-space-kirkwaregpt.sh': {
    command: 'export CF_SPACE=kirkware-gpt && echo $CF_SPACE',
    envOverrides: { CF_SPACE: 'kirkware-gpt' },
  },
  'marketplace-mcp-gateway.sh': { command: 'cf marketplace -e mcp-gateway' },
  'marketplace-postgres.sh': { command: 'cf marketplace -e postgres' },
  'cf-apps.sh': { command: 'cf apps' },
  'cf-services.sh': { command: 'cf services' },
  'cf-ensure-kirkwaregpt-model.sh': {
    command: 'cf service kirkwaregpt-model || cf create-service ai-models kirkware-all-models kirkwaregpt-model --wait',
  },
  'cf-ensure-mcp-gateway.sh': {
    command: 'cf service kirkwaregpt-mcp-gateway || cf create-service mcp-gateway gateway kirkwaregpt-mcp-gateway --wait',
  },
  'cf-show-mcp-gateway.sh': { command: 'cf service kirkwaregpt-mcp-gateway' },
  'kirkwaregpt-mkdir.sh': { command: 'mkdir -p "$TEMP_WORKSPACE/kirkwaregpt"' },
  'kirkwaregpt-create-agents-md.sh': { command: KIRKWAREGPT_CREATE_AGENTS_MD_SCRIPT },
  'kirkwaregpt-create-manifest.sh': { command: KIRKWAREGPT_CREATE_MANIFEST_SCRIPT },
  'kirkwaregpt-push.sh': { command: 'cd "$TEMP_WORKSPACE/kirkwaregpt" && cf push kirkwaregpt' },
  'kirkwaregpt-app.sh': { command: 'cf app kirkwaregpt' },
  'kirkwaregpt-bind-model.sh': { command: 'cf bind-service kirkwaregpt kirkwaregpt-model --wait' },
  'kirkwaregpt-restage.sh': { command: 'cf restage kirkwaregpt' },
  'kirkwaregpt-ensure-postgres.sh': {
    command: 'cf service kirkwaregpt-db || cf create-service postgres "$POSTGRES_PLAN" kirkwaregpt-db --wait',
  },
  'kirkwaregpt-bind-postgres.sh': { command: 'cf bind-service kirkwaregpt kirkwaregpt-db --wait' },
  'presidio-push.sh': {
    command: 'cf push -f apps/presidio-content-filter/manifest.yml -p apps/presidio-content-filter',
  },
  'presidio-healthz.sh': { command: 'curl -s https://presidio.apps.tanzu.kirkware.net/healthz' },
  'presidio-analyze.sh': {
    command:
      'curl -s -X POST https://presidio.apps.tanzu.kirkware.net/analyze -H "Content-Type: application/json" -d \'{"text":"My SSN is 459-52-3861 and my card number is 4532015112830366."}\'',
  },
  'kirkwaregpt-ensure-pci-model.sh': {
    command: 'cf service kirkwaregpt-pci-model || cf create-service ai-models kirkware-all-models-pci kirkwaregpt-pci-model --wait',
  },
  'kirkwaregpt-unbind-model.sh': { command: 'cf unbind-service kirkwaregpt kirkwaregpt-model' },
  'kirkwaregpt-bind-pci-model.sh': { command: 'cf bind-service kirkwaregpt kirkwaregpt-pci-model --wait' },
  'kirkwaregpt-send-fake-card.sh': {
    command:
      'curl -s -N -X POST https://kirkwaregpt-agent.apps.tanzu.kirkware.net/api/chat -H "Content-Type: application/json" -d \'{"id":"cc-test","messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"My credit card number is 4532015112830366, please repeat it back to me exactly."}]}],"trigger":"submit-message"}\' | grep -o \'"delta":"[^"]*"\' | sed -E \'s/"delta":"(.*)"/\\1/\' | tr -d \'\\n\'',
  },
  'kirkwaregpt-ui-wrapper-clone.sh': {
    command: 'cd "$TEMP_WORKSPACE" && gh repo clone bkirkware/tanzuagent-ui-wrapper',
  },
  'kirkwaregpt-ui-wrapper-customize-server.sh': { command: KIRKWAREGPT_UI_WRAPPER_CUSTOMIZE_SERVER_SCRIPT },
  'kirkwaregpt-ui-wrapper-create-manifest.sh': { command: KIRKWAREGPT_UI_WRAPPER_CREATE_MANIFEST_SCRIPT },
  'kirkwaregpt-ui-wrapper-push.sh': {
    command: 'cf push -f "$TEMP_WORKSPACE/tanzuagent-ui-wrapper/manifest.yml" -p "$TEMP_WORKSPACE/tanzuagent-ui-wrapper"',
  },
  'kirkwaregpt-ui-wrapper-app.sh': { command: 'cf app kirkwaregpt-ui-wrapper' },
  'kirkwaregpt-ui-wrapper-delete.sh': { command: 'cf delete kirkwaregpt-ui-wrapper -f' },
  'kirkwaregpt-ui-wrapper-clean-workspace.sh': { command: 'rm -rf "$TEMP_WORKSPACE/tanzuagent-ui-wrapper"' },
  'kirkwaregpt-clone-github-mcp.sh': {
    command: 'cd "$TEMP_WORKSPACE" && gh repo clone github/github-mcp-server && cd github-mcp-server && git checkout v0.33.1',
  },
  'kirkwaregpt-create-github-mcp-manifest.sh': { command: KIRKWAREGPT_CREATE_GITHUB_MCP_MANIFEST_SCRIPT },
  'kirkwaregpt-push-github-mcp.sh': {
    command: 'cd "$TEMP_WORKSPACE/github-mcp-server" && cf push -f github-mcp-manifest.yaml',
  },
  'kirkwaregpt-create-oauth-ups.sh': { command: KIRKWAREGPT_CREATE_OAUTH_UPS_SCRIPT },
  'kirkwaregpt-bind-github-mcp-gateway.sh': { command: KIRKWAREGPT_BIND_GATEWAY_SCRIPT },
  'kirkwaregpt-restage-github-mcp.sh': { command: 'cf restage github-mcp' },
  'kirkwaregpt-create-mcp-ups.sh': {
    command: 'cf create-user-provided-service github-mcp -p \'{"url": "https://kirkwaregpt-mcp-gateway.apps.tanzu.kirkware.net/github-mcp/mcp"}\' -t mcp-server',
  },
  'kirkwaregpt-bind-github-mcp-agent.sh': { command: 'cf bind-service kirkwaregpt github-mcp --wait' },
  'kirkwaregpt-delete-agent.sh': { command: 'cf delete kirkwaregpt -f' },
  'kirkwaregpt-delete-github-mcp.sh': { command: 'cf delete github-mcp -f' },
  'kirkwaregpt-delete-model.sh': { command: 'cf delete-service kirkwaregpt-model -f --wait' },
  'kirkwaregpt-delete-pci-model.sh': { command: 'cf delete-service kirkwaregpt-pci-model -f --wait' },
  'presidio-delete.sh': { command: 'cf delete presidio-content-filter -f' },
  'kirkwaregpt-delete-postgres.sh': { command: 'cf delete-service kirkwaregpt-db -f --wait' },
  'kirkwaregpt-delete-mcp-gateway.sh': { command: 'cf delete-service kirkwaregpt-mcp-gateway -f --wait' },
  'kirkwaregpt-delete-oauth-ups.sh': { command: 'cf delete-service github-mcp-oauth -f' },
  'kirkwaregpt-delete-mcp-server-ups.sh': { command: 'cf delete-service github-mcp -f' },
  'kirkwaregpt-clean-workspace.sh': { command: 'rm -rf "$TEMP_WORKSPACE/kirkwaregpt"' },
}
