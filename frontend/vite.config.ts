/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // Sources arrive through a bind mount: without polling, changes go undetected
      usePolling: true,
      // Polling makes the watch list expensive, and these directories are generated output:
      // watching them cost a full page reload per coverage file and kept the CPU busy.
      ignored: ['**/coverage/**', '**/dist/**', '**/.pnpm-store/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // The entry point only mounts the tree, types carry no logic and the helpers are the
      // test harness itself.
      exclude: ['src/main.tsx', 'src/types/**', 'src/test/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
