import { AnimatePresence } from 'motion/react'
import EmptyState from '../common/EmptyState'
import TaskCard from './TaskCard'

export default function TaskList({
  tasks,
  onEdit,
  onNew,
  emptyTitle,
  emptyMessage,
}) {
  if (!tasks.length)
    return (
      <EmptyState title={emptyTitle} message={emptyMessage} onNew={onNew} />
    )
  return (
    <div className="task-list">
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </AnimatePresence>
    </div>
  )
}
