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
  context/     # Reducer-backed application state and action API
  data/        # Default categories and shared option data
  test/        # Test environment setup
  utils/       # Dates, task selectors, metrics, validation, persistence
  App.jsx      # Pages and reusable interface components
  styles.css   # Tailwind entry point and TaskFlow design system
```

## Run locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run the automated checks with:

```bash
npm test -- --run
npm run build
```

## How persistence works

TaskFlow stores a versioned state document under `taskflow:v1` in browser LocalStorage. The key is retained for backward compatibility while the current document schema is version 2. Every reducer update is saved automatically. Tasks, categories, focus sessions, active timer state, habits, daily plans, theme, name, and display preferences survive refreshes and browser restarts.

Version-1 data and backups are migrated automatically. Existing tasks keep their completion history and recurring relationships, while workflow status is derived safely. Before migration, the original payload is copied to `taskflow:recovery`. Exports use schema version 2; imports accept validated version-1 or version-2 backups.

LocalStorage belongs to one browser profile on one device. It does **not** sync automatically. Use Data Management → Export to download a JSON backup, then Import on another browser or device. Imports are structurally validated before the current workspace is replaced. If stored data is damaged or incompatible, TaskFlow starts safely with an empty workspace.

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

