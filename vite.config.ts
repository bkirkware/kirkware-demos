import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { runLivePlugin } from './vite-plugin-run-live.ts'
import { envSettingsPlugin } from './vite-plugin-env-settings.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runLivePlugin(), envSettingsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      // .env is read directly by our own plugins (never via import.meta.env),
      // and Settings/live-run commands write to it as part of normal use —
      // Vite's default restart-on-.env-change would otherwise drop the
      // browser's connection mid-request every time that happens.
      ignored: ['**/.env'],
    },
  },
})
