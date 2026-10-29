import { describe, expect, test } from 'vitest'
import { migrateState } from './migrations'
import { DEFAULT_CATEGORIES } from '../data/defaults'

const v1 = {
  version: 1,
  tasks: [
    {
      id: 'open',
      title: 'Open',
      completed: false,
      completedAt: null,
      recurrenceSourceId: 'root',
    },
    {
      id: 'done',
      title: 'Done',
      completed: true,
      completedAt: '2026-10-26T10:00:00.000Z',
    },
  ],
  categories: DEFAULT_CATEGORIES,
  settings: { theme: 'dark', name: 'Benz', compact: true },
}

describe('v1 to v2 migration', () => {
  test('preserves existing records and initializes advanced collections', () => {
    const result = migrateState(v1)
    expect(result.version).toBe(2)
    expect(result.tasks.map((task) => task.status)).toEqual(['todo', 'done'])
    expect(result.tasks[0].recurrenceSourceId).toBe('root')
    expect(result.settings).toMatchObject(v1.settings)
    expect(result).toMatchObject({
      focusSessions: [],
      activeFocusSession: null,
      habits: [],
      dailyPlans: [],
    })
  })

  test('normalizes contradictory v2 task state to completion truth', () => {
    const result = migrateState({
      ...v1,
      version: 2,
      tasks: [{ ...v1.tasks[0], completed: true, status: 'todo' }],
      habits: [],
      focusSessions: [],
      dailyPlans: [],
      activeFocusSession: null,
    })
    expect(result.tasks[0].status).toBe('done')
  })
})
