import { create } from 'zustand'
import type { DemoDefinition } from '@/types/demo'
import { demoRegistry } from '@/demos/registry'

interface DemoStoreState {
  currentDemoId: string | null
  currentDemo: DemoDefinition | null
  currentStepIndex: number
  isLoading: boolean
  error: string | null
  loadDemo: (id: string, initialStepIndex?: number) => Promise<void>
  goToStep: (index: number) => void
  next: () => void
  prev: () => void
}

const POSITION_KEY = 'kirkware-demo-position'

/**
 * The presenter's place, kept in sessionStorage so an accidental refresh (or
 * a dev-server full reload after a structural content change) resumes on the
 * same demo and step instead of resetting to the first slide.
 */
export function restorePosition(): { id: string; step: number } | null {
  try {
    const raw = sessionStorage.getItem(POSITION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: unknown; step?: unknown }
    if (typeof parsed.id !== 'string' || typeof parsed.step !== 'number') return null
    return { id: parsed.id, step: parsed.step }
  } catch {
    return null
  }
}

function savePosition(id: string, step: number): void {
  try {
    sessionStorage.setItem(POSITION_KEY, JSON.stringify({ id, step }))
  } catch {
    /* storage unavailable — position just won't survive a refresh */
  }
}

export const useDemoStore = create<DemoStoreState>((set, get) => ({
  currentDemoId: null,
  currentDemo: null,
  currentStepIndex: 0,
  isLoading: false,
  error: null,

  loadDemo: async (id: string, initialStepIndex = 0) => {
    const entry = demoRegistry.find((d) => d.id === id)
    if (!entry) {
      set({ error: `No demo registered with id "${id}"` })
      return
    }
    set({ isLoading: true, error: null })
    try {
      const mod = await entry.load()
      const stepIndex = Math.max(0, Math.min(initialStepIndex, mod.default.steps.length - 1))
      set({
        currentDemoId: id,
        currentDemo: mod.default,
        currentStepIndex: stepIndex,
        isLoading: false,
      })
      savePosition(id, stepIndex)
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) })
    }
  },

  goToStep: (index: number) => {
    const { currentDemo, currentDemoId } = get()
    if (!currentDemo || !currentDemoId) return
    const clamped = Math.max(0, Math.min(index, currentDemo.steps.length - 1))
    set({ currentStepIndex: clamped })
    savePosition(currentDemoId, clamped)
  },

  next: () => {
    const { currentDemo, currentStepIndex } = get()
    if (!currentDemo) return
    if (currentStepIndex < currentDemo.steps.length - 1) {
      get().goToStep(currentStepIndex + 1)
    }
  },

  prev: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      get().goToStep(currentStepIndex - 1)
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
