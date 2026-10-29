import { useTaskFlow } from '../context/TaskFlowContext'
import { filterTasks, sortTasks } from '../utils/tasks'
import { localDateKey } from '../utils/dates'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskList from '../components/tasks/TaskList'

export default function TaskListPage({
  page,
  onNew,
  onEdit,
  filters,
  setFilters,
  sort,
  setSort,
}) {
  const { tasks, categories } = useTaskFlow()
  const today = localDateKey()
  const scoped = tasks.filter((task) =>
    page === 'today'
      ? task.dueDate === today
      : page === 'upcoming'
        ? task.dueDate > today && !task.completed
        : page === 'completed'
          ? task.completed
          : true,
  )
  const visible = sortTasks(filterTasks(scoped, filters), sort)
  return (
    <>
      <div className="page-intro">
        <p>
          {page === 'today'
            ? 'Keep today intentional.'
            : page === 'upcoming'
              ? 'See what is around the corner.'
              : page === 'completed'
                ? 'A record of your progress.'
                : 'Everything in one calm place.'}
        </p>
      </div>
      <TaskFilters
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        categories={categories}
      />
      <TaskList
        tasks={visible}
        onEdit={onEdit}
        onNew={onNew}
        emptyTitle={filters.query ? 'No matching tasks' : undefined}
        emptyMessage={
          filters.query
            ? 'Try a different search or clear a filter.'
            : undefined
        }
      />
    </>
  )
}
