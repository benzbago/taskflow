import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

let shouldThrow

function UnstableChild() {
  if (shouldThrow) throw new Error('Sensitive render detail')
  return <p>Recovered content</p>
}

function FalsyFailure() {
  throw null
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => vi.unstubAllEnvs())

  test('renders a friendly fallback with development diagnostics', () => {
    render(
      <ErrorBoundary scope="Focus Mode" showDetails>
        <UnstableChild />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Focus Mode hit an unexpected problem',
    )
    expect(screen.getByText('Sensitive render detail')).toBeInTheDocument()
    expect(screen.getByText(/UnstableChild/)).toBeInTheDocument()
  })

  test('remounts only the failed subtree when Try Again is pressed', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <span>Unaffected shell</span>
        <ErrorBoundary scope="this page">
          <UnstableChild />
        </ErrorBoundary>
      </div>,
    )

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.getByText('Unaffected shell')).toBeInTheDocument()
  })

  test('contains repeated failures without automatically retrying', async () => {
    const user = userEvent.setup()
    render(
      <ErrorBoundary scope="this page">
        <UnstableChild />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try Again' }),
    ).toBeInTheDocument()
  })

  test('contains falsy thrown values', () => {
    render(
      <ErrorBoundary scope="TaskFlow">
        <FalsyFailure />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'TaskFlow hit an unexpected problem',
    )
  })

  test('hides technical diagnostics in the production fallback', () => {
    vi.stubEnv('DEV', false)
    render(
      <ErrorBoundary scope="TaskFlow" showDetails>
        <UnstableChild />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'Sensitive render detail',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('UnstableChild')
  })

  test('offers optional dashboard recovery and preserves stored data', async () => {
    const user = userEvent.setup()
    const onBackToDashboard = vi.fn()
    const primary = '{"tasks":[{"id":"kept"}]}'
    const recovery = '{"tasks":[{"id":"recovery"}]}'
    localStorage.setItem('taskflow:v1', primary)
    localStorage.setItem('taskflow:recovery', recovery)

    render(
      <ErrorBoundary scope="this page" onBackToDashboard={onBackToDashboard}>
        <UnstableChild />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Try Again' }))
    await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }))

    expect(onBackToDashboard).toHaveBeenCalledOnce()
    expect(localStorage.getItem('taskflow:v1')).toBe(primary)
    expect(localStorage.getItem('taskflow:recovery')).toBe(recovery)
  })
})
