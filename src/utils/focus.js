import { makeId } from './tasks'
import { localDateKey } from './dates'

export function createFocusSession({
  now = Date.now(),
  durationMinutes,
  type = 'focus',
  taskId = null,
}) {
  const durationMs = Math.max(1, Number(durationMinutes)) * 60_000
  return {
    id: makeId(),
    type,
    taskId,
    durationMs,
    startedAt: new Date(now).toISOString(),
    endsAt: new Date(now + durationMs).toISOString(),
    status: 'running',
    elapsedMs: 0,
    pausedAt: null,
  }
}

export function elapsedMs(session, now = Date.now()) {
  if (!session) return 0
  if (session.status === 'paused') return session.elapsedMs
  return Math.min(
    session.durationMs,
    session.elapsedMs + Math.max(0, now - Date.parse(session.startedAt)),
  )
}

export function remainingMs(session, now = Date.now()) {
  if (!session) return 0
  return Math.max(0, session.durationMs - elapsedMs(session, now))
}

export function pauseFocusSession(session, now = Date.now()) {
  if (!session || session.status !== 'running') return session
  return {
    ...session,
    elapsedMs: elapsedMs(session, now),
    status: 'paused',
    pausedAt: new Date(now).toISOString(),
  }
}

export function resumeFocusSession(session, now = Date.now()) {
  if (!session || session.status !== 'paused') return session
  return {
    ...session,
    status: 'running',
    startedAt: new Date(now).toISOString(),
    endsAt: new Date(
      now + session.durationMs - session.elapsedMs,
    ).toISOString(),
    pausedAt: null,
  }
}

export function completeExpiredSession(
  active,
  history,
  now = Date.now(),
  force = false,
) {
  if (!active || history.some((item) => item.id === active.id))
    return { active: null, completed: null }
  if (!force && (active.status !== 'running' || remainingMs(active, now) > 0))
    return { active, completed: null }
  const actual = force ? elapsedMs(active, now) : active.durationMs
  const completedAt = force ? now : Date.parse(active.endsAt)
  return {
    active: null,
    completed: {
      id: active.id,
      type: active.type,
      taskId: active.taskId,
      durationMs: Math.min(active.durationMs, actual),
      startedAt: active.startedAt,
      completedAt: new Date(completedAt).toISOString(),
      date: localDateKey(new Date(completedAt)),
    },
  }
}

export function focusMetrics(sessions, today = localDateKey()) {
  const focus = sessions.filter((session) => session.type === 'focus')
  const todayMs = focus
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + session.durationMs, 0)
  const todayDate = new Date(`${today}T12:00:00`)
  const start = new Date(todayDate)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const weekStart = localDateKey(start)
  const weekMs = focus
    .filter((session) => session.date >= weekStart && session.date <= today)
    .reduce((sum, session) => sum + session.durationMs, 0)
  return {
    todayMinutes: Math.round(todayMs / 60_000),
    weekMinutes: Math.round(weekMs / 60_000),
    completedSessions: focus.length,
  }
}
