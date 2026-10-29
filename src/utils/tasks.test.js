import { describe, expect, test } from 'vitest'
import {
  createRecurringTask,
  filterTasks,
  removeCategoryFromTasks,
  sortTasks,
  taskMetrics,
} from './tasks'

const tasks = [
  {
    id: '1',
    title: 'Later low',
    completed: false,
    priority: 'low',
    dueDate: '2026-11-02',
    createdAt: '2026-10-01T09:00:00.000Z',
    categoryId: 'work',
  },
  {
    id: '2',
    title: 'Soon high',
    completed: true,
    priority: 'high',
    dueDate: '2026-10-28',
    createdAt: '2026-10-02T09:00:00.000Z',
    categoryId: 'personal',
  },
]

describe('task selectors', () => {
  test('filters by query, status, category and priority', () => {
    expect(
      filterTasks(tasks, {
        query: 'soon',
        status: 'completed',
        category: 'personal',
        priority: 'high',
      }).map((task) => task.id),
    ).toEqual(['2'])
  })

  test('sorts high priority before low priority', () => {
    expect(sortTasks(tasks, 'priority').map((task) => task.id)).toEqual([
      '2',
      '1',
    ])
  })

  test('moves tasks from a deleted category to Other', () => {
    expect(removeCategoryFromTasks(tasks, 'work', 'other')[0].categoryId).toBe(
      'other',
    )
  })

  test('creates the next daily recurrence only after completion', () => {
    const next = createRecurringTask({
      ...tasks[0],
      recurrence: 'daily',
      completed: true,
    })
    expect(next).toMatchObject({
      title: 'Later low',
      dueDate: '2026-11-03',
      status: 'todo',
      completed: false,
      recurrence: 'daily',
    })
    expect(next.id).not.toBe('1')
  })

  test('buckets completion timestamps by local calendar date', () => {
    const localCompletion = new Date(2026, 9, 27, 0, 30).toISOString()
    expect(
      taskMetrics(
        [{ completed: true, completedAt: localCompletion }],
        '2026-10-27',
      ).completedToday,
    ).toBe(1)
  })

  test('creates daily recurrences across month and year boundaries', () => {
    expect(
      createRecurringTask({
        ...tasks[0],
        completed: true,
        recurrence: 'daily',
        dueDate: '2026-12-31',
      }).dueDate,
    ).toBe('2027-01-01')
    expect(
      createRecurringTask({
        ...tasks[0],
        completed: true,
        recurrence: 'daily',
        dueDate: '2028-02-29',
      }).dueDate,
    ).toBe('2028-03-01')
  })

  test('creates weekly recurrences across calendar boundaries', () => {
    expect(
      createRecurringTask({
        ...tasks[0],
        completed: true,
        recurrence: 'weekly',
        dueDate: '2026-12-28',
      }).dueDate,
    ).toBe('2027-01-04')
  })
})
