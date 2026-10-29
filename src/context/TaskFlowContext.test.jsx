import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  TaskFlowProvider,
  taskFlowReducer,
  useTaskFlow,
} from './TaskFlowContext'
import { createInitialState } from '../utils/storage'

describe('recurring completion', () => {
  test('does not create duplicate next occurrences after reopen and recomplete', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: 'routine',
        title: 'Stretch',
        completed: false,
        completedAt: null,
        dueDate: '2026-10-27',
        recurrence: 'daily',
        subtasks: [],
      },
    ]
    const once = taskFlowReducer(state, { type: 'TOGGLE_TASK', id: 'routine' })
    const reopened = taskFlowReducer(once, {
      type: 'TOGGLE_TASK',
      id: 'routine',
    })
    const twice = taskFlowReducer(reopened, {
      type: 'TOGGLE_TASK',
      id: 'routine',
    })
    expect(
      twice.tasks.filter((task) => task.dueDate === '2026-10-28'),
    ).toHaveLength(1)
  })

  test('status transitions synchronize completion without duplicating recurrence', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: 'routine',
        title: 'Stretch',
        status: 'todo',
        completed: false,
        completedAt: null,
        dueDate: '2026-10-27',
        recurrence: 'daily',
        subtasks: [],
      },
    ]
    const done = taskFlowReducer(state, {
      type: 'SET_TASK_STATUS',
      id: 'routine',
      status: 'done',
    })
    expect(done.tasks.find((task) => task.id === 'routine')).toMatchObject({
      status: 'done',
      completed: true,
    })
    const reopened = taskFlowReducer(done, {
      type: 'SET_TASK_STATUS',
      id: 'routine',
      status: 'in-progress',
    })
    expect(reopened.tasks.find((task) => task.id === 'routine')).toMatchObject({
      status: 'in-progress',
      completed: false,
      completedAt: null,
    })
    const redone = taskFlowReducer(reopened, {
      type: 'SET_TASK_STATUS',
      id: 'routine',
      status: 'done',
    })
    expect(
      redone.tasks.filter((task) => task.dueDate === '2026-10-28'),
    ).toHaveLength(1)
  })

  test('reset clears all v2 feature collections', () => {
    const state = {
      ...createInitialState(),
      habits: [{ id: 'h' }],
      focusSessions: [{ id: 'f' }],
      dailyPlans: [{ id: 'p' }],
      activeFocusSession: { id: 'active' },
    }
    expect(taskFlowReducer(state, { type: 'RESET' })).toMatchObject({
      habits: [],
      focusSessions: [],
      dailyPlans: [],
      activeFocusSession: null,
    })
  })

  test('duplicating a completed task creates a synchronized todo task', () => {
    const state = createInitialState()
    state.tasks = [
      {
        id: 'done',
        title: 'Finished',
        status: 'done',
        completed: true,
        completedAt: '2026-10-27T10:00:00.000Z',
      },
    ]
    const next = taskFlowReducer(state, { type: 'DUPLICATE_TASK', id: 'done' })
    expect(next.tasks[0]).toMatchObject({
      status: 'todo',
      completed: false,
      completedAt: null,
    })
  })

  test('rejects non-positive daily plan allocations', () => {
    const state = createInitialState()
    const next = taskFlowReducer(state, {
      type: 'SAVE_DAILY_PLAN',
      plan: {
        date: '2026-10-27',
        availableMinutes: 60,
        items: [{ id: 'i', taskId: 't', allocatedMinutes: -5 }],
      },
    })
    expect(next).toBe(state)
  })

  test('deduplicates focus completion and clears the matching active session', () => {
    const completed = {
      id: 'focus-1',
      type: 'focus',
      durationMs: 60_000,
      startedAt: '2026-10-29T01:00:00.000Z',
      completedAt: '2026-10-29T01:01:00.000Z',
      date: '2026-10-29',
    }
    const state = {
      ...createInitialState(),
      activeFocusSession: { id: completed.id },
      focusSessions: [completed],
    }
    const next = taskFlowReducer(state, {
      type: 'COMPLETE_FOCUS',
      session: completed,
    })
    expect(next.activeFocusSession).toBeNull()
    expect(next.focusSessions).toEqual([completed])
  })

  test('keeps missing entities and unknown actions safe', () => {
    const state = {
      ...createInitialState(),
      tasks: [
        {
          id: 'task-1',
          title: 'Keep',
          status: 'todo',
          completed: false,
          completedAt: null,
          subtasks: [],
        },
      ],
      habits: [],
      dailyPlans: [
        {
          id: 'plan-1',
          date: '2026-10-29',
          availableMinutes: 30,
          createdAt: '2026-10-29T00:00:00.000Z',
          items: [{ id: 'item-1', taskId: 'deleted', allocatedMinutes: 30 }],
        },
      ],
    }

    expect(taskFlowReducer(state, { type: 'UNKNOWN' })).toBe(state)
    expect(
      taskFlowReducer(state, { type: 'DUPLICATE_TASK', id: 'missing' }),
    ).toBe(state)
    expect(
      taskFlowReducer(state, {
        type: 'TOGGLE_SUBTASK',
        taskId: 'missing',
        subtaskId: 'missing',
      }),
    ).toMatchObject({ tasks: state.tasks })
    expect(
      taskFlowReducer(state, {
        type: 'TOGGLE_SUBTASK',
        taskId: 'task-1',
        subtaskId: 'missing',
      }),
    ).toMatchObject({ tasks: state.tasks })
    expect(
      taskFlowReducer(state, {
        type: 'TOGGLE_HABIT',
        id: 'missing',
        date: '2026-10-29',
      }),
    ).toMatchObject({ habits: [] })
    expect(
      taskFlowReducer(state, { type: 'DELETE_TASK', id: 'missing' }).dailyPlans,
    ).toEqual(state.dailyPlans)
    expect(
      taskFlowReducer(state, { type: 'DELETE_DAILY_PLAN', id: 'missing' })
        .dailyPlans,
    ).toEqual(state.dailyPlans)
    const missingCategory = taskFlowReducer(state, {
      type: 'DELETE_CATEGORY',
      id: 'missing',
    })
    expect(missingCategory.categories).toEqual(state.categories)
    expect(missingCategory.tasks).toEqual(state.tasks)
  })
})

function PersistenceProbe() {
  const state = useTaskFlow()
  return (
    <>
      <span>{state.persistenceError ? 'Save failed' : 'Save ready'}</span>
      <span>Tasks: {state.tasks.length}</span>
      <button onClick={() => state.addTask({ title: 'In memory' })}>Add</button>
    </>
  )
}

describe('provider persistence failures', () => {
  afterEach(() => vi.restoreAllMocks())

  test('keeps in-memory state usable when LocalStorage writes fail', async () => {
    localStorage.clear()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    const user = userEvent.setup()
    render(
      <TaskFlowProvider>
        <PersistenceProbe />
      </TaskFlowProvider>,
    )

    await waitFor(() => expect(screen.getByText('Save failed')).toBeVisible())
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Tasks: 1')).toBeVisible()
    expect(screen.getByText('Save failed')).toBeVisible()
  })
})
