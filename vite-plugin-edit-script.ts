import type { Plugin } from 'vite'
import { addArrayItem, removeArrayItem, updateScriptCode, updateStepField } from './edit-script-utils.ts'

/**
 * Dev-server-only endpoint backing every in-line "Edit" affordance — command
 * blocks (kind: 'script') as well as arbitrary text fields (kind: 'field').
 * Locates the exact string for a given target across every demo section file
 * using the TypeScript compiler API — never arbitrary file writes — and
 * rewrites just that one template literal in place, leaving the rest of the
 * file untouched. Only wired up under `vite dev`.
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

          const { kind, stepId, label, oldCode, newCode, field, oldValue, newValue, item, index, compareField } =
            parsed as Record<string, unknown>

          if (kind === 'array-add') {
            if (typeof stepId !== 'string' || typeof field !== 'string' || (typeof item !== 'string' && typeof item !== 'object')) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'stepId and field must be strings, and item must be a string or object' }))
              return
            }

            const result = addArrayItem(stepId, field, item)
            res.statusCode = result.ok ? 200 : result.error?.includes('find') ? 404 : 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          }

          if (kind === 'array-remove') {
            if (
              typeof stepId !== 'string' ||
              typeof field !== 'string' ||
              typeof index !== 'number' ||
              typeof oldValue !== 'string' ||
              (compareField !== null && compareField !== undefined && typeof compareField !== 'string')
            ) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  ok: false,
                  error: 'stepId, field must be strings, index a number, oldValue a string, and compareField a string or null',
                }),
              )
              return
            }

            const result = removeArrayItem(stepId, field, index, compareField ?? null, oldValue)
            res.statusCode = result.ok ? 200 : result.error?.includes('find') ? 404 : 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          }

          if (kind === 'field') {
            if (
              typeof stepId !== 'string' ||
              typeof field !== 'string' ||
              typeof oldValue !== 'string' ||
              typeof newValue !== 'string'
            ) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'stepId, field, oldValue, and newValue must all be strings' }))
              return
            }

            const result = updateStepField(stepId, field, oldValue, newValue)
            res.statusCode = result.ok ? 200 : result.error?.includes('find') ? 404 : 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          }

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
