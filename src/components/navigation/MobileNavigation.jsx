import { Plus } from 'lucide-react'
import { NAV } from './navigationConfig'

export default function MobileNavigation({ page, setPage, onNew }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {NAV.slice(0, 4).map(([id, label, Icon]) => (
        <button
          key={id}
          className={page === id ? 'active' : ''}
          onClick={() => setPage(id)}
        >
          <Icon />
          <span>{label === 'All tasks' ? 'Tasks' : label}</span>
        </button>
      ))}
      <button
        onClick={() => onNew()}
        className="mobile-add"
        aria-label="Quick add"
      >
        <Plus />
      </button>
    </nav>
  )
}
