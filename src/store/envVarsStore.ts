import { create } from 'zustand'

export interface EnvVarInfo {
  value: string
  sensitive: boolean
}

interface EnvVarsStoreState {
  vars: Record<string, EnvVarInfo>
  loaded: boolean
  refresh: () => Promise<void>
}

/**
 * Read-only cache of the current .env contents, shared by the Settings
 * screen (which owns edits) and any command block that wants to show a
 * variable's live value on hover.
 */
export const useEnvVarsStore = create<EnvVarsStoreState>((set) => ({
  vars: {},
  loaded: false,
  refresh: async () => {
    try {
      const res = await fetch('/api/env-settings')
      const data = await res.json()
      const vars: Record<string, EnvVarInfo> = {}
      for (const v of data.vars as { key: string; value: string; sensitive: boolean }[]) {
        vars[v.key] = { value: v.value, sensitive: v.sensitive }
      }
      set({ vars, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
}))
