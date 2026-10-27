import { describe, expect, test } from 'vitest'
import { taskFlowReducer } from './TaskFlowContext'
import { createInitialState } from '../utils/storage'

describe('recurring completion', () => {
  test('does not create duplicate next occurrences after reopen and recomplete', () => {
    const state = createInitialState()
    state.tasks = [{ id: 'routine', title: 'Stretch', completed: false, completedAt: null, dueDate: '2026-10-27', recurrence: 'daily', subtasks: [] }]
    const once = taskFlowReducer(state, { type: 'TOGGLE_TASK', id: 'routine' })
    const reopened = taskFlowReducer(once, { type: 'TOGGLE_TASK', id: 'routine' })
    const twice = taskFlowReducer(reopened, { type: 'TOGGLE_TASK', id: 'routine' })
    expect(twice.tasks.filter((task) => task.dueDate === '2026-10-28')).toHaveLength(1)
  })
})
