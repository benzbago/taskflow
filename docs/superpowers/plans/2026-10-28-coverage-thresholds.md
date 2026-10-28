# Phase 8 Coverage Thresholds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add measured V8 coverage reporting, tiered minimum thresholds, and CI artifact enforcement without changing TaskFlow runtime behavior.

**Architecture:** Vitest collects V8 coverage for all application JS/JSX, emits four report formats, and enforces modest global plus measured critical-logic thresholds. CI runs this coverage command instead of a duplicate ordinary unit-test command and uploads the complete report directory.

**Tech Stack:** Vitest 5.0.5, exact-pinned `@vitest/coverage-v8` 5.0.5, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-28-coverage-thresholds-design.md`

## Global Constraints

- Do not modify runtime application source, behavior, storage, migrations, recovery, or ErrorBoundaries.
- Include poorly covered application files; exclude only tests, test setup, entrypoint, and non-application/generated artifacts.
- Keep Playwright separate and preserve all 69 unit and 7 browser tests.
- Do not add tests unless they protect meaningful missing behavior.
- Do not commit, push, merge, or implement Phase 9.

## Review Focus

- Exact provider/Vitest versions must match and remain lockfile-pinned.
- Branch thresholds must be selected from exact branch baseline values, not rounded line totals.
- Critical grouped thresholds must include every listed business-logic module and not silently omit zero-coverage files.
- The final threshold configuration must demonstrably fail when raised above measured results.
- CI artifacts must upload after a failed threshold run while preserving read-only permissions.

---

### Task 1: Provider and baseline reporting

**Files:** Modify `package.json`, `package-lock.json`, `vite.config.js`, and `.gitignore` if needed.

**Interfaces:** `npm run test:coverage` produces `coverage/coverage-summary.json`, `coverage/coverage-final.json`, and HTML output.

- [ ] Install exact `@vitest/coverage-v8@5.0.5` as a development dependency.
- [ ] Configure V8 include/exclude patterns and text/html/json/json-summary reporters without thresholds.
- [ ] Run `npm run test:coverage`; expect 69 passing tests and reports for all relevant source.
- [ ] Record exact global and critical-module values from JSON outputs.

### Task 2: Measured tiered thresholds

**Files:** Modify `vite.config.js`.

**Interfaces:** Global thresholds gate all included source; a critical glob group gates Context and utility business logic.

- [ ] Select whole-number statement/branch/function/line thresholds below exact measured values with documented headroom.
- [ ] Add global and critical grouped thresholds with no auto-update.
- [ ] Run coverage; expect all thresholds to pass.
- [ ] Temporarily set one threshold above its measured value and run coverage; expect nonzero exit with an explicit threshold failure.
- [ ] Restore the measured threshold and rerun coverage; expect success.

### Task 3: CI integration

**Files:** Modify `.github/workflows/ci.yml`.

**Interfaces:** CI unit step invokes `npm run test:coverage`; artifact step uploads `coverage/` for 14 days using existing permissions.

- [ ] Replace the ordinary unit-test step with coverage.
- [ ] Add an `if: !cancelled()` coverage artifact upload step without altering Node, cache, permissions, build, or Playwright steps.
- [ ] Validate YAML structure and run formatting/lint checks.

### Task 4: Verification and review

- [ ] Run lint, format check, ordinary unit tests, coverage, Chromium E2E, production build, and `git diff --check`.
- [ ] Inspect final reports for low-coverage modules and record exact totals.
- [ ] Request a fresh whole-change review and fix Critical/Important findings.
- [ ] Report results and stop without committing.

