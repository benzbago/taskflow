# Phase 6 Error Boundaries Design

## Intent

Contain unexpected React render failures so TaskFlow remains recoverable without clearing tasks, habits, focus sessions, daily plans, recovery copies, or settings.

## Scope and constraints

- Add one reusable class-based React error boundary with a keyed child remount.
- Wrap the application as a last-resort boundary and independently wrap Focus, Kanban, Habits, and Daily Planner.
- Page retry keeps the current page; an optional secondary action returns to Dashboard.
- Retry is user-triggered only and never invokes TaskFlow reset or browser-storage APIs.
- Development fallback details include the error and component stack; production copy excludes technical details.
- Existing async import failures remain handled by their local `try`/`catch`, because React boundaries do not catch asynchronous callback errors.
- Phase 7 and unrelated refactoring are out of scope.

## Approaches

- Selected: keyed subtree remount. Reset the boundary's captured error and increment a key only after the user presses Try Again. This isolates page failures and avoids automatic retry loops.
- Rejected: navigate away on every error. This would lose the current page and make Try Again indirect.
- Rejected: reload or remount the whole application for page failures. This would unnecessarily discard transient application state.

## Interface

`ErrorBoundary` accepts `children`, `scope`, and optional `onBackToDashboard`. Its fallback uses the current TaskFlow card/button styles, exposes an alert heading and friendly guidance, and offers Try Again plus the optional dashboard action.
