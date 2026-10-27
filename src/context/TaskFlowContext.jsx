import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { createInitialState, loadState, saveState } from '../utils/storage'
import { createRecurringTask, makeId, removeCategoryFromTasks } from '../utils/tasks'

const TaskFlowContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK': return { ...state, tasks: [{ ...action.task, id: makeId(), createdAt: new Date().toISOString(), completed: false, completedAt: null }, ...state.tasks] }
    case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map((task) => task.id === action.task.id ? { ...task, ...action.task } : task) }
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) }
    case 'DUPLICATE_TASK': {
      const source = state.tasks.find((task) => task.id === action.id)
      return source ? { ...state, tasks: [{ ...source, id: makeId(), title: `${source.title} copy`, completed: false, completedAt: null, createdAt: new Date().toISOString() }, ...state.tasks] } : state
    }
    case 'TOGGLE_TASK': {
      let recurring = null
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id) return task
        const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
        recurring = createRecurringTask(updated)
        return updated
      })
      return { ...state, tasks: recurring ? [recurring, ...tasks] : tasks }
    }
    case 'TOGGLE_SUBTASK': return { ...state, tasks: state.tasks.map((task) => task.id === action.taskId ? { ...task, subtasks: (task.subtasks || []).map((item) => item.id === action.subtaskId ? { ...item, completed: !item.completed } : item) } : task) }
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, { ...action.category, id: makeId(), locked: false }] }
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map((category) => category.id === action.category.id ? { ...category, ...action.category } : category) }
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter((category) => category.id !== action.id), tasks: removeCategoryFromTasks(state.tasks, action.id) }
    case 'SET_SETTINGS': return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'IMPORT': return action.state
    case 'RESET': return createInitialState()
    default: return state
  }
}

export function TaskFlowProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState())
  useEffect(() => saveState(state), [state])
  const api = useMemo(() => ({
    ...state,
    addTask: (task) => dispatch({ type: 'ADD_TASK', task }),
    updateTask: (task) => dispatch({ type: 'UPDATE_TASK', task }),
    deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
    duplicateTask: (id) => dispatch({ type: 'DUPLICATE_TASK', id }),
    toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', id }),
    toggleSubtask: (taskId, subtaskId) => dispatch({ type: 'TOGGLE_SUBTASK', taskId, subtaskId }),
    addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', category }),
    updateCategory: (category) => dispatch({ type: 'UPDATE_CATEGORY', category }),
    deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', id }),
    setSettings: (settings) => dispatch({ type: 'SET_SETTINGS', settings }),
    importState: (nextState) => dispatch({ type: 'IMPORT', state: nextState }),
    reset: () => dispatch({ type: 'RESET' }),
  }), [state])
  return <TaskFlowContext.Provider value={api}>{children}</TaskFlowContext.Provider>
}

export function useTaskFlow() {
  const value = useContext(TaskFlowContext)
  if (!value) throw new Error('useTaskFlow must be used inside TaskFlowProvider')
  return value
}
