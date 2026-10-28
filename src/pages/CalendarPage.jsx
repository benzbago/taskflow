import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { sortTasks } from '../utils/tasks'
import {
  buildMonthGrid,
  formatDate,
  isOverdue,
  localDateKey,
} from '../utils/dates'
import SectionHeader from '../components/common/SectionHeader'
import TaskList from '../components/tasks/TaskList'

export default function CalendarPage({ onNew, onEdit }) {
  const { tasks } = useTaskFlow()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(localDateKey())
  const grid = buildMonthGrid(cursor.getFullYear(), cursor.getMonth())
  const selectedTasks = sortTasks(
    tasks.filter((task) => task.dueDate === selected),
    'priority',
  )
  return (
    <div className="calendar-layout">
      <section className="calendar-card">
        <div className="calendar-heading">
          <button
            className="icon-button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <h2>
            {cursor.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <button
            className="icon-button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>
        <div className="calendar-grid weekdays">
          {'SMTWTFS'.split('').map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {grid.map((day) => {
            const due = tasks.filter((task) => task.dueDate === day.key)
            return (
              <button
                key={day.key}
                className={`${day.inMonth ? '' : 'muted'} ${selected === day.key ? 'selected' : ''} ${day.key === localDateKey() ? 'today' : ''}`}
                onClick={() => setSelected(day.key)}
              >
                <span>{day.day}</span>
                {due.length > 0 && (
                  <i
                    className={
                      due.some((task) => isOverdue(task)) ? 'late' : ''
                    }
                  >
                    {due.length}
                  </i>
                )}
              </button>
            )
          })}
        </div>
      </section>
      <aside className="day-agenda">
        <SectionHeader
          title={formatDate(selected, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
          subtitle={`${selectedTasks.length} scheduled`}
          action="Add"
          onAction={() => onNew(selected)}
        />
        <TaskList
          tasks={selectedTasks}
          onEdit={onEdit}
          onNew={() => onNew(selected)}
          emptyTitle="Nothing scheduled"
          emptyMessage="This day is open for something meaningful."
        />
      </aside>
    </div>
  )
}
