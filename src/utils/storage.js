import { DEFAULT_CATEGORIES } from '../data/defaults'
import { migrateState } from './migrations'

export const STORAGE_KEY = 'taskflow:v1'
export const STORAGE_RECOVERY_KEY = 'taskflow:recovery'

export function createInitialState() {
  return migrateState({ version: 2, tasks: [], categories: DEFAULT_CATEGORIES, settings: { theme: 'system', name: '', compact: false } })
}

export function isValidState(value) {
  const optionalString = (item) => item == null || typeof item === 'string'
  const validSubtask = (item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.completed === 'boolean'
  const validFocus = (session) => session && typeof session.id === 'string' && ['focus', 'short-break', 'long-break'].includes(session.type) && Number.isFinite(session.durationMs)
  const validHabit = (habit) => habit && typeof habit.id === 'string' && typeof habit.title === 'string' && Array.isArray(habit.completionDates) && habit.completionDates.every((date) => typeof date === 'string') && habit.schedule && typeof habit.schedule.type === 'string'
  const validPlan = (plan) => plan && typeof plan.id === 'string' && typeof plan.date === 'string' && Number.isFinite(plan.availableMinutes) && Array.isArray(plan.items)
  return Boolean(value && value.version === 2 && Array.isArray(value.tasks) && Array.isArray(value.categories) && value.settings && typeof value.settings === 'object' &&
    value.tasks.every((task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean' && ['todo', 'in-progress', 'done'].includes(task.status) && optionalString(task.completedAt) && optionalString(task.description) && optionalString(task.dueDate) && optionalString(task.dueTime) && optionalString(task.categoryId) && optionalString(task.priority) && optionalString(task.recurrence) && (task.estimatedMinutes == null || Number.isFinite(task.estimatedMinutes)) && (!task.subtasks || Array.isArray(task.subtasks) && task.subtasks.every(validSubtask))) &&
    value.categories.every((category) => category && typeof category.id === 'string' && typeof category.name === 'string' && optionalString(category.color) && optionalString(category.icon)) &&
    value.categories.some((category) => category.id === 'other') && new Set(value.tasks.map((task) => task.id)).size === value.tasks.length && new Set(value.categories.map((category) => category.id)).size === value.categories.length &&
    Array.isArray(value.focusSessions) && value.focusSessions.every(validFocus) && (value.activeFocusSession == null || validFocus(value.activeFocusSession)) && Array.isArray(value.habits) && value.habits.every(validHabit) && Array.isArray(value.dailyPlans) && value.dailyPlans.every(validPlan))
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const original = JSON.parse(raw)
    const value = original.version === 1 ? migrateState(original) : original
    if (isValidState(value)) {
      if (original.version === 1) try { storage?.setItem(STORAGE_RECOVERY_KEY, raw) } catch { /* best effort */ }
      return value
    }
    throw new Error('Invalid stored data')
  } catch {
    const raw = storage?.getItem(STORAGE_KEY)
    if (raw) {
      try { storage?.setItem(STORAGE_RECOVERY_KEY, raw) } catch { /* best effort */ }
    }
    const state = createInitialState()
    state.settings.recoveryAvailable = Boolean(raw)
    return state
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function serializeState(state) {
  return JSON.stringify({ ...state, version: 2, exportedAt: new Date().toISOString() }, null, 2)
}

export function parseImport(raw) {
  try {
    const original = JSON.parse(raw)
    const value = original.version === 1 ? migrateState(original) : original
    if (!isValidState(value)) throw new Error()
    const { exportedAt, ...state } = value
    return state
  } catch {
    throw new Error('Choose a valid TaskFlow backup file.')
  }
}
