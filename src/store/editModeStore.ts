import { create } from 'zustand'

const STORAGE_KEY = 'kirkware-demos:edits-enabled'

function loadInitial(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

interface EditModeState {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

/** Global "Enable Edits" toggle (set on the Settings screen) — gates every Edit affordance in the app. Persisted in localStorage since it's a presenter preference, not environment config. */
export const useEditModeStore = create<EditModeState>((set) => ({
  enabled: loadInitial(),
  setEnabled: (enabled) => {
    localStorage.setItem(STORAGE_KEY, String(enabled))
    set({ enabled })
  },
}))
