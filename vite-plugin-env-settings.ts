import type { Plugin } from 'vite'
import { readEnvFileVars, readMaskedKeys, writeEnvFile, writeMaskedKeys, type EnvVar } from './env-file-utils.ts'

interface EnvVarWithSensitivity extends EnvVar {
  sensitive: boolean
}

/**
 * Dev-server-only endpoint backing the Settings screen. Lets the browser
 * read/write the project's .env file (and the env.masked sensitivity list)
 * so demo scripts can use real credentials without committing them. Only
 * wired up under `vite dev`.
 */
export function envSettingsPlugin(): Plugin {
  return {
    name: 'env-settings',
    configureServer(server) {
      server.middlewares.use('/api/env-settings', (req, res) => {
        if (req.method === 'GET') {
          const { vars, source } = readEnvFileVars()
          const masked = readMaskedKeys()
          const varsWithSensitivity: EnvVarWithSensitivity[] = vars.map((v) => ({
            ...v,
            sensitive: masked.has(v.key),
          }))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ vars: varsWithSensitivity, source }))
          return
        }

        if (req.method === 'POST') {
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
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }

            const rawVars = (parsed as { vars?: unknown })?.vars
            if (!Array.isArray(rawVars)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '"vars" must be an array of { key, value, sensitive }' }))
              return
            }

            const vars: EnvVarWithSensitivity[] = rawVars.filter(
              (v): v is EnvVarWithSensitivity =>
                typeof v?.key === 'string' && typeof v?.value === 'string' && v.key.trim() !== '',
            )

            const saved = writeEnvFile(vars)
            writeMaskedKeys(vars.filter((v) => v.sensitive === true).map((v) => v.key))

            const maskedKeys = readMaskedKeys()
            const savedWithSensitivity: EnvVarWithSensitivity[] = saved.map((v) => ({
              ...v,
              sensitive: maskedKeys.has(v.key),
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, vars: savedWithSensitivity }))
          })
          return
        }

        res.statusCode = 405
        res.end('Method Not Allowed')
      })
    },
  }
}
