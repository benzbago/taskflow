import { describe, expect, test } from 'vitest'
import {
  createInitialState,
  loadState,
  parseImport,
  preserveCurrentWorkspace,
  replaceStoredState,
  saveState,
  serializeState,
  STORAGE_KEY,
  STORAGE_RECOVERY_KEY,
} from './storage'

function memoryStorage(entries = []) {
  const values = new Map(entries)
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  }
}

describe('versioned persistence', () => {
  test('returns defaults for corrupt storage', () => {
    const storage = { getItem: () => '{broken' }
    expect(loadState(storage).tasks).toEqual([])
  })

  test('round trips a versioned backup', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: 'task-1',
        title: 'Protected task',
        status: 'todo',
        completed: false,
        completedAt: null,
      },
    ]
    state.habits = [
      {
        id: 'habit-1',
        title: 'Walk',
        description: '',
        categoryId: null,
        icon: 'walk',
        color: '#000000',
        archived: false,
        createdAt: '2026-10-28T01:00:00.000Z',
        completionDates: ['2026-10-28'],
        schedule: { type: 'daily' },
      },
    ]
    state.focusSessions = [
      {
        id: 'focus-1',
        type: 'focus',
        taskId: 'task-1',
        durationMs: 1500000,
        startedAt: '2026-10-28T01:00:00.000Z',
        completedAt: '2026-10-28T01:25:00.000Z',
        date: '2026-10-28',
      },
    ]
    state.dailyPlans = [
      {
        id: 'plan-1',
        date: '2026-10-28',
        availableMinutes: 60,
        createdAt: '2026-10-28T00:00:00.000Z',
        items: [
          { id: 'item-1', taskId: 'task-1', allocatedMinutes: 30, reasons: [] },
        ],
      },
    ]
    const restored = parseImport(serializeState(state))
    expect(restored.version).toBe(2)
    expect(restored).toMatchObject({
      tasks: state.tasks,
      habits: state.habits,
      focusSessions: state.focusSessions,
      dailyPlans: state.dailyPlans,
    })
  })

  test('rejects unsupported future backup versions', () => {
    const future = { ...createInitialState(), version: 3 }
    expect(() => parseImport(JSON.stringify(future))).toThrow(
      'newer version of TaskFlow',
    )
  })

  test('rejects malformed known settings', () => {
    const state = createInitialState()
    state.settings.focusMinutes = 'twenty-five'
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
  })

  test('rejects an import without valid task structure', () => {
    expect(() =>
      parseImport(
        JSON.stringify({
          version: 1,
          tasks: [{ nope: true }],
          categories: [],
          settings: {},
        }),
      ),
    ).toThrow('valid TaskFlow backup')
  })

  test('rejects damaged v1 collections and malformed feature records', () => {
    expect(() =>
      parseImport(
        JSON.stringify({
          version: 1,
          tasks: 'damaged',
          categories: [],
          settings: {},
        }),
      ),
    ).toThrow('valid TaskFlow backup')
    const state = createInitialState()
    state.dailyPlans = [
      {
        id: 'p',
        date: '2026-10-27',
        availableMinutes: 60,
        createdAt: new Date().toISOString(),
        items: [null],
      },
    ]
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
    state.dailyPlans = []
    state.activeFocusSession = { id: 'f', type: 'focus', durationMs: 1000 }
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
  })

  test('rejects malformed nested and timestamp values', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: '1',
        title: 'Unsafe',
        completed: true,
        completedAt: 42,
        subtasks: 'bad',
      },
    ]
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
  })

  test('rejects malformed task scheduling fields', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: '1',
        title: 'Impossible schedule',
        status: 'todo',
        completed: false,
        completedAt: null,
        dueDate: '2026-99-99',
        dueTime: '29:75',
      },
    ]
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
  })

  test('rejects backups without the required Other category', () => {
    const state = createInitialState()
    state.categories = state.categories.filter(
      (category) => category.id !== 'other',
    )
    expect(() => parseImport(JSON.stringify(state))).toThrow(
      'valid TaskFlow backup',
    )
  })

  test('preserves corrupt stored data in a recovery key', () => {
    const storage = memoryStorage([[STORAGE_KEY, '{broken']])
    const state = loadState(storage)
    expect(storage.values.get(STORAGE_RECOVERY_KEY)).toBe('{broken')
    expect(state.settings.recoveryAvailable).toBe(true)
    expect(saveState(state, storage)).toBe(false)
    expect(storage.values.get(STORAGE_KEY)).toBe('{broken')
  })

  test('restores a valid recovery without overwriting it with corrupt primary data', () => {
    const recovery = serializeState({
      ...createInitialState(),
      tasks: [
        {
          id: 'safe',
          title: 'Recovered task',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    })
    const storage = memoryStorage([
      [STORAGE_KEY, '{broken'],
      [STORAGE_RECOVERY_KEY, recovery],
    ])
    const state = loadState(storage)
    expect(state.tasks[0].title).toBe('Recovered task')
    expect(storage.values.get(STORAGE_RECOVERY_KEY)).toBe(recovery)
    expect(state.settings.recoveryAvailable).toBe(true)
  })

  test('restores valid recovery data when the primary record is missing', () => {
    const recovery = serializeState({
      ...createInitialState(),
      tasks: [
        {
          id: 'safe',
          title: 'Only recovery copy',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    })
    const storage = memoryStorage([[STORAGE_RECOVERY_KEY, recovery]])
    const state = loadState(storage)
    expect(state.tasks[0].title).toBe('Only recovery copy')
    expect(state.settings.recoveryAvailable).toBe(true)
    expect(storage.values.has(STORAGE_KEY)).toBe(false)
  })

  test('handles storage read failures without throwing', () => {
    const storage = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
    }
    const state = loadState(storage)
    expect(state.tasks).toEqual([])
    expect(state.settings.persistenceBlocked).toBe(true)
  })

  test('reports storage write failure instead of throwing', () => {
    const storage = {
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
      },
    }
    expect(saveState(createInitialState(), storage)).toBe(false)
  })

  test('blocks migration overwrite when recovery cannot be preserved', () => {
    const legacy = JSON.stringify({
      version: 1,
      tasks: [],
      categories: [],
      settings: {},
    })
    const storage = {
      getItem: () => legacy,
      setItem: (key) => {
        if (key === STORAGE_RECOVERY_KEY) throw new Error('quota')
      },
    }
    const state = loadState(storage)
    expect(state.settings.migrationWriteBlocked).toBe(true)
    expect(saveState(state, storage)).toBe(false)
  })

  test('preserves the current workspace before import replacement', () => {
    const storage = memoryStorage([[STORAGE_KEY, '{"current":true}']])
    expect(preserveCurrentWorkspace(storage)).toBe(true)
    expect(storage.values.get(STORAGE_RECOVERY_KEY)).toBe('{"current":true}')
  })

  test('does not replace current data when an imported workspace cannot be written', () => {
    const current = serializeState({
      ...createInitialState(),
      tasks: [
        {
          id: 'current',
          title: 'Keep me',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    })
    const values = new Map([[STORAGE_KEY, current]])
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        if (key === STORAGE_KEY)
          throw new DOMException('full', 'QuotaExceededError')
        values.set(key, value)
      },
    }
    const imported = {
      ...createInitialState(),
      tasks: [
        {
          id: 'imported',
          title: 'New workspace',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    }
    expect(replaceStoredState(imported, storage)).toBe(false)
    expect(values.get(STORAGE_KEY)).toBe(current)
    expect(values.get(STORAGE_RECOVERY_KEY)).toBe(current)
  })

  test('does not overwrite a valid recovery with corrupt primary data during failed import', () => {
    const recovery = serializeState({
      ...createInitialState(),
      tasks: [
        {
          id: 'recovered',
          title: 'Last valid copy',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    })
    const values = new Map([
      [STORAGE_KEY, '{broken'],
      [STORAGE_RECOVERY_KEY, recovery],
    ])
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        if (key === STORAGE_KEY)
          throw new DOMException('full', 'QuotaExceededError')
        values.set(key, value)
      },
    }
    expect(replaceStoredState(createInitialState(), storage)).toBe(false)
    expect(values.get(STORAGE_KEY)).toBe('{broken')
    expect(values.get(STORAGE_RECOVERY_KEY)).toBe(recovery)
  })

  test('preserves current data before storing a valid import', () => {
    const current = serializeState(createInitialState())
    const storage = memoryStorage([[STORAGE_KEY, current]])
    const imported = {
      ...createInitialState(),
      tasks: [
        {
          id: 'imported',
          title: 'Imported safely',
          status: 'todo',
          completed: false,
          completedAt: null,
        },
      ],
    }
    expect(replaceStoredState(imported, storage)).toBe(true)
    expect(storage.values.get(STORAGE_RECOVERY_KEY)).toBe(current)
    expect(JSON.parse(storage.values.get(STORAGE_KEY)).tasks[0].title).toBe(
      'Imported safely',
    )
  })

  test('rejects duplicate collection identities and daily-plan dates', () => {
    const completedFocus = {
      id: 'focus-1',
      type: 'focus',
      taskId: null,
      durationMs: 1500000,
      startedAt: '2026-10-28T01:00:00.000Z',
      completedAt: '2026-10-28T01:25:00.000Z',
      date: '2026-10-28',
    }
    const habit = {
      id: 'habit-1',
      title: 'Walk',
      description: '',
      categoryId: null,
      icon: 'walk',
      color: '#000000',
      archived: false,
      createdAt: '2026-10-28T01:00:00.000Z',
      completionDates: [],
      schedule: { type: 'daily' },
    }
    const plan = {
      id: 'plan-1',
      date: '2026-10-28',
      availableMinutes: 60,
      createdAt: '2026-10-28T00:00:00.000Z',
      items: [],
    }
    const duplicateFocus = {
      ...createInitialState(),
      focusSessions: [completedFocus, { ...completedFocus }],
    }
    const duplicateHabits = {
      ...createInitialState(),
      habits: [habit, { ...habit }],
    }
    const duplicatePlanIds = {
      ...createInitialState(),
      dailyPlans: [plan, { ...plan, date: '2026-10-29' }],
    }
    const duplicatePlanDates = {
      ...createInitialState(),
      dailyPlans: [plan, { ...plan, id: 'plan-2' }],
    }
    for (const state of [
      duplicateFocus,
      duplicateHabits,
      duplicatePlanIds,
      duplicatePlanDates,
    ]) {
      expect(() => parseImport(JSON.stringify(state))).toThrow(
        'valid TaskFlow backup',
      )
    }
  })
})
