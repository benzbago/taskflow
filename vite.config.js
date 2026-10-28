import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const criticalCoverageFiles =
  'src/{context/TaskFlowContext.jsx,utils/{storage,migrations,tasks,focus,habits,planner,dates}.js}'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx'],
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        statements: 59,
        branches: 57,
        functions: 44,
        lines: 60,
        [criticalCoverageFiles]: {
          statements: 77,
          branches: 72,
          functions: 66,
          lines: 79,
        },
      },
    },
  },
})
