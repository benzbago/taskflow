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
        statements: 68,
        branches: 66,
        functions: 54,
        lines: 69,
        [criticalCoverageFiles]: {
          statements: 81,
          branches: 78,
          functions: 71,
          lines: 83,
        },
        'src/context/TaskFlowContext.jsx': {
          statements: 63,
          branches: 67,
          functions: 47,
          lines: 61,
        },
        'src/hooks/usePomodoro.js': {
          statements: 98,
          branches: 78,
          functions: 98,
          lines: 98,
        },
      },
    },
  },
})
