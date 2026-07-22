import type { DemoDefinition } from '@/types/demo'
import { demoRegistry as markdownDemos } from 'virtual:demo-registry'

export interface DemoRegistryEntry {
  id: string
  title: string
  subtitle?: string
  tags?: string[]
  load: () => Promise<{ default: DemoDefinition }>
}

/**
 * All demos are authored as markdown + YAML under content/demos/<id>/ and
 * served by vite-plugin-demo-content.ts; this module just re-exports the
 * generated registry. Picker order comes from each demo.yaml's `order` key.
 * To add a demo, add a folder — see docs/AUTHORING.md.
 */
export const demoRegistry: DemoRegistryEntry[] = markdownDemos

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__DEMO_REGISTRY__ = demoRegistry
}
