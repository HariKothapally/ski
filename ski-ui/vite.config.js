import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === 'test' ? 5174 : 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
  },
  define: {
    // Ensure proper handling of environment mode
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}))
