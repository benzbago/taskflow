import { DEFAULT_CATEGORIES } from '../data/defaults'

const defaultSettings = { theme: 'system', name: '', compact: false, focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4 }

export function normalizeTask(task) {
  const completed = Boolean(task.completed || task.status === 'done')
  return {
    ...task,
    completed,
    completedAt: completed ? task.completedAt || null : null,
    status: completed ? 'done' : task.status === 'in-progress' ? 'in-progress' : 'todo',
    estimatedMinutes: Number.isFinite(task.estimatedMinutes) && task.estimatedMinutes > 0 ? task.estimatedMinutes : null,
  }
}

export function migrateState(value = {}) {
  return {
    version: 2,
    tasks: Array.isArray(value.tasks) ? value.tasks.map(normalizeTask) : [],
    categories: Array.isArray(value.categories) && value.categories.length ? value.categories : DEFAULT_CATEGORIES,
    settings: { ...defaultSettings, ...(value.settings || {}) },
    focusSessions: Array.isArray(value.focusSessions) ? value.focusSessions : [],
    activeFocusSession: value.activeFocusSession || null,
    habits: Array.isArray(value.habits) ? value.habits : [],
    dailyPlans: Array.isArray(value.dailyPlans) ? value.dailyPlans : [],
  }
}

