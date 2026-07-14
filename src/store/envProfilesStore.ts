import { create } from 'zustand'
import { useEnvVarsStore } from './envVarsStore'

export interface EnvProfile {
  filename: string
  label: string
}

interface EnvProfilesState {
  profiles: EnvProfile[]
  activeFilename: string | null
  loaded: boolean
  refresh: () => Promise<void>
  activate: (filename: string) => Promise<{ ok: boolean; error?: string }>
}

export const useEnvProfilesStore = create<EnvProfilesState>((set, get) => ({
  profiles: [],
  activeFilename: null,
  loaded: false,

  refresh: async () => {
    try {
      const res = await fetch('/api/env-profiles')
      const data = await res.json()
      set({ profiles: data.profiles ?? [], loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  activate: async (filename: string) => {
    try {
      const res = await fetch('/api/env-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', filename }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error ?? `Activate failed (${res.status})` }
      }
      set({ activeFilename: filename })
      useEnvVarsStore.getState().refresh()
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not reach the local env-profiles endpoint — is `npm run dev` running?' }
    } finally {
      get().refresh()
    }
  },
}))
