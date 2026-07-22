import fs from 'node:fs'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

/**
 * Perceptually compares two screenshot runs from scripts/screenshot-steps.ts
 * and reports any step whose pixel difference exceeds the threshold —
 * lenient enough for animation/anti-aliasing jitter, strict enough to catch
 * real layout or content changes.
 *
 *   npx tsx scripts/diff-screenshots.ts [baselineName] [currentName] [maxDiffPct]
 */

const root = path.resolve(import.meta.dirname, '..', 'screenshots')
const baseName = process.argv[2] ?? 'baseline'
const currName = process.argv[3] ?? 'current'
const maxDiffPct = Number(process.argv[4] ?? '0.5')

const baseRoot = path.join(root, baseName)
const currRoot = path.join(root, currName)

let compared = 0
let flagged = 0
const missing: string[] = []

for (const demo of fs.readdirSync(baseRoot).sort()) {
  for (const file of fs.readdirSync(path.join(baseRoot, demo)).sort()) {
    const rel = path.join(demo, file)
    const currFile = path.join(currRoot, rel)
    if (!fs.existsSync(currFile)) {
      missing.push(rel)
      continue
    }
    const a = PNG.sync.read(fs.readFileSync(path.join(baseRoot, rel)))
    const b = PNG.sync.read(fs.readFileSync(currFile))
    compared++
    if (a.width !== b.width || a.height !== b.height) {
      flagged++
      console.log(`  DIFF ${rel}: size ${a.width}x${a.height} -> ${b.width}x${b.height}`)
      continue
    }
    const diff = pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 })
    const pct = (diff / (a.width * a.height)) * 100
    if (pct > maxDiffPct) {
      flagged++
      console.log(`  DIFF ${rel}: ${pct.toFixed(2)}% of pixels differ`)
    }
  }
}

for (const rel of missing) console.log(`  MISSING in ${currName}: ${rel}`)
console.log(`${compared} compared, ${flagged} over ${maxDiffPct}% threshold, ${missing.length} missing`)
process.exit(flagged > 0 || missing.length > 0 ? 1 : 0)
