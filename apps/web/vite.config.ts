import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@fantasy-nba/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  optimizeDeps: {
    include: ['@fantasy-nba/shared'],
  },
})
