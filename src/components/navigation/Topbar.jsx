import { Menu, Moon, Plus, Sun } from 'lucide-react'
import { useTaskFlow } from '../../context/TaskFlowContext'
import { PAGE_TITLES } from './navigationConfig'

export default function Topbar({ page, setNavOpen, onNew, toggleTheme }) {
  const { settings } = useTaskFlow()
  return (
    <header className="topbar">
      <button
        className="icon-button menu-button"
        onClick={() => setNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div>
        <p className="eyebrow">Personal workspace</p>
        <h1>{PAGE_TITLES[page]}</h1>
      </div>
      <div className="top-actions">
        <span className="shortcut">
          Press <kbd>N</kbd> to add
        </span>
        <button
          className="icon-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun /> : <Moon />}
        </button>
        <button className="primary-button" onClick={() => onNew()}>
          <Plus /> New task
        </button>
      </div>
    </header>
  )
}
