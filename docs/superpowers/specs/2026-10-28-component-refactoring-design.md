# Phase 7 Component Refactoring Design

## Intent

Turn the 1,527-line `src/App.jsx` into focused domain modules that are easier to understand and change, while preserving TaskFlow's rendered UI, behavior, accessibility, animations, persistence, and test selectors exactly.

## Goals

- Make `App.jsx` responsible only for application composition: the application ErrorBoundary, MotionConfig, TaskFlowProvider, and AppShell.
- Keep `AppShell.jsx` focused on orchestration: selected page, navigation visibility, task-editor visibility/focus restoration, filters/sort, focus-task handoff, keyboard shortcut, and page-level ErrorBoundary placement.
- Group navigation, task UI, and common presentational components by domain.
- Move each existing page responsibility to a named file under `src/pages/`.
- Preserve all Context/reducer, LocalStorage, migration, backup, import/export, and recovery code without moving or changing it.

## Non-goals and anti-goals

- No feature, visual, copy, selector, animation, accessibility, persistence, or state-management changes.
- No React Router, Redux, new dependency, new custom hook, barrel export, generic design system, or speculative abstraction.
- Do not move page-local state upward or Context state downward.
- Do not turn `AppShell.jsx` into a repository for extracted page markup or business calculations.
- Do not implement Phase 8 or later work.

## Selected approach: domain-focused extraction

The selected approach keeps existing component bodies and state in place while moving them into files with explicit imports:

- `src/components/navigation/navigationConfig.js`: `NAV` and `PAGE_TITLES`, shared only by navigation and AppShell.
- `src/components/navigation/Sidebar.jsx`: desktop navigation and task counts.
- `src/components/navigation/Topbar.jsx`: current-page heading and top actions.
- `src/components/navigation/MobileNavigation.jsx`: mobile primary actions.
- `src/components/tasks/TaskForm.jsx`: existing task create/edit dialog and its local form state.
- `src/components/tasks/TaskCard.jsx`: existing task item actions and animation.
- `src/components/tasks/TaskList.jsx`: task collection rendering and empty-state delegation.
- `src/components/tasks/TaskFilters.jsx`: existing filter and sort controls.
- `src/components/common/EmptyState.jsx` and `SectionHeader.jsx`: existing shared presentational pieces.
- `src/pages/DashboardPage.jsx`, `TaskListPage.jsx`, `CalendarPage.jsx`, `CategoriesPage.jsx`, `AnalyticsPage.jsx`, `AppearancePage.jsx`, and `DataPage.jsx`: existing page markup, calculations, and page-local state.
- `src/components/AppShell.jsx`: the existing shell-level state and callbacks, content selection, page boundaries, persistence warnings, editor rendering, and shell layout.
- `src/App.jsx`: application providers and the application-level ErrorBoundary only.

The conservative alternative—moving the same large block wholesale into `AppShell.jsx`—was rejected because it relocates rather than resolves the maintainability problem. A more aggressive redesign into routing, hooks, or generalized configuration was rejected because it changes architecture and increases regression risk without serving this behavior-preserving phase.

## State and behavior ownership

- `TaskFlowProvider` and its reducer remain unchanged in `src/context/TaskFlowContext.jsx`.
- `AppShell` continues to own `page`, `navOpen`, `editor`, `initialDate`, `focusTaskId`, `filters`, and `sort`.
- `TaskForm`, Calendar, Categories, and Data retain their existing local UI state in their extracted components.
- Existing Focus, Kanban, Habits, and Daily Planner page files remain in place and retain their current interfaces.
- ErrorBoundary behavior is unchanged. App keeps the outer boundary; AppShell keeps separately keyed boundaries for Focus, Daily Planner, Kanban, and Habit Tracker.
- DataPage continues to call the existing storage utilities directly; no storage code is copied or relocated.

## Dependency direction

`App.jsx` imports AppShell. AppShell imports navigation, TaskForm, pages, ErrorBoundary, defaults, and date utilities. Pages import task/common components and domain utilities. Task components import common components and Context/utilities as needed. Leaf components never import AppShell or App, preventing circular ownership.

## Incremental extraction and verification

Extract common/task components first, then pages, then navigation, and finally AppShell/application composition. After each domain extraction, run the focused App/unit suite. At completion run lint, formatting, all 69 existing unit tests, all 7 Chromium Playwright tests, production build, and `git diff --check`.

## Builder discretion

Exact import ordering and whether a tiny constant used by only one extracted file stays local are left to the implementer. Component markup, public props, state placement, text, class names, and event behavior are not discretionary.

