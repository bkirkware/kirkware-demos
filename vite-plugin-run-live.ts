import type { Plugin } from 'vite'
import { exec } from 'node:child_process'
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
}

const TIMEOUT_MS = 20_000

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

          exec(
            def.command,
            { timeout: TIMEOUT_MS, shell: '/bin/bash', env: { ...process.env, ...loadDotEnvForShell(), ...capturedEnv } },
            (error, rawStdout, stderr) => {
              let stdout = rawStdout
              let capturedVars: string[] | undefined
              if (def.captures && !error) {
                const captured = def.captures(stdout)
                if (captured) {
                  Object.assign(capturedEnv, captured)
                  capturedVars = Object.keys(captured)
                  // Never echo captured secrets back to the browser — they're
                  // used server-side for later live commands, but this output
                  // may be on screen in front of an audience.
                  for (const [key, value] of Object.entries(captured)) {
                    if (key.toLowerCase().includes('key') && value.length > 16) {
                      const redacted = `${value.slice(0, 10)}…redacted…${value.slice(-6)}`
                      stdout = stdout.split(value).join(redacted)
                    }
                  }
                }
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  command: def.command,
                  stdout,
                  stderr,
                  exitCode: error ? error.code ?? 1 : 0,
                  timedOut: Boolean(error && error.killed),
                  capturedVars,
                  envUpdated: def.envOverrides ? Object.keys(def.envOverrides) : undefined,
                }),
              )
            },
          )
        })
      })
    },
  }
}
