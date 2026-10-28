import { DEFAULT_CATEGORIES } from '../data/defaults'
import { isValidV1State, migrateState } from './migrations'

export const STORAGE_KEY = 'taskflow:v1'
export const STORAGE_RECOVERY_KEY = 'taskflow:recovery'

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
  const validDate = (item) =>
    typeof item === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item) &&
    !Number.isNaN(Date.parse(`${item}T12:00:00`))
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
  return Boolean(
    value &&
    value.version === 2 &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.categories) &&
    value.settings &&
    typeof value.settings === 'object' &&
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
        optionalString(task.dueDate) &&
        optionalString(task.dueTime) &&
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
    (value.activeFocusSession == null ||
      validActiveFocus(value.activeFocusSession)) &&
    Array.isArray(value.habits) &&
    value.habits.every(validHabit) &&
    Array.isArray(value.dailyPlans) &&
    value.dailyPlans.every(validPlan),
  )
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const original = JSON.parse(raw)
    if (original.version === 1 && !isValidV1State(original))
      throw new Error('Invalid stored data')
    const value = original.version === 1 ? migrateState(original) : original
    if (isValidState(value)) {
      if (original.version === 1) {
        try {
          storage?.setItem(STORAGE_RECOVERY_KEY, raw)
        } catch {
          value.settings.migrationWriteBlocked = true
        }
      }
      return value
    }
    throw new Error('Invalid stored data')
  } catch {
    const raw = storage?.getItem(STORAGE_KEY)
    if (raw) {
      try {
        storage?.setItem(STORAGE_RECOVERY_KEY, raw)
      } catch {
        /* best effort */
      }
    }
    const state = createInitialState()
    state.settings.recoveryAvailable = Boolean(raw)
    return state
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  if (state?.settings?.migrationWriteBlocked) return false
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function serializeState(state) {
  return JSON.stringify(
    { ...state, version: 2, exportedAt: new Date().toISOString() },
    null,
    2,
  )
}

export function parseImport(raw) {
  try {
    const original = JSON.parse(raw)
    if (original.version === 1 && !isValidV1State(original)) throw new Error()
    const value = original.version === 1 ? migrateState(original) : original
    if (!isValidState(value)) throw new Error()
    const { exportedAt, ...state } = value
    return state
  } catch {
    throw new Error('Choose a valid TaskFlow backup file.')
  }
}

export function preserveCurrentWorkspace(storage = globalThis.localStorage) {
  const raw = storage?.getItem(STORAGE_KEY)
  if (!raw) return true
  try {
    storage.setItem(STORAGE_RECOVERY_KEY, raw)
    return true
  } catch {
    return false
  }
}
