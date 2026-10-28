import { CheckCircle2, Plus } from 'lucide-react'

export default function EmptyState({
  title = 'A clear list, a clear mind',
  message = 'Create your first task and give today a little direction.',
  onNew,
}) {
  return (
    <div className="empty-state">
      <span>
        <CheckCircle2 />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onNew && (
        <button className="primary-button" onClick={() => onNew()}>
          <Plus /> Create a task
        </button>
      )}
    </div>
  )
}
