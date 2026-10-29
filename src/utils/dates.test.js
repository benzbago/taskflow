import { describe, expect, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { addDays, buildMonthGrid, isOverdue, localDateKey } from './dates'

describe('local date helpers', () => {
  test('formats a date using local calendar parts', () => {
    expect(localDateKey(new Date(2026, 9, 27, 23, 30))).toBe('2026-10-27')
  })

  test('adds calendar days without UTC string conversion', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })

  test('only marks unfinished earlier dates overdue', () => {
    expect(
      isOverdue({ dueDate: '2026-10-26', completed: false }, '2026-10-27'),
    ).toBe(true)
    expect(
      isOverdue({ dueDate: '2026-10-26', completed: true }, '2026-10-27'),
    ).toBe(false)
  })

  test('month grid always contains complete weeks', () => {
    const grid = buildMonthGrid(2026, 9)
    expect(grid.length % 7).toBe(0)
    expect(grid.some((day) => day.key === '2026-10-01' && day.inMonth)).toBe(
      true,
    )
  })

  test('rolls local calendar days across leap-month and year boundaries', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  test('uses the local side of midnight instead of the UTC calendar day', () => {
    const beforeMidnight = new Date(2026, 11, 31, 23, 59, 59)
    const afterMidnight = new Date(2027, 0, 1, 0, 0, 1)
    expect(localDateKey(beforeMidnight)).toBe('2026-12-31')
    expect(localDateKey(afterMidnight)).toBe('2027-01-01')
  })

  test('keeps calendar dates stable across defined DST offset changes', () => {
    const script = `
      import { addDays, parseLocalDate } from './src/utils/dates.js'
      console.log(JSON.stringify({
        spring: addDays('2026-03-08', 1),
        springOffsets: [
          parseLocalDate('2026-03-08').getTimezoneOffset(),
          parseLocalDate('2026-03-09').getTimezoneOffset(),
        ],
        fall: addDays('2026-11-01', 1),
        fallOffsets: [
          parseLocalDate('2026-11-01').getTimezoneOffset(),
          parseLocalDate('2026-11-02').getTimezoneOffset(),
        ],
      }))
    `
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', script],
      {
        cwd: process.cwd(),
        env: { ...process.env, TZ: 'America/New_York' },
        encoding: 'utf8',
      },
    )
    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout.trim())).toEqual({
      spring: '2026-03-09',
      springOffsets: [300, 240],
      fall: '2026-11-02',
      fallOffsets: [240, 300],
    })
  })
})
