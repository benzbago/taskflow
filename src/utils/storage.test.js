import { describe, expect, test } from 'vitest'
import { createInitialState, loadState, parseImport, saveState, serializeState, STORAGE_RECOVERY_KEY } from './storage'

describe('versioned persistence', () => {
  test('returns defaults for corrupt storage', () => {
    const storage = { getItem: () => '{broken' }
    expect(loadState(storage).tasks).toEqual([])
  })

  test('round trips a versioned backup', () => {
    const state = createInitialState()
    const restored = parseImport(serializeState(state))
    expect(restored.version).toBe(1)
    expect(restored.categories.length).toBeGreaterThan(0)
  })

  test('rejects an import without valid task structure', () => {
    expect(() => parseImport(JSON.stringify({ version: 1, tasks: [{ nope: true }], categories: [], settings: {} }))).toThrow('valid TaskFlow backup')
  })

  test('rejects malformed nested and timestamp values', () => {
    const state = createInitialState()
    state.tasks = [{ id: '1', title: 'Unsafe', completed: true, completedAt: 42, subtasks: 'bad' }]
    expect(() => parseImport(JSON.stringify(state))).toThrow('valid TaskFlow backup')
  })

  test('rejects backups without the required Other category', () => {
    const state = createInitialState()
    state.categories = state.categories.filter((category) => category.id !== 'other')
    expect(() => parseImport(JSON.stringify(state))).toThrow('valid TaskFlow backup')
  })

  test('preserves corrupt stored data in a recovery key', () => {
    const values = new Map([['taskflow:v1', '{broken']])
    const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
    const state = loadState(storage)
    expect(values.get(STORAGE_RECOVERY_KEY)).toBe('{broken')
    expect(state.settings.recoveryAvailable).toBe(true)
  })

  test('reports storage write failure instead of throwing', () => {
    const storage = { setItem: () => { throw new DOMException('full', 'QuotaExceededError') } }
    expect(saveState(createInitialState(), storage)).toBe(false)
  })
})
