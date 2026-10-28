import { Plus } from 'lucide-react'

export default function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          <Plus /> {action}
        </button>
      )}
    </div>
  )
}
