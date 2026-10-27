# TaskFlow Advanced Productivity Design

TaskFlow v2 extends the existing offline-first application without replacing its reducer/context architecture. Four new page-level features—Focus, Kanban, Habits, and Daily Planner—share the current task and category collections while keeping their own domain records.

The v2 state contains `tasks`, `categories`, `settings`, `focusSessions`, `activeFocusSession`, `habits`, and `dailyPlans`. Version-1 data migrates through a pure, validated transformation: completed tasks become `done`, incomplete tasks become `todo`, estimates remain optional, and all existing task/category/settings fields are preserved. The original v1 payload is copied to the recovery key before the migrated state is first saved.

Focus sessions use persisted timestamps. An expired running session is completed automatically on load, capped at its planned duration, and deduplicated by session ID. Pauses accumulate elapsed milliseconds without interval drift. Break sessions are offered after focus completion and long breaks occur every fourth completed focus session.

Kanban status transitions are reducer actions. `done` is always equivalent to `completed: true`; leaving Done clears completion; checkbox completion synchronizes status. Recurrence generation remains centralized and idempotent. Native drag/drop is enhanced by explicit keyboard-accessible move buttons.

Habits are separate records whose completion history is a unique list of local `YYYY-MM-DD` keys. Daily and weekday schedules calculate streaks over expected dates while ignoring the unfinished current period. Frequency schedules measure consecutive completed qualifying weeks.

The planner assigns explainable scores to incomplete tasks based on overdue/today deadlines, priority, pinning, proximity, estimates, and previous planning. It greedily selects stable-ranked tasks that fit the available minutes. Saved plans keep task references, allocations, order, and date; missing tasks remain representable as unavailable historical entries.

No backend, AI API, cross-device sync, browser notifications, or third-party drag/drop dependency is introduced.
