import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { runLivePlugin } from './vite-plugin-run-live.ts'
import { envSettingsPlugin } from './vite-plugin-env-settings.ts'
import { editScriptPlugin } from './vite-plugin-edit-script.ts'
import { envProfilesPlugin } from './vite-plugin-env-profiles.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runLivePlugin(), envSettingsPlugin(), editScriptPlugin(), envProfilesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      // .env and .env-<profile> snapshots: read directly by our own plugins
      // (never via import.meta.env); Settings/live-run/profile commands
      // write to them as part of normal use, and Vite's default
      // restart-on-env-file-change would otherwise drop the browser's
      // connection mid-request every time that happens.
      //
      // src/demos: these are plain data modules (arrays of DemoStep
      // objects), not React components, so editing them has no HMR
      // boundary of their own — the invalidation propagates all the way up
      // through registry.ts -> demoStore.ts -> App.tsx, and React Fast
      // Refresh remounts App, re-running its mount effect that loads the
      // *first* demo and resetting whatever the user was looking at. The
      // in-line script editor already reflects saves via local component
      // state without needing a reload, so watching these files buys
      // nothing but a jarring reset — a manual browser refresh still picks
      // up on-disk edits made outside the app.
      ignored: ['**/.env', '**/.env-*', '**/src/demos/**'],
    },
  },
})
