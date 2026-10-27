import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, BrainCircuit, Play, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { localDateKey } from '../utils/dates'
import { hydratePlan, suggestPlan } from '../utils/planner'
import { makeId } from '../utils/tasks'

export default function DailyPlannerPage({ onStartFocus }) {
  const state = useTaskFlow()
  const [date, setDate] = useState(localDateKey())
  const [available, setAvailable] = useState(180)
  const [items, setItems] = useState([])
  const [addId, setAddId] = useState('')
  const [message, setMessage] = useState('')
  const saved = state.dailyPlans.find((plan) => plan.date === date)

  useEffect(() => {
    setAvailable(saved?.availableMinutes || 180)
    setItems(saved?.items || [])
    setMessage(saved ? 'Saved plan loaded.' : '')
  }, [date, saved?.id])

  const plannedBefore = state.dailyPlans.flatMap((plan) => plan.items.map((item) => item.taskId))
  const total = items.reduce((sum, item) => sum + Number(item.allocatedMinutes), 0)
  const remaining = available - total
  const history = useMemo(() => state.dailyPlans.slice().sort((a, b) => b.date.localeCompare(a.date)), [state.dailyPlans])
  const display = items.map((item) => ({ ...item, task: state.tasks.find((task) => task.id === item.taskId) }))
  const valid = items.length > 0 && items.every((item) => Number.isFinite(Number(item.allocatedMinutes)) && Number(item.allocatedMinutes) > 0)

  const generate = () => { const result = suggestPlan(state.tasks, { date, availableMinutes: available, alreadyPlannedIds: plannedBefore }); setItems(result.items); setMessage(`Suggested ${result.items.length} tasks using explainable priority rules.`) }
  const move = (index, direction) => setItems((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next })
  const add = () => { const task = state.tasks.find((entry) => entry.id === addId); if (task && !items.some((item) => item.taskId === task.id)) { setItems([...items, { id: makeId(), taskId: task.id, allocatedMinutes: task.estimatedMinutes || 30, reasons: ['Added manually'], score: 0 }]); setAddId('') } }
  const save = () => { if (!valid) return setMessage('Every task needs a positive time allocation.'); state.saveDailyPlan({ id: saved?.id, date, availableMinutes: available, items, createdAt: saved?.createdAt || new Date().toISOString() }); setMessage(remaining < 0 ? 'Plan saved with an over-budget warning.' : 'Daily plan saved.') }
  const focus = (taskId) => { save(); onStartFocus(taskId) }

  return <div className="planner-layout"><section className="planner-main"><div className="planner-hero"><BrainCircuit/><div><p className="eyebrow">Smart daily planning</p><h2>Build a realistic day</h2><p>TaskFlow ranks urgency and importance, then fits the best work into your available time.</p></div></div><div className="planner-settings"><label>Planning date<input type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)}/></label><label>Available focus time<div><input type="number" min="15" step="15" value={available} onChange={(event) => setAvailable(Math.max(15, Number(event.target.value) || 15))}/><span>minutes</span></div></label><button className="primary-button" onClick={generate}><BrainCircuit/> Plan my day</button><button className="secondary-button" onClick={generate}><RotateCcw/> Regenerate</button></div><div className="plan-summary"><div><strong>{total}</strong><span>planned minutes</span></div><div className={remaining < 0 ? 'over-budget' : ''}><strong>{remaining}</strong><span>minutes remaining</span></div><div><strong>{items.length}</strong><span>tasks selected</span></div></div>{message && <p className="status-message" role="status">{message}</p>}<div className="suggested-list">{display.length ? display.map((item, index) => <motion.article layout className="planned-task" key={item.id}><span className="plan-order">{index + 1}</span><div><h3>{item.task?.title || 'Unavailable task'}</h3><p>{item.reasons.join(' · ')}</p></div><label><input aria-label={`Minutes for ${item.task?.title || 'task'}`} type="number" min="5" step="5" value={item.allocatedMinutes} onChange={(event) => setItems(items.map((entry) => entry.id === item.id ? { ...entry, allocatedMinutes: Math.max(5, Number(event.target.value) || 5) } : entry))}/><span>min</span></label><div className="plan-actions"><button className="icon-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.task?.title} up`}><ArrowUp/></button><button className="icon-button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${item.task?.title} down`}><ArrowDown/></button><button className="icon-button" onClick={() => focus(item.taskId)} disabled={!item.task} aria-label={`Focus on ${item.task?.title}`}><Play/></button><button className="icon-button danger" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${item.task?.title}`}><Trash2/></button></div></motion.article>) : <div className="empty-state"><span><BrainCircuit/></span><h3>Your day is open</h3><p>Set your available time and let TaskFlow suggest a focused, achievable plan.</p></div>}</div><div className="planner-add"><select value={addId} onChange={(event) => setAddId(event.target.value)} aria-label="Add another task"><option value="">Choose another task</option>{state.tasks.filter((task) => !task.completed && !items.some((item) => item.taskId === task.id)).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><button className="secondary-button" onClick={add} disabled={!addId}><Plus/> Add task</button><button className="primary-button" onClick={save} disabled={!valid}><Save/> Save plan</button></div></section><aside className="planner-history"><h2>Previous plans</h2>{history.length ? history.map((plan) => <article key={plan.id}><header><button className="text-button" onClick={() => setDate(plan.date)}><strong>{plan.date}</strong></button><span>{plan.items.reduce((sum, item) => sum + item.allocatedMinutes, 0)} min</span><button className="icon-button danger" onClick={() => state.deleteDailyPlan(plan.id)} aria-label={`Delete plan for ${plan.date}`}><Trash2/></button></header>{hydratePlan(plan, state.tasks, state.focusSessions).map((item) => <div key={item.id}><span>{item.title}</span><small>{item.allocatedMinutes}m planned · {item.actualMinutes}m focused</small></div>)}</article>) : <p className="muted-copy">Saved plans will appear here.</p>}</aside></div>
}
