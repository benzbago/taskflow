# TaskFlow

TaskFlow is a responsive, offline-first personal task manager built with React, Vite, Tailwind CSS, Lucide, Motion, and Recharts.

## Features

- Dashboard with daily progress, time-aware greeting, and live task metrics
- Timestamp-based Focus Mode with configurable Pomodoro sessions, task linking, reload recovery, history, and analytics
- Synchronized Kanban board with drag-and-drop and keyboard-accessible workflow controls
- Independent Habit Tracker with daily, weekday, and weekly-frequency schedules, streaks, grids, and heatmaps
- Deterministic Daily Planner with explainable suggestions, time budgets, estimates, saved plans, and Focus handoff
- Task creation, editing, deletion, duplication, pinning, priorities, notes, dates, times, subtasks, and daily/weekly recurrence
- Search, status/category/priority filters, and multiple sort orders
- Today, upcoming, completed, calendar, categories, and analytics views
- Custom categories with safe reassignment to Other on deletion
- Light, dark, and system themes plus a compact display option
- Validated JSON import/export and destructive-action confirmations
- Responsive desktop sidebar, mobile drawer, and bottom navigation
- Keyboard shortcut: press `N` outside a form field to create a task

## Project structure

```text
src/
  components/  # App shell, error boundary, navigation, and task UI
  context/     # Reducer-backed application state and action API
  data/        # Default categories and shared option data
  hooks/       # Pomodoro state and recovery integration
  pages/       # Dashboard, productivity tools, and settings pages
  test/        # Vitest environment setup
  utils/       # Dates, domain calculations, migrations, and persistence
  App.jsx      # Providers and application-level error containment
  styles.css   # Tailwind entry point and TaskFlow design system
e2e/           # Chromium end-to-end workflows
```

## Run locally

Use Node.js 24, matching CI and the pinned development toolchain.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Quality checks

Run the same release checks used by CI:

```bash
npm run lint
npm run format:check
npm test -- --run
npm run test:coverage
npm run test:e2e
npm run build
```

Vitest writes text, HTML, JSON, and JSON-summary coverage reports to
`coverage/`. The configured global and critical-business-logic thresholds make
the coverage command fail if tested behavior regresses. Playwright runs the
critical browser workflows separately in Chromium.

Pull requests and pushes to `master` run these checks in GitHub Actions. CI
also uploads the coverage report and any Playwright report or failure traces as
short-lived workflow artifacts.

## How persistence works

TaskFlow stores a versioned state document under `taskflow:v1` in browser LocalStorage. The key is retained for backward compatibility while the current document schema is version 2. Every reducer update is saved automatically. Tasks, categories, focus sessions, active timer state, habits, daily plans, theme, name, and display preferences survive refreshes and browser restarts.

Version-1 data and backups are migrated automatically. Existing tasks keep their completion history and recurring relationships, while workflow status is derived safely. Before migration, the original payload is copied to `taskflow:recovery`. Exports use schema version 2; imports accept validated version-1 or version-2 backups. A valid current workspace is preserved before an import replaces it, and a failed write leaves the in-memory workspace available while TaskFlow displays a warning.

LocalStorage belongs to one browser profile on one device. It does **not** sync automatically. Use Data Management → Export to download a JSON backup, then Import on another browser or device. Imports are structurally validated before the current workspace is replaced. If the primary record is damaged, TaskFlow restores a valid recovery copy when available; otherwise it starts with an empty workspace and preserves the damaged payload for manual recovery when browser storage permits. Clear data requires confirmation and resets tasks, habits, focus sessions, daily plans, categories, and settings to fresh defaults.

## Deploy to Netlify

### From a Git repository

1. Push this folder to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository.
4. Netlify will read `netlify.toml`: build command `npm run build`, publish directory `dist`.
5. Choose **Deploy site**.

### With the Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --dir=dist
netlify deploy --dir=dist --prod
```

The included SPA redirect sends unknown paths to `index.html`. Task data remains in each visitor's local browser and is never uploaded to Netlify.
