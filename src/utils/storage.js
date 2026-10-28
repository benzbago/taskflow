import { DEFAULT_CATEGORIES } from '../data/defaults'
import { isValidV1State, migrateState } from './migrations'

export const STORAGE_KEY = 'taskflow:v1'
export const STORAGE_RECOVERY_KEY = 'taskflow:recovery'

const CURRENT_SCHEMA_VERSION = 2

function safeGetItem(storage, key) {
  try {
    if (!storage || typeof storage.getItem !== 'function')
      return { ok: false, value: null }
    return { ok: true, value: storage.getItem(key) }
  } catch {
    return { ok: false, value: null }
  }
}

function decodeState(raw) {
  try {
    const original = JSON.parse(raw)
    if (original.version === 1 && !isValidV1State(original)) return null
    const value = original.version === 1 ? migrateState(original) : original
    return isValidState(value) ? { original, value } : null
  } catch {
    return null
  }
}

function persistedState(state) {
  const settings = { ...(state.settings || {}) }
  delete settings.migrationWriteBlocked
  delete settings.persistenceBlocked
  delete settings.recoveryAvailable
  return {
    version: CURRENT_SCHEMA_VERSION,
    tasks: state.tasks,
    categories: state.categories,
    settings,
    focusSessions: state.focusSessions,
    activeFocusSession: state.activeFocusSession,
    habits: state.habits,
    dailyPlans: state.dailyPlans,
  }
}

export function createInitialState() {
  return migrateState({
    version: 2,
    tasks: [],
    categories: DEFAULT_CATEGORIES,
    settings: { theme: 'system', name: '', compact: false },
  })
}

export function isValidState(value) {
  const optionalString = (item) => item == null || typeof item === 'string'
  const validDate = (item) => {
    if (typeof item !== 'string') return false
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item)
    if (!match) return false
    const date = new Date(`${item}T00:00:00.000Z`)
    return (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === Number(match[1]) &&
      date.getUTCMonth() + 1 === Number(match[2]) &&
      date.getUTCDate() === Number(match[3])
    )
  }
  const optionalDate = (item) => item == null || item === '' || validDate(item)
  const optionalTime = (item) =>
    item == null || item === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(item)
  const validTimestamp = (item) =>
    typeof item === 'string' && !Number.isNaN(Date.parse(item))
  const positive = (item) => Number.isFinite(item) && item > 0
  const validSubtask = (item) =>
    item &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.completed === 'boolean'
  const validCompletedFocus = (session) =>
    session &&
    typeof session.id === 'string' &&
    ['focus', 'short-break', 'long-break'].includes(session.type) &&
    positive(session.durationMs) &&
    optionalString(session.taskId) &&
    validTimestamp(session.startedAt) &&
    validTimestamp(session.completedAt) &&
    validDate(session.date)
  const validActiveFocus = (session) =>
    session &&
    typeof session.id === 'string' &&
    ['focus', 'short-break', 'long-break'].includes(session.type) &&
    positive(session.durationMs) &&
    optionalString(session.taskId) &&
    validTimestamp(session.startedAt) &&
    validTimestamp(session.endsAt) &&
    ['running', 'paused'].includes(session.status) &&
    Number.isFinite(session.elapsedMs) &&
    session.elapsedMs >= 0 &&
    session.elapsedMs <= session.durationMs &&
    (session.pausedAt == null || validTimestamp(session.pausedAt))
  const validSchedule = (schedule) =>
    schedule &&
    (schedule.type === 'daily' ||
      (schedule.type === 'weekdays' &&
        Array.isArray(schedule.days) &&
        schedule.days.length > 0 &&
        new Set(schedule.days).size === schedule.days.length &&
        schedule.days.every(
          (day) => Number.isInteger(day) && day >= 0 && day <= 6,
        )) ||
      (schedule.type === 'weekly' &&
        Number.isInteger(schedule.target) &&
        schedule.target >= 1 &&
        schedule.target <= 7))
  const validHabit = (habit) =>
    habit &&
    typeof habit.id === 'string' &&
    typeof habit.title === 'string' &&
    optionalString(habit.description) &&
    optionalString(habit.categoryId) &&
    optionalString(habit.icon) &&
    optionalString(habit.color) &&
    typeof habit.archived === 'boolean' &&
    validTimestamp(habit.createdAt) &&
    Array.isArray(habit.completionDates) &&
    new Set(habit.completionDates).size === habit.completionDates.length &&
    habit.completionDates.every(validDate) &&
    validSchedule(habit.schedule)
  const validPlanItem = (item) =>
    item &&
    typeof item.id === 'string' &&
    typeof item.taskId === 'string' &&
    positive(item.allocatedMinutes) &&
    (!item.reasons ||
      (Array.isArray(item.reasons) &&
        item.reasons.every((reason) => typeof reason === 'string')))
  const validPlan = (plan) =>
    plan &&
    typeof plan.id === 'string' &&
    validDate(plan.date) &&
    positive(plan.availableMinutes) &&
    validTimestamp(plan.createdAt) &&
    Array.isArray(plan.items) &&
    plan.items.every(validPlanItem) &&
    new Set(plan.items.map((item) => item.id)).size === plan.items.length
  const validOptionalPositive = (item) => item == null || positive(item)
  const validSettings = (settings) =>
    settings &&
    typeof settings === 'object' &&
    (settings.theme == null ||
      ['light', 'dark', 'system'].includes(settings.theme)) &&
    (settings.name == null || typeof settings.name === 'string') &&
    (settings.compact == null || typeof settings.compact === 'boolean') &&
    validOptionalPositive(settings.focusMinutes) &&
    validOptionalPositive(settings.shortBreakMinutes) &&
    validOptionalPositive(settings.longBreakMinutes) &&
    (settings.longBreakEvery == null ||
      (Number.isInteger(settings.longBreakEvery) &&
        settings.longBreakEvery > 0))
  const hasUniqueIds = (items) =>
    new Set(items.map((item) => item.id)).size === items.length
  return Boolean(
    value &&
    value.version === 2 &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.categories) &&
    validSettings(value.settings) &&
    value.tasks.every(
      (task) =>
        task &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.completed === 'boolean' &&
        ['todo', 'in-progress', 'done'].includes(task.status) &&
        task.completed === (task.status === 'done') &&
        optionalString(task.completedAt) &&
        (!task.completed || validTimestamp(task.completedAt)) &&
        optionalString(task.description) &&
        optionalDate(task.dueDate) &&
        optionalTime(task.dueTime) &&
        optionalString(task.categoryId) &&
        optionalString(task.priority) &&
        optionalString(task.recurrence) &&
        (task.estimatedMinutes == null || positive(task.estimatedMinutes)) &&
        (!task.subtasks ||
          (Array.isArray(task.subtasks) && task.subtasks.every(validSubtask))),
    ) &&
    value.categories.every(
      (category) =>
        category &&
        typeof category.id === 'string' &&
        typeof category.name === 'string' &&
        optionalString(category.color) &&
        optionalString(category.icon),
    ) &&
    value.categories.some((category) => category.id === 'other') &&
    new Set(value.tasks.map((task) => task.id)).size === value.tasks.length &&
    new Set(value.categories.map((category) => category.id)).size ===
      value.categories.length &&
    Array.isArray(value.focusSessions) &&
    value.focusSessions.every(validCompletedFocus) &&
    hasUniqueIds(value.focusSessions) &&
    (value.activeFocusSession == null ||
      validActiveFocus(value.activeFocusSession)) &&
    Array.isArray(value.habits) &&
    value.habits.every(validHabit) &&
    hasUniqueIds(value.habits) &&
    Array.isArray(value.dailyPlans) &&
    value.dailyPlans.every(validPlan) &&
    hasUniqueIds(value.dailyPlans) &&
    new Set(value.dailyPlans.map((plan) => plan.date)).size ===
      value.dailyPlans.length,
  )
}

export function loadState(storage = globalThis.localStorage) {
  const primary = safeGetItem(storage, STORAGE_KEY)
  if (!primary.ok) {
    const state = createInitialState()
    state.settings.persistenceBlocked = true
    return state
  }
  if (!primary.value) {
    const recovery = safeGetItem(storage, STORAGE_RECOVERY_KEY)
    const recovered = recovery.value ? decodeState(recovery.value) : null
    if (recovered) {
      recovered.value.settings.recoveryAvailable = true
      return recovered.value
    }
    const state = createInitialState()
    if (!recovery.ok) state.settings.persistenceBlocked = true
    return state
  }

  const decoded = decodeState(primary.value)
  if (decoded) {
    if (decoded.original.version === 1) {
      try {
        storage.setItem(STORAGE_RECOVERY_KEY, primary.value)
      } catch {
        decoded.value.settings.migrationWriteBlocked = true
      }
    }
    return decoded.value
  }

  const recovery = safeGetItem(storage, STORAGE_RECOVERY_KEY)
  const recovered = recovery.value ? decodeState(recovery.value) : null
  if (recovered) {
    recovered.value.settings.recoveryAvailable = true
    return recovered.value
  }

  if (recovery.ok) {
    try {
      storage.setItem(STORAGE_RECOVERY_KEY, primary.value)
    } catch {
      /* The primary value remains untouched for manual recovery. */
    }
  }
  const state = createInitialState()
  state.settings.recoveryAvailable = true
  if (!recovery.ok) state.settings.persistenceBlocked = true
  return state
}

export function saveState(state, storage = globalThis.localStorage) {
  if (
    state?.settings?.migrationWriteBlocked ||
    state?.settings?.persistenceBlocked ||
    state?.settings?.recoveryAvailable ||
    !storage ||
    typeof storage.setItem !== 'function'
  )
    return false
  try {
    const value = persistedState(state)
    if (!isValidState(value)) return false
    storage.setItem(STORAGE_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function serializeState(state) {
  return JSON.stringify(
    { ...persistedState(state), exportedAt: new Date().toISOString() },
    null,
    2,
  )
}

export function parseImport(raw) {
  let original
  try {
    original = JSON.parse(raw)
  } catch {
    throw new Error('Choose a valid TaskFlow backup file.')
  }
  if (Number.isInteger(original?.version) && original.version > 2)
    throw new Error(
      'This backup was created by a newer version of TaskFlow and cannot be imported safely.',
    )
  try {
    if (![1, 2].includes(original?.version)) throw new Error()
    if (original.version === 1 && !isValidV1State(original)) throw new Error()
    const value = original.version === 1 ? migrateState(original) : original
    if (!isValidState(value)) throw new Error()
    return persistedState(value)
  } catch {
    throw new Error('Choose a valid TaskFlow backup file.')
  }
}

export function preserveCurrentWorkspace(storage = globalThis.localStorage) {
  try {
    if (!storage || typeof storage.getItem !== 'function') return false
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return true
    if (!decodeState(raw)) {
      const recovery = storage.getItem(STORAGE_RECOVERY_KEY)
      if (recovery && decodeState(recovery)) return true
    }
    storage.setItem(STORAGE_RECOVERY_KEY, raw)
    return true
  } catch {
    return false
  }
}

export function replaceStoredState(state, storage = globalThis.localStorage) {
  const value = persistedState(state)
  if (!isValidState(value) || !preserveCurrentWorkspace(storage)) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
