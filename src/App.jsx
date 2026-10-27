import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import {
  Archive, BarChart3, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CirclePlus, Clock3, Copy, Download, Edit3, Inbox, LayoutDashboard, Menu, Moon,
  MoreHorizontal, Palette, Pin, Plus, RotateCcw, Search, Settings2, Sun, Tags,
  Target, Trash2, Upload, X,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext'
import { CATEGORY_ICONS, EMPTY_FILTERS } from './data/defaults'
import { analyticsData, filterTasks, makeId, sortTasks, taskMetrics } from './utils/tasks'
import { buildMonthGrid, formatDate, greeting, isOverdue, localDateKey } from './utils/dates'
import { parseImport, serializeState } from './utils/storage'
import FocusPage from './pages/FocusPage'

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['all', 'All tasks', Inbox], ['today', 'Today', Clock3],
  ['upcoming', 'Upcoming', CalendarDays], ['completed', 'Completed', CheckCircle2],
  ['focus', 'Focus mode', Target], ['calendar', 'Calendar', CalendarDays], ['categories', 'Categories', Tags], ['analytics', 'Analytics', BarChart3],
]

const PAGE_TITLES = { dashboard: 'Dashboard', all: 'All tasks', today: 'Today', upcoming: 'Upcoming', completed: 'Completed', focus: 'Focus mode', calendar: 'Calendar', categories: 'Categories', analytics: 'Productivity', appearance: 'Appearance', data: 'Data management' }

function useTheme(settings, setSettings) {
  useEffect(() => {
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    const resolved = settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme
    document.documentElement.dataset.theme = resolved
  }, [settings.theme])
  return () => setSettings({ theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' })
}

function Sidebar({ page, setPage, open, setOpen }) {
  const { tasks } = useTaskFlow()
  const today = localDateKey()
  const counts = { all: tasks.filter((t) => !t.completed).length, today: tasks.filter((t) => t.dueDate === today && !t.completed).length, completed: tasks.filter((t) => t.completed).length }
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="brand"><span className="brand-mark"><Check /></span><strong>TaskFlow</strong><button className="icon-button close-nav" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
    <nav aria-label="Primary navigation">
      <p className="nav-label">Main</p>
      {NAV.slice(0, 5).map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setOpen(false) }}><Icon /> <span>{label}</span>{counts[id] ? <em>{counts[id]}</em> : null}</button>)}
      <p className="nav-label">Productivity</p>
      {NAV.slice(5, 6).map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setOpen(false) }}><Icon /> <span>{label}</span></button>)}
      <p className="nav-label">Organize</p>
      {NAV.slice(6, 8).map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setOpen(false) }}><Icon /> <span>{label}</span></button>)}
      <p className="nav-label">Insights</p>
      {NAV.slice(8).map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setOpen(false) }}><Icon /> <span>{label}</span></button>)}
    </nav>
    <div className="sidebar-bottom"><button className={`nav-item ${page === 'appearance' ? 'active' : ''}`} onClick={() => { setPage('appearance'); setOpen(false) }}><Palette /> Appearance</button><button className={`nav-item ${page === 'data' ? 'active' : ''}`} onClick={() => { setPage('data'); setOpen(false) }}><Settings2 /> Data management</button><div className="storage-note"><Archive /> Stored privately in this browser</div></div>
  </aside>
}

function Topbar({ page, setNavOpen, onNew, toggleTheme }) {
  const { settings } = useTaskFlow()
  return <header className="topbar"><button className="icon-button menu-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu /></button><div><p className="eyebrow">Personal workspace</p><h1>{PAGE_TITLES[page]}</h1></div><div className="top-actions"><span className="shortcut">Press <kbd>N</kbd> to add</span><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{settings.theme === 'dark' ? <Sun /> : <Moon />}</button><button className="primary-button" onClick={() => onNew()}><Plus /> New task</button></div></header>
}

function TaskForm({ task, initialDate, onClose }) {
  const { categories, addTask, updateTask } = useTaskFlow()
  const [form, setForm] = useState(() => task || { title: '', description: '', dueDate: initialDate || '', dueTime: '', priority: 'medium', categoryId: 'personal', recurrence: 'none', pinned: false, subtasks: [] })
  const [subtask, setSubtask] = useState('')
  const [error, setError] = useState('')
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return setError('Give your task a clear title.')
    const clean = { ...form, title: form.title.trim(), description: form.description.trim() }
    task ? updateTask(clean) : addTask(clean)
    onClose()
  }
  const addSubtask = () => { if (subtask.trim()) { set('subtasks', [...(form.subtasks || []), { id: makeId(), title: subtask.trim(), completed: false }]); setSubtask('') } }
  useEffect(() => { const close = (event) => event.key === 'Escape' && onClose(); addEventListener('keydown', close); return () => removeEventListener('keydown', close) }, [onClose])
  const trapFocus = (event) => { if (event.key !== 'Tab') return; const items = [...event.currentTarget.querySelectorAll('button,input,select,textarea')].filter((item) => !item.disabled); const first = items[0]; const last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() } }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><motion.section role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'New task'} className="task-panel" onKeyDown={trapFocus} initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 36 }}>
    <div className="panel-header"><div><p className="eyebrow">{task ? 'Make changes' : 'Capture what matters'}</p><h2>{task ? 'Edit task' : 'New task'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close task form"><X /></button></div>
    <form onSubmit={submit} className="task-form"><label>Task title<input autoFocus value={form.title} onChange={(e) => { set('title', e.target.value); setError('') }} placeholder="What needs to be done?" /></label>{error && <p className="form-error" role="alert">{error}</p>}
      <label>Notes<textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add useful context…" rows="4" /></label>
      <div className="form-grid"><label>Due date<input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></label><label>Due time<input type="time" value={form.dueTime} onChange={(e) => set('dueTime', e.target.value)} /></label><label>Priority<select value={form.priority} onChange={(e) => set('priority', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Category<select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Repeat<select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label><label className="check-label"><input type="checkbox" checked={form.pinned} onChange={(e) => set('pinned', e.target.checked)} /> Pin this task</label></div>
      <div className="subtask-builder"><span>Subtasks</span><div><input value={subtask} onChange={(e) => setSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }} placeholder="Add a smaller step" /><button type="button" className="secondary-button" onClick={addSubtask}>Add</button></div>{form.subtasks?.map((item) => <p key={item.id}><Check /> {item.title}<button type="button" aria-label={`Remove subtask ${item.title}`} onClick={() => set('subtasks', form.subtasks.filter((entry) => entry.id !== item.id))}><X /></button></p>)}</div>
      <div className="panel-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{task ? 'Save changes' : 'Create task'}</button></div>
    </form>
  </motion.section></div>
}

function TaskCard({ task, onEdit }) {
  const { categories, toggleTask, toggleSubtask, duplicateTask, deleteTask, updateTask } = useTaskFlow()
  const [menu, setMenu] = useState(false)
  const category = categories.find((item) => item.id === task.categoryId) || categories.at(-1)
  return <motion.article layout className={`task-card ${task.completed ? 'is-complete' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <button className="task-check" role="checkbox" aria-checked={task.completed} aria-label={`${task.completed ? 'Mark incomplete' : 'Complete'} ${task.title}`} onClick={() => toggleTask(task.id)}>{task.completed && <Check />}</button>
    <div className="task-body"><div className="task-title-line"><h3>{task.title}</h3>{task.pinned && <Pin className="pin-icon" aria-label="Pinned" />}</div>{task.description && <p className="task-description">{task.description}</p>}<div className="task-meta">{task.dueDate && <span className={isOverdue(task) ? 'overdue' : ''}><CalendarDays /> {formatDate(task.dueDate)}{task.dueTime ? ` · ${task.dueTime}` : ''}</span>}<span className={`priority ${task.priority}`}>{task.priority}</span>{category && <span className="category-chip" style={{ '--category': category.color }}><i />{category.name}</span>}{task.recurrence !== 'none' && <span><RotateCcw /> {task.recurrence}</span>}</div>
      {task.subtasks?.length > 0 && <div className="subtasks">{task.subtasks.map((item) => <label key={item.id}><input type="checkbox" checked={item.completed} onChange={() => toggleSubtask(task.id, item.id)} /><span>{item.title}</span></label>)}</div>}
    </div>
    <div className="task-menu"><button className="icon-button" onClick={() => setMenu(!menu)} aria-label={`Actions for ${task.title}`}><MoreHorizontal /></button>{menu && <div className="menu-popover"><button onClick={() => { onEdit(task); setMenu(false) }}><Edit3 /> Edit</button><button onClick={() => { updateTask({ ...task, pinned: !task.pinned }); setMenu(false) }}><Pin /> {task.pinned ? 'Unpin' : 'Pin'}</button><button onClick={() => { duplicateTask(task.id); setMenu(false) }}><Copy /> Duplicate</button><button className="danger" onClick={() => { if (confirm(`Delete “${task.title}”?`)) deleteTask(task.id); setMenu(false) }}><Trash2 /> Delete</button></div>}</div>
  </motion.article>
}

function EmptyState({ title = 'A clear list, a clear mind', message = 'Create your first task and give today a little direction.', onNew }) {
  return <div className="empty-state"><span><CheckCircle2 /></span><h3>{title}</h3><p>{message}</p>{onNew && <button className="primary-button" onClick={() => onNew()}><Plus /> Create a task</button>}</div>
}

function TaskList({ tasks, onEdit, onNew, emptyTitle, emptyMessage }) {
  if (!tasks.length) return <EmptyState title={emptyTitle} message={emptyMessage} onNew={onNew} />
  return <div className="task-list"><AnimatePresence>{tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} />)}</AnimatePresence></div>
}

function Filters({ filters, setFilters, sort, setSort, categories }) {
  return <div className="filter-bar"><label className="search-field"><Search /><input type="search" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} placeholder="Search tasks" aria-label="Search tasks" /></label><select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="all">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option></select><select aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select aria-label="Filter by category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="all">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><select aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value)}><option value="dueDate">Due date</option><option value="priority">Priority</option><option value="createdAt">Newest</option><option value="status">Status</option></select></div>
}

function Dashboard({ onNew, onEdit, filters, setFilters, sort, setSort }) {
  const { tasks, categories, settings } = useTaskFlow(); const today = localDateKey(); const metrics = taskMetrics(tasks, today)
  const todays = sortTasks(filterTasks(tasks.filter((task) => task.dueDate === today), filters), sort)
  const upcoming = sortTasks(tasks.filter((task) => !task.completed && task.dueDate > today), 'dueDate').slice(0, 4)
  const motivation = metrics.progress === 100 ? 'Beautiful work — today is complete.' : metrics.progress >= 50 ? 'You’re building great momentum.' : metrics.total ? 'Small steps make meaningful progress.' : 'Start with one thing that matters.'
  return <><section className="hero"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p><h2>{greeting()}{settings.name ? `, ${settings.name}` : ''}.</h2><p>{motivation}</p></div><div className="progress-ring" style={{ '--progress': `${metrics.progress * 3.6}deg` }}><span>{metrics.progress}%<small>today</small></span></div></section>
    <div className="metric-grid">{[['Total tasks', metrics.total, Inbox], ['Completed today', metrics.completedToday, CheckCircle2], ['Pending', metrics.pending, Clock3], ['Overdue', metrics.overdue, CalendarDays]].map(([label, value, Icon]) => <article className="metric-card" key={label}><span><Icon /></span><div><p>{label}</p><strong>{value}</strong></div></article>)}</div>
    <Filters filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} categories={categories} />
    <SectionHeader title="Today’s tasks" subtitle={todays.length ? `${todays.filter((t) => t.completed).length} of ${todays.length} complete` : 'Make space for what matters'} action="Add task" onAction={() => onNew(today)} /><TaskList tasks={todays} onEdit={onEdit} onNew={() => onNew(today)} />
    {upcoming.length > 0 && <><SectionHeader title="Coming up" subtitle="A look at what’s ahead" /><TaskList tasks={upcoming} onEdit={onEdit} onNew={onNew} /></>}
  </>
}

function SectionHeader({ title, subtitle, action, onAction }) { return <div className="section-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="text-button" onClick={onAction}><Plus /> {action}</button>}</div> }

function ListPage({ page, onNew, onEdit, filters, setFilters, sort, setSort }) {
  const { tasks, categories } = useTaskFlow(); const today = localDateKey()
  const scoped = tasks.filter((task) => page === 'today' ? task.dueDate === today : page === 'upcoming' ? task.dueDate > today && !task.completed : page === 'completed' ? task.completed : true)
  const visible = sortTasks(filterTasks(scoped, filters), sort)
  return <><div className="page-intro"><p>{page === 'today' ? 'Keep today intentional.' : page === 'upcoming' ? 'See what is around the corner.' : page === 'completed' ? 'A record of your progress.' : 'Everything in one calm place.'}</p></div><Filters filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} categories={categories} /><TaskList tasks={visible} onEdit={onEdit} onNew={onNew} emptyTitle={filters.query ? 'No matching tasks' : undefined} emptyMessage={filters.query ? 'Try a different search or clear a filter.' : undefined} /></>
}

function CalendarPage({ onNew, onEdit }) {
  const { tasks } = useTaskFlow(); const [cursor, setCursor] = useState(new Date()); const [selected, setSelected] = useState(localDateKey())
  const grid = buildMonthGrid(cursor.getFullYear(), cursor.getMonth()); const selectedTasks = sortTasks(tasks.filter((task) => task.dueDate === selected), 'priority')
  return <div className="calendar-layout"><section className="calendar-card"><div className="calendar-heading"><button className="icon-button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft /></button><h2>{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><button className="icon-button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight /></button></div><div className="calendar-grid weekdays">{'SMTWTFS'.split('').map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid">{grid.map((day) => { const due = tasks.filter((task) => task.dueDate === day.key); return <button key={day.key} className={`${day.inMonth ? '' : 'muted'} ${selected === day.key ? 'selected' : ''} ${day.key === localDateKey() ? 'today' : ''}`} onClick={() => setSelected(day.key)}><span>{day.day}</span>{due.length > 0 && <i className={due.some((task) => isOverdue(task)) ? 'late' : ''}>{due.length}</i>}</button> })}</div></section><aside className="day-agenda"><SectionHeader title={formatDate(selected, { weekday: 'long', month: 'long', day: 'numeric' })} subtitle={`${selectedTasks.length} scheduled`} action="Add" onAction={() => onNew(selected)} /><TaskList tasks={selectedTasks} onEdit={onEdit} onNew={() => onNew(selected)} emptyTitle="Nothing scheduled" emptyMessage="This day is open for something meaningful." /></aside></div>
}

function CategoriesPage() {
  const { categories, tasks, addCategory, updateCategory, deleteCategory } = useTaskFlow(); const [name, setName] = useState(''); const colors = ['#4938d7', '#e02676', '#0ea5e9', '#22c55e', '#f59e0b', '#7c3aed']
  return <><div className="inline-create"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" aria-label="New category name" /><button className="primary-button" onClick={() => { if (name.trim()) { addCategory({ name: name.trim(), color: colors[categories.length % colors.length], icon: 'other' }); setName('') } }}><Plus /> Add category</button></div><div className="category-grid">{categories.map((category) => { const Icon = CATEGORY_ICONS[category.icon] || Tags; return <article className="category-card" key={category.id}><span className="category-icon" style={{ background: `${category.color}18`, color: category.color }}><Icon /></span><div><input aria-label={`Category name ${category.name}`} value={category.name} onChange={(e) => updateCategory({ ...category, name: e.target.value })} /><p>{tasks.filter((task) => task.categoryId === category.id).length} tasks</p></div>{!category.locked && <button className="icon-button danger" onClick={() => confirm(`Delete ${category.name}? Its tasks will move to Other.`) && deleteCategory(category.id)} aria-label={`Delete ${category.name}`}><Trash2 /></button>}</article> })}</div></>
}

function AnalyticsPage() {
  const { tasks, categories } = useTaskFlow(); const series = analyticsData(tasks); const completed = tasks.filter((task) => task.completed).length; const completion = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const categoryData = categories.map((category) => ({ name: category.name, value: tasks.filter((task) => task.categoryId === category.id && task.completed).length, color: category.color })).filter((item) => item.value)
  return <><div className="metric-grid analytics-metrics"><article className="metric-card"><div><p>Overall completion</p><strong>{completion}%</strong></div></article><article className="metric-card"><div><p>Completed</p><strong>{completed}</strong></div></article><article className="metric-card"><div><p>Still in motion</p><strong>{tasks.length - completed}</strong></div></article></div><div className="chart-grid"><article className="chart-card"><SectionHeader title="Daily activity" subtitle="Tasks completed over the last 7 days" />{tasks.length ? <ResponsiveContainer width="100%" height={280}><AreaChart data={series}><defs><linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#indigoFill)" strokeWidth={3} /></AreaChart></ResponsiveContainer> : <EmptyState title="Your insights will grow here" message="Complete a few tasks to see your weekly rhythm." />}</article><article className="chart-card"><SectionHeader title="By category" subtitle="Where your completed work lives" />{categoryData.length ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>{categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyState title="No category data yet" message="Completed tasks will reveal your focus areas." />}</article></div></>
}

function AppearancePage() {
  const { settings, setSettings } = useTaskFlow()
  return <div className="settings-card"><SectionHeader title="Your space, your way" subtitle="Preferences are saved in this browser." /><label>Your name<input value={settings.name} onChange={(e) => setSettings({ name: e.target.value })} placeholder="How should TaskFlow greet you?" /></label><fieldset><legend>Color theme</legend><div className="theme-options">{['light', 'dark', 'system'].map((theme) => <button key={theme} className={settings.theme === theme ? 'selected' : ''} onClick={() => setSettings({ theme })}><span className={`theme-preview ${theme}`}><i/><i/><i/></span><Check /> {theme}</button>)}</div></fieldset><label className="toggle-row"><span><strong>Compact task cards</strong><small>Show more tasks at once.</small></span><input type="checkbox" checked={settings.compact} onChange={(e) => setSettings({ compact: e.target.checked })} /></label></div>
}

function DataPage() {
  const state = useTaskFlow(); const fileRef = useRef(); const [message, setMessage] = useState('')
  const download = () => { const blob = new Blob([serializeState(state)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `taskflow-backup-${localDateKey()}.json`; link.click(); URL.revokeObjectURL(url); setMessage('Backup downloaded.') }
  const upload = async (event) => { try { const next = parseImport(await event.target.files[0].text()); if (confirm('Replace this workspace with the imported backup?')) { state.importState(next); setMessage('Backup restored successfully.') } } catch (error) { setMessage(error.message) } event.target.value = '' }
  return <div className="settings-card"><SectionHeader title="Keep your data portable" subtitle="TaskFlow data stays on this device unless you export it." /><div className="data-actions"><article><span><Download /></span><div><h3>Export a backup</h3><p>Download tasks, categories, and preferences as JSON.</p></div><button className="secondary-button" onClick={download}>Export</button></article><article><span><Upload /></span><div><h3>Restore a backup</h3><p>Import a previously exported TaskFlow JSON file.</p></div><button className="secondary-button" onClick={() => fileRef.current.click()}>Import</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={upload} /></article><article className="danger-zone"><span><Trash2 /></span><div><h3>Clear this workspace</h3><p>Permanently remove tasks and reset preferences.</p></div><button className="danger-button" onClick={() => confirm('Clear all TaskFlow data? This cannot be undone.') && state.reset()}>Clear data</button></article></div>{message && <p className="status-message" role="status">{message}</p>}<div className="privacy-note"><Archive /><div><strong>Browser-only storage</strong><p>Your data does not automatically sync between devices or browsers. Export regular backups if it matters to you.</p></div></div></div>
}

function AppShell() {
  const state = useTaskFlow(); const [page, setPage] = useState('dashboard'); const [navOpen, setNavOpen] = useState(false); const [editor, setEditor] = useState(null); const [initialDate, setInitialDate] = useState(''); const [filters, setFilters] = useState(EMPTY_FILTERS); const [sort, setSort] = useState('dueDate'); const toggleTheme = useTheme(state.settings, state.setSettings)
  const openNew = (date = localDateKey()) => { setInitialDate(typeof date === 'string' ? date : localDateKey()); setEditor({}) }; const openEdit = (task) => setEditor(task)
  useEffect(() => { const handler = (event) => { if (event.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); openNew() } }; addEventListener('keydown', handler); return () => removeEventListener('keydown', handler) }, [])
  const returnFocus = useRef(null)
  useEffect(() => { if (editor) returnFocus.current = document.activeElement; else returnFocus.current?.focus?.() }, [editor])
  const content = useMemo(() => {
    if (page === 'dashboard') return <Dashboard onNew={openNew} onEdit={openEdit} filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />
    if (['all', 'today', 'upcoming', 'completed'].includes(page)) return <ListPage page={page} onNew={openNew} onEdit={openEdit} filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />
    if (page === 'focus') return <FocusPage />
    if (page === 'calendar') return <CalendarPage onNew={openNew} onEdit={openEdit} />
    if (page === 'categories') return <CategoriesPage />
    if (page === 'analytics') return <AnalyticsPage />
    if (page === 'appearance') return <AppearancePage />
    return <DataPage />
  }, [page, state.tasks, state.categories, state.settings, filters, sort])
  return <div className={`app ${state.settings.compact ? 'compact' : ''}`}><Sidebar page={page} setPage={setPage} open={navOpen} setOpen={setNavOpen} />{navOpen && <button className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation overlay" />}<div className="main-shell"><Topbar page={page} setNavOpen={setNavOpen} onNew={openNew} toggleTheme={toggleTheme} />{state.persistenceError && <div className="warning-banner" role="alert">Changes could not be saved. Export a backup and free browser storage.</div>}{state.settings.recoveryAvailable && <div className="warning-banner" role="status">Stored data was invalid. A recovery copy was preserved in this browser.</div>}<main className="content">{content}</main></div><nav className="mobile-nav" aria-label="Mobile navigation">{NAV.slice(0, 4).map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon /><span>{label === 'All tasks' ? 'Tasks' : label}</span></button>)}<button onClick={() => openNew()} className="mobile-add" aria-label="Quick add"><Plus /></button></nav><AnimatePresence>{editor && <TaskForm task={editor.id ? editor : null} initialDate={initialDate} onClose={() => setEditor(null)} />}</AnimatePresence></div>
}

export default function App() { return <MotionConfig reducedMotion="user"><TaskFlowProvider><AppShell /></TaskFlowProvider></MotionConfig> }
