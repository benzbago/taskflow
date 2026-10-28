import { MotionConfig } from 'motion/react'
import AppShell from './components/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import { TaskFlowProvider } from './context/TaskFlowContext'

export default function App() {
  return (
    <ErrorBoundary scope="TaskFlow">
      <MotionConfig reducedMotion="user">
        <TaskFlowProvider>
          <AppShell />
        </TaskFlowProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
