import { CalendarDays, CheckCircle2, Clock3, Inbox } from 'lucide-react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { filterTasks, sortTasks, taskMetrics } from '../utils/tasks'
import { greeting, localDateKey } from '../utils/dates'
import SectionHeader from '../components/common/SectionHeader'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskList from '../components/tasks/TaskList'

export default function DashboardPage({
  onNew,
  onEdit,
  filters,
  setFilters,
  sort,
  setSort,
}) {
  const { tasks, categories, settings } = useTaskFlow()
  const today = localDateKey()
  const metrics = taskMetrics(tasks, today)
  const todays = sortTasks(
    filterTasks(
      tasks.filter((task) => task.dueDate === today),
      filters,
    ),
    sort,
  )
  const upcoming = sortTasks(
    tasks.filter((task) => !task.completed && task.dueDate > today),
    'dueDate',
  ).slice(0, 4)
  const motivation =
    metrics.progress === 100
      ? 'Beautiful work — today is complete.'
      : metrics.progress >= 50
        ? 'You’re building great momentum.'
        : metrics.total
          ? 'Small steps make meaningful progress.'
          : 'Start with one thing that matters.'
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h2>
            {greeting()}
            {settings.name ? `, ${settings.name}` : ''}.
          </h2>
          <p>{motivation}</p>
        </div>
        <div
          className="progress-ring"
          style={{ '--progress': `${metrics.progress * 3.6}deg` }}
        >
          <span>
            {metrics.progress}%<small>today</small>
          </span>
        </div>
      </section>
      <div className="metric-grid">
        {[
          ['Total tasks', metrics.total, Inbox],
          ['Completed today', metrics.completedToday, CheckCircle2],
          ['Pending', metrics.pending, Clock3],
          ['Overdue', metrics.overdue, CalendarDays],
        ].map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <span>
              <Icon />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </div>
      <TaskFilters
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        categories={categories}
      />
      <SectionHeader
        title="Today’s tasks"
        subtitle={
          todays.length
            ? `${todays.filter((t) => t.completed).length} of ${todays.length} complete`
            : 'Make space for what matters'
        }
        action="Add task"
        onAction={() => onNew(today)}
      />
      <TaskList tasks={todays} onEdit={onEdit} onNew={() => onNew(today)} />
      {upcoming.length > 0 && (
        <>
          <SectionHeader title="Coming up" subtitle="A look at what’s ahead" />
          <TaskList tasks={upcoming} onEdit={onEdit} onNew={onNew} />
        </>
      )}
    </>
  )
}
