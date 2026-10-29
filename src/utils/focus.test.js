import { describe, expect, test } from 'vitest'
import {
  completeExpiredSession,
  createFocusSession,
  pauseFocusSession,
  remainingMs,
  resumeFocusSession,
} from './focus'

describe('timestamp focus sessions', () => {
  test('stays accurate after interval inactivity', () => {
    const session = createFocusSession({
      now: 1_000,
      durationMinutes: 25,
      taskId: 'task-1',
    })
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
    const active = createFocusSession({
      now: 1_000,
      durationMinutes: 1,
      taskId: 'task-1',
    })
    const first = completeExpiredSession(active, [], 100_000)
    expect(first.completed).toMatchObject({
      id: active.id,
      taskId: 'task-1',
      durationMs: 60_000,
    })
    expect(first.active).toBeNull()
    const second = completeExpiredSession(active, [first.completed], 120_000)
    expect(second.completed).toBeNull()
  })

  test('does not complete a paused session after refresh', () => {
    const paused = pauseFocusSession(
      createFocusSession({ now: 1_000, durationMinutes: 1 }),
      30_000,
    )
    expect(completeExpiredSession(paused, [], 120_000).completed).toBeNull()
  })

  test('attributes delayed automatic recovery to the persisted deadline', () => {
    const started = new Date(2026, 9, 26, 23, 58).getTime()
    const active = createFocusSession({ now: started, durationMinutes: 1 })
    const result = completeExpiredSession(
      active,
      [],
      new Date(2026, 9, 27, 9).getTime(),
    )
    expect(result.completed.date).toBe('2026-10-26')
    expect(result.completed.completedAt).toBe(active.endsAt)
  })

  test('leaves null and mismatched pause or resume requests unchanged', () => {
    const running = createFocusSession({ now: 1_000, durationMinutes: 1 })
    const paused = pauseFocusSession(running, 10_000)
    expect(pauseFocusSession(null, 20_000)).toBeNull()
    expect(pauseFocusSession(paused, 20_000)).toBe(paused)
    expect(resumeFocusSession(null, 20_000)).toBeNull()
    expect(resumeFocusSession(running, 20_000)).toBe(running)
  })

  test('force-completes a paused session using only elapsed focus time', () => {
    const paused = pauseFocusSession(
      createFocusSession({ now: 1_000, durationMinutes: 2 }),
      31_000,
    )
    const result = completeExpiredSession(paused, [], 120_000, true)
    expect(result.completed.durationMs).toBe(30_000)
    expect(result.completed.completedAt).toBe(new Date(120_000).toISOString())
  })

  test('does not complete a still-running unexpired session', () => {
    const active = createFocusSession({ now: 1_000, durationMinutes: 2 })
    const result = completeExpiredSession(active, [], 31_000)
    expect(result).toEqual({ active, completed: null })
  })
})
