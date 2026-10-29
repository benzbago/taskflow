import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useTaskFlow } from '../context/TaskFlowContext'
import { usePomodoro } from './usePomodoro'

vi.mock('../context/TaskFlowContext', () => ({
  useTaskFlow: vi.fn(),
}))

function session(status = 'running') {
  return {
    id: 'focus-action',
    type: 'focus',
    taskId: null,
    durationMs: 60_000,
    startedAt: new Date(1_000).toISOString(),
    endsAt: new Date(61_000).toISOString(),
    status,
    elapsedMs: status === 'paused' ? 30_000 : 0,
    pausedAt: status === 'paused' ? new Date(31_000).toISOString() : null,
  }
}

function context(activeFocusSession) {
  return {
    activeFocusSession,
    focusSessions: [],
    updateActiveFocus: vi.fn(),
    completeFocus: vi.fn(),
  }
}

describe('usePomodoro actions', () => {
  afterEach(() => vi.restoreAllMocks())

  test('pauses and resumes through the context API', () => {
    vi.spyOn(Date, 'now').mockReturnValue(31_000)
    const running = context(session())
    vi.mocked(useTaskFlow).mockReturnValue(running)
    const { result, unmount } = renderHook(() => usePomodoro())
    act(() => result.current.pause())
    expect(running.updateActiveFocus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paused', elapsedMs: 30_000 }),
    )
    unmount()

    const paused = context(session('paused'))
    vi.mocked(useTaskFlow).mockReturnValue(paused)
    const resumed = renderHook(() => usePomodoro())
    act(() => resumed.result.current.resume())
    expect(paused.updateActiveFocus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'running', pausedAt: null }),
    )
  })

  test('finishes early and clears a hook-owned completion notice', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(120_000)
    const expired = context(session())
    vi.mocked(useTaskFlow).mockReturnValue(expired)
    const { result } = renderHook(() => usePomodoro())

    await waitFor(() => expect(expired.completeFocus).toHaveBeenCalled())
    expect(result.current.completionNotice).toMatch(/session complete/i)
    act(() => result.current.clearNotice())
    expect(result.current.completionNotice).toBe('')

    expired.completeFocus.mockClear()
    act(() => result.current.finish())
    expect(expired.completeFocus).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'focus-action' }),
    )
  })
})
