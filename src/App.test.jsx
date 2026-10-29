import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react'
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
    await user.click(
      screen.getByRole('checkbox', { name: /complete plan tomorrow/i }),
    )
    expect(screen.getByText('Plan tomorrow').closest('article')).toHaveClass(
      'is-complete',
    )
    await user.type(screen.getByRole('searchbox'), 'missing')
    expect(screen.queryByText('Plan tomorrow')).not.toBeInTheDocument()
  })

  test('opens the quick-create form with the n shortcut', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    expect(
      screen.getByRole('dialog', { name: /new task/i }),
    ).toBeInTheDocument()
  })

  test('switches theme and remembers the preference', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('taskflow:v1')).settings.theme).toBe(
      'dark',
    )
  })

  test('closes task editor with Escape', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    expect(
      screen.getByRole('dialog', { name: /new task/i }),
    ).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('dialog', { name: /new task/i }),
    )
  })

  test('associates task title validation with the invalid field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    await user.click(screen.getByRole('button', { name: /create task/i }))

    const title = screen.getByLabelText(/task title/i)
    const error = screen.getByRole('alert')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAttribute('aria-describedby', error.id)
  })

  test('contains focus in the habit dialog and restores it after cancelling', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /habit tracker/i }))
    const trigger = screen.getByRole('button', { name: /new habit/i })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: /new habit/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const title = screen.getByLabelText(/habit name/i)
    expect(title).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(
      screen.getByRole('button', { name: /close habit form/i }),
    ).toHaveFocus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('button', { name: /save habit/i })).toHaveFocus()
    await user.tab()
    expect(
      screen.getByRole('button', { name: /close habit form/i }),
    ).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  test('restores the habit trigger after saving and closes safely if it is gone', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /habit tracker/i }))
    const trigger = screen.getByRole('button', { name: /new habit/i })
    await user.click(trigger)
    await user.type(screen.getByLabelText(/habit name/i), 'Stretch')
    await user.click(screen.getByRole('button', { name: /save habit/i }))
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    trigger.remove()
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: /new habit/i }),
    ).not.toBeInTheDocument()
  })

  test('announces and associates empty habit validation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /habit tracker/i }))
    await user.click(screen.getByRole('button', { name: /new habit/i }))
    await user.click(screen.getByRole('button', { name: /save habit/i }))

    const title = screen.getByLabelText(/habit name/i)
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent(/habit.*name/i)
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAttribute('aria-describedby', error.id)
  })

  test('does not open a second editor from the global shortcut inside the habit dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /habit tracker/i }))
    await user.click(screen.getByRole('button', { name: /new habit/i }))
    screen.getByRole('button', { name: /close habit form/i }).focus()

    await user.keyboard('n')

    expect(screen.getByRole('dialog', { name: /new habit/i })).toBeVisible()
    expect(
      screen.queryByRole('dialog', { name: /new task/i }),
    ).not.toBeInTheDocument()
  })

  test('restores the habit trigger after backdrop dismissal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /habit tracker/i }))
    const trigger = screen.getByRole('button', { name: /new habit/i })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: /new habit/i })

    fireEvent.mouseDown(dialog.parentElement)

    expect(
      screen.queryByRole('dialog', { name: /new habit/i }),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  test('new productivity pages are reachable from primary navigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const label of [
      'Focus mode',
      'Daily planner',
      'Kanban board',
      'Habit tracker',
    ]) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(
        screen.getByRole('heading', { name: label, level: 1 }),
      ).toBeInTheDocument()
    }
  })

  test('marks the active desktop and mobile navigation destinations', async () => {
    const user = userEvent.setup()
    render(<App />)
    const primary = screen.getByRole('navigation', {
      name: /primary navigation/i,
    })
    const mobile = screen.getByRole('navigation', {
      name: /mobile navigation/i,
    })
    expect(
      within(primary).getByRole('button', { name: /dashboard/i }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(mobile).getByRole('button', { name: /dashboard/i }),
    ).toHaveAttribute('aria-current', 'page')

    await user.click(within(mobile).getByRole('button', { name: /tasks/i }))
    expect(
      within(primary).getByRole('button', { name: /all tasks/i }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(mobile).getByRole('button', { name: /tasks/i }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('supports the mobile Kanban tab keyboard pattern and relationships', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /kanban board/i }))
    const todo = screen.getByRole('tab', { name: /to do/i })
    const progress = screen.getByRole('tab', { name: /in progress/i })
    const done = screen.getByRole('tab', { name: /^done$/i })

    expect(todo).toHaveAttribute('tabindex', '0')
    expect(todo).toHaveAttribute('aria-controls')
    expect(
      document.getElementById(todo.getAttribute('aria-controls')),
    ).toHaveAttribute('role', 'tabpanel')

    todo.focus()
    await user.keyboard('{ArrowLeft}')
    expect(done).toHaveFocus()
    expect(done).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(todo).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(progress).toHaveFocus()
    await user.keyboard('{End}')
    expect(done).toHaveFocus()
  })

  test('announces successful Kanban status changes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('n')
    await user.type(screen.getByLabelText(/task title/i), 'Accessible move')
    await user.click(screen.getByRole('button', { name: /create task/i }))
    await user.click(screen.getByRole('button', { name: /kanban board/i }))
    await user.click(
      screen.getByRole('button', { name: /move to in progress/i }),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Accessible move moved to In Progress',
    )
  })

  test('exposes a quiet Pomodoro timer while keeping completion separate', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /focus mode/i }))
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('aria-live', 'off')
    expect(timer).toHaveAccessibleName(/focus session.*remaining/i)
  })
})
