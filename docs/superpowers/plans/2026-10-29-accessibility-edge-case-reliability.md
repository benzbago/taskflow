# Phase 9 Accessibility and Edge-Case Reliability Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with `superpowers:executing-plans` and `superpowers:test-driven-development`. Do not commit, push, or merge; the user will review and commit.

**Spec:** `docs/superpowers/specs/2026-10-29-accessibility-edge-case-reliability-design.md`

**Goal:** Fix the confirmed accessibility gaps and prove TaskFlow's important date, timer, reducer, and storage edge cases without changing visual design, architecture, persistence compatibility, or core behavior.

**Architecture:** Keep all changes inside the existing pages, navigation, task form, hook, Context tests, utilities, and Playwright suite. Add no dependency or shared component abstraction. Prefer semantic attributes, local state, and existing reducer/provider APIs.

**Global constraints:** Phase 9 only. Preserve all ErrorBoundaries, LocalStorage schema/migrations/recovery, existing selectors, and 69 unit plus 7 browser tests. Do not commit automatically.

## File map

- Modify `src/pages/HabitsPage.jsx`: complete modal behavior, validation, and focus restoration.
- Modify `src/components/tasks/TaskForm.jsx`: connect title validation to its field.
- Modify `src/pages/KanbanPage.jsx`: live move announcements and complete mobile tab behavior.
- Modify `src/components/navigation/Sidebar.jsx`: active-page semantics.
- Modify `src/components/navigation/MobileNavigation.jsx`: active-page semantics.
- Modify `src/pages/FocusPage.jsx`: quiet timer semantics.
- Modify `src/styles.css` only if a visually hidden status utility or focus-preserving rule is required.
- Modify `src/App.test.jsx` and/or add focused component tests beside their source: accessibility regressions.
- Modify `src/context/TaskFlowContext.test.jsx`: reducer and provider failure transitions.
- Add `src/hooks/usePomodoro.test.jsx`: hook recovery and guard behavior where utilities alone are insufficient.
- Modify `src/utils/dates.test.js`, `src/utils/focus.test.js`, and `src/utils/tasks.test.js`: boundary regressions.
- Modify `e2e/taskflow.spec.js`: targeted accessibility browser workflows.
- Modify `vite.config.js` only if measured coverage justifies threshold increases with reasonable headroom.

## Task 1: Habit and task form accessibility

1. Add failing rendered tests for Habit dialog `aria-modal`, focus wrapping, Escape dismissal, focus restoration after cancel, restoration after save, safe close after the trigger is detached, and announced/associated empty-title validation.
2. Run the focused tests and confirm failures reflect missing behavior.
3. Implement component-local modal focus handling and safe trigger restoration in `HabitsPage.jsx`.
4. Add a failing test that the Task title field exposes `aria-invalid` and references its alert while invalid.
5. Run it and confirm the missing ARIA association is the failure.
6. Add stable validation IDs and conditional ARIA attributes without changing text or layout.
7. Run all relevant App/Habit tests and confirm green.

## Task 2: Kanban, navigation, and timer semantics

1. Add failing rendered tests for Sidebar/MobileNavigation `aria-current`, Kanban move announcements, tab/tabpanel relationships, roving tab stops, ArrowLeft/ArrowRight wrapping, Home/End, and timer `role="timer"` with `aria-live="off"`.
2. Confirm the focused tests fail for the absent semantics and behavior.
3. Implement active navigation semantics without changing button behavior.
4. Implement a local polite Kanban status message, stable tab/panel IDs, roving `tabIndex`, and key handling only on tab buttons.
5. Add quiet timer semantics and an accessible remaining-time/state label while preserving the completion status message.
6. Mark only confirmed decorative icons `aria-hidden="true"`.
7. Run the focused tests and confirm green.

## Task 3: Reliability regression coverage

1. Add failing or characterization tests for missing/deleted reducer entities, unknown actions, duplicate focus completion, and failed storage writes surfaced through the provider while in-memory state remains usable.
2. Add focus utility guard tests for null/running/paused mismatch cases and forced completion behavior.
3. Add hook/provider tests for running recovery, paused restoration, and duplicate completion avoidance after refresh-equivalent initialization.
4. Add date tests for midnight-local keys, leap/month/year rollover, and representative DST transitions using local `Date` construction.
5. Add recurrence tests for daily and weekly transitions across month and year boundaries.
6. Run each focused test file after additions. If a test exposes a real defect, keep the failing regression, make the smallest business-logic correction, and rerun it. If current behavior is correct, record it as characterization rather than modifying production logic.
7. Run the complete unit suite.

## Task 4: Browser accessibility workflows

1. Add Playwright tests for Habit focus wrapping, Escape and cancel restoration, save restoration, and validation alerts.
2. Add a browser scenario that safely covers a missing restoration target if it can be reached without test-only application behavior; otherwise rely on the deterministic component regression.
3. Add Playwright tests for Kanban tab keyboard behavior and ensure ordinary task controls remain operable after tab navigation.
4. Add a move-announcement assertion and active desktop/mobile navigation `aria-current` assertions.
5. Run the new tests individually, then run `npm run test:e2e`.

## Task 5: Coverage, thresholds, and final verification

1. Run `npm run test:coverage` and read exact global and critical-module counts from `coverage/coverage-summary.json`.
2. Compare against Phase 8 baselines and existing thresholds. Raise only thresholds that retain approximately one to two percentage points of stable headroom; otherwise leave them unchanged.
3. Run the final verification matrix:
   - `npm run lint`
   - `npm run format:check`
   - `npm test -- --run`
   - `npm run test:coverage`
   - `npm run test:e2e`
   - `npm run build`
   - `git diff --check`
4. Inspect `git status --short` and the final diff for Phase 9-only scope.
5. Request one fresh whole-change review. Fix Critical or Important findings through a failing regression first; report deferred Minor findings.

## Review focus

- Focus must restore after both Habit save and cancel when the trigger remains connected, and must fail safely when it does not.
- Mobile Kanban tab keys must wrap consistently, update selection and focus together, and never intercept keys from task controls.
- Timer ticks must not become live announcements.
- Tests must use meaningful public behavior and must not weaken coverage thresholds.
- Persistence failure tests must not clear or overwrite user data.
