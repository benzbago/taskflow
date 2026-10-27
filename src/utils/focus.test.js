import { describe, expect, test } from 'vitest'
import { completeExpiredSession, createFocusSession, pauseFocusSession, remainingMs, resumeFocusSession } from './focus'

describe('timestamp focus sessions', () => {
  test('stays accurate after interval inactivity', () => {
    const session = createFocusSession({ now: 1_000, durationMinutes: 25, taskId: 'task-1' })
    expect(remainingMs(session, 61_000)).toBe(24 * 60_000)
  })

  test('pause and resume excludes paused time', () => {
    const started = createFocusSession({ now: 1_000, durationMinutes: 25 })
    const paused = pauseFocusSession(started, 61_000)
    expect(remainingMs(paused, 600_000)).toBe(24 * 60_000)
    const resumed = resumeFocusSession(paused, 601_000)
    expect(remainingMs(resumed, 661_000)).toBe(23 * 60_000)
  })

  test('recovers and completes an expired session exactly once', () => {
    const active = createFocusSession({ now: 1_000, durationMinutes: 1, taskId: 'task-1' })
    const first = completeExpiredSession(active, [], 100_000)
    expect(first.completed).toMatchObject({ id: active.id, taskId: 'task-1', durationMs: 60_000 })
    expect(first.active).toBeNull()
    const second = completeExpiredSession(active, [first.completed], 120_000)
    expect(second.completed).toBeNull()
  })

  test('does not complete a paused session after refresh', () => {
    const paused = pauseFocusSession(createFocusSession({ now: 1_000, durationMinutes: 1 }), 30_000)
    expect(completeExpiredSession(paused, [], 120_000).completed).toBeNull()
  })
})
