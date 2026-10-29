import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TaskFlowProvider, useTaskFlow } from '../context/TaskFlowContext'
import {
  createInitialState,
  serializeState,
  STORAGE_KEY,
} from '../utils/storage'
import { usePomodoro } from './usePomodoro'

function activeSession(now, status = 'running') {
  return {
    id: 'focus-1',
    type: 'focus',
    taskId: 'task-1',
    durationMs: 1_000,
    startedAt: new Date(now).toISOString(),
    endsAt: new Date(now + 1_000).toISOString(),
    status,
    elapsedMs: status === 'paused' ? 500 : 0,
    pausedAt: status === 'paused' ? new Date(now + 500).toISOString() : null,
  }
}

function seed(session) {
  localStorage.setItem(
    STORAGE_KEY,
    serializeState({
      ...createInitialState(),
      activeFocusSession: session,
    }),
  )
}

function PomodoroProbe() {
  const timer = usePomodoro()
  const state = useTaskFlow()
  return (
    <>
      <span>Active: {state.activeFocusSession?.status || 'none'}</span>
      <span>History: {state.focusSessions.length}</span>
      <span>{timer.completionNotice}</span>
    </>
  )
}

function renderProvider() {
  return render(
    <TaskFlowProvider>
      <PomodoroProbe />
    </TaskFlowProvider>,
  )
}

describe('usePomodoro provider recovery', () => {
  const now = new Date(2026, 9, 29, 10).getTime()

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  test('recovers a stored running session and records completion exactly once', async () => {
    seed(activeSession(now))
    renderProvider()
    expect(screen.getByText('Active: running')).toBeVisible()

    await act(async () => {
      vi.advanceTimersByTime(1_500)
    })

    expect(screen.getByText('Active: none')).toBeVisible()
    expect(screen.getByText('History: 1')).toBeVisible()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.activeFocusSession).toBeNull()
    expect(stored.focusSessions).toHaveLength(1)
    expect(stored.focusSessions[0].id).toBe('focus-1')

    await act(async () => {
      vi.advanceTimersByTime(2_000)
    })
    expect(screen.getByText('History: 1')).toBeVisible()
  })

  test('restores a stored paused session without expiring it', async () => {
    seed(activeSession(now, 'paused'))
    renderProvider()

    await act(async () => {
      vi.advanceTimersByTime(120_000)
    })

    expect(screen.getByText('Active: paused')).toBeVisible()
    expect(screen.getByText('History: 0')).toBeVisible()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.activeFocusSession.status).toBe('paused')
    expect(stored.focusSessions).toHaveLength(0)
  })
})
