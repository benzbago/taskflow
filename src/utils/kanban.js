export const KANBAN_STATUSES = ['todo', 'in-progress', 'done']

export function nextKanbanStatus(status, direction) {
  const index = KANBAN_STATUSES.indexOf(status)
  return KANBAN_STATUSES[Math.max(0, Math.min(KANBAN_STATUSES.length - 1, index + direction))]
}

export function filterKanbanTasks(tasks, filters = {}) {
  return tasks.filter((task) => (filters.category === 'all' || !filters.category || task.categoryId === filters.category) && (filters.priority === 'all' || !filters.priority || task.priority === filters.priority))
}

export function moveTaskInColumn(tasks, id, targetIndex) {
  const sorted = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const current = sorted.findIndex((task) => task.id === id)
  if (current < 0) return sorted
  const [task] = sorted.splice(current, 1)
  sorted.splice(Math.max(0, Math.min(targetIndex, sorted.length)), 0, task)
  return sorted.map((item, index) => ({ ...item, order: index }))
}

