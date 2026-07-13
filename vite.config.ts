import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { runLivePlugin } from './vite-plugin-run-live.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runLivePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
