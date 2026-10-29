import { Component, Fragment } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null, retryKey: 0 }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(_error, errorInfo) {
    this.setState({ errorInfo })
  }

  retry = () => {
    this.setState(({ retryKey }) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryKey: retryKey + 1,
    }))
  }

  render() {
    const { children, scope = 'TaskFlow', onBackToDashboard } = this.props
    const { hasError, error, errorInfo, retryKey } = this.state

    if (!hasError) return <Fragment key={retryKey}>{children}</Fragment>

    return (
      <section className="empty-state error-fallback" role="alert">
        <span aria-hidden="true">
          <AlertTriangle />
        </span>
        <h2>{scope} hit an unexpected problem</h2>
        <p>
          Your saved TaskFlow data is still safe. Try this section again
          {onBackToDashboard
            ? ', or return to the dashboard and continue elsewhere.'
            : '.'}
        </p>
        <div className="error-fallback-actions">
          <button className="primary-button" onClick={this.retry}>
            Try Again
          </button>
          {onBackToDashboard && (
            <button className="secondary-button" onClick={onBackToDashboard}>
              Back to Dashboard
            </button>
          )}
        </div>
        {import.meta.env.DEV && (
          <details className="error-details">
            <summary>Development error details</summary>
            <pre>{error instanceof Error ? error.message : String(error)}</pre>
            {errorInfo?.componentStack && <pre>{errorInfo.componentStack}</pre>}
          </details>
        )}
      </section>
    )
  }
}
