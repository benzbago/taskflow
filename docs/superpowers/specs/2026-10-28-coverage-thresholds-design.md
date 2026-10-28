# Phase 8 Coverage Reporting and Thresholds Design

## Intent

Add honest, reproducible Vitest V8 coverage reporting and CI enforcement without changing TaskFlow runtime behavior or writing tests solely to raise percentages.

## Selected approach

Use tiered thresholds. Coverage will include all application JavaScript and JSX under `src/`, not only files imported by tests. Modest global thresholds will protect the measured whole-application baseline, while glob thresholds will protect the stronger critical business-logic modules. A global-only gate was rejected because aggregate coverage can conceal regression in critical logic; business-logic-only reporting was rejected because it would hide untested UI code.

## Provider and reports

- Pin `@vitest/coverage-v8` to `5.0.5`, exactly matching pinned Vitest `5.0.5`.
- Use the V8 provider.
- Generate `text` for terminal use, `html` for human inspection, `json` as machine-readable raw data, and `json-summary` for concise automation/reporting.
- Keep reports under `coverage/`, already ignored by Git, and keep Playwright outside the coverage run.

## Coverage scope

Include `src/**/*.{js,jsx}`. Exclude only test files, `src/test/**`, the browser entrypoint `src/main.jsx`, and declaration/generated artifacts if any appear. Configuration, E2E files, documentation, and external dependencies are outside `src` and therefore outside application coverage. Poorly covered components and pages remain visible in the report.

## Baseline and threshold selection

1. Install the matching provider and configure coverage/reporting without thresholds.
2. Run the existing 69-test suite once to measure the actual global and per-file baseline.
3. Read exact unrounded totals from `coverage/coverage-summary.json` rather than copying rounded terminal display values.
4. Set each global threshold below its measured value with small explicit headroom, using conservative whole-number floors so floating-point rounding can never put a threshold above baseline.
5. Set a critical-business-logic glob threshold only after measuring the aggregate for:
   - `src/context/TaskFlowContext.jsx`
   - `src/utils/storage.js`
   - `src/utils/migrations.js`
   - `src/utils/tasks.js`
   - `src/utils/focus.js`
   - `src/utils/habits.js`
   - `src/utils/planner.js`
   - `src/utils/dates.js`
6. Treat branch coverage independently and select it from its own measured result, never from line coverage.

No tests will be added unless the baseline run exposes an important business behavior that is genuinely untested; any such test must describe behavior rather than coverage mechanics.

## CI integration

Replace the existing unit-test CI step with `npm run test:coverage`, which runs the same Vitest suite and fails on test or threshold failure. Keep Chromium Playwright separate. Add an `if: !cancelled()` coverage artifact step using the existing artifact action conventions, uploading `coverage/` for 14 days with read-only repository permissions unchanged.

## Constraints and non-goals

- No runtime source or application behavior changes.
- No weakening or rewriting existing tests.
- No coverage exclusions added merely to improve percentages.
- No auto-updating thresholds.
- No Phase 9 work, commit, push, or merge.

