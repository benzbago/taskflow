import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  Dumbbell,
  Flame,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTaskFlow } from '../context/TaskFlowContext'
import {
  addDays,
  buildMonthGrid,
  formatDate,
  localDateKey,
} from '../utils/dates'
import { habitStats, isHabitScheduled } from '../utils/habits'

const ICONS = { sparkles: Sparkles, book: BookOpen, exercise: Dumbbell }
const DAYS = [
  ['S', 0],
  ['M', 1],
  ['T', 2],
  ['W', 3],
  ['T', 4],
  ['F', 5],
  ['S', 6],
]

function HabitForm({ habit, onClose }) {
  const state = useTaskFlow()
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const [form, setForm] = useState(
    habit || {
      title: '',
      description: '',
      categoryId: 'personal',
      icon: 'sparkles',
      color: '#6366f1',
      schedule: { type: 'daily', days: [1, 2, 3, 4, 5], target: 3 },
      archived: false,
      completionDates: [],
    },
  )
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  const save = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Give your habit a name.')
      return
    }
    habit
      ? state.updateHabit({ ...form, title: form.title.trim() })
      : state.addHabit({ ...form, title: form.title.trim() })
    onClose()
  }
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') return onClose()
      if (
        event.key !== 'Tab' ||
        !dialogRef.current?.contains(document.activeElement)
      )
        return
      const items = [
        ...dialogRef.current.querySelectorAll('button,input,select,textarea'),
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
    addEventListener('keydown', handleKey)
    return () => removeEventListener('keydown', handleKey)
  }, [onClose])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="task-panel habit-panel"
        role="dialog"
        aria-modal="true"
        aria-label={habit ? 'Edit habit' : 'New habit'}
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">Build consistency</p>
            <h2>{habit ? 'Edit habit' : 'New habit'}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close habit form"
          >
            <X />
          </button>
        </div>
        <form className="task-form" onSubmit={save}>
          <label>
            Habit name
            <input
              autoFocus
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value)
                setError('')
              }}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'habit-title-error' : undefined}
              placeholder="e.g. Practice React"
            />
          </label>
          {error && (
            <p id="habit-title-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            Notes
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows="3"
            />
          </label>
          <div className="form-grid">
            <label>
              Category
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
              >
                {state.categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Icon
              <select
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
              >
                <option value="sparkles">Sparkles</option>
                <option value="book">Book</option>
                <option value="exercise">Exercise</option>
              </select>
            </label>
            <label>
              Color
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </label>
            <label>
              Schedule
              <select
                value={form.schedule.type}
                onChange={(e) =>
                  set('schedule', { ...form.schedule, type: e.target.value })
                }
              >
                <option value="daily">Every day</option>
                <option value="weekdays">Selected weekdays</option>
                <option value="weekly">Times per week</option>
              </select>
            </label>
          </div>
          {form.schedule.type === 'weekdays' && (
            <fieldset className="weekday-picker">
              <legend>Active days</legend>
              {DAYS.map(([label, day]) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={form.schedule.days.includes(day)}
                    onChange={() =>
                      set('schedule', {
                        ...form.schedule,
                        days: form.schedule.days.includes(day)
                          ? form.schedule.days.filter((d) => d !== day)
                          : [...form.schedule.days, day],
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          )}
          {form.schedule.type === 'weekly' && (
            <label>
              Times per week
              <input
                type="number"
                min="1"
                max="7"
                value={form.schedule.target}
                onChange={(e) =>
                  set('schedule', {
                    ...form.schedule,
                    target: Number(e.target.value),
                  })
                }
              />
            </label>
          )}
          <div className="panel-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button">Save habit</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function HabitsPage() {
  const state = useTaskFlow()
  const [selected, setSelectedValue] = useState(localDateKey())
  const setSelected = (value) => {
    if (value) setSelectedValue(value)
  }
  const [editing, setEditing] = useState(null)
  const returnFocus = useRef(null)
  const openEditor = (habit = {}) => {
    returnFocus.current = document.activeElement
    setEditing(habit)
  }
  const closeEditor = () => {
    setEditing(null)
    queueMicrotask(() => {
      if (returnFocus.current?.isConnected) returnFocus.current.focus()
      returnFocus.current = null
    })
  }
  const week = Array.from({ length: 7 }, (_, i) => addDays(selected, i - 3))
  const month = buildMonthGrid(
    new Date(`${selected}T12:00:00`).getFullYear(),
    new Date(`${selected}T12:00:00`).getMonth(),
  )
  const due = state.habits.filter(
    (h) => !h.archived && isHabitScheduled(h, selected),
  )
  const done = due.filter((h) => h.completionDates.includes(selected)).length
  const overall = due.length ? Math.round((done / due.length) * 100) : 0
  return (
    <>
      <section className="habit-hero">
        <div>
          <p className="eyebrow">
            {formatDate(selected, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h2>
            {done} of {due.length} habits complete
          </h2>
          <p>Consistency is built one deliberate check-in at a time.</p>
        </div>
        <div
          className="progress-ring"
          style={{ '--progress': `${overall * 3.6}deg` }}
        >
          <span>
            {overall}%<small>today</small>
          </span>
        </div>
      </section>
      <div className="habit-toolbar">
        <label>
          Review date
          <input
            type="date"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
        </label>
        <button className="primary-button" onClick={() => openEditor()}>
          <Plus /> New habit
        </button>
      </div>
      {due.length ? (
        <div className="habit-list">
          {due.map((habit) => {
            const Icon = ICONS[habit.icon] || Sparkles
            const stats = habitStats(habit, selected)
            const complete = habit.completionDates.includes(selected)
            return (
              <motion.article layout className="habit-card" key={habit.id}>
                <button
                  className={`habit-check ${complete ? 'complete' : ''}`}
                  onClick={() => state.toggleHabit(habit.id, selected)}
                  aria-label={`${complete ? 'Undo' : 'Complete'} ${habit.title} for ${selected}`}
                >
                  {complete ? <Check /> : <Icon />}
                </button>
                <div>
                  <h3>{habit.title}</h3>
                  <p>
                    {habit.schedule.type === 'daily'
                      ? 'Every day'
                      : habit.schedule.type === 'weekly'
                        ? `${habit.schedule.target} times per week`
                        : 'Selected weekdays'}
                  </p>
                  <div className="habit-stats">
                    <span>
                      <Flame /> {stats.currentStreak} current
                    </span>
                    <span>{stats.longestStreak} longest</span>
                    <span>{stats.consistency}% consistency</span>
                  </div>
                </div>
                <div className="habit-actions">
                  <button
                    className="icon-button"
                    onClick={() => openEditor(habit)}
                    aria-label={`Edit ${habit.title}`}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      confirm(`Delete ${habit.title}?`) &&
                      state.deleteHabit(habit.id)
                    }
                    aria-label={`Delete ${habit.title}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span>
            <Sparkles />
          </span>
          <h3>No habits scheduled</h3>
          <p>
            Try “Practice React,” “Exercise,” or “Read a book,” or review
            another date.
          </p>
          <button className="primary-button" onClick={() => openEditor()}>
            <Plus /> Create a habit
          </button>
        </div>
      )}
      <div className="habit-insights">
        <article className="chart-card">
          <h3>Weekly check-in</h3>
          <div className="week-grid">
            {week.map((date) => (
              <div key={date}>
                <strong>{formatDate(date, { weekday: 'short' })}</strong>
                <span>{date.slice(-2)}</span>
                <div>
                  {state.habits
                    .filter((h) => isHabitScheduled(h, date))
                    .map((h) => (
                      <i
                        key={h.id}
                        title={h.title}
                        style={{
                          background: h.completionDates.includes(date)
                            ? h.color
                            : 'var(--border)',
                        }}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="chart-card">
          <h3>Monthly consistency</h3>
          <div className="habit-heatmap">
            {month.map((day) => {
              const total = state.habits.filter((h) =>
                isHabitScheduled(h, day.key),
              )
              const count = total.filter((h) =>
                h.completionDates.includes(day.key),
              ).length
              return (
                <span
                  key={day.key}
                  title={`${day.key}: ${count}/${total.length}`}
                  className={!day.inMonth ? 'muted' : ''}
                  style={{ '--heat': total.length ? count / total.length : 0 }}
                >
                  {day.day}
                </span>
              )
            })}
          </div>
        </article>
      </div>
      {editing && (
        <HabitForm habit={editing.id ? editing : null} onClose={closeEditor} />
      )}
    </>
  )
}
