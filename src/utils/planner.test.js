import { describe, expect, test } from 'vitest'
import { hydratePlan, scoreTask, suggestPlan } from './planner'

const tasks = [
  {
    id: 'overdue',
    title: 'Overdue',
    completed: false,
    dueDate: '2026-10-26',
    priority: 'medium',
    estimatedMinutes: 60,
  },
  {
    id: 'high',
    title: 'High',
    completed: false,
    dueDate: '2026-11-01',
    priority: 'high',
    estimatedMinutes: 90,
  },
  {
    id: 'today',
    title: 'Today',
    completed: false,
    dueDate: '2026-10-27',
    priority: 'low',
    estimatedMinutes: 30,
  },
  {
    id: 'done',
    title: 'Done',
    completed: true,
    dueDate: '2026-10-27',
    priority: 'high',
    estimatedMinutes: 15,
  },
  { id: 'fallback', title: 'Fallback', completed: false, priority: 'low' },
]

describe('deterministic daily planning', () => {
  test('scores overdue and due-today work ahead of ordinary work', () => {
    expect(scoreTask(tasks[0], '2026-10-27').score).toBeGreaterThan(
      scoreTask(tasks[1], '2026-10-27').score,
    )
    expect(scoreTask(tasks[2], '2026-10-27').reasons).toContain('Due today')
  })

  test('fits tasks inside the budget and excludes completed tasks', () => {
    const plan = suggestPlan(tasks, {
      date: '2026-10-27',
      availableMinutes: 120,
    })
    expect(plan.totalMinutes).toBeLessThanOrEqual(120)
    expect(plan.items.some((item) => item.taskId === 'done')).toBe(false)
    expect(plan.items[0].taskId).toBe('overdue')
  })

  test('uses 30 minutes without changing a task lacking an estimate', () => {
    const plan = suggestPlan([tasks[4]], {
      date: '2026-10-27',
      availableMinutes: 30,
    })
    expect(plan.items[0].allocatedMinutes).toBe(30)
    expect(tasks[4].estimatedMinutes).toBeUndefined()
  })

  test('same inputs produce the same stable suggestions', () => {
    expect(
      suggestPlan(tasks, { date: '2026-10-27', availableMinutes: 180 }),
    ).toEqual(suggestPlan(tasks, { date: '2026-10-27', availableMinutes: 180 }))
  })

  test('saved plans tolerate deleted task references', () => {
    const hydrated = hydratePlan(
      { items: [{ taskId: 'missing', allocatedMinutes: 30 }] },
      [],
      [],
    )
    expect(hydrated[0]).toMatchObject({
      title: 'Unavailable task',
      unavailable: true,
      actualMinutes: 0,
    })
  })
})
