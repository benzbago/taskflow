import { useState } from 'react'
import { motion } from 'motion/react'
import {
  CalendarDays,
  Check,
  Copy,
  Edit3,
  MoreHorizontal,
  Pin,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useTaskFlow } from '../../context/TaskFlowContext'
import { formatDate, isOverdue } from '../../utils/dates'

export default function TaskCard({ task, onEdit }) {
  const {
    categories,
    toggleTask,
    toggleSubtask,
    duplicateTask,
    deleteTask,
    updateTask,
  } = useTaskFlow()
  const [menu, setMenu] = useState(false)
  const category =
    categories.find((item) => item.id === task.categoryId) || categories.at(-1)
  return (
    <motion.article
      layout
      className={`task-card ${task.completed ? 'is-complete' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        className="task-check"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`${task.completed ? 'Mark incomplete' : 'Complete'} ${task.title}`}
        onClick={() => toggleTask(task.id)}
      >
        {task.completed && <Check />}
      </button>
      <div className="task-body">
        <div className="task-title-line">
          <h3>{task.title}</h3>
          {task.pinned && <Pin className="pin-icon" aria-label="Pinned" />}
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className="task-meta">
          {task.dueDate && (
            <span className={isOverdue(task) ? 'overdue' : ''}>
              <CalendarDays /> {formatDate(task.dueDate)}
              {task.dueTime ? ` · ${task.dueTime}` : ''}
            </span>
          )}
          <span className={`priority ${task.priority}`}>{task.priority}</span>
          {category && (
            <span
              className="category-chip"
              style={{ '--category': category.color }}
            >
              <i />
              {category.name}
            </span>
          )}
          {task.recurrence !== 'none' && (
            <span>
              <RotateCcw /> {task.recurrence}
            </span>
          )}
        </div>
        {task.subtasks?.length > 0 && (
          <div className="subtasks">
            {task.subtasks.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleSubtask(task.id, item.id)}
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="task-menu">
        <button
          className="icon-button"
          onClick={() => setMenu(!menu)}
          aria-label={`Actions for ${task.title}`}
        >
          <MoreHorizontal />
        </button>
        {menu && (
          <div className="menu-popover">
            <button
              onClick={() => {
                onEdit(task)
                setMenu(false)
              }}
            >
              <Edit3 /> Edit
            </button>
            <button
              onClick={() => {
                updateTask({ ...task, pinned: !task.pinned })
                setMenu(false)
              }}
            >
              <Pin /> {task.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => {
                duplicateTask(task.id)
                setMenu(false)
              }}
            >
              <Copy /> Duplicate
            </button>
            <button
              className="danger"
              onClick={() => {
                if (confirm(`Delete “${task.title}”?`)) deleteTask(task.id)
                setMenu(false)
              }}
            >
              <Trash2 /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.article>
  )
}
