import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

let focusShouldThrow = false
let providerShouldThrow = false

vi.mock('./pages/FocusPage', () => ({
  default: () => {
    if (focusShouldThrow) throw new Error('Focus render failed')
    return <h1>Focus mode</h1>
  },
}))

vi.mock('./context/TaskFlowContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    TaskFlowProvider: ({ children }) => {
      if (providerShouldThrow) throw new Error('Provider render failed')
      const Provider = actual.TaskFlowProvider
      return <Provider>{children}</Provider>
    },
  }
})

import App from './App'

beforeEach(() => {
  focusShouldThrow = false
  providerShouldThrow = false
  localStorage.clear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

test('isolates a page failure and retries on the current page without data loss', async () => {
  const user = userEvent.setup()
  render(<App />)
  const primary = localStorage.getItem('taskflow:v1')
  localStorage.setItem('taskflow:recovery', 'preserved recovery')
  focusShouldThrow = true
  await user.click(screen.getByRole('button', { name: 'Focus mode' }))

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Focus Mode hit an unexpected problem',
  )
  expect(screen.getByRole('complementary')).toBeInTheDocument()

  focusShouldThrow = false
  await user.click(screen.getByRole('button', { name: 'Try Again' }))

  expect(
    within(screen.getByRole('main')).getByRole('heading', {
      name: 'Focus mode',
    }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('taskflow:recovery')).toBe('preserved recovery')
  expect(localStorage.getItem('taskflow:v1')).toBe(primary)
})

test('lets a failed page return to Dashboard without clearing storage', async () => {
  const user = userEvent.setup()
  render(<App />)
  focusShouldThrow = true
  await user.click(screen.getByRole('button', { name: 'Focus mode' }))

  const storedState = localStorage.getItem('taskflow:v1')
  await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }))

  expect(
    within(screen.getByRole('main')).getByRole('heading', {
      name: /Good (morning|afternoon|evening)\./,
      level: 2,
    }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('taskflow:v1')).toBe(storedState)
})

test('does not carry a captured error into another protected page', async () => {
  const user = userEvent.setup()
  render(<App />)
  focusShouldThrow = true
  await user.click(screen.getByRole('button', { name: 'Focus mode' }))
  expect(screen.getByRole('alert')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Kanban board' }))

  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Kanban board', level: 1 }),
  ).toBeInTheDocument()
})

test('contains failures outside page boundaries at application level', () => {
  providerShouldThrow = true
  render(<App />)

  expect(screen.getByRole('alert')).toHaveTextContent(
    'TaskFlow hit an unexpected problem',
  )
  expect(
    screen.queryByRole('button', { name: 'Back to Dashboard' }),
  ).not.toBeInTheDocument()
})
