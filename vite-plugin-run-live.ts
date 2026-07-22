import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'
import { loadDotEnvForShell, upsertEnvVars } from './env-file-utils.ts'
import { ALLOWED_COMMANDS } from './run-live-commands.ts'

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
 * A handful of commands populate `capturedEnv` (see `captures` in
 * run-live-commands.ts) —
 * credentials pulled from a real `cf service-key` response — which is then
 * merged into the environment of every subsequent live command, so a later
 * step's `curl ... "$OPENAI_API_BASE/v1/models"` resolves against real
 * values without the browser ever seeing or handling the actual secret.
 *
 * A different handful (see `envOverrides` in run-live-commands.ts) instead
 * write straight to
 * the real .env file before running — so the change shows up in Settings
 * and in every variable-hover preview across the app, not just later live
 * commands in this session.
 */

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
