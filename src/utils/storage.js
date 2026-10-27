import { DEFAULT_CATEGORIES } from '../data/defaults'

export const STORAGE_KEY = 'taskflow:v1'

export function createInitialState() {
  return { version: 1, tasks: [], categories: DEFAULT_CATEGORIES, settings: { theme: 'system', name: '', compact: false } }
}

export function isValidState(value) {
  return Boolean(value && value.version === 1 && Array.isArray(value.tasks) && Array.isArray(value.categories) && value.settings &&
    value.tasks.every((task) => typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean') &&
    value.categories.every((category) => typeof category.id === 'string' && typeof category.name === 'string'))
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const value = JSON.parse(raw)
    return isValidState(value) ? value : createInitialState()
  } catch {
    return createInitialState()
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  storage?.setItem(STORAGE_KEY, JSON.stringify(state))
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
