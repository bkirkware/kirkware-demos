import type { Plugin, ViteDevServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { parseDemoDir, parseDemoMeta } from './content-pipeline/parseDemo.ts'

/**
 * Serves markdown-authored demos (content/demos/<id>/) to the app as virtual
 * modules:
 *
 *   virtual:demo-registry  — registry entries (id/title/subtitle/tags plus a
 *                            lazy `load()`), one per demo folder. Folders
 *                            starting with `_` (the template, examples kept
 *                            out of the picker) are skipped.
 *   virtual:demo/<id>      — the parsed, validated DemoDefinition.
 *
 * Authoring errors (ContentError) are thrown from load(), which puts a
 * file:line message in the dev overlay and fails `vite build`.
 *
 * Hot reload: editing a section/diagram file invalidates the demo's virtual
 * module and pushes a normal HMR update. The generated demo module is
 * self-accepting and hands the fresh DemoDefinition to the store via the
 * `window.__DEMO_CONTENT_HOT__` hook (registered in demoStore.ts), so the
 * presenter keeps their place — no App remount, no reset to step 0.
 * Changes to demo.yaml (registry metadata) trigger a full reload instead.
 */

const REGISTRY_ID = 'virtual:demo-registry'
const DEMO_PREFIX = 'virtual:demo/'
const RESOLVED_REGISTRY = '\0' + REGISTRY_ID
const RESOLVED_DEMO_PREFIX = '\0' + DEMO_PREFIX

export function demoContentPlugin(): Plugin {
  let contentRoot = ''
  let server: ViteDevServer | undefined

  const listDemoDirs = (): string[] => {
    if (!fs.existsSync(contentRoot)) return []
    return fs
      .readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
      .map((entry) => path.join(contentRoot, entry.name))
      .sort()
  }

  const demoIdForFile = (file: string): string | null => {
    const rel = path.relative(contentRoot, file)
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null
    const [id] = rel.split(path.sep)
    return id && !id.startsWith('_') ? id : null
  }

  const invalidateDemo = (id: string, alsoRegistry: boolean) => {
    if (!server) return
    const graph = server.moduleGraph
    const mod = graph.getModuleById(RESOLVED_DEMO_PREFIX + id)
    if (mod) graph.invalidateModule(mod)
    if (alsoRegistry) {
      const reg = graph.getModuleById(RESOLVED_REGISTRY)
      if (reg) graph.invalidateModule(reg)
      server.ws.send({ type: 'full-reload' })
    }
    return mod
  }

  return {
    name: 'demo-content',

    configResolved(config) {
      contentRoot = path.resolve(config.root, 'content/demos')
    },

    configureServer(devServer) {
      server = devServer
      // handleHotUpdate only fires for changed files; creations/removals of
      // section files (or whole demos) restructure the registry or step list,
      // so a full reload is the honest response.
      const onAddOrRemove = (file: string) => {
        const id = demoIdForFile(file)
        if (id) invalidateDemo(id, true)
      }
      devServer.watcher.on('add', onAddOrRemove)
      devServer.watcher.on('unlink', onAddOrRemove)
    },

    resolveId(id) {
      const clean = id.split('?')[0]
      if (clean === REGISTRY_ID) return RESOLVED_REGISTRY
      if (clean.startsWith(DEMO_PREFIX)) return '\0' + clean
      return undefined
    },

    load(id) {
      const clean = id.split('?')[0]
      if (clean === RESOLVED_REGISTRY) {
        const metas = listDemoDirs().map((dir) => {
          this.addWatchFile(path.join(dir, 'demo.yaml'))
          return parseDemoMeta(dir)
        })
        metas.sort((a, b) => a.order - b.order || a.meta.title.localeCompare(b.meta.title))
        const entries = metas.map(({ meta }) => {
          return `  {
    id: ${JSON.stringify(meta.id)},
    title: ${JSON.stringify(meta.title)},
    subtitle: ${JSON.stringify(meta.subtitle)},
    tags: ${JSON.stringify(meta.tags)},
    load: () => import(${JSON.stringify(DEMO_PREFIX + meta.id)}),
  }`
        })
        return `export const demoRegistry = [\n${entries.join(',\n')}\n]\n`
      }
      if (clean.startsWith(RESOLVED_DEMO_PREFIX)) {
        const demoId = clean.slice(RESOLVED_DEMO_PREFIX.length)
        const dir = path.join(contentRoot, demoId)
        if (!fs.existsSync(dir)) {
          throw new Error(`No markdown demo at content/demos/${demoId}`)
        }
        const { demo, warnings, files } = parseDemoDir(dir)
        for (const file of files) this.addWatchFile(file)
        for (const warning of warnings) {
          this.warn(`${warning.file}${warning.line != null ? `:${warning.line}` : ''} — ${warning.message}`)
        }
        return [
          `const demo = ${JSON.stringify(demo, null, 2)}`,
          `export default demo`,
          // Self-accepting HMR: hand the fresh definition to the demo store
          // without remounting the app (see demoStore.ts).
          `if (import.meta.hot) {`,
          `  import.meta.hot.accept((mod) => {`,
          `    if (mod) window.__DEMO_CONTENT_HOT__?.(${JSON.stringify(demoId)}, mod.default)`,
          `  })`,
          `}`,
        ].join('\n')
      }
      return undefined
    },

    handleHotUpdate(ctx) {
      const id = demoIdForFile(ctx.file)
      if (!id) return undefined
      const isMeta = path.basename(ctx.file) === 'demo.yaml'
      const mod = invalidateDemo(id, isMeta)
      if (isMeta) return []
      // Returning the virtual module makes Vite push a js-update for it; the
      // module self-accepts, so the update stays inside the demo store.
      return mod ? [mod] : []
    },
  }
}
