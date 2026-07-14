import type { Plugin } from 'vite'
import { activateEnvProfile, listEnvProfiles, saveEnvProfile, type EnvVar } from './env-file-utils.ts'

/**
 * Dev-server-only endpoint backing the environment-profile switcher.
 * Profiles are `.env-<name>` snapshot files in the project root; "activate"
 * copies one over the real .env, and "save" snapshots the currently-shown
 * Settings values into `.env-<HUB_FQDN>`. Only wired up under `vite dev`.
 */
export function envProfilesPlugin(): Plugin {
  return {
    name: 'env-profiles',
    configureServer(server) {
      server.middlewares.use('/api/env-profiles', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ profiles: listEnvProfiles() }))
          return
        }

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
          let parsed: unknown
          try {
            parsed = JSON.parse(body || '{}')
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }))
            return
          }

          const { action } = parsed as Record<string, unknown>

          if (action === 'save') {
            const rawVars = (parsed as { vars?: unknown }).vars
            if (!Array.isArray(rawVars)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: '"vars" must be an array of { key, value }' }))
              return
            }
            const vars: EnvVar[] = rawVars.filter(
              (v): v is EnvVar => typeof v?.key === 'string' && typeof v?.value === 'string' && v.key.trim() !== '',
            )
            const result = saveEnvProfile(vars)
            res.statusCode = result.ok ? 200 : 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          }

          if (action === 'activate') {
            const filename = (parsed as { filename?: unknown }).filename
            if (typeof filename !== 'string') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: '"filename" must be a string' }))
              return
            }
            const result = activateEnvProfile(filename)
            res.statusCode = result.ok ? 200 : 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          }

          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Unknown action — expected "save" or "activate"' }))
        })
      })
    },
  }
}
