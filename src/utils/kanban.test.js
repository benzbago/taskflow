import { describe, expect, test } from 'vitest'
import { filterKanbanTasks, moveTaskInColumn, nextKanbanStatus } from './kanban'

const tasks = [
  { id: 'a', status: 'todo', priority: 'high', categoryId: 'work', order: 2 },
  {
    id: 'b',
    status: 'todo',
    priority: 'low',
    categoryId: 'personal',
    order: 1,
  },
]

describe('kanban helpers', () => {
  test('moves through workflow statuses in both directions', () => {
    expect(nextKanbanStatus('todo', 1)).toBe('in-progress')
    expect(nextKanbanStatus('in-progress', 1)).toBe('done')
    expect(nextKanbanStatus('done', -1)).toBe('in-progress')
  })

  test('filters by priority and category', () => {
    expect(
      filterKanbanTasks(tasks, { priority: 'high', category: 'work' }).map(
        (task) => task.id,
      ),
    ).toEqual(['a'])
  })

  test('assigns stable order when moving inside a column', () => {
    expect(moveTaskInColumn(tasks, 'a', 0).map((task) => task.id)).toEqual([
      'a',
      'b',
    ])
  })
})
