import { addDays, localDateKey } from './dates'

export const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function filterTasks(tasks, filters = {}) {
  const query = (filters.query || '').trim().toLowerCase()
  return tasks.filter((task) => {
    const text = `${task.title} ${task.description || ''}`.toLowerCase()
    return (!query || text.includes(query)) &&
      (!filters.status || filters.status === 'all' || (filters.status === 'completed' ? task.completed : !task.completed)) &&
      (!filters.category || filters.category === 'all' || task.categoryId === filters.category) &&
      (!filters.priority || filters.priority === 'all' || task.priority === filters.priority)
  })
}

export function sortTasks(tasks, sort = 'dueDate') {
  const priority = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sort === 'priority') return (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3)
    if (sort === 'createdAt') return String(b.createdAt).localeCompare(String(a.createdAt))
    if (sort === 'status') return Number(a.completed) - Number(b.completed)
    return String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))
  })
}

export function removeCategoryFromTasks(tasks, categoryId, fallbackId = 'other') {
  return tasks.map((task) => task.categoryId === categoryId ? { ...task, categoryId: fallbackId } : task)
}

export function createRecurringTask(task) {
  if (!task.completed || !task.recurrence || task.recurrence === 'none' || !task.dueDate) return null
  return {
    ...task,
    id: makeId(),
    completed: false,
    completedAt: null,
    dueDate: addDays(task.dueDate, task.recurrence === 'weekly' ? 7 : 1),
    createdAt: new Date().toISOString(),
    subtasks: (task.subtasks || []).map((item) => ({ ...item, id: makeId(), completed: false })),
  }
}

export function taskMetrics(tasks, today = localDateKey()) {
  const completedToday = tasks.filter((task) => task.completedAt?.slice(0, 10) === today).length
  const pending = tasks.filter((task) => !task.completed).length
  const overdue = tasks.filter((task) => task.dueDate && !task.completed && task.dueDate < today).length
  const todays = tasks.filter((task) => task.dueDate === today)
  const todayDone = todays.filter((task) => task.completed).length
  return { total: tasks.length, completedToday, pending, overdue, progress: todays.length ? Math.round((todayDone / todays.length) * 100) : 0 }
}

export function analyticsData(tasks, days = 7) {
  const today = localDateKey()
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - days + 1)
    return { date, label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }), completed: tasks.filter((task) => task.completedAt?.slice(0, 10) === date).length }
  })
}

