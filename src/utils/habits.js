import { addDays, localDateKey, parseLocalDate } from './dates'

export function toggleHabitDate(habit, date) {
  const dates = new Set(habit.completionDates || [])
  dates.has(date) ? dates.delete(date) : dates.add(date)
  return { ...habit, completionDates: [...dates].sort() }
}

export function isHabitScheduled(habit, date) {
  if (habit.schedule?.type === 'daily' || habit.schedule?.type === 'weekly')
    return true
  return (habit.schedule?.days || []).includes(parseLocalDate(date).getDay())
}

function mondayKey(dateKey) {
  const date = parseLocalDate(dateKey)
  const offset = (date.getDay() + 6) % 7
  return addDays(dateKey, -offset)
}

function weeklyStats(habit, today) {
  const counts = new Map()
  for (const date of new Set(habit.completionDates || []))
    if (date <= today)
      counts.set(mondayKey(date), (counts.get(mondayKey(date)) || 0) + 1)
  const first = mondayKey(localDateKey(new Date(habit.createdAt)))
  const current = mondayKey(today)
  const weeks = []
  for (let key = first; key <= current; key = addDays(key, 7)) weeks.push(key)
  const qualified = (key) =>
    (counts.get(key) || 0) >= (habit.schedule.target || 1)
  let cursor = qualified(current) ? current : addDays(current, -7)
  let currentStreak = 0
  while (cursor >= first && qualified(cursor)) {
    currentStreak++
    cursor = addDays(cursor, -7)
  }
  let longestStreak = 0
  let run = 0
  for (const week of weeks) {
    run = qualified(week) ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  return { currentStreak, longestStreak }
}

export function habitStats(habit, today = localDateKey()) {
  if (habit.schedule?.type === 'weekly') {
    const streaks = weeklyStats(habit, today)
    const week = mondayKey(today)
    const completedThisWeek = habit.completionDates.filter(
      (date) => date <= today && mondayKey(date) === week,
    ).length
    return {
      ...streaks,
      consistency: Math.min(
        100,
        Math.round((completedThisWeek / (habit.schedule.target || 1)) * 100),
      ),
    }
  }
  const completed = new Set(habit.completionDates || [])
  const created = localDateKey(new Date(habit.createdAt))
  const expected = []
  for (let date = created; date <= today; date = addDays(date, 1))
    if (isHabitScheduled(habit, date)) expected.push(date)
  let cursor = expected.length - 1
  if (expected[cursor] === today && !completed.has(today)) cursor--
  let currentStreak = 0
  while (cursor >= 0 && completed.has(expected[cursor])) {
    currentStreak++
    cursor--
  }
  let longestStreak = 0
  let run = 0
  for (const date of expected) {
    run = completed.has(date) ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  const recent = expected.filter((date) => date >= addDays(today, -6))
  const consistency = recent.length
    ? Math.round(
        (recent.filter((date) => completed.has(date)).length / recent.length) *
          100,
      )
    : 0
  return { currentStreak, longestStreak, consistency }
}
