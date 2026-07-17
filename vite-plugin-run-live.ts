import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'
import { loadDotEnvForShell, upsertEnvVars } from './env-file-utils.ts'

/**
 * Dev-server-only endpoint that executes a fixed, hardcoded shell command
 * identified by `id` — the browser can only pick from this list, never send
 * command text itself, so tampering with the client can't turn this into
 * arbitrary remote code execution. Only wired up under `vite dev`, and only
 * reachable when the dev server is bound to localhost (the default; do not
 * run this with `--host` on an untrusted network).
 *
 * The project's .env file (managed by the Settings screen) is re-read and
 * merged into every command's environment on every run, so editing and
 * saving Settings takes effect immediately without restarting the dev
 * server.
 *
 * A handful of commands populate `capturedEnv` (see `captures` below) —
 * credentials pulled from a real `cf service-key` response — which is then
 * merged into the environment of every subsequent live command, so a later
 * step's `curl ... "$OPENAI_API_BASE/v1/models"` resolves against real
 * values without the browser ever seeing or handling the actual secret.
 *
 * A different handful (see `envOverrides` below) instead write straight to
 * the real .env file before running — so the change shows up in Settings
 * and in every variable-hover preview across the app, not just later live
 * commands in this session.
 */
interface CommandDef {
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

const ALLOWED_COMMANDS: Record<string, CommandDef> = {
  'marketplace.sh': { command: 'cf marketplace -e ai-models' },
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
  'kirkwaregpt-delete-postgres.sh': { command: 'cf delete-service kirkwaregpt-db -f --wait' },
  'kirkwaregpt-delete-mcp-gateway.sh': { command: 'cf delete-service kirkwaregpt-mcp-gateway -f --wait' },
  'kirkwaregpt-delete-oauth-ups.sh': { command: 'cf delete-service github-mcp-oauth -f' },
  'kirkwaregpt-delete-mcp-server-ups.sh': { command: 'cf delete-service github-mcp -f' },
  'kirkwaregpt-clean-workspace.sh': { command: 'rm -rf "$TEMP_WORKSPACE/kirkwaregpt"' },
}

const TIMEOUT_MS = 300_000

/** In-memory only — resets on dev server restart. Never sent verbatim to the browser except as part of a `capturedVars` name list. */
const capturedEnv: Record<string, string> = {}

export function runLivePlugin(): Plugin {
  return {
    name: 'run-live',
    configureServer(server) {
      server.middlewares.use('/api/run-live', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          let id: unknown
          try {
            id = JSON.parse(body || '{}').id
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
            return
          }

          const def = typeof id === 'string' ? ALLOWED_COMMANDS[id] : undefined
          if (!def) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Unknown or disallowed command id: ${String(id)}` }))
            return
          }

          const missing = def.requiredEnv?.filter((key) => !capturedEnv[key])
          if (missing && missing.length > 0) {
            res.statusCode = 412
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: `Missing ${missing.join(', ')} — run "service-key.sh" live first to capture credentials for this step.`,
              }),
            )
            return
          }

          if (def.envOverrides) {
            upsertEnvVars(def.envOverrides)
          }

          // Streamed as newline-delimited JSON events rather than one
          // buffered response, so a long-running command (cf push, cf
          // restage) shows output as it happens instead of going silent
          // until it exits or times out.
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/x-ndjson')
          res.flushHeaders()

          function send(event: Record<string, unknown>) {
            res.write(JSON.stringify(event) + '\n')
          }

          const child = spawn(def.command, {
            shell: '/bin/bash',
            env: { ...process.env, ...loadDotEnvForShell(), ...capturedEnv },
          })

          // Commands with a `captures` function (they print raw credentials,
          // e.g. `cf service-key`) are never streamed live — their output is
          // buffered and redacted exactly like before, then sent as a single
          // stdout/stderr event right before `exit`. Everything else streams
          // chunk-by-chunk as it's produced.
          let stdoutBuf = ''
          let stderrBuf = ''
          let timedOut = false
          let spawnFailed = false

          const timer = setTimeout(() => {
            timedOut = true
            child.kill()
          }, TIMEOUT_MS)

          child.stdout.on('data', (chunk: Buffer) => {
            const text = chunk.toString('utf-8')
            if (def.captures) {
              stdoutBuf += text
            } else {
              send({ type: 'stdout', data: text })
            }
          })

          child.stderr.on('data', (chunk: Buffer) => {
            const text = chunk.toString('utf-8')
            stderrBuf += text
            if (!def.captures) {
              send({ type: 'stderr', data: text })
            }
          })

          child.on('error', () => {
            spawnFailed = true
          })

          child.on('close', (code) => {
            clearTimeout(timer)

            let capturedVars: string[] | undefined
            if (def.captures && !spawnFailed && !timedOut && code === 0) {
              const captured = def.captures(stdoutBuf)
              if (captured) {
                Object.assign(capturedEnv, captured)
                capturedVars = Object.keys(captured)
                // Never echo captured secrets back to the browser — they're
                // used server-side for later live commands, but this output
                // may be on screen in front of an audience.
                for (const [key, value] of Object.entries(captured)) {
                  if (key.toLowerCase().includes('key') && value.length > 16) {
                    const redacted = `${value.slice(0, 10)}…redacted…${value.slice(-6)}`
                    stdoutBuf = stdoutBuf.split(value).join(redacted)
                  }
                }
              }
            }

            if (def.captures) {
              if (stdoutBuf) send({ type: 'stdout', data: stdoutBuf })
              if (stderrBuf) send({ type: 'stderr', data: stderrBuf })
            }

            send({
              type: 'exit',
              exitCode: spawnFailed ? 1 : code ?? 1,
              timedOut,
              capturedVars,
              envUpdated: def.envOverrides ? Object.keys(def.envOverrides) : undefined,
            })
            res.end()
          })
        })
      })
    },
  }
}
