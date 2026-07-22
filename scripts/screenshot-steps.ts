/// <reference lib="dom" />
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

// Browser-side shapes for page.evaluate callbacks. The node tsconfig doesn't
// see src/types/demo-content.d.ts (different TS program), so the dev-only
// window hooks are re-declared here with just the surface this script uses.
interface DemoStoreState {
  currentDemoId: string | null
  currentDemo: { steps: { id: string }[] } | null
  loadDemo: (id: string) => Promise<void>
  goToStep: (index: number) => void
}
declare global {
  interface Window {
    __DEMO_STORE__?: { getState: () => DemoStoreState }
    __DEMO_REGISTRY__?: { id: string }[]
  }
}

/**
 * Walks every step of every registered demo in a headless browser and saves
 * one screenshot per step to screenshots/<out>/<demo-id>/NNN-<step-id>.png.
 * Step ids in filenames stay stable across refactors, so two runs can be
 * diffed to prove a content-format change is render-neutral.
 *
 *   npm run screenshots                # -> screenshots/current/
 *   npm run screenshots -- baseline    # -> screenshots/baseline/
 *   npm run screenshots -- current tanzu-ai-services   # limit to one demo
 *
 * Starts its own Vite dev server on a scratch port; the app exposes
 * window.__DEMO_STORE__ / window.__DEMO_REGISTRY__ in dev for this script.
 * It drives the store directly (loadDemo/goToStep) — no UI clicking, no
 * reliance on sidebar DOM. Demo commands are never executed.
 */

const PORT = 5199
const outName = process.argv[2] ?? 'current'
const onlyDemo = process.argv[3]
const outRoot = path.resolve(import.meta.dirname, '..', 'screenshots', outName)

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`Dev server did not come up at ${url}`)
    await new Promise((r) => setTimeout(r, 250))
  }
}

const vite = spawn('./node_modules/.bin/vite', ['--port', String(PORT), '--strictPort'], {
  cwd: path.resolve(import.meta.dirname, '..'),
  stdio: 'ignore',
})
process.on('exit', () => vite.kill())

try {
  await waitForServer(`http://localhost:${PORT}/`, 30_000)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' })
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForFunction(() => window.__DEMO_REGISTRY__ && window.__DEMO_STORE__?.getState().currentDemo != null, undefined, {
    timeout: 15_000,
  })

  const demoIds = await page.evaluate(() => window.__DEMO_REGISTRY__!.map((d) => d.id))
  for (const demoId of demoIds) {
    if (onlyDemo && demoId !== onlyDemo) continue
    await page.evaluate(async (id) => {
      await window.__DEMO_STORE__!.getState().loadDemo(id)
    }, demoId)
    await page.waitForFunction((id) => window.__DEMO_STORE__!.getState().currentDemoId === id, demoId)

    const steps = await page.evaluate(() => window.__DEMO_STORE__!.getState().currentDemo!.steps.map((s) => ({ id: s.id })))
    const dir = path.join(outRoot, demoId)
    fs.mkdirSync(dir, { recursive: true })
    for (let i = 0; i < steps.length; i++) {
      await page.evaluate((index) => window.__DEMO_STORE__!.getState().goToStep(index), i)
      // Let framer-motion transitions (already reduced) and diagram auto-fit settle.
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(dir, `${String(i).padStart(3, '0')}-${steps[i].id}.png`) })
    }
    console.log(`  ${demoId}: ${steps.length} steps`)
  }

  await browser.close()
  console.log(`Screenshots written to screenshots/${outName}/`)
} finally {
  vite.kill()
}
