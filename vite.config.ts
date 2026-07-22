import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { runLivePlugin } from './vite-plugin-run-live.ts'
import { envSettingsPlugin } from './vite-plugin-env-settings.ts'
import { envProfilesPlugin } from './vite-plugin-env-profiles.ts'
import { demoContentPlugin } from './vite-plugin-demo-content.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runLivePlugin(), envSettingsPlugin(), envProfilesPlugin(), demoContentPlugin()],
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
      // Demo content (content/demos/**) is deliberately watched:
      // vite-plugin-demo-content.ts turns edits into targeted HMR updates
      // that swap the definition in the demo store without remounting the
      // app or losing the presenter's current step.
      ignored: ['**/.env', '**/.env-*'],
    },
  },
})
