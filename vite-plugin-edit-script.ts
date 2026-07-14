import type { Plugin } from 'vite'
import { updateScriptCode } from './edit-script-utils.ts'

/**
 * Dev-server-only endpoint backing the in-line "Edit" button on command
 * blocks. Locates the exact `code` string for a given (stepId, label) pair
 * across every demo section file using the TypeScript compiler API — never
 * arbitrary file writes — and rewrites just that one template literal in
 * place, leaving the rest of the file untouched. Only wired up under
 * `vite dev`.
 */
export function editScriptPlugin(): Plugin {
  return {
    name: 'edit-script',
    configureServer(server) {
      server.middlewares.use('/api/edit-script', (req, res) => {
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

          const { stepId, label, oldCode, newCode } = parsed as Record<string, unknown>
          if (
            typeof stepId !== 'string' ||
            typeof label !== 'string' ||
            typeof oldCode !== 'string' ||
            typeof newCode !== 'string'
          ) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'stepId, label, oldCode, and newCode must all be strings' }))
            return
          }

          const result = updateScriptCode(stepId, label, oldCode, newCode)
          res.statusCode = result.ok ? 200 : result.error?.includes('find') ? 404 : 409
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        })
      })
    },
  }
}
