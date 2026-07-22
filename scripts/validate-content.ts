import fs from 'node:fs'
import path from 'node:path'
import { parseDemoDir } from '../content-pipeline/parseDemo.ts'

/**
 * Validates every markdown demo under content/demos/ (including underscore-
 * prefixed folders like the template, which never reach the app registry but
 * must still parse). Exits non-zero on the first authoring error.
 *
 *   npm run validate:content
 */

const contentRoot = path.resolve(import.meta.dirname, '..', 'content', 'demos')

if (!fs.existsSync(contentRoot)) {
  console.error(`No content directory at ${contentRoot}`)
  process.exit(1)
}

const dirs = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => path.join(contentRoot, entry.name))
  .sort()

let failed = false
let warningCount = 0
for (const dir of dirs) {
  const id = path.basename(dir)
  try {
    const { demo, warnings } = parseDemoDir(dir)
    for (const warning of warnings) {
      warningCount++
      console.warn(`  warn ${warning.file}${warning.line != null ? `:${warning.line}` : ''} — ${warning.message}`)
    }
    console.log(`  ok   ${id} (${demo.steps.length} steps, ${demo.diagrams?.length ?? 0} diagrams)`)
  } catch (err) {
    failed = true
    console.error(`  FAIL ${id}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

console.log(failed ? 'Content validation failed.' : `All ${dirs.length} demo(s) valid${warningCount > 0 ? `, ${warningCount} warning(s)` : ''}.`)
process.exit(failed ? 1 : 0)
