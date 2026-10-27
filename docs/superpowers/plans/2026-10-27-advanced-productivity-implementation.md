# TaskFlow Advanced Productivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade TaskFlow in place with reliable Focus/Pomodoro, synchronized Kanban, schedule-aware Habits, and deterministic Daily Planning.

**Architecture:** Preserve the reducer/context application core and extract each feature into a page, focused components, and pure testable utilities. A pure v1→v2 migration normalizes old data before the reducer loads it; all cross-feature mutations flow through reducer actions.

**Tech Stack:** Existing React, Vite, Tailwind CSS, Motion, Recharts, LocalStorage, Vitest, Testing Library; no new runtime dependencies.

**Spec:** `../specs/2026-10-27-advanced-productivity-design.md`

## Global Constraints

- Preserve every existing feature, brand token, responsive behavior, and light/dark theme.
- Work incrementally and run the full test suite plus production build after every phase.
- Use stable local date keys for habits and timestamp arithmetic for focus sessions.
- Keep `completed`, `completedAt`, and `status` synchronized through centralized transitions.
- Accept v1 and v2 imports; export v2; preserve rejected/migrated originals under the recovery key.
- Use real stored data for every metric and provide accessible non-pointer interactions.

## Review Focus

- Refreshing after a focus deadline must record exactly one capped focus session.
- Complete/reopen/recomplete through list or Kanban controls must not duplicate recurrence.
- Habit streaks must respect weekends, partial current periods, and year boundaries.
- Planner output must be deterministic, budget-bounded, and resilient to deleted tasks.
- Migration/import failure must leave recoverable original data and current state intact.

---

### Task 1: Phase 0 — v2 schema, migration, and reducer contracts

**Files:** Create `src/utils/migrations.js` and tests; modify storage, task utilities, reducer, and existing tests.

**Interfaces:** Produces `migrateState(value)`, validated v2 state, `transitionTaskStatus(state,id,status)`, and v2 import/export/reset behavior.

- [ ] Write failing tests for v1 migration, v2 validation/import/export, corrupt recovery, reset collections, and status/recurrence synchronization.
- [ ] Implement minimal migration, validation, task defaults, and centralized reducer transitions.
- [ ] Run the full tests and production build; commit Phase 0.

### Task 2: Phase 1 — Focus Mode and timestamp timer

**Files:** Create `src/utils/focus.js`, `src/hooks/usePomodoro.js`, `src/pages/FocusPage.jsx`, focus components/tests; modify context, navigation, and styles.

**Interfaces:** Produces pure focus transition/recovery helpers and reducer actions for active session and completed history.

- [ ] Write failing tests for start/pause/resume/recovery/inactivity/idempotent completion/task linking.
- [ ] Implement the timestamp state machine, Focus page, settings, controls, history, notification, and analytics.
- [ ] Run full tests and build; commit Phase 1.

### Task 3: Phase 2 — synchronized Kanban

**Files:** Create `src/utils/kanban.js`, `src/pages/KanbanPage.jsx`, Kanban components/tests; modify navigation/context/styles.

**Interfaces:** Consumes centralized `setTaskStatus`; produces filtered three-column board with drag/drop and accessible move controls.

- [ ] Write failing tests for transitions, completion synchronization, recurrence idempotency, filtering, and ordering.
- [ ] Implement board interactions without bypassing reducer transitions.
- [ ] Run full tests and build; commit Phase 2.

### Task 4: Phase 3 — Habit Tracker

**Files:** Create `src/utils/habits.js`, `src/pages/HabitsPage.jsx`, habit components/tests; modify context/navigation/styles.

**Interfaces:** Produces habit CRUD/toggle actions and schedule-aware daily/weekly streak and consistency selectors.

- [ ] Write failing tests for unique completions, undo, daily/weekday/frequency streaks, and date boundaries.
- [ ] Implement habit forms, selected-date dashboard, weekly grid, monthly heatmap, and progress metrics.
- [ ] Run full tests and build; commit Phase 3.

### Task 5: Phase 4 — Smart Daily Planning

**Files:** Create `src/utils/planner.js`, `src/pages/DailyPlannerPage.jsx`, planner components/tests; modify task form/context/navigation/styles.

**Interfaces:** Produces stable `scoreTask`, `suggestPlan`, plan CRUD, manual reorder/allocation, focus handoff, and planned-versus-actual selectors.

- [ ] Write failing tests for ranking, budgets, completed exclusion, determinism, persistence, and deleted references.
- [ ] Implement estimates, explainable suggestions, manual overrides, saved plans, history, and Focus integration.
- [ ] Run full tests and build; commit Phase 4.

### Task 6: Phase 5 — integration, accessibility, and polish

**Files:** Modify app navigation, feature pages/components, styles, README, and integration tests.

**Interfaces:** Produces cohesive desktop/mobile navigation and documented v2 application.

- [ ] Add integration tests covering cross-feature synchronization, refresh persistence, and mobile-accessible navigation.
- [ ] Verify keyboard flows, reduced motion, empty states, light/dark styles, and real analytics.
- [ ] Run all tests, production build, and live browser smoke tests; complete independent review and fix important findings.
