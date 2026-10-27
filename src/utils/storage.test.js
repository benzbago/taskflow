import { describe, expect, test } from 'vitest'
import { createInitialState, loadState, parseImport, serializeState } from './storage'

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
})
