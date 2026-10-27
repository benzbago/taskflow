import { describe, expect, test } from 'vitest'
import { addDays, buildMonthGrid, isOverdue, localDateKey } from './dates'

describe('local date helpers', () => {
  test('formats a date using local calendar parts', () => {
    expect(localDateKey(new Date(2026, 9, 27, 23, 30))).toBe('2026-10-27')
  })

  test('adds calendar days without UTC string conversion', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })

  test('only marks unfinished earlier dates overdue', () => {
    expect(isOverdue({ dueDate: '2026-10-26', completed: false }, '2026-10-27')).toBe(true)
    expect(isOverdue({ dueDate: '2026-10-26', completed: true }, '2026-10-27')).toBe(false)
  })

  test('month grid always contains complete weeks', () => {
    const grid = buildMonthGrid(2026, 9)
    expect(grid.length % 7).toBe(0)
    expect(grid.some((day) => day.key === '2026-10-01' && day.inMonth)).toBe(true)
  })
})

