import { create } from 'zustand'

export type AppView = 'demo' | 'settings' | 'sandbox'

interface ViewStoreState {
  view: AppView
  setView: (view: AppView) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useViewStore = create<ViewStoreState>((set) => ({
  view: 'demo',
  setView: (view) => set({ view }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
