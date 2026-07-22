import { create } from 'zustand'
import type { DemoDefinition } from '@/types/demo'
import { demoRegistry } from '@/demos/registry'

interface DemoStoreState {
  currentDemoId: string | null
  currentDemo: DemoDefinition | null
  currentStepIndex: number
  isLoading: boolean
  error: string | null
  loadDemo: (id: string) => Promise<void>
  goToStep: (index: number) => void
  next: () => void
  prev: () => void
}

export const useDemoStore = create<DemoStoreState>((set, get) => ({
  currentDemoId: null,
  currentDemo: null,
  currentStepIndex: 0,
  isLoading: false,
  error: null,

  loadDemo: async (id: string) => {
    const entry = demoRegistry.find((d) => d.id === id)
    if (!entry) {
      set({ error: `No demo registered with id "${id}"` })
      return
    }
    set({ isLoading: true, error: null })
    try {
      const mod = await entry.load()
      set({
        currentDemoId: id,
        currentDemo: mod.default,
        currentStepIndex: 0,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) })
    }
  },

  goToStep: (index: number) => {
    const demo = get().currentDemo
    if (!demo) return
    const clamped = Math.max(0, Math.min(index, demo.steps.length - 1))
    set({ currentStepIndex: clamped })
  },

  next: () => {
    const { currentDemo, currentStepIndex } = get()
    if (!currentDemo) return
    if (currentStepIndex < currentDemo.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    }
  },

  prev: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },
}))

// Dev-only: markdown demo modules (virtual:demo/<id>) self-accept HMR updates
// and hand the fresh definition here, so editing a content file updates the
// running presentation in place — same demo, same step, no App remount.
if (import.meta.hot) {
  // Lets tooling (scripts/screenshot-steps.ts) drive the presenter directly.
  window.__DEMO_STORE__ = useDemoStore
  window.__DEMO_CONTENT_HOT__ = (id, demo) => {
    const { currentDemoId, currentStepIndex } = useDemoStore.getState()
    if (currentDemoId !== id) return
    useDemoStore.setState({
      currentDemo: demo,
      currentStepIndex: Math.min(currentStepIndex, demo.steps.length - 1),
    })
  }
}
