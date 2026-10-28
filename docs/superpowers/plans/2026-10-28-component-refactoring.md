# Phase 7 Component Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 1,527-line `App.jsx` with focused domain modules without changing observable behavior or state ownership.

**Architecture:** Extract existing component bodies without redesign, following dependency direction from App → AppShell → pages/navigation/tasks/common. Keep shell state and page-level boundaries in AppShell; keep provider/reducer and persistence modules untouched.

**Tech Stack:** React 19, Motion, Recharts, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-component-refactoring-design.md`

## Global Constraints

- Preserve markup, copy, class names, props, state ownership, event behavior, accessibility, animation, and responsive layout.
- Do not change Context, reducer, storage, migration, import/export, recovery, or ErrorBoundary behavior.
- Add no dependency, hook, router, state library, barrel export, or speculative abstraction.
- Work only on `chore/taskflow-reliability`; do not commit, push, or merge.

## Review Focus

- Task form focus restoration, keyboard shortcut, and animation must remain shell-owned and functional.
- Page-level ErrorBoundary keys and Dashboard recovery callbacks must remain unchanged.
- Task card menu/action behavior and accessible labels must survive module moves.
- Data import/export must retain its exact storage utility calls and failure handling.
- Circular imports must not be introduced between AppShell, pages, and leaf components.

---

### Task 1: Common and task components

**Files:** Create `src/components/common/EmptyState.jsx`, `src/components/common/SectionHeader.jsx`, `src/components/tasks/TaskForm.jsx`, `TaskCard.jsx`, `TaskList.jsx`, and `TaskFilters.jsx`; modify `src/App.jsx`.

**Interfaces:** Preserve the existing component prop signatures exactly; task components consume Context and task/date utilities directly as before.

- [ ] Run all unit tests as the green characterization baseline.
- [ ] Move common and task component bodies and required imports without markup changes.
- [ ] Run all unit tests; expect 69 passing.

### Task 2: Page modules

**Files:** Create `src/pages/DashboardPage.jsx`, `TaskListPage.jsx`, `CalendarPage.jsx`, `CategoriesPage.jsx`, `AnalyticsPage.jsx`, `AppearancePage.jsx`, and `DataPage.jsx`; modify `src/App.jsx`.

**Interfaces:** Preserve each existing page prop signature; consume TaskFlow Context and extracted task/common components directly.

- [ ] Move one page responsibility at a time, keeping page-local state and calculations local.
- [ ] Run all unit tests after the page-domain extraction; expect 69 passing.

### Task 3: Navigation components

**Files:** Create `src/components/navigation/navigationConfig.js`, `Sidebar.jsx`, `Topbar.jsx`, and `MobileNavigation.jsx`; modify `src/App.jsx`.

**Interfaces:** Preserve Sidebar and Topbar props; MobileNavigation receives `page`, `setPage`, and `onNew`.

- [ ] Move navigation constants and markup without changing labels, counts, or interactions.
- [ ] Run all unit tests; expect 69 passing.

### Task 4: AppShell and composition

**Files:** Create `src/components/AppShell.jsx`; reduce `src/App.jsx` to composition imports and JSX.

**Interfaces:** AppShell owns the same seven state values and callbacks as before; App wraps it with ErrorBoundary, MotionConfig, and TaskFlowProvider.

- [ ] Move only shell state, callbacks, content selection, boundaries, warnings, layout, and editor orchestration.
- [ ] Confirm `AppShell.jsx` contains no extracted page markup or duplicated business logic.
- [ ] Run all unit tests; expect 69 passing.

### Task 5: Verification and review

- [ ] Run lint, formatting check, all unit tests, all Chromium E2E tests, production build, and `git diff --check`.
- [ ] Request an independent whole-change review and fix any Critical or Important findings with regression coverage.
- [ ] Re-run the complete verification set and report without committing.

