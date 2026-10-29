# Phase 9 Accessibility and Edge-Case Reliability Design

## Intent

Phase 9 improves TaskFlow's accessibility and resilience where the audit found concrete gaps. It preserves the current visual design, application architecture, Context and reducer ownership, persistence schema, migrations, ErrorBoundaries, and existing features.

## Goals

- Make the existing Habit editor behave as a complete accessible modal.
- Make Kanban status and mobile-column interactions understandable and operable with assistive technology and keyboards.
- Expose the current navigation destination programmatically.
- Give the Pomodoro countdown timer semantics without announcing every tick.
- Associate task and habit validation errors with their invalid fields.
- Verify important date, recurrence, timer, reducer, and persistence failure paths.
- Preserve or improve the Phase 8 coverage gates with meaningful tests.

## Non-goals

- No visual redesign, routing change, shared modal framework, state-management change, or new production dependency.
- No rewrite of working date, recurrence, focus, storage, migration, or recovery algorithms unless a regression test proves a defect.
- No broad accessibility framework or automated scanner dependency.
- No Phase 10 work.

## Confirmed Audit Findings

### High impact

- The Habit dialog lacks `aria-modal`, focus containment, Escape dismissal, focus restoration, and announced validation. An empty title fails silently.

### Medium impact

- Kanban move controls work with keyboards, but successful status changes are not announced.
- Mobile Kanban tabs lack tab-to-panel relationships and conventional horizontal keyboard navigation.
- Desktop and mobile navigation visually indicate the active page without `aria-current="page"`.
- The visual Pomodoro countdown has no timer semantics.

### Low impact

- Task title validation is visually announced but not associated with the title input.
- Some purely decorative status icons are exposed to assistive technology.

## Approved Approach

Use a targeted reliability pass within the existing components. Do not extract shared dialog infrastructure or add dependencies. Add the smallest component-local behavior needed and prove it through unit and browser tests.

Alternatives rejected:

- Shared accessibility primitives would introduce structural refactoring beyond Phase 9.
- A broad automated standards sweep would add a dependency and expand the scope beyond confirmed issues.

## Detailed Design

### Habit dialog

`HabitForm` remains local to `HabitsPage.jsx`. It will:

- use `role="dialog"`, `aria-modal="true"`, and its existing accessible name;
- autofocus the title field;
- trap Tab and Shift+Tab among enabled, visible form controls;
- close on Escape;
- prevent backdrop interaction from reaching the application and optionally close only when the backdrop itself is clicked;
- mark an invalid title with `aria-invalid="true"` and `aria-describedby` pointing to a stable alert element;
- show the existing-design error text without changing the layout language;
- invoke the same close path after save and cancel.

`HabitsPage` records `document.activeElement` immediately before opening the form. When the form closes after either saving or cancelling, it restores focus only if the recorded element is still connected to the document and remains focusable. If the trigger was removed, closing must not throw or force focus elsewhere. Escape and backdrop dismissal use the same safe restoration path.

While open, modal semantics and focus containment keep keyboard interaction inside the dialog. The existing backdrop covers pointer interaction. No global `inert` mutation or new portal infrastructure will be introduced.

### Kanban announcements and mobile tabs

The existing status move controls remain buttons. `KanbanPage` stores a short last-move message such as “Task name moved to In Progress” and renders it in a visually unobtrusive polite status region. Drag/drop and button moves use the same move function so both paths announce success.

Each mobile tab receives a stable ID, `aria-controls`, and roving `tabIndex`. Each corresponding column becomes a labelled `tabpanel` with `aria-labelledby`. ArrowRight/ArrowLeft wrap among tabs; Home/End select the first/last tab. Selection and focus move together. The key handler is attached only to the tab buttons and handles only those four keys, so normal task controls are unaffected.

The desktop board keeps all columns visible. Tab semantics remain present but the CSS continues to control the mobile presentation.

### Navigation

Active Sidebar and MobileNavigation destination buttons receive `aria-current="page"`; inactive buttons omit it. The quick-add action never receives `aria-current`.

### Pomodoro

The countdown container receives `role="timer"`, an accessible label describing the current remaining time and state, and `aria-live="off"`. The visible countdown remains unchanged and may update every 500 milliseconds without repeated announcements. The existing separate completion notice keeps `role="status"`.

### Task validation and decorative icons

The Task title input receives a stable ID for its validation message, `aria-invalid` only while invalid, and `aria-describedby` while the message exists. Existing wording, behavior, and styling remain unchanged.

Purely visual status and decoration icons receive `aria-hidden="true"` where they otherwise add noise. Icons inside already-labelled buttons are decorative; the button label remains the accessible name.

## Reliability Coverage

### Unit and component tests

Add meaningful regressions for:

- focus completion deduplication in the reducer;
- missing task, habit, category, subtask, and daily-plan entities/actions remaining safe no-ops where appropriate;
- unknown reducer actions returning the same state;
- pause/resume guards for null and mismatched statuses;
- LocalStorage write failure preserving in-memory state and surfacing `persistenceError`;
- running and paused focus restoration behavior through the provider/hook boundary;
- midnight, month-end, year-end, and representative DST calendar transitions using local calendar construction;
- daily and weekly recurrence across month/year boundaries;
- Habit dialog validation and focus behavior where component tests are more deterministic than browser tests.

Tests must exercise public reducer, provider, hook, utility, or rendered UI behavior rather than implementation-only branches.

### Playwright tests

Extend the Chromium suite with targeted workflows for:

- Habit dialog focus wrapping, Escape dismissal, and restoration after cancel;
- focus restoration after saving a habit;
- safe close when the original trigger is no longer connected, covered at component level if the UI cannot naturally remove the trigger while the modal is open;
- announced Habit validation;
- Kanban tab ArrowLeft/ArrowRight wrapping plus Home/End selection/focus;
- Kanban move status announcement;
- active desktop and mobile destination `aria-current` semantics.

Selectors should prefer roles, accessible names, and stable ARIA relationships. Existing selectors remain valid.

## Coverage Policy

Keep the Phase 8 global and critical thresholds initially unchanged. Measure the final report after the new tests. Raise a threshold only if the new stable baseline leaves the same modest headroom and the improvement is attributable to meaningful Phase 9 coverage. Branch coverage is evaluated independently.

## Verification

Run:

- `npm run lint`
- `npm run format:check`
- `npm test -- --run`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

The final report distinguishes fixed findings from already-correct behavior, lists all tests and files, reports global and critical coverage, records any threshold change, and calls out remaining accessibility limitations.
