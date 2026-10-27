import { DEFAULT_CATEGORIES } from '../data/defaults'

export const STORAGE_KEY = 'taskflow:v1'
export const STORAGE_RECOVERY_KEY = 'taskflow:recovery'

export function createInitialState() {
  return { version: 1, tasks: [], categories: DEFAULT_CATEGORIES, settings: { theme: 'system', name: '', compact: false } }
}

export function isValidState(value) {
  const optionalString = (item) => item == null || typeof item === 'string'
  const validSubtask = (item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.completed === 'boolean'
  return Boolean(value && value.version === 1 && Array.isArray(value.tasks) && Array.isArray(value.categories) && value.settings && typeof value.settings === 'object' &&
    value.tasks.every((task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean' && optionalString(task.completedAt) && optionalString(task.description) && optionalString(task.dueDate) && optionalString(task.dueTime) && optionalString(task.categoryId) && optionalString(task.priority) && optionalString(task.recurrence) && (!task.subtasks || Array.isArray(task.subtasks) && task.subtasks.every(validSubtask))) &&
    value.categories.every((category) => category && typeof category.id === 'string' && typeof category.name === 'string' && optionalString(category.color) && optionalString(category.icon)) &&
    value.categories.some((category) => category.id === 'other') && new Set(value.tasks.map((task) => task.id)).size === value.tasks.length && new Set(value.categories.map((category) => category.id)).size === value.categories.length)
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const value = JSON.parse(raw)
    if (isValidState(value)) return value
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
  return JSON.stringify({ ...state, version: 1, exportedAt: new Date().toISOString() }, null, 2)
}

export function parseImport(raw) {
  try {
    const value = JSON.parse(raw)
    if (!isValidState(value)) throw new Error()
    return { version: 1, tasks: value.tasks, categories: value.categories, settings: value.settings }
  } catch {
    throw new Error('Choose a valid TaskFlow backup file.')
  }
}
