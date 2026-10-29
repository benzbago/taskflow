import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import { useTaskFlow } from '../../context/TaskFlowContext'
import { makeId } from '../../utils/tasks'

export default function TaskForm({ task, initialDate, onClose }) {
  const { categories, addTask, updateTask } = useTaskFlow()
  const [form, setForm] = useState(
    () =>
      task || {
        title: '',
        description: '',
        dueDate: initialDate || '',
        dueTime: '',
        priority: 'medium',
        categoryId: 'personal',
        recurrence: 'none',
        estimatedMinutes: null,
        pinned: false,
        subtasks: [],
      },
  )
  const [subtask, setSubtask] = useState('')
  const [error, setError] = useState('')
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return setError('Give your task a clear title.')
    const clean = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    }
    task ? updateTask(clean) : addTask(clean)
    onClose()
  }
  const addSubtask = () => {
    if (subtask.trim()) {
      set('subtasks', [
        ...(form.subtasks || []),
        { id: makeId(), title: subtask.trim(), completed: false },
      ])
      setSubtask('')
    }
  }
  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose()
    addEventListener('keydown', close)
    return () => removeEventListener('keydown', close)
  }, [onClose])
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return
    const items = [
      ...event.currentTarget.querySelectorAll('button,input,select,textarea'),
    ].filter((item) => !item.disabled)
    const first = items[0]
    const last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={task ? 'Edit task' : 'New task'}
        className="task-panel"
        onKeyDown={trapFocus}
        initial={{ opacity: 0, x: 36 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 36 }}
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              {task ? 'Make changes' : 'Capture what matters'}
            </p>
            <h2>{task ? 'Edit task' : 'New task'}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close task form"
          >
            <X />
          </button>
        </div>
        <form onSubmit={submit} className="task-form">
          <label>
            Task title
            <input
              autoFocus
              value={form.title}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'task-title-error' : undefined}
              onChange={(e) => {
                set('title', e.target.value)
                setError('')
              }}
              placeholder="What needs to be done?"
            />
          </label>
          {error && (
            <p id="task-title-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            Notes
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add useful context…"
              rows="4"
            />
          </label>
          <div className="form-grid">
            <label>
              Due date
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </label>
            <label>
              Due time
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => set('dueTime', e.target.value)}
              />
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estimated minutes
              <input
                type="number"
                min="5"
                step="5"
                list="estimate-options"
                value={form.estimatedMinutes || ''}
                onChange={(e) =>
                  set(
                    'estimatedMinutes',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="30"
              />
              <datalist id="estimate-options">
                {[15, 30, 45, 60, 90].map((value) => (
                  <option value={value} key={value} />
                ))}
              </datalist>
            </label>
            <label>
              Repeat
              <select
                value={form.recurrence}
                onChange={(e) => set('recurrence', e.target.value)}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => set('pinned', e.target.checked)}
              />{' '}
              Pin this task
            </label>
          </div>
          <div className="subtask-builder">
            <span>Subtasks</span>
            <div>
              <input
                value={subtask}
                onChange={(e) => setSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubtask()
                  }
                }}
                placeholder="Add a smaller step"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={addSubtask}
              >
                Add
              </button>
            </div>
            {form.subtasks?.map((item) => (
              <p key={item.id}>
                <Check /> {item.title}
                <button
                  type="button"
                  aria-label={`Remove subtask ${item.title}`}
                  onClick={() =>
                    set(
                      'subtasks',
                      form.subtasks.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  <X />
                </button>
              </p>
            ))}
          </div>
          <div className="panel-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit">
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  )
}
