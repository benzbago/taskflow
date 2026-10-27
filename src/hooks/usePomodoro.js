import { useEffect, useMemo, useState } from 'react'
import { completeExpiredSession, pauseFocusSession, remainingMs, resumeFocusSession } from '../utils/focus'
import { useTaskFlow } from '../context/TaskFlowContext'

export function usePomodoro() {
  const { activeFocusSession, focusSessions, updateActiveFocus, completeFocus } = useTaskFlow()
  const [now, setNow] = useState(Date.now())
  const [completionNotice, setCompletionNotice] = useState('')
  useEffect(() => { if (!activeFocusSession || activeFocusSession.status !== 'running') return; const tick = () => setNow(Date.now()); tick(); const id = setInterval(tick, 500); return () => clearInterval(id) }, [activeFocusSession])
  useEffect(() => { const result = completeExpiredSession(activeFocusSession, focusSessions, now); if (result.completed) { completeFocus(result.completed); setCompletionNotice(result.completed.type === 'focus' ? 'Focus session complete. Take a well-earned break.' : 'Break complete. Ready for the next focus session?') } }, [now, activeFocusSession, focusSessions, completeFocus])
  const remaining = useMemo(() => remainingMs(activeFocusSession, now), [activeFocusSession, now])
  return { active: activeFocusSession, remaining, completionNotice, clearNotice: () => setCompletionNotice(''), pause: () => updateActiveFocus(pauseFocusSession(activeFocusSession)), resume: () => updateActiveFocus(resumeFocusSession(activeFocusSession)), finish: () => { const result = completeExpiredSession(activeFocusSession, focusSessions, Date.now(), true); if (result.completed) completeFocus(result.completed) } }
}

