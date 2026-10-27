# TaskFlow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, responsive, browser-local personal task manager with full task organization, calendar, analytics, focus features, themes, and portable JSON backups.

**Architecture:** A Vite React single-page application uses a reducer-backed context as the single source of truth and a versioned LocalStorage adapter for persistence. Route-level pages compose reusable task, category, calendar, analytics, dialog, and navigation components; pure utility modules own validation, filtering, recurrence, dates, and metrics so core behavior can be unit tested without the UI.

**Tech Stack:** React, Vite, JavaScript, Tailwind CSS, Lucide React, Recharts, Motion, Vitest, Testing Library

**Spec:** `../specs/2026-10-27-taskflow-design.md`

## Global Constraints

- Single-user and offline-first; no backend or authentication.
- Begin with an empty workspace and helpful onboarding states.
- Persist tasks, categories, and settings automatically in LocalStorage.
- Use accessible semantic controls, visible focus states, responsive layouts, and confirmation for destructive actions.
- Use real task data for all statistics and charts.
- Keep animations subtle and respect reduced-motion preferences.
- Clearly state that data is stored only in the current browser and does not sync across devices.

## Review Focus

- Corrupt or incompatible stored/imported JSON must fail safely without destroying current data.
- Local dates must not shift by a day because of UTC conversion.
- Recurring task completion must create at most one correct next occurrence.
- Deleting a category with assigned tasks must preserve those tasks under `Other`.
- Empty and zero-total datasets must render without division-by-zero or chart failures.

---

### Task 1: Foundation, domain model, and persistence

**Files:** Create project configuration, `src/data/defaults.js`, `src/utils/{dates,tasks,storage,validation}.js`, `src/context/TaskFlowContext.jsx`, and utility tests.

**Interfaces:** Produces `TaskFlowProvider`, `useTaskFlow()`, versioned `loadState/saveState`, import validation, date helpers, selectors, and task/category action methods.

- [ ] Write failing unit tests for safe storage recovery, import validation, local-date classification, sorting/filtering, category fallback, and recurring-task generation.
- [ ] Run `npm test -- --run` and confirm the tests fail for missing modules.
- [ ] Implement the project foundation and minimal pure utilities/context API required by the tests.
- [ ] Run `npm test -- --run` and confirm the foundation tests pass.

### Task 2: Application shell and design system

**Files:** Create `src/main.jsx`, `src/App.jsx`, `src/styles.css`, and shell/navigation/theme/toast/dialog components.

**Interfaces:** Consumes `TaskFlowProvider`; produces responsive route navigation, desktop sidebar, mobile navigation, theme controls, toast region, confirmation dialog, and shared visual primitives.

- [ ] Write component tests for route navigation, theme persistence, mobile labels, and keyboard focus behavior.
- [ ] Implement the screenshot-derived white/indigo system with slate dark mode, semantic tokens, responsive shell, and accessible interactions.
- [ ] Run component tests and confirm they pass.

### Task 3: Task workflows and organization

**Files:** Create task list/card/form/detail/filter components plus Dashboard, All Tasks, Today, Upcoming, Completed, and Categories pages.

**Interfaces:** Consumes context actions/selectors; produces create, edit, complete, duplicate, pin, delete, search, sort, filter, subtask, recurrence, and category-management flows.

- [ ] Write interaction tests for task CRUD, validation, completion, duplication, filters, keyboard shortcut, subtasks, and category reassignment.
- [ ] Implement responsive task workflows using a modal on compact screens and a slide-over on wide screens.
- [ ] Run task workflow tests and confirm they pass.

### Task 4: Calendar, analytics, settings, and data portability

**Files:** Create Calendar, Analytics, Appearance, and Data Management pages plus chart/calendar/export/import controls.

**Interfaces:** Consumes real selectors and context import/export/reset actions; produces month navigation, selected-day task creation, live Recharts insights, appearance preferences, and validated backups.

- [ ] Write tests for month grids, date selection, zero-data analytics, valid/invalid import, export structure, and clear-data confirmation.
- [ ] Implement calendar, analytics, theme/settings, and data-management experiences.
- [ ] Run page tests and confirm they pass.

### Task 5: Product polish, documentation, and release verification

**Files:** Create `README.md`, `netlify.toml`, and final accessibility/responsiveness tests; refine all UI modules.

**Interfaces:** Produces a buildable SPA with installation, persistence, backup, and Netlify deployment documentation.

- [ ] Add empty states, progress-sensitive motivation, overdue treatment, motion feedback, and reduced-motion support.
- [ ] Run `npm test -- --run`, `npm run build`, and a browser smoke test at desktop and mobile widths.
- [ ] Verify every visible control, light/dark contrast, keyboard navigation, and LocalStorage reload behavior.
- [ ] Document setup, scripts, architecture, persistence, browser-only limitations, and Netlify deployment.

