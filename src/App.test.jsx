import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import App from './App'

describe('TaskFlow experience', () => {
  beforeEach(() => localStorage.clear())

  test('creates, completes, and searches for a task', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /new task/i }))
    await user.type(screen.getByLabelText(/task title/i), 'Plan tomorrow')
    await user.click(screen.getByRole('button', { name: /create task/i }))
    expect(screen.getByText('Plan tomorrow')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /complete plan tomorrow/i }))
    expect(screen.getByText('Plan tomorrow').closest('article')).toHaveClass('is-complete')
    await user.type(screen.getByRole('searchbox'), 'missing')
    expect(screen.queryByText('Plan tomorrow')).not.toBeInTheDocument()
  })

  test('opens the quick-create form with the n shortcut', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: /new task/i })).toBeInTheDocument()
  })

  test('switches theme and remembers the preference', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('taskflow:v1')).settings.theme).toBe('dark')
  })

  test('closes task editor with Escape', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: /new task/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: /new task/i }))
  })

  test('new productivity pages are reachable from primary navigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const label of ['Focus mode', 'Daily planner', 'Kanban board', 'Habit tracker']) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(screen.getByRole('heading', { name: label, level: 1 })).toBeInTheDocument()
    }
  })
})
