/**
 * Ambient types for the virtual modules served by vite-plugin-demo-content.ts
 * (markdown-authored demos under content/demos/). This file must stay a
 * script (no top-level import/export) so `declare module` declares rather
 * than augments.
 */
declare module 'virtual:demo-registry' {
  import type { DemoDefinition } from '@/types/demo'
  export const demoRegistry: {
    id: string
    title: string
    subtitle?: string
    tags?: string[]
    load: () => Promise<{ default: DemoDefinition }>
  }[]
}

/**
 * Dev-only HMR hand-off: generated virtual demo modules self-accept and pass
 * their fresh DemoDefinition here so the presenter keeps their place.
 * Registered in demoStore.ts.
 */
interface Window {
  __DEMO_CONTENT_HOT__?: (id: string, demo: import('@/types/demo').DemoDefinition) => void
  /** Dev-only handle for tooling (scripts/screenshot-steps.ts). */
  __DEMO_STORE__?: (typeof import('@/store/demoStore'))['useDemoStore']
  /** Dev-only registry listing for tooling. */
  __DEMO_REGISTRY__?: (typeof import('@/demos/registry'))['demoRegistry']
}
