import fs from 'node:fs'
import path from 'node:path'
import { parseDemoDir } from '../content-pipeline/parseDemo.ts'

/**
 * Scaffolds a new markdown demo from content/demos/_template/:
 *
 *   npm run new-demo -- <demo-id> "<Title>"
 *
 * The id becomes the folder name (and must be url-safe); the title lands in
 * demo.yaml. The result is validated through the real pipeline before the
 * script reports success — the new demo appears in the picker on next dev
 * reload.
 */

const [id, title] = process.argv.slice(2)
if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error('Usage: npm run new-demo -- <demo-id> "<Title>"  (id: lowercase letters, digits, dashes)')
  process.exit(1)
}

const root = path.resolve(import.meta.dirname, '..', 'content', 'demos')
const templateDir = path.join(root, '_template')
const targetDir = path.join(root, id)

if (fs.existsSync(targetDir)) {
  console.error(`content/demos/${id} already exists`)
  process.exit(1)
}

fs.cpSync(templateDir, targetDir, { recursive: true })

const demoYaml = path.join(targetDir, 'demo.yaml')
if (title) {
  fs.writeFileSync(demoYaml, fs.readFileSync(demoYaml, 'utf-8').replace('title: My New Demo', `title: ${title}`))
}

const { demo } = parseDemoDir(targetDir)
console.log(`Created content/demos/${id} — "${demo.meta.title}", ${demo.steps.length} starter steps.`)
console.log('Edit the files under sections/ (see docs/AUTHORING.md); the app hot-reloads as you save.')
