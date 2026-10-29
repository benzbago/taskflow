import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { EMPTY_FILTERS } from '../data/defaults'
import { localDateKey } from '../utils/dates'
import ErrorBoundary from './ErrorBoundary'
import MobileNavigation from './navigation/MobileNavigation'
import Sidebar from './navigation/Sidebar'
import Topbar from './navigation/Topbar'
import TaskForm from './tasks/TaskForm'
import AnalyticsPage from '../pages/AnalyticsPage'
import AppearancePage from '../pages/AppearancePage'
import CalendarPage from '../pages/CalendarPage'
import CategoriesPage from '../pages/CategoriesPage'
import DailyPlannerPage from '../pages/DailyPlannerPage'
import DashboardPage from '../pages/DashboardPage'
import DataPage from '../pages/DataPage'
import FocusPage from '../pages/FocusPage'
import HabitsPage from '../pages/HabitsPage'
import KanbanPage from '../pages/KanbanPage'
import TaskListPage from '../pages/TaskListPage'

function useTheme(settings, setSettings) {
  useEffect(() => {
    const prefersDark =
      globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    const resolved =
      settings.theme === 'system'
        ? prefersDark
          ? 'dark'
          : 'light'
        : settings.theme
    document.documentElement.dataset.theme = resolved
  }, [settings.theme])
  return () =>
    setSettings({
      theme:
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark',
    })
}

export default function AppShell() {
  const state = useTaskFlow()
  const [page, setPage] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const [editor, setEditor] = useState(null)
  const [initialDate, setInitialDate] = useState('')
  const [focusTaskId, setFocusTaskId] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('dueDate')
  const toggleTheme = useTheme(state.settings, state.setSettings)
  const openNew = (date = localDateKey()) => {
    setInitialDate(typeof date === 'string' ? date : localDateKey())
    setEditor({})
  }
  const openEdit = (task) => setEditor(task)
  useEffect(() => {
    const handler = (event) => {
      if (
        event.key.toLowerCase() === 'n' &&
        !document.querySelector('[role="dialog"]') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          document.activeElement?.tagName,
        )
      ) {
        event.preventDefault()
        openNew()
      }
    }
    addEventListener('keydown', handler)
    return () => removeEventListener('keydown', handler)
  }, [])
  const returnFocus = useRef(null)
  useEffect(() => {
    if (editor) returnFocus.current = document.activeElement
    else returnFocus.current?.focus?.()
  }, [editor])
  const content = useMemo(() => {
    if (page === 'dashboard')
      return (
        <DashboardPage
          onNew={openNew}
          onEdit={openEdit}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
        />
      )
    if (['all', 'today', 'upcoming', 'completed'].includes(page))
      return (
        <TaskListPage
          page={page}
          onNew={openNew}
          onEdit={openEdit}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
        />
      )
    const pageBoundary = (scope, child) => (
      <ErrorBoundary
        key={scope}
        scope={scope}
        onBackToDashboard={() => setPage('dashboard')}
      >
        {child}
      </ErrorBoundary>
    )
    if (page === 'focus')
      return pageBoundary(
        'Focus Mode',
        <FocusPage initialTaskId={focusTaskId} />,
      )
    if (page === 'planner')
      return pageBoundary(
        'Daily Planner',
        <DailyPlannerPage
          onStartFocus={(taskId) => {
            setFocusTaskId(taskId)
            setPage('focus')
          }}
        />,
      )
    if (page === 'kanban')
      return pageBoundary('Kanban', <KanbanPage onEdit={openEdit} />)
    if (page === 'habits') return pageBoundary('Habit Tracker', <HabitsPage />)
    if (page === 'calendar')
      return <CalendarPage onNew={openNew} onEdit={openEdit} />
    if (page === 'categories') return <CategoriesPage />
    if (page === 'analytics') return <AnalyticsPage />
    if (page === 'appearance') return <AppearancePage />
    return <DataPage />
  }, [page, filters, sort, focusTaskId])
  return (
    <div className={`app ${state.settings.compact ? 'compact' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        open={navOpen}
        setOpen={setNavOpen}
      />
      {navOpen && (
        <button
          className="nav-scrim"
          onClick={() => setNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
      <div className="main-shell">
        <Topbar
          page={page}
          setNavOpen={setNavOpen}
          onNew={openNew}
          toggleTheme={toggleTheme}
        />
        {state.persistenceError && (
          <div className="warning-banner" role="alert">
            Changes could not be saved. Export a backup and free browser
            storage.
          </div>
        )}
        {state.settings.recoveryAvailable && (
          <div className="warning-banner" role="status">
            Stored data was invalid. A recovery copy was preserved in this
            browser.
          </div>
        )}
        <main className="content">{content}</main>
      </div>
      <MobileNavigation page={page} setPage={setPage} onNew={openNew} />
      <AnimatePresence>
        {editor && (
          <TaskForm
            task={editor.id ? editor : null}
            initialDate={initialDate}
            onClose={() => setEditor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
