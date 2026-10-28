import { Archive, Check, Palette, Settings2, X } from 'lucide-react'
import { useTaskFlow } from '../../context/TaskFlowContext'
import { localDateKey } from '../../utils/dates'
import { NAV } from './navigationConfig'

export default function Sidebar({ page, setPage, open, setOpen }) {
  const { tasks } = useTaskFlow()
  const today = localDateKey()
  const counts = {
    all: tasks.filter((t) => !t.completed).length,
    today: tasks.filter((t) => t.dueDate === today && !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  }
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">
          <Check />
        </span>
        <strong>TaskFlow</strong>
        <button
          className="icon-button close-nav"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
      </div>
      <nav aria-label="Primary navigation">
        <p className="nav-label">Main</p>
        {NAV.slice(0, 5).map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => {
              setPage(id)
              setOpen(false)
            }}
          >
            <Icon /> <span>{label}</span>
            {counts[id] ? <em>{counts[id]}</em> : null}
          </button>
        ))}
        <p className="nav-label">Productivity</p>
        {NAV.slice(5, 9).map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => {
              setPage(id)
              setOpen(false)
            }}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
        <p className="nav-label">Organize</p>
        {NAV.slice(9, 11).map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => {
              setPage(id)
              setOpen(false)
            }}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
        <p className="nav-label">Insights</p>
        {NAV.slice(11).map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => {
              setPage(id)
              setOpen(false)
            }}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={`nav-item ${page === 'appearance' ? 'active' : ''}`}
          onClick={() => {
            setPage('appearance')
            setOpen(false)
          }}
        >
          <Palette /> Appearance
        </button>
        <button
          className={`nav-item ${page === 'data' ? 'active' : ''}`}
          onClick={() => {
            setPage('data')
            setOpen(false)
          }}
        >
          <Settings2 /> Data management
        </button>
        <div className="storage-note">
          <Archive /> Stored privately in this browser
        </div>
      </div>
    </aside>
  )
}
