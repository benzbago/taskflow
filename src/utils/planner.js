import { parseLocalDate } from './dates'

export function scoreTask(task, date, alreadyPlannedIds = []) {
  let score = 0
  const reasons = []
  if (task.dueDate && task.dueDate < date) {
    score += 1000
    reasons.push('Overdue')
  } else if (task.dueDate === date) {
    score += 800
    reasons.push('Due today')
  } else if (task.dueDate) {
    const days = Math.round(
      (parseLocalDate(task.dueDate) - parseLocalDate(date)) / 86_400_000,
    )
    if (days <= 7) {
      score += Math.max(20, 150 - days * 15)
      reasons.push(`Due in ${days} day${days === 1 ? '' : 's'}`)
    }
  }
  const priority = { high: 300, medium: 150, low: 30 }
  score += priority[task.priority] || 0
  if (task.priority === 'high') reasons.push('High priority')
  if (task.pinned) {
    score += 200
    reasons.push('Pinned')
  }
  const estimate = task.estimatedMinutes || 30
  score += Math.max(0, 100 - estimate)
  if (alreadyPlannedIds.includes(task.id)) {
    score -= 250
    reasons.push('Already planned recently')
  }
  if (!reasons.length) reasons.push('Fits your available time')
  return { score, reasons }
}

export function suggestPlan(
  tasks,
  { date, availableMinutes, alreadyPlannedIds = [] },
) {
  const ranked = tasks
    .filter((task) => !task.completed)
    .map((task) => ({ task, ...scoreTask(task, date, alreadyPlannedIds) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.task.dueDate || '9999').localeCompare(
          String(b.task.dueDate || '9999'),
        ) ||
        a.task.title.localeCompare(b.task.title) ||
        a.task.id.localeCompare(b.task.id),
    )
  let remaining = Math.max(0, Number(availableMinutes))
  const items = []
  for (const entry of ranked) {
    const minutes = entry.task.estimatedMinutes || 30
    if (minutes <= remaining) {
      items.push({
        id: `${date}:${entry.task.id}`,
        taskId: entry.task.id,
        allocatedMinutes: minutes,
        score: entry.score,
        reasons: entry.reasons,
      })
      remaining -= minutes
    }
  }
  return {
    items,
    totalMinutes: Number(availableMinutes) - remaining,
    remainingMinutes: remaining,
  }
}

export function hydratePlan(plan, tasks, focusSessions) {
  return (plan.items || []).map((item) => {
    const task = tasks.find((entry) => entry.id === item.taskId)
    const actualMinutes = Math.round(
      focusSessions
        .filter(
          (session) =>
            session.type === 'focus' &&
            session.taskId === item.taskId &&
            session.date === plan.date,
        )
        .reduce((sum, session) => sum + session.durationMs, 0) / 60_000,
    )
    return {
      ...item,
      title: task?.title || 'Unavailable task',
      unavailable: !task,
      actualMinutes,
    }
  })
}
