import { describe, expect, test } from 'vitest'
import { habitStats, toggleHabitDate } from './habits'

const habit = (
  schedule,
  completionDates,
  createdAt = '2026-10-01T00:00:00.000Z',
) => ({ id: 'h', title: 'Habit', schedule, completionDates, createdAt })

describe('habit completion and streaks', () => {
  test('completion is unique per local date and can be undone', () => {
    const once = toggleHabitDate(habit({ type: 'daily' }, []), '2026-10-27')
    expect(once.completionDates).toEqual(['2026-10-27'])
    expect(toggleHabitDate(once, '2026-10-27').completionDates).toEqual([])
  })

  test('unfinished current day does not break a daily streak', () => {
    const stats = habitStats(
      habit({ type: 'daily' }, ['2026-10-24', '2026-10-25', '2026-10-26']),
      '2026-10-27',
    )
    expect(stats.currentStreak).toBe(3)
  })

  test('weekday schedule skips weekends', () => {
    const stats = habitStats(
      habit({ type: 'weekdays', days: [1, 2, 3, 4, 5] }, [
        '2026-10-23',
        '2026-10-26',
      ]),
      '2026-10-27',
    )
    expect(stats.currentStreak).toBe(2)
  })

  test('weekly frequency counts qualifying weeks across year boundary', () => {
    const stats = habitStats(
      habit(
        { type: 'weekly', target: 2 },
        ['2025-12-29', '2025-12-31', '2026-01-05', '2026-01-07'],
        '2025-12-28T00:00:00.000Z',
      ),
      '2026-01-12',
    )
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
  })

  test('weekly review ignores completions after the selected date', () => {
    const stats = habitStats(
      habit({ type: 'weekly', target: 2 }, ['2026-10-26', '2026-10-28']),
      '2026-10-27',
    )
    expect(stats.consistency).toBe(50)
    expect(stats.currentStreak).toBe(0)
  })
})
