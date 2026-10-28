import { useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GripVertical,
  ListTodo,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTaskFlow } from '../context/TaskFlowContext'
import {
  filterKanbanTasks,
  KANBAN_STATUSES,
  nextKanbanStatus,
} from '../utils/kanban'
import { formatDate, isOverdue } from '../utils/dates'

const LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' }

export default function KanbanPage({ onEdit }) {
  const state = useTaskFlow()
  const [filters, setFilters] = useState({ category: 'all', priority: 'all' })
  const [dragId, setDragId] = useState(null)
  const [mobileColumn, setMobileColumn] = useState('todo')
  const tasks = filterKanbanTasks(state.tasks, filters)
  const move = (id, status) => state.setTaskStatus(id, status)
  return (
    <>
      <div className="board-toolbar">
        <div>
          <p>
            Move work from intention to done. List checkboxes and board status
            always stay synchronized.
          </p>
        </div>
        <select
          aria-label="Kanban category"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="all">All categories</option>
          {state.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Kanban priority"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="kanban-mobile-tabs" role="tablist">
        {KANBAN_STATUSES.map((status) => (
          <button
            role="tab"
            aria-selected={mobileColumn === status}
            key={status}
            onClick={() => setMobileColumn(status)}
          >
            {LABELS[status]}
          </button>
        ))}
      </div>
      <div className="kanban-board">
        {KANBAN_STATUSES.map((status) => {
          const column = tasks
            .filter((task) => task.status === status)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          return (
            <section
              key={status}
              className={`kanban-column ${mobileColumn === status ? 'mobile-active' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && move(dragId, status)}
            >
              <header>
                <div>
                  <span className={`status-dot ${status}`} />
                  <h2>{LABELS[status]}</h2>
                </div>
                <em>{column.length}</em>
              </header>
              <div className="kanban-stack">
                {column.length ? (
                  column.map((task) => {
                    const category = state.categories.find(
                      (item) => item.id === task.categoryId,
                    )
                    const subtaskDone =
                      task.subtasks?.filter((item) => item.completed).length ||
                      0
                    return (
                      <motion.article
                        layout
                        draggable
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => setDragId(null)}
                        className="kanban-card"
                        key={task.id}
                      >
                        <div className="kanban-card-top">
                          <GripVertical aria-hidden="true" />
                          <h3>{task.title}</h3>
                          <button
                            className="icon-button"
                            onClick={() => onEdit(task)}
                            aria-label={`Edit ${task.title}`}
                          >
                            <Edit3 />
                          </button>
                        </div>
                        <div className="task-meta">
                          <span className={`priority ${task.priority}`}>
                            {task.priority || 'medium'}
                          </span>
                          {category && (
                            <span
                              className="category-chip"
                              style={{ '--category': category.color }}
                            >
                              <i />
                              {category.name}
                            </span>
                          )}
                        </div>
                        {task.dueDate && (
                          <p className={isOverdue(task) ? 'overdue' : ''}>
                            <CalendarDays /> {formatDate(task.dueDate)}
                          </p>
                        )}
                        {task.subtasks?.length > 0 && (
                          <div className="subtask-progress">
                            <span
                              style={{
                                width: `${(subtaskDone / task.subtasks.length) * 100}%`,
                              }}
                            />
                            <small>
                              {subtaskDone}/{task.subtasks.length} subtasks
                            </small>
                          </div>
                        )}
                        <div className="kanban-moves">
                          {status !== 'todo' && (
                            <button
                              onClick={() =>
                                move(task.id, nextKanbanStatus(status, -1))
                              }
                            >
                              <ChevronLeft /> Move to{' '}
                              {LABELS[nextKanbanStatus(status, -1)]}
                            </button>
                          )}
                          {status !== 'done' && (
                            <button
                              onClick={() =>
                                move(task.id, nextKanbanStatus(status, 1))
                              }
                            >
                              Move to {LABELS[nextKanbanStatus(status, 1)]}
                              <ChevronRight />
                            </button>
                          )}
                        </div>
                      </motion.article>
                    )
                  })
                ) : (
                  <div className="kanban-empty">
                    <ListTodo />
                    <p>No tasks here</p>
                    <small>Drag a task here or use its move controls.</small>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
