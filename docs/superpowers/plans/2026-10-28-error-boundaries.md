# React Error Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add application- and page-level React failure containment with explicit retry and no persisted-data mutation.

**Architecture:** A reusable class boundary captures render errors and renders a shared fallback. User-triggered retry clears only boundary error state and changes a child key; AppShell supplies dashboard navigation only to page boundaries.

**Tech Stack:** React 19, Vitest, Testing Library, existing CSS.

**Spec:** `docs/superpowers/specs/2026-10-28-error-boundaries-design.md`

## Global Constraints

- Implement Phase 6 only and preserve existing UI and functionality.
- Never clear or reset LocalStorage, recovery copies, application state, or settings.
- Show technical details only in development.

## Review Focus

- A child that fails repeatedly must remain safely contained after each manual retry.
- A page failure must not remove the surrounding shell or change the current page.
- Page retry and dashboard navigation must not write to or clear storage.
- An application-shell failure must reach the outer boundary.
- Production fallback must not render exception messages or component stacks.

---

### Task 1: Reusable boundary

**Files:**
- Create: `src/components/ErrorBoundary.jsx`
- Create: `src/components/ErrorBoundary.test.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `ErrorBoundary({ children, scope, onBackToDashboard })`

- [ ] Write failing tests for fallback, manual retry, repeated failure, development details, production redaction, and unchanged storage.
- [ ] Run the focused test and confirm failure because the component is absent.
- [ ] Implement the minimal class boundary and matching fallback styles.
- [ ] Run the focused test and confirm all boundary tests pass.

### Task 2: Application and page integration

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `ErrorBoundary` from Task 1.

- [ ] Write failing integration tests proving page isolation/current-page retry and application-level containment.
- [ ] Run the focused integration tests and confirm the new assertions fail.
- [ ] Wrap the app and the four requested pages; pass Dashboard navigation only to page boundaries.
- [ ] Run all unit tests and confirm existing and new tests pass.

### Task 3: Full verification

- [ ] Run lint and formatting checks.
- [ ] Run the complete Vitest suite.
- [ ] Run all seven Chromium Playwright tests.
- [ ] Run the production build and `git diff --check`.
- [ ] Review the diff for Phase 6-only scope and report without committing.
