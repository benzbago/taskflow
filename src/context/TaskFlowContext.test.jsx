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

  test('status transitions synchronize completion without duplicating recurrence', () => {
    const state = createInitialState()
    state.tasks = [{ id: 'routine', title: 'Stretch', status: 'todo', completed: false, completedAt: null, dueDate: '2026-10-27', recurrence: 'daily', subtasks: [] }]
    const done = taskFlowReducer(state, { type: 'SET_TASK_STATUS', id: 'routine', status: 'done' })
    expect(done.tasks.find((task) => task.id === 'routine')).toMatchObject({ status: 'done', completed: true })
    const reopened = taskFlowReducer(done, { type: 'SET_TASK_STATUS', id: 'routine', status: 'in-progress' })
    expect(reopened.tasks.find((task) => task.id === 'routine')).toMatchObject({ status: 'in-progress', completed: false, completedAt: null })
    const redone = taskFlowReducer(reopened, { type: 'SET_TASK_STATUS', id: 'routine', status: 'done' })
    expect(redone.tasks.filter((task) => task.dueDate === '2026-10-28')).toHaveLength(1)
  })

  test('reset clears all v2 feature collections', () => {
    const state = { ...createInitialState(), habits: [{ id: 'h' }], focusSessions: [{ id: 'f' }], dailyPlans: [{ id: 'p' }], activeFocusSession: { id: 'active' } }
    expect(taskFlowReducer(state, { type: 'RESET' })).toMatchObject({ habits: [], focusSessions: [], dailyPlans: [], activeFocusSession: null })
  })

  test('duplicating a completed task creates a synchronized todo task', () => {
    const state = createInitialState()
    state.tasks = [{ id:'done', title:'Finished', status:'done', completed:true, completedAt:'2026-10-27T10:00:00.000Z' }]
    const next = taskFlowReducer(state, { type:'DUPLICATE_TASK', id:'done' })
    expect(next.tasks[0]).toMatchObject({ status:'todo', completed:false, completedAt:null })
  })

  test('rejects non-positive daily plan allocations', () => {
    const state = createInitialState()
    const next = taskFlowReducer(state, { type:'SAVE_DAILY_PLAN', plan:{ date:'2026-10-27', availableMinutes:60, items:[{ id:'i', taskId:'t', allocatedMinutes:-5 }] } })
    expect(next).toBe(state)
  })
})
