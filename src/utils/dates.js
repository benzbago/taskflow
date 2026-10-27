const pad = (value) => String(value).padStart(2, '0')

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseLocalDate(key) {
  if (!key) return new Date()
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(key, amount) {
  const date = parseLocalDate(key)
  date.setDate(date.getDate() + amount)
  return localDateKey(date)
}

export function formatDate(key, options = { month: 'short', day: 'numeric' }) {
  return parseLocalDate(key)?.toLocaleDateString(undefined, options) || 'No date'
}

export function isOverdue(task, today = localDateKey()) {
  return Boolean(task.dueDate && !task.completed && task.dueDate < today)
}

export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = new Date(year, month, 1 - first.getDay())
  const end = new Date(year, month, last.getDate() + (6 - last.getDay()))
  const days = []
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push({ key: localDateKey(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === month })
  }
  return days
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

