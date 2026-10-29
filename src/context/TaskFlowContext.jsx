import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { createInitialState, loadState, saveState } from '../utils/storage'
import {
  createRecurringTask,
  makeId,
  removeCategoryFromTasks,
} from '../utils/tasks'
import { completeExpiredSession } from '../utils/focus'
import { toggleHabitDate } from '../utils/habits'

const TaskFlowContext = createContext(null)

export function taskFlowReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          {
            ...action.task,
            id: makeId(),
            createdAt: new Date().toISOString(),
            status: 'todo',
            completed: false,
            completedAt: null,
          },
          ...state.tasks,
        ],
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.task.id ? { ...task, ...action.task } : task,
        ),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
      }
    case 'DUPLICATE_TASK': {
      const source = state.tasks.find((task) => task.id === action.id)
      return source
        ? {
            ...state,
            tasks: [
              {
                ...source,
                id: makeId(),
                title: `${source.title} copy`,
                status: 'todo',
                completed: false,
                completedAt: null,
                createdAt: new Date().toISOString(),
              },
              ...state.tasks,
            ],
          }
        : state
    }
    case 'TOGGLE_TASK':
    case 'SET_TASK_STATUS': {
      let recurring = null
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id) return task
        const nextStatus =
          action.type === 'SET_TASK_STATUS'
            ? action.status
            : task.completed
              ? task.status === 'in-progress'
                ? 'in-progress'
                : 'todo'
              : 'done'
        const completing = nextStatus === 'done'
        const updated = {
          ...task,
          status: nextStatus,
          completed: completing,
          completedAt: completing
            ? task.completedAt || new Date().toISOString()
            : null,
        }
        recurring = createRecurringTask(updated)
        return updated
      })
      const alreadyGenerated =
        recurring &&
        tasks.some(
          (task) =>
            task.recurrenceSourceId === action.id &&
            task.dueDate === recurring.dueDate,
        )
      return {
        ...state,
        tasks: recurring && !alreadyGenerated ? [recurring, ...tasks] : tasks,
      }
    }
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                subtasks: (task.subtasks || []).map((item) =>
                  item.id === action.subtaskId
                    ? { ...item, completed: !item.completed }
                    : item,
                ),
              }
            : task,
        ),
      }
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [
          ...state.categories,
          { ...action.category, id: makeId(), locked: false },
        ],
      }
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.category.id
            ? { ...category, ...action.category }
            : category,
        ),
      }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.id,
        ),
        tasks: removeCategoryFromTasks(state.tasks, action.id),
      }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'START_FOCUS':
      return { ...state, activeFocusSession: action.session }
    case 'UPDATE_ACTIVE_FOCUS':
      return { ...state, activeFocusSession: action.session }
    case 'CLEAR_ACTIVE_FOCUS':
      return { ...state, activeFocusSession: null }
    case 'COMPLETE_FOCUS':
      return state.focusSessions.some(
        (session) => session.id === action.session.id,
      )
        ? { ...state, activeFocusSession: null }
        : {
            ...state,
            activeFocusSession: null,
            focusSessions: [...state.focusSessions, action.session],
          }
    case 'ADD_HABIT':
      return {
        ...state,
        habits: [
          {
            ...action.habit,
            id: makeId(),
            createdAt: new Date().toISOString(),
            completionDates: [],
          },
          ...state.habits,
        ],
      }
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.habit.id ? action.habit : habit,
        ),
      }
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.id),
      }
    case 'TOGGLE_HABIT':
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id ? toggleHabitDate(habit, action.date) : habit,
        ),
      }
    case 'SAVE_DAILY_PLAN': {
      const availableMinutes = Number(action.plan.availableMinutes)
      const items = action.plan.items.map((item) => ({
        ...item,
        allocatedMinutes: Number(item.allocatedMinutes),
      }))
      if (
        !Number.isFinite(availableMinutes) ||
        availableMinutes <= 0 ||
        items.some(
          (item) =>
            !Number.isFinite(item.allocatedMinutes) ||
            item.allocatedMinutes <= 0,
        )
      )
        return state
      return {
        ...state,
        dailyPlans: [
          {
            ...action.plan,
            availableMinutes,
            items,
            id: action.plan.id || makeId(),
          },
          ...state.dailyPlans.filter((plan) => plan.date !== action.plan.date),
        ],
      }
    }
    case 'DELETE_DAILY_PLAN':
      return {
        ...state,
        dailyPlans: state.dailyPlans.filter((plan) => plan.id !== action.id),
      }
    case 'IMPORT':
      return action.state
    case 'RESET':
      return createInitialState()
    default:
      return state
  }
}

export function TaskFlowProvider({ children }) {
  const [state, dispatch] = useReducer(taskFlowReducer, undefined, () =>
    loadState(),
  )
  const [persistenceError, setPersistenceError] = useState(false)
  useEffect(() => setPersistenceError(!saveState(state)), [state])
  useEffect(() => {
    const recover = () => {
      const result = completeExpiredSession(
        state.activeFocusSession,
        state.focusSessions,
      )
      if (result.completed)
        dispatch({ type: 'COMPLETE_FOCUS', session: result.completed })
      else if (!result.active && state.activeFocusSession)
        dispatch({ type: 'CLEAR_ACTIVE_FOCUS' })
    }
    recover()
    if (
      !state.activeFocusSession ||
      state.activeFocusSession.status !== 'running'
    )
      return undefined
    const id = setInterval(recover, 1000)
    return () => clearInterval(id)
  }, [state.activeFocusSession, state.focusSessions])
  const api = useMemo(
    () => ({
      ...state,
      persistenceError,
      addTask: (task) => dispatch({ type: 'ADD_TASK', task }),
      updateTask: (task) => dispatch({ type: 'UPDATE_TASK', task }),
      deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
      duplicateTask: (id) => dispatch({ type: 'DUPLICATE_TASK', id }),
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', id }),
      setTaskStatus: (id, status) =>
        dispatch({ type: 'SET_TASK_STATUS', id, status }),
      toggleSubtask: (taskId, subtaskId) =>
        dispatch({ type: 'TOGGLE_SUBTASK', taskId, subtaskId }),
      addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', category }),
      updateCategory: (category) =>
        dispatch({ type: 'UPDATE_CATEGORY', category }),
      deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', id }),
      setSettings: (settings) => dispatch({ type: 'SET_SETTINGS', settings }),
      startFocus: (session) => dispatch({ type: 'START_FOCUS', session }),
      updateActiveFocus: (session) =>
        dispatch({ type: 'UPDATE_ACTIVE_FOCUS', session }),
      clearActiveFocus: () => dispatch({ type: 'CLEAR_ACTIVE_FOCUS' }),
      completeFocus: (session) => dispatch({ type: 'COMPLETE_FOCUS', session }),
      addHabit: (habit) => dispatch({ type: 'ADD_HABIT', habit }),
      updateHabit: (habit) => dispatch({ type: 'UPDATE_HABIT', habit }),
      deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
      toggleHabit: (id, date) => dispatch({ type: 'TOGGLE_HABIT', id, date }),
      saveDailyPlan: (plan) => dispatch({ type: 'SAVE_DAILY_PLAN', plan }),
      deleteDailyPlan: (id) => dispatch({ type: 'DELETE_DAILY_PLAN', id }),
      importState: (nextState) =>
        dispatch({ type: 'IMPORT', state: nextState }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state, persistenceError],
  )
  return (
    <TaskFlowContext.Provider value={api}>{children}</TaskFlowContext.Provider>
  )
}

export function useTaskFlow() {
  const value = useContext(TaskFlowContext)
  if (!value)
    throw new Error('useTaskFlow must be used inside TaskFlowProvider')
  return value
}
